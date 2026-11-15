import { assemblePages } from './pages.js';
import { blogRouteFromId } from './urls.js';

export function localeOf(id: string): 'en' | 'de' {
    return id.endsWith('.de') ? 'de' : 'en';
}

export function logicalId(id: string): string {
    return id.replace(/\.de$/, '');
}

interface PageEntry {
    id: string;
    data: object;
}

/** Match existing translated content, not URL spelling; never invent routes. */
export function languageLinks(
    pages: PageEntry[],
    posts: { id: string }[],
    locales: readonly string[],
    currentLocale: string,
    currentRoute: string,
) {
    const routes = locales.flatMap((locale) => {
        const localizedPages = assemblePages(
            pages.filter((page) => localeOf(page.id) === locale),
            [],
            undefined,
            (entry) => logicalId(entry.id),
        ).map((page) => ({
            key: `page:${logicalId(page.entry.id)}`,
            locale,
            route: page.route,
        }));
        const localizedPosts = posts
            .filter((post) => localeOf(post.id) === locale)
            .map((post) => ({
                key: `post:${logicalId(post.id)}`,
                locale,
                route: blogRouteFromId(logicalId(post.id)),
            }));
        return [
            ...localizedPages,
            ...localizedPosts,
            { key: 'blog-index', locale, route: '/blog/' },
        ];
    });
    const current = routes.find(
        (page) => page.locale === currentLocale && page.route === currentRoute,
    );
    return locales.map((locale) => ({
        locale,
        route:
            routes.find(
                (page) => page.locale === locale && page.key === current?.key,
            )?.route ?? '/',
        current: locale === currentLocale,
    }));
}
