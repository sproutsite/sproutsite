import { extname } from 'node:path';
import { z } from 'zod';
import {
    publicAssetPath as assetPath,
    publicAssetFile as publicBrandingFile,
    publicImageMetadata as brandingImageMetadata,
} from './public-assets.js';
export { brandingImageMetadata };

// Paths refer to Astro's standard public directory, without a deployment base.
const logoSchema = z
    .object({
        src: assetPath,
        srcOnDark: assetPath.optional(),
        width: z.number().int().positive().max(4096),
        height: z.number().int().positive().max(4096),
        showName: z.boolean().default(false),
    })
    .strict();

export const brandingSchema = z
    .object({
        logo: logoSchema.optional(),
        footerLogo: logoSchema.optional(),
        icons: z
            .object({
                favicon: assetPath.optional(),
                shortcut: assetPath.optional(),
                appleTouch: assetPath.optional(),
                app192: assetPath.optional(),
                app512: assetPath.optional(),
            })
            .strict()
            .optional(),
        sharingImage: z
            .object({
                src: assetPath,
                alt: z.string().trim().min(1),
            })
            .strict()
            .optional(),
    })
    .strict();

export type Branding = z.infer<typeof brandingSchema>;
export type BrandLogoConfig = z.infer<typeof logoSchema>;

function assets(branding: Branding) {
    return [
        ...(['logo', 'footerLogo'] as const).flatMap((key) => {
            const logo = branding[key];
            return logo
                ? [
                      {
                          field: `${key}.src`,
                          src: logo.src,
                          formats: ['svg', 'png', 'jpeg', 'webp'],
                      },
                      ...(logo.srcOnDark
                          ? [
                                {
                                    field: `${key}.srcOnDark`,
                                    src: logo.srcOnDark,
                                    formats: ['svg', 'png', 'jpeg', 'webp'],
                                },
                            ]
                          : []),
                  ]
                : [];
        }),
        ...Object.entries(branding.icons ?? {}).map(([key, src]) => ({
            field: `icons.${key}`,
            src,
            formats:
                key === 'favicon'
                    ? ['svg', 'png', 'ico']
                    : key === 'shortcut'
                      ? ['ico']
                      : ['png'],
        })),
        ...(branding.sharingImage
            ? [
                  {
                      field: 'sharingImage.src',
                      src: branding.sharingImage.src,
                      formats: ['png', 'jpeg', 'webp'],
                  },
              ]
            : []),
    ];
}

/** Fast, synchronous checks also run through npm run validate. */
export function validateBrandingFiles(
    branding: Branding | undefined,
    root: string,
    source: string,
): void {
    for (const asset of assets(branding ?? {})) {
        try {
            publicBrandingFile(asset.src, root);
            const extension = extname(asset.src)
                .slice(1)
                .toLowerCase()
                .replace('jpg', 'jpeg');
            if (!asset.formats.includes(extension))
                throw new Error(`expected ${asset.formats.join(', ')}`);
        } catch (error) {
            throw new Error(
                `Invalid ${source}: branding.${asset.field} (${asset.src}): ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }
}

/** Astro's image reader verifies file contents and required app-icon dimensions. */
export async function validateBrandingImages(
    branding: Branding | undefined,
    root = process.cwd(),
): Promise<void> {
    for (const asset of assets(branding ?? {})) {
        try {
            const metadata = await brandingImageMetadata(asset.src, root);
            const extension = extname(asset.src)
                .slice(1)
                .toLowerCase()
                .replace('jpg', 'jpeg');
            // Astro reports JPEG metadata as jpg, regardless of .jpg/.jpeg.
            const format = metadata.format === 'jpg' ? 'jpeg' : metadata.format;
            if (format !== extension)
                throw new Error('image content must match the file extension');
            if (!asset.formats.includes(format))
                throw new Error(
                    'file content does not match the allowed image formats',
                );
            const sizes: Record<string, number> = {
                'icons.appleTouch': 180,
                'icons.app192': 192,
                'icons.app512': 512,
            };
            const size = sizes[asset.field];
            if (size && (metadata.width !== size || metadata.height !== size))
                throw new Error(`expected ${size} × ${size} pixels`);
        } catch (error) {
            throw new Error(
                `Invalid branding.${asset.field} (${asset.src}): ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }
}
