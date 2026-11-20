import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { stringify } from 'yaml';
import { loadSiteConfig } from '../src/lib/sproutsite/site-config.js';
import { contentHref } from '../src/lib/sproutsite/urls.js';

test('grouped configuration inherits object fields, replaces lists and keeps defaults independent of locale order', () => {
    const root = mkdtempSync(join(tmpdir(), 'sproutsite-config-'));
    mkdirSync(join(root, 'src/content'), { recursive: true });
    const base = {
        name: 'Website',
        url: 'https://example.com',
        base: '/',
        i18n: { locale: 'en', defaultLocale: 'en', locales: ['de', 'en'] },
        typography: { headings: { family: 'sans-serif', weight: 600 } },
        links: { external: { newTab: false, icon: true } },
        hero: { classes: ['ss-example'] },
        blog: {
            hero: {
                title: 'Blog',
                eyebrow: 'Journal',
                description: 'Project news.',
            },
            articles: { heading: 'Articles' },
        },
        header: {
            links: [
                { label: 'Home', href: '/' },
                { label: 'Info', href: '/info/' },
            ],
        },
        footer: { text: 'Footer', links: [], showVersion: true },
    };
    const configure = (value: unknown, file = 'site.yaml') =>
        writeFileSync(join(root, 'src/content', file), stringify(value));
    try {
        configure(base);
        const english = loadSiteConfig(undefined, root);
        assert.equal(contentHref('/info/', english), '/info/');
        assert.equal(loadSiteConfig('de', root).i18n.locale, 'de');
        configure(
            {
                i18n: { locale: 'de' },
                typography: { headings: { weight: 700 } },
                links: { external: { icon: false } },
                hero: { classes: [] },
                header: { links: [{ label: 'Startseite', href: '/' }] },
                blog: { hero: { eyebrow: 'Projektjournal' } },
                footer: { text: 'Fußzeile' },
            },
            'site.de.yaml',
        );
        const german = loadSiteConfig('de', root);
        assert.equal(
            contentHref('/info/?q=1#title', german),
            '/de/info/?q=1#title',
        );
        assert.deepEqual(german.typography.headings, {
            family: 'sans-serif',
            weight: 700,
        });
        assert.deepEqual(german.links?.external, {
            newTab: false,
            icon: false,
        });
        assert.deepEqual(german.hero.classes, []);
        assert.equal(german.header.links.length, 1);
        assert.equal(german.blog?.hero.title, 'Blog');
        assert.equal(german.blog?.hero.eyebrow, 'Projektjournal');
        assert.equal(german.blog?.articles.heading, 'Articles');
        assert.equal(german.footer.showVersion, true);
        assert.deepEqual(
            loadSiteConfig(undefined, root),
            english,
            'Loading a locale must not mutate the base settings',
        );
        for (const bad of [
            { i18n: { locale: 'fr' } },
            { i18n: { defaultLocale: 'de' } },
            { i18n: { locales: ['de'] } },
            { typography: null },
            { links: { external: { newTab: 'yes' } } },
            { url: 'https://other.example' },
            { base: '/other/' },
        ]) {
            configure(bad, 'site.de.yaml');
            assert.throws(() => loadSiteConfig('de', root));
        }
        assert.throws(() => loadSiteConfig('fr', root), /i18n.locales/);
        for (const i18n of [
            { locale: 'en', defaultLocale: 'fr', locales: ['en', 'de'] },
            { locale: 'en', defaultLocale: 'en', locales: ['en', 'en'] },
            { locale: 'de', defaultLocale: 'en', locales: ['en', 'de'] },
        ]) {
            configure({ ...base, i18n });
            assert.throws(() => loadSiteConfig(undefined, root), /i18n/);
        }
        configure({ ...base, language: 'en' });
        assert.throws(() => loadSiteConfig(undefined, root), /mixing/);
        configure({ ...base, links: { external: {}, externalIcon: true } });
        assert.throws(() => loadSiteConfig(undefined, root), /mix legacy/);
        configure({ ...base, blog: { ...base.blog, title: 'Old title' } });
        assert.throws(() => loadSiteConfig(undefined, root), /mix flat blog/);
        configure({
            ...base,
            i18n: { locale: 'de', defaultLocale: 'de', locales: ['en', 'de'] },
        });
        assert.equal(contentHref('/', loadSiteConfig(undefined, root)), '/');
        assert.equal(contentHref('/', loadSiteConfig('en', root)), '/en/');
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('legacy generated configuration remains readable through explicit grouped normalization', () => {
    const root = mkdtempSync(join(tmpdir(), 'sproutsite-legacy-config-'));
    mkdirSync(join(root, 'src/content'), { recursive: true });
    try {
        writeFileSync(
            join(root, 'src/content/site.yaml'),
            stringify({
                name: 'Website',
                url: 'https://example.com',
                base: '/',
                language: 'en',
                locales: ['en'],
                links: { externalNewTab: false, externalIcon: true },
                blog: {
                    title: 'Blog',
                    eyebrow: 'News',
                    description: 'Updates',
                    heading: 'Articles',
                },
                header: { links: [{ label: 'Home', href: '/' }] },
                footer: { text: 'Footer', links: [] },
            }),
        );
        const config = loadSiteConfig(undefined, root);
        assert.deepEqual(config.i18n, {
            locale: 'en',
            defaultLocale: 'en',
            locales: ['en'],
        });
        assert.deepEqual(config.links?.external, { newTab: false, icon: true });
        assert.equal(config.blog?.hero.title, 'Blog');
        assert.equal(config.blog?.articles.heading, 'Articles');
        writeFileSync(
            join(root, 'src/content/site.yaml'),
            stringify({
                name: 'Deutsche Website',
                url: 'https://example.com',
                base: '/',
                language: 'de',
                locales: ['de'],
                header: { links: [{ label: 'Startseite', href: '/' }] },
                footer: { text: 'Fußzeile', links: [] },
            }),
        );
        writeFileSync(
            join(root, 'src/content/site.de.yaml'),
            stringify({
                language: 'de',
                footer: { text: 'Lokalisierte Fußzeile' },
            }),
        );
        const german = loadSiteConfig('de', root);
        assert.deepEqual(german.i18n, {
            locale: 'de',
            defaultLocale: 'de',
            locales: ['de'],
        });
        assert.equal(contentHref('/', german), '/');
        assert.equal(german.footer.text, 'Lokalisierte Fußzeile');
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
