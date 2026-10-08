import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { networkInterfaces } from "os";

// 外部サービスから見た送信元（アウトバウンド）パブリックIPを取得する
async function getOutboundIp(): Promise<string> {
    try {
        const res = await fetch('https://api.ipify.org', { signal: AbortSignal.timeout(5000) });
        return (await res.text()).trim();
    } catch (err) {
        return `error: ${(err as Error).message}`;
    }
}

// インスタンスに割り当てられたプライベートIP（VNet 統合時は統合サブネットのIPが含まれる）
function getLocalIps(): string[] {
    return Object.entries(networkInterfaces()).flatMap(([name, addrs]) =>
        (addrs ?? [])
            .filter(addr => addr.family === 'IPv4' && !addr.internal)
            .map(addr => `${name}:${addr.address}`)
    );
}

export async function featHttpTrigger2(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const serverName = process.env.WEBSITE_INSTANCE_ID || 'unknown';
    context.log(`[Server: ${serverName}] Http function processed request for url "${request.url}"`);

    const name = request.query.get('name') || await request.text() || 'world';

    const ipInfo = {
        // 呼び出し元クライアントのIP（インバウンド）
        clientIp: request.headers.get('x-forwarded-for') || 'unknown',
        // Function App から外部へ出ていく際の送信元IP（アウトバウンド）
        outboundIp: await getOutboundIp(),
        localIps: getLocalIps(),
    };
    context.log(`[Server: ${serverName}] IP info: ${JSON.stringify(ipInfo)}`);

    return { body: `featHttpTrigger2_v2, ${name}! ${JSON.stringify(ipInfo)}` };
};

app.http('featHttpTrigger2', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: featHttpTrigger2
});
