/**
 * Security headers on every response. The CSP allows exactly what the site uses:
 * self-hosted fonts and CSS, the inline countdown/consent scripts, and Plausible.
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
      "script-src 'self' 'unsafe-inline' https://plausible.io",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self' https://plausible.io",
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
