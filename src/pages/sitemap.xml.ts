import type { APIRoute } from 'astro';
import { allServices, publishedProjects, url } from '../lib/site';

export const GET: APIRoute = async ({ site }) => {
  const services = await allServices();
  const projects = await publishedProjects();
  const paths = [
    '',
    'vi-udfoerer/',
    ...services.map((service) => `vi-udfoerer/${service.id}/`),
    'projekter/',
    ...projects.map((project) => `projekter/${project.id}/`),
    'om-os/',
    'kontakt/',
    'privatliv/',
  ];
  const entries = paths
    .map((path) => `<url><loc>${new URL(url(path), site)}</loc></url>`)
    .join('');
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?>' +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
