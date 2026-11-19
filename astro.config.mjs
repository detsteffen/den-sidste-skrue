// @ts-check
import { defineConfig } from 'astro/config';

// The site is served from a sub-path on GitHub Pages and from the root
// everywhere else, so both come from the environment at build time.
export default defineConfig({
  site: process.env.SITE_URL ?? 'http://localhost:8040',
  base: process.env.SITE_BASE ?? '/',
  trailingSlash: 'always',
});
