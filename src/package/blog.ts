import { getCollection } from 'astro:content';
import {
    hasBlogSources,
    type blogPatterns,
} from '../lib/sproutsite/blog-sources.js';

/** Optional collections are queried only when their source files exist. */
export async function getBlogCollection<C extends keyof typeof blogPatterns>(
    collection: C,
) {
    return hasBlogSources(collection) ? getCollection(collection) : [];
}
