import { z } from 'zod';

/** Optional public byline; never inferred from private website-operator data. */
export const blogAuthorSchema = z
    .object({
        name: z.string().trim().min(1),
        url: z.url({ protocol: /^https?$/ }).optional(),
    })
    .strict();
