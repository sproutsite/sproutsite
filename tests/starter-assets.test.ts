import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
    cpSync,
    mkdtempSync,
    readFileSync,
    readdirSync,
    rmSync,
    mkdirSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, relative } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import { imageMetadata } from 'astro/assets/utils';
import { stringify } from 'yaml';
import { loadSiteConfig } from '../src/lib/sproutsite/site-config.js';
import { validateBrandingImages } from '../src/lib/sproutsite/branding.js';

test('public starter export contains a licensed, complete, copyable asset set with valid images and configuration', async () => {
    const require = createRequire(import.meta.url);
    const manifestFile = require.resolve('sproutsite/starter-assets');
    const source = resolve('src/package/starter-assets');
    assert.equal(manifestFile, join(source, 'manifest.json'));
    const manifest = JSON.parse(readFileSync(manifestFile, 'utf8')) as {
        schemaVersion: number;
        publicDirectory: string;
        license: string;
        branding: unknown;
        files: { path: string; sha256: string }[];
        heroExample: {
            source: string;
            contentDestination: string;
            frontmatter: { 'background-image': string; classes: null };
        };
    };
    assert.equal(manifest.schemaVersion, 1);
    assert.equal(manifest.license, 'Apache-2.0');
    const directory = join(source, manifest.publicDirectory);
    const paths = manifest.files.map((file) => file.path);
    assert.deepEqual(
        paths,
        readdirSync(directory, { recursive: true })
            .filter(
                (file) =>
                    typeof file === 'string' &&
                    !['branding', 'images'].includes(file),
            )
            .sort(),
    );
    assert.equal(new Set(paths).size, paths.length);
    for (const file of manifest.files) {
        const path = resolve(directory, file.path);
        assert.ok(!relative(directory, path).startsWith('..'));
        const data = readFileSync(path);
        assert.equal(
            createHash('sha256').update(data).digest('hex'),
            file.sha256,
            `Stale starter asset: ${file.path}`,
        );
    }
    assert.equal(
        readFileSync(join(directory, 'LICENSE.txt'), 'utf8'),
        readFileSync('LICENSE', 'utf8'),
    );
    const logo = readFileSync(join(directory, 'branding/logo.svg'));
    for (const alias of ['branding/logo-light.svg', 'branding/favicon.svg']) {
        assert.deepEqual(readFileSync(join(directory, alias)), logo, alias);
    }
    const dimensions: Record<string, number[]> = {
        'branding/favicon-16.png': [16, 16],
        'branding/favicon-32.png': [32, 32],
        'branding/apple-touch-icon.png': [180, 180],
        'branding/icon-192.png': [192, 192],
        'branding/icon-512.png': [512, 512],
        'branding/sharing-image.png': [1200, 630],
        'images/hero.jpg': [1920, 645],
        'images/footer.webp': [1920, 640],
    };
    for (const [file, expected] of Object.entries(dimensions)) {
        const metadata = await imageMetadata(
            readFileSync(join(directory, file)),
        );
        assert.deepEqual([metadata.width, metadata.height], expected, file);
    }
    const temporary = mkdtempSync(join(tmpdir(), 'sproutsite-starter-assets-'));
    try {
        cpSync(directory, join(temporary, 'public'), { recursive: true });
        mkdirSync(join(temporary, 'src/content'), { recursive: true });
        writeFileSync(
            join(temporary, 'src/content/site.yaml'),
            stringify({
                name: 'My independent website',
                url: 'https://example.com',
                base: '/',
                language: 'en',
                locales: ['en'],
                branding: manifest.branding,
                header: { links: [{ label: 'Home', href: '/' }] },
                footer: { text: 'My website', links: [] },
            }),
        );
        const config = loadSiteConfig(undefined, temporary);
        assert.equal(config.branding?.logo?.showName, true);
        await validateBrandingImages(config.branding, temporary);
        assert.ok(
            readFileSync(join(source, manifest.heroExample.source)).equals(
                readFileSync(join(directory, 'images/hero.jpg')),
            ),
        );
        assert.equal(
            manifest.heroExample.frontmatter['background-image'],
            './_assets/hero.jpg',
        );
    } finally {
        rmSync(temporary, { recursive: true, force: true });
    }
});
