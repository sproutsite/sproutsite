import { readFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import type { CollectionEntry } from 'astro:content';
import { assemblePages } from '../../src/lib/sproutsite/pages.js';
import {
    localeOf,
    logicalId,
} from '../../src/lib/sproutsite/language-links.js';
import { canonicalUrl, contentHref } from '../../src/lib/sproutsite/urls.js';
import { loadSiteConfig } from '../../src/lib/sproutsite/site-config.js';
import { pageDirectoryFromId } from '../../src/lib/sproutsite/urls.js';
import { normalizeMarkdown, sha256, contentHash } from './markdown.js';
import { snapshotSchema, type McpSnapshot } from './schema.js';

const componentPages: Record<string, string> = {
    Alert: 'showcase/alerts',
    ContentTable: 'showcase/tables',
    FoundationSample: 'showcase/foundations',
    Tabs: 'showcase/tabs',
    Tab: 'showcase/tabs',
    Card: 'showcase/cards',
    CardActions: 'showcase/cards',
    ContentImage: 'showcase/images',
    Eyebrow: 'showcase/typography',
    Badge: 'showcase/badges',
    Button: 'showcase/buttons',
    Icon: 'showcase/icons',
    Feature: 'showcase/features',
    LegalIdentity: 'documentation/content',
    PrivacyInfrastructure: 'documentation/content',
    Accordion: 'showcase/accordions',
    AccordionItem: 'showcase/accordions',
    Column: 'showcase/layout',
    Columns: 'showcase/layout',
    DefaultHeader:
        'documentation/getting-started/your-website/header-and-footer',
    DefaultFooter:
        'documentation/getting-started/your-website/header-and-footer',
};

export function gitSource(
    root: string,
): Pick<McpSnapshot['source'], 'commit' | 'dirty'> {
    try {
        const options = {
            cwd: root,
            encoding: 'utf8' as const,
            stdio: ['ignore', 'pipe', 'ignore'] as ['ignore', 'pipe', 'ignore'],
        };
        const commit = execFileSync(
            'git',
            ['rev-parse', 'HEAD'],
            options,
        ).trim();
        if (!/^[a-f0-9]{40,64}$/.test(commit))
            throw new Error('Invalid Git revision');
        const dirty =
            execFileSync(
                'git',
                ['status', '--porcelain=v1', '--untracked-files=normal'],
                options,
            ).trim().length > 0;
        return { commit, dirty };
    } catch {
        return { commit: null, dirty: null };
    }
}

export function componentNames(source: string): string[] {
    const file = ts.createSourceFile(
        'components.ts',
        source,
        ts.ScriptTarget.Latest,
        true,
    );
    return file.statements.flatMap((statement) => {
        if (!ts.isExportDeclaration(statement)) {
            if (
                ts.isExportAssignment(statement) ||
                (ts.canHaveModifiers(statement) &&
                    ts
                        .getModifiers(statement)
                        ?.some(
                            (modifier) =>
                                modifier.kind === ts.SyntaxKind.ExportKeyword,
                        ) &&
                    !ts.isInterfaceDeclaration(statement) &&
                    !ts.isTypeAliasDeclaration(statement))
            )
                throw new Error(
                    'MCP component indexing requires explicit named runtime re-exports.',
                );
            return [];
        }
        if (statement.isTypeOnly) return [];
        if (
            !statement.exportClause ||
            !ts.isNamedExports(statement.exportClause)
        )
            throw new Error(
                'MCP component indexing requires explicit named runtime re-exports.',
            );
        return statement.exportClause.elements
            .filter((element) => !element.isTypeOnly)
            .map((element) => element.name.text);
    });
}

export function createSnapshot(
    pages: CollectionEntry<'pages'>[],
    documents: CollectionEntry<'documents'>[],
    root = process.cwd(),
    revision = gitSource(root),
): McpSnapshot {
    const defaults = loadSiteConfig(undefined, root);
    const manifest = JSON.parse(
        readFileSync(resolve(root, 'package.json'), 'utf8'),
    ) as {
        name: string;
        version: string;
        repository: { url: string };
        license: string;
    };
    if (
        manifest.name !== 'sproutsite' ||
        manifest.license !== 'Apache-2.0' ||
        readFileSync(resolve(root, 'VERSION'), 'utf8').trim() !==
            manifest.version
    )
        throw new Error(
            'MCP export requires the Sproutsite repository with consistent version and license metadata.',
        );
    function sourceFile(entry: { filePath?: string }) {
        if (!entry.filePath)
            throw new Error(
                'Content Collection entry is missing its source file path.',
            );
        const path = relative(root, resolve(root, entry.filePath)).replaceAll(
            '\\',
            '/',
        );
        if (!/^src\/content\/pages\/(documentation|showcase)\//.test(path))
            throw new Error(`Unexpected MCP source: ${path}`);
        return {
            path,
            sha256: sha256(readFileSync(resolve(root, path), 'utf8')),
        };
    }
    const exported: McpSnapshot['documents'] = [];
    for (const locale of defaults.i18n.locales) {
        const site = loadSiteConfig(locale, root);
        const assembled = assemblePages(
            pages.filter((entry) => localeOf(entry.id) === locale),
            documents.filter((entry) => localeOf(entry.id) === locale),
            undefined,
            (entry) => logicalId(entry.id),
        );
        for (const page of assembled) {
            const pageId = pageDirectoryFromId(logicalId(page.entry.id));
            const kind = pageId.split('/')[0];
            if (kind !== 'documentation' && kind !== 'showcase') continue;
            const url = canonicalUrl(page.route, site);
            const sectionTexts: string[] = [];
            const sections = [page.hero, ...page.sections]
                .filter((entry) => entry !== undefined)
                .map((entry) => {
                    const source = sourceFile(entry);
                    if (entry.body === undefined)
                        throw new Error(`Missing source body: ${source.path}`);
                    const normalized = normalizeMarkdown(
                        entry.body,
                        source.path,
                        (href) =>
                            new URL(
                                href.startsWith('/')
                                    ? contentHref(href, site)
                                    : href,
                                url,
                            ).href,
                    );
                    const { text, ...content } = normalized;
                    sectionTexts.push(text);
                    return {
                        id: logicalId(entry.id).split('/').at(-1)!,
                        source,
                        ...content,
                    };
                });
            const heading = page.hero?.data.title ?? page.entry.data.title;
            const markdown = [
                `# ${heading}`,
                page.entry.data.description,
                ...sections.map((section) => section.markdown),
            ]
                .filter(Boolean)
                .join('\n\n');
            exported.push({
                id: `${pageId}:${locale}`,
                pageId,
                kind,
                locale,
                title: page.entry.data.title,
                heading,
                description: page.entry.data.description,
                url,
                markdown,
                searchText: [
                    page.entry.data.title,
                    heading,
                    page.entry.data.description,
                    ...sectionTexts,
                ].join('\n'),
                sections,
                sourceFiles: [
                    sourceFile(page.entry),
                    ...sections.map((section) => section.source),
                ],
                sha256: '',
                translations: [],
            });
        }
    }
    if (!exported.length)
        throw new Error('MCP export found no documentation or showcase pages.');
    exported.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    for (const document of exported) {
        document.translations = exported
            .filter(
                (entry) =>
                    entry.pageId === document.pageId &&
                    entry.id !== document.id,
            )
            .map(({ locale, id, url }) => ({ locale, id, url }));
        const { sha256: _hash, ...content } = document;
        document.sha256 = contentHash(content);
    }
    const components = componentNames(
        readFileSync(resolve(root, 'src/package/components.ts'), 'utf8'),
    )
        .sort()
        .map((name) => {
            const pageId = componentPages[name];
            if (!pageId)
                throw new Error(
                    `Public component ${name} needs an MCP documentation mapping.`,
                );
            const documents = exported
                .filter((entry) => entry.pageId === pageId)
                .map(({ locale, id }) => ({ locale, id }));
            if (!documents.length)
                throw new Error(
                    `Missing MCP documentation for ${name}: ${pageId}`,
                );
            return {
                name,
                importPath: 'sproutsite/components' as const,
                documents,
            };
        });
    return snapshotSchema.parse({
        schemaVersion: 1,
        sproutsiteVersion: manifest.version,
        source: {
            repository: manifest.repository.url.replace(/\.git$/, ''),
            ...revision,
            license: manifest.license,
        },
        defaultLocale: defaults.i18n.defaultLocale,
        locales: defaults.i18n.locales,
        documents: exported,
        components,
    });
}
