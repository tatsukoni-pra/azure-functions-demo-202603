import { app, InvocationContext, Timer } from "@azure/functions";

export async function testTimerTrigger(myTimer: Timer, context: InvocationContext): Promise<void> {
    context.log('Timer function processed request.');
    context.log(`Timer last ran at: ${myTimer.scheduleStatus?.last}`);
    context.log(`Timer next run at: ${myTimer.scheduleStatus?.next}`);
};

app.timer('testTimerTrigger', {
    schedule: '0 */10 * * * *',
    handler: testTimerTrigger
});
