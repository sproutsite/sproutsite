import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { hasBlogSources } from '../src/lib/sproutsite/blog-sources.js';

test('missing, empty, and asset-only blog directories have no collection sources', () => {
    const root = mkdtempSync(join(tmpdir(), 'sproutsite-optional-blog-'));
    const directory = join(root, 'blog');
    try {
        for (const collection of ['blogPages', 'blogDocuments'] as const)
            assert.equal(hasBlogSources(collection, directory), false);
        mkdirSync(directory);
        assert.equal(hasBlogSources('blogPages', directory), false);
        assert.equal(hasBlogSources('blogDocuments', directory), false);
        mkdirSync(join(directory, '_assets'));
        writeFileSync(join(directory, '_assets/image.png'), 'asset');
        assert.equal(hasBlogSources('blogPages', directory), false);
        assert.equal(hasBlogSources('blogDocuments', directory), false);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('detects source additions and deletions per collection and keeps invalid metadata visible', () => {
    const root = mkdtempSync(join(tmpdir(), 'sproutsite-optional-blog-'));
    try {
        const article = join(root, '2026-01-01.article');
        mkdirSync(article);
        writeFileSync(join(article, 'page.de.yaml'), 'title: Artikel');
        assert.equal(hasBlogSources('blogPages', root), true);
        assert.equal(hasBlogSources('blogDocuments', root), false);
        writeFileSync(join(article, 'hero.de.md'), '# Text');
        assert.equal(hasBlogSources('blogDocuments', root), true);
        rmSync(join(article, 'page.de.yaml'));
        assert.equal(hasBlogSources('blogPages', root), false);
        // Invalid article names must reach Astro's existing validation.
        writeFileSync(join(article, 'page-invalid.yaml'), 'invalid');
        assert.equal(hasBlogSources('blogPages', root), true);
        rmSync(article, { recursive: true });
        assert.equal(hasBlogSources('blogPages', root), false);
        assert.equal(hasBlogSources('blogDocuments', root), false);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
