import type { APIRoute } from 'astro';
import { allPosts } from '../../lib/posts';
import { absolute } from '../../lib/schema';
import { site } from '../../lib/site';

const escape = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export const GET: APIRoute = async () => {
  const items = (await allPosts()).map(({ id, data }) => {
    const link = absolute(`blog/${id}/`);
    return (
      `<item><title>${escape(data.title)}</title><link>${link}</link>` +
      `<guid>${link}</guid><pubDate>${data.published.toUTCString()}</pubDate>` +
      `<description>${escape(data.answer)}</description></item>`
    );
  });
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel>' +
      `<title>Råd og guides fra ${escape(site.name)}</title>` +
      `<link>${absolute('blog/')}</link>` +
      `<description>Priser, regler og gode råd om badeværelser, fliser og tømrerarbejde.</description>` +
      `<language>da</language>${items.join('')}</channel></rss>`,
    { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } },
  );
};
