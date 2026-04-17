import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function featHttpTrigger2(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const name = request.query.get('name') || await request.text() || 'world';

    return { body: `featHttpTrigger2, ${name}!` };
};

app.http('featHttpTrigger2', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: featHttpTrigger2
});
