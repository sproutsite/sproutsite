import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { validateSproutsiteContent } from '../src/lib/sproutsite/validation.js';

test('accepts multiple rows while rejecting invalid Column spans', () => {
    const directory = mkdtempSync(join(tmpdir(), 'sproutsite-columns-'));
    try {
        writeFileSync(
            join(directory, 'page.yaml'),
            'title: Columns\ndescription: Multiple rows of content.\n',
        );
        const section = (span: number) =>
            `import { Column, Columns } from 'sproutsite/components';\n\n## Multiple rows\n\n<Columns>\n${Array.from({ length: 8 }, () => `<Column span={${span}}>\n\nContent\n\n</Column>`).join('\n\n')}\n</Columns>\n`;
        const sectionPath = join(directory, '01-columns.mdx');
        writeFileSync(sectionPath, section(4));
        assert.doesNotThrow(() => validateSproutsiteContent(directory));
        writeFileSync(sectionPath, section(6));
        assert.doesNotThrow(() => validateSproutsiteContent(directory));
        writeFileSync(sectionPath, section(13));
        assert.throws(
            () => validateSproutsiteContent(directory),
            /numeric span prop from 1 to 12/,
        );
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});

test('validates divider flags and custom hex colors without accepting arbitrary CSS or expressions', () => {
    const directory = mkdtempSync(join(tmpdir(), 'sproutsite-dividers-'));
    try {
        writeFileSync(
            join(directory, 'page.yaml'),
            'title: Dividers\ndescription: Responsive dividers.\n',
        );
        const sectionPath = join(directory, '01-dividers.mdx');
        const validate = (props: string) => {
            writeFileSync(
                sectionPath,
                `import { Column, Columns } from 'sproutsite/components';\n\n## Dividers\n\n<Columns ${props}>\n<Column span={6}>\n\nFirst\n\n</Column>\n<Column span={6}>\n\nSecond\n\n</Column>\n</Columns>\n`,
            );
            validateSproutsiteContent(directory);
        };
        for (const props of [
            'divider',
            'divider={true}',
            'divider={false}',
            'divider dividerGap={4}',
            'divider dividerGap={0.5}',
            'divider dividerGap={6} dividerGapMobile={3}',
            'divider dividerGapMobile={1.5}',
            'divider dividerColor="#94a3b8"',
            'dividerColor="#abc"',
            'dividerColor="#abcd"',
            'dividerColor="#AABBCCDD"',
        ]) {
            assert.doesNotThrow(() => validate(props));
        }
        for (const props of [
            'divider="true"',
            'divider={enabled}',
            'dividerGap={0}',
            'dividerGap={-1}',
            'dividerGap={1 + 2}',
            'dividerGap={gap}',
            'dividerGap="4"',
            'dividerGapMobile={0}',
            'dividerGapMobile={-1}',
            'dividerGapMobile={Infinity}',
            'dividerGapMobile={gap}',
            'dividerGapMobile={1 + 2}',
            'dividerGapMobile="3"',
            'dividerGapMobile={3} dividerGapMobile={1.5}',
            'divider divider',
            'dividerColor="red"',
            'dividerColor="#12"',
            'dividerColor="#fff;display:none"',
            'dividerColor={"#fff"}',
            'style="color:red"',
            '{...props}',
        ]) {
            assert.throws(
                () => validate(props),
                /optional divider must be boolean/,
            );
        }
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});
