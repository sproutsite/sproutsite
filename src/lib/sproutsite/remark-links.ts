import type { Root } from 'mdast';
import { visit } from 'unist-util-visit';
import { contentHref } from './urls.js';
import type { SiteConfig } from './types.js';

export function remarkContentLinks(site: SiteConfig) {
    return (tree: Root, file: { path?: string }) => {
        const locale =
            site.i18n.locales.find((language) =>
                ['md', 'mdx'].some((extension) =>
                    file.path?.endsWith(`.${language}.${extension}`),
                ),
            ) ??
            (site.i18n.locales.includes('en') ? 'en' : site.i18n.defaultLocale);
        const documentSite = { ...site, i18n: { ...site.i18n, locale } };
        visit(tree, 'link', (node) => {
            node.url = contentHref(node.url, documentSite);
        });
    };
}
