import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { parse } from 'yaml';
import type { SiteConfig } from './types.js';
import {
    brandingSchema,
    inheritBranding,
    validateBrandingFiles,
} from './branding.js';

const linkSchema = z.object({
    label: z.string().trim().min(1),
    href: z
        .string()
        .trim()
        .min(1)
        .refine((href) => {
            if (href.startsWith('//') || /[\u0000-\u0020\u007f\\]/.test(href))
                return false;
            try {
                return ['http:', 'https:', 'mailto:', 'tel:'].includes(
                    new URL(href, 'https://example.invalid').protocol,
                );
            } catch {
                return false;
            }
        }, 'must be a safe website, email or telephone link'),
});
const headerLinkSchema = linkSchema.extend({
    icon: z
        .string()
        .regex(
            /^[A-Z][A-Za-z0-9]*$/,
            'must be a canonical PascalCase Lucide name',
        )
        .optional(),
});
const heroClass = z.string().regex(/^ss-[a-z0-9][a-z0-9_-]*$/, {
    message:
        'must start with ss- and contain only lowercase letters, digits, underscores, or hyphens',
});

const fontSelectionSchema = z
    .object({
        family: z.enum(['serif', 'sans-serif']).default('serif'),
        weight: z.number().int().min(200).max(1000).default(500),
    })
    .strict()
    .superRefine((font, context) => {
        if (
            font.family === 'serif' &&
            (font.weight < 400 || font.weight > 800)
        ) {
            context.addIssue({
                code: 'custom',
                path: ['weight'],
                message: 'must be between 400 and 800 for serif (EB Garamond)',
            });
        }
    })
    .default({ family: 'serif', weight: 500 });

const siteSchema = z.object({
    branding: brandingSchema.optional(),
    typography: z
        .object({
            headings: fontSelectionSchema,
            eyebrow: fontSelectionSchema,
        })
        .strict()
        .default({
            headings: { family: 'serif', weight: 500 },
            eyebrow: { family: 'serif', weight: 500 },
        }),
    links: z
        .object({
            externalNewTab: z.boolean().optional(),
            externalIcon: z.boolean().optional(),
        })
        .strict()
        .optional(),
    name: z.string().trim().min(1),
    url: z.url(),
    base: z
        .string()
        .regex(/^\/(?:[^/].*)?\/$|^\/$/, 'must be / or begin and end with /'),
    language: z
        .string()
        .regex(/^[a-z]{2}(?:-[A-Z]{2})?$/, 'must be a BCP 47 language tag'),
    locales: z
        .array(z.string().regex(/^[a-z]{2}$/))
        .min(1)
        .default(['en']),
    'hero-classes': z.array(heroClass).max(8).default([]),
    blog: z
        .object({
            title: z.string().trim().min(1),
            description: z.string().trim().min(1),
            eyebrow: z.string().trim().min(1),
            heading: z.string().trim().min(1),
        })
        .optional(),
    header: z.object({
        links: z
            .array(
                z.union([
                    z.object({ type: z.literal('separator') }).strict(),
                    z.object({ type: z.literal('language-switcher') }).strict(),
                    headerLinkSchema
                        .extend({
                            type: z.literal('cta'),
                            variant: z
                                .enum([
                                    'primary',
                                    'secondary',
                                    'accent',
                                    'neutral',
                                    'info',
                                    'success',
                                    'warning',
                                    'error',
                                ])
                                .default('primary'),
                        })
                        .strict(),
                    headerLinkSchema
                        .extend({ type: z.literal('link').optional() })
                        .strict(),
                ]),
            )
            .min(1)
            .refine((items) => items.some((item) => 'href' in item), {
                message: 'must contain at least one navigation link',
            }),
    }),
    footer: z.object({
        text: z.string().trim().min(1),
        links: z.array(linkSchema),
        groups: z
            .array(
                z
                    .object({
                        title: z.string().trim().min(1),
                        links: z.array(headerLinkSchema.strict()).min(1),
                    })
                    .strict(),
            )
            .optional(),
        social: z
            .object({
                title: z.string().trim().min(1),
                links: z
                    .array(
                        linkSchema
                            .extend({
                                platform: z.enum([
                                    'github',
                                    'instagram',
                                    'facebook',
                                ]),
                            })
                            .strict(),
                    )
                    .min(1),
            })
            .strict()
            .optional(),
        copyright: z.string().trim().min(1).optional(),
        showVersion: z.boolean().optional(),
        languageSwitcher: z.boolean().optional(),
    }),
});

export function loadSiteConfig(
    locale?: string,
    root = process.cwd(),
): SiteConfig {
    const filename =
        locale && locale !== 'en' ? `site.${locale}.yaml` : 'site.yaml';
    const source = resolve(root, 'src/content', filename);
    const raw = parse(readFileSync(source, 'utf8'));
    if (
        filename !== 'site.yaml' &&
        typeof raw === 'object' &&
        raw !== null &&
        !Array.isArray(raw)
    ) {
        const primary = loadSiteConfig(undefined, root);
        raw.branding = inheritBranding(primary.branding, raw.branding);
    }
    const parsed = siteSchema.safeParse(raw);
    if (!parsed.success) {
        throw new Error(
            `Invalid src/content/${filename}: ${parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`,
        );
    }
    const { 'hero-classes': heroClasses, ...site } = parsed.data;
    const config: SiteConfig = { ...site, heroClasses };
    validateBrandingFiles(config.branding, root, `src/content/${filename}`);
    const environmentBase = process.env.SPROUTSITE_BASE;
    if (environmentBase === undefined) return config;
    const base = siteSchema.shape.base.safeParse(environmentBase);
    if (!base.success)
        throw new Error(
            `Invalid SPROUTSITE_BASE: ${base.error.issues[0]?.message}`,
        );
    return { ...config, base: base.data };
}
