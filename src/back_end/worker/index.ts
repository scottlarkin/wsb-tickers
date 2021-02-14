import { parentPort, workerData } from 'worker_threads';

// TODO - improve?
// Optimise regex? 
// Better method than? 
// Current method hurts the CPU 

const baseRegex = (ticker: string) => `\\W${ticker}\\W`;

const countTickersInComment = (tickerList: string[], comment: string): { [key: string]: number } => {
    try {
        const regex = tickerList.reduce((p, c) => p + `${baseRegex(c)}|`, '');

        const match = ` ${comment} `.replace(/[^a-zA-Z ]/g, ' ').match(new RegExp(regex.substring(0, regex.length - 1), 'gm'));

        const counts = match.reduce((p, c) => {
            const ticker = c.trim().toLocaleUpperCase();

            if (p[ticker]) {
                p[ticker]++;
            } else {
                p[ticker] = 1;
            }

            return p;
        }, {});

        return counts;
    } catch (e) {
        // TODO - maybe report this or something
        return {};
    }
};

export default async () => {
    parentPort.postMessage({
        counts: countTickersInComment(workerData.tickerList, workerData.comment),
    });
};
