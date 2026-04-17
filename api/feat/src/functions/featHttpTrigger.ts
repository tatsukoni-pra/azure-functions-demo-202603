import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function featHttpTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const name = request.query.get('name') || await request.text() || 'world';

    return { body: `featHttpTrigger, ${name}!` };
};

app.http('featHttpTrigger', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: featHttpTrigger
});
