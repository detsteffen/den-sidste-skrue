import type { APIRoute } from 'astro';
import { url } from '../lib/site';

const PATHS = ['', 'vi-udfoerer/', 'om-os/', 'privatliv/'];

export const GET: APIRoute = ({ site }) => {
  const entries = PATHS
    .map((path) => `<url><loc>${new URL(url(path), site)}</loc></url>`)
    .join('');
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?>' +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
