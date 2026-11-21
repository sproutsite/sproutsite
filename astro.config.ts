import { defineConfig } from 'astro/config';
import { createSproutsiteConfig } from 'sproutsite/config';

export default defineConfig(
    createSproutsiteConfig({
        styles: ['./src/styles/custom.css'],
        components: {
            Header: './src/components/Header.astro',
            Footer: './src/components/Footer.astro',
        },
    }),
);
