import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import { createSproutsiteConfig } from 'sproutsite/config';
import { parse } from 'yaml';
import { siteSearch } from './src/search/integration';
import theme from './src/themes/website/theme';

const site = parse(readFileSync('src/content/site.yaml', 'utf8')) as {
    search?: { enabled?: boolean };
} | null;
const config = createSproutsiteConfig({
    theme,
    styles: ['./src/styles/backgrounds.css', './src/styles/custom.css'],
});

export default defineConfig(
    site?.search?.enabled
        ? {
              ...config,
              integrations: [...config.integrations, siteSearch()],
              vite: {
                  ...config.vite,
                  build: {
                      // Keep browser modules compatible with a strict CSP.
                      assetsInlineLimit: (path) =>
                          path.endsWith('.js') ? false : undefined,
                  },
              },
          }
        : config,
);
