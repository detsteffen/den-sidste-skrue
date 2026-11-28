import type { APIRoute } from 'astro';
import terms from '../data/ordbog.json';
import { allPosts, postMarkdown } from '../lib/posts';
import { site } from '../lib/site';

// Every guide and the glossary as one Markdown text, for AI assistants.
export const GET: APIRoute = async () => {
  const glossary = [
    '# Ordbog: byggeord på almindeligt dansk',
    terms.map(({ term, definition }) => `- **${term}**: ${definition}`).join('\n'),
  ].join('\n\n');
  return new Response(
    [
      `Råd og guides fra ${site.name}, ${site.trade.toLowerCase()} i ${site.city} v/ ${site.owner}. Telefon ${site.phone}.`,
      ...(await allPosts()).map(postMarkdown),
      glossary,
    ].join('\n\n---\n\n') + '\n',
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
};
