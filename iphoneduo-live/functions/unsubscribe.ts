import { htmlPage, readUnsubToken } from '../src/lib/server';

interface Env {
  DB: D1Database;
  UNSUBSCRIBE_SECRET: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const token = new URL(request.url).searchParams.get('token') ?? '';

  if (!env.UNSUBSCRIBE_SECRET) {
    return htmlPage({
      status: 500,
      title: 'Unsubscribe',
      heading: 'This link cannot be checked right now.',
      body: 'The server is missing its signing key. Please email contact@iphoneduo.live and we will remove you by hand.',
    });
  }

  const email = token ? await readUnsubToken(token, env.UNSUBSCRIBE_SECRET) : null;

  if (!email) {
    return htmlPage({
      status: 400,
      title: 'Unsubscribe',
      heading: 'That unsubscribe link is not valid.',
      body: 'It may have been truncated by your email client. Email contact@iphoneduo.live and we will remove you by hand.',
    });
  }

  // Idempotent: clicking twice does not overwrite the original timestamp, and an
  // address that was never on the list produces the same reply as one that was.
  await env.DB.prepare(
    `UPDATE subscribers
        SET unsubscribed_at = ?1
      WHERE email = ?2 AND unsubscribed_at IS NULL`
  )
    .bind(new Date().toISOString(), email)
    .run();

  return htmlPage({
    title: 'Unsubscribed',
    heading: 'You are unsubscribed.',
    body: `${email} will not receive any further email from this site. No further action is needed.`,
  });
};
