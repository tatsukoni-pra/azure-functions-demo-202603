import { app, InvocationContext } from "@azure/functions";

export async function testCosmosTrigger(documents: unknown[], context: InvocationContext): Promise<void> {
    context.log(`Cosmos DB function processed ${documents.length} document(s).`);

    for (const document of documents) {
        context.log(`Document: ${JSON.stringify(document)}`);
    }
};

app.cosmosDB('testCosmosTrigger', {
    connection: 'CosmosDBConnection',
    databaseName: 'FeatDatabase',
    containerName: 'FeatContainerApp',
    leaseContainerName: 'leases',
    createLeaseContainerIfNotExists: true,
    handler: testCosmosTrigger
});
