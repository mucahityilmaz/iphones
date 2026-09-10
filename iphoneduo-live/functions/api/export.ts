import { makeUnsubToken, timingSafeEqual } from '../../src/lib/server';

interface Env {
  DB: D1Database;
  ADMIN_TOKEN: string;
  UNSUBSCRIBE_SECRET: string;
}

type Row = {
  id: number;
  email: string;
  consent_text_version: string;
  created_at: string;
  ip: string | null;
  user_agent: string | null;
  unsubscribed_at: string | null;
};

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  // Leading =, +, - or @ are treated as formulas by spreadsheet apps; prefix with a
  // quote so an exported user agent can never execute in Excel.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const provided = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${env.ADMIN_TOKEN ?? ''}`;

  if (!env.ADMIN_TOKEN || !timingSafeEqual(provided, expected)) {
    return new Response('Unauthorized\n', {
      status: 401,
      headers: { 'www-authenticate': 'Bearer', 'cache-control': 'no-store' },
    });
  }

  const { results } = await env.DB.prepare(
    `SELECT id, email, consent_text_version, created_at, ip, user_agent, unsubscribed_at
       FROM subscribers
      ORDER BY created_at ASC, id ASC`
  ).all<Row>();

  const rows = results ?? [];
  const header = [
    'id',
    'email',
    'consent_text_version',
    'created_at',
    'ip',
    'user_agent',
    'unsubscribed_at',
    'unsubscribe_url',
  ];

  const lines = [header.join(',')];
  for (const r of rows) {
    // Nothing else generates these links, so the export is where they come from —
    // merge this column into whatever you send.
    const token = env.UNSUBSCRIBE_SECRET
      ? await makeUnsubToken(r.email, env.UNSUBSCRIBE_SECRET)
      : '';
    const url = token ? `https://iphoneduo.live/unsubscribe?token=${token}` : '';
    lines.push(
      [
        csvCell(r.id),
        csvCell(r.email),
        csvCell(r.consent_text_version),
        csvCell(r.created_at),
        csvCell(r.ip),
        csvCell(r.user_agent),
        csvCell(r.unsubscribed_at),
        csvCell(url),
      ].join(',')
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(lines.join('\r\n') + '\r\n', {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="subscribers-${stamp}.csv"`,
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
    },
  });
};
