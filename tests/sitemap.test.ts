import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
    mkdirSync,
    mkdtempSync,
    rmSync,
    utimesSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { createSitemapMetadata } from '../src/lib/sproutsite/sitemap.js';

function fixture(locales = ['en', 'de'], base = '/') {
    const root = mkdtempSync(join(tmpdir(), 'sproutsite-sitemap-'));
    const write = (path: string, text: string) => {
        const file = join(root, 'src/content', path);
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, text);
        utimesSync(file, new Date('2020-01-01'), new Date('2020-01-01'));
    };
    for (const locale of locales) {
        write(
            locale === 'en' ? 'site.yaml' : `site.${locale}.yaml`,
            JSON.stringify({
                name: 'Sproutsite',
                url: 'https://example.com',
                base,
                language: locale,
                locales,
                header: { links: [{ label: 'Home', href: '/' }] },
                footer: { text: 'Footer', links: [] },
            }),
        );
        const suffix = locale === 'en' ? '' : `.${locale}`;
        write(`pages/page${suffix}.yaml`, 'title: Home\ndescription: Home');
        write(
            `pages/documentation/page${suffix}.yaml`,
            locale === 'de' ? 'url: dokumentation' : '{}',
        );
        write(
            `pages/documentation/start/page${suffix}.yaml`,
            locale === 'de' ? 'url: einstieg' : '{}',
        );
        write(`blog/2020-01-01.article/page${suffix}.yaml`, '{}');
    }
    write('pages/english-only/page.yaml', '{}');
    return { root, write };
}

test('pairs translated source identities, preserves bases, and never invents missing translations', () => {
    const { root } = fixture(undefined, '/demo/');
    try {
        const metadata = createSitemapMetadata(root);
        const url = 'https://example.com/demo/documentation/start/';
        assert.deepEqual(metadata.get(url)?.links, [
            { lang: 'en', url },
            {
                lang: 'de',
                url: 'https://example.com/demo/de/dokumentation/einstieg/',
            },
            { lang: 'x-default', url },
        ]);
        const single = metadata.get('https://example.com/demo/english-only/');
        assert.equal(
            single?.links?.some((link) => link.lang === 'de'),
            false,
        );
        assert.equal(
            metadata.get('https://example.com/demo/blog/article/')?.links
                ?.length,
            3,
        );
        assert.equal(
            metadata.get('https://example.com/demo/de/blog/')?.links?.length,
            3,
        );
        assert.ok([...metadata.keys()].every((url) => !/404|500/.test(url)));
        assert.equal(metadata.get(url)?.lastmod, '2020-01-01T00:00:00.000Z');
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('supports one language and stable Git dates while detecting local content edits', () => {
    const { root, write } = fixture(['en']);
    const git = (...args: string[]) =>
        execFileSync('git', args, {
            cwd: root,
            stdio: 'ignore',
            env: {
                ...process.env,
                GIT_AUTHOR_DATE: '2021-01-01T00:00:00Z',
                GIT_COMMITTER_DATE: '2021-01-01T00:00:00Z',
            },
        });
    try {
        git('init', '-q');
        git('add', '.');
        git(
            '-c',
            'user.name=Test',
            '-c',
            'user.email=test@example.com',
            '-c',
            'core.hooksPath=/dev/null',
            'commit',
            '-qm',
            'Fixture',
        );
        const url = 'https://example.com/';
        assert.equal(
            createSitemapMetadata(root).get(url)?.lastmod,
            '2021-01-01T00:00:00.000Z',
        );
        write('pages/01-new.md', '## New content');
        const file = join(root, 'src/content/pages/01-new.md');
        utimesSync(file, new Date('2022-01-01'), new Date('2022-01-01'));
        const metadata = createSitemapMetadata(root);
        assert.equal(metadata.get(url)?.lastmod, '2022-01-01T00:00:00.000Z');
        assert.ok([...metadata.keys()].every((url) => !url.includes('/de/')));
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
