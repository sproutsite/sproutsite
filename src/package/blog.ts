import { getCollection, getEntry } from 'astro:content';
import type { blogPatterns } from '../lib/sproutsite/blog-sources.js';

/** Query optional collections only after Astro has written their first entry. */
export async function getBlogCollection<C extends keyof typeof blogPatterns>(
    collection: C,
) {
    const state = await getEntry('sproutsiteBlogState', 'readiness');
    return state?.data[collection] ? getCollection(collection) : [];
}
