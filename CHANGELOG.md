# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added sitemap.xml with canonical page URLs, content-derived lastmod dates, translated hreflang links and x-default, using the official Astro sitemap serializer and preserving its index output.

### Added

- Added English and German deployment documentation for Apache and Nginx, including static builds, localized error documents, subpaths, and deployment checks.
- Added a deployment overview card in both languages with a generated illustration matching the documentation artwork.

## [0.5.4] - 2026-11-15

### Added

- Displayed the version from VERSION beneath the footer logo without shifting surrounding content, and included VERSION in package distributions.

## [0.5.3] - 2026-11-15

### Added

- Added shared small-hero error pages with /404 and /500 development previews and static 404.html/500.html for server error documents, with localized playful copy and noindex metadata.
- Split error-page introductions from their explanatory content and homepage action using the shared Hero and Section components.
- Added localized error-page previews and flat language-suffixed HTML files for each additional configured language.

## [0.5.2] - 2026-11-15

### Fixed

- Prevented consecutive paragraphs inside Columns from adding their vertical margins together.

### Changed

- Reduced the big hero's mobile top clearance after the navbar from 4.5rem to 1.5rem while retaining desktop spacing.

- Restored default spacing for the homepage feature section in both languages.

- Removed repetitive homepage copy and added a concise bilingual closing section with distinct Showcase and getting-started actions; replaced the broad security claim with specific static-hosting copy.

- Replaced the homepage benefits list with four bilingual Feature cards directly after the workflow, retaining the existing Info and FAQ links below them.

- Expanded Feature icon sizes to xs/sm/md/lg/xl, retaining md as default and migrating former large examples to xl to preserve their appearance.

- Moved the bilingual homepage principle section directly after the feature strip and paired its text with a three-step workflow using existing Columns, Feature, and Lucide separators.

- Migrated existing alternating Showcase, Documentation, FAQ, Info, and blog sections to odd/even tone mappings in both languages while preserving their rendered colors and explicit tone examples.

- Numbered both homepage translations consecutively from 01-features through 04-further-reading and documented section numbering from 01.

- Removed the extra homepage feature title, allowed Feature H2 headings to introduce a section, and alternated homepage section surfaces in both languages.

- Increased the default Columns divider gap to 6rem, with a 2/4/6/8/12rem preset scale and half-sized mobile gaps, including automatic mobile inheritance.

- Replaced numeric Columns divider gaps with xs, sm, md, lg, and xl CSS presets; md remains the default and mobile spacing inherits the general preset when omitted.

- Switched Columns dividerGap and dividerGapMobile to rem, including defaults and examples, so spacing scales with the root font size.

- Kept large Columns divider gaps between actual content areas to avoid overflow at narrow desktop widths.

- Split English and German showcase examples into focused sections with alternating default and muted surfaces and contextual eyebrows, while preserving the section tone demonstrations.

### Added

- Added Feature card layout with left-aligned content, a shared tinted or explicit background, and no separate icon box, with bilingual showcase and Storybook examples.

- Added shared Columns gap and gapMobile presets for layouts with or without separators, retaining existing layout defaults and legacy divider spacing options.

- Added explicit Feature icon background colors and applied muted green and teal hex palettes to the homepage workflow.

- Added a large Feature icon size that doubles the symbol and background box, with bilingual column examples and a Storybook story.

- Added centered and top alignment for Columns icon separators, including vertical Feature icon alignment and bilingual showcase examples.

- Added interchangeable Lucide icon separators to Columns, with responsive direction, row-boundary handling, existing spacing/color controls, bilingual showcase examples, and Storybook stories.

- Added a vertical Feature layout with centered content, preserving the horizontal default, plus bilingual showcase examples and Storybook controls.

- Added odd/even section tone mappings resolved from the numeric filename prefix, preserving fixed tones, with bilingual homepage configuration and showcase examples.

- Added section frontmatter spacing presets (small, default, large), with half or double desktop padding, unchanged mobile spacing, and bilingual showcase examples.

