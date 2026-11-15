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
            '<Feature icon="Zap" title="Horizontal" layout="horizontal" />',
            '<Feature icon="Layers" title="Vertical" layout="vertical" variant="solid" color="secondary" />',
            '<Feature icon="Code" title="Hex vertical" layout="vertical" color="#527b37" />',
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
            'icon="Zap" title="Test" layout="stacked"',
            'icon="Zap" title="Test" layout={"vertical"}',
            'icon="Zap" title="Test" layout',
            'icon="Zap" title="Test" color="pink"',
            'icon="Zap" title="Test" color="#12"',
            'icon="Zap" title="Test" color="#12345"',
            'icon="Zap" title="Test" color="#gggggg"',
            'icon="Zap" title="Test" color="#fff;display:none"',
            'icon="Zap" title="Test" color={"#fff"}',
            'icon="Zap" title="Test" headingLevel={1}',
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

test('Feature H2 headings can introduce a section without a separate Markdown title', () => {
    const directory = mkdtempSync(
        join(tmpdir(), 'sproutsite-feature-heading-'),
    );
    try {
        writeFileSync(
            join(directory, 'page.yaml'),
            'title: Features\ndescription: Standalone feature headings.\n',
        );
        const section = join(directory, '01-feature.mdx');
        const write = (level: number | undefined, suffix = '') =>
            writeFileSync(
                section,
                `import { Column, Columns } from 'sproutsite/components';\nimport { Feature } from 'sproutsite/components';\n\n<Columns divider>\n<Column span={6}>\n<Feature icon="Zap" title="Static"${level === undefined ? '' : ` headingLevel={${level}}`}>Fast pages.</Feature>\n</Column>\n<Column span={6}>\n<Feature icon="Code" title="Flexible" headingLevel={2}>Reusable components.</Feature>\n</Column>\n</Columns>\n${suffix}`,
            );
        write(2);
        assert.doesNotThrow(() => validateSproutsiteContent(directory));
        write(undefined);
        assert.throws(
            () => validateSproutsiteContent(directory),
            /a section must begin with an h2/,
        );
        write(2, '\n#### Skipped level\n');
        assert.throws(
            () => validateSproutsiteContent(directory),
            /heading level jumps from h2 to h4/,
        );
        writeFileSync(
            section,
            "import { Eyebrow } from 'sproutsite/components';\n\n<Eyebrow>A section without headings</Eyebrow>\n",
        );
        assert.throws(
            () => validateSproutsiteContent(directory),
            /a section must begin with an h2/,
        );
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});
