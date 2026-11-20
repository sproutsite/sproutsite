import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { extname, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { chromium, type Page } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { parse } from 'yaml';
import { loadSiteConfig } from '../src/lib/sproutsite/site-config.js';
import { blogRouteFromId } from '../src/lib/sproutsite/urls.js';

const distDirectory = fileURLToPath(new URL('../dist/', import.meta.url));
const contentTypes: Record<string, string> = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.xml': 'application/xml; charset=utf-8',
};

function outputPath(pathname: string): string | undefined {
    const file = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
    const resolved = resolve(distDirectory, `.${decodeURIComponent(file)}`);
    const pathFromDist = relative(distDirectory, resolved);
    return pathFromDist.startsWith('..') || pathFromDist === ''
        ? undefined
        : resolved;
}

const previewServer = createServer(async (request, response) => {
    try {
        const pathname = new URL(request.url ?? '/', 'http://127.0.0.1')
            .pathname;
        const file = outputPath(pathname);
        if (!file) {
            response.writeHead(404).end();
            return;
        }
        const body = await readFile(file);
        response
            .writeHead(200, {
                'content-type':
                    contentTypes[extname(file)] ?? 'application/octet-stream',
            })
            .end(body);
    } catch {
        response.writeHead(404).end();
    }
});

const port = await new Promise<number>((resolvePort, reject) => {
    previewServer.once('error', reject);
    previewServer.listen(0, '127.0.0.1', () => {
        const address = previewServer.address();
        if (!address || typeof address === 'string') {
            reject(new Error('Could not determine the local preview port'));
            return;
        }
        resolvePort(address.port);
    });
});
const baseUrl = `http://127.0.0.1:${port}`;
// Inspect every generated content page, including localized routes and new pages.
const routes = (await readdir(distDirectory, { recursive: true }))
    .filter(
        (file) =>
            file === 'index.html' ||
            file.endsWith('/index.html') ||
            /^(404|500)(-[a-z]{2})?\.html$/.test(file),
    )
    .map((file) =>
        /^(404|500)(-[a-z]{2})?\.html$/.test(file)
            ? `/${file}`
            : `/${file.slice(0, -'index.html'.length)}`,
    )
    .sort();
const requestedRoutes = process.env.SPROUTSITE_A11Y_ROUTES?.split(',');
if (requestedRoutes) {
    for (const route of requestedRoutes)
        assert.ok(routes.includes(route), `Unknown test route: ${route}`);
}
const testedRoutes = requestedRoutes ?? routes;

interface BlogMetadata {
    title: string;
    description: string;
    pubDate: string;
    imageAlt: string;
}
const blogDirectory = fileURLToPath(
    new URL('../src/content/blog/', import.meta.url),
);
const articleDirectories = (
    await readdir(blogDirectory, { withFileTypes: true })
)
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name);
async function expectedBlogPosts(german: boolean) {
    const posts = await Promise.all(
        articleDirectories.map(async (directory) => ({
            route: `${german ? '/de' : ''}${blogRouteFromId(directory)}`,
            metadata: parse(
                await readFile(
                    join(
                        blogDirectory,
                        directory,
                        german ? 'page.de.yaml' : 'page.yaml',
                    ),
                    'utf8',
                ),
            ) as BlogMetadata,
        })),
    );
    return posts.sort(
        (left, right) =>
            new Date(right.metadata.pubDate).getTime() -
            new Date(left.metadata.pubDate).getTime(),
    );
}

