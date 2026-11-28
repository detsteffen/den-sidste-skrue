import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORY_IDS } from './lib/blog';

const PHOTOS = [
  'badevaerelse',
  'badevaerelse-2',
  'fliser',
  'gavl',
  'gulve',
  'koekken',
  'opmaerkning',
  'renovering',
  'tag',
  'terrasse',
  'vinduer',
] as const;

const blog = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /** The short answer shown first, and the part AI answers quote. */
    answer: z.string(),
    category: z.enum(CATEGORY_IDS),
    photo: z.enum(PHOTOS),
    photoAlt: z.string(),
    published: z.coerce.date(),
    updated: z.coerce.date(),
    facts: z.array(z.string()).default([]),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    sources: z.array(z.object({ title: z.string(), url: z.url() })),
    related: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };
