import assert from 'node:assert/strict';
import test from 'node:test';
import { languageLinks } from '../src/lib/sproutsite/language-links.js';

const pages = [
    { id: 'page', data: {} },
    { id: 'page.de', data: {} },
    { id: 'documentation/page', data: {} },
    { id: 'documentation/page.de', data: { url: 'dokumentation' } },
    { id: 'documentation/getting-started/page', data: {} },
    { id: 'documentation/getting-started/page.de', data: { url: 'einstieg' } },
    { id: 'only-english/page', data: {} },
];
const posts = [
    { id: '2026-11-15.license' },
    { id: '2026-11-15.license.de' },
    { id: '2026-11-14.english-only' },
];

test('language links match translated page IDs and localized parent URL segments', () => {
    assert.deepEqual(
        languageLinks(
            pages,
            posts,
            ['en', 'de'],
            'en',
            '/documentation/getting-started/',
        ),
        [
            {
                locale: 'en',
                route: '/documentation/getting-started/',
                current: true,
            },
            { locale: 'de', route: '/dokumentation/einstieg/', current: false },
        ],
    );
    assert.equal(
        languageLinks(pages, posts, ['en', 'de'], 'de', '/dokumentation/')[0]
            ?.route,
        '/documentation/',
    );
});

test('language links retain blog overview and article identity', () => {
    for (const route of ['/blog/', '/blog/license/']) {
        assert.ok(
            languageLinks(pages, posts, ['en', 'de'], 'en', route).every(
                (link) => link.route === route,
            ),
        );
    }
});

test('missing translations use the target homepage and a single locale stays visible', () => {
    for (const route of [
        '/only-english/',
        '/blog/english-only/',
        '/unknown/',
    ]) {
        assert.equal(
            languageLinks(pages, posts, ['en', 'de'], 'en', route)[1]?.route,
            '/',
        );
    }
    assert.deepEqual(
        languageLinks(pages, posts, ['en'], 'en', '/documentation/'),
        [{ locale: 'en', route: '/documentation/', current: true }],
    );
});
