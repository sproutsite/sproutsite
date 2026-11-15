import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { toneOf } from '../src/lib/sproutsite/pages.js';
import { validateSproutsiteContent } from '../src/lib/sproutsite/validation.js';

test('selects tones by the source number, including localized and nested sections', () => {
    const tone = { odd: 'default', even: 'muted' } as const;
    for (const [id, expected] of [
        ['01-first', 'default'],
        ['02-second', 'muted'],
        ['07-later', 'default'],
        ['nested/12-content.de', 'muted'],
        ['2026-11-15.article/03-body.de', 'default'],
    ] as const) {
        assert.equal(toneOf({ id, data: { tone } }), expected);
    }
    assert.equal(toneOf({ id: '02-fixed', data: { tone: 'brand' } }), 'brand');
    assert.equal(toneOf({ id: 'hero', data: { tone: 'muted' } }), 'muted');
    assert.throws(
        () => toneOf({ id: 'hero', data: { tone } }),
        /numbered section/,
    );
});

test('requires complete, valid odd/even mappings and preserves scalar and omitted tones', () => {
    const directory = mkdtempSync(join(tmpdir(), 'sproutsite-section-tone-'));
    try {
        writeFileSync(
            join(directory, 'page.yaml'),
            'title: Tones\ndescription: Alternating surfaces.\n',
        );
        const section = join(directory, '01-content.md');
        const validate = (value: string) => {
            writeFileSync(
                section,
                `---\nfullWidth: true\n${value}\n---\n\n## Content\n\nText.\n`,
            );
            validateSproutsiteContent(directory);
        };
        for (const value of [
            '',
            'tone: default',
            'tone: muted',
            'tone: brand',
            'tone:\n  odd: default\n  even: muted',
            'tone:\n  odd: brand\n  even: default',
        ])
            assert.doesNotThrow(() => validate(value));
        for (const value of [
            'tone:\n  odd: default',
            'tone:\n  even: muted',
            'tone:\n  odd: unknown\n  even: muted',
            'tone:\n  odd: default\n  even: muted\n  extra: brand',
            'tone:\n  - odd: default\n  - even: muted',
            'tone: null',
        ])
            assert.throws(() => validate(value), /invalid frontmatter: tone/);
        validate('tone: default');
        writeFileSync(
            join(directory, 'hero.md'),
            '---\ntitle: Hero\ntone:\n  odd: default\n  even: muted\n---\n',
        );
        assert.throws(
            () => validateSproutsiteContent(directory),
            /hero.md: invalid frontmatter: tone/,
        );
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});
