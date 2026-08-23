import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function healthCheck(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    if (process.env.IS_HEALTH_CHECK_PASS === 'false') {
        context.log('Health check: returning 503 (IS_HEALTH_CHECK_PASS=false)');
        return { status: 503, body: "unhealthy (forced)" };
    }
    return { status: 200, body: "healthy" };
};

app.http('healthCheck', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: healthCheck
});
