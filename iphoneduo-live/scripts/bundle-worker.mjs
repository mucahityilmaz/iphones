/**
 * Bundles scripts/worker-entry.ts into a single ESM _worker.js for Cloudflare Pages.
 *
 * Only needed for REST-API deploys. `wrangler pages deploy` does this itself from
 * functions/, so if you are logged in with `wrangler login` you never need this.
 *
 *   node scripts/bundle-worker.mjs            -> build/_worker.js
 *   node scripts/bundle-worker.mjs --into-dist -> dist/_worker.js (for local testing
 *                                                 with `wrangler pages dev dist`)
 */
import { build } from 'esbuild';
import { mkdirSync, copyFileSync } from 'node:fs';

const outdir = 'build';
mkdirSync(outdir, { recursive: true });

await build({
  entryPoints: ['scripts/worker-entry.ts'],
  outfile: `${outdir}/_worker.js`,
  bundle: true,
  format: 'esm',
  target: 'es2022',
  platform: 'neutral',
  mainFields: ['module', 'main'],
  conditions: ['workerd', 'worker', 'browser', 'import'],
  external: ['cloudflare:*', 'node:*'],
  minify: false,
  sourcemap: false,
});

if (process.argv.includes('--into-dist')) {
  copyFileSync(`${outdir}/_worker.js`, 'dist/_worker.js');
  console.log('bundled -> dist/_worker.js');
} else {
  console.log(`bundled -> ${outdir}/_worker.js`);
}
