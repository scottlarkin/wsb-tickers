import { isMainThread } from 'worker_threads';
import worker from './worker';
import main from './main';

(async () => {
    if (isMainThread) {
        await main();
    } else {
        worker();
    }
})();