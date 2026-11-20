import assert from 'node:assert/strict';
import {
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { stringify } from 'yaml';
import { siteColorsSchema } from '../src/lib/sproutsite/site-colors.js';
import { contrastRatio } from '../src/lib/sproutsite/colors.js';
import { loadSiteConfig } from '../src/lib/sproutsite/site-config.js';
import {
    colorStyles,
    colorVariables,
    defaultColors,
    colorContrastIssues,
} from '../src/themes/default/colors.js';

test('validates partial opaque palettes and rejects unknown fields or CSS expressions', () => {
    assert.deepEqual(siteColorsSchema.parse({ primary: { color: '#ABC' } }), {
        primary: { color: '#ABC' },
    });
    for (const invalid of [
        null,
        [],
        '#123',
        { typo: '#123' },
        { primary: '#123456' },
        { primary: { colour: '#123' } },
        { primary: { color: 'red' } },
        { primary: { color: '#1234' } },
        { brand: { background: '#12345678' } },
        { surfaces: { default: 'var(--test)' } },
        { primary: { color: '#123; color: red' } },
    ])
        assert.equal(siteColorsSchema.safeParse(invalid).success, false);
});

test('palette defaults match the standalone CSS and omission emits no overrides', () => {
    const css =
        readFileSync('src/themes/default/styles/theme.css', 'utf8') +
        readFileSync('src/themes/default/styles/foundation/tokens.css', 'utf8');
    for (const group of Object.keys(
        defaultColors,
    ) as (keyof typeof defaultColors)[]) {
        const variables: Record<string, string> = colorVariables[group];
        for (const [key, value] of Object.entries(defaultColors[group]))
            assert.ok(
                css.includes(`${variables[key]}: ${value};`),
                `Default drift: ${group}.${key}`,
            );
    }
    assert.deepEqual(colorStyles(), {});
    assert.deepEqual(colorContrastIssues(defaultColors), []);
    assert.deepEqual(colorStyles({ primary: { color: '#527b37' } }), {
        '--color-primary': '#527b37',
    });
    assert.deepEqual(colorStyles({ surfaces: { border: '#ccc' } }), {
        '--color-base-300': '#ccc',
    });
});

test('checks real foreground/background pairs, including inherited defaults and running-text links', () => {
    assert.equal(contrastRatio('#000', '#fff'), 21);
    assert.equal(contrastRatio('#123456', '#123456'), 1);
    assert.throws(
        () => colorStyles({ primary: { color: '#fff' } }),
        /colors.primary.content.*21|colors.primary.content.*1.00/,
    );
    assert.throws(
        () => colorStyles({ surfaces: { text: '#eee' } }),
        /colors.surfaces.text/,
    );
    assert.throws(
        () => colorStyles({ primary: { color: '#fff', content: '#000' } }),
        /colors.primary.color.*colors.surfaces/,
    );
    assert.throws(
        () => colorStyles({ brand: { content: '#111' } }),
        /colors.brand.content/,
    );
    assert.throws(
        () => colorStyles({ brand: { highlight: '#071a36' } }),
        /colors.brand.highlight/,
    );
    assert.throws(
        () => colorStyles({ brand: { accent: '#071a36' } }),
        /colors.brand.accent/,
    );
    assert.deepEqual(
        colorContrastIssues({
            primary: { color: '#234e52' },
            brand: { content: '#fff' },
        }),
        [],
    );
});

test('locale palettes inherit individual fields, including an overridden colour with inherited content', () => {
    const root = mkdtempSync(join(tmpdir(), 'sproutsite-palette-'));
    mkdirSync(join(root, 'src/content'), { recursive: true });
    const file = join(root, 'src/content/site.yaml');
    const base = {
        name: 'Website',
        url: 'https://example.com',
        base: '/',
        i18n: { locale: 'en', defaultLocale: 'en', locales: ['en', 'de'] },
        header: { links: [{ label: 'Home', href: '/' }] },
        footer: { text: 'Footer', links: [] },
    };
    try {
        writeFileSync(file, stringify(base));
        assert.equal(loadSiteConfig('en', root).colors, undefined);
        writeFileSync(
            file,
            stringify({
                ...base,
                colors: {
                    primary: { color: '#134b70', content: '#fff' },
                    surfaces: { border: '#ddd' },
                },
            }),
        );
        writeFileSync(
            join(root, 'src/content/site.de.yaml'),
            stringify({ colors: { primary: { color: '#527b37' } } }),
        );
        const german = loadSiteConfig('de', root).colors;
        assert.deepEqual(german, {
            primary: { color: '#527b37', content: '#fff' },
            surfaces: { border: '#ddd' },
        });
        assert.equal(colorStyles(german)['--color-primary'], '#527b37');
        writeFileSync(
            file,
            stringify({ ...base, colors: { surfaces: { text: 'red' } } }),
        );
        assert.throws(
            () => loadSiteConfig('en', root),
            /site.yaml.*colors.surfaces.text/,
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
