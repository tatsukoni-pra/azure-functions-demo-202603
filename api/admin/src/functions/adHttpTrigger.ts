import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function adHttpTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const name = request.query.get('name') || await request.text() || 'world';

    return { body: `adHttpTrigger, ${name}!` };
};

app.http('adHttpTrigger', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    route: 'adHttpTrigger',
    handler: adHttpTrigger
});
