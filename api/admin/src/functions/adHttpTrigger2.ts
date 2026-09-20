import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function adHttpTrigger2(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const name = request.query.get('name') || await request.text() || 'world';

    return { body: `adHttpTrigger2, ${name}!` };
};

app.http('adHttpTrigger2', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    route: 'adHttpTrigger2',
    handler: adHttpTrigger2
});
