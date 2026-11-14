import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { openSync } from 'fontkit';
import sharp from 'sharp';

// The reference is redrawn as vector geometry. Raster assets are derived from
// these paths, never cropped from the reference. Nunito is already licensed
// and stored in this repository; standalone SVG wordmarks contain outlines.
const theme = new URL('../src/themes/default/', import.meta.url);
const output = new URL('assets/branding/', theme);
await mkdir(output, { recursive: true });
const tokens = await readFile(
    new URL('styles/foundation/tokens.css', theme),
    'utf8',
);
function color(name: string): string {
    const value = tokens.match(
        new RegExp(`--color-brand-${name}:\\s*(#[a-f0-9]{6})`, 'i'),
    )?.[1];
    if (!value) throw new Error(`Missing brand token: ${name}`);
    return value;
}
const navy = color('navy');
const white = color('white');
function layerGradient(name: 'turquoise' | 'cyan' | 'blue'): string {
    const base = color(name);
    const channels = [1, 3, 5].map((offset) =>
        Number.parseInt(base.slice(offset, offset + 2), 16),
    );
    const darken = (amount: number) =>
        `#${channels
            .map((channel) =>
                Math.round(channel * (1 - amount))
                    .toString(16)
                    .padStart(2, '0'),
            )
            .join('')}`;
    // Start at the unchanged brand color and darken toward the bottom, with
    // the same slight diagonal as the leaves. Never mix white into the fill.
    return `<linearGradient id="${name}" x1="0%" y1="0%" x2="35%" y2="100%"><stop stop-color="${base}"/><stop offset="0.5" stop-color="${darken(0.12)}"/><stop offset="1" stop-color="${darken(0.3)}"/></linearGradient>`;
}
const definitions = `<defs>
    ${layerGradient('turquoise')}
    ${layerGradient('cyan')}
    ${layerGradient('blue')}
    <linearGradient id="stem" x1="189" y1="0" x2="173" y2="0" gradientUnits="userSpaceOnUse"><stop stop-color="${color('green')}"/><stop offset="1" stop-color="#35b919"/></linearGradient>
    <linearGradient id="green" x2="0.35" y2="1"><stop stop-color="${color('light-green')}"/><stop offset="0.5" stop-color="${color('green')}"/><stop offset="1" stop-color="#35b919"/></linearGradient>
</defs>`;
const centerX = 160;
const topLayerY = 166;
const layerSpacing = 47;
// Local coordinates share the same projection: every straight diagonal has
// |dy/dx| = 0.4. Both shapes use identical outer edges and corner tangents.
// The upper plane's rounded rear notch is symmetric around the stem at x = 0.
const planePath =
    'M -120 -4 L -58 -28.8 Q -48 -32.8 -38 -28.8 L -8 -16.8 Q 0 -13.6 8 -16.8 L 38 -28.8 Q 48 -32.8 58 -28.8 L 120 -4 Q 130 0 120 4 L 20 44 Q 0 52 -20 44 L -120 4 Q -130 0 -120 -4 Z';
// A 34-unit ribbon depth leaves 13 units between stacked front contours.
const ribbonPath =
    'M -120 -4 L -87.5 -17 L -20 10 Q 0 18 20 10 L 87.5 -17 L 120 -4 Q 130 0 120 4 L 20 44 Q 0 52 -20 44 L -120 4 Q -130 0 -120 -4 Z';
