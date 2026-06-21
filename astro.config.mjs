// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://materia.io',
  output: 'static',
  trailingSlash: 'never',
  // Emit `about.html` rather than `about/index.html` so URLs carry no trailing
  // slash on Cloudflare Pages (no 308 redirect on every internal link).
  // Inline ALL stylesheets so first paint never blocks on an external CSS
  // request — content pages are text-LCP and should render instantly.
  build: { format: 'file', inlineStylesheets: 'always' },
  integrations: [react(), mdx(), sitemap()],
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  vite: {
    plugins: [tailwindcss()],
    // Fleet standard (VoidZero ecosystem) — Lightning CSS as the CSS
    // transformer + minifier. Bundled in Vite; just opt in.
    css: { transformer: 'lightningcss' },
    build: { cssMinify: 'lightningcss' },
  },
});
