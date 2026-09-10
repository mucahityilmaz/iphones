/**
 * Helpers for the Pages Functions. Lives under src/ rather than functions/ so that
 * Cloudflare never turns it into a route of its own.
 */

export const MIN_ELAPSED_MS = 2000;
export const RATE_LIMIT_MAX = 5;
export const RATE_LIMIT_WINDOW_S = 3600;

const encoder = new TextEncoder();

// Deliberately strict rather than RFC-complete: this list only needs addresses that
// a real mail provider will accept, and a tight pattern is a cheap first filter.
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmailSyntax(email: string): boolean {
  return email.length > 0 && email.length <= 254 && EMAIL_RE.test(email);
}

export function emailDomain(email: string): string {
  return email.slice(email.lastIndexOf('@') + 1);
}

/**
 * MX lookup over DNS-over-HTTPS, since Workers have no DNS module.
 *
 * Fails OPEN: if the resolver is unreachable or returns nonsense we accept the
 * address. A DoH outage silently rejecting every signup would be far worse than
 * letting a few junk domains through.
 */
export async function domainHasMx(domain: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`,
      { headers: { accept: 'application/dns-json' } }
    );
    if (!res.ok) return true;
    const data = (await res.json()) as { Answer?: Array<{ type: number; data: string }> };
    const answers = data.Answer ?? [];
    // type 15 is MX. "0 ." is the RFC 7505 null MX, meaning the domain takes no mail.
    return answers.some((a) => a.type === 15 && a.data && a.data.trim() !== '0 .');
  } catch {
    return true;
  }
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

export async function signEmail(email: string, secret: string): Promise<string> {
  const key = await hmacKey(secret);
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(email)));
}

function b64urlEncode(input: string): string {
  const bytes = encoder.encode(input);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(input: string): string {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const bin = atob(input.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Token is `base64url(email).hmac`. The HMAC alone would authenticate the address but
 * not identify it, so the address travels with it — signed, so it cannot be swapped.
 */
export async function makeUnsubToken(email: string, secret: string): Promise<string> {
  return `${b64urlEncode(email)}.${await signEmail(email, secret)}`;
}

export async function readUnsubToken(token: string, secret: string): Promise<string | null> {
  const dot = token.lastIndexOf('.');
  if (dot < 1) return null;
  let email: string;
  try {
    email = b64urlDecode(token.slice(0, dot));
  } catch {
    return null;
  }
  const expected = await signEmail(email, secret);
  return timingSafeEqual(token.slice(dot + 1), expected) ? email : null;
}

/**
 * 5 writes per IP per hour. The TTL is refreshed on every write, so a client that
 * keeps hammering stays blocked for an hour after its *last* attempt, not its first.
 */
export async function underRateLimit(kv: KVNamespace, ip: string): Promise<boolean> {
  const key = `rl:${ip}`;
  const raw = await kv.get(key);
  const count = raw ? Number.parseInt(raw, 10) || 0 : 0;
  if (count >= RATE_LIMIT_MAX) return false;
  await kv.put(key, String(count + 1), { expirationTtl: RATE_LIMIT_WINDOW_S });
  return true;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Minimal standalone page for Function responses. The site is static, so a Function
 * cannot render an Astro page — this keeps errors on-brand without shipping a second
 * copy of the stylesheet.
 */
export function htmlPage(opts: {
  title: string;
  heading: string;
  body: string;
  status?: number;
  backHref?: string;
}): Response {
  const { title, heading, body, status = 200, backHref = '/' } = opts;
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, follow">
<title>${escapeHtml(title)}</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
:root{color-scheme:dark}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:2rem;
background:#08080a;color:#f4f4f2;
font:16px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:34rem}
h1{font-size:1.75rem;line-height:1.15;letter-spacing:-.02em;margin:0 0 .75rem}
p{color:#8d8d9a;margin:0 0 1.5rem}
a{display:inline-block;border:1px solid #23242f;border-radius:.5rem;
padding:.75rem 1.25rem;color:#f4f4f2;text-decoration:none;font-size:.875rem}
a:hover{border-color:#d8ff3e}
a:focus-visible{outline:2px solid #d8ff3e;outline-offset:3px}
</style></head>
<body><main>
<h1>${escapeHtml(heading)}</h1>
<p>${escapeHtml(body)}</p>
<a href="${escapeHtml(backHref)}">Back to the countdown</a>
</main></body></html>`;

  return new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}