const layers = [
    {
        name: 'blue',
        path: ribbonPath,
        offset: layerSpacing * 2,
    },
    {
        name: 'cyan',
        path: ribbonPath,
        offset: layerSpacing,
    },
    { name: 'turquoise', path: planePath, offset: 0 },
];
const leaves = [
    'M 177 126 C 165 78 145 45 94 47 Q 86 47 88 56 C 94 101 119 124 160 120 Z',
    'M 181 116 C 179 57 214 19 275 23 Q 283 23 281 32 C 275 85 238 116 195 111 Z',
    'M 173 166 L 173 127 Q 172 115 160 107 L 166 98 Q 176 104 181 116 Q 186 103 194 97 L 201 104 Q 189 117 189 132 L 189 166 Q 181 171 173 166 Z',
];
// Faint, curved veins fade at both ends. Keep them out of small favicons and
// monochrome marks so the silhouette stays clear at compact sizes.
const leafTexture = `<defs>
    <linearGradient id="leaf-detail-left" x1="102" y1="61" x2="166" y2="115" gradientUnits="userSpaceOnUse"><stop stop-color="${white}" stop-opacity="0"/><stop offset="0.35" stop-color="${white}" stop-opacity="0.36"/><stop offset="0.75" stop-color="${white}" stop-opacity="0.3"/><stop offset="1" stop-color="${white}" stop-opacity="0"/></linearGradient>
    <linearGradient id="leaf-detail-right" x1="265" y1="35" x2="190" y2="103" gradientUnits="userSpaceOnUse"><stop stop-color="${white}" stop-opacity="0"/><stop offset="0.35" stop-color="${white}" stop-opacity="0.36"/><stop offset="0.75" stop-color="${white}" stop-opacity="0.3"/><stop offset="1" stop-color="${white}" stop-opacity="0"/></linearGradient>
</defs>
<g fill="none" stroke="url(#leaf-detail-left)" stroke-linecap="round">
    <path d="M 102 61 C 126 76 150 96 166 115" stroke-width="1.4"/>
    <path d="M 134 84 C 130 77 128 71 126 66 M 149 99 C 141 101 134 102 127 101" stroke-width="0.9" opacity="0.5"/>
</g>
<g fill="none" stroke="url(#leaf-detail-right)" stroke-linecap="round">
    <path d="M 265 35 C 238 52 208 77 190 103" stroke-width="1.4"/>
    <path d="M 233 59 C 235 50 239 42 244 36 M 213 78 C 222 79 229 78 237 75" stroke-width="0.9" opacity="0.5"/>
</g>`;
function symbol(monochrome = false, withLeafTexture = true): string {
    const fill = (name: string) =>
        monochrome ? 'currentColor' : `url(#${name})`;
    // The existing organic sprout is anchored at the bottom-center of its
    // stem (181, 168.5). Translate it as one piece onto the top plane center;
    // preserve the leaves' deliberately different sizes and their junction.
    return `${monochrome ? '' : definitions}${layers.map(({ name, path, offset }) => `<path fill="${fill(name)}" transform="translate(${centerX} ${topLayerY + offset})" d="${path}"/>`).join('')}<g transform="translate(${centerX - 181} ${topLayerY - 168.5})"><path fill="${fill('stem')}" d="${leaves[2]}"/>${leaves
        .slice(0, 2)
        .map((path) => `<path fill="${fill('green')}" d="${path}"/>`)
        .join('')}${!monochrome && withLeafTexture ? leafTexture : ''}</g>`;
}
function svg(
    body: string,
    width = 320,
    height = 320,
    label = 'Sproutsite',
): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}">${body}</svg>\n`;
}
const sourceFont = openSync(
    fileURLToPath(new URL('./assets/nunito-variable.ttf', import.meta.url)),
);
if (!('layout' in sourceFont))
    throw new Error('Expected a single Nunito font.');
