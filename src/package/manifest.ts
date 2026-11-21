import type { APIRoute } from 'astro';
import { resolveBranding } from './branding.js';
import { loadSiteConfig } from '../lib/sproutsite/site-config.js';

// A native static Astro endpoint keeps bundled, hashed icon URLs correct for
// both package consumers and deployments under a base path. No service worker.
export const GET: APIRoute = async () => {
    const site = loadSiteConfig();
    const branding = await resolveBranding(site);
    return new Response(
        JSON.stringify({
            name: site.name,
            short_name: site.name,
            lang: site.i18n.locale,
            start_url: site.base,
            scope: site.base,
            display: 'browser',
            icons: branding.appIcons,
        }),
        { headers: { 'Content-Type': 'application/manifest+json' } },
    );
};
