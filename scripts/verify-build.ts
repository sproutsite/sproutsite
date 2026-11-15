import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { loadSiteConfig } from '../src/lib/sproutsite/site-config.js';
import { canonicalUrl, withBase } from '../src/lib/sproutsite/urls.js';

const site = loadSiteConfig();
const germanSite = loadSiteConfig('de');
const pages = [
    { route: '/', site },
    { route: '/faq/', site },
    { route: '/info/', site },
    { route: '/showcase/', site },
    { route: '/contact/', site },
    { route: '/de/', site: germanSite },
    { route: '/de/kontakt/', site: germanSite },
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
        (file === 'index.html' || file.endsWith('/index.html')),
);
const htmlByFile = new Map(
    htmlFiles.map((file) => [
        join('dist', file),
        readFileSync(join('dist', file), 'utf8'),
    ]),
);
for (const [file, html] of htmlByFile) {
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
    'Built pages, metadata, sitemap, and base-prefixed links verified.',
);
