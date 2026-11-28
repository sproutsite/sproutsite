import { cp, readFile, readdir } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration, AstroConfig } from 'astro';
import { createIndex, close } from 'pagefind';

const pagefindLicenses = new URL(
    '../LICENSE/',
    import.meta.resolve('pagefind'),
);
const types: Record<string, string> = {
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.wasm': 'application/wasm',
};

export function siteSearch(
    includePage: (url: string) => boolean = () => true,
): AstroIntegration {
    let config: AstroConfig;
    return {
        name: 'sproutsite/site-search',
        hooks: {
            'astro:config:done': ({ config: resolved }) => {
                config = resolved;
            },
            'astro:server:setup': ({ server }) => {
                const directory = fileURLToPath(
                    new URL('pagefind/', config.outDir),
                );
                // Astro strips the configured base before these middlewares run.
                server.middlewares.use(
                    '/pagefind',
                    async (request, response, next) => {
                        if (
                            request.method !== 'GET' &&
                            request.method !== 'HEAD'
                        )
                            return next();
                        const path = (request.url ?? '')
                            .split('?', 1)[0]!
                            .slice(1);
                        if (
                            !/^[\w-]+(?:\.[\w-]+)*(?:\/[\w-]+(?:\.[\w-]+)*)*$/.test(
                                path,
                            )
                        ) {
                            response.writeHead(404).end();
                            return;
                        }
                        try {
                            const file = await readFile(join(directory, path));
                            response
                                .writeHead(200, {
                                    'Content-Type':
                                        types[extname(path)] ??
                                        'application/octet-stream',
                                    'Content-Length': file.length,
                                    'Cache-Control': 'no-store',
                                })
                                .end(
                                    request.method === 'HEAD'
                                        ? undefined
                                        : file,
                                );
                        } catch (error) {
                            const code = (error as NodeJS.ErrnoException).code;
                            if (
                                code === 'ENOENT' ||
                                code === 'EISDIR' ||
                                code === 'ENOTDIR'
                            ) {
                                response.writeHead(404).end();
                            } else {
                                next(error);
                            }
                        }
                    },
                );
            },
            'astro:build:done': async ({ dir, logger }) => {
                const output = fileURLToPath(dir);
                let count = 0;
                try {
                    const { index, errors } = await createIndex({
                        rootSelector: 'main',
                    });
                    if (!index || errors.length)
                        throw new Error(errors.join('\n'));

                    const files = await readdir(output, {
                        recursive: true,
                        withFileTypes: true,
                    });
                    const pages = files
                        .filter(
                            (file) =>
                                file.isFile() && file.name === 'index.html',
                        )
                        .map((file) => join(file.parentPath, file.name))
                        .sort();
                    for (const page of pages) {
                        // Pagefind adds the base of its own bundle to result URLs.
                        const url =
                            '/' +
                            relative(output, page)
                                .split(sep)
                                .join('/')
                                .replace(/index\.html$/, '');
                        if (/\/(?:404|500)\/$/.test(url) || !includePage(url))
                            continue;
                        const content = await readFile(page, 'utf8');
                        const result = await index.addHTMLFile({
                            url,
                            content,
                        });
                        if (result.errors.length)
                            throw new Error(
                                `${url}: ${result.errors.join('\n')}`,
                            );
                        count++;
                    }
                    const written = await index.writeFiles({
                        outputPath: join(output, 'pagefind'),
                    });
                    if (written.errors.length)
                        throw new Error(written.errors.join('\n'));
                    await cp(
                        pagefindLicenses,
                        join(output, 'pagefind', 'licenses'),
                        { recursive: true },
                    );
                    logger.info(`Indexed ${count} pages.`);
                } finally {
                    await close();
                }
            },
        },
    };
}
