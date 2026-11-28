// @ts-check
import { satteri } from '@astrojs/markdown-satteri';
import { defineConfig } from 'astro/config';

// The site is served from a sub-path on GitHub Pages and from the root
// everywhere else, so both come from the environment at build time.
const base = process.env.SITE_BASE ?? '/';

/**
 * For the blog's Markdown: puts the base path in front of root-relative
 * links, so posts can link to "/blog/…" wherever the site is served, and
 * wraps tables so they scroll sideways on a phone.
 * @type {import('satteri').HastPluginDefinition}
 */
const siteMarkup = {
  name: 'site-markup',
  element: [
    {
      filter: ['a'],
      visit(node, context) {
        const href = node.properties?.href;
        if (typeof href === 'string' && /^\/(?!\/)/.test(href)) {
          context.setProperty(node, 'href', base.replace(/\/$/, '') + href);
        }
      },
    },
    {
      filter: ['table'],
      visit(node, context) {
        context.wrapNode(node, {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-wrap'] },
          children: [],
        });
      },
    },
  ],
};

export default defineConfig({
  site: process.env.SITE_URL ?? 'http://localhost:8040',
  base,
  trailingSlash: 'always',
  markdown: { processor: satteri({ hastPlugins: [siteMarkup] }) },
});
