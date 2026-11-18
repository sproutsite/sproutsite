import { existsSync, globSync } from 'node:fs';
import { resolve } from 'node:path';

export const blogPatterns = {
    blogPages: '*/page*.yaml',
    blogDocuments: '*/*.{md,mdx}',
} as const;

/** Check optional sources only; Astro still loads and validates their content. */
export function hasBlogSources(
    collection: keyof typeof blogPatterns,
    directory = resolve(process.cwd(), 'src/content/blog'),
): boolean {
    return (
        existsSync(directory) &&
        globSync(blogPatterns[collection], { cwd: directory }).length > 0
    );
}
