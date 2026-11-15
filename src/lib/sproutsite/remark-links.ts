import type { Root } from 'mdast';
import { visit } from 'unist-util-visit';
import { contentHref } from './urls.js';
import type { SiteConfig } from './types.js';

export function remarkContentLinks(site: SiteConfig) {
    return (tree: Root, file: { path?: string }) => {
        const locale =
            site.locales.find((language) =>
                ['md', 'mdx'].some((extension) =>
                    file.path?.endsWith(`.${language}.${extension}`),
                ),
            ) ?? site.language;
        const documentSite = { ...site, language: locale };
        visit(tree, 'link', (node) => {
            node.url = contentHref(node.url, documentSite);
        });
    };
}
