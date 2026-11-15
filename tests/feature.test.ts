import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { validateSproutsiteContent } from '../src/lib/sproutsite/validation.js';

test('validates Feature content, variants, and heading levels without executable props', () => {
    const directory = mkdtempSync(join(tmpdir(), 'sproutsite-feature-'));
    try {
        writeFileSync(
            join(directory, 'page.yaml'),
            'title: Features\ndescription: Feature examples.\n',
        );
        const validate = (component: string) => {
            writeFileSync(
                join(directory, '01-feature.mdx'),
                `import { Feature } from 'sproutsite/components';\n\n## Features\n\n${component}\n`,
            );
            validateSproutsiteContent(directory);
        };
        for (const component of [
            '<Feature icon="Zap" title="Static">A short description.</Feature>',
            '<Feature icon="Layers" title="Components" variant="solid" color="secondary" headingLevel={4}>Reusable **Markdown** content.</Feature>',
            '<Feature icon="Code" title="Flexible" variant="plain" headingLevel={6} />',
            '<Feature icon="Zap" title="Hex" color="#abc" />',
            '<Feature icon="Zap" title="Hex" color="#abcf" />',
            '<Feature icon="Zap" title="Hex" color="#527B37" variant="solid" />',
            '<Feature icon="Zap" title="Hex" color="#527b37cc" variant="plain" />',
        ])
            assert.doesNotThrow(() => validate(component));
        for (const props of [
            'title="Missing icon"',
            'icon="Zap"',
            'icon="zap" title="Wrong name"',
            'icon="Zap" title=" "',
            'icon="Zap" title={process.exit()}',
            'icon="Zap" title="Test" variant="unknown"',
            'icon="Zap" title="Test" color="pink"',
            'icon="Zap" title="Test" color="#12"',
            'icon="Zap" title="Test" color="#12345"',
            'icon="Zap" title="Test" color="#gggggg"',
            'icon="Zap" title="Test" color="#fff;display:none"',
            'icon="Zap" title="Test" color={"#fff"}',
            'icon="Zap" title="Test" headingLevel={2}',
            'icon="Zap" title="Test" headingLevel="4"',
            'icon="Zap" title="Test" style="color:red"',
            'icon="Zap" title="Test" {...props}',
        ])
            assert.throws(
                () => validate(`<Feature ${props} />`),
                /Feature requires/,
            );
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});
