import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function healthCheck(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    return { status: 200, body: "healthy" };
};

app.http('healthCheck', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: healthCheck
});
