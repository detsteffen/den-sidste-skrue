import type { APIRoute } from 'astro';
import { CATEGORY_IDS } from '../lib/blog';
import { allPosts } from '../lib/posts';
import { absolute } from '../lib/schema';

const PAGES = ['', 'vi-udfoerer/', 'om-os/', 'privatliv/', 'blog/', 'blog/ordbog/'];

export const GET: APIRoute = async () => {
  const entries = [
    ...PAGES.map((path) => ({ path })),
    ...CATEGORY_IDS.map((id) => ({ path: `blog/emne/${id}/` })),
    ...(await allPosts()).map(({ id, data }) => ({
      path: `blog/${id}/`,
      updated: data.updated.toISOString().slice(0, 10),
    })),
  ].map(({ path, updated }) =>
    `<url><loc>${absolute(path)}</loc>${updated ? `<lastmod>${updated}</lastmod>` : ''}</url>`);
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?>' +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join('')}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
