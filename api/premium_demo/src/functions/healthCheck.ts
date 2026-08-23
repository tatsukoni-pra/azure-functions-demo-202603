import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function healthCheck(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const failInstance = process.env.FAIL_INSTANCE;
    const serverName = process.env.COMPUTERNAME || 'unknown';

    if (failInstance === 'all' || failInstance === serverName) {
        context.log(`Health check: returning 503 (FAIL_INSTANCE=${failInstance}, Server=${serverName})`);
        return { status: 503, body: `unhealthy (forced on ${serverName})` };
    }
    return { status: 200, body: `healthy (${serverName})` };
};

app.http('healthCheck', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: healthCheck
});
