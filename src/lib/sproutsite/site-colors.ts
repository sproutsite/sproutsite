import { z } from 'zod';

/** Opaque colours keep palette contrast predictable; components retain their own API. */
const hex = z
    .string()
    .regex(
        /^#(?:[\da-f]{3}|[\da-f]{6})$/i,
        'must be an opaque hex colour (#RGB or #RRGGBB)',
    );
const pair = z
    .object({ color: hex.optional(), content: hex.optional() })
    .strict();

export const siteColorsSchema = z
    .object({
        surfaces: z
            .object({
                default: hex.optional(),
                muted: hex.optional(),
                border: hex.optional(),
                text: hex.optional(),
            })
            .strict()
            .optional(),
        primary: pair.optional(),
        secondary: pair.optional(),
        accent: pair.optional(),
        neutral: pair.optional(),
        info: pair.optional(),
        success: pair.optional(),
        warning: pair.optional(),
        error: pair.optional(),
        brand: z
            .object({
                background: hex.optional(),
                backgroundEnd: hex.optional(),
                gradient: hex.optional(),
                content: hex.optional(),
                highlight: hex.optional(),
                accent: hex.optional(),
            })
            .strict()
            .optional(),
    })
    .strict();

export type SiteColors = z.infer<typeof siteColorsSchema>;
