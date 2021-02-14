import { count } from 'console';
import mongoose from 'mongoose';

// TODO - many things

type TickerCount = { [key: string]: number };

type Schema =  {
    created: Date;
    count: TickerCount;
};

const COLLECTION_NAME = 'ticker-count';

let cachedCounts: { [key: string] : Schema[] | null } = {};

const saveTickerCount = async (count: TickerCount): Promise<void> => {
    await mongoose.connection.collection(COLLECTION_NAME).insertOne({
        count,
        created: new Date(),
    });

    cachedCounts = {};
};

const getTickerCounts = async (resolution: number, start: Date, end: Date): Promise<Schema[]> => {
    // TODO - use redis to cache 
    const cacheKey = `${resolution}-${start}-${end}`;

    if (cachedCounts[cacheKey]) return cachedCounts[cacheKey];

    const counts = await(mongoose.connection.collection(COLLECTION_NAME).find({
        created: {
            $gte: start,
            $lte: end,
        }
    }, {
        projection: {
            _id: 0,
        },
        sort: {
            created: 1,
        }
    }).toArray() as Promise<Schema[]>);

    const res = toResolution(resolution, counts);

    cachedCounts[cacheKey] = res;

    return res;
};

// Data is stored every 10 minutes. 
// This is too high resolution to send raw to the FE for most purposes
// Reduce the data load by averaging out the data at a lower time resolution
// TODO - offload this aggregation to the database or a worker thread?
// API server thread should not be doing this sort of work  
const toResolution = (resolutionMins: number, counts: Schema[]): Schema[] => {
    let sumCount: Schema | null = null;
    let index = 0;
    let time = 0;

    const transformed = counts.reduce((newCounts: Schema[], count, i) => {
        index++;

        if (!time) {
            time = count.created.getTime();
        }

        const dt = (count.created.getTime() - time) / 1000 / 60;

        if (!sumCount) {
            sumCount = {...count};
        } else {
            Object.keys(count.count).forEach((ticker) => {
                if (sumCount[ticker]) {
                    sumCount.count[ticker] += count.count[ticker];
                } else {
                    sumCount.count[ticker] = count.count[ticker];
                }
            });
    
            sumCount.created = new Date(sumCount.created.getTime() + count.created.getTime());    
        }

        if (dt >= resolutionMins) {
            Object.keys(sumCount).forEach((ticker) => {
                sumCount.count[ticker] = sumCount.count[ticker] / index;
            });

            sumCount.created = new Date(sumCount.created.getTime() / index);

            newCounts.push(sumCount);

            time = 0;
            index = 0;
            sumCount = null;
        }

        return newCounts;
    }, []);

    return transformed;
};


export {
    saveTickerCount,
    getTickerCounts
};