import type { APIRoute } from 'astro';
import { z } from 'zod';
import { snapshotSchema } from '../schema.js';

export const prerender = true;
export const GET: APIRoute = () =>
    Response.json(z.toJSONSchema(snapshotSchema));