- Added a bilingual homepage feature section directly after the hero, using the existing Columns, Feature, and responsive divider components.

- Added optional responsive Columns dividers with a light gray default, custom hex colors and configurable desktop and mobile spacing, bilingual layout examples, and Storybook controls.

- Added the Feature molecule for icon-and-text benefits, with soft, solid, and plain treatments, semantic and validated custom hex colors, configurable heading levels, validated MDX, bilingual showcase examples, Storybook stories, and a generated overview illustration.

## [0.5.1] - 2026-11-15

### Added

- Added an English and German article about adopting Apache 2.0, with a generated licensing illustration and links to the official license and FAQ.
- Completed the bilingual blog overview with English and German site settings, localized article links and fallback copy, and checks covering article pairs and publication dates.
- Added complete English showcase and documentation content alongside the German localized files, including translated metadata, image descriptions, and code examples.
- Integrated local Lucide SVG icons through the default theme's accessible Icon atom, validated MDX usage, a bilingual showcase page, and Storybook examples.
- Retained Lucide's ISC and Feather-derived MIT notices with the distributed third-party licenses.
- Added optional rounded square icon backgrounds with semantic theme colors, automatic contrast colors, and bilingual showcase and Storybook examples.
- Added configurable header CTAs with button variants, optional Lucide icons, and CSS separators.
- Added a configurable language switcher with local MIT-licensed flags, translated page and blog targets, homepage fallback, and support for a single configured language.
- Added a fullscreen native-dialog mobile menu with inline language selection, full-width CTAs, keyboard controls, scroll locking, and a wrapping navigation fallback without JavaScript.
- Added validated `small`, `big`, and `fullscreen` hero types and matching CSS modifiers. The default is `small`; fullscreen sizing remains reserved for later styling.

### Changed

- Set both homepage heroes to `big` with additional top spacing; other heroes and title fallbacks use `small`.
- Moved Info and FAQ to the footer, separated footer links with middle dots, and replaced demo contact addresses with `grow@sproutsite.dev` in both languages.
- Aligned header control heights and hover backgrounds, removed navigation link borders and inset shadows, and refined language dropdown positioning, arrow, spacing, and shadow.
- Added tone-aware leading lines to eyebrows and matched their hero font size to section eyebrows.

### Fixed

- Updated accessibility checks to discover every generated page and exercise English and German component examples, corrected localized anchor links and theme reference values, and localized shared navigation and foundation specimens.
- Corrected button row alignment in tabs, columns, and prose, centered button icons, and standardized icon-to-label spacing with bilingual showcase examples.

## [0.5.0] - 2026-11-14

### Added

- Added the official Apache License 2.0 text and a NOTICE recording Björn Hempel's authorship and the project's origin.
- Documented third-party licenses, retained font notices, and unresolved provenance checks for existing visual assets; included MIT license texts for the theme's CSS dependencies.

### Changed

- Declared Apache-2.0 licensing and author metadata in the package, included license and notice files in npm archives, and documented licensing and trademark scope in the README and agent guidelines.

## [0.4.4] - 2026-11-14

### Added

- Added English default content and German localized content, site settings, and routes under `/de/`, with Astro i18n configuration and theme message files.
- Added optional hero claims, primary and secondary actions, taglines, and title highlighting with validated frontmatter and the existing Button component.

### Changed

- Refined the homepage hero hierarchy and highlighted the wordmark to strengthen the Sproutsite brand presentation.
- Regenerated logo, favicon, app icon, and social preview assets with darker layer gradients, a horizontal stem gradient, and subtle leaf veins. Small favicons and monochrome variants retain simplified artwork.

### Fixed

- Aligned the logo layers to shared outer edges and equal spacing, centered the sprout, and refined the upper notch and lower layer thickness.

## [0.4.3] - 2026-11-12

### Changed

