import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { parse } from 'yaml';
import type { SiteConfig } from './types.js';
import {
    backgroundPositionFields,
    publicBackgroundImage,
    validatePublicBackground,
} from './hero-background.js';
import { brandingSchema, validateBrandingFiles } from './branding.js';
import { siteColorsSchema } from './site-colors.js';

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
    colors: siteColorsSchema.optional(),
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
            external: z
                .object({
                    newTab: z.boolean().optional(),
                    icon: z.boolean().optional(),
                })
                .strict()
                .optional(),
        })
        .strict()
        .optional(),
    name: z.string().trim().min(1),
    url: z.url(),
    base: z
        .string()
        .regex(/^\/(?:[^/].*)?\/$|^\/$/, 'must be / or begin and end with /'),
    i18n: z
        .object({
            locale: z
                .string()
                .regex(
                    /^[a-z]{2}(?:-[A-Z]{2})?$/,
                    'must be a BCP 47 language tag',
                ),
            defaultLocale: z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/),
            locales: z
                .array(z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/))
                .min(1)
                .refine(
                    (locales) => new Set(locales).size === locales.length,
                    'must contain unique locales',
                ),
        })
        .strict()
        .superRefine((value, context) => {
            for (const field of ['locale', 'defaultLocale'] as const)
                if (!value.locales.includes(value[field]))
                    context.addIssue({
                        code: 'custom',
                        path: [field],
                        message: 'must be included in i18n.locales',
                    });
        }),
    hero: z
        .object({
            classes: z.array(heroClass).max(8).default([]),
            'background-image': publicBackgroundImage.optional(),
            ...backgroundPositionFields,
        })
        .strict()
        .default({ classes: [] }),
    blog: z
        .object({
            hero: z
                .object({
                    title: z.string().trim().min(1),
                    description: z.string().trim().min(1),
                    eyebrow: z.string().trim().min(1),
                })
                .strict(),
            articles: z.object({ heading: z.string().trim().min(1) }).strict(),
        })
        .strict()
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
        'background-image': publicBackgroundImage.nullable().optional(),
        ...backgroundPositionFields,
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

