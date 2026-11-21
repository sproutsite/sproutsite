import assert from 'node:assert/strict';
import test from 'node:test';
import {
    createStructuredData,
    serializeStructuredData,
} from '../src/lib/sproutsite/structured-data.js';
import { blogAuthorSchema } from '../src/lib/sproutsite/blog-author.js';
import type { SiteConfig } from '../src/lib/sproutsite/types.js';

const site: SiteConfig = {
    name: 'Example',
    url: 'https://example.com',
    base: '/demo/',
    i18n: { locale: 'en', defaultLocale: 'en', locales: ['en', 'de'] },
    hero: { classes: [] },
    typography: {
        headings: { family: 'serif', weight: 500 },
        eyebrow: { family: 'serif', weight: 500 },
    },
    header: { links: [] },
    footer: { text: 'Example', links: [] },
};
const input = { site, title: 'Home', description: 'About Example', route: '/' };

test('structured data shares one website identity and preserves localized canonical URLs', () => {
    const home = createStructuredData(input)!;
    assert.deepEqual(
        home['@graph'].map((node) => node['@type']),
        ['WebSite', 'WebPage'],
    );
    assert.deepEqual(home['@graph'][0], {
        '@type': 'WebSite',
        '@id': 'https://example.com/demo/#website',
        url: 'https://example.com/demo/',
        name: 'Example',
        description: input.description,
        inLanguage: ['en', 'de'],
    });
    const german = createStructuredData({
        ...input,
        site: { ...site, i18n: { ...site.i18n, locale: 'de' } },
        title: 'Anleitung',
        route: '/dokumentation/',
    })!;
    assert.deepEqual(german['@graph'], [
        {
            '@type': 'WebPage',
            '@id': 'https://example.com/demo/de/dokumentation/#webpage',
            url: 'https://example.com/demo/de/dokumentation/',
            name: 'Anleitung',
            description: input.description,
            inLanguage: 'de',
            isPartOf: { '@id': 'https://example.com/demo/#website' },
        },
    ]);
    const germanDefault = createStructuredData({
        ...input,
        site: {
            ...site,
            base: '/',
            i18n: { locale: 'de', defaultLocale: 'de', locales: ['de', 'en'] },
        },
    })!;
    assert.equal(germanDefault['@graph'][0]?.['@type'], 'WebSite');
});

test('blog markup uses actual article data and omits inferred authors, modification dates and publishers', () => {
    const article = {
        headline: 'Visible headline',
        datePublished: new Date('2026-01-02'),
        image: '/demo/_astro/article.webp',
    };
    const data = createStructuredData({
        ...input,
        route: '/blog/article/',
        article,
    })!;
    const blog = data['@graph'].find((node) => node['@type'] === 'BlogPosting');
    assert.deepEqual(blog, {
        '@type': 'BlogPosting',
        '@id': 'https://example.com/demo/blog/article/#article',
        url: 'https://example.com/demo/blog/article/',
        headline: article.headline,
        description: input.description,
        inLanguage: 'en',
        datePublished: '2026-01-02T00:00:00.000Z',
        image: 'https://example.com/demo/_astro/article.webp',
        mainEntityOfPage: {
            '@id': 'https://example.com/demo/blog/article/#webpage',
        },
    });
    const author = {
        name: 'Example Author',
        url: 'https://example.org/author/',
    };
    const withAuthor = createStructuredData({
        ...input,
        route: '/blog/article/',
        article: { ...article, author },
    })!;
    assert.ok(
        serializeStructuredData(withAuthor).includes(
            '"author":{"@type":"Person","name":"Example Author","url":"https://example.org/author/"}',
        ),
    );
    assert.equal(
        createStructuredData({ ...input, noindex: true, article }),
        undefined,
    );
});

test('JSON-LD cannot break out of its inert script element through content strings', () => {
    const title =
        '</script><script>alert("unsafe")</script><img src=x onerror=alert(1)>';
    const data = createStructuredData({ ...input, title })!;
    const encoded = serializeStructuredData(data);
    assert.equal(encoded.includes('<'), false);
    assert.deepEqual(JSON.parse(encoded), data);
});

test('public author metadata rejects empty names, unsupported protocols and unknown fields', () => {
    assert.deepEqual(blogAuthorSchema.parse({ name: ' Example Author ' }), {
        name: 'Example Author',
    });
    for (const value of [
        { name: '' },
        { name: 'Author', url: 'javascript:alert(1)' },
        { name: 'Author', url: '/author/' },
        { name: 'Author', address: 'Private' },
    ])
        assert.equal(blogAuthorSchema.safeParse(value).success, false);
});