async function waitForServer(): Promise<void> {
    for (let attempt = 0; attempt < 40; attempt += 1) {
        try {
            if ((await fetch(baseUrl)).ok) return;
        } catch {
            /* server is starting */
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error('Static preview server did not start');
}

async function checkMobileNavigation(page: Page, german: boolean) {
    const originalUrl = page.url();
    const trigger = page.getByRole('button', {
        name: german ? 'Menü öffnen' : 'Open menu',
        exact: true,
    });
    const dialog = page.getByRole('dialog', {
        name: german ? 'Hauptnavigation' : 'Primary navigation',
    });
    const close = dialog.getByRole('button', {
        name: german ? 'Menü schließen' : 'Close menu',
        exact: true,
    });
    const waitForMenuClosed = async () => {
        await dialog.waitFor({ state: 'hidden' });
        await page.waitForFunction(
            () =>
                document
                    .querySelector('.ss-header__menu-toggle')
                    ?.getAttribute('aria-expanded') === 'false' &&
                document.documentElement.style.overflow !== 'hidden',
        );
    };
    await trigger.click();
    await dialog.waitFor({ state: 'visible' });
    assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
    assert.ok(
        await close.evaluate((element) => element === document.activeElement),
    );
    const bounds = await dialog.boundingBox();
    assert.ok(bounds);
    assert.equal(bounds.x, 0);
    assert.equal(bounds.y, 0);
    assert.equal(bounds.width, page.viewportSize()!.width);
    assert.equal(bounds.height, page.viewportSize()!.height);
    assert.equal(
        await page
            .locator('html')
            .evaluate((element) => element.style.overflow),
        'hidden',
    );
    assert.equal(await dialog.getByRole('navigation').count(), 1);
    const cta = dialog.locator('.ss-header__cta .ss-button');
    const list = dialog.locator('.ss-header__links');
    assert.ok(
        Math.abs(
            (await cta.boundingBox())!.width -
                (await list.boundingBox())!.width,
        ) < 1,
    );
    const languages = dialog.locator('.ss-language-switcher');
    await languages.locator('summary').click();
    assert.equal(
        await languages
            .locator('.ss-language-switcher__options')
            .evaluate((element) => getComputedStyle(element).position),
        'static',
    );
    assert.equal(await languages.getByRole('link').count(), 2);
    const results = await new AxeBuilder({ page }).analyze();
    assert.deepEqual(
        results.violations.map((violation) => violation.id),
        [],
    );
    await page.keyboard.press('Escape');
    assert.equal(await languages.getAttribute('open'), null);
    assert.ok(await dialog.isVisible());
    for (let step = 0; step < 12; step += 1) {
        await page.keyboard.press('Tab');
        assert.ok(
            await dialog.evaluate(
                (element) =>
                    !document.hasFocus() ||
                    element.contains(document.activeElement),
            ),
        );
    }
    await close.click();
    await waitForMenuClosed();
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    assert.ok(
        await trigger.evaluate((element) => element === document.activeElement),
    );
    assert.notEqual(
        await page
            .locator('html')
            .evaluate((element) => element.style.overflow),
        'hidden',
    );
    await trigger.click();
    await page.keyboard.press('Escape');
    await waitForMenuClosed();
    await trigger.click();
    await page.setViewportSize({ width: 1440, height: 900 });
    await waitForMenuClosed();
    assert.equal(
        await page.locator('.ss-header__inner > .ss-header__nav').count(),
        1,
    );
    assert.notEqual(
        await page
            .locator('html')
            .evaluate((element) => element.style.overflow),
        'hidden',
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() =>
        document.querySelector('.ss-header__dialog-content > .ss-header__nav'),
    );
    await page.evaluate(() => window.scrollTo(0, 120));
    await page.waitForFunction(() =>
        document.querySelector('.ss-header--scrolled'),
    );
    const scrollPosition = await page.evaluate(() => window.scrollY);
    await trigger.click();
    assert.equal(
        await dialog
            .locator('.ss-header__dialog-brand')
            .evaluate((element) => getComputedStyle(element).color),
        'rgb(255, 255, 255)',
    );
    await close.click();
    await waitForMenuClosed();
    assert.equal(await page.evaluate(() => window.scrollY), scrollPosition);
    await trigger.click();
    const destination = dialog
        .locator('.ss-header__link:not([aria-current])')
        .first();
    const href = await destination.getAttribute('href');
    assert.ok(href);
    await Promise.all([
        page.waitForURL(new URL(href, originalUrl).href, {
            waitUntil: 'networkidle',
        }),
        destination.click(),
    ]);
    assert.equal(await page.locator('.ss-header__dialog[open]').count(), 0);
    await page.goto(originalUrl, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, 0));
}

async function checkAccordions(page: Page) {
    const groups = page.locator('.ss-accordion');
    assert.equal(await groups.count(), 4);
    const first = groups.nth(0).locator(':scope > details');
    const iconItems = groups.nth(1).locator(':scope > details');
    const multiple = groups.nth(3).locator(':scope > details');
    await page.waitForFunction(
        () =>
            document
                .querySelector('.ss-accordion')
                ?.getAttribute('data-enhanced') === 'true',
    );
    assert.equal(await first.nth(0).getAttribute('open'), '');
    await first.nth(1).locator('summary').click();
    assert.equal(await first.nth(0).getAttribute('open'), null);
    assert.equal(await first.nth(1).getAttribute('open'), '');
    // Another single-open group must retain its initial open item.
    assert.equal(await iconItems.nth(0).getAttribute('open'), '');
    await first.nth(1).locator('.ss-accordion-item__answer p').click();
    assert.equal(await first.nth(1).getAttribute('open'), null);
    await first.nth(0).locator('summary').focus();
    await page.keyboard.press('Space');
    assert.equal(await first.nth(0).getAttribute('open'), '');
    assert.equal(
        await first.nth(0).locator('.ss-accordion-item__up').isVisible(),
        true,
    );
    await page.keyboard.press('Enter');
    assert.equal(await first.nth(0).getAttribute('open'), null);
    assert.equal(
        await first.nth(0).locator('.ss-accordion-item__plus').isVisible(),
        true,
    );
    const box = await iconItems
        .nth(0)
        .locator('.ss-accordion-item__icon')
        .boundingBox();
    assert.ok(
        box && Math.abs(box.width - 56) < 1 && Math.abs(box.height - 56) < 1,
    );
    assert.equal(
        await iconItems
            .nth(0)
            .locator('.ss-accordion-item__icon svg')
            .getAttribute('width'),
        '28',
    );
    const custom = iconItems.nth(2);
    assert.equal(
        await custom
            .locator('.ss-accordion-item__icon')
            .evaluate((icon) => getComputedStyle(icon).backgroundColor),
        'rgb(223, 234, 229)',
    );
    assert.equal(await multiple.nth(0).getAttribute('open'), '');
    assert.equal(await multiple.nth(1).getAttribute('open'), '');
    const answer = multiple
        .nth(0)
        .locator('.ss-accordion-item__answer p')
        .first();
    await answer.evaluate((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
    });
    // Preserve a programmatically established text selection during a click.
    await answer.dispatchEvent('click');
    assert.equal(await multiple.nth(0).getAttribute('open'), '');
    await page.evaluate(() => window.getSelection()?.removeAllRanges());
    const link = multiple.nth(0).locator('a');
    await link.evaluate((element) =>
        element.addEventListener('click', (event) => event.preventDefault(), {
            once: true,
        }),
    );
    await link.click();
    assert.equal(await multiple.nth(0).getAttribute('open'), '');
    await answer.click();
    assert.equal(await multiple.nth(0).getAttribute('open'), null);
    assert.equal(await multiple.nth(1).getAttribute('open'), '');
    await page.screenshot({
        path: join(
            tmpdir(),
            `sproutsite-accordions-${page.viewportSize()?.width}.png`,
        ),
        fullPage: true,
    });
    await page.evaluate(() => window.scrollTo(0, 0));
}

try {
    await waitForServer();
    const browser = await chromium.launch({ headless: true });
    for (const viewport of [
        { width: 390, height: 844, name: 'mobile' },
        { width: 1440, height: 900, name: 'desktop' },
    ]) {
        const context = await browser.newContext({ viewport });
        for (const route of testedRoutes) {
            const german = route.startsWith('/de/') || /-de\.html$/.test(route);
            const previewLabel = german ? 'Vorschau' : 'Preview';
            const tokenHeading = german
                ? 'Token-Referenz des Default-Themes'
                : 'Default theme token reference';
            const page = await context.newPage();
            const response = await page.goto(`${baseUrl}${route}`, {
                waitUntil: 'networkidle',
            });
            assert.equal(
                response?.status(),
                200,
                `${route}: missing content page`,
            );
            assert.equal(
                await page.locator('html').getAttribute('lang'),
                german ? 'de' : 'en',
            );
            const header = page.locator('.ss-header');
            const initialHeaderPosition = await header.evaluate(
                (element) => getComputedStyle(element).position,
            );
            if (initialHeaderPosition !== 'absolute')
                throw new Error(
                    `${viewport.name} ${route}: header is not transparent before scrolling`,
                );
            const results = await new AxeBuilder({ page }).analyze();
            if (results.violations.length > 0)
                throw new Error(
                    `${viewport.name} ${route}: ${results.violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`).join('; ')}`,
                );
            await page.keyboard.press('Tab');
            if ((await page.locator(':focus-visible').count()) === 0)
                throw new Error(
                    `${viewport.name} ${route}: no visible keyboard focus after Tab`,
                );
            const overflow = await page.evaluate(
                () => document.documentElement.scrollWidth > window.innerWidth,
            );
            if (overflow)
                throw new Error(
                    `${viewport.name} ${route}: viewport overflows horizontally`,
                );
            if (route.endsWith('/showcase/accordions/'))
                await checkAccordions(page);
            if (route.endsWith('/showcase/features/')) {
                const cards = page.locator('.ss-feature--card');
                assert.equal(await cards.count(), 5);
                const surfaces = await cards.evaluateAll((features) =>
                    features.map((feature) => {
                        const icon =
                            feature.querySelector('.ss-feature__icon')!;
                        const content = feature.querySelector(
                            '.ss-feature__content',
                        )!;
                        const bounds = feature.getBoundingClientRect();
                        const iconBounds = icon.getBoundingClientRect();
                        const textBounds = content.getBoundingClientRect();
                        const styles = getComputedStyle(feature);
                        return {
                            alignment: styles.textAlign,
                            background: styles.backgroundColor,
                            padding: parseFloat(styles.paddingLeft),
                            radius: parseFloat(styles.borderRadius),
                            left: iconBounds.left - bounds.left,
                            textLeft: textBounds.left - bounds.left,
                            below: textBounds.top >= iconBounds.bottom,
                            iconBackground:
                                getComputedStyle(icon).backgroundColor,
                            iconWidth: iconBounds.width,
                            symbolWidth: icon
                                .querySelector('svg')!
                                .getBoundingClientRect().width,
                            solid: feature.classList.contains(
                                'ss-feature--solid',
                            ),
                        };
                    }),
                );
                for (const surface of surfaces) {
                    assert.ok(['start', 'left'].includes(surface.alignment));
                    assert.ok(surface.padding > 0 && surface.radius > 0);
                    assert.ok(Math.abs(surface.left - surface.padding) < 1);
                    assert.ok(Math.abs(surface.textLeft - surface.padding) < 1);
                    assert.equal(surface.below, true);
                    assert.equal(surface.iconBackground, 'rgba(0, 0, 0, 0)');
                    assert.equal(surface.iconWidth, surface.symbolWidth);
                    assert.equal(surface.solid, false);
                }
                assert.equal(surfaces[1]!.background, 'rgb(233, 239, 223)');
                const samples = page
                    .locator('main .ss-section')
                    .filter({ has: page.locator('h2[id^="08-icon-sizes"]') })
                    .locator('.ss-feature');
                assert.equal(await samples.count(), 5);
                const dimensions = await samples.evaluateAll((features) =>
                    features.map((feature) => ({
                        icon: feature
                            .querySelector('svg')!
                            .getBoundingClientRect().width,
                        box: feature
                            .querySelector('.ss-feature__icon')!
                            .getBoundingClientRect().width,
                        text: getComputedStyle(
                            feature.querySelector('.ss-feature__title')!,
                        ).fontSize,
                    })),
                );
                assert.deepEqual(
                    dimensions.map((sample) => sample.icon),
                    [14, 21, 28, 42, 56],
                );
                assert.deepEqual(
                    dimensions.map((sample) => sample.box / dimensions[2]!.box),
                    [0.5, 0.75, 1, 1.5, 2],
                );
                assert.equal(
                    new Set(dimensions.map((sample) => sample.text)).size,
                    1,
                );
                const vertical = page.locator('.ss-feature--vertical');
                assert.equal(await vertical.count(), 7);
                const sizes = await vertical.evaluateAll((features) =>
                    features.map((feature) => {
                        const box = feature.querySelector('.ss-feature__icon')!;
                        return {
                            large: feature.classList.contains(
                                'ss-feature--icon-xl',
                            ),
                            box: box.getBoundingClientRect().width,
                            icon: box
                                .querySelector('svg')!
                                .getBoundingClientRect().width,
                            title: getComputedStyle(
                                feature.querySelector('.ss-feature__title')!,
                            ).fontSize,
                        };
                    }),
                );
                assert.equal(sizes.filter((size) => size.large).length, 3);
                for (const size of sizes.filter((size) => size.large)) {
                    assert.equal(size.box, sizes[0]!.box * 2);
                    assert.equal(size.icon, sizes[0]!.icon * 2);
                    assert.equal(size.title, sizes[0]!.title);
                }
                for (const feature of await vertical.all()) {
                    const geometry = await feature.evaluate((element) => {
                        const icon = element
                            .querySelector('.ss-feature__icon')!
                            .getBoundingClientRect();
                        const content = element
                            .querySelector('.ss-feature__content')!
                            .getBoundingClientRect();
                        const bounds = element.getBoundingClientRect();
                        return {
                            iconCenter: (icon.left + icon.right) / 2,
                            contentCenter: (content.left + content.right) / 2,
                            center: (bounds.left + bounds.right) / 2,
                            below: content.top >= icon.bottom,
                            alignment: getComputedStyle(element).textAlign,
                        };
                    });
                    assert.ok(
                        Math.abs(geometry.iconCenter - geometry.center) < 1,
                    );
                    assert.ok(
                        Math.abs(geometry.contentCenter - geometry.center) < 1,
                    );
                    assert.equal(geometry.below, true);
                    assert.equal(geometry.alignment, 'center');
                }
                const horizontal = page
                    .locator('.ss-feature--horizontal')
                    .first();
                assert.equal(
                    await horizontal.evaluate((element) => {
                        const icon = element
                            .querySelector('.ss-feature__icon')!
                            .getBoundingClientRect();
                        const content = element
                            .querySelector('.ss-feature__content')!
                            .getBoundingClientRect();
                        return icon.right < content.left;
                    }),
                    true,
                );
            }
            if (route.endsWith('/showcase/layout/')) {
                const plainGroups = page.locator('.ss-columns--spaced');
                assert.equal(await plainGroups.count(), 2);
                for (const [index, group] of (
                    await plainGroups.all()
                ).entries()) {
                    const measured = await group.evaluate((element) => {
                        const first =
                            element.children[0]!.getBoundingClientRect();
                        const second =
                            element.children[1]!.getBoundingClientRect();
                        return {
                            gap: matchMedia('(min-width:64rem)').matches
                                ? second.left - first.right
                                : second.top - first.bottom,
                            pseudo: getComputedStyle(
                                element.children[0]!,
                                '::before',
                            ).content,
                            rem: parseFloat(
                                getComputedStyle(document.documentElement)
                                    .fontSize,
                            ),
                        };
                    });
                    const expected =
                        index === 0 ? 2 : viewport.name === 'desktop' ? 6 : 1;
                    assert.ok(
                        Math.abs(measured.gap - expected * measured.rem) < 1,
                    );
                    assert.equal(measured.pseudo, 'none');
                }
                const iconGroups = page.locator('.ss-columns--separator');
                assert.equal(await iconGroups.count(), 4);
                for (const [index, group] of (
                    await iconGroups.all()
                ).entries()) {
                    const states = await group.evaluate((element) => {
                        const columns = Array.from(element.children).filter(
                            (child) => child.classList.contains('ss-column'),
                        );
                        return Array.from(
                            element.querySelectorAll<HTMLElement>(
                                ':scope > .ss-columns__separator',
                            ),
                        ).map((icon, index) => {
                            const previous =
                                columns[index]!.getBoundingClientRect();
                            const current =
                                columns[index + 1]!.getBoundingClientRect();
                            const bounds = icon.getBoundingClientRect();
                            const desktop =
                                matchMedia('(min-width: 64rem)').matches;
                            const featureIcon =
                                columns[index + 1]!.querySelector(
                                    '.ss-feature__icon',
                                )?.getBoundingClientRect();
                            const topAligned = element.classList.contains(
                                'ss-columns--separator-top',
                            );
                            const rotation = new DOMMatrixReadOnly(
                                getComputedStyle(icon).transform,
                            );
                            return {
                                hidden: icon.hidden,
                                expectedHidden:
                                    desktop &&
                                    Math.abs(previous.top - current.top) >= 1,
                                x: (bounds.left + bounds.right) / 2,
                                y: (bounds.top + bounds.bottom) / 2,
                                expectedX: desktop
                                    ? (previous.right + current.left) / 2
                                    : (current.left + current.right) / 2,
                                expectedY: desktop
                                    ? topAligned && featureIcon
                                        ? (featureIcon.top +
                                              featureIcon.bottom) /
                                          2
                                        : (current.top + current.bottom) / 2
                                    : (previous.bottom + current.top) / 2,
                                rotation: rotation.b,
                                decorative: icon.getAttribute('aria-hidden'),
                            };
                        });
                    });
                    assert.equal(states.length, index === 2 ? 4 : 2);
                    assert.equal(
                        states.filter((state) => !state.hidden).length,
                        index === 2 && viewport.name === 'desktop'
                            ? 3
                            : index === 2
                              ? 4
                              : 2,
                    );
                    for (const state of states) {
                        assert.equal(state.decorative, 'true');
                        assert.equal(state.hidden, state.expectedHidden);
                        if (state.hidden) continue;
                        assert.ok(Math.abs(state.x - state.expectedX) < 1);
                        assert.ok(Math.abs(state.y - state.expectedY) < 1);
                        assert.ok(
                            Math.abs(
                                state.rotation -
                                    (viewport.name === 'mobile' ? 1 : 0),
                            ) < 0.01,
                        );
                    }
                }
                const measuredGaps = async (stacked: boolean) =>
                    page.locator('.ss-columns--divider').evaluateAll(
                        (groups, vertical) =>
                            groups.map((group) => {
                                const first =
                                    group.children[0]!.getBoundingClientRect();
                                const second =
                                    group.children[1]!.getBoundingClientRect();
                                return vertical
                                    ? second.top - first.bottom
                                    : second.left - first.right;
                            }),
                        stacked,
                    );
                const rootFontSize = await page.evaluate(() =>
                    parseFloat(
                        getComputedStyle(document.documentElement).fontSize,
                    ),
                );
                const gaps = await measuredGaps(viewport.name === 'mobile');
                assert.equal(gaps.length, 3);
                for (const [index, gap] of gaps.entries()) {
                    const expected =
                        (viewport.name === 'desktop'
                            ? index === 2
                                ? 12
                                : 6
                            : 3) * rootFontSize;
                    assert.ok(
                        Math.abs(gap - expected) < 1,
                        `${route}: divider gap ${gap}, expected ${expected}`,
                    );
                }
                // Large gaps must also fit immediately above the desktop breakpoint.
                try {
                    await page.setViewportSize({
                        width: 1024,
                        height: viewport.height,
                    });
                    const narrowGaps = await measuredGaps(false);
                    assert.ok(Math.abs(narrowGaps[2]! - 12 * rootFontSize) < 1);
                    assert.equal(
                        await page.evaluate(
                            () =>
                                document.documentElement.scrollWidth >
                                innerWidth,
                        ),
                        false,
                        `${route}: large divider gap overflows at 1024px`,
                    );
                } finally {
                    await page.setViewportSize(viewport);
                }
                const originalFontSize = await page.evaluate(
                    () => document.documentElement.style.fontSize,
                );
                try {
                    await page.evaluate(() => {
                        document.documentElement.style.fontSize = '20px';
                    });
                    const scaledGaps = await measuredGaps(
                        viewport.name === 'mobile',
                    );
                    for (const [index, gap] of scaledGaps.entries()) {
                        const expected =
                            (viewport.name === 'desktop'
                                ? index === 2
                                    ? 12
                                    : 6
                                : 3) * 20;
                        assert.ok(
                            Math.abs(gap - expected) < 1,
                            `${route}: rem divider gap does not scale with the root font size`,
                        );
                    }
                } finally {
                    await page.evaluate((value) => {
                        document.documentElement.style.fontSize = value;
                    }, originalFontSize);
                }
            }
            if (
                viewport.name === 'mobile' &&
                ['/', '/de/', '/blog/', '/de/blog/'].includes(route)
            ) {
                await checkMobileNavigation(page, german);
            }
            if (route === '/blog/' || route === '/de/blog/') {
                const settings = loadSiteConfig(german ? 'de' : 'en').blog;
                assert.ok(settings);
                assert.equal(
                    await page.locator('h1').innerText(),
                    settings.hero.title,
                );
                assert.equal(
                    await page
                        .locator('.ss-page-title__description')
                        .innerText(),
                    settings.hero.description,
                );
                assert.equal(
                    (
                        await page.locator('.ss-hero .ss-eyebrow').textContent()
                    )?.trim(),
                    settings.hero.eyebrow,
                );
                assert.equal(
                    await page.locator('#blog-overview').innerText(),
                    settings.articles.heading,
                );
                const posts = await expectedBlogPosts(german);
                const cards = page.locator('.ss-blog-index__grid > .ss-card');
                assert.equal(await cards.count(), posts.length);
                const formatter = new Intl.DateTimeFormat(
                    german ? 'de' : 'en',
                    {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        timeZone: 'UTC',
                    },
                );
                for (const [index, post] of posts.entries()) {
                    const card = cards.nth(index);
                    assert.equal(
                        await card
                            .getByRole('heading', { level: 3 })
                            .innerText(),
                        post.metadata.title,
                    );
                    assert.equal(
                        await card.locator('p').innerText(),
                        post.metadata.description,
                    );
                    assert.equal(
                        await card.locator('img').getAttribute('alt'),
                        post.metadata.imageAlt,
                    );
                    assert.equal(
                        await card.locator('time').innerText(),
                        formatter
                            .format(new Date(post.metadata.pubDate))
                            .toUpperCase(),
                    );
                    const label = german ? 'Mehr erfahren' : 'Learn more';
                    const link = card.getByRole('link', {
                        name: `${label}: ${post.metadata.title}`,
                        exact: true,
                    });
                    assert.equal(await link.innerText(), label);
                    assert.equal(await link.getAttribute('href'), post.route);
                }
                await page.screenshot({
                    path: join(
                        tmpdir(),
                        `sproutsite-blog-${german ? 'de' : 'en'}-${viewport.name}.png`,
                    ),
                });
            } else if (/^\/(?:de\/)?blog\/[a-z0-9-]+\/$/.test(route)) {
                const post = (await expectedBlogPosts(german)).find(
                    (entry) => entry.route === route,
                );
                assert.ok(post);
                assert.equal(
                    await page.title(),
                    `${post.metadata.title} | Sproutsite`,
                );
                assert.equal(
                    await page
                        .locator('meta[name="description"]')
                        .getAttribute('content'),
                    post.metadata.description,
                );
                const formatter = new Intl.DateTimeFormat(
                    german ? 'de' : 'en',
                    {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        timeZone: 'UTC',
                    },
                );
                assert.equal(
                    await page.locator('.ss-hero__meta').innerText(),
                    formatter
                        .format(new Date(post.metadata.pubDate))
                        .toUpperCase(),
                );
                assert.equal(
                    await page
                        .locator('.ss-hero__meta')
                        .getAttribute('datetime'),
                    new Date(post.metadata.pubDate).toISOString(),
                );
            }
            if (
                ['/showcase/tables/', '/de/showcase/tabellen/'].includes(route)
            ) {
                const examples = page.locator('.content-prose > .ss-tabs');
                assert.equal(await examples.count(), 7);
                const basic = examples.first();
                const basicPreview = basic.getByRole('tab', {
                    name: previewLabel,
                    exact: true,
                });
                const basicCode = basic.getByRole('tab', {
                    name: 'Code',
                    exact: true,
                });
                assert.equal(
                    await basicPreview.getAttribute('aria-selected'),
                    'true',
                );
                const basicTable = basic
                    .getByRole('tabpanel')
                    .getByRole('table');
                assert.equal(await basicTable.count(), 1);
                assert.equal(await basicTable.locator('caption').count(), 0);
                assert.equal(
                    await basic.locator('.ss-content-table').count(),
                    0,
                );
                const basicRows = await basicTable
                    .locator('tbody tr')
                    .allTextContents();
                await basicCode.click();
                const markdown = await basic
                    .getByRole('tabpanel')
                    .locator('pre[data-language="markdown"]')
                    .innerText();
                assert(markdown.includes(german ? '| Inhalt' : '| Content'));
                assert(
                    !markdown.includes('ContentTable') &&
                        !markdown.includes('import '),
                );
                await basicCode.press('ArrowLeft');
                assert.equal(
                    await basicPreview.getAttribute('aria-selected'),
                    'true',
                );
                const groups = examples.filter({
                    has: page.locator('.ss-content-table'),
                });
                assert.equal(await groups.count(), 6);
                assert.deepEqual(
                    await groups
                        .first()
                        .getByRole('tabpanel')
                        .locator('tbody tr')
                        .allTextContents(),
                    basicRows,
                );
                let comfortablePadding = 0;
                for (let index = 0; index < 6; index += 1) {
                    const group = groups.nth(index);
                    const preview = group.getByRole('tab', {
                        name: previewLabel,
                        exact: true,
                    });
                    const code = group.getByRole('tab', {
                        name: 'Code',
                        exact: true,
                    });
                    assert.equal(
                        await preview.getAttribute('aria-selected'),
                        'true',
                    );
                    const panel = group.getByRole('tabpanel');
                    const region = panel.getByRole('region');
                    const table = region.getByRole('table');
                    assert.equal(await table.count(), 1);
                    const caption = await table.locator('caption').innerText();
                    assert(caption.trim());
                    assert.equal(
                        await region
                            .getByRole('table', { name: caption, exact: true })
                            .count(),
                        1,
                    );
                    assert(
                        await table
                            .locator('th')
                            .evaluateAll((elements) =>
                                elements.every(
                                    (element) =>
                                        element.getAttribute('scope') === 'col',
                                ),
                            ),
                    );
                    if (index === 0)
                        comfortablePadding = await table
                            .locator('tbody td')
                            .first()
                            .evaluate((element) =>
                                parseFloat(
                                    getComputedStyle(element).paddingTop,
                                ),
                            );
                    if (index === 1) {
                        const alignments = await table
                            .locator('thead th')
                            .evaluateAll((elements) =>
                                elements.map(
                                    (element) =>
                                        getComputedStyle(element).textAlign,
                                ),
                            );
                        assert.deepEqual(alignments, [
                            'left',
                            'center',
                            'right',
                        ]);
                    }
                    if (index === 2) {
                        const backgrounds = await table
                            .locator('tbody tr')
                            .evaluateAll((elements) =>
                                elements.map(
                                    (element) =>
                                        getComputedStyle(element)
                                            .backgroundColor,
                                ),
                            );
                        assert.notEqual(backgrounds[0], backgrounds[1]);
                    }
                    if (index === 3) {
                        const marked = table.locator(
                            'tbody tr[data-highlighted]',
                        );
                        assert.equal(await marked.count(), 1);
                        assert(
                            (await marked.innerText()).includes(
                                german ? 'Aktuell' : 'Current',
                            ),
                        );
                        assert.equal(
                            await table
                                .locator('tbody tr')
                                .nth(1)
                                .getAttribute('data-highlighted'),
                            'true',
                        );
                    }
                    if (index === 4) {
                        const compactPadding = await table
                            .locator('tbody td')
                            .first()
                            .evaluate((element) =>
                                parseFloat(
                                    getComputedStyle(element).paddingTop,
                                ),
                            );
                        assert(
                            compactPadding < comfortablePadding,
                            'Compact tables must reduce cell padding',
                        );
                    }
                    if (index === 5) {
                        const bounds = await table.boundingBox();
                        assert(bounds && bounds.width >= 960);
                        if (viewport.name === 'mobile') {
                            assert(
                                await region.evaluate(
                                    (element) =>
                                        element.scrollWidth >
                                        element.clientWidth,
                                ),
                            );
                            await preview.focus();
                            await page.keyboard.press('Tab');
                            assert(
                                await panel.evaluate(
                                    (element) =>
                                        element === document.activeElement,
                                ),
                            );
                            await page.keyboard.press('Tab');
                            assert(
                                await region.evaluate(
                                    (element) =>
                                        element === document.activeElement &&
                                        element.matches(':focus-visible'),
                                ),
                            );
                            await page.keyboard.press('ArrowRight');
                            await page.waitForFunction(() => {
                                const element = document.querySelector(
                                    '.ss-content-table--wide',
                                );
                                return (
                                    element !== null && element.scrollLeft > 0
                                );
                            });
                            await region.evaluate((element) => {
                                element.scrollLeft = 0;
                            });
                        }
                    }
                    await code.click();
                    const source = await group
                        .getByRole('tabpanel')
                        .locator('pre[data-language="mdx"]')
                        .innerText();
                    assert(
                        source.includes(
                            "import { ContentTable } from 'sproutsite/components';",
                        ),
                    );
                    assert(source.includes(caption));
                    assert(
                        await page.evaluate(
                            () =>
                                document.documentElement.scrollWidth <=
                                innerWidth,
                        ),
                    );
                    await code.press('ArrowLeft');
                    assert.equal(
                        await preview.getAttribute('aria-selected'),
                        'true',
                    );
                }
                await page.evaluate(() => window.scrollTo(0, 0));
                await page.waitForFunction(() => window.scrollY === 0);
                await page.waitForTimeout(250);
                await page.screenshot({
                    path: join(
                        tmpdir(),
                        `sproutsite-tables-${viewport.name}.png`,
                    ),
                    fullPage: true,
                });
            }
            if (['/showcase/tabs/', '/de/showcase/tabs/'].includes(route)) {
                const examples = page.locator('.content-prose > .ss-tabs');
                assert.equal(await examples.count(), 3);
                assert.equal(await page.locator('.ss-tabs').count(), 6);
                const groups = examples.locator(
                    ':scope > .ss-tab > .ss-tab__content > .ss-tabs',
                );
                assert.equal(await groups.count(), 3);
                for (let index = 0; index < 3; index += 1) {
                    const example = examples.nth(index);
                    const outerTabs = example
                        .locator(':scope > .ss-tabs__list')
                        .getByRole('tab');
                    assert.equal(await outerTabs.count(), 2);
                    assert.equal(
                        await outerTabs.nth(0).getAttribute('aria-selected'),
                        'true',
                    );
                    const group = groups.nth(index);
                    const tabs = group.locator(
                        ':scope > .ss-tabs__list > [role="tab"]',
                    );
                    assert.equal(await tabs.count(), 3);
                    assert.equal(
                        await group
                            .locator('.ss-tabs__list')
                            .evaluate(
                                (element) => getComputedStyle(element).flexWrap,
                            ),
                        'nowrap',
                    );
                    const initial = index === 1 ? 1 : 0;
                    assert.equal(
                        await tabs.nth(initial).getAttribute('aria-selected'),
                        'true',
                    );
                    assert.equal(await group.getByRole('tabpanel').count(), 1);
                    for (let tab = 0; tab < 3; tab += 1) {
                        const button = tabs.nth(tab);
                        const panelId =
                            await button.getAttribute('aria-controls');
                        const panel = group.locator(`[id="${panelId}"]`);
                        assert.equal(
                            await panel.getAttribute('aria-labelledby'),
                            await button.getAttribute('id'),
                        );
                        await button.click();
                        assert.equal(
                            await button.getAttribute('aria-selected'),
                            'true',
                        );
                        assert.equal(await panel.isVisible(), true);
                        if (index === 2) {
                            const listBounds = await group
                                .locator('.ss-tabs__list')
                                .boundingBox();
                            const panelBounds = await panel.boundingBox();
                            const tabBounds = await button.boundingBox();
                            assert(listBounds && panelBounds);
                            assert(tabBounds);
                            assert(
                                Math.abs(
                                    listBounds.y +
                                        listBounds.height -
                                        panelBounds.y -
                                        1,
                                ) < 1,
                                'Lifted tabs must join the panel without a gap',
                            );
                            assert(
                                Math.abs(
                                    tabBounds.y +
                                        tabBounds.height -
                                        panelBounds.y -
                                        1,
                                ) < 1,
                                'The active lifted tab must touch its panel',
                            );
                        }
                    }
                    await tabs.nth(2).press('ArrowRight');
                    assert.equal(
                        await tabs.nth(0).getAttribute('aria-selected'),
                        'true',
                    );
                    await tabs.nth(0).press('ArrowLeft');
                    assert.equal(
                        await tabs.nth(2).getAttribute('aria-selected'),
                        'true',
                    );
                    await tabs.nth(2).press('Home');
                    assert.equal(
                        await tabs.nth(0).getAttribute('aria-selected'),
                        'true',
                    );
                    await tabs.nth(0).press('End');
                    assert.equal(
                        await tabs.nth(2).getAttribute('aria-selected'),
                        'true',
                    );
                    await page.keyboard.press('Tab');
                    assert.equal(
                        await group
                            .getByRole('tabpanel')
                            .evaluate(
                                (element) => element === document.activeElement,
                            ),
                        true,
                    );
                    const activeResults = await new AxeBuilder({
                        page,
                    }).analyze();
                    assert.deepEqual(
                        activeResults.violations.map(
                            (violation) =>
                                `${violation.id}: ${violation.nodes.map((node) => `${node.target.join(' ')} ${node.failureSummary}`).join('; ')}`,
                        ),
                        [],
                    );
                    assert.equal(
                        await outerTabs.nth(0).getAttribute('aria-selected'),
                        'true',
                        'Inner keyboard navigation must leave the outer selection unchanged',
                    );
                    await outerTabs.nth(1).click();
                    assert.equal(await group.isVisible(), false);
                    const code = example
                        .locator(':scope > .ss-tab')
                        .nth(1)
                        .locator('pre[data-language="mdx"]');
                    assert.equal(await code.isVisible(), true);
                    const source = await code.innerText();
                    assert(
                        source.includes(
                            "import { Tabs, Tab } from 'sproutsite/components';",
                        ),
                    );
                    assert(
                        !source.includes(
                            german ? 'Vorschau und Code' : 'Preview and code',
                        ),
                    );
                    if (index === 0)
                        assert(
                            source.includes('```sh'),
                            'The inner shell fence must remain part of the MDX sample',
                        );
                    assert.equal(
                        await tabs.nth(2).getAttribute('aria-selected'),
                        'true',
                        'Hiding the preview must preserve the inner selection',
                    );
                    assert(
                        await page.evaluate(
                            () =>
                                document.documentElement.scrollWidth <=
                                innerWidth,
                        ),
                    );
                    await outerTabs.nth(1).press('ArrowLeft');
                    assert.equal(
                        await outerTabs.nth(0).getAttribute('aria-selected'),
                        'true',
                    );
                    assert.equal(await tabs.nth(2).isVisible(), true);
                    assert.equal(
                        await tabs.nth(2).getAttribute('aria-selected'),
                        'true',
                        'Returning to the preview must preserve the inner selection',
                    );
                }
                assert.equal(
                    await groups
                        .nth(0)
                        .getByRole('tab')
                        .nth(2)
                        .getAttribute('aria-selected'),
                    'true',
                );
                const ids = await page
                    .locator('[id]')
                    .evaluateAll((elements) =>
                        elements.map((element) => element.id),
                    );
                assert.equal(new Set(ids).size, ids.length);
                await page.evaluate(() => window.scrollTo(0, 0));
            }
            if (
                [
                    '/showcase/foundations/',
                    '/de/showcase/foundations/',
                ].includes(route)
            ) {
                const kinds = [
                    'colors',
                    'type',
                    'spacing',
                    'radius',
                    'shadow',
                    'focus',
                ];
                const groups = page.locator('.content-prose > .ss-tabs');
                assert.equal(await groups.count(), kinds.length);
                assert.equal(
                    await page.locator('.ss-foundation-sample').count(),
                    kinds.length,
                );
                assert.equal(
                    await page
                        .locator('main table, main .ss-card, main .ss-alert')
                        .count(),
                    0,
                );
                for (let index = 0; index < kinds.length; index += 1) {
                    const group = groups.nth(index);
                    const preview = group.getByRole('tab', {
                        name: previewLabel,
                        exact: true,
                    });
                    const code = group.getByRole('tab', {
                        name: 'Code',
                        exact: true,
                    });
                    assert.equal(
                        await preview.getAttribute('aria-selected'),
                        'true',
                    );
                    const panel = group.getByRole('tabpanel');
                    const sample = panel.locator(
                        `.ss-foundation-sample--${kinds[index]}`,
                    );
                    assert.equal(await sample.isVisible(), true);
                    if (index === 0) {
                        const swatches = sample.locator(
                            '.ss-foundation-sample__swatch',
                        );
                        assert.equal(await swatches.count(), 12);
                        assert.equal(
                            await sample
                                .locator(
                                    '.ss-foundation-sample__swatch--primary',
                                )
                                .evaluate(
                                    (element) =>
                                        getComputedStyle(element)
                                            .backgroundColor,
                                ),
                            'rgb(19, 75, 112)',
                        );
                    }
                    if (index === 1) {
                        assert(
                            (
                                await sample
                                    .locator('.ss-foundation-sample__display')
                                    .evaluate(
                                        (element) =>
                                            getComputedStyle(element)
                                                .fontFamily,
                                    )
                            ).includes(
                                loadSiteConfig(
                                    route.startsWith('/de/') ? 'de' : 'en',
                                ).typography.headings.family === 'serif'
                                    ? 'EB Garamond'
                                    : 'Nunito',
                            ),
                        );
                        assert(
                            !(
                                await sample
                                    .locator('.ss-foundation-sample__body')
                                    .evaluate(
                                        (element) =>
                                            getComputedStyle(element)
                                                .fontFamily,
                                    )
                            ).includes('Nunito'),
                        );
                    }
                    if (index === 2) {
                        const widths = await sample
                            .locator('.ss-foundation-sample__space')
                            .evaluateAll((elements) =>
                                elements.map(
                                    (element) =>
                                        element.getBoundingClientRect().width,
                                ),
                            );
                        assert.deepEqual(widths, [4, 8, 16, 24, 32]);
                    }
                    if (index === 3) {
                        const radii = await sample
                            .locator('.ss-foundation-sample__shape')
                            .evaluateAll((elements) =>
                                elements.map(
                                    (element) =>
                                        getComputedStyle(element)
                                            .borderTopLeftRadius,
                                ),
                            );
                        assert.deepEqual(radii, ['0px', '8px', '12px']);
                    }
                    if (index === 4) {
                        const shadows = await sample
                            .locator('.ss-foundation-sample__elevation')
                            .evaluateAll((elements) =>
                                elements.map(
                                    (element) =>
                                        getComputedStyle(element).boxShadow,
                                ),
                            );
                        assert.equal(shadows[0], 'none');
                        assert.equal(new Set(shadows).size, 4);
                    }
                    if (index === 5) {
                        await preview.focus();
                        await page.keyboard.press('Tab');
                        assert(
                            await panel.evaluate(
                                (element) => element === document.activeElement,
                            ),
                        );
                        await page.keyboard.press('Tab');
                        const link = sample.getByRole('link', {
                            name: german
                                ? 'Zum Hauptinhalt'
                                : 'Go to main content',
                        });
                        assert(
                            await link.evaluate(
                                (element) =>
                                    element === document.activeElement &&
                                    element.matches(':focus-visible'),
                            ),
                        );
                        const focus = await link.evaluate((element) => ({
                            width: getComputedStyle(element).outlineWidth,
                            offset: getComputedStyle(element).outlineOffset,
                        }));
                        assert.deepEqual(focus, {
                            width: '3px',
                            offset: '3px',
                        });
                        await page.keyboard.press('Enter');
                        await page.waitForURL(
                            (url) => url.hash === '#main-content',
                        );
                        assert.equal(new URL(page.url()).hash, '#main-content');
                    }
                    await code.click();
                    const codePanel = group.getByRole('tabpanel');
                    assert(
                        (
                            await codePanel
                                .locator('pre[data-language="mdx"]')
                                .innerText()
                        ).includes(
                            `<FoundationSample kind="${kinds[index]}" />`,
                        ),
                    );
                    const css = codePanel.locator('pre[data-language="css"]');
                    assert.equal(await css.isVisible(), true);
                    const colors = await css
                        .locator('span[style]')
                        .evaluateAll((elements) =>
                            Array.from(
                                new Set(
                                    elements.map(
                                        (element) =>
                                            getComputedStyle(element).color,
                                    ),
                                ),
                            ),
                        );
                    assert(colors.length >= 2);
                    assert(
                        await page.evaluate(
                            () =>
                                document.documentElement.scrollWidth <=
                                innerWidth,
                        ),
                    );
                    await code.press('ArrowLeft');
                    assert.equal(
                        await preview.getAttribute('aria-selected'),
                        'true',
                    );
                }
                await page.evaluate(() => window.scrollTo(0, 0));
                await page.screenshot({
                    path: join(
                        tmpdir(),
                        `sproutsite-foundations-${viewport.name}.png`,
                    ),
                    fullPage: true,
                });
            }
            if (
                ['/documentation/theme/', '/de/dokumentation/theme/'].includes(
                    route,
                )
            ) {
                assert.equal(
                    await page
                        .getByRole('heading', {
                            name: tokenHeading,
                            exact: true,
                        })
                        .count(),
                    1,
                );
                const tokenReference = page
                    .locator('main section.ss-section')
                    .filter({
                        has: page.getByRole('heading', {
                            name: tokenHeading,
                            exact: true,
                        }),
                    });
                assert.equal(await tokenReference.locator('table').count(), 6);
                assert.equal(
                    await page.locator('.ss-foundation-sample').count(),
                    0,
                );
            }
            if (
                ['/showcase/sections/', '/de/showcase/sections/'].includes(
                    route,
                )
            ) {
                const groups = page.locator('.ss-tabs');
                const tones = [
                    'default',
                    'muted',
                    'brand',
                    'muted',
                    'default',
                    'muted',
                    'default',
                    'muted',
                    'muted',
                ];
                const fullWidths = [
                    true,
                    true,
                    true,
                    false,
                    true,
                    true,
                    true,
                    true,
                    true,
                ];
                const widths: number[] = [];
                const paddings: { top: number; bottom: number }[] = [];
                assert.equal(await groups.count(), 9);
                for (let index = 0; index < tones.length; index += 1) {
                    const group = groups.nth(index);
                    const preview = group.getByRole('tab', {
                        name: previewLabel,
                        exact: true,
                    });
                    const code = group.getByRole('tab', {
                        name: 'Code',
                        exact: true,
                    });
                    assert.equal(
                        await preview.getAttribute('aria-selected'),
                        'true',
                    );
                    const sectionState = await group.evaluate((element) => {
                        const section = element.closest('.ss-section');
                        const content =
                            section?.querySelector('.content-prose');
                        if (!section || !content)
                            throw new Error('Missing Section container');
                        return {
                            classes: Array.from(section.classList),
                            constrained: content.classList.contains(
                                'ss-section__content',
                            ),
                            width: content.getBoundingClientRect().width,
                            padding: {
                                top: parseFloat(
                                    getComputedStyle(section).paddingTop,
                                ),
                                bottom: parseFloat(
                                    getComputedStyle(section).paddingBottom,
                                ),
                            },
                        };
                    });
                    assert(
                        sectionState.classes.includes(`tone-${tones[index]}`),
                    );
                    assert.equal(sectionState.constrained, !fullWidths[index]);
                    widths.push(sectionState.width);
                    paddings.push(sectionState.padding);
                    const spacing =
                        index === 5
                            ? 'small'
                            : index === 7
                              ? 'large'
                              : 'default';
                    assert.ok(
                        sectionState.classes.includes(
                            `ss-section--spacing-${spacing}`,
                        ),
                    );
                    const heading = await group
                        .getByRole('tabpanel')
                        .getByRole('heading')
                        .innerText();
                    await code.click();
                    const sample = group
                        .getByRole('tabpanel')
                        .locator('pre[data-language="markdown"]');
                    const source = await sample.innerText();
                    assert(source.startsWith('---\n'));
                    if (index === 8) {
                        assert.ok(source.includes('odd: default'));
                        assert.ok(source.includes('even: muted'));
                    } else assert(source.includes(`tone: ${tones[index]}`));
                    assert(source.includes(`fullWidth: ${fullWidths[index]}`));
                    if (index >= 5)
                        assert.ok(source.includes(`spacing: ${spacing}`));
                    assert(source.includes(`## ${heading}`));
                    assert.equal(await sample.isVisible(), true);
                    assert(
                        await page.evaluate(
                            () =>
                                document.documentElement.scrollWidth <=
                                innerWidth,
                        ),
                    );
                    await code.press('ArrowLeft');
                    assert.equal(
                        await preview.getAttribute('aria-selected'),
                        'true',
                    );
                }
                if (viewport.name === 'desktop') assert(widths[3] < widths[4]);
                else assert.equal(widths[3], widths[4]);
                for (const index of [5, 6, 7]) {
                    const factor =
                        viewport.name === 'mobile'
                            ? 1
                            : index === 5
                              ? 0.5
                              : index === 7
                                ? 2
                                : 1;
                    assert.ok(
                        Math.abs(
                            paddings[index]!.top - paddings[6]!.top * factor,
                        ) < 0.1,
                    );
                    assert.ok(
                        Math.abs(
                            paddings[index]!.bottom -
                                paddings[6]!.bottom * factor,
                        ) < 0.1,
                    );
                }
                await page.evaluate(() => window.scrollTo(0, 0));
            }
            const cardHints = page.locator('main .ss-card__badge-hint');
            if ((await cardHints.count()) > 0) {
                const firstHint = cardHints.first();
                await page.mouse.move(0, 0);
                await page.evaluate(() =>
                    window.scrollTo({
                        top: document.body.scrollHeight,
                        behavior: 'instant',
                    }),
                );
                await firstHint.focus();
                const hintId = await firstHint.getAttribute('aria-describedby');
                assert.ok(
                    hintId,
                    'A card hint needs an accessible description.',
                );
                const tooltip = page.locator(`[id="${hintId}"]`);
                // Focusing from a distant scroll position must not close the hint.
                await tooltip.waitFor({ state: 'visible' });
                await page.keyboard.press('Escape');
                await tooltip.waitFor({ state: 'hidden' });
                assert.ok(
                    await firstHint.evaluate(
                        (element) => element === document.activeElement,
                    ),
                );
                await page.keyboard.press('Shift+Tab');
                await page.keyboard.press('Tab');
                assert.ok(
                    await firstHint.evaluate(
                        (element) =>
                            element === document.activeElement &&
                            element.matches(':focus-visible'),
                    ),
                );
                await tooltip.waitFor({ state: 'visible' });
                await page.keyboard.press('Escape');
                await tooltip.waitFor({ state: 'hidden' });
            }
            const canScroll = await page.evaluate(
                () =>
                    document.documentElement.scrollHeight -
                        window.innerHeight >=
                    10,
            );
            if (!canScroll) {
                await page.close();
                continue;
            }
            await page.evaluate(() => window.scrollTo(0, 10));
            await page.waitForFunction(() =>
                document
                    .querySelector('.ss-header')
                    ?.classList.contains('ss-header--scrolled'),
            );
            const scrolledHeader = await header.evaluate((element) => {
                const styles = getComputedStyle(element);
                return {
                    backdropFilter: styles.backdropFilter,
                    position: styles.position,
                };
            });
            if (
                scrolledHeader.position !== 'fixed' ||
                scrolledHeader.backdropFilter === 'none'
            )
                throw new Error(
                    `${viewport.name} ${route}: header does not use the fixed glass state after scrolling`,
                );
            console.log(`PASS ${viewport.name} ${route}`);
            await page.close();
        }
        await context.close();
    }
    const staticContext = await browser.newContext({
        javaScriptEnabled: false,
        viewport: { width: 390, height: 844 },
    });
    const staticPage = await staticContext.newPage();
    await staticPage.goto(`${baseUrl}/showcase/tabs/`);
    assert.equal(await staticPage.locator('.ss-tab:visible').count(), 15);
    assert.equal(
        await staticPage.locator('.ss-tab__label:visible').count(),
        15,
    );
    assert.equal(await staticPage.locator('.ss-tabs__list:visible').count(), 0);
    await staticPage.goto(`${baseUrl}/showcase/foundations/`);
    assert.equal(
        await staticPage.locator('.ss-foundation-sample:visible').count(),
        6,
    );
    await staticPage.goto(`${baseUrl}/showcase/tables/`);
    assert.equal(
        await staticPage.locator('.ss-content-table:visible').count(),
        6,
    );
    assert.equal(await staticPage.locator('caption:visible').count(), 6);
    await staticContext.close();
    await browser.close();
    console.log(
        `Axe, keyboard-focus, and viewport-overflow checks passed for ${testedRoutes.length} routes on mobile and desktop.`,
    );
} finally {
    await new Promise<void>((resolveClose, reject) => {
        previewServer.close((error) =>
            error ? reject(error) : resolveClose(),
        );
    });
}