function record(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Config objects inherit fields; arrays, primitives and explicit null replace. */
function mergeConfig(
    base: Record<string, unknown>,
    override: Record<string, unknown>,
): Record<string, unknown> {
    const merged = { ...base };
    for (const [key, value] of Object.entries(override)) {
        if (['__proto__', 'prototype', 'constructor'].includes(key))
            throw new Error(`Unsafe site configuration key: ${key}`);
        merged[key] =
            record(merged[key]) && record(value)
                ? mergeConfig(merged[key], value)
                : value;
    }
    return merged;
}

/** Read old generated projects as well; never combine competing spellings. */
function readConfig(
    source: string,
    primary: boolean,
    defaultLocale?: string,
): Record<string, unknown> {
    const raw: unknown = parse(readFileSync(source, 'utf8'));
    if (!record(raw))
        throw new Error(`Invalid ${source}: expected a configuration object`);
    const result = { ...raw };
    if ('hero-classes' in result)
        throw new Error(
            `Invalid ${source}: hero-classes has moved to hero.classes. Use hero: { classes: [...] }.`,
        );
    if ('language' in result || 'locales' in result) {
        if ('i18n' in result)
            throw new Error(
                `Invalid ${source}: use i18n instead of mixing language/locales with i18n`,
            );
        result.i18n = {
            ...(primary
                ? {
                      defaultLocale: result.language,
                      locales: result.locales ?? [result.language],
                  }
                : {}),
            ...(result.language !== undefined
                ? { locale: result.language }
                : {}),
            ...(!primary && result.locales !== undefined
                ? { locales: result.locales }
                : {}),
            ...(!primary && defaultLocale !== undefined
                ? { defaultLocale }
                : {}),
        };
        delete result.language;
        delete result.locales;
    }
    if (
        record(result.links) &&
        ('externalNewTab' in result.links || 'externalIcon' in result.links)
    ) {
        const { externalNewTab, externalIcon, ...links } = result.links;
        if ('external' in links)
            throw new Error(
                `Invalid ${source}: do not mix legacy link options with links.external`,
            );
        result.links = {
            ...links,
            external: {
                ...(externalNewTab !== undefined
                    ? { newTab: externalNewTab }
                    : {}),
                ...(externalIcon !== undefined ? { icon: externalIcon } : {}),
            },
        };
    }
    const blogInput = result.blog;
    if (
        record(blogInput) &&
        ['title', 'eyebrow', 'description', 'heading'].some(
            (key) => key in blogInput,
        )
    ) {
        const { title, eyebrow, description, heading, ...blog } = blogInput;
        if ('hero' in blog || 'articles' in blog)
            throw new Error(
                `Invalid ${source}: do not mix flat blog options with blog.hero/blog.articles`,
            );
        result.blog = {
            ...blog,
            hero: { title, eyebrow, description },
            articles: { heading },
        };
    }
    return result;
}

function parseConfig(
    raw: Record<string, unknown>,
    filename: string,
    root: string,
): SiteConfig {
    const parsed = siteSchema.safeParse(raw);
    if (!parsed.success)
        throw new Error(
            `Invalid src/content/${filename}: ${parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`,
        );
    const config = parsed.data;
    validatePublicBackground(
        config.hero['background-image'],
        `src/content/${filename}`,
        root,
    );
    validatePublicBackground(
        config.footer['background-image'],
        `src/content/${filename}`,
        root,
        'footer.background-image',
    );
    validateBrandingFiles(config.branding, root, `src/content/${filename}`);
    return config;
}

export function loadSiteConfig(
    locale?: string,
    root = process.cwd(),
): SiteConfig {
    const primaryRaw = readConfig(resolve(root, 'src/content/site.yaml'), true);
    const primary = parseConfig(primaryRaw, 'site.yaml', root);
    if (primary.i18n.locale !== primary.i18n.defaultLocale)
        throw new Error(
            'Invalid src/content/site.yaml: i18n.locale must match i18n.defaultLocale in the base configuration',
        );
    const target = locale ?? primary.i18n.defaultLocale;
    if (!primary.i18n.locales.includes(target))
        throw new Error(
            `Invalid site locale ${target}: must be included in i18n.locales`,
        );
    const filename = `site.${target}.yaml`;
    const localized = resolve(root, 'src/content', filename);
    let config = primary;
    if (
        locale !== undefined &&
        (existsSync(localized) || target !== primary.i18n.defaultLocale)
    ) {
        const layer = existsSync(localized)
            ? readConfig(localized, false, primary.i18n.defaultLocale)
            : {};
        const override = mergeConfig({ i18n: { locale: target } }, layer);
        config = parseConfig(mergeConfig(primaryRaw, override), filename, root);
        if (config.i18n.locale !== target)
            throw new Error(
                `Invalid src/content/${filename}: i18n.locale must be ${target}`,
            );
        for (const field of ['defaultLocale', 'locales'] as const)
            if (
                JSON.stringify(config.i18n[field]) !==
                JSON.stringify(primary.i18n[field])
            )
                throw new Error(
                    `Invalid src/content/${filename}: i18n.${field} must match site.yaml`,
                );
        if (config.url !== primary.url || config.base !== primary.base)
            throw new Error(
                `Invalid src/content/${filename}: url and base must match site.yaml`,
            );
    }
    const environmentBase = process.env.SPROUTSITE_BASE;
    if (environmentBase === undefined) return config;
    const base = siteSchema.shape.base.safeParse(environmentBase);
    if (!base.success)
        throw new Error(
            `Invalid SPROUTSITE_BASE: ${base.error.issues[0]?.message}`,
        );
    return { ...config, base: base.data };
}
