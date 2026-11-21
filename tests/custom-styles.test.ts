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
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createStylesPlugin } from '../src/package/styles.js';

test('preserves the physical theme entry before project styles in configured order', () => {
    const root = mkdtempSync(join(tmpdir(), 'sproutsite-styles-'));
    const entry = fileURLToPath(
        new URL('../src/package/styles.css', import.meta.url),
    );
    const source = readFileSync(entry, 'utf8');
    try {
        mkdirSync(join(root, 'src/styles'), { recursive: true });
        for (const file of ['second.css', 'first override.css'])
            writeFileSync(
                join(root, 'src/styles', file),
                '.ss-card { border-radius: 1rem; }',
            );
        const plugin = createStylesPlugin(
            ['./src/styles/second.css', './src/styles/first override.css'],
            root,
        );
        const css = plugin.transform(source, entry);
        assert.ok(css);
        assert.ok(css.startsWith(source));
        assert.equal(
            plugin.transform(source, entry.replaceAll('/', '\\')),
            css,
        );
        assert.ok(
            source.includes("@import '../themes/default/styles/theme.css';"),
        );
        const imports = css.slice(source.length).trim().split('\n');
        assert.equal(
            imports[0],
            `@import ${JSON.stringify(join(root, 'src/styles/second.css').replaceAll('\\', '/'))};`,
        );
        assert.equal(
            imports[1],
            `@import ${JSON.stringify(join(root, 'src/styles/first override.css').replaceAll('\\', '/'))};`,
        );
        assert.equal(
            createStylesPlugin(undefined, root).transform(source, entry),
            undefined,
        );
        assert.equal(
            plugin.transform(source, join(root, 'unrelated.css')),
            undefined,
        );
        assert.throws(
            () => createStylesPlugin(['./src/styles/missing.css'], root),
            /styles\[0\].*missing.css/,
        );
        mkdirSync(join(root, 'src/styles/directory.css'));
        assert.throws(
            () => createStylesPlugin(['./src/styles/directory.css'], root),
            /regular file/,
        );
        for (const invalid of [
            null,
            './src/styles/second.css',
            [null],
            [123],
            [''],
            ['https://example.com/style.css'],
            ['/absolute.css'],
            ['./src/styles/second.css?inline'],
            ['./src/styles/style.scss'],
        ])
            assert.throws(
                () => createStylesPlugin(invalid as unknown as string[], root),
                /styles/,
            );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
