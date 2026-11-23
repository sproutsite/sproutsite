import { defaultTheme, type SproutsiteTheme } from 'sproutsite/themes';

export default {
    name: 'website',
    extends: defaultTheme,
    components: {
        Header: new URL('../../components/Header.astro', import.meta.url),
        Footer: new URL('../../components/Footer.astro', import.meta.url),
    },
} satisfies SproutsiteTheme;
