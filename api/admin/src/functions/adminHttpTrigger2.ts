import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function adminHttpTrigger2(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const name = request.query.get('name') || await request.text() || 'world';

    return { body: `adminHttpTrigger2, ${name}!` };
};

app.http('adminHttpTrigger2', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    route: 'adminHttpTrigger2',
    handler: adminHttpTrigger2
});
