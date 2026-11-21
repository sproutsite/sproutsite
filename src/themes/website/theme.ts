import { defaultTheme, type SproutsiteTheme } from 'sproutsite/themes';

/** Website-owned presentation; other components and styles remain inherited. */
export default {
    name: 'sproutsite-website',
    extends: defaultTheme,
    components: {
        Header: new URL('../../components/Header.astro', import.meta.url),
        Footer: new URL('../../components/Footer.astro', import.meta.url),
    },
} satisfies SproutsiteTheme;
