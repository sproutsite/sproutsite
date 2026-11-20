import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { assertSafeNewTabLinks } from './check-link-security.js';
import { loadSiteConfig } from '../src/lib/sproutsite/site-config.js';
import {
    canonicalUrl,
    contentHref,
    withBase,
} from '../src/lib/sproutsite/urls.js';

const site = loadSiteConfig();
for (const locale of site.i18n.locales) {
    for (const status of [404, 500]) {
        if (existsSync(join('dist', String(status))))
            throw new Error(`Unexpected error page directory: dist/${status}`);
        const suffix = locale === site.i18n.locale ? '' : `-${locale}`;
        if (existsSync(join('dist', locale, String(status))))
            throw new Error(
                `Unexpected localized error page directory: ${locale}/${status}`,
            );
        const file = join('dist', `${status}${suffix}.html`);
        if (!existsSync(file)) throw new Error(`Missing error page: ${file}`);
        const html = readFileSync(file, 'utf8');
        if (
            !html.includes('ss-hero--small') ||
            !html.includes(`lang="${locale}"`) ||
            !html.includes(
                `href="${contentHref('/', loadSiteConfig(locale))}"`,
            ) ||
            !html.includes('ss-section__content') ||
            (
                html
                    .match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1]
                    ?.match(/<h2\b/g) ?? []
            ).length !== 1 ||
            !html.includes('name="robots" content="noindex, follow"') ||
            (html.match(/<h1\b/g) ?? []).length !== 1 ||
            (html.match(/<main\b/g) ?? []).length !== 1
        )
            throw new Error(`Error page contract failed: ${file}`);
    }
}
const germanSite = site.i18n.locales.includes('de')
    ? loadSiteConfig('de')
    : undefined;
const pages = [
    { route: '/', site },
    { route: '/faq/', site },
    { route: '/info/', site },
    { route: '/showcase/', site },
    { route: '/contact/', site },
    ...(germanSite
        ? [
              { route: '/de/', site: germanSite },
              { route: '/de/kontakt/', site: germanSite },
          ]
        : []),
];
for (const { route, site: pageSite } of pages) {
    const relativeFile =
        route === '/' ? 'index.html' : join(route, 'index.html');
    const path = join('dist', relativeFile);
    if (!existsSync(path)) throw new Error(`Missing generated page: ${path}`);
    const html = readFileSync(path, 'utf8');
    if (
        !html.includes(
            `<link rel="canonical" href="${canonicalUrl(route, pageSite)}"`,
        )
    )
        throw new Error(`Missing canonical for ${route}`);
    if (!/<meta name="description" content="[^"]+"/.test(html))
        throw new Error(`Missing description for ${route}`);
    if (
        (html.match(/<main\b/g) ?? []).length !== 1 ||
        (html.match(/<h1\b/g) ?? []).length !== 1
    )
        throw new Error(`Main/H1 contract failed for ${route}`);
}
const sitemap = readdirSync('dist').find(
    (name) => name === 'sitemap-index.xml' || name === 'sitemap-0.xml',
);
if (!sitemap) throw new Error('Sitemap output is missing');
const home = readFileSync(join('dist', 'index.html'), 'utf8');
// Metadata must point at emitted files, including after a subpath deployment.
function emittedFile(url: string): string {
    const pathname = new URL(url, site.url).pathname;
    if (!pathname.startsWith(site.base))
        throw new Error(`Brand asset is missing deployment base: ${url}`);
    const file = join('dist', pathname.slice(site.base.length));
    if (!existsSync(file)) throw new Error(`Missing brand asset: ${url}`);
    return file;
}
for (const match of home.matchAll(
    /<link\b[^>]*rel="(?:icon|apple-touch-icon|manifest)"[^>]*href="([^"]+)"/g,
)) {
    emittedFile(match[1]!);
}
const manifest = JSON.parse(
    readFileSync(emittedFile(withBase('/site.webmanifest', site.base)), 'utf8'),
) as {
    name: string;
    start_url: string;
    scope: string;
    icons: { src: string; sizes: string }[];
};
if (
    manifest.name !== site.name ||
    manifest.start_url !== site.base ||
    manifest.scope !== site.base
)
    throw new Error('Manifest does not match site configuration');
