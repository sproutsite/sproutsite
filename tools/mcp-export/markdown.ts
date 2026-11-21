import { createHash } from 'node:crypto';
import { basename } from 'node:path';
import GithubSlugger from 'github-slugger';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkStringify from 'remark-stringify';
import { visit } from 'unist-util-visit';
import type { Root, RootContent, PhrasingContent } from 'mdast';
import type { Node as ExpressionNode } from 'estree';
import type { ExportSection } from './schema.js';

type JsonValue =
    | string
    | number
    | boolean
    | null
    | JsonValue[]
    | { [key: string]: JsonValue };
type Jsx = Extract<
    RootContent,
    { type: 'mdxJsxFlowElement' | 'mdxJsxTextElement' }
>;
const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMdx)
    .use(remarkStringify, { fences: true, bullet: '-', listItemIndent: 'one' });

export const sha256 = (value: string) =>
    createHash('sha256').update(value).digest('hex');

/** Object-key ordering must not affect content identity after schema validation. */
export function contentHash(value: unknown): string {
    return sha256(
        JSON.stringify(value, (_key, item: unknown) => {
            if (item && typeof item === 'object' && !Array.isArray(item)) {
                const object = item as Record<string, unknown>;
                return Object.fromEntries(
                    Object.keys(object)
                        .sort()
                        .map((key) => [key, object[key]]),
                );
            }
            return item;
        }),
    );
}

/** Read only literal AST values. Never evaluate MDX or execute imported code. */
function literal(node: ExpressionNode): JsonValue | undefined {
    if (
        node.type === 'Literal' &&
        (node.value === null ||
            ['string', 'number', 'boolean'].includes(typeof node.value))
    )
        return node.value as string | number | boolean | null;
    if (node.type === 'ArrayExpression') {
        const values: JsonValue[] = [];
        for (const item of node.elements) {
            if (!item || item.type === 'SpreadElement') return undefined;
            const value = literal(item);
            if (value === undefined) return undefined;
            values.push(value);
        }
        return values;
    }
    if (node.type === 'ObjectExpression') {
        const result: Record<string, JsonValue> = Object.create(null) as Record<
            string,
            JsonValue
        >;
        for (const property of node.properties) {
            if (
                property.type !== 'Property' ||
                property.computed ||
                property.method ||
                property.kind !== 'init'
            )
                return undefined;
            const key =
                property.key.type === 'Identifier'
                    ? property.key.name
                    : property.key.type === 'Literal'
                      ? property.key.value
                      : undefined;
            const value = literal(property.value);
            if (typeof key !== 'string' || value === undefined)
                return undefined;
            result[key] = value;
        }
        return result;
    }
    return undefined;
}

function attribute(node: Jsx, name: string): JsonValue | undefined {
    const attr = node.attributes.find(
        (item) => item.type === 'mdxJsxAttribute' && item.name === name,
    );
    if (!attr || attr.type !== 'mdxJsxAttribute') return undefined;
    if (typeof attr.value === 'string') return attr.value;
    const statement = attr.value?.data?.estree?.body[0];
    return statement?.type === 'ExpressionStatement'
        ? literal(statement.expression)
        : undefined;
}

function plain(node: RootContent | PhrasingContent): string {
    if ('value' in node && typeof node.value === 'string') return node.value;
    return 'children' in node
        ? node.children.map((child) => plain(child)).join('')
        : '';
}

const paragraph = (value: string): RootContent => ({
    type: 'paragraph',
    children: [{ type: 'text', value }],
});

