import favicon from './starter-assets/public/branding/favicon.svg?url&no-inline';
import appleTouch from './starter-assets/public/branding/apple-touch-icon.png';
import app192 from './starter-assets/public/branding/icon-192.png';
import app512 from './starter-assets/public/branding/icon-512.png';
import type { SiteConfig } from '../lib/sproutsite/types.js';
import { withBase } from '../lib/sproutsite/urls.js';
import { brandingImageMetadata } from '../lib/sproutsite/branding.js';

/** Theme defaults are neutral; all configured files belong to the website. */
export async function resolveBranding(site: SiteConfig) {
    const icons = site.branding?.icons;
    const publicUrl = (src: string) => withBase(src, site.base);
    const faviconSrc = icons?.favicon ? publicUrl(icons.favicon) : favicon;
    const faviconType = faviconSrc.toLowerCase().endsWith('.svg')
        ? 'image/svg+xml'
        : faviconSrc.toLowerCase().endsWith('.png')
          ? 'image/png'
          : 'image/x-icon';
    const sharing = site.branding?.sharingImage;
    const metadata = sharing
        ? await brandingImageMetadata(sharing.src)
        : undefined;
    return {
        favicon: { src: faviconSrc, type: faviconType },
        shortcut: icons?.shortcut ? publicUrl(icons.shortcut) : undefined,
        appleTouch: icons?.appleTouch
            ? publicUrl(icons.appleTouch)
            : appleTouch.src,
        appIcons: [
            {
                src: icons?.app192 ? publicUrl(icons.app192) : app192.src,
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: icons?.app512 ? publicUrl(icons.app512) : app512.src,
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
        ],
        sharingImage:
            sharing && metadata
                ? {
                      src: new URL(publicUrl(sharing.src), site.url).href,
                      alt: sharing.alt,
                      width: metadata.width,
                      height: metadata.height,
                  }
                : undefined,
    };
}
