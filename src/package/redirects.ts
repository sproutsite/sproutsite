import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import type { AstroIntegration } from 'astro';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    loadRedirects,
    redirectPathKey,
    redirectsFile,
    renderRedirects,
    validateRedirectBase,
    type Redirect,
} from '../lib/sproutsite/redirects.js';
import { withBase } from '../lib/sproutsite/urls.js';

export function redirectIntegration(base: string): AstroIntegration {
    let root: URL;
    let redirects: Redirect[] | undefined;
    return {
        name: 'sproutsite/redirects',
        hooks: {
            'astro:config:setup': ({ config, addWatchFile }) => {
                root = config.root;
                const file = new URL(redirectsFile, root);
                redirects = loadRedirects(file);
                if (redirects?.length) validateRedirectBase(base);
                addWatchFile(file);
            },
            'astro:server:setup': ({ server }) => {
                const rules = new Map(
                    redirects?.map((rule) => [rule.from, rule]),
                );
                if (!rules.size) return;
                // Astro has already stripped the deployment base at this point.
                server.middlewares.use((request, response, next) => {
                    const url = request.url ?? '';
                    const queryIndex = url.indexOf('?');
                    const pathname =
                        queryIndex < 0 ? url : url.slice(0, queryIndex);
                    const rule = rules.get(pathname);
                    if (!rule) return next();
                    const query = queryIndex < 0 ? '' : url.slice(queryIndex);
                    response.writeHead(rule.status, {
                        Location: withBase(rule.to, base) + query,
                    });
                    response.end();
                });
            },
            'astro:build:done': ({ pages, dir, logger }) => {
                const output = fileURLToPath(dir);
                const published = new Set(
                    pages.map(({ pathname }) => redirectPathKey(pathname)),
                );
                for (const { from, to } of redirects ?? []) {
                    const file = join(output, from);
                    if (
                        published.has(redirectPathKey(from)) ||
                        (existsSync(file) && statSync(file).isFile())
                    )
                        throw new Error(
                            `${redirectsFile}: source path ${from} conflicts with published output.`,
                        );
                    if (!published.has(redirectPathKey(to)))
                        throw new Error(
                            `${redirectsFile}: target page ${to} for ${from} does not exist.`,
                        );
                }

                const directory = new URL('artifacts/redirects/', root);
                // Clear previously generated rules if the source file was removed.
                if (
                    !redirects &&
                    !existsSync(new URL('nginx.conf', directory)) &&
                    !existsSync(new URL('apache.conf', directory))
                )
                    return;
                const snippets = renderRedirects(redirects ?? [], base);
                mkdirSync(directory, { recursive: true });
                writeFileSync(new URL('nginx.conf', directory), snippets.nginx);
                writeFileSync(
                    new URL('apache.conf', directory),
                    snippets.apache,
                );
                logger.info(
                    'Generated artifacts/redirects/nginx.conf and apache.conf.',
                );
            },
        },
    };
}
