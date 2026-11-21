import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { snapshotSchema } from '../tools/mcp-export/schema.js';
import {
    sha256,
    normalizeMarkdown,
    contentHash,
} from '../tools/mcp-export/markdown.js';
import { componentNames } from '../tools/mcp-export/snapshot.js';
import { loadSiteConfig } from '../src/lib/sproutsite/site-config.js';
import { localeOf, logicalId } from '../src/lib/sproutsite/language-links.js';
import { pageDirectoryFromId } from '../src/lib/sproutsite/urls.js';

const artifact = resolve('artifacts/mcp');
assert.deepEqual(
    readdirSync(artifact).sort(),
    [
        'LICENSE',
        'NOTICE',
        'THIRD_PARTY_NOTICES.md',
        'schema.json',
        'snapshot.json',
    ].sort(),
    'MCP artifact must contain only the documented text files.',
);
for (const name of ['LICENSE', 'NOTICE', 'THIRD_PARTY_NOTICES.md'])
    assert.equal(
        readFileSync(resolve(artifact, name), 'utf8'),
        readFileSync(name, 'utf8'),
    );
assert.deepEqual(
    JSON.parse(readFileSync(resolve(artifact, 'schema.json'), 'utf8')),
    z.toJSONSchema(snapshotSchema),
);
const snapshot = snapshotSchema.parse(
    JSON.parse(readFileSync(resolve(artifact, 'snapshot.json'), 'utf8')),
);
assert.equal(
    snapshot.sproutsiteVersion,
    readFileSync('VERSION', 'utf8').trim(),
);
const site = loadSiteConfig();
assert.deepEqual(snapshot.locales, site.i18n.locales);
const expected = readdirSync('src/content/pages', { recursive: true })
    .filter((path): path is string => typeof path === 'string')
    .filter(
        (path) =>
            /^(documentation|showcase)\/(?:.*\/)?page(?:\.de)?\.yaml$/.test(
                path,
            ) &&
            site.i18n.locales.includes(localeOf(path.replace(/\.yaml$/, ''))),
    );
assert.equal(
    snapshot.documents.length,
    expected.length,
    'Every configured documentation and showcase page must be exported.',
);
const ids = new Map(
    snapshot.documents.map((document) => [document.id, document]),
);
assert.deepEqual(
    [...ids.keys()].sort(),
    expected
        .map((path) => {
            const id = path.replace(/\.yaml$/, '');
            return `${pageDirectoryFromId(logicalId(id))}:${localeOf(id)}`;
        })
        .sort(),
    'Export IDs must match the exact configured source-page set.',
);
assert.equal(
    new Set(snapshot.documents.map((document) => document.url)).size,
    snapshot.documents.length,
    'Duplicate canonical URLs in MCP export',
);
assert.equal(ids.size, snapshot.documents.length, 'Duplicate MCP document IDs');
for (const document of snapshot.documents) {
    assert.equal(document.id, `${document.pageId}:${document.locale}`);
    assert.ok(
        document.pageId.startsWith(`${document.kind}/`) ||
            document.pageId === document.kind,
    );
    const { sha256: hash, ...content } = document;
    assert.equal(
        hash,
        contentHash(content),
        `${document.id}: stale document hash`,
    );
    for (const source of document.sourceFiles)
        assert.equal(
            source.sha256,
            sha256(readFileSync(source.path, 'utf8')),
            source.path,
        );
    for (const section of document.sections) {
        for (const example of section.examples)
            assert.equal(
                example.sha256,
                sha256(`${example.language}\n${example.code}`),
            );
        // Normalized Markdown contains no executable MDX wrapper nodes or imports.
        const normalized = normalizeMarkdown(
            section.markdown,
            section.source.path,
            (url) => url,
        );
        assert.equal(normalized.imports.length, 0);
        assert.equal(normalized.unresolvedExpressions.length, 0);
    }
    for (const translation of document.translations) {
        const target = ids.get(translation.id);
        assert.equal(target?.pageId, document.pageId);
        assert.equal(target?.url, translation.url);
        assert.equal(target?.locale, translation.locale);
        assert.ok(target?.translations.some((back) => back.id === document.id));
    }
}
assert.deepEqual(
    snapshot.components.map(({ name }) => name).sort(),
    componentNames(readFileSync('src/package/components.ts', 'utf8')).sort(),
);
for (const component of snapshot.components)
    for (const document of component.documents)
        assert.equal(ids.get(document.id)?.locale, document.locale);
console.log(
    `MCP export verified: schema v${snapshot.schemaVersion}, Sproutsite ${snapshot.sproutsiteVersion}, ${snapshot.documents.length} documents, ${snapshot.components.length} components, ${snapshot.locales.join('/')}.`,
);
if (snapshot.source.commit === null)
    console.log(
        'Git provenance unavailable; commit and dirty are explicitly null.',
    );
