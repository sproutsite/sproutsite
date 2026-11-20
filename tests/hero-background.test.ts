import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import type { ImageMetadata } from 'astro';
import { stringify } from 'yaml';
import { loadSiteConfig } from '../src/lib/sproutsite/site-config.js';
import {
    selectHeroBackground,
    validateHeroBackgroundImage,
} from '../src/lib/sproutsite/hero-background.js';

test('hero background precedence distinguishes inherited, local, disabled and absent images', () => {
    const global = '/backgrounds/default.svg';
    const raster: ImageMetadata = {
        src: '/_astro/local.webp',
        width: 1200,
        height: 630,
        format: 'webp',
    };
    assert.equal(selectHeroBackground(undefined, global), global);
    assert.equal(
        selectHeroBackground('/backgrounds/local.svg', global),
        '/backgrounds/local.svg',
    );
    assert.equal(selectHeroBackground(raster, global), raster);
    assert.equal(selectHeroBackground(null, global), null);
    assert.equal(selectHeroBackground(raster, undefined), raster);
    assert.equal(selectHeroBackground(undefined, undefined), undefined);
});

test('global hero images validate public paths, file content and SVG/raster formats', async () => {
    const root = mkdtempSync(join(tmpdir(), 'sproutsite-hero-background-'));
    mkdirSync(join(root, 'src/content'), { recursive: true });
    mkdirSync(join(root, 'public/backgrounds'), { recursive: true });
    const configure = (background: unknown) => {
        writeFileSync(
            join(root, 'src/content/site.yaml'),
            stringify({
                name: 'Website',
                url: 'https://example.com',
                base: '/',
                language: 'en',
                hero: { 'background-image': background },
                header: { links: [{ label: 'Home', href: '/' }] },
                footer: { text: 'Footer', links: [] },
            }),
        );
        return loadSiteConfig(undefined, root);
    };
    try {
        writeFileSync(
            join(root, 'public/backgrounds/default.svg'),
            '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="640"/>',
        );
        cpSync(
            'src/package/starter-assets/public/images/hero.jpg',
            join(root, 'public/backgrounds/photo.jpg'),
        );
        for (const src of [
            '/backgrounds/default.svg',
            '/backgrounds/photo.jpg',
        ]) {
            assert.equal(configure(src).hero['background-image'], src);
            await validateHeroBackgroundImage(src, root);
        }
        for (const src of [
            '',
            null,
            '/backgrounds/missing.svg',
            '../outside.svg',
            '//remote.example/picture.svg',
            'https://example.com/picture.jpg',
            '/backgrounds/default.svg#fragment',
            '/backgrounds/../default.svg',
        ]) {
            assert.throws(() => configure(src), /hero.*background-image/);
        }
        writeFileSync(
            join(root, 'public/backgrounds/corrupt.svg'),
            'not an SVG',
        );
        await assert.rejects(
            validateHeroBackgroundImage('/backgrounds/corrupt.svg', root),
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
