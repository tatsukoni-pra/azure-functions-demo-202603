import { app, InvocationContext } from "@azure/functions";

export async function testCosmosTrigger(documents: unknown[], context: InvocationContext): Promise<void> {
    const instanceId = process.env.WEBSITE_INSTANCE_ID || 'unknown';
    // 未処理の変更をためてスケールの判断を起こすため、1件ごとに待つ
    const delayMs = parseInt(process.env.COSMOS_TRIGGER_DELAY_MS || '0', 10);
    context.log(`[InstanceId: ${instanceId}] Cosmos DB function started. Processing ${documents.length} document(s). Delay: ${delayMs}ms per document`);

    if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs * documents.length));
    }
    context.log(`[InstanceId: ${instanceId}] Cosmos DB function completed.`);
};

app.cosmosDB('testCosmosTrigger', {
    connection: 'CosmosDBConnection',
    databaseName: '%COSMOS_DATABASE_NAME%',
    containerName: '%COSMOS_CONTAINER_NAME%',
    leaseContainerName: '%COSMOS_LEASE_CONTAINER_NAME%',
    createLeaseContainerIfNotExists: true,
    // ターゲットベースのスケーリングは「未処理の件数 ÷ この値」で必要なインスタンス数を決めるため、1 にしてスケールを起こしやすくする
    maxItemsPerInvocation: 1,
    handler: testCosmosTrigger
});
