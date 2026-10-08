import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Container, CosmosClient, ErrorResponse } from "@azure/cosmos";

interface FeatItem {
    id: string;
    count: number;
    updatedAt: string;
    updatedBy: string;
    [key: string]: unknown;
}

// クライアント・コンテナは関数呼び出し間で使い回す（接続の再利用）
let containerPromise: Promise<{ container: Container; partitionKeyPath: string }> | undefined;

function getContainer(): Promise<{ container: Container; partitionKeyPath: string }> {
    if (!containerPromise) {
        containerPromise = (async () => {
            const client = new CosmosClient(process.env.CosmosDBConnection!);
            const container = client
                .database(process.env.COSMOS_DATABASE_NAME!)
                .container(process.env.COSMOS_CONTAINER_NAME!);
            // パーティションキーのパスはコンテナ定義から取得する（例: "/id"）
            const { resource } = await container.read();
            const partitionKeyPath = resource?.partitionKey?.paths?.[0] ?? '/id';
            return { container, partitionKeyPath };
        })().catch(err => {
            containerPromise = undefined;
            throw err;
        });
    }
    return containerPromise;
}

export async function featHttpTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const serverName = process.env.WEBSITE_INSTANCE_ID || 'unknown';
    context.log(`[Server: ${serverName}] Http function processed request for url "${request.url}"`);

    const id = request.query.get('id') || 'feat-sample';
    // パーティションキー値（未指定時は id と同じ値を使う）
    const partitionKey = request.query.get('pk') || id;

    const { container, partitionKeyPath } = await getContainer();
    const partitionKeyField = partitionKeyPath.replace(/^\//, '');

    // 読み取り
    const readResponse = await container.item(id, partitionKey).read<FeatItem>();
    const before = readResponse.resource;
    context.log(`[Server: ${serverName}] Read id=${id} pk=${partitionKey} status=${readResponse.statusCode} RU=${readResponse.requestCharge}`);

    // 書き込み（更新）
    const now = new Date().toISOString();
    const after: FeatItem = {
        ...(before ?? {}),
        id,
        [partitionKeyField]: partitionKey,
        count: (before?.count ?? 0) + 1,
        updatedAt: now,
        updatedBy: serverName,
    };

    try {
        const writeResponse = before
            // 既存レコードは ETag による楽観的同時実行制御付きで置き換え
            ? await container.item(id, partitionKey).replace<FeatItem>(after, {
                accessCondition: { type: 'IfMatch', condition: before._etag as string },
            })
            : await container.items.create<FeatItem>(after);
        context.log(`[Server: ${serverName}] Write id=${id} status=${writeResponse.statusCode} RU=${writeResponse.requestCharge}`);

        return {
            jsonBody: {
                server: serverName,
                partitionKeyPath,
                before: before ?? null,
                after: writeResponse.resource,
                requestCharge: {
                    read: readResponse.requestCharge,
                    write: writeResponse.requestCharge,
                },
            },
        };
    } catch (err) {
        const code = (err as ErrorResponse).code;
        // 412: 読み取り後に別リクエストが更新した / 409: 同時に新規作成された
        if (code === 412 || code === 409) {
            context.warn(`[Server: ${serverName}] Write conflict id=${id} status=${code}`);
            return { status: 409, jsonBody: { server: serverName, message: 'Write conflict', statusCode: code, before: before ?? null } };
        }
        throw err;
    }
};

app.http('featHttpTrigger', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: featHttpTrigger
});
