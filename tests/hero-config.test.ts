import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { stringify } from 'yaml';
import { loadSiteConfig } from '../src/lib/sproutsite/site-config.js';

test('global hero.classes validates grouped settings, defaults, locale values and migration errors', () => {
    const root = mkdtempSync(join(tmpdir(), 'sproutsite-hero-config-'));
    mkdirSync(join(root, 'src/content'), { recursive: true });
    const configure = (extra: Record<string, unknown> = {}, locale = 'en') => {
        writeFileSync(
            join(
                root,
                'src/content',
                locale === 'en' ? 'site.yaml' : 'site.de.yaml',
            ),
            stringify({
                name: 'Website',
                url: 'https://example.com',
                base: '/',
                language: locale,
                locales: ['en', 'de'],
                header: { links: [{ label: 'Home', href: '/' }] },
                footer: { text: 'Footer', links: [] },
                ...extra,
            }),
        );
        return loadSiteConfig(locale, root);
    };
    try {
        assert.deepEqual(configure().hero, { classes: [] });
        assert.deepEqual(configure({ hero: {} }).hero, { classes: [] });
        const classes = ['ss-hero--theme-1', 'ss-custom_texture'];
        assert.deepEqual(
            configure({ hero: { classes } }).hero.classes,
            classes,
        );
        assert.deepEqual(
            configure({ hero: { classes: [] } }, 'de').hero.classes,
            [],
        );
        assert.deepEqual(loadSiteConfig(undefined, root).hero.classes, classes);
        for (const hero of [
            null,
            [],
            'ss-hero--theme-1',
            { classes: null },
            { classes: 'ss-hero--theme-1' },
            { classes: ['custom'] },
            { classes: ['ss-Invalid'] },
            { classes: Array(9).fill('ss-valid') },
            { other: [] },
        ]) {
            assert.throws(() => configure({ hero }), /hero/);
        }
        assert.throws(
            () => configure({ 'hero-classes': ['ss-hero--theme-1'] }),
            /site.yaml: hero-classes has moved to hero.classes/,
        );
        assert.throws(
            () => configure({ 'hero-classes': [], hero: { classes: [] } }),
            /hero.classes/,
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
