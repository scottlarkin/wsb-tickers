import express from 'express';
import { getTickerCounts } from '../db/ticker_count';
import fs from "fs";

const html = (() => {
  let html: string;

  return async () => {
    return html || fs.promises.readFile('./public/index.html', 'utf-8');
  };
})();

export default () => {
    const app = express();
    const port = 3000;
    
    app.get('/', async (req, res) => {
      res.send(await html());
    });

    app.get('/ticker-counts', async (req, res) => {
      const resolution = req.query.resolution;
      const start = new Date(+req.query.start);
      const end = new Date(+req.query.end);
      
      const counts = await getTickerCounts(+resolution, start, end);

      res.json(counts);
    });

    app.use('/js', express.static('public/js'));

    app.listen(port, () => {
      console.log(`server listening at http://localhost:${port}`);
    });

    return () => {};
};
