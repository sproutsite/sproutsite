# Third-party notices and asset licensing status

Review date: 2026-11-14.

The root [LICENSE](LICENSE) and [NOTICE](NOTICE) license Sproutsite's first-party source code under Apache-2.0 and identify its original author. They do not replace third-party licenses or establish rights to reference material. This file records the scope of the repository review and outstanding asset checks; it adds no conditions to Apache-2.0.

## Local fonts

Nunito is third-party font software licensed under the SIL Open Font License 1.1, with the existing notice:

> Copyright 2014 The Nunito Project Authors (https://github.com/googlefonts/nunito)

| File                                                                     | License and copyright notice | Distribution                                                |
| ------------------------------------------------------------------------ | ---------------------------- | ----------------------------------------------------------- |
| `src/themes/default/styles/foundation/fonts/nunito-latin-variable.woff2` | Adjacent `OFL.txt`           | Included in the npm package                                 |
| `scripts/assets/nunito-variable.ttf`                                     | Adjacent `OFL.txt`           | Repository development asset; excluded from the npm package |

Both existing `OFL.txt` files are retained unchanged. The source font is from the [official Nunito distribution](https://github.com/google/fonts/tree/main/ofl/nunito). Apache-2.0 does not replace the OFL. Outlining the wordmark in the logo generator does not resolve the separate reference-image provenance question below.

## Dependency licenses and notices

Dependencies remain separately licensed packages. This review inspected the root manifest, locked license metadata, and the license/NOTICE files present in the installed dependencies. It is not a certification of every transitive component or a grant of rights to their code.

The npm archive contains Sproutsite sources and assets, not `node_modules` or bundled dependency executables. Dependencies are installed separately with their own notices. A generated website or separately distributed build/tool bundle must retain the applicable upstream notices for the code and fonts it actually includes.

The default theme uses the following MIT-licensed CSS packages. Unmodified copies of their installed license texts are included for redistribution reference:

| Package                 | Reviewed version | Retained license text                                                                 |
| ----------------------- | ---------------- | ------------------------------------------------------------------------------------- |
| DaisyUI                 | 5.7.42           | [daisyui-LICENSE](third-party-licenses/daisyui-LICENSE)                               |
| Tailwind CSS            | 4.3.3            | [tailwindcss-LICENSE](third-party-licenses/tailwindcss-LICENSE)                       |
| Tailwind CSS Typography | 0.5.20           | [tailwindcss-typography-LICENSE](third-party-licenses/tailwindcss-typography-LICENSE) |

Other direct runtime and peer dependencies declare MIT (`astro`, `@astrojs/mdx`, `@astrojs/markdown-remark`, `@astrojs/sitemap`, `@shikijs/langs`, `@tailwindcss/vite`, `remark-gfm`, `remark-mdx`, `remark-parse`, `unified`, `unist-util-visit`, and `zod`) or ISC (`github-slugger` and `yaml`). Their installed upstream licenses are not changed by the project's Apache-2.0 declaration. Review the actual distributed dependency versions again when preparing a release or bundling their code.

The installed dependency tree also contains components requiring distinct treatment:

- `lightningcss` and its platform packages declare MPL-2.0 and are used by the CSS build tooling. Their source is not relicensed under Apache-2.0.
- `axe-core` and `@axe-core/playwright` declare MPL-2.0 and are development/test tools. `axe-core/LICENSE-3RD-PARTY.txt` is retained in the installed package.
- Sharp declares Apache-2.0; its optional libvips/platform components include LGPL-3.0-or-later and combined license expressions. They are not included in Sproutsite's npm archive. Redistributing native binaries or a complete toolchain requires reviewing those components' own notices and source/relinking obligations.
- `playwright`, `playwright-core`, and `@playwright/test` retain their original `NOTICE` files identifying Microsoft and code derived from Puppeteer. These development dependencies are not bundled into Sproutsite's npm archive, so their notices are not represented as Sproutsite-authored notices in the root `NOTICE`.
- TypeScript retains its installed `LICENSE.txt` and `ThirdPartyNoticeText.txt`. Some development packages, including Fontkit and Storybook packages, declare MIT in their manifests without a standalone license file at the installed package root. Their upstream notices need to accompany any separate redistribution of those tools; the tools are not part of this npm archive.

No installed dependency license or NOTICE file was removed, overwritten, or relicensed. Dependency license metadata alone does not establish that arbitrary future bundling or redistribution is compliant.

## Existing visual assets: provenance review remains open

The following existing assets do not have a committed, asset-specific rights/provenance record sufficient to declare them newly licensed under Apache-2.0. **This change does not relicense them.** Confirm their origin and redistribution permissions before publishing a package or website that includes them.

| Scope                                                                                                                       | Repository evidence                                                                                                     | Outstanding check                                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/themes/default/assets/branding/` (logo and icon SVGs, favicons, app icons, and social card)                            | `scripts/generate-branding.ts` records vector reconstruction from a branding reference and generates the derived files. | Confirm rights to the original reference design and record the intended copyright license for the artwork separately from trademark rights. Regeneration alone does not clear reference rights. |
| `src/themes/default/assets/hero-waves.svg`                                                                                  | Existing supplied SVG; no author/license metadata is present in the file.                                               | Record its source and authorization for redistribution and modification.                                                                                                                        |
| PNGs in `src/content/pages/_assets/`, `src/content/pages/showcase/_assets/`, and `src/content/pages/documentation/_assets/` | Committed demo illustrations without an accompanying asset licensing record.                                            | Record the source or generation provenance, relevant terms, and any third-party reference permissions for each illustration.                                                                    |
| PNGs in `src/content/blog/_assets/`                                                                                         | Committed article illustrations; `sproutsite-brand.png` uses the project branding artwork.                              | Record illustration provenance; the branding image shares the branding-reference review above.                                                                                                  |

The branding and hero SVG are included by the current npm file list. Demo content images are excluded from that archive but remain relevant when publishing the repository's demo website. The package stays private; a successful packaging check verifies file inclusion, not asset-rights clearance or readiness to publish.

No additional trademark policy, registration claim, or attribution obligation is introduced here. Apache-2.0 Section 6 governs its trademark-license scope; any later artwork licensing decision should be documented explicitly rather than inferred from the software license.
