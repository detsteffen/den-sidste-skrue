import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One file per service. `task` is the name the house, the cards and the
// quote form use for it, and `questions` are what the form asks about it.
const services = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/ydelser' }),
  schema: z.object({
    title: z.string(),
    task: z.string(),
    group: z.enum(['ude', 'inde']),
    order: z.number(),
    summary: z.string(),
    seoTitle: z.string().max(60),
    description: z.string().max(160),
    typical: z.array(z.string()),
    questions: z.array(
      z.object({
        label: z.string(),
        options: z.array(z.string()).optional(),
        unit: z.string().optional(),
      }),
    ),
  }),
});

// One file per finished job. Images live in public/projekter/<file name>/.
const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projekter' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    task: z.string(),
    place: z.string(),
    year: z.number(),
    cover: z.string(),
    before: z.string().optional(),
    after: z.string().optional(),
    images: z.array(z.string()).default([]),
    materials: z.array(z.string()).default([]),
    work: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { services, projects };
