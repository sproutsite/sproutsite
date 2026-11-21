import { statSync } from 'node:fs';
import { extname, isAbsolute, resolve } from 'node:path';

/** The shared layout exposes these two slots only, not an arbitrary registry. */
export interface ComponentOverrides {
    Header?: string;
    Footer?: string;
}

/** Vite aliases select local Astro files at build time; Node imports supply defaults. */
export function resolveComponentAliases(
    components: ComponentOverrides = {},
    root = process.cwd(),
) {
    if (
        typeof components !== 'object' ||
        components === null ||
        Array.isArray(components)
    )
        throw new Error(
            'Sproutsite components must be an object with optional Header and Footer paths.',
        );
    const aliases: { find: string; replacement: string }[] = [];
    for (const [slot, path] of Object.entries(components)) {
        if (slot !== 'Header' && slot !== 'Footer')
            throw new Error(
                `Invalid Sproutsite components.${slot}: only Header and Footer can be replaced.`,
            );
        if (path === undefined) continue;
        if (
            typeof path !== 'string' ||
            path.trim() === '' ||
            isAbsolute(path) ||
            /^[a-z][a-z\d+.-]*:/i.test(path) ||
            /[?#\0\r\n]/.test(path) ||
            extname(path) !== '.astro'
        )
            throw new Error(
                `Invalid Sproutsite components.${slot}: expected a project-relative .astro file, for example ./src/components/${slot}.astro.`,
            );
        const absolute = resolve(root, path);
        try {
            if (!statSync(absolute).isFile())
                throw new Error('not a regular file');
        } catch {
            throw new Error(
                `Invalid Sproutsite components.${slot}: Astro file does not exist or is not a regular file: ${path}`,
            );
        }
        aliases.push({
            find: `#sproutsite/${slot.toLowerCase()}`,
            replacement: absolute.replaceAll('\\', '/'),
        });
    }
    return aliases;
}
