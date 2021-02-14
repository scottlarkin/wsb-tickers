import axios from 'axios';
import getTickers from './get_tickers';
import { Worker } from 'worker_threads';
import server from './server';
import mongoose from 'mongoose';
import cron from './cron';
import { saveTickerCount, getTickerCounts } from './db/ticker_count';

const path = require('path');

const REDDIT_URL = 'https://www.reddit.com'
const WSB_URL = `${REDDIT_URL}/r/wallstreetbets`;

// TODO - move shit out of here. 
// File has way too many responsibilities 

type GetArrayT<T> = T extends Array<infer R> ? R : T;

// TODO - fill in & verify Reddit types. Move out of here

// TODO - general tidy up and refactor

interface IPost {
    title: string;
    score: number;
    url_overridden_by_dest: string;
    permalink: string;
}

interface ReditListResponse<T> {
    kind: string;
    data: {
        modHash: string;
        dist: number;
        children: Array<{
            data: T;
            kind: number;
        }>;
    }
}

type RedditCommentsResponse = {
    data: {
        body?: string;
        children: Array<{
            data: {
                body?: string;
                replies: {
                    data?: {
                        children: RedditCommentsResponse['data']['children'];
                    };
                };
            };
        }>;
    };
};


// Reddit quite often 503s. Retry failed requests up to 10 times 
const get = async <T>(url: string, retry = 0): Promise<T | null> => {
    try {
        const res = await axios.get<T>(url)

        return res.data;
    } catch (e) {
        if (retry < 10) {
            return get(url, retry + 1);
        }

        console.log(`Failed to load: ${ url }`, e.message);
        return null;
    }
};

const getTop = async (n: number): Promise<IPost[]> => {

    const top = await get<ReditListResponse<IPost>>(`${WSB_URL}.json?limit=${n}`);

    if (!top) return [];

    return top.data.children.map((item) => item.data);
};

const deepGetComments = (comment: GetArrayT<RedditCommentsResponse['data']['children']>): string => 
    comment.data.body ? `${comment.data.body} ${comment.data.replies.data?.children.map(deepGetComments).join(' ')}` : '';

const getComments = async (postUrl: string): Promise<string[]> => {
    const data = await get<RedditCommentsResponse[]>(`${REDDIT_URL}${postUrl}.json`);

    if (!data) return [];

    return data[1].data.children.map((child) => `${ child.data.body } ${ deepGetComments(child) }`).filter(Boolean);
}

const compilePosts = async (): Promise<string> => {
    const topPosts = await getTop(100);

    return (await Promise.all(
        topPosts.map(async (post) => getComments(post.permalink))
    )).reduce((p, c) => [...p, ...c], []).join(' ');
};

// Count tickers in a new worker thread... Heavy regex too much for 1 core in a reasonable time
const countTickers = async (tickerList: string[], comment: string): Promise<{ [key: string]: number }> => 
    new Promise(async (resolve, reject) => {
        const worker = new Worker(await path.join(__dirname, '../index.js'), {
            workerData: { tickerList, comment },
        });
        worker.on('message', (message) => {
            if (message.counts) {
                resolve(message.counts);
            }
        });
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0)
                reject(new Error(`Worker stopped with exit code ${code}`));
        });
    });

const chunkString = (str: string, chunkLen: number): string[] => {
    const size = Math.ceil(str.length / chunkLen);
    const r = Array(size);
    let offset = 0;

    for (let i = 0; i < size; i++) {
        r[i] = str.substr(offset, chunkLen);
        offset += chunkLen;
    }

    return r;
};

const awaitKillSignal = async () => new Promise((r) => process.on('exit', r));

export default async () => {

    const tickerList = await getTickers();

    await mongoose.connect('mongodb://localhost/wsb_tickers', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true
    });

    console.log('Mongo connected');

    const stopServer = server();

    const stopCron = cron('*/10 * * * *', async () => {
        console.log('CRON START');

        const commentData = await compilePosts();

        const X = (commentData.length / 12) >> 0;
        const strs = chunkString(commentData, X);
    
        console.log('Counting. Data length:', commentData.length, 'bytes');
    
        const s = Date.now();
    
        let n = 0;
    
        const results = await Promise.all(strs.map(async (str, i) => {
            const result = await countTickers(tickerList, str);  
            n++;
            // console.log(`Parallel task completed ${n}/${strs.length}`);
            return result;
        }));
        
        const joinedResults = results.reduce((p, c) => {
            Object.keys(c).forEach((key) => {
                if (p[key]) {
                    p[key] += c[key];
                } else {
                    p[key] = c[key];
                }
            });
    
            return p;
        }, {});
    
    
        console.log(`
            Counted in ${(Date.now() - s) / 1000} seconds. 
            Data set size: ${ commentData.length / 1024 } KB.
            Num tickers checked: ${ tickerList.length }
            ${new Date().toISOString()}
        `);

        await saveTickerCount(joinedResults);

        console.log('Saved to DB');
    });

    await awaitKillSignal();

    // close connections & listeners 
    await Promise.all([
        mongoose.connection.close(),
        stopServer(),
        stopCron(),
    ]);    
};