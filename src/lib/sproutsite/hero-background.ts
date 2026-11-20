import { extname } from 'node:path';
import type { ImageMetadata } from 'astro';
import {
    publicAssetFile,
    publicAssetPath,
    publicImageMetadata,
} from './public-assets.js';

const formats = ['svg', 'png', 'jpg', 'jpeg', 'webp', 'avif'];
export const publicHeroImage = publicAssetPath.refine(
    (src) => formats.includes(extname(src).slice(1).toLowerCase()),
    'must be a public SVG, PNG, JPEG, WebP or AVIF image',
);

export type HeroBackground = ImageMetadata | string | null | undefined;

export function isSvgHeroImage(image: HeroBackground): boolean {
    return typeof image === 'string'
        ? image.toLowerCase().endsWith('.svg')
        : image?.format === 'svg';
}

/** Undefined inherits; null explicitly disables a global default. */
export function selectHeroBackground(
    local: HeroBackground,
    global: string | undefined,
): HeroBackground {
    return local === undefined ? global : local;
}

export function validateHeroBackground(
    src: string | null | undefined,
    source: string,
    root = process.cwd(),
): void {
    if (src == null) return;
    try {
        publicHeroImage.parse(src);
        publicAssetFile(src, root);
    } catch (error) {
        throw new Error(
            `Invalid ${source}: hero.background-image (${src}): ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

export async function validateHeroBackgroundImage(
    src: string | null | undefined,
    root = process.cwd(),
): Promise<void> {
    if (src == null) return;
    const metadata = await publicImageMetadata(src, root);
    const extension = extname(src)
        .slice(1)
        .toLowerCase()
        .replace('jpeg', 'jpg');
    if (metadata.format !== extension)
        throw new Error(
            `Invalid hero.background-image (${src}): image content must match its SVG or raster extension`,
        );
}
