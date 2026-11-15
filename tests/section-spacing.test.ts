import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { validateSproutsiteContent } from '../src/lib/sproutsite/validation.js';

test('section spacing is optional, uses named presets, and rejects invalid values and hero usage', () => {
    const directory = mkdtempSync(
        join(tmpdir(), 'sproutsite-section-spacing-'),
    );
    try {
        writeFileSync(
            join(directory, 'page.yaml'),
            'title: Spacing\ndescription: Section spacing examples.\n',
        );
        const section = join(directory, '01-content.md');
        const write = (frontmatter: string) =>
            writeFileSync(
                section,
                `---\ntone: default\n${frontmatter}\n---\n\n## Content\n\nA paragraph.\n`,
            );
        for (const frontmatter of [
            '',
            'spacing: small',
            'spacing: default',
            'spacing: large',
        ]) {
            write(frontmatter);
            assert.doesNotThrow(() => validateSproutsiteContent(directory));
        }
        for (const value of ['huge', 'md', 'true', '2', 'null', '""']) {
            write(`spacing: ${value}`);
            assert.throws(
                () => validateSproutsiteContent(directory),
                /01-content\.md: invalid frontmatter: spacing:/,
            );
        }
        write('distance: large');
        assert.throws(() => validateSproutsiteContent(directory), /distance/);
        write('spacing: default');
        writeFileSync(
            join(directory, 'hero.md'),
            '---\ntitle: Start\nspacing: large\n---\n',
        );
        assert.throws(
            () => validateSproutsiteContent(directory),
            /hero\.md: invalid frontmatter:.*spacing/,
        );
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});
