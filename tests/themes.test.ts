import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import test from 'node:test';
import {
    defaultTheme,
    resolveTheme,
    themeAliases,
    type SproutsiteTheme,
} from '../src/package/themes.js';
import { createStylesPlugin } from '../src/package/styles.js';

test('themes inherit components individually and append CSS base to child to website', () => {
    const root = mkdtempSync(join(tmpdir(), 'sproutsite-themes-'));
    try {
        const file = (name: string) => {
            const path = join(root, name);
            writeFileSync(path, '');
            return pathToFileURL(path);
        };
        const parent: SproutsiteTheme = {
            name: 'parent',
            extends: defaultTheme,
            styles: [file('parent.css')],
            components: { Header: file('Header.astro') },
        };
        const child: SproutsiteTheme = {
            name: 'child',
            extends: parent,
            styles: [file('child.css')],
            components: { Footer: file('Footer.astro') },
        };
        const result = resolveTheme(child);
        assert.equal(result.colors, 'default');
        assert.equal(
            result.components.Header,
            fileURLToPath(parent.components!.Header!),
        );
        assert.equal(
            result.components.Footer,
            fileURLToPath(child.components!.Footer!),
        );
        assert.equal(result.components.Hero, resolveTheme().components.Hero);
        assert.deepEqual(
            result.styles.map((p) => p.split('/').at(-1)),
            ['theme.css', 'parent.css', 'child.css'],
        );
        file('site.css');
        const css = createStylesPlugin(
            ['./site.css'],
            root,
            result.styles,
        ).transform(
            'OLD',
            fileURLToPath(
                new URL('../src/package/styles.css', import.meta.url),
            ),
        )!;
        assert.ok(css.indexOf('parent.css') < css.indexOf('child.css'));
        assert.ok(css.indexOf('child.css') < css.indexOf('site.css'));
        assert.equal(css.includes('OLD'), false);
        assert.equal(
            themeAliases(result).find((a) => a.find === '#sproutsite/header')
                ?.replacement,
            result.components.Header,
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('independent themes have no implicit CSS or palette and must supply every component', () => {
    const result = resolveTheme({
        name: 'independent',
        components: { ...defaultTheme.components },
    });
    assert.deepEqual(result.styles, []);
    assert.equal(result.colors, 'none');
    assert.throws(
        () => resolveTheme({ name: 'incomplete' }),
        /missing component Layout/,
    );
    const css = createStylesPlugin([], process.cwd(), []).transform(
        'DEFAULT CSS',
        fileURLToPath(new URL('../src/package/styles.css', import.meta.url)),
    );
    assert.equal(css?.trim(), '');
    assert.equal(
        resolveTheme({
            name: 'no-colors',
            extends: defaultTheme,
            colors: 'none',
        }).colors,
        'none',
    );
});

test('theme validation rejects cycles, typos, malformed objects and unusable files', () => {
    const cycle: SproutsiteTheme = { name: 'cycle' };
    cycle.extends = cycle;
    assert.throws(() => resolveTheme(cycle), /Circular/);
    for (const theme of [
        null,
        [],
        { name: 'Bad Name' },
        { name: 'bad', unknown: true },
        { name: 'bad', extends: null },
        { name: 'bad', colors: 'automatic' },
        { name: 'bad', components: [] },
        {
            name: 'bad',
            components: { Unknown: defaultTheme.components.Header },
        },
        { name: 'bad', styles: 'theme.css' },
        { name: 'bad', styles: [new URL('https://example.com/theme.css')] },
        { name: 'bad', styles: [new URL('./missing.css', import.meta.url)] },
        { name: 'bad', styles: [new URL('./themes.test.ts', import.meta.url)] },
        {
            name: 'bad',
            components: {
                Header: new URL('./Header.astro?raw', import.meta.url),
            },
        },
    ]) {
        assert.throws(() => resolveTheme(theme as unknown as SproutsiteTheme));
    }
});
