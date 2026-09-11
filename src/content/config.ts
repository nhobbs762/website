import { defineCollection, z } from 'astro:content';

/** Fields shared by every writing collection on the site. */
const base = {
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  tags: z.array(z.string()).optional().default([]),
  /** Drafts build locally and on previews, but are stripped from production. */
  draft: z.boolean().optional().default(false),
};

/** Evergreen, maintained guides. Not time-sensitive. */
const resources = defineCollection({
  type: 'content',
  schema: z.object(base),
});

/** Dated posts — opinion, notes, updates. */
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    ...base,
    author: z.string().optional().default('Nic Hobbs'),
  }),
});

export const collections = { resources, blog };
