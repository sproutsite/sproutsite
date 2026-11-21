import assert from 'node:assert/strict';

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Check rendered JSON-LD relationships; this is not a full Schema.org validator. */
export function assertStructuredData(
    html: string,
    expected: {
        canonical: string;
        locale: string;
        website: string;
        home: boolean;
        article: boolean;
        noindex?: boolean;
    },
) {
    const scripts = [
        ...html.matchAll(
            /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
        ),
    ];
    assert.equal(
        scripts.length,
        expected.noindex ? 0 : 1,
        `Unexpected JSON-LD count: ${expected.canonical}`,
    );
    if (expected.noindex) return [];
    const data: unknown = JSON.parse(scripts[0]![1]!);
    assert.ok(isObject(data));
    assert.equal(data['@context'], 'https://schema.org');
    assert.ok(Array.isArray(data['@graph']));
    const graph: Record<string, unknown>[] = data['@graph'].map(
        (node: unknown) => {
            assert.ok(isObject(node));
            return node;
        },
    );
    assert.equal(
        graph.length,
        1 + Number(expected.home) + Number(expected.article),
    );
    const page = graph.find((node) => node['@type'] === 'WebPage');
    assert.ok(page);
    assert.equal(page.url, expected.canonical);
    assert.equal(page['@id'], `${expected.canonical}#webpage`);
    assert.equal(page.inLanguage, expected.locale);
    assert.deepEqual(page.isPartOf, { '@id': `${expected.website}#website` });
    assert.equal(typeof page.name, 'string');
    assert.equal(typeof page.description, 'string');
    const website = graph.find((node) => node['@type'] === 'WebSite');
    assert.equal(Boolean(website), expected.home);
    if (website) {
        assert.equal(website.url, expected.website);
        assert.equal(website['@id'], `${expected.website}#website`);
    }
    const article = graph.find((node) => node['@type'] === 'BlogPosting');
    assert.equal(Boolean(article), expected.article);
    if (article) {
        assert.equal(article.url, expected.canonical);
        assert.equal(article.inLanguage, expected.locale);
        assert.equal(typeof article.headline, 'string');
        assert.ok(
            typeof article.datePublished === 'string' &&
                Number.isFinite(Date.parse(article.datePublished)),
        );
        assert.ok(
            typeof article.image === 'string' &&
                /^https?:\/\//.test(article.image),
        );
        assert.deepEqual(article.mainEntityOfPage, {
            '@id': `${expected.canonical}#webpage`,
        });
        assert.deepEqual(page.mainEntity, {
            '@id': `${expected.canonical}#article`,
        });
        assert.equal(article.dateModified, undefined);
    }
    return graph;
}
