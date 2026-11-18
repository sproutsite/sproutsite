/** Compare content routes before locale and deployment-base prefixes are applied. */
export function navigationCurrent(
    href: string,
    route: string,
): 'page' | 'location' | undefined {
    if (!href.startsWith('/') || href.startsWith('//')) return undefined;
    const path = href.split(/[?#]/, 1)[0]!.replace(/\/+$/, '') || '/';
    const current = route.replace(/\/+$/, '') || '/';
    if (path === current) return 'page';
    if (path !== '/' && current.startsWith(`${path}/`)) return 'location';
    return undefined;
}
