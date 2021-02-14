import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import LineGraph from './components/line-graph';
import { getTickerCounts, CountsResponse } from './services/api';
import DatePicker from "react-datepicker";
import Button from './components/button';

import "react-datepicker/dist/react-datepicker.css";
import GlobalStyle from './components/global-style';

type Tickers = {[key: string]: Array<{x: string | Date; y: number}>};

const App = () => {

    const [counts, setCounts] = React.useState<CountsResponse | null>(null);
    const [included, setIncluded] = React.useState<string>('');
    const [resolution, setResolution] = React.useState<number>(60);
    const [startDate, setStartDate] = React.useState(new Date(Date.now() - 1000 * 60 * 60 * 24 * 2));
    const [endDate, setEndDate] = React.useState(new Date());

    useEffect(() => {
        getTickerCounts(resolution, startDate.getTime(), endDate.getTime()).then((counts) => {
            setCounts(counts);
        });
    }, [resolution, startDate, endDate]);

    if (!counts) {
        return <div>Loading...</div>;
    }

    const tickers: Tickers = {};

    let maxSeries = 0;
    
    // TODO - do this transformation server-side
    counts.forEach((timestamp) => {
        Object.keys(timestamp.count).forEach((ticker) => {
            const data = {
                x: new Date(timestamp.created),
                y: timestamp.count[ticker]
            };

            if (!tickers[ticker]) {
                tickers[ticker] = [data];
            } else {
                tickers[ticker].push(data);
                if (tickers[ticker].length > maxSeries) {
                    maxSeries = tickers[ticker].length;
                }
            }
        });
    });
    
    // shitty graphing library requires all series to be same length
    // pad out the shorties with some nullish data
    Object.keys(tickers).forEach((ticker) => {
        if (tickers[ticker].length < maxSeries) {
            const n = [...Array(maxSeries -  tickers[ticker].length).fill({x: new Date(), y: null}), ...tickers[ticker]];

            tickers[ticker] = n;
        }
    });

    let mostPopular = 0;
    let mostPopularTicker = '';

    Object.keys(counts[counts.length - 1].count).forEach((ticker) => {
        if (counts[counts.length - 1].count[ticker] > mostPopular) {
            mostPopular = counts[counts.length - 1].count[ticker];
            mostPopularTicker = ticker;
        }
    });

    const includedArr = included.split(',').map((t) => t.trim()).filter(Boolean);

    if (!included) {
        includedArr.push(mostPopularTicker);
        setIncluded(mostPopularTicker);
    }

    const includeTicker = (id: string) => {
        return includedArr.includes(id);
    }

    const graphData = Object.keys(tickers).map((ticker) => {
        return {
            id: ticker,
            data: tickers[ticker]
        };
    }).filter((a) => includeTicker(a.id));

    return <div>
        <pre>
        /r/wallstreetbets ticker mentions in top 100 posts
        <br />
        Not financial advice
        </pre>
        <LineGraph
           durationHours={ ((endDate.getTime() - startDate.getTime()) / 1000 / 60 / 60) >> 0}
           data={graphData}
        ></LineGraph>

        <DatePicker selected={startDate} onChange={date => setStartDate(date)} />
        <DatePicker selected={endDate} onChange={date => setEndDate(date)} />

        <pre>Time frame - {resolution} minutes.</pre>
        <input type="range" onChange={(e) => setResolution(+e.target.value)} value={resolution} min="10" max="360" step="10"></input>

        <pre>Ticker search - Enter comma separated tickers to show on the graph (defaults to current most mentioned ticker) </pre>
        <input type="text" onChange={(e) => setIncluded(e.target.value)} value={included}></input>
        <Button text="xxx" onClick={() => console.log('XXX')}></Button>
    </div>;
} 

ReactDOM.render(<>
    <GlobalStyle />
    <App />
</>, document.getElementById("root"));
