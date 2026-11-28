import type { APIRoute } from 'astro';
import terms from '../data/ordbog.json';
import { CATEGORIES, CATEGORY_IDS } from '../lib/blog';
import { allPosts } from '../lib/posts';
import { absolute } from '../lib/schema';
import { site } from '../lib/site';

// A map of the site for AI assistants, following the llms.txt proposal
// (https://llmstxt.org): the guides link to their plain Markdown copies.
export const GET: APIRoute = async () => {
  const posts = await allPosts();
  const sections = CATEGORY_IDS.map((id) =>
    [
      `## ${CATEGORIES[id].title}`,
      ...posts
        .filter((post) => post.data.category === id)
        .map(({ id: slug, data }) =>
          `- [${data.title}](${absolute(`blog/${slug}.md`)}): ${data.description}`),
    ].join('\n'),
  );
  return new Response(
    [
      `# ${site.name}`,
      `> ${site.trade} i ${site.city} og omegn v/ ${site.owner}: tømrerarbejde, ` +
        `flisearbejde og badeværelsesrenovering. Telefon ${site.phone}.`,
      'Siden har guides om priser, regler og forløb, når man skal have lavet ' +
        'badeværelse, fliser eller tømrerarbejde i Danmark. Hver guide har kilder ' +
        'og findes også som Markdown.',
      [
        '## Firmaet',
        `- [Forside og tilbud](${absolute()}): ${site.slogan}. Få et uforpligtende tilbud.`,
        `- [Vi udfører](${absolute('vi-udfoerer/')}): tømrerarbejde, flisearbejde og badeværelsesrenovering.`,
        `- [Om os](${absolute('om-os/')}): hvem står bag, og hvordan en opgave forløber.`,
      ].join('\n'),
      ...sections,
      [
        '## Ordbog',
        `- [Byggeord på almindeligt dansk](${absolute('blog/ordbog/')}): ${terms.length} ord forklaret kort.`,
      ].join('\n'),
      [
        '## Optional',
        `- [Alle guides og ordbogen i én fil](${absolute('llms-full.txt')})`,
      ].join('\n'),
    ].join('\n\n') + '\n',
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
};