export function normalizeMarkdown(
    body: string,
    file: string,
    resolveLink: (href: string) => string,
) {
    const tree = processor.parse(body);
    const imports: string[] = [];
    const notices: ExportSection['notices'] = [];
    const unresolvedExpressions: string[] = [];
    const headings: ExportSection['headings'] = [];
    const slugger = new GithubSlugger();
    const prefix = basename(file)
        .replace(/\.(?:md|mdx)$/, '')
        .replace(/[^a-zA-Z0-9-]/g, '-');
    // Preview headings still affect the original website's slug counter.
    const anchors = new WeakMap<object, string>();
    visit(tree, 'heading', (node) => {
        anchors.set(node, `${prefix}-${slugger.slug(plain(node))}`);
    });

    function convert(nodes: RootContent[]): RootContent[] {
        return nodes.flatMap((node): RootContent[] => {
            if (node.type === 'mdxjsEsm') {
                imports.push(node.value);
                return [];
            }
            if (
                node.type === 'mdxFlowExpression' ||
                node.type === 'mdxTextExpression'
            ) {
                if (node.value.trim()) unresolvedExpressions.push(node.value);
                return [];
            }
            if (
                node.type === 'mdxJsxFlowElement' ||
                node.type === 'mdxJsxTextElement'
            ) {
                if (node.name === 'Tabs') {
                    const codeTabs = node.children.filter(
                        (child) =>
                            (child.type === 'mdxJsxFlowElement' ||
                                child.type === 'mdxJsxTextElement') &&
                            child.name === 'Tab' &&
                            attribute(child, 'title') === 'Code',
                    );
                    if (codeTabs.length) return convert(codeTabs);
                }
                const children = convert(node.children as RootContent[]);
                const title = attribute(node, 'title');
                if (
                    ['Feature', 'AccordionItem'].includes(node.name ?? '') &&
                    typeof title === 'string'
                ) {
                    const level = attribute(node, 'headingLevel');
                    children.unshift({
                        type: 'heading',
                        depth:
                            typeof level === 'number' &&
                            level >= 2 &&
                            level <= 6
                                ? (level as 2 | 3 | 4 | 5 | 6)
                                : 3,
                        children: [{ type: 'text', value: title }],
                    });
                }
                if (node.name === 'Card') {
                    const badges = attribute(node, 'badges');
                    for (const badge of Array.isArray(badges)
                        ? badges
                        : badges
                          ? [badges]
                          : []) {
                        if (
                            typeof badge !== 'object' ||
                            badge === null ||
                            Array.isArray(badge) ||
                            typeof badge.text !== 'string'
                        )
                            continue;
                        const text =
                            badge.text +
                            (typeof badge.hover === 'string'
                                ? ` — ${badge.hover}`
                                : '');
                        notices.push({
                            kind: 'badge',
                            text,
                            ...(typeof badge.variant === 'string'
                                ? { variant: badge.variant }
                                : {}),
                        });
                        children.unshift({
                            type: 'blockquote',
                            children: [
                                paragraph(text) as Extract<
                                    RootContent,
                                    { type: 'paragraph' }
                                >,
                            ],
                        });
                    }
                }
                if (node.name === 'Alert') {
                    const text = children.map(plain).join('\n');
                    const variant = attribute(node, 'variant');
                    notices.push({
                        kind: 'alert',
                        text,
                        ...(typeof variant === 'string' ? { variant } : {}),
                    });
                    return [
                        {
                            type: 'blockquote',
                            children: children as Extract<
                                RootContent,
                                { type: 'blockquote' }
                            >['children'],
                        },
                    ];
                }
                if (node.name === 'Icon') {
                    const label = attribute(node, 'label');
                    return typeof label === 'string' ? [paragraph(label)] : [];
                }
                if (node.name === 'ContentImage') {
                    const alt = attribute(node, 'alt');
                    return typeof alt === 'string' ? [paragraph(alt)] : [];
                }
                if (node.name === 'Button') {
                    const href = attribute(node, 'href');
                    if (typeof href === 'string')
                        return [
                            {
                                type: 'paragraph',
                                children: [
                                    {
                                        type: 'link',
                                        url: resolveLink(href),
                                        children: [
                                            {
                                                type: 'text',
                                                value: children
                                                    .map(plain)
                                                    .join(' ')
                                                    .trim(),
                                            },
                                        ],
                                    },
                                ],
                            },
                        ];
                }
                return children;
            }
            if (node.type === 'image')
                return [{ type: 'text', value: node.alt ?? '' } as RootContent];
            if (node.type === 'link' || node.type === 'definition')
                node.url = resolveLink(node.url);
            if (node.type === 'heading') {
                const text = plain(node);
                headings.push({
                    depth: node.depth,
                    text,
                    anchor: anchors.get(node),
                });
            }
            if ('children' in node)
                node.children = convert(
                    node.children as RootContent[],
                ) as typeof node.children;
            return [node];
        });
    }
    const clean: Root = { type: 'root', children: convert(tree.children) };
    const examples: ExportSection['examples'] = [];
    const tables: ExportSection['tables'] = [];
    const seen = new Set<string>();
    const words: string[] = [];
    function collect(nodes: RootContent[]) {
        for (const node of nodes) {
            if ('value' in node && typeof node.value === 'string')
                words.push(node.value);
            if (node.type === 'code') {
                const hash = sha256(`${node.lang ?? 'text'}\n${node.value}`);
                if (!seen.has(hash))
                    examples.push({
                        language: node.lang ?? 'text',
                        code: node.value,
                        sha256: hash,
                    });
                seen.add(hash);
            }
            if (node.type === 'table')
                tables.push({
                    headers: node.children[0]?.children.map(plain) ?? [],
                    rows: node.children
                        .slice(1)
                        .map((row) => row.children.map(plain)),
                });
            if ('children' in node) collect(node.children as RootContent[]);
        }
    }
    collect(clean.children);
    return {
        markdown: processor.stringify(clean).trim(),
        text: words.join(' ').replace(/\s+/g, ' ').trim(),
        imports,
        headings,
        examples,
        tables,
        notices,
        unresolvedExpressions,
    };
}
