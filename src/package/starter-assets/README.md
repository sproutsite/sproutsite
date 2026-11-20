# Neutral website starter assets

Sproutsite maintains this asset set. The separate `create-sproutsite` project
vendors a reviewed snapshot when preparing its own release. It must not download
assets or install Sproutsite just to create files for an end user.

## Public entry and copy contract

Resolve `sproutsite/starter-assets` to locate `manifest.json` in the installed
package. This is a public export, not a private theme path:

```ts
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const manifestFile = require.resolve('sproutsite/starter-assets');
const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
const publicDirectory = join(dirname(manifestFile), manifest.publicDirectory);
```

Manifest schema version 1 contains:

- `publicDirectory`: the directory whose **contents** are copied to the website's
  `public/`, preserving names and binary data. It includes LICENSE.txt and
  NOTICE.txt; preserve both with the assets.
- `files`: the exact recursive public-file list and SHA-256 hashes. Verify paths
  remain inside the directory and compare the vendored snapshot before release.
- `branding`: a complete neutral configuration to merge into `site.yaml`.
  `showName: true` displays the generated website's actual name beside a neutral
  document symbol. The icon intentionally works on light and dark backgrounds.
- `localizedSharingImageAlt`: English and German alternative text. The generator
  may personalize this with the chosen website name; do not replace tokens in
  image files.
- `heroExample`: an optional existing-API integration. Copy its `source` to
  `contentDestination` and merge `frontmatter` into the homepage hero. Use the
  same local asset for both languages. The hero's `image()` schema expects a
  relative content image, not a public URL. Set `classes: null` to remove the
  default decorative waves when enabling the raster example.

Do not merge a second duplicate `branding` YAML key. Keep the existing name,
URL, locale, typography and navigation configuration. Locale files inherit the
main configuration and can override `sharingImage.alt`.

## Files and ownership

`public/branding/` contains logo.svg, logo-light.svg, favicon.svg, favicon.ico,
16/32/48-pixel PNG favicon variants, a 180-pixel Apple touch icon, 192/512-pixel
app icons and a 1200×630 sharing-image.png. `public/images/hero.jpg` is 1920×1080.
The optional PNG favicon variants are available for consumers needing them;
the current branding API uses `favicon` for one preferred SVG, PNG or ICO.

The SVG symbol in `public/branding/logo.svg` and the illustrations in `sources/`
are first-party vector sources without third-party imagery, font dependencies
or a Sproutsite wordmark. Raster images and ICO frames are derived locally with
Sharp. There is no AI image-generation input or provider restriction to resolve
for this set. All these assets follow Apache-2.0; see the unchanged full license
and the attribution notice inside `public/`. No additional visible attribution
or branding requirement is imposed.

## Maintenance

Run `npm run starter-assets:generate` from the Sproutsite repository after
editing the vector sources. This updates derivatives, copies the official
project license unchanged and regenerates the file hashes. The command requires
development dependencies; website builds and generation do not execute it.
`npm run branding:generate` also calls it after regenerating the demo branding.

The default theme imports its neutral fallback icons directly from this set.
Do not maintain a second fallback asset directory. Sproutsite's own demo uses
separate, explicitly configured product files under the repository's root
`public/branding/`; those are not the starter artwork.

Check `npm test` and `npm run test:package` before publishing. The archive test
resolves the exported manifest from a real installation, verifies every asset
and builds the copied starter configuration. Package files are committed here;
consumer projects own their copies and package updates do not overwrite them.

The initializer needs its own change and release before it includes this set.
This repository does not claim that an existing npm version of
`create-sproutsite` already includes it.
