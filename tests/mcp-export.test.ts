import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import test from 'node:test';
import type { CollectionEntry } from 'astro:content';
import {
    normalizeMarkdown,
    contentHash,
} from '../tools/mcp-export/markdown.js';
import {
    createSnapshot,
    componentNames,
} from '../tools/mcp-export/snapshot.js';
import { snapshotSchema } from '../tools/mcp-export/schema.js';

test('MCP normalization preserves examples, imports, tables and future-function notices without preview duplication or execution', () => {
    const source = `import { Feature } from 'sproutsite/components';

## Examples

<Alert variant="warning">Open – future capability.</Alert>

<Card badges={{text: 'Partly available', hover: 'Fullscreen remains open.'}}>

### Hero

[Guide](/guide/)

</Card>

<Tabs>
    <Tab title="Preview"><Feature title="Duplicate preview" icon="Zap">Hidden duplicate.</Feature></Tab>
    <Tab title="Code">

\`\`\`mdx
<Feature title="Example" icon="Zap">Use this.</Feature>
\`\`\`

    </Tab>
</Tabs>

| Property | Default |
| --- | --- |
| \x60layout\x60 | \x60horizontal\x60 |

{globalThis.__mcp_export_must_not_execute()}
`;
    const result = normalizeMarkdown(
        source,
        '01-guide.de.mdx',
        (url) => new URL(url, 'https://example.com/demo/').href,
    );
    assert.equal(result.imports.length, 1);
    assert.equal(result.markdown.includes('Duplicate preview'), false);
    assert.equal(result.markdown.includes('<Tabs>'), false);
    assert.equal(result.examples.length, 1);
    assert.equal(
        result.examples[0]?.code,
        '<Feature title="Example" icon="Zap">Use this.</Feature>',
    );
    assert.deepEqual(result.tables, [
        { headers: ['Property', 'Default'], rows: [['layout', 'horizontal']] },
    ]);
    assert.ok(
        result.notices.some(
            (notice) => notice.text === 'Open – future capability.',
        ),
    );
    assert.ok(
        result.notices.some((notice) =>
            notice.text.includes('Fullscreen remains open.'),
        ),
    );
    assert.ok(result.markdown.includes('https://example.com/guide/'));
    assert.equal(result.headings[0]?.anchor, '01-guide-de-examples');
    assert.deepEqual(result.unresolvedExpressions, [
        'globalThis.__mcp_export_must_not_execute()',
    ]);
});

test('MCP normalization keeps preview content when there is no Code tab and deduplicates identical fenced examples', () => {
    const source =
        '<Tabs><Tab title="Preview"><Feature title="A real feature" icon="Zap">Description.</Feature></Tab></Tabs>\n\n```ts\nconst value = 1;\n```\n\n```ts\nconst value = 1;\n```';
    const result = normalizeMarkdown(source, '01-example.mdx', (url) => url);
    assert.ok(result.markdown.includes('A real feature'));
    assert.equal(result.examples.length, 1);
});

test('MCP heading anchors retain original slug counters when duplicate preview headings are removed', () => {
    const source =
        '<Tabs>\n<Tab title="Preview">\n\n## Same heading\n\n</Tab>\n<Tab title="Code">\n\n```mdx\nExample\n```\n\n</Tab>\n</Tabs>\n\n## Same heading\n';
    const result = normalizeMarkdown(source, '02-headings.mdx', (url) => url);
    assert.deepEqual(result.headings, [
        {
            depth: 2,
            text: 'Same heading',
            anchor: '02-headings-same-heading-1',
        },
    ]);
});

