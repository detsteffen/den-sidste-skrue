import { getCollection, type CollectionEntry } from 'astro:content';
import { danishDate } from './blog';
import { absolute } from './schema';
import { site } from './site';

export type Post = CollectionEntry<'blog'>;

/** The guides shown first on the blog's front page, in this order. */
export const FEATURED = [
  'hvad-koster-et-nyt-badevaerelse',
  'tilbud-eller-overslag',
  'toemrer-timepris',
];

/** Returns every post, most recently updated first, then by title. */
export async function allPosts(): Promise<Post[]> {
  return (await getCollection('blog')).sort(
    (a, b) =>
      b.data.updated.valueOf() - a.data.updated.valueOf() ||
      a.data.title.localeCompare(b.data.title, 'da'),
  );
}

/** Returns the post with the given id, or fails the build. */
export function find(posts: Post[], id: string): Post {
  const match = posts.find((post) => post.id === id);
  if (!match) throw new Error(`No blog post called ${id}`);
  return match;
}

/**
 * Returns a post as plain Markdown with full addresses, for AI assistants
 * that read llms.txt and the .md copies.
 */
export function postMarkdown(post: Post): string {
  const { data } = post;
  return [
    `# ${data.title}`,
    `${site.name}, ${site.trade.toLowerCase()} i ${site.city}. ` +
      `Opdateret ${danishDate(data.updated)}. ${absolute(`blog/${post.id}/`)}`,
    `> ${data.answer}`,
    data.facts.map((fact) => `- ${fact}`).join('\n'),
    (post.body ?? '').trim().replaceAll('](/', `](${absolute()}`),
    '## Ofte stillede spørgsmål',
    data.faq.map(({ q, a }) => `### ${q}\n\n${a}`).join('\n\n'),
    '## Kilder',
    data.sources.map(({ title, url }) => `- [${title}](${url})`).join('\n'),
  ].join('\n\n');
}
