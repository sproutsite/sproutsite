import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import test from 'node:test';
import { parse } from 'yaml';
import { unified } from '@astrojs/markdown-remark';
import { loadSiteConfig } from '../src/lib/sproutsite/site-config.js';
import { remarkContentLinks } from '../src/lib/sproutsite/remark-links.js';

function contentFiles(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const path = join(directory, entry.name);
        return entry.isDirectory() ? contentFiles(path) : [path];
    });
}

test('showcase and documentation keep distinct English and German content', () => {
    for (const area of ['showcase', 'documentation']) {
        const files = contentFiles(`src/content/pages/${area}`).filter(
            (path) =>
                ['.md', '.mdx', '.yaml'].includes(extname(path)) &&
                !path.includes('.de.'),
        );
        assert.ok(files.length > 0);
        for (const path of files) {
            const german = path.replace(/\.(mdx?|yaml)$/, '.de.$1');
            assert.ok(existsSync(german), `Missing German content: ${german}`);
            const englishContent = readFileSync(path, 'utf8');
            assert.notEqual(
                englishContent.trim(),
                readFileSync(german, 'utf8').trim(),
                `${path}: English content must not duplicate German content`,
            );
            if (path.endsWith('/page.yaml')) {
                const page = parse(englishContent) as {
                    title: string;
                    description: string;
                    url?: string;
                };
                assert.ok(page.title.trim() && page.description.trim());
                assert.equal(
                    page.url,
                    undefined,
                    `${path}: English routes use English directory names`,
                );
            }
        }
    }
});

test('localized Markdown links preserve language, base, queries, and fragments', async () => {
    const site = { ...loadSiteConfig(), base: '/demo/' };
    const renderer = await unified({
        remarkPlugins: [[remarkContentLinks, site]],
    }).createRenderer({});
    for (const [path, href, expected] of [
        [
            '01-links.md',
            '/documentation/?ref=guide#page-title',
            '/demo/documentation/?ref=guide#page-title',
        ],
        [
            '01-links.de.md',
            '/dokumentation/?ref=guide#page-title',
            '/demo/de/dokumentation/?ref=guide#page-title',
        ],
        ['01-links.de.mdx', '/de/dokumentation/', '/demo/de/dokumentation/'],
        ['01-links.de.md', '#page-title', '#page-title'],
        [
            '01-links.de.md',
            'mailto:hello@example.com',
            'mailto:hello@example.com',
        ],
        ['01-links.md', 'https://example.com/', 'https://example.com/'],
    ]) {
        const { code } = await renderer.render(`[Link](${href})`, {
            fileURL: new URL(`file:///tmp/${path}`),
        });
        assert.ok(
            code.replaceAll('&amp;', '&').includes(`href="${expected}"`),
            `${path}: ${code}`,
        );
    }
});
