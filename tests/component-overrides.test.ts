import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
    resolveComponentAliases,
    type ComponentOverrides,
} from '../src/package/component-overrides.js';

test('selects Header/Footer independently with project-relative Astro files and default fallbacks', () => {
    const root = mkdtempSync(join(tmpdir(), 'sproutsite-component-slots-'));
    try {
        mkdirSync(join(root, 'src/components'), { recursive: true });
        for (const name of ['Header.astro', 'Custom footer.astro'])
            writeFileSync(
                join(root, 'src/components', name),
                '<header>Website</header>',
            );
        assert.deepEqual(resolveComponentAliases(undefined, root), []);
        assert.deepEqual(resolveComponentAliases({}, root), []);
        assert.deepEqual(
            resolveComponentAliases(
                { Header: undefined, Footer: undefined },
                root,
            ),
            [],
        );
        const header = {
            find: '#sproutsite/header',
            replacement: join(root, 'src/components/Header.astro').replaceAll(
                '\\',
                '/',
            ),
        };
        const footer = {
            find: '#sproutsite/footer',
            replacement: join(
                root,
                'src/components/Custom footer.astro',
            ).replaceAll('\\', '/'),
        };
        assert.deepEqual(
            resolveComponentAliases(
                { Header: './src/components/Header.astro' },
                root,
            ),
            [header],
        );
        assert.deepEqual(
            resolveComponentAliases(
                { Footer: './src/components/Custom footer.astro' },
                root,
            ),
            [footer],
        );
        assert.deepEqual(
            resolveComponentAliases(
                {
                    Header: './src/components/Header.astro',
                    Footer: './src/components/Custom footer.astro',
                },
                root,
            ),
            [header, footer],
        );
        assert.throws(
            () =>
                resolveComponentAliases(
                    { Header: './src/components/missing.astro' },
                    root,
                ),
            /components.Header.*missing.astro/,
        );
        mkdirSync(join(root, 'src/components/directory.astro'));
        assert.throws(
            () =>
                resolveComponentAliases(
                    { Footer: './src/components/directory.astro' },
                    root,
                ),
            /components.Footer.*regular file/,
        );
        for (const invalid of [
            null,
            [],
            'Header.astro',
            { Card: './src/components/Header.astro' },
            { header: './src/components/Header.astro' },
            { Header: null },
            { Header: '' },
            { Footer: 42 },
            { Header: '/absolute.astro' },
            { Header: 'https://example.com/Header.astro' },
            { Header: './Header.ts' },
            { Header: './Header.astro?raw' },
        ])
            assert.throws(
                () =>
                    resolveComponentAliases(
                        invalid as unknown as ComponentOverrides,
                        root,
                    ),
                /components/,
            );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
