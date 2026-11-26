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
