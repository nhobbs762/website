import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * Drafts stay visible everywhere except the live site, so a post can be
 * reviewed on its branch preview before it ships. Cloudflare Pages sets
 * CF_PAGES_BRANCH on every build; anything that isn't the production branch
 * is a preview. Local `astro dev` has no such variable, so drafts show there.
 */
const isProduction = process.env.CF_PAGES_BRANCH === 'main';

const newestFirst = (a: { data: { pubDate: Date } }, b: { data: { pubDate: Date } }) =>
  b.data.pubDate.valueOf() - a.data.pubDate.valueOf();

export async function getPosts(collection: 'blog'): Promise<CollectionEntry<'blog'>[]>;
export async function getPosts(collection: 'resources'): Promise<CollectionEntry<'resources'>[]>;
export async function getPosts(collection: 'blog' | 'resources') {
  const entries = await getCollection(collection as 'blog');
  return entries.filter((entry) => !(isProduction && entry.data.draft)).sort(newestFirst);
}

export const formatDate = (date: Date) =>
  date.toLocaleDateString('en-SG', { year: 'numeric', month: 'long', day: 'numeric' });

export const isoDate = (date: Date) => date.toISOString().split('T')[0];

/** Rough reading time from the raw markdown body. ~200 words per minute. */
export const readingTime = (body: string) => {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
};
