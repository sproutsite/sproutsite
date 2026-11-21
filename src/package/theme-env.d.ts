declare module 'virtual:sproutsite/theme' {
    export function paletteStyles(
        colors?: import('../lib/sproutsite/site-colors.js').SiteColors,
        source?: string,
    ): Record<string, string>;
}
