import assert from 'node:assert/strict';
import {
    copyFileSync,
    mkdirSync,
    mkdtempSync,
    rmSync,
    symlinkSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { stringify } from 'yaml';
import { loadSiteConfig } from '../src/lib/sproutsite/site-config.js';
import { validateBrandingImages } from '../src/lib/sproutsite/branding.js';
import { withBase } from '../src/lib/sproutsite/urls.js';

test('branding validates public assets, inherits locale overrides and preserves base-independent paths', async () => {
    const root = mkdtempSync(join(tmpdir(), 'sproutsite-branding-'));
    const base = {
        name: 'Independent website',
        url: 'https://example.com',
        base: '/',
        language: 'en',
        locales: ['en', 'de'],
        header: { links: [{ label: 'Home', href: '/' }] },
        footer: { text: 'Footer', links: [] },
    };
    const write = (branding?: unknown, locale = 'en') =>
        writeFileSync(
            join(
                root,
                'src/content',
                locale === 'en' ? 'site.yaml' : 'site.de.yaml',
            ),
            stringify({
                ...base,
                language: locale,
                ...(branding === undefined ? {} : { branding }),
            }),
        );
    mkdirSync(join(root, 'src/content'), { recursive: true });
    mkdirSync(join(root, 'public/branding'), { recursive: true });
    const logo = {
        src: '/branding/logo.svg',
        width: 180,
        height: 48,
        showName: false,
    };
    const image = { src: '/branding/share.png', alt: 'Our website' };
    try {
        writeFileSync(
            join(root, 'public/branding/logo.svg'),
            '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="48"/>',
        );
        copyFileSync(
            'src/package/starter-assets/public/branding/icon-192.png',
            join(root, 'public/branding/share.png'),
        );
        write();
        assert.equal(loadSiteConfig(undefined, root).branding, undefined);
        write({
            logo,
            sharingImage: image,
            icons: { app192: '/branding/share.png' },
        });
        write(
            {
                sharingImage: { alt: 'Unsere Website' },
                logo: { showName: true },
            },
            'de',
        );
        const localized = loadSiteConfig('de', root);
        assert.deepEqual(localized.branding?.logo, { ...logo, showName: true });
        assert.deepEqual(localized.branding?.sharingImage, {
            ...image,
            alt: 'Unsere Website',
        });
        assert.equal(
            loadSiteConfig(undefined, root).branding?.sharingImage?.alt,
            image.alt,
        );
        assert.equal(
            withBase(localized.branding!.logo!.src, '/demo/'),
            '/demo/branding/logo.svg',
        );
        await validateBrandingImages(localized.branding, root);
        for (const invalid of [
            { unexpected: true },
            { logo: { ...logo, width: 0 } },
            { logo: { ...logo, showName: 'yes' } },
            { sharingImage: { ...image, alt: '' } },
            { logo: { ...logo, src: '/missing.svg' } },
            ...[
                '../logo.svg',
                '/branding/../logo.svg',
                '//remote.example/logo.svg',
                'https://example.com/logo.svg',
                '/branding/logo.svg?x=1',
                '/branding/%2e%2e/logo.svg',
                '/branding/logo.svg#x',
                '/branding//logo.svg',
                '/branding\\logo.svg',
            ].map((src) => ({ logo: { ...logo, src } })),
            {
                sharingImage: {
                    src: logo.src,
                    alt: 'SVG is not a sharing image',
                },
            },
            { icons: { appleTouch: logo.src } },
        ]) {
            write(invalid);
            assert.throws(() => loadSiteConfig(undefined, root), /branding/);
        }
        symlinkSync(
            resolve('package.json'),
            join(root, 'public/branding/outside.svg'),
        );
        write({ logo: { ...logo, src: '/branding/outside.svg' } });
        assert.throws(() => loadSiteConfig(undefined, root), /inside public/);
        writeFileSync(
            join(root, 'public/branding/corrupt.png'),
            'not an image',
        );
        write({ icons: { app192: '/branding/corrupt.png' } });
        await assert.rejects(
            validateBrandingImages(
                loadSiteConfig(undefined, root).branding,
                root,
            ),
            /branding.icons.app192/,
        );
        write({ icons: { appleTouch: '/branding/share.png' } });
        await assert.rejects(
            validateBrandingImages(
                loadSiteConfig(undefined, root).branding,
                root,
            ),
            /180 × 180/,
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