if (manifest.icons.map((icon) => icon.sizes).join(',') !== '192x192,512x512')
    throw new Error('Missing web app icon sizes');
for (const icon of manifest.icons) emittedFile(icon.src);
if (site.name === 'Sproutsite') {
    const image = home.match(
        /<meta property="og:image" content="([^"]+)"/,
    )?.[1];
    if (!image || !image.startsWith(site.url))
        throw new Error('Missing absolute product social image');
    emittedFile(image);
}
if (!home.includes(`href="${withBase('/faq/', site.base)}"`))
    throw new Error(
        'Base-prefixed internal links are missing from built output',
    );

// Check localized page targets and anchors against the actual static output.
const htmlFiles = readdirSync('dist', { recursive: true }).filter(
    (file): file is string =>
        typeof file === 'string' &&
        (file === 'index.html' ||
            file.endsWith('/index.html') ||
            /^(404|500)(-[a-z]{2})?\.html$/.test(file)),
);
const htmlByFile = new Map(
    htmlFiles.map((file) => [
        join('dist', file),
        readFileSync(join('dist', file), 'utf8'),
    ]),
);
const sitemapXml = readFileSync(join('dist', 'sitemap.xml'), 'utf8');
const sitemapEntries = [...sitemapXml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(
    (match) => match[1]!,
);
const locations = new Set(
    sitemapEntries.map((entry) => entry.match(/<loc>([^<]+)<\/loc>/)?.[1]),
);
const indexablePages = [...htmlByFile.values()].filter(
    (html) => !html.includes('name="robots" content="noindex, follow"'),
);
if (
    locations.size !== indexablePages.length ||
    sitemapEntries.length !== locations.size
)
    throw new Error('Sitemap must list every indexable page exactly once');
for (const html of indexablePages) {
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    if (!canonical || !locations.has(canonical))
        throw new Error(`Missing sitemap page: ${canonical}`);
}
for (const entry of sitemapEntries) {
    const lastmod = entry.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
    if (!lastmod || !Number.isFinite(Date.parse(lastmod)))
        throw new Error('Missing or invalid sitemap lastmod');
    for (const alternate of entry.matchAll(
        /<xhtml:link\b[^>]*href="([^"]+)"/g,
    )) {
        if (!locations.has(alternate[1]))
            throw new Error(
                `Sitemap alternate is not an indexable page: ${alternate[1]}`,
            );
    }
    if (!entry.includes('hreflang='))
        throw new Error('Missing sitemap language links');
}
for (const [file, html] of htmlByFile) {
    assertSafeNewTabLinks(html, file);
    const route = file.slice('dist/'.length).replace(/index\.html$/, '');
    const pageUrl = new URL(withBase(`/${route}`, site.base), site.url);
    for (const match of html.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)) {
        const target = new URL(match[1]!.replaceAll('&amp;', '&'), pageUrl);
        if (
            !['http:', 'https:'].includes(target.protocol) ||
            target.origin !== pageUrl.origin
        )
            continue;
        if (!target.pathname.startsWith(site.base)) {
            // Explicit production URLs may intentionally point outside a demo deployment.
            if (/^https?:\/\//i.test(match[1]!)) continue;
            throw new Error(
                `${file}: link misses deployment base: ${match[1]}`,
            );
        }
        const relativeTarget = decodeURIComponent(
            target.pathname.slice(site.base.length),
        );
        if (relativeTarget.split('/').includes('..'))
            throw new Error(`${file}: invalid link target: ${match[1]}`);
        let targetFile = join('dist', relativeTarget);
        if (existsSync(targetFile) && statSync(targetFile).isDirectory())
            targetFile = join(targetFile, 'index.html');
        if (!existsSync(targetFile))
            throw new Error(`${file}: missing internal target: ${match[1]}`);
        if (target.hash && targetFile.endsWith('.html')) {
            const targetHtml =
                htmlByFile.get(targetFile) ?? readFileSync(targetFile, 'utf8');
            const ids = new Set(
                [...targetHtml.matchAll(/\sid="([^"]+)"/g)].map((id) => id[1]),
            );
            if (!ids.has(decodeURIComponent(target.hash.slice(1))))
                throw new Error(`${file}: missing fragment: ${match[1]}`);
        }
    }
}
console.log(
    'Built pages, metadata, sitemap, base-prefixed links, and new-tab link security verified.',
);
