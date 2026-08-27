import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function testHttpTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const serverName = process.env.COMPUTERNAME || 'unknown';
    const delayMs = parseInt(process.env.HTTP_TRIGGER_DELAY_MS || '0', 10);
    context.log(`[Server: ${serverName}] Http function processed request for url "${request.url}". Delay: ${delayMs}ms`);

    if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    const name = request.query.get('name') || await request.text() || 'world';

    return { body: `testHttpTrigger, ${name}! (Server: ${serverName})` };
};

app.http('testHttpTrigger', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: testHttpTrigger
});
