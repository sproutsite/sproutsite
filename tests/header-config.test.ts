import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { stringify } from 'yaml';
import { loadSiteConfig } from '../src/lib/sproutsite/site-config.js';

test('validates header links, separators, and CTA variants', () => {
    const directory = mkdtempSync(join(tmpdir(), 'sproutsite-header-'));
    const previousDirectory = process.cwd();
    mkdirSync(join(directory, 'src/content'), { recursive: true });
    const link = { label: 'Home', href: '/' };
    const cta = { type: 'cta', label: 'Contact', href: '/contact/' };
    const configure = (links: unknown[]) => {
        writeFileSync(
            join(directory, 'src/content/site.yaml'),
            stringify({
                name: 'Test site',
                url: 'https://example.org',
                base: '/',
                language: 'en',
                header: { links },
                footer: { text: 'Footer', links: [] },
            }),
        );
        return loadSiteConfig().header.links;
    };
    try {
        process.chdir(directory);
        assert.deepEqual(configure([link, { type: 'separator' }, cta]), [
            link,
            { type: 'separator' },
            { ...cta, variant: 'primary' },
        ]);
        assert.deepEqual(configure([{ ...link, type: 'link' }]), [
            { ...link, type: 'link' },
        ]);
        for (const variant of [
            'primary',
            'secondary',
            'accent',
            'neutral',
            'info',
            'success',
            'warning',
            'error',
        ]) {
            assert.deepEqual(configure([{ ...cta, variant }]), [
                { ...cta, variant },
            ]);
        }
        for (const invalid of [
            [{ ...cta, variant: 'unknown' }],
            [{ type: 'cta', label: 'Missing destination' }],
            [{ ...link, type: 'unknown' }],
            [{ ...link, variant: 'primary' }],
            [{ type: 'separator' }],
            ['|'],
        ]) {
            assert.throws(() => configure(invalid), /header.links/);
        }
    } finally {
        process.chdir(previousDirectory);
        rmSync(directory, { recursive: true, force: true });
    }
});
