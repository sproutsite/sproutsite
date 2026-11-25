import mdx from '@astrojs/mdx';
import { existsSync, renameSync, rmdirSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import sitemap from '@astrojs/sitemap';
import {
    rehypeHeadingIds,
    unified,
    type ShikiConfig,
} from '@astrojs/markdown-remark';
import tailwindcss from '@tailwindcss/vite';
import tsx from '@shikijs/langs/tsx';
import { rehypeUniqueHeadingIds } from '../lib/sproutsite/rehype-ids.js';
import { rehypeContentTables } from '../lib/sproutsite/rehype-tables.js';
import { rehypeExternalLinks } from '../lib/sproutsite/rehype-links.js';
import { remarkContentLinks } from '../lib/sproutsite/remark-links.js';
import { loadSiteConfig } from '../lib/sproutsite/site-config.js';
import { validateSproutsiteContent } from '../lib/sproutsite/validation.js';
import { createSitemapMetadata } from '../lib/sproutsite/sitemap.js';
import { validateBrandingImages } from '../lib/sproutsite/branding.js';
import { validatePublicBackgroundImage } from '../lib/sproutsite/hero-background.js';
import { colorStyles } from '../themes/default/colors.js';
import { createStylesPlugin } from './styles.js';
import {
    resolveTheme,
    themeAliases,
    themeDataPlugin,
    type SproutsiteTheme,
} from './themes.js';
import {
    resolveComponentAliases,
    type ComponentOverrides,
} from './component-overrides.js';

export interface SproutsiteConfigOptions {
    /** Select a local complete or inherited theme; omission uses default. */
    theme?: SproutsiteTheme;
    /** Project-relative CSS files, loaded after the selected theme in list order. */
    styles?: readonly string[];
    /** Optional website-owned Header/Footer Astro components. */
    components?: ComponentOverrides;
}

/** Returns the Astro shared Astro configuration and selected presentation theme. */
export function createSproutsiteConfig(options: SproutsiteConfigOptions = {}) {
    const theme = resolveTheme(options.theme);
    const stylesPlugin = createStylesPlugin(
        options.styles,
        process.cwd(),
        theme.styles,
    );
    const componentAliases = [
        ...resolveComponentAliases(options.components),
        ...themeAliases(theme),
    ];
    validateSproutsiteContent();
    const site = loadSiteConfig();
    if (theme.colors === 'default') {
        for (const locale of site.i18n.locales)
            colorStyles(
                loadSiteConfig(locale).colors,
                `src/content/site.yaml / site.${locale}.yaml`,
            );
    }
    let sitemapMetadata: ReturnType<typeof createSitemapMetadata> | undefined;

    return {
        site: site.url,
        base: site.base,
        i18n: {
            locales: site.i18n.locales,
            defaultLocale: site.i18n.defaultLocale,
            routing: { prefixDefaultLocale: false },
        },
        integrations: [
            mdx(),
            sitemap({
                namespaces: {
                    news: false,
                    image: false,
                    video: false,
                    xhtml: true,
                },
                serialize: (item) => {
                    sitemapMetadata ??= createSitemapMetadata();
                    const metadata = sitemapMetadata.get(item.url);
                    if (!metadata)
                        throw new Error(
                            `Missing sitemap metadata for ${item.url}`,
                        );
                    return { ...item, ...metadata };
                },
                filter: (page) =>
                    !/\/(?:404|500)(?:-[a-z]{2})?(?:\.html|\/)?$/.test(
                        new URL(page).pathname,
                    ),
            }),
            {
                name: 'sproutsite/default-routes',
                hooks: {
                    'astro:config:setup': async ({ injectRoute }) => {
                        for (const locale of site.i18n.locales) {
                            const localizedSite =
                                locale === site.i18n.defaultLocale
                                    ? site
                                    : loadSiteConfig(locale);
                            await validatePublicBackgroundImage(
                                localizedSite.hero['background-image'],
                            );
                            await validatePublicBackgroundImage(
                                localizedSite.footer['background-image'],
                                undefined,
                                'footer.background-image',
                            );
                            await validateBrandingImages(
                                localizedSite.branding,
                            );
                        }
                        injectRoute({
                            pattern: '/404',
                            entrypoint: new URL('./404.astro', import.meta.url),
                            prerender: true,
                        });
                        injectRoute({
                            pattern: '/500',
                            entrypoint: new URL('./500.astro', import.meta.url),
                            prerender: true,
                        });
                        for (const locale of site.i18n.locales.filter(
                            (locale) => locale !== site.i18n.defaultLocale,
                        )) {
                            for (const status of [404, 500]) {
                                injectRoute({
                                    pattern: `/${locale}/${status}`,
                                    entrypoint: new URL(
                                        `./${status}.astro`,
                                        import.meta.url,
                                    ),
                                    prerender: true,
                                });
                            }
                        }
                        injectRoute({
                            pattern: '/site.webmanifest',
                            entrypoint: new URL(
                                './manifest.ts',
                                import.meta.url,
                            ),
                            prerender: true,
                        });
                    },
                    'astro:build:done': ({ dir }) => {
                        // Keep Astro's XML generation; publish one file when no
                        // splitting is needed, otherwise retain its required chunks.
                        const sitemapIndex = new URL('sitemap-index.xml', dir);
                        const publicSitemap = new URL('sitemap.xml', dir);
                        if (existsSync(new URL('sitemap-1.xml', dir))) {
                            renameSync(sitemapIndex, publicSitemap);
                        } else {
                            renameSync(
                                new URL('sitemap-0.xml', dir),
                                publicSitemap,
                            );
                            unlinkSync(sitemapIndex);
                        }
                        // Astro owns error-page rendering. Flatten localized output
                        // for web servers that select their error documents by locale.
                        for (const locale of site.i18n.locales.filter(
                            (locale) => locale !== site.i18n.defaultLocale,
                        )) {
                            for (const status of [404, 500]) {
                                const flat = new URL(
                                    `${locale}/${status}.html`,
                                    dir,
                                );
                                const nested = new URL(
                                    `${locale}/${status}/index.html`,
                                    dir,
                                );
                                const source = existsSync(flat) ? flat : nested;
                                renameSync(
                                    source,
                                    new URL(`${status}-${locale}.html`, dir),
                                );
                                if (source === nested)
                                    rmdirSync(
                                        fileURLToPath(
                                            new URL(
                                                `${locale}/${status}/`,
                                                dir,
                                            ),
                                        ),
                                    );
                            }
                        }
                    },
                },
            } satisfies AstroIntegration,
        ],
        vite: {
            plugins: [
                stylesPlugin,
                themeDataPlugin(theme.colors),
                tailwindcss(),
            ],
            resolve: { alias: componentAliases },
        },
        markdown: {
            // A high-contrast Shiki theme keeps code comments readable in the
            // documentation as well as in regular content.
            shikiConfig: {
                theme: 'github-dark-high-contrast',
                // MDX embeds TSX lazily; preload it to highlight imports and JSX.
                langs: tsx,
            } satisfies ShikiConfig,
            processor: unified({
                remarkPlugins: [[remarkContentLinks, site]],
                rehypePlugins: [
                    rehypeHeadingIds,
                    rehypeUniqueHeadingIds,
                    rehypeContentTables,
                    [
                        rehypeExternalLinks,
                        {
                            url: site.url,
                            externalNewTab:
                                site.links?.external?.newTab ?? true,
                        },
                    ],
                ],
            }),
        },
    };
}
