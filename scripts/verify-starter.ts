import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Element, Root } from 'hast';
import { fromHtml } from 'hast-util-from-html';
import { visit } from 'unist-util-visit';
import { withBase } from '../src/lib/sproutsite/urls.js';

function elements(tree: Root | Element, matches: (node: Element) => boolean) {
    const result: Element[] = [];
    visit(tree, 'element', (node) => {
        if (matches(node)) result.push(node);
    });
    return result;
}

function hasClass(node: Element, className: string): boolean {
    return (
        Array.isArray(node.properties.className) &&
        node.properties.className.includes(className)
    );
}

export function verifyStarter(
    project: string,
    language: 'en' | 'de',
    bilingual: boolean,
    searchEnabled: boolean,
): void {
    const dist = join(project, 'dist');
    const base = process.env.SPROUTSITE_BASE ?? '/';
    const secondary = language === 'de' ? 'en' : 'de';
    const about = { de: 'ueber-uns', en: 'about' };
    const pages = [
        { route: '/', locale: language, alternate: `/${secondary}/` },
    ];
    if (bilingual) {
        pages.push(
            { route: `/${secondary}/`, locale: secondary, alternate: '/' },
            {
                route: `/${about[language]}/`,
                locale: language,
                alternate: `/${secondary}/${about[secondary]}/`,
            },
            {
                route: `/${secondary}/${about[secondary]}/`,
                locale: secondary,
                alternate: `/${about[language]}/`,
            },
        );
    }

    const index = join(dist, 'pagefind');
    assert.equal(
        existsSync(index),
        searchEnabled,
        'Unexpected Pagefind bundle state.',
    );
    if (searchEnabled) {
        const manifest = JSON.parse(
            readFileSync(join(index, 'pagefind-entry.json'), 'utf8'),
        ) as { languages: Record<string, { page_count: number }> };
        assert.deepEqual(
            Object.keys(manifest.languages).sort(),
            (bilingual ? [language, secondary] : [language]).sort(),
        );
        for (const { page_count: count } of Object.values(manifest.languages))
            assert.equal(count, bilingual ? 3 : 2);
        assert.ok(existsSync(join(index, 'pagefind.js')));
        assert.ok(existsSync(join(index, 'licenses')));
    }

    for (const { route, locale, alternate } of pages) {
        const url = withBase(route, base);
        const file = join(dist, route, 'index.html');
        assert.ok(existsSync(file), `${url}: generated page is missing.`);
        const tree = fromHtml(readFileSync(file, 'utf8'));
        const [html] = elements(tree, (node) => node.tagName === 'html');
        assert.equal(
            html?.properties.lang,
            locale,
            `${url}: expected lang="${locale}".`,
        );
        const searchTriggers = elements(
            tree,
            (node) =>
                node.tagName === 'button' &&
                Object.hasOwn(node.properties, 'dataSiteSearchOpen'),
        );
        const searchDialogs = elements(
            tree,
            (node) =>
                node.tagName === 'dialog' &&
                node.properties.id === 'ss-site-search',
        );
        assert.equal(searchTriggers.length, searchEnabled ? 2 : 0, url);
        assert.equal(searchDialogs.length, searchEnabled ? 1 : 0, url);
        if (searchEnabled)
            assert.equal(
                searchDialogs[0]?.properties.dataModule,
                withBase('/pagefind/pagefind.js', base),
                url,
            );

        const logo = '/branding/logo.svg';
        const favicon = '/branding/favicon.svg';
        const hero = '/images/hero.jpg';
        const footer = '/images/footer.webp';
        const images = (node: Element, path: string) =>
            node.tagName === 'img' &&
            node.properties.src === withBase(path, base);

        const headerBrand = elements(tree, (node) =>
            hasClass(node, 'ss-header__brand'),
        );
        const footerBrand = elements(tree, (node) =>
            hasClass(node, 'ss-footer__brand'),
        );
        const footerBackground = elements(tree, (node) =>
            hasClass(node, 'ss-footer__background'),
        );
        assert.ok(
            headerBrand.some(
                (node) => elements(node, (image) => images(image, logo)).length,
            ),
            `${url}: header logo is missing or points to the wrong path.`,
        );
        assert.ok(
            footerBrand.some(
                (node) => elements(node, (image) => images(image, logo)).length,
            ),
            `${url}: footer logo is missing or points to the wrong path.`,
        );
        assert.ok(
            elements(
                tree,
                (node) =>
                    images(node, hero) && hasClass(node, 'ss-hero-background'),
            ).length,
            `${url}: hero image is missing or points to the wrong path.`,
        );
        assert.ok(
            footerBackground.some(
                (node) =>
                    elements(node, (image) => images(image, footer)).length,
            ),
            `${url}: footer image is missing or points to the wrong path.`,
        );
        assert.ok(
            elements(
                tree,
                (node) =>
                    node.tagName === 'link' &&
                    Array.isArray(node.properties.rel) &&
                    node.properties.rel.includes('icon') &&
                    node.properties.href === withBase(favicon, base),
            ).length,
            `${url}: favicon is missing or points to the wrong path.`,
        );
        for (const asset of [logo, favicon, hero, footer]) {
            assert.ok(
                existsSync(join(dist, asset)),
                `${url}: missing output file ${asset}.`,
            );
        }

        const switchers = elements(
            tree,
            (node) =>
                node.tagName === 'details' &&
                hasClass(node, 'ss-language-switcher'),
        );
        if (bilingual) {
            const otherLocale = locale === language ? secondary : language;
            const target = withBase(alternate, base);
            assert.ok(
                switchers.some(
                    (switcher) =>
                        elements(
                            switcher,
                            (node) =>
                                node.tagName === 'a' &&
                                node.properties.href === target &&
                                node.properties.hrefLang === otherLocale,
                        ).length,
                ),
                `${url}: language switcher link to ${target} (${otherLocale}) is missing.`,
            );
        } else {
            assert.equal(
                switchers.length,
                0,
                `${url}: unexpected language switcher.`,
            );
        }
    }
}
