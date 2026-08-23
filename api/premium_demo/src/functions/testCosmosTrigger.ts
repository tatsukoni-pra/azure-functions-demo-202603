import { app, InvocationContext } from "@azure/functions";

export async function testCosmosTrigger(documents: unknown[], context: InvocationContext): Promise<void> {
    const instanceId = process.env.WEBSITE_INSTANCE_ID || 'unknown';
    context.log(`[Instance: ${instanceId}] Cosmos DB function started. Processing ${documents.length} document(s).`);

    await new Promise(resolve => setTimeout(resolve, 60000));

    for (const document of documents) {
        context.log(`[Instance: ${instanceId}] Document: ${JSON.stringify(document)}`);
    }
    context.log(`[Instance: ${instanceId}] Cosmos DB function completed.`);
};

app.cosmosDB('testCosmosTrigger', {
    connection: 'CosmosDBConnection',
    databaseName: 'FeatDatabase',
    containerName: 'FeatContainerApp',
    leaseContainerName: 'leases',
    createLeaseContainerIfNotExists: true,
    handler: testCosmosTrigger
});
