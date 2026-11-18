import assert from 'node:assert/strict';
import test from 'node:test';
import { unified } from '@astrojs/markdown-remark';
import {
    externalLinkAttributes,
    isExternalWebLink,
} from '../src/lib/sproutsite/urls.js';
import { rehypeExternalLinks } from '../src/lib/sproutsite/rehype-links.js';

test('classifies external web links against the production origin', () => {
    const site = 'https://example.com';
    for (const href of [
        'https://docs.astro.build/',
        'http://other.test/',
        'https://example.com.evil.test/',
        'https://example.com@other.test/',
        'https://sub.example.com/',
        'https://example.com:8443/',
    ])
        assert.equal(isExternalWebLink(href, site), true, href);
    for (const href of [
        '/faq/',
        '/demo/faq/?ref=docs#page-title',
        '#main-content',
        '?next=https://other.test/',
        'https://example.com/faq/',
        'HTTPS://EXAMPLE.COM:443/faq/',
        'mailto:hallo@other.test',
        'tel:+4930123456',
    ])
        assert.equal(isExternalWebLink(href, site), false, href);
});

test('native anchors can opt out of automatic external tab attributes', () => {
    const site = { url: 'https://example.com' };
    assert.deepEqual(externalLinkAttributes('https://other.test/', site), {
        'data-external-link': '',
        target: '_blank',
        rel: 'noopener noreferrer',
    });
    assert.deepEqual(
        externalLinkAttributes('https://other.test/', {
            ...site,
            links: { externalNewTab: false },
        }),
        { 'data-external-link': '' },
    );
    for (const href of [
        '/faq/',
        'https://example.com/',
        'mailto:hello@example.com',
        'tel:+4930123456',
    ]) {
        assert.deepEqual(externalLinkAttributes(href, site), {});
    }
});

test('Markdown external links retain native tab behavior when automatic tabs are disabled', async () => {
    const renderer = await unified({
        rehypePlugins: [
            [
                rehypeExternalLinks,
                { url: 'https://example.com', externalNewTab: false },
            ],
        ],
    }).createRenderer({});
    const { code } = await renderer.render('[External](https://other.test/)');
    assert(!code.includes('target='));
    assert(!code.includes('rel='));
    assert(code.includes('data-external-link'));
});

test('renders direct, reference and autolinks with the required external attributes', async () => {
    const renderer = await unified({
        rehypePlugins: [[rehypeExternalLinks, 'https://example.com']],
    }).createRenderer({});
    const { code } = await renderer.render(
        [
            '[Direct](https://docs.astro.build/)',
            '[Reference][documentation]',
            '<https://other.test/>',
            '[Internal](/faq/)',
            '[Same origin](https://example.com/info/)',
            '[Mail](mailto:hello@other.test)',
            '[Telephone](tel:+4930123456)',
            '[documentation]: https://docs.astro.build/en/guides/markdown-content/',
        ].join('\n\n'),
    );
    const anchors = Array.from(
        code.matchAll(/<a\b([^>]*)>(.*?)<\/a>/g),
        (match) => ({ attributes: match[1], label: match[2] }),
    );
    assert.equal(anchors.length, 7);
    for (const anchor of anchors) {
        if (
            ['Direct', 'Reference', 'https://other.test/'].includes(
                anchor.label,
            )
        ) {
            assert(anchor.attributes.includes('target="_blank"'), anchor.label);
            assert(
                anchor.attributes.includes('rel="noopener noreferrer"'),
                anchor.label,
            );
        } else {
            assert(!anchor.attributes.includes('target='), anchor.label);
            assert(!anchor.attributes.includes('rel='), anchor.label);
        }
    }
});
