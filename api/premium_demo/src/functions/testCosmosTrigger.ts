// CosmosDB トリガー関数
// FeatDatabase.FeatContainerApp にドキュメントが作成・更新されると起動する（削除では起動しない）
//
// 動作条件:
//   - アプリ設定 CosmosDBConnection に CosmosDB の接続文字列が設定されていること
//   - CosmosDB 上に FeatDatabase / FeatContainerApp / leases コンテナが存在すること
//     （leases は createLeaseContainerIfNotExists: true により自動作成される）
//
// 動作確認方法:
//   1. Azure ポータル等で FeatDatabase.FeatContainerApp にドキュメントを追加する
//   2. Application Insights のログで起動を確認する
//      traces
//      | where message has "Cosmos DB function"
//      | order by timestamp desc
//      | take 10
import { app, InvocationContext } from "@azure/functions";

export async function testCosmosTrigger(documents: unknown[], context: InvocationContext): Promise<void> {
    const serverName = process.env.COMPUTERNAME || 'unknown';
    const instanceId = process.env.WEBSITE_INSTANCE_ID || 'unknown';
    const delayMs = parseInt(process.env.COSMOS_TRIGGER_DELAY_MS || '0', 10);
    context.log(`[Server: ${serverName}] [InstanceId: ${instanceId}] Cosmos DB function started. Processing ${documents.length} document(s). Delay: ${delayMs}ms`);

    // COSMOS_TRIGGER_DELAY_MS: 60000 の場合は、1分停止
    if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    for (const document of documents) {
        context.log(`[Server: ${serverName}] Document: ${JSON.stringify(document)}`);
    }
    context.log(`[Server: ${serverName}] Cosmos DB function completed.`);
};

app.cosmosDB('testCosmosTrigger', {
    connection: 'CosmosDBConnection',
    databaseName: 'FeatDatabase',
    containerName: 'FeatContainerApp',
    leaseContainerName: 'leases',
    createLeaseContainerIfNotExists: true,
    handler: testCosmosTrigger
});