const font = sourceFont.getVariation({ wght: 800 });
function lettering(
    text: string,
    size: number,
    x: number,
    y: number,
    fill: string,
    tracking = 0,
): { paths: string; width: number } {
    const run = font.layout(text);
    const scale = size / font.unitsPerEm;
    let cursor = 0;
    const paths = run.glyphs
        .map((glyph, index) => {
            const position = run.positions[index]!;
            const path = `<path transform="translate(${x + cursor + position.xOffset * scale} ${y - position.yOffset * scale}) scale(${scale} ${-scale})" d="${glyph.path.toSVG()}"/>`;
            cursor += position.xAdvance * scale + tracking;
            return path;
        })
        .join('');
    return {
        paths: `<g fill="${fill}">${paths}</g>`,
        width: cursor - tracking,
    };
}
function lockup(ink: string, monochrome = false): string {
    const word = lettering('Sproutsite', 184, 350, 202, ink);
    const text = 'THE AGENT-READY STATIC CMS';
    const natural = lettering(text, 31, 363, 271, ink);
    const tracking = (word.width - 26 - natural.width) / (text.length - 1);
    const tagline = lettering(text, 31, 363, 271, ink, tracking);
    return svg(
        `${symbol(monochrome)}${word.paths}${tagline.paths}`,
        Math.ceil(350 + word.width + 16),
        320,
    );
}
const icon = svg(symbol());
// Flat fills without leaf texture stay crisp at tab sizes.
const small = svg(symbol(false, false))
    .replace(definitions, '')
    .replaceAll('url(#turquoise)', color('turquoise'))
    .replaceAll('url(#cyan)', color('cyan'))
    .replaceAll('url(#blue)', color('blue'))
    .replaceAll('url(#stem)', color('green'))
    .replaceAll('url(#green)', color('green'));
const files: Record<string, string> = {
    'logo.svg': lockup(navy),
    'logo-dark.svg': lockup(white),
    'logo-monochrome.svg': lockup('currentColor', true),
    'icon.svg': icon,
    'icon-monochrome.svg': svg(symbol(true)),
    'favicon.svg': small,
};
for (const [name, content] of Object.entries(files))
    await writeFile(new URL(name, output), content);
const faviconPngs: Buffer[] = [];
for (const size of [16, 32, 48]) {
    const png = await sharp(Buffer.from(small))
        .resize(size, size)
        .png()
        .toBuffer();
    faviconPngs.push(png);
    await writeFile(new URL(`favicon-${size}x${size}.png`, output), png);
}
// ICO directories can contain lossless PNG frames; keep native 16/32/48 sizes.
const directory = Buffer.alloc(6 + 16 * faviconPngs.length);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(faviconPngs.length, 4);
let offset = directory.length;
faviconPngs.forEach((png, index) => {
    const start = 6 + index * 16;
    directory[start] = directory[start + 1] = [16, 32, 48][index]!;
    directory.writeUInt16LE(1, start + 4);
    directory.writeUInt16LE(32, start + 6);
    directory.writeUInt32LE(png.length, start + 8);
    directory.writeUInt32LE(offset, start + 12);
    offset += png.length;
});
await writeFile(
    new URL('favicon.ico', output),
    Buffer.concat([directory, ...faviconPngs]),
);
for (const size of [180, 192, 512]) {
    const app = svg(
        `<rect width="320" height="320" rx="55" fill="${navy}"/><g transform="translate(35 30) scale(0.78)">${symbol()}</g>`,
    );
    await sharp(Buffer.from(app))
        .resize(size, size)
        .png()
        .toFile(
            fileURLToPath(
                new URL(
                    size === 180
                        ? 'apple-touch-icon.png'
                        : `icon-${size}x${size}.png`,
                    output,
                ),
            ),
        );
}
const socialWord = lettering('Sproutsite', 142, 390, 329, white);
const socialTagline = lettering(
    'THE AGENT-READY STATIC CMS',
    23,
    400,
    387,
    white,
    2.4,
);
await sharp(
    Buffer.from(
        svg(
            `<rect width="1200" height="630" fill="${navy}"/><g transform="translate(60 145)">${symbol()}</g>${socialWord.paths}${socialTagline.paths}`,
            1200,
            630,
        ),
    ),
)
    .png()
    .toFile(fileURLToPath(new URL('social-card.png', output)));
console.log(
    'Generated Sproutsite SVG logos, favicons, app icons, and social card.',
);
