import { app, InvocationContext, Timer } from "@azure/functions";

export async function testTimerTrigger(myTimer: Timer, context: InvocationContext): Promise<void> {
    const serverName = process.env.COMPUTERNAME || 'unknown';
    const instanceId = process.env.WEBSITE_INSTANCE_ID || 'unknown';
    context.log(`[Server: ${serverName}] [InstanceId: ${instanceId}] Timer function processed request.`);
    context.log(`[Server: ${serverName}] Timer last ran at: ${myTimer.scheduleStatus?.last}`);
    context.log(`[Server: ${serverName}] Timer next run at: ${myTimer.scheduleStatus?.next}`);
};

app.timer('testTimerTrigger', {
    schedule: '0 */5 * * * *',
    handler: testTimerTrigger
});
