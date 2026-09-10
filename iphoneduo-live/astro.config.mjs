// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Static output on purpose: everything crawlable is pre-rendered, and the only
// dynamic surface (signup, unsubscribe, export) lives in Pages Functions.
export default defineConfig({
  site: 'https://iphoneduo.live',
  output: 'static',
  trailingSlash: 'never',
  build: {
    // /privacy.html served as /privacy — no trailing slash, matches canonicals.
    format: 'file',
    inlineStylesheets: 'always',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
