import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import { createSproutsiteConfig } from 'sproutsite/config';
import theme from './src/themes/website/theme';
import { siteSearch } from './starters/minimal/common/src/search/integration';
import { loadSiteConfig } from './src/lib/sproutsite/site-config';
import { contentHref } from './src/lib/sproutsite/urls';

const site = loadSiteConfig();
const searchRoots = site.i18n.locales.flatMap((locale) => {
    const localized =
        locale === site.i18n.defaultLocale ? site : loadSiteConfig(locale);
    const documentation =
        locale === 'de' ? '/dokumentation/' : '/documentation/';
    return [documentation, '/showcase/'].map(
        (path) => '/' + contentHref(path, localized).slice(site.base.length),
    );
});
const config = createSproutsiteConfig({
    theme,
    styles: ['./src/styles/custom.css'],
});

export default defineConfig({
    ...config,
    vite: {
        ...config.vite,
        resolve: {
            ...config.vite.resolve,
            alias: [
                ...config.vite.resolve.alias,
                // The starter's package.json defines a separate npm package scope.
                {
                    find: 'sproutsite/components',
                    replacement: fileURLToPath(
                        new URL('./src/package/components.ts', import.meta.url),
                    ),
                },
                {
                    find: 'sproutsite/default-components',
                    replacement: fileURLToPath(
                        new URL(
                            './src/package/default-components.ts',
                            import.meta.url,
                        ),
                    ),
                },
            ],
        },
        build: {
            // Serve browser modules as files for the website's CSP.
            assetsInlineLimit: (path) =>
                path.endsWith('.js') ? false : undefined,
        },
    },
    integrations: [
        ...config.integrations,
        ...(site.search?.enabled
            ? [
                  siteSearch((url) =>
                      searchRoots.some((root) => url.startsWith(root)),
                  ),
              ]
            : []),
    ],
});
