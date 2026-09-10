import type { APIRoute } from 'astro';
import { SITE } from '../config/facts';

// lastmod is stamped at build time, so it genuinely moves whenever the site is rebuilt.
const BUILT_AT = new Date().toISOString().slice(0, 10);

// /danke and /404 are noindex, so they are deliberately absent.
const routes = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
];

export const GET: APIRoute = () => {
  const urls = routes
    .map(
      (r) => `  <url>
    <loc>${new URL(r.path, SITE.url).href}</loc>
    <lastmod>${BUILT_AT}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
};
