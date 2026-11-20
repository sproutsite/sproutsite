import { readFileSync, realpathSync, statSync } from 'node:fs';
import { extname, relative, resolve, sep } from 'node:path';
import { imageMetadata } from 'astro/assets/utils';
import { z } from 'zod';

// Paths refer to Astro's standard public directory, without a deployment base.
const assetPath = z.string().refine(
    (value) =>
        /^\/(?!\/)[A-Za-z0-9_./-]+$/.test(value) &&
        value
            .slice(1)
            .split('/')
            .every((part) => part && part !== '.' && part !== '..'),
    'must be a root-relative public file path without a base, query, fragment or traversal',
);
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

/** Merge only branding: other locale settings retain their existing contract. */
export function inheritBranding(primary: unknown, localized: unknown): unknown {
    if (localized === undefined) return primary;
    const record = (value: unknown): value is Record<string, unknown> =>
        typeof value === 'object' && value !== null && !Array.isArray(value);
    if (!record(primary) || !record(localized)) return localized;
    const merged = { ...primary, ...localized };
    for (const key of ['logo', 'footerLogo', 'icons', 'sharingImage']) {
        if (record(primary[key]) && record(localized[key]))
            merged[key] = { ...primary[key], ...localized[key] };
    }
    return merged;
}

export function publicBrandingFile(src: string, root = process.cwd()): string {
    if (!assetPath.safeParse(src).success)
        throw new Error(`Unsafe branding path: ${src}`);
    const directory = realpathSync(resolve(root, 'public'));
    const file = realpathSync(resolve(directory, `.${src}`));
    const within = relative(directory, file);
    if (
        within.startsWith(`..${sep}`) ||
        within === '..' ||
        !statSync(file).isFile()
    )
        throw new Error(`Branding asset must be a file inside public/: ${src}`);
    return file;
}

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

export async function brandingImageMetadata(src: string, root = process.cwd()) {
    return imageMetadata(readFileSync(publicBrandingFile(src, root)), src);
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
