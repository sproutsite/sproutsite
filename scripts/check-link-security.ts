import { fromHtml } from 'hast-util-from-html';
import { visit } from 'unist-util-visit';

/** Reject duplicate HTML attributes and validate rendered new-tab anchors. */
export function assertSafeNewTabLinks(html: string, source: string): void {
    const tree = fromHtml(html, {
        onerror(error) {
            if (error.ruleId === 'duplicate-attribute')
                throw new Error(
                    `${source}:${error.line ?? 1}:${error.column ?? 1}: duplicate HTML attribute.`,
                );
        },
    });
    visit(tree, 'element', (node) => {
        if (
            node.tagName !== 'a' ||
            String(node.properties.target ?? '').toLowerCase() !== '_blank'
        )
            return;
        const rel = node.properties.rel;
        const tokens = new Set(
            (Array.isArray(rel) ? rel.join(' ') : String(rel ?? ''))
                .toLowerCase()
                .split(/[\t\n\f\r ]+/),
        );
        if (!tokens.has('noopener') || !tokens.has('noreferrer')) {
            throw new Error(
                `${source}: link "${node.properties.href ?? '(no href)'}" with target="_blank" requires rel="noopener noreferrer".`,
            );
        }
    });
}
