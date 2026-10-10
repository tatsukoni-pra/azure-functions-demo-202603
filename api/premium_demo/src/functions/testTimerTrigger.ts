import { app, InvocationContext, Timer } from "@azure/functions";
import { Container, CosmosClient } from "@azure/cosmos";

// 読み取り対象のレコード（testHttpTrigger が書き込むレコード。パーティションキー /id を前提とする）
const TARGET_ID = 'premium-sample';

// クライアント・コンテナは関数呼び出し間で使い回す（接続の再利用）
let container: Container | undefined;

function getContainer(): Container {
    if (!container) {
        const client = new CosmosClient(process.env.CosmosDBConnection!);
        container = client
            .database(process.env.COSMOS_DATABASE_NAME!)
            .container(process.env.COSMOS_CONTAINER_NAME!);
    }
    return container;
}

export async function testTimerTrigger(myTimer: Timer, context: InvocationContext): Promise<void> {
    const serverName = process.env.COMPUTERNAME || 'unknown';
    const instanceId = process.env.WEBSITE_INSTANCE_ID || 'unknown';
    context.log(`[Server: ${serverName}] [InstanceId: ${instanceId}] Timer function processed request.`);
    context.log(`[Server: ${serverName}] Timer last ran at: ${myTimer.scheduleStatus?.last}`);
    context.log(`[Server: ${serverName}] Timer next run at: ${myTimer.scheduleStatus?.next}`);

    const { resource, statusCode, requestCharge } = await getContainer().item(TARGET_ID, TARGET_ID).read();
    context.log(`[InstanceId: ${instanceId}] Read id=${TARGET_ID} status=${statusCode} RU=${requestCharge}`);
    if (resource) {
        context.log(`[InstanceId: ${instanceId}] Document: ${JSON.stringify(resource)}`);
    } else {
        context.warn(`[InstanceId: ${instanceId}] Document not found: id=${TARGET_ID}`);
    }
};

app.timer('testTimerTrigger', {
    schedule: '0 */5 * * * *',
    handler: testTimerTrigger
});