test('MCP snapshot scopes content, follows localized parent URLs, pairs translations and exports only documented public components', () => {
    const root = mkdtempSync(join(tmpdir(), 'sproutsite-mcp-'));
    const pages: CollectionEntry<'pages'>[] = [];
    const documents: CollectionEntry<'documents'>[] = [];
    const write = (path: string, content: string) => {
        const file = join(root, path);
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, content);
        return file;
    };
    try {
        write('VERSION', '1.2.3\n');
        write(
            'package.json',
            JSON.stringify({
                name: 'sproutsite',
                version: '1.2.3',
                license: 'Apache-2.0',
                repository: {
                    url: 'https://github.com/sproutsite/sproutsite.git',
                },
            }),
        );
        write(
            'src/package/components.ts',
            "export { default as Feature } from './Feature.astro';\nexport type { Props } from './types';",
        );
        write(
            'src/content/site.yaml',
            JSON.stringify({
                name: 'Example',
                url: 'https://example.com',
                base: '/demo/',
                i18n: {
                    locale: 'en',
                    defaultLocale: 'en',
                    locales: ['en', 'de'],
                },
                header: { links: [{ label: 'Home', href: '/' }] },
                footer: { text: 'Footer', links: [] },
            }),
        );
        for (const locale of ['en', 'de']) {
            const suffix = locale === 'de' ? '.de' : '';
            for (const directory of [
                'documentation',
                'showcase',
                'showcase/features',
                'contact',
            ]) {
                const id = `${directory}/page${suffix}`;
                const url =
                    locale === 'de' && directory === 'documentation'
                        ? 'dokumentation'
                        : undefined;
                pages.push({
                    id,
                    collection: 'pages',
                    filePath: write(
                        `src/content/pages/${id}.yaml`,
                        `title: ${directory}\ndescription: Guide\n`,
                    ),
                    data: {
                        title: directory,
                        description: 'Guide',
                        layout: 'default',
                        url,
                    },
                });
            }
            const id = `showcase/features/01-content${suffix}`;
            const body = '## Properties\n\nUse `layout`.\n';
            documents.push({
                id,
                collection: 'documents',
                filePath: write(`src/content/pages/${id}.md`, body),
                body,
                data: {
                    tone: 'default',
                    type: 'small',
                    spacing: 'default',
                    fullWidth: false,
                },
            });
        }
        write('.env', 'PRIVATE_SECRET=never-export-this\n');
        const snapshot = createSnapshot(pages, documents, root, {
            commit: null,
            dirty: null,
        });
        assert.equal(snapshot.documents.length, 6);
        assert.equal(
            JSON.stringify(snapshot).includes('never-export-this'),
            false,
        );
        assert.equal(
            snapshot.documents.some(({ pageId }) => pageId === 'contact'),
            false,
        );
        const german = snapshot.documents.find(
            ({ id }) => id === 'documentation:de',
        )!;
        assert.equal(german.url, 'https://example.com/demo/de/dokumentation/');
        assert.equal(german.translations[0]?.id, 'documentation:en');
        assert.equal(snapshot.components[0]?.name, 'Feature');
        assert.equal(snapshot.components[0]?.documents.length, 2);
        assert.deepEqual(
            createSnapshot(pages, documents, root, {
                commit: null,
                dirty: null,
            }),
            snapshot,
        );
        const { sha256: hash, ...content } = german;
        assert.equal(hash, contentHash(content));
        assert.equal(
            snapshotSchema.safeParse({ ...snapshot, schemaVersion: 2 }).success,
            false,
        );
        assert.deepEqual(
            componentNames(
                "export {default as Button} from './Button'; export type {Props} from './Props';",
            ),
            ['Button'],
        );
        assert.throws(
            () => componentNames("export * from './components';"),
            /explicit named runtime/,
        );
        assert.throws(
            () => componentNames('export const Button = {};'),
            /explicit named runtime/,
        );
        assert.equal(
            snapshotSchema.safeParse({
                ...snapshot,
                documents: [
                    {
                        ...german,
                        sourceFiles: [
                            {
                                path: 'src/content/pages/documentation/../../.env',
                                sha256: german.sha256,
                            },
                        ],
                    },
                ],
            }).success,
            false,
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
