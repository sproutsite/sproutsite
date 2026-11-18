import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { openSync } from 'fontkit';
import { stringify } from 'yaml';
import { loadSiteConfig } from '../src/lib/sproutsite/site-config.js';

test('validates independent heading and eyebrow families, defaults and locale settings', () => {
    const root = mkdtempSync(join(tmpdir(), 'sproutsite-typography-'));
    mkdirSync(join(root, 'src/content'), { recursive: true });
    const configure = (typography?: unknown, locale = 'en') => {
        writeFileSync(
            join(
                root,
                'src/content',
                locale === 'en' ? 'site.yaml' : 'site.de.yaml',
            ),
            stringify({
                name: 'Example',
                url: 'https://example.com',
                base: '/',
                language: locale,
                header: { links: [{ label: 'Home', href: '/' }] },
                footer: { text: 'Footer', links: [] },
                ...(typography === undefined ? {} : { typography }),
            }),
        );
        return loadSiteConfig(locale, root).typography;
    };
    try {
        const serif = { family: 'serif', weight: 500 };
        const sans = { family: 'sans-serif', weight: 600 };
        assert.deepEqual(configure(), { headings: serif, eyebrow: serif });
        assert.deepEqual(configure({ eyebrow: { family: 'sans-serif' } }), {
            headings: serif,
            eyebrow: { family: 'sans-serif', weight: 500 },
        });
        for (const headings of ['serif', 'sans-serif']) {
            for (const eyebrow of ['serif', 'sans-serif']) {
                const selection = {
                    headings: { family: headings, weight: 500 },
                    eyebrow: { family: eyebrow, weight: 700 },
                };
                assert.deepEqual(configure(selection), selection);
            }
        }
        configure({ headings: sans, eyebrow: serif });
        configure({ headings: serif, eyebrow: sans }, 'de');
        assert.deepEqual(loadSiteConfig('en', root).typography, {
            headings: sans,
            eyebrow: serif,
        });
        assert.deepEqual(loadSiteConfig('de', root).typography, {
            headings: serif,
            eyebrow: sans,
        });
        for (const invalid of [
            null,
            'serif',
            [],
            { headings: 'serif' },
            { eyebrow: { family: 'Sans serif' } },
            { headings: null },
            { eyebrow: 123 },
            { heading: 'serif' },
            { headings: { family: 'serif', weight: 300 } },
            { headings: { family: 'serif', weight: 900 } },
            { eyebrow: { family: 'sans-serif', weight: 100 } },
            { eyebrow: { family: 'sans-serif', weight: 1100 } },
            { headings: { weight: '500' } },
            { headings: { weight: 500.5 } },
            { headings: { weight: null } },
            { headings: { fontWeight: 500 } },
        ]) {
            assert.throws(() => configure(invalid), /typography/);
        }
        for (const [family, weights] of [
            ['serif', [400, 500, 675, 800]],
            ['sans-serif', [200, 500, 900, 1000]],
        ] as const) {
            for (const weight of weights) {
                const selected = { family, weight };
                assert.deepEqual(
                    configure({ headings: selected }).headings,
                    selected,
                );
                assert.deepEqual(
                    configure({ eyebrow: selected }).eyebrow,
                    selected,
                );
            }
        }
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('bundled EB Garamond fonts cover required weights and German characters', () => {
    for (const suffix of ['', '-italic']) {
        const font = openSync(
            `src/themes/default/styles/foundation/fonts/eb-garamond-latin-variable${suffix}.woff2`,
        );
        assert.ok('variationAxes' in font);
        assert.equal(font.familyName, 'EB Garamond');
        assert.equal(font.variationAxes.wght?.min, 400);
        assert.equal(font.variationAxes.wght?.max, 800);
        for (const character of 'ÄÖÜäöüß') {
            assert.ok(font.hasGlyphForCodePoint(character.codePointAt(0)!));
        }
    }
});
