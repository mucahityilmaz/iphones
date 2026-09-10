import { CONSENT_VERSION } from '../../src/config/consent';
import {
  MIN_ELAPSED_MS,
  domainHasMx,
  emailDomain,
  htmlPage,
  isValidEmailSyntax,
  normalizeEmail,
  underRateLimit,
} from '../../src/lib/server';

interface Env {
  DB: D1Database;
  RATE_LIMIT: KVNamespace;
}

const seeOther = (location: string) =>
  new Response(null, { status: 303, headers: { location, 'cache-control': 'no-store' } });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return htmlPage({
      status: 400,
      title: 'Signup failed',
      heading: "That didn't go through.",
      body: 'The form data could not be read. Please try again.',
    });
  }

  const honeypot = String(form.get('website') ?? '').trim();
  const elapsed = Number(form.get('elapsed_ms') ?? Number.NaN);
  const email = normalizeEmail(String(form.get('email') ?? ''));
  const consent = String(form.get('consent') ?? '');

  // Honeypot hit. Answer exactly like a success so the bot learns nothing, and write
  // nothing to the database.
  if (honeypot !== '') return seeOther('/thanks');

  // Submitted implausibly fast, or with no timing at all (which also means no JS ran).
  if (!Number.isFinite(elapsed) || elapsed < MIN_ELAPSED_MS) {
    return htmlPage({
      status: 400,
      title: 'Signup failed',
      heading: 'That was too quick.',
      body: 'The form was submitted faster than a person could fill it in. If JavaScript is disabled in your browser, email us instead and we will add you by hand.',
    });
  }

  if (consent !== 'yes') {
    return htmlPage({
      status: 400,
      title: 'Signup failed',
      heading: 'The consent box was not ticked.',
      body: 'We only store an address when the box next to the form is ticked. Nothing was saved.',
    });
  }

  if (!isValidEmailSyntax(email)) {
    return htmlPage({
      status: 400,
      title: 'Signup failed',
      heading: "That address doesn't look right.",
      body: 'Please check the spelling and try again. Nothing was saved.',
    });
  }

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';

  if (!(await underRateLimit(env.RATE_LIMIT, ip))) {
    return htmlPage({
      status: 429,
      title: 'Too many attempts',
      heading: 'Too many signups from this connection.',
      body: 'Please try again in an hour.',
    });
  }

  // No confirmation email exists to catch typos and dead domains, so the MX check is
  // the only thing standing between the list and undeliverable addresses.
  if (!(await domainHasMx(emailDomain(email)))) {
    return htmlPage({
      status: 400,
      title: 'Signup failed',
      heading: "That domain doesn't accept email.",
      body: 'We looked it up and found no mail server for it. Please check the part after the @. Nothing was saved.',
    });
  }

  await env.DB.prepare(
    `INSERT INTO subscribers (email, consent_text_version, ip, user_agent)
     VALUES (?1, ?2, ?3, ?4)
     ON CONFLICT(email) DO NOTHING`
  )
    .bind(email, CONSENT_VERSION, ip, request.headers.get('user-agent') ?? '')
    .run();

  // Identical response whether the row was inserted or already existed, so this
  // endpoint cannot be used to test whether an address is on the list.
  return seeOther('/thanks');
};

// Without these, a GET falls through to static-asset lookup and 404s, which is a
// confusing answer for a route that plainly exists. Do NOT replace them with a single
// onRequest export — that captures every method and POST would never reach the
// handler above.
const methodNotAllowed = () =>
  new Response('Method Not Allowed\n', {
    status: 405,
    headers: { allow: 'POST', 'cache-control': 'no-store' },
  });

export const onRequestGet: PagesFunction<Env> = methodNotAllowed;
export const onRequestPut: PagesFunction<Env> = methodNotAllowed;
export const onRequestPatch: PagesFunction<Env> = methodNotAllowed;
export const onRequestDelete: PagesFunction<Env> = methodNotAllowed;
