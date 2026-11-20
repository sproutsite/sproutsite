import { readFileSync, realpathSync, statSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { imageMetadata } from 'astro/assets/utils';
import { z } from 'zod';

export const publicAssetPath = z.string().refine(
    (value) =>
        /^\/(?!\/)[A-Za-z0-9_./-]+$/.test(value) &&
        value
            .slice(1)
            .split('/')
            .every((part) => part && part !== '.' && part !== '..'),
    'must be a root-relative public file path without a base, query, fragment or traversal',
);

export function publicAssetFile(src: string, root = process.cwd()): string {
    if (!publicAssetPath.safeParse(src).success)
        throw new Error(`Unsafe public asset path: ${src}`);
    const directory = realpathSync(resolve(root, 'public'));
    const file = realpathSync(resolve(directory, `.${src}`));
    const within = relative(directory, file);
    if (
        within.startsWith(`..${sep}`) ||
        within === '..' ||
        !statSync(file).isFile()
    )
        throw new Error(`Asset must be a file inside public/: ${src}`);
    return file;
}

export async function publicImageMetadata(src: string, root = process.cwd()) {
    return imageMetadata(readFileSync(publicAssetFile(src, root)), src);
}
