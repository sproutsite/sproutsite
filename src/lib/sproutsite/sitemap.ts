import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { parse } from 'yaml';
import type { SitemapItem } from '@astrojs/sitemap';
import { assemblePages } from './pages.js';
import { localeOf, logicalId } from './language-links.js';
import { blogRouteFromId, canonicalUrl } from './urls.js';
import { loadSiteConfig } from './site-config.js';

interface MetadataEntry {
    id: string;
    file: string;
    data: { url?: string };
}

function metadataFiles(directory: string): MetadataEntry[] {
    if (!existsSync(directory)) return [];
    return readdirSync(directory, { recursive: true })
        .filter(
            (file): file is string =>
                typeof file === 'string' &&
                /(?:^|\/)page(?:\.de)?\.yaml$/.test(file),
        )
        .map((file) => ({
            id: file.replace(/\.yaml$/, ''),
            file: join(directory, file),
            data: parse(readFileSync(join(directory, file), 'utf8')) as {
                url?: string;
            },
        }));
}

/** Node-compatible metadata for the official sitemap serializer; no Astro runtime APIs. */
export function createSitemapMetadata(root = process.cwd()) {
    const site = loadSiteConfig(undefined, root);
    const pages = metadataFiles(join(root, 'src/content/pages'));
    const posts = metadataFiles(join(root, 'src/content/blog'));
    const entries: {
        key: string;
        locale: string;
        url: string;
        files: string[];
        directory?: string;
    }[] = [];
    for (const locale of site.locales) {
        const localizedSite = loadSiteConfig(locale, root);
        const siteFiles = [
            join(root, 'src/content/site.yaml'),
            join(root, `src/content/site.${locale}.yaml`),
        ].filter(existsSync);
        const filesFor = (entry: MetadataEntry) => [
            ...siteFiles,
            ...readdirSync(dirname(entry.file))
                .filter(
                    (name) =>
                        name ===
                            (locale === 'en'
                                ? 'page.yaml'
                                : `page.${locale}.yaml`) ||
                        (/\.(md|mdx)$/.test(name) &&
                            localeOf(name.replace(/\.(md|mdx)$/, '')) ===
                                locale),
                )
                .map((name) => join(dirname(entry.file), name)),
        ];
        for (const page of assemblePages(
            pages.filter((entry) => localeOf(entry.id) === locale),
            [],
            undefined,
            (entry) => logicalId(entry.id),
        )) {
            entries.push({
                key: `page:${logicalId(page.entry.id)}`,
                locale,
                url: canonicalUrl(page.route, localizedSite),
                files: filesFor(page.entry),
                directory: dirname(page.entry.file),
            });
        }
        const localizedPosts = posts.filter(
            (entry) => localeOf(entry.id) === locale,
        );
        for (const post of localizedPosts) {
            const articleId = dirname(post.id);
            entries.push({
                key: `post:${articleId}`,
                locale,
                url: canonicalUrl(blogRouteFromId(articleId), localizedSite),
                files: filesFor(post),
                directory: dirname(post.file),
            });
        }
        entries.push({
            key: 'blog-index',
            locale,
            url: canonicalUrl('/blog/', localizedSite),
            files: [...siteFiles, ...localizedPosts.map((post) => post.file)],
        });
    }

    const git = (args: string[]) => {
        try {
            return execFileSync('git', args, {
                cwd: root,
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
            });
        } catch {
            return '';
        }
    };
    const changed = git([
        'status',
        '--porcelain=v1',
        '-z',
        '--untracked-files=all',
    ])
        .split('\0')
        .filter((line) => line.length > 3)
        .map((line) => resolve(root, line.slice(3)));
    const modified = (files: string[], directory?: string) => {
        // Include deleted direct content files in the history query as well.
        const paths = files.map((file) => relative(root, file));
        if (directory) paths.push(`:(glob)${relative(root, directory)}/*`);
        const committed = git([
            'log',
            '-1',
            '--format=%cI',
            '--',
            ...paths,
        ]).trim();
        const times = committed ? [Date.parse(committed)] : [];
        for (const file of files) {
            if (!committed || changed.includes(resolve(file)))
                times.push(statSync(file).mtimeMs);
        }
        return new Date(Math.max(...times)).toISOString();
    };
    const metadata = new Map<string, Pick<SitemapItem, 'lastmod' | 'links'>>();
    for (const entry of entries) {
        const equivalents = entries.filter(
            (candidate) => candidate.key === entry.key,
        );
        const links = equivalents.map((candidate) => ({
            lang: candidate.locale,
            url: candidate.url,
        }));
        const defaultEntry = equivalents.find(
            (candidate) => candidate.locale === site.language,
        );
        if (defaultEntry)
            links.push({ lang: 'x-default', url: defaultEntry.url });
        metadata.set(entry.url, {
            links,
            lastmod: modified(entry.files, entry.directory),
        });
    }
    return metadata;
}
