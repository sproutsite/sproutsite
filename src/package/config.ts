import mdx from '@astrojs/mdx';
import { copyFileSync, existsSync, renameSync, rmdirSync } from 'node:fs';
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

/** Returns the Astro configuration required by the default Sproutsite theme. */
export function createSproutsiteConfig() {
    validateSproutsiteContent();
    const site = loadSiteConfig();
    let sitemapMetadata: ReturnType<typeof createSitemapMetadata> | undefined;

    return {
        site: site.url,
        base: site.base,
        i18n: {
            locales: site.locales,
            defaultLocale: site.language,
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
                    'astro:config:setup': ({ injectRoute }) => {
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
                        for (const locale of site.locales.filter(
                            (locale) => locale !== site.language,
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
                        // Keep Astro's index/chunks; expose the single chunk at the
                        // conventional URL, or the index if the site needs chunks.
                        copyFileSync(
                            new URL(
                                existsSync(new URL('sitemap-1.xml', dir))
                                    ? 'sitemap-index.xml'
                                    : 'sitemap-0.xml',
                                dir,
                            ),
                            new URL('sitemap.xml', dir),
                        );
                        // Astro owns error-page rendering. Flatten localized output
                        // for web servers that select their error documents by locale.
                        for (const locale of site.locales.filter(
                            (locale) => locale !== site.language,
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
        vite: { plugins: [tailwindcss()] },
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
                    [rehypeExternalLinks, site.url],
                ],
            }),
        },
    };
}
