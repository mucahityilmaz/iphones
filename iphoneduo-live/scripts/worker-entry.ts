/**
 * Pages "advanced mode" entry point.
 *
 * `wrangler pages deploy` compiles functions/ into this shape by itself, so this file
 * only exists for deploying over the REST API, where nothing performs that step. It
 * imports the exact same handlers — functions/ stays the single source of truth, and
 * this must never grow logic of its own.
 */
import { onRequest as middleware } from '../functions/_middleware';
import { onRequestPost as subscribePost } from '../functions/api/subscribe';
import { onRequestGet as exportGet } from '../functions/api/export';
import { onRequestGet as unsubscribeGet } from '../functions/unsubscribe';

type Env = {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  DB: D1Database;
  RATE_LIMIT: KVNamespace;
  ADMIN_TOKEN: string;
  UNSUBSCRIBE_SECRET: string;
};

const methodNotAllowed = (allow: string) =>
  new Response('Method Not Allowed\n', {
    status: 405,
    headers: { allow, 'cache-control': 'no-store' },
  });

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);
    const method = request.method;

    // Anything not claimed below falls through to the static build, which is also how
    // 404.html gets served with a 404 status.
    const serveAsset = () => env.ASSETS.fetch(request);

    const dispatch = async (): Promise<Response> => {
      const fnCtx = {
        request,
        env,
        params: {},
        data: {},
        functionPath: pathname,
        waitUntil: ctx.waitUntil.bind(ctx),
        passThroughOnException: ctx.passThroughOnException.bind(ctx),
        next: serveAsset,
      } as unknown as Parameters<typeof subscribePost>[0];

      if (pathname === '/api/subscribe') {
        return method === 'POST' ? subscribePost(fnCtx) : methodNotAllowed('POST');
      }
      if (pathname === '/api/export') {
        return method === 'GET' || method === 'HEAD'
          ? exportGet(fnCtx as never)
          : methodNotAllowed('GET');
      }
      if (pathname === '/unsubscribe') {
        return method === 'GET' || method === 'HEAD'
          ? unsubscribeGet(fnCtx as never)
          : methodNotAllowed('GET');
      }
      return serveAsset();
    };

    // Same wrapping order Pages uses: _middleware sees every response, including assets.
    return middleware({
      request,
      env,
      next: dispatch,
      waitUntil: ctx.waitUntil.bind(ctx),
      passThroughOnException: ctx.passThroughOnException.bind(ctx),
      params: {},
      data: {},
      functionPath: pathname,
    } as never) as Promise<Response>;
  },
};
