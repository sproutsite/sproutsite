import { defineConfig } from 'astro/config';
import { createSproutsiteConfig } from 'sproutsite/config';
import theme from './src/themes/website/theme';
import { siteSearch } from './src/search/integration';
import { loadSiteConfig } from './src/lib/sproutsite/site-config';

const site = loadSiteConfig();
const config = createSproutsiteConfig({
    theme,
    styles: ['./src/styles/custom.css'],
});

export default defineConfig({
    ...config,
    vite: {
        ...config.vite,
        build: {
            ...config.vite?.build,
            // Serve browser modules as files for the website's CSP.
            assetsInlineLimit: (path) =>
                path.endsWith('.js') ? false : undefined,
        },
    },
    integrations: [
        ...config.integrations,
        ...(site.search?.enabled ? [siteSearch(site)] : []),
    ],
});
