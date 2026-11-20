import { createHash } from 'node:crypto';
import { copyFile, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(
    new URL('../src/package/starter-assets/', import.meta.url),
);
const publicRoot = join(root, 'public');
const branding = join(publicRoot, 'branding');
// The neutral document symbol has no fixed wordmark: the website supplies its name.
await copyFile(join(branding, 'logo.svg'), join(branding, 'favicon.svg'));
await copyFile(join(branding, 'logo.svg'), join(branding, 'logo-light.svg'));
const frames: Buffer[] = [];
for (const size of [16, 32, 48, 180, 192, 512]) {
    const png = await sharp(join(branding, 'logo.svg'))
        .resize(size, size)
        .png()
        .toBuffer();
    const name =
        size === 180
            ? 'apple-touch-icon.png'
            : size >= 192
              ? `icon-${size}.png`
              : `favicon-${size}.png`;
    await writeFile(join(branding, name), png);
    if (size <= 48) frames.push(png);
}
// ICO supports PNG-encoded frames. Record native 16, 32 and 48 pixel entries.
const directory = Buffer.alloc(6 + 16 * frames.length);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(frames.length, 4);
let offset = directory.length;
for (const [index, frame] of frames.entries()) {
    const start = 6 + index * 16;
    directory[start] = directory[start + 1] = [16, 32, 48][index]!;
    directory.writeUInt16LE(1, start + 4);
    directory.writeUInt16LE(32, start + 6);
    directory.writeUInt32LE(frame.length, start + 8);
    directory.writeUInt32LE(offset, start + 12);
    offset += frame.length;
}
await writeFile(
    join(branding, 'favicon.ico'),
    Buffer.concat([directory, ...frames]),
);
await sharp(join(root, 'sources/hero.svg'))
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(join(publicRoot, 'images/hero.jpg'));
await sharp(join(root, 'sources/sharing-image.svg'))
    .png()
    .toFile(join(branding, 'sharing-image.png'));
await copyFile(
    new URL('../LICENSE', import.meta.url),
    join(publicRoot, 'LICENSE.txt'),
);

async function files(directory: string, prefix = ''): Promise<string[]> {
    const entries = await readdir(directory, { withFileTypes: true });
    return (
        await Promise.all(
            entries.map((entry) => {
                const path = prefix + entry.name;
                return entry.isDirectory()
                    ? files(join(directory, entry.name), path + '/')
                    : [path];
            }),
        )
    )
        .flat()
        .sort();
}
const manifest = {
    schemaVersion: 1,
    license: 'Apache-2.0',
    publicDirectory: 'public',
    branding: {
        logo: {
            src: '/branding/logo.svg',
            srcOnDark: '/branding/logo-light.svg',
            width: 40,
            height: 40,
            showName: true,
        },
        icons: {
            favicon: '/branding/favicon.svg',
            shortcut: '/branding/favicon.ico',
            appleTouch: '/branding/apple-touch-icon.png',
            app192: '/branding/icon-192.png',
            app512: '/branding/icon-512.png',
        },
        sharingImage: {
            src: '/branding/sharing-image.png',
            alt: 'Website preview',
        },
    },
    localizedSharingImageAlt: { en: 'Website preview', de: 'Website-Vorschau' },
    heroExample: {
        source: 'public/images/hero.jpg',
        contentDestination: 'src/content/pages/_assets/hero.jpg',
        frontmatter: {
            'background-image': './_assets/hero.jpg',
            classes: null,
        },
    },
    files: await Promise.all(
        (await files(publicRoot)).map(async (path) => ({
            path,
            sha256: createHash('sha256')
                .update(await readFile(join(publicRoot, path)))
                .digest('hex'),
        })),
    ),
};
await writeFile(
    join(root, 'manifest.json'),
    JSON.stringify(manifest, null, 4) + '\n',
);
console.log(
    `Generated ${manifest.files.length} neutral starter files in ${publicRoot}.`,
);
