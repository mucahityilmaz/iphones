/**
 * Security headers on every response. The CSP allows exactly what the site uses:
 * self-hosted fonts and CSS, the inline countdown/consent scripts, and Google
 * Analytics — which is only ever fetched after the visitor accepts.
 */
export const onRequest: PagesFunction = async ({ next }) => {
  const response = await next();

  // Leave non-HTML alone: CSP on a CSV download or a font is pointless noise.
  const type = response.headers.get('content-type') ?? '';
  if (!type.includes('text/html')) return response;

  const headers = new Headers(response.headers);

  headers.set(
    'content-security-policy',
    [
      "default-src 'self'",
      // 'unsafe-inline' is required by the pre-paint countdown script, which has to
      // run synchronously and so cannot be an external file.
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://analytics.yilmaz.games",
      "style-src 'self' 'unsafe-inline'",
      // GA still falls back to image beacons in some browsers, so it needs img-src too.
      "img-src 'self' data: https://www.google-analytics.com https://www.googletagmanager.com",
      "font-src 'self'",
      "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://*.analytics.google.com https://*.google-analytics.com https://analytics.yilmaz.games",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      'upgrade-insecure-requests',
    ].join('; ')
  );
  headers.set('x-content-type-options', 'nosniff');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set('permissions-policy', 'geolocation=(), microphone=(), camera=(), interest-cohort=()');
  headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains');

  return new Response(response.body, { status: response.status, headers });
};
