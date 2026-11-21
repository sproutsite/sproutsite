import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { createSnapshot } from '../snapshot.js';

export const prerender = true;
export const GET: APIRoute = async () => {
    const pages = await getCollection('pages');
    const documents = await getCollection('documents');
    return Response.json(createSnapshot(pages, documents));
};
