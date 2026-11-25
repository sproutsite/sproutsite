import { defineConfig } from 'astro/config';
import { createSproutsiteConfig } from 'sproutsite/config';
import theme from './src/themes/website/theme';

export default defineConfig(
    createSproutsiteConfig({
        theme,
        styles: ['./src/styles/backgrounds.css', './src/styles/custom.css'],
    }),
);
