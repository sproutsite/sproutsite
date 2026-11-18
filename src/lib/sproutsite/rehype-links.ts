import type { Root } from 'hast';
import { visit } from 'unist-util-visit';
import { isExternalWebLink, secureLinkRel } from './urls.js';

/** Apply the same external-link behavior after Markdown references and autolinks resolve. */
export function rehypeExternalLinks(
    options: string | { url: string; externalNewTab?: boolean },
) {
    const siteUrl = typeof options === 'string' ? options : options.url;
    const externalNewTab =
        typeof options === 'string' || options.externalNewTab !== false;
    return (tree: Root) => {
        visit(tree, 'element', (node) => {
            if (
                node.tagName !== 'a' ||
                typeof node.properties.href !== 'string'
            )
                return;
            if (isExternalWebLink(node.properties.href, siteUrl)) {
                node.properties['data-external-link'] = '';
                if (externalNewTab) node.properties.target = '_blank';
            }
            if (typeof node.properties.target === 'string') {
                const rel = node.properties.rel;
                const safeRel = secureLinkRel(
                    node.properties.target,
                    Array.isArray(rel)
                        ? rel.join(' ')
                        : typeof rel === 'string'
                          ? rel
                          : undefined,
                );
                if (safeRel !== undefined)
                    node.properties.rel = safeRel.split(/\s+/);
            }
        });
    };
}
