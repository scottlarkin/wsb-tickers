const API_URL = '/ticker-counts';

export type CountsResponse = Array<{
    count: {[key: string]: number};
    created: string;
}>;

const getTickerCounts = async (resolution: number, start: number, end: number): Promise<CountsResponse> => {
   return (await fetch(`${API_URL}?resolution=${resolution}&start=${start}&end=${end}`)).json();
};

export {
    getTickerCounts,
};