- Refined the public homepage around the Sproutsite working model, including balanced content columns, clearer next steps, and alternating section surfaces.
- Improved the default theme's primary typography, tone-aware eyebrows, and dark hero-inspired footer treatment with accessible link and focus colors.
- Documented the user-facing content writing style and added the Sproutsite brand update to the project journal.

## [0.4.2] - 2026-11-11

### Changed

- Replaced the homepage's technical hero illustration and the shared hero grid with responsive organic SVG waves in navy, blue, teal, and green, supported by dedicated hero color tokens and updated theme documentation.
- Extended the waves toward the center on desktop, aligned the illustration to the top, and refined the color gradients and text/navigation overlays. Tablet and mobile views retain reduced intensity; content, typography, and hero height remain unchanged.

## [0.4.1] - 2026-11-10

### Added

- Added the reference-based Sproutsite sprout-and-layers identity: standalone light, dark, monochrome, and icon SVGs, locally outlined Nunito lettering, and separate brand color tokens.
- Added a reproducible TypeScript asset generator, SVG/ICO/PNG favicons, Apple and web app icons, a static base-aware manifest, and a product Open Graph card.

### Changed

- Integrated the shared logo in the responsive header and footer, with white and navy wordmark states, while retaining the existing page design and consumer site names.

## [0.4.0] - 2026-11-10

### Changed

- Established Sproutsite — The Agent-Ready Static CMS as the product identity across the website, package, documentation, examples, tests, and Storybook.
- Renamed package imports and public helpers to Sproutsite, moved the core to `src/lib/sproutsite/`, and aligned theme classes (`ss-`) and the base-path environment variable (`SPROUTSITE_BASE`). Consumer imports and custom theme overrides must be updated together.
- Set the canonical product URL to `https://sproutsite.dev` and repository links to `sproutsite/sproutsite`; added consistent Open Graph and summary-card metadata.
- Replaced the previous product icon with a typographic wordmark and removed the favicon pending a new visual identity. Existing page URLs, component behavior, and visual theme remain intact.

### Fixed

- Applied the configured deployment base to Button navigation links, as uncovered by the full internal-link check under `/demo/`.

## [0.3.0] - 2026-11-01

### Added

- Added validated MDX layout components for columns, alerts, cards, images, and contextual eyebrows.
- Added a self-documenting website with a component showcase, documentation pages, optimized local images, and reusable hero theme classes.
- Added responsive transparent and glass header states, a compact fallback page title, and a sticky footer layout.

### Changed

- Reorganized default-theme components by Atomic Design and consolidated their nested CSS structure.
- Refined semantic typography, spacing, prose handling, navigation states, cards, and section layout options.
- Simplified section filenames, reserved underscored support directories, and improved heading anchors and content validation.

## [0.2.3] - 2026-10-30

### Added

- Added a dedicated light Sproutsite DaisyUI theme with semantic colors, typography, spacing, radius, and elevation tokens.

### Changed

- Applied the new design tokens to the shared page layout, navigation, hero, sections, footer, and fallback heading.

## [0.2.2] - 2026-10-30

### Added

- Added a dynamic GitHub release badge to the README.

## [0.2.1] - 2026-10-30

### Changed

- Reorganized the default-theme styles into documented foundation, component, and theme modules behind a single stylesheet entry point.

## [0.2.0] - 2026-10-30

### Changed

- Made `NN-section.name.md` the required naming convention for content sections.
- Updated the content validator, section sorting, documentation, and all bundled example content for the new convention.

## [0.1.1] - 2026-10-27

### Fixed

- Included the installed default theme's Astro components and layouts in Tailwind's source scan so packaged websites receive all required utility classes.

## [0.1.0] - 2026-10-27

### Added

- Introduced the initial Sproutsite file-based content framework, default DaisyUI theme, validated content contract, static routing, SEO metadata, sitemap, tests, and accessibility checks.
- Added the installable package surface for content collections, Astro configuration, and the shared page route, together with local tarball verification.
