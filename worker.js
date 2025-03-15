import { handleRequest } from './dist/cloudflare';

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});
