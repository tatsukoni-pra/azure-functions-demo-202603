import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Container, CosmosClient, ErrorResponse, ItemDefinition } from "@azure/cosmos";

// クライアント・コンテナは関数呼び出し間で使い回す（接続の再利用）
let sourceContainer: Container | undefined;
let targetContainer: Container | undefined;

// コピー元: CosmosDBConnection_prd のアカウント
function getSourceContainer(): Container {
    if (!sourceContainer) {
        sourceContainer = new CosmosClient(process.env.CosmosDBConnection_prd!)
            .database(process.env.COSMOS_DATABASE_NAME_PRD!)
            .container(process.env.COSMOS_CONTAINER_NAME_PRD!);
    }
    return sourceContainer;
}

// コピー先: CosmosDBConnection のアカウント
function getTargetContainer(): Container {
    if (!targetContainer) {
        targetContainer = new CosmosClient(process.env.CosmosDBConnection!)
            .database(process.env.COSMOS_DATABASE_NAME!)
            .container(process.env.COSMOS_CONTAINER_NAME!);
    }
    return targetContainer;
}

export async function testHttpTrigger3(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const serverName = process.env.WEBSITE_INSTANCE_ID || 'unknown';
    context.log(`[Server: ${serverName}] Http function processed request for url "${request.url}"`);

    try {
        // コピー元から最終更新日時（_ts）が最新のドキュメントを1件取得
        const { resources, requestCharge: readRU } = await getSourceContainer().items
            .query<ItemDefinition>('SELECT TOP 1 * FROM c ORDER BY c._ts DESC')
            .fetchAll();
        const latest = resources[0];
        if (!latest) {
            context.warn(`[Server: ${serverName}] Source container is empty`);
            return { status: 404, jsonBody: { message: 'No document in source container' } };
        }
        context.log(`[Server: ${serverName}] Read latest id=${latest.id} _ts=${latest._ts} RU=${readRU}`);

        // システムプロパティはコピー先で採番し直されるため除外する
        const { _rid, _self, _etag, _attachments, _ts, ...doc } = latest;

        // 同じ id が既にあれば上書き（再実行しても重複しない）
        const writeResponse = await getTargetContainer().items.upsert<ItemDefinition>(doc);
        context.log(`[Server: ${serverName}] Upsert id=${doc.id} status=${writeResponse.statusCode} RU=${writeResponse.requestCharge}`);

        return {
            jsonBody: {
                id: doc.id,
                sourceTs: _ts,
                status: writeResponse.statusCode,
            },
        };
    } catch (err) {
        const e = err as ErrorResponse;
        context.error(`[Server: ${serverName}] Cosmos error code=${e.code} substatus=${e.substatus} message=${(e.message ?? '').slice(0, 200)}`);
        return { status: 500, jsonBody: { message: 'Cosmos error', code: e.code } };
    }
};

app.http('testHttpTrigger3', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: testHttpTrigger3
});
