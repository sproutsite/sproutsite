import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { loadSiteConfig } from './src/lib/sproutsite/site-config.js';
import { copyFileSync, rmSync } from 'node:fs';

const site = loadSiteConfig();

// Separate static entry point: export content without rendering website pages.
export default defineConfig({
    srcDir: './tools/mcp-export',
    outDir: './artifacts/mcp',
    cacheDir: './node_modules/.astro-mcp-export',
    output: 'static',
    // This export has no public assets; do not copy the website's public directory.
    publicDir: './tools/mcp-export/public',
    i18n: {
        locales: site.i18n.locales,
        defaultLocale: site.i18n.defaultLocale,
        routing: { prefixDefaultLocale: false },
    },
    integrations: [
        mdx(),
        {
            name: 'sproutsite/mcp-export-artifact',
            hooks: {
                'astro:build:done': ({ dir }) => {
                    // The snapshot contains text only; imported preview assets are not part of the artifact.
                    rmSync(new URL('_astro/', dir), {
                        recursive: true,
                        force: true,
                    });
                    for (const file of [
                        'LICENSE',
                        'NOTICE',
                        'THIRD_PARTY_NOTICES.md',
                    ])
                        copyFileSync(
                            new URL(file, import.meta.url),
                            new URL(file, dir),
                        );
                },
            },
        },
    ],
});
