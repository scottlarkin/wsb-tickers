const CronJob = require('cron').CronJob;

export default (cronStr: string, jobFn: () => Promise<void>) => {
    const job = new CronJob(cronStr, async () => {
        await jobFn().catch((e) => {
            console.log('CRON ERROR!', e);
            // TODO - handle this error
        });
    }, null, true);

    job.start();

    return () => job.stop();
}; 