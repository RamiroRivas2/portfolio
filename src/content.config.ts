import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    order: z.number(),
    year: z.string(),
    role: z.string(),
    stack: z.array(z.string()),
    domain: z.string(),
    featured: z.boolean().default(false),
    // Public repo URL, or null for private/client work
    repo: z.string().url().nullable().default(null),
    live: z.string().url().nullable().default(null),
    // Path under /public to the demo walkthrough video, null until recorded
    video: z.string().nullable().default(null),
    accent: z.string().default('#c8f04a'),
  }),
});

export const collections = { projects };
