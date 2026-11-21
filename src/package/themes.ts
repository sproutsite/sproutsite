/// <reference path="./theme-env.d.ts" />
import { statSync } from 'node:fs';
import { extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ThemeComponentProps } from './theme-types.js';
export type {
    ThemeProps,
    ThemeComponentProps,
    ThemeLayoutProps,
    DocumentProps,
} from './theme-types.js';

export type ThemeComponents = Partial<Record<keyof ThemeComponentProps, URL>>;

/** A local, statically imported theme. Astro compiles its selected files normally. */
export interface SproutsiteTheme {
    name: string;
    extends?: SproutsiteTheme;
    styles?: readonly URL[];
    components?: ThemeComponents;
    /** Inherit the default palette mapping, or opt out for independent CSS. */
    colors?: 'default' | 'none';
}

export const defaultTheme = {
    name: 'default',
    colors: 'default',
    styles: [new URL('../themes/default/styles/theme.css', import.meta.url)],
    components: {
        Layout: new URL(
            '../themes/default/layouts/ThemeLayout/ThemeLayout.astro',
            import.meta.url,
        ),
        Alert: new URL(
            '../themes/default/components/molecules/Alert/Alert.astro',
            import.meta.url,
        ),
        ContentTable: new URL(
            '../themes/default/components/molecules/ContentTable/ContentTable.astro',
            import.meta.url,
        ),
        FoundationSample: new URL(
            '../themes/default/components/molecules/FoundationSample/FoundationSample.astro',
            import.meta.url,
        ),
        Tabs: new URL(
            '../themes/default/components/molecules/Tabs/Tabs.astro',
            import.meta.url,
        ),
        Tab: new URL(
            '../themes/default/components/atoms/Tab/Tab.astro',
            import.meta.url,
        ),
        Card: new URL(
            '../themes/default/components/molecules/Card/Card.astro',
            import.meta.url,
        ),
        CardActions: new URL(
            '../themes/default/components/molecules/CardActions/CardActions.astro',
            import.meta.url,
        ),
        ContentImage: new URL(
            '../themes/default/components/atoms/ContentImage/ContentImage.astro',
            import.meta.url,
        ),
        Eyebrow: new URL(
            '../themes/default/components/atoms/Eyebrow/Eyebrow.astro',
            import.meta.url,
        ),
        Badge: new URL(
            '../themes/default/components/atoms/Badge/Badge.astro',
            import.meta.url,
        ),
        Button: new URL(
            '../themes/default/components/atoms/Button/Button.astro',
            import.meta.url,
        ),
        Icon: new URL(
            '../themes/default/components/atoms/Icon/Icon.astro',
            import.meta.url,
        ),
        Feature: new URL(
            '../themes/default/components/molecules/Feature/Feature.astro',
            import.meta.url,
        ),
        LegalIdentity: new URL(
            '../themes/default/components/molecules/LegalIdentity/LegalIdentity.astro',
            import.meta.url,
        ),
        PrivacyInfrastructure: new URL(
            '../themes/default/components/molecules/PrivacyInfrastructure/PrivacyInfrastructure.astro',
            import.meta.url,
        ),
        Accordion: new URL(
            '../themes/default/components/molecules/Accordion/Accordion.astro',
            import.meta.url,
        ),
        AccordionItem: new URL(
            '../themes/default/components/molecules/AccordionItem/AccordionItem.astro',
            import.meta.url,
        ),
        Column: new URL(
            '../themes/default/components/layout/Column/Column.astro',
            import.meta.url,
        ),
        Columns: new URL(
            '../themes/default/components/layout/Columns/Columns.astro',
            import.meta.url,
        ),
        Header: new URL(
            '../themes/default/components/organisms/Header/Header.astro',
            import.meta.url,
        ),
        Footer: new URL(
            '../themes/default/components/organisms/Footer/Footer.astro',
            import.meta.url,
        ),
        Hero: new URL(
            '../themes/default/components/organisms/Hero/Hero.astro',
            import.meta.url,
        ),
        PageTitle: new URL(
            '../themes/default/components/organisms/PageTitle/PageTitle.astro',
            import.meta.url,
        ),
        Section: new URL(
            '../themes/default/components/organisms/Section/Section.astro',
            import.meta.url,
        ),
        BlogIndex: new URL(
            '../themes/default/components/organisms/BlogIndex/BlogIndex.astro',
            import.meta.url,
        ),
        BlogPost: new URL(
            '../themes/default/components/organisms/BlogPost/BlogPost.astro',
            import.meta.url,
        ),
        ErrorPage: new URL(
            '../themes/default/layouts/ErrorPage/ErrorPage.astro',
            import.meta.url,
        ),
        BrandLogo: new URL(
            '../themes/default/components/atoms/BrandLogo/BrandLogo.astro',
            import.meta.url,
        ),
        HeroBackground: new URL(
            '../themes/default/components/atoms/HeroBackground/HeroBackground.astro',
            import.meta.url,
        ),
        LanguageSwitcher: new URL(
            '../themes/default/components/molecules/LanguageSwitcher/LanguageSwitcher.astro',
            import.meta.url,
        ),
    },
} satisfies SproutsiteTheme;

