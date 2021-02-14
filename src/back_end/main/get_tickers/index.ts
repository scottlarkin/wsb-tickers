import axios from 'axios';

const API_URL = 'https://dumbstockapi.com/stock?exchanges=NASDAQ,NYSE';

// These tickers are too common because they're single characters or common english words, results in many false positives. Exclude them from resutls
const EXCLUDED = [
    'I', 'LOW', 'A', 'B', 'M', 'O', 'E', 'D', 'ONE', 'TWO', 'SEE', 'BY', 'ARE', 'FLY', 'NEW', 'TOO', 'MAN', 'FOR', 'OUT', 'DO', 'NOW', 'L', 'AI', 
    'BE', 'PIC', 'DOOR', 'FF', 'HOME', 'PM', 'CCEO',, 'R', 'W', 'Y', 'T', 'H', 'IT', 'G', 'X', 'K', 'F', 'V',
];

export default async (): Promise<string[]> => (await axios.get<Array<{
    ticker: string;
    name: string;
    exchange: string;
}>>(API_URL)).data.map(d => d.ticker).filter((t) => !EXCLUDED.includes(t));