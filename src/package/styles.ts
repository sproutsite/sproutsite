import { statSync } from 'node:fs';
import { extname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const entry = fileURLToPath(
    new URL('./styles.css', import.meta.url),
).replaceAll('\\', '/');

/** One CSS entry keeps the theme and site overrides in the same import graph.
 * Astro/Vite still handle CSS compilation, assets, watching and output files.
 */
export function createStylesPlugin(
    styles: readonly string[] = [],
    root = process.cwd(),
    themeStyles?: readonly string[],
) {
    if (!Array.isArray(styles))
        throw new Error(
            'Sproutsite styles must be an array of local CSS file paths.',
        );
    const paths = styles.map((path, index) => {
        if (
            typeof path !== 'string' ||
            path.trim() === '' ||
            isAbsolute(path) ||
            /^[a-z][a-z\d+.-]*:/i.test(path) ||
            /[?#\0\r\n]/.test(path) ||
            extname(path).toLowerCase() !== '.css'
        ) {
            throw new Error(
                `Invalid Sproutsite styles[${index}]: expected a project-relative .css file, for example ./src/styles/custom.css.`,
            );
        }
        const absolute = resolve(root, path);
        try {
            if (!statSync(absolute).isFile())
                throw new Error('not a regular file');
        } catch {
            throw new Error(
                `Invalid Sproutsite styles[${index}]: CSS file does not exist or is not a regular file: ${path}`,
            );
        }
        return absolute;
    });
    // JSON string quoting also handles spaces and quotes in CSS import paths.
    const css = paths
        .map((path) => `@import ${JSON.stringify(path.replaceAll('\\', '/'))};`)
        .join('\n');
    return {
        name: 'sproutsite/theme-styles',
        enforce: 'pre' as const,
        transform(code: string, id: string) {
            if (
                id.split('?')[0]?.replaceAll('\\', '/') !== entry ||
                (paths.length === 0 && themeStyles === undefined)
            )
                return;
            const base =
                themeStyles === undefined
                    ? code
                    : themeStyles
                          .map(
                              (path) =>
                                  '@import ' +
                                  JSON.stringify(path.replaceAll('\\', '/')) +
                                  ';',
                          )
                          .join('\n');
            return base + '\n' + css;
        },
    };
}