export interface ResolvedTheme {
    name: string;
    colors: 'default' | 'none';
    styles: string[];
    components: Record<keyof ThemeComponentProps, string>;
}

function file(path: unknown, extension: string, context: string): string {
    if (
        !(path instanceof URL) ||
        path.protocol !== 'file:' ||
        path.search ||
        path.hash
    )
        throw new Error(
            context + ': expected a local file URL without query or fragment.',
        );
    const absolute = fileURLToPath(path);
    if (extname(absolute) !== extension)
        throw new Error(context + ': expected a ' + extension + ' file.');
    try {
        if (!statSync(absolute).isFile()) throw new Error('not a file');
    } catch {
        throw new Error(
            context +
                ': file does not exist or is not a regular file: ' +
                absolute,
        );
    }
    return absolute.replaceAll('\\', '/');
}

/** Resolve one inheritance chain; no default fallbacks for independent themes. */
export function resolveTheme(
    theme: SproutsiteTheme = defaultTheme,
): ResolvedTheme {
    const chain: SproutsiteTheme[] = [];
    const visited = new Set<SproutsiteTheme>();
    let current: SproutsiteTheme | undefined = theme;
    while (current !== undefined) {
        if (!current || typeof current !== 'object' || Array.isArray(current))
            throw new Error('Sproutsite theme must be an object.');
        if (visited.has(current))
            throw new Error('Circular Sproutsite theme inheritance.');
        if (chain.length >= 32)
            throw new Error('Sproutsite theme inheritance exceeds 32 levels.');
        for (const key of Object.keys(current))
            if (
                !['name', 'extends', 'styles', 'components', 'colors'].includes(
                    key,
                )
            )
                throw new Error('Unknown theme option: ' + key);
        if (
            typeof current.name !== 'string' ||
            !/^[a-z][a-z0-9-]*$/.test(current.name)
        )
            throw new Error(
                'Theme name must use lowercase letters, digits and hyphens.',
            );
        visited.add(current);
        chain.unshift(current);
        current = current.extends;
    }
    const components: Partial<Record<keyof ThemeComponentProps, string>> = {};
    const styles: string[] = [];
    let colors: ResolvedTheme['colors'] = 'none';
    for (const layer of chain) {
        if (layer.colors !== undefined) {
            if (layer.colors !== 'default' && layer.colors !== 'none')
                throw new Error(
                    'Theme ' + layer.name + '.colors must be default or none.',
                );
            colors = layer.colors;
        }
        if (layer.styles !== undefined) {
            if (!Array.isArray(layer.styles))
                throw new Error('Theme styles must be an array.');
            for (const path of layer.styles)
                styles.push(
                    file(path, '.css', 'Theme ' + layer.name + '.styles'),
                );
        }
        if (layer.components !== undefined) {
            if (
                !layer.components ||
                typeof layer.components !== 'object' ||
                Array.isArray(layer.components)
            )
                throw new Error('Theme components must be an object.');
            for (const [name, path] of Object.entries(layer.components)) {
                if (!Object.hasOwn(defaultTheme.components, name))
                    throw new Error('Unknown theme component: ' + name);
                const key = name as keyof ThemeComponentProps;
                components[key] = file(
                    path,
                    '.astro',
                    'Theme ' + layer.name + '.components.' + name,
                );
            }
        }
    }
    for (const name of Object.keys(
        defaultTheme.components,
    ) as (keyof ThemeComponentProps)[])
        if (!components[name])
            throw new Error(
                'Theme ' +
                    theme.name +
                    ' is missing component ' +
                    name +
                    '. Provide it or extend a complete theme.',
            );
    return {
        name: theme.name,
        colors,
        styles,
        components: components as ResolvedTheme['components'],
    };
}

export function themeAliases(theme: ResolvedTheme) {
    return Object.entries(theme.components).map(([name, path]) => ({
        find: '#sproutsite/' + name.toLowerCase(),
        replacement: path,
    }));
}

/** Select the palette mapper once; evaluate current site data on every render. */
export function themeDataPlugin(colors: ResolvedTheme['colors']) {
    const id = 'virtual:sproutsite/theme';
    const path = fileURLToPath(
        new URL('../themes/default/colors.ts', import.meta.url),
    ).replaceAll('\\', '/');
    return {
        name: 'sproutsite/theme-data',
        resolveId(source: string) {
            if (source === id) return '\0' + id;
        },
        load(source: string) {
            if (source === '\0' + id)
                return colors === 'default'
                    ? 'export { colorStyles as paletteStyles } from ' +
                          JSON.stringify(path) +
                          ';'
                    : 'export function paletteStyles() { return {}; }';
        },
    };
}
