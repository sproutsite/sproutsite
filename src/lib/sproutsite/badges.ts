import { z } from 'zod';

/** Semantic options shared by Badge, Card and content validation. */
export const badgeVariants = [
    'default',
    'primary',
    'secondary',
    'accent',
    'neutral',
    'info',
    'success',
    'warning',
    'error',
] as const;
export const badgeStyles = ['solid', 'outline', 'soft', 'dash'] as const;
export const badgeSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
export type BadgeVariant = (typeof badgeVariants)[number];
export type BadgeStyle = (typeof badgeStyles)[number];
export type BadgeSize = (typeof badgeSizes)[number];

const cardBadgeSchema = z
    .object({
        text: z.string().trim().min(1),
        variant: z.enum(badgeVariants).optional(),
        style: z.enum(badgeStyles).optional(),
        hover: z.string().trim().min(1).optional(),
    })
    .strict();

export type CardBadge = z.infer<typeof cardBadgeSchema>;

/** Accept one descriptor or a list without changing Badge's own defaults. */
export function normalizeCardBadges(value: unknown): CardBadge[] {
    if (value === undefined) return [];
    const result = z
        .array(cardBadgeSchema)
        .safeParse(Array.isArray(value) ? value : [value]);
    if (!result.success)
        throw new Error(
            `Card badges must contain non-empty text, optional Badge variant and style, and optional non-empty hover text only: ${result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`,
        );
    return result.data;
}
