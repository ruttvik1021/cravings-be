import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

export async function handleRequest(request: Request): Promise<Response> {
  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance();

  // Convert Cloudflare request to Express request
  const url = new URL(request.url);
  const expressReq = {
    method: request.method,
    url: url.pathname + url.search,
    headers: request.headers,
    body: await request.text(),
  };

  // Process the request through your NestJS app
  return new Promise((resolve) => {
    expressApp(expressReq, {
      status: (statusCode) => ({
        send: (body) => {
          resolve(new Response(body, { status: statusCode }));
        },
        json: (body) => {
          resolve(
            new Response(JSON.stringify(body), {
              status: statusCode,
              headers: { 'Content-Type': 'application/json' },
            }),
          );
        },
      }),
    });
  });
}

// Export the handler for Cloudflare Workers
export default {
  fetch: handleRequest,
};
