import { app, InvocationContext } from "@azure/functions";

export async function testCosmosTrigger(documents: unknown[], context: InvocationContext): Promise<void> {
    const serverName = process.env.COMPUTERNAME || 'unknown';
    const instanceId = process.env.WEBSITE_INSTANCE_ID || 'unknown';
    context.log(`[Server: ${serverName}] [InstanceId: ${instanceId}] Cosmos DB function started. Processing ${documents.length} document(s)`);

    for (const document of documents) {
        context.log(`[Server: ${serverName}] Document: ${JSON.stringify(document)}`);
    }
    context.log(`[Server: ${serverName}] Cosmos DB function completed.`);
};

app.cosmosDB('testCosmosTrigger', {
    connection: 'CosmosDBConnection',
    databaseName: '%COSMOS_DATABASE_NAME%',
    containerName: '%COSMOS_CONTAINER_NAME%',
    leaseContainerName: '%COSMOS_LEASE_CONTAINER_NAME%',
    createLeaseContainerIfNotExists: true,
    handler: testCosmosTrigger
});
