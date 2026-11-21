import assert from 'node:assert/strict';
import test from 'node:test';
import { fromHtml } from 'hast-util-from-html';
import { visit } from 'unist-util-visit';
import { assertSafeNewTabLinks } from '../scripts/check-link-security.js';
import { secureLinkRel } from '../src/lib/sproutsite/urls.js';
import { rehypeExternalLinks } from '../src/lib/sproutsite/rehype-links.js';

test('rejects duplicate HTML attributes before the parser discards them', () => {
    for (const html of [
        '<a href="/" target="_blank" TARGET="_self" rel="noopener noreferrer">Link</a>',
        '<a href="/" rel="noopener" rel="noreferrer">Link</a>',
        '<div id="first" ID="second">Content</div>',
    ])
        assert.throws(
            () => assertSafeNewTabLinks(html, 'dist/example/index.html'),
            /dist\/example\/index.html:\d+:\d+: duplicate HTML attribute/,
        );
    assert.doesNotThrow(() =>
        assertSafeNewTabLinks(
            '<!-- <a target="_blank" target="_self"> -->' +
                '<pre>&lt;a rel="noopener" rel="noreferrer"&gt;</pre>' +
                '<a href="/" data-example=\'target="_blank" target="_self"\'>Example</a>',
            'test.html',
        ),
    );
});

test('rejects unsafe new-tab links regardless of origin or attribute formatting', () => {
    for (const html of [
        '<a href="/internal/" target="_blank">Internal</a>',
        "<a rel='noopener' target='_blank' href='https://other.test/'>External</a>",
        '<a href="mailto:hello@example.com" target=_blank rel=noreferrer>Email</a>',
        '<a\nTARGET="_BLANK"\nREL="nofollow">Link</a>',
        '<a target="_blank" rel="noopener\u00a0noreferrer">Invalid token separator</a>',
    ]) {
        assert.throws(
            () => assertSafeNewTabLinks(html, 'dist/example/index.html'),
            /dist\/example\/index.html:.*requires rel="noopener noreferrer"/,
        );
    }
});

test('accepts safe new tabs and ignores ordinary links, comments and escaped examples', () => {
    assert.doesNotThrow(() =>
        assertSafeNewTabLinks(
            [
                '<a href="/internal/" target="_blank" rel="noreferrer nofollow noopener">Safe</a>',
                "<a href='https://other.test/' rel='NOOPENER NOREFERRER' target='_BLANK'>Safe</a>",
                '<a href="/internal/">Internal</a>',
                '<a href="/internal/" target="_self">Same tab</a>',
                '<!-- <a target="_blank">Comment</a> -->',
                '<pre>&lt;a target="_blank"&gt;Example&lt;/a&gt;</pre>',
            ].join('\n'),
            'test.html',
        ),
    );
});

test('secures explicitly requested tabs while preserving other relationships', () => {
    assert.equal(secureLinkRel('_blank', undefined), 'noopener noreferrer');
    assert.equal(
        secureLinkRel('_BLANK', 'nofollow noopener'),
        'nofollow noopener noreferrer',
    );
    assert.equal(secureLinkRel('_self', 'nofollow'), 'nofollow');
    assert.equal(secureLinkRel(undefined, undefined), undefined);
});

test('secures an explicit internal Markdown new tab even when automatic external tabs are disabled', () => {
    const tree = fromHtml(
        '<a href="/internal/" target="_blank" rel="nofollow">Internal</a>',
    );
    rehypeExternalLinks({ url: 'https://example.com', externalNewTab: false })(
        tree,
    );
    let checked = false;
    visit(tree, 'element', (node) => {
        if (node.tagName !== 'a') return;
        assert.deepEqual(node.properties.rel, [
            'nofollow',
            'noopener',
            'noreferrer',
        ]);
        checked = true;
    });
    assert.ok(checked);
});
