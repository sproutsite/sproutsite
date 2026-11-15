# Sproutsite

[![GitHub Release](https://img.shields.io/github/v/release/sproutsite/sproutsite?display_name=tag&sort=semver)](https://github.com/sproutsite/sproutsite/releases)

**Sproutsite — The Agent-Ready Static CMS**

Agent-ready, Markdown-first Static CMS powered by Astro and TypeScript.

Sproutsite is an npm-based developer tool for file-based content, page structures, and reusable components. External coding agents such as Codex or Claude Code can edit the repository; **Sproutsite itself contains no AI agent**. There is no traditional CMS administration backend. Astro generates a static website that needs no CMS server runtime, while Git keeps content changes reviewable.

_Plant an idea. Grow your website._

This repository is a working demo and local package development state. The package remains private and has not been published; registry availability is not implied. Official website: [sproutsite.dev](https://sproutsite.dev). Repository: [sproutsite/sproutsite](https://github.com/sproutsite/sproutsite).

## Preparing Local Package Use

Sproutsite provides a small public package surface:

- `sproutsite/content` with `createSproutsiteCollections()`
- `sproutsite/config` with `createSproutsiteConfig()`
- `sproutsite/page` with the shared route and `getSproutsiteStaticPaths()`
- `sproutsite/components` with documented MDX layout components

The demo itself already uses these imports. A future local consumer uses a tarball created with `npm pack` and installs it there. The package remains `private` and is not published to the npm registry until an explicit publishing request is made.

A consumer project needs its own content plus these three small integrations:

```ts
// src/content.config.ts
import { createSproutsiteCollections } from 'sproutsite/content';

export const collections = createSproutsiteCollections();
```

```ts
// astro.config.ts
import { defineConfig } from 'astro/config';
import { createSproutsiteConfig } from 'sproutsite/config';

export default defineConfig(createSproutsiteConfig());
```

```astro
---
// src/pages/[...slug].astro
import SproutsitePage, { getSproutsiteStaticPaths } from 'sproutsite/page';

export const getStaticPaths = getSproutsiteStaticPaths;
---

<SproutsitePage {...Astro.props} />
```

Content files belong exclusively to the consumer project. Test the installable state without publishing to a registry:

```sh
# in the Sproutsite repository
npm pack

# in the separate Astro consumer project
npm install /absolute/path/to/sproutsite-0.4.0.tgz
npm run check
npm run build
```

The resulting `.tgz` is ignored by this repository. A fresh temporary consumer project with its own `site.yaml` and Markdown section has been tested successfully this way.

## Getting Started

Node.js 24 LTS or later is required. `.nvmrc` pins Node.js 24.22.2 for local development.

```sh
npm install
npm run dev
```

The dev server deliberately starts with `--force`, so changes to Content Collections, MDX components, and local package files are checked without an outdated Astro content cache.

The running demo documents itself at `/documentation/` (German: `/de/dokumentation/`): it contains setup, the content contract, layout components, theme, checks, and local package use. The visible [showcase](/showcase/) instead collects component examples.
The [blog](/blog/) is a small, file-based project journal. Each article lives in a `YYYY-MM-DD.article-slug/` directory in `src/content/blog/` and uses the same `page.yaml`, `hero.md`, and numbered sections as a normal page. `page.yaml` validates the title, description, date, local card image, and alternative text; the date prefix orders source directories while the URL only uses `article-slug`. Astro generates the overview and article routes from the collection, and every section supports the usual tones and documented MDX components.

The optional `blog` setting in `site.yaml` accepts `title`, `eyebrow`, `description`, and `heading` (all non-empty strings) to customize the blog overview. The demo configures English overview copy in `site.yaml` and German copy in `site.de.yaml`. Without this setting, the theme supplies neutral, localized fallback text. Article links use “Learn more” or “Mehr erfahren” and include the article title in their accessible name.

English articles use `page.yaml`, `hero.md`, and numbered sections; their German counterparts use `page.de.yaml`, `hero.de.md`, and `.de.mdx` sections in the same article directory. Each pair keeps its publication date, image, and slug; titles, descriptions, alternative text, heroes, and body copy are maintained separately. `/blog/` and `/de/blog/` list their respective language versions. Dates use the site's language and UTC so a date-only publication value does not shift on hosts in another time zone.

Additional commands:

```sh
npm run check       # content contract plus Astro and TypeScript checks
npm test            # small unit tests for URL conventions
npm run build       # validated static build to dist/
npm run preview     # preview the build
npm run test:a11y   # Playwright, axe, keyboard focus, and mobile width
npm run build:demo  # builds once with base /demo/
npm run storybook   # isolated Astro component workshop on port 6006
npm run build:storybook # static Storybook output to storybook-static/
```

Storybook is a local developer tool and not part of the published website. It renders the existing `.astro` components with the default Sproutsite theme. Stories live in `stories/`, use TypeScript, and directly import their corresponding component. The initial set covers `Button`, `Badge`, `Alert`, `Card`, and `ContentImage`; add a story whenever a reusable component or meaningful variant is introduced. The running demo documents the workflow at `/dokumentation/storybook/`.

`npm run build:demo` sets `SPROUTSITE_BASE=/demo/` only for that command; `src/content/site.yaml` remains unchanged. The product website uses `https://sproutsite.dev`; consumer projects must configure their own production URL. Before deployment, check indexability and any staging protection. `robots.txt` is not access control.

The product identity is consistently Sproutsite: package imports use `sproutsite/*`, public helpers use `createSproutsiteCollections()`, `createSproutsiteConfig()` and `getSproutsiteStaticPaths()`, and theme classes use the `ss-` prefix. Update local consumers' dependency, imports, environment variables and custom theme overrides together.

### Logo and icons

The reference-based sprout and three-layer symbol lives in `src/themes/default/assets/branding/`. `logo.svg` (navy wordmark), `logo-dark.svg` (white wordmark), `logo-monochrome.svg`, `icon.svg`, and `icon-monochrome.svg` are standalone vector assets with transparent backgrounds and outlined Nunito lettering. They need no external font. The shared `BrandLogo` atom uses the existing locally hosted Nunito font, inherits the light/dark text color, and is used in the header and footer. Consumer sites with a different `site.name` retain their own text wordmark.

`favicon.svg` uses flat colors for small displays. The ICO contains native 16, 32, and 48 pixel frames; separate PNGs provide those sizes too. The Apple touch icon is 180 pixels; web app icons are 192 and 512 pixels, with navy backgrounds and safe internal padding. `PageLayout` links the icons and the static `/site.webmanifest` endpoint registered by `createSproutsiteConfig()` through Astro's standard `injectRoute()` API. Imported asset URLs and the configured base are respected; no CMS runtime or service worker is added. These are the default theme's icons; a differently branded consumer should replace them when replacing the theme. The Sproutsite social card is emitted only for the product site (`site.name: Sproutsite`).

Brand colors are separate `--color-brand-*` tokens in `styles/foundation/tokens.css`; the existing semantic UI palette is unchanged. Run `npm run branding:generate` after changing the vector geometry or brand tokens, then `npm run format`. The TypeScript generator uses `fontkit` and `sharp` only during development. Its local source font is `scripts/assets/nunito-variable.ttf` from the [official Nunito distribution](https://github.com/google/fonts/tree/main/ofl/nunito), covered by the adjacent SIL Open Font License. Generated assets are committed and ordinary builds do not regenerate or download them.

## Maintaining Content

For a compact QR or advertising entry page, set `layout: landing` in `page.yaml`, omit `hero.md`, and supply exactly one visible H1 in the section content. The content can start with an image. This layout omits the header and automatic title area; the normal footer and shared components remain available. All other pages use `layout: default` automatically.

`src/content/site.yaml` contains the name, production URL, base path, language, navigation, and footer. In `header.links`, add an entry with `type: separator` between links to display a decorative vertical line styled with CSS. Separators inherit the navigation text color, including after scrolling, and are hidden from assistive technology. Localized navigation in `site.de.yaml` supports the same syntax:

```yaml
header:
    links:
        - label: Blog
          href: /blog/
        - type: separator
        - type: language-switcher
        - type: cta
          icon: Mail
          variant: primary
          label: Contact
          href: /contact/
```

Header links use `type: link` by default; it may be omitted. Set `type: cta` to render a navigation link with the shared Button component. Its optional `variant` defaults to `primary` and accepts `primary`, `secondary`, `accent`, `neutral`, `info`, `success`, `warning`, or `error`. CTA entries retain normal link behavior, locale and base handling, and the active page indication. `variant` applies only to CTA entries; separators use only `type: separator`.

Both regular header links and CTAs accept an optional `icon`, using a canonical PascalCase Lucide name such as `Mail`, `BookOpen`, or `Sprout`. The icon appears before the label and inherits its color. It is decorative for screen readers because the visible label already names the link. Omit `icon` for a text-only entry. Unknown names stop the build; separators do not accept icons.

Add `type: language-switcher` to `header.links` to show the native disclosure dropdown. It lists the project's configured `locales`, including when there is only one language. Content IDs match translated pages and blog articles even when their URL segments differ; missing counterparts link to the target language's homepage. Astro's `getRelativeLocaleUrl()` supplies the language prefix and deployment base. The existing content convention supports English and German; it does not discover or translate new languages automatically. Language names use their native spelling. Flags are local SVGs from MIT-licensed `flag-icons` (GB for English, DE for German); languages are identified by text, not flags alone. The selector works without JavaScript; a small processed Astro script adds Escape and outside-click dismissal. Removing the configuration entry removes the selector.

Below 72rem, the header uses a hamburger button and a fullscreen native `<dialog>`. It reuses the same configured navigation, with an inline language selector and full-width CTA. A compact language selector also remains available in the closed header when configured. Native modal focus handling, Escape, localized open/close labels, scroll locking, and desktop resize restoration are supported. Without JavaScript, the ordinary wrapping navigation remains accessible. The desktop layout is unchanged.

Every page is a directory under `src/content/pages/`:

```text
pages/
├── page.yaml            # homepage
├── hero.md              # optional
├── 01-introduction.md   # regular Markdown sections, sorted numerically
└── faq/
    ├── page.yaml
    └── 01-questions.md
```

`page.yaml` requires a non-empty `title` and `description`. Both values are used for HTML metadata: `title` becomes the `<title>` tag and `description` becomes the meta description. Without `url`, its directory becomes the URL directly: `faq/page.yaml` becomes `/faq/`; a deeper `services/monitoring/page.yaml` becomes `/services/monitoring/`. The optional single URL segment `url` lets an English source path retain a localized public URL: `documentation/page.yaml` with `url: dokumentation` produces `/dokumentation/`. URL segments of parent pages are also considered for child pages.

A `hero.md` activates the shared hero and requires a frontmatter `title`, rendered as the visible `h1`. `titleHighlight` may select one text fragment from that title for the theme highlight. `hero-classes` in `site.yaml` may optionally set up to eight theme classes for each hero and for the H1 fallback view without `hero.md`. A `classes` list in an individual `hero.md` completely overrides that global list; `classes: null` removes global classes for that hero. Classes must begin with `ss-`, for example `ss-hero--visual`, so a theme can add gradients, overlays, or textures. `background-image` optionally references a local image relative to `hero.md`; Astro validates it and emits an optimized decorative hero image. `claim` adds a prominent line below the title. `actions` optionally defines one or two Button-based calls to action with `label`, `href`, and `variant: primary|secondary`; `tagline` adds a short line below them. If these settings are omitted, the hero receives no additional image or actions. Delete the file to render `page.yaml.title` as a compact visible H1 fallback above the sections; it still receives global `hero-classes`. Sections must be named `NN-name.md`, begin with an `h2`, and may set `tone: default`, `muted`, or `brand` in frontmatter. By default, `ss-section__content` constrains content to a readable width. `fullWidth: true` in section frontmatter removes this inner constraint; the shared outer `site-shell` and Markdown typography remain active. Internal links always stay website-root-relative, for example `/faq/`; Sproutsite applies `base` exactly once. Heading IDs are derived from file names and headings, for example `01-introduction-inhalte-direkt-im-projekt-pflegen`, so anchor links remain unique across assembled Markdown files.

```md
---
title: Beispiel-Hero
titleHighlight: Hero
tone: brand
classes:
    - ss-hero--visual
background-image: ./_assets/hero-visual.png
claim: A memorable message.
actions:
    - label: Get started
      href: /dokumentation/einstieg/
      variant: primary
tagline: A short supporting claim.
---
```

Localization is not implemented in this milestone. Keep UI and explanatory copy in one language; established English brand claims can remain on a German page. A future localization layer should own translations and language selection rather than mixing languages in shared components.

To deliberately remove global hero classes, use:

```md
---
title: Hero ohne globale Theme-Klassen
classes: null
---
```

For tested layout building blocks, Sproutsite also supports MDX sections with the `.mdx` extension. Install this direct peer dependency in the consumer project:

```bash
npm install @astrojs/mdx
```

The first standard building block is a responsive 12-column layout:

```mdx
import { Column, Columns } from 'sproutsite/components';

<Columns>
    <Column span={8}>

        ## Hauptinhalt

        Dieser Bereich nimmt acht von zwölf Spalten ein.

    </Column>

    <Column span={4}>

        Dieser Bereich ergänzt den Hauptinhalt auf vier Spalten.

    </Column>

</Columns>
```

The file would be named `01-introduction.mdx`. Areas stack on mobile; from desktop widths onward, a 12-column grid applies. A `Columns` block contains one or more direct `Column` elements. `Column` accepts `span={1}` through `span={12}`; without a value, a column occupies the full width (`12`). Columns automatically continue on the next row when the next span no longer fits in the twelve available grid tracks. Eight columns with `span={4}`, for example, form rows of three, three, and two elements. Smaller totals intentionally leave empty space. The grid gap controls both horizontal and vertical spacing.

Common balanced distributions are `12` (one column), `6 + 6` (two columns), `4 + 4 + 4` (three columns), and `3 + 3 + 3 + 3` (four columns). Asymmetric distributions such as `8 + 4` or `7 + 5` are equally valid. New layout components always require an Astro component, a documented export, and documented usage.

The first DaisyUI component is `Alert`. Import it in an MDX section; it accepts optional `variant="info|success|warning|error"` and `style="normal|soft|outline|dash"` props:

```mdx
import { Alert } from 'sproutsite/components';

<Alert variant="success" style="soft">
    **Gespeichert:** Die Änderungen wurden übernommen.
</Alert>
```

Local content images belong beside their page or in a shared local `_assets/` directory, for example `src/content/pages/showcase/_assets/`. The `_` prefix marks a support-only directory: it must not contain `page.yaml` and therefore cannot generate a page. `ContentImage` imports these PNG, JPEG, WebP, or AVIF files relatively from MDX and sends them through Astro’s asset pipeline as WebP at quality 80. The component accepts `width`, `height`, `fullWidth`, `shape="rounded|square"`, and `border="default|none"`; when width and height are specified, it uses `object-fit: cover`.

```mdx
import layoutImage from '../_assets/layout.png';
import { ContentImage } from 'sproutsite/components';

<ContentImage
    src={layoutImage}
    alt="Description of the image content"
    width={720}
    height={260}
    fullWidth
    shape="rounded"
    border="default"
/>
```

`Card` combines an optional local image, Markdown content, and actions. Its first direct `###` heading receives the DaisyUI card-title style. `CardActions` is optional; all Markdown links inside it render as consistent primary buttons. Use `shadow="none|sm|md|lg|xl"` to configure elevation; `sm` is the default.

```mdx
import cardImage from './images/card.png';
import { Card, CardActions } from 'sproutsite/components';

<Card image={cardImage} imageAlt="Description of the image content" shadow="md">
    ### Card title

    Multiple Markdown paragraphs are supported.

    <CardActions>
        [Learn more](/info/)
    </CardActions>

</Card>
```

`Button` renders a semantic link when `href` is provided and a real button otherwise. It accepts `variant="primary|secondary|accent|neutral|info|success|warning|error"`, `style="solid|outline|soft|ghost|link"`, `size="xs|sm|md|lg|xl"`, `type="button|submit|reset"`, and the Boolean `disabled` for button actions. Links deliberately cannot be disabled.

```mdx
import { Button } from 'sproutsite/components';

<Button href="/contact/">Contact</Button>
<Button variant="secondary" style="outline">
    Save draft
</Button>
```

`Badge` labels compact status values or categories. It accepts `variant="default|primary|secondary|accent|neutral|info|success|warning|error"`, `style="solid|outline|soft|dash"`, and `size="xs|sm|md|lg|xl"`.

```mdx
import { Badge } from 'sproutsite/components';

Build status: <Badge variant="success" style="soft">ready</Badge>
```

`Tabs` and `Tab` display Markdown panels with DaisyUI styling. `Tabs` requires a non-empty accessible `label` and one or more direct `Tab` children, each with a non-empty `title`. Optional `variant` supports `border` (default), `box`, and `lift`; `initial` is a one-based index (default `1`) and must refer to an existing panel.

```mdx
import { Tabs, Tab } from 'sproutsite/components';

<Tabs label="Product information" variant="border" initial={1}>
    <Tab title="Overview">

        An overview with **Markdown**.

    </Tab>
    <Tab title="Details">

        Additional information.

    </Tab>

</Tabs>
```

Tabs progressively enhance static panels: all content remains readable without JavaScript. With JavaScript, each group has its own selection and linked tab/panel semantics. Arrow keys wrap between tabs, Home/End select the first/last tab, and Tab moves into the active panel. Long tab lists scroll horizontally. See `/showcase/tabs/` for examples. The implementation uses [DaisyUI tabs](https://daisyui.com/components/tab/) and the [WAI-ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

Fenced code blocks use Astro's built-in Shiki highlighter. Specify the language after the opening fence, for example `mdx`, `typescript`, `yaml`, or `css`. The configuration preloads MDX and its embedded TSX grammar so imports, components, attributes, and Markdown receive their respective syntax colors. Highlighting runs at build time and needs no browser library. Restart the development server after changing the shared Astro configuration.

## Icons

Use the default theme's `Icon` atom in MDX or Astro:

```mdx
import { Icon } from 'sproutsite/components';

<Icon name="Sprout" size={24} />
<Icon name="CircleCheck" color="success" label="Published" />
<Icon name="Sprout" size={32} background="primary" label="Growth" />
```

The local `@lucide/astro` dependency renders inline SVGs without browser JavaScript, icon fonts, or CDN requests. `name` uses the canonical PascalCase component name from the [Lucide catalog](https://lucide.dev/icons/), such as `ArrowRight`; unknown names stop rendering with an error. Optional `size` (default `24`) and `strokeWidth` (default `2`) are positive numbers. `color` defaults to inherited text color; supported theme colors are `primary`, `secondary`, `accent`, `info`, `success`, `warning`, and `error`.

Set `background` to `primary`, `secondary`, `accent`, `neutral`, `info`, `success`, `warning`, or `error` for a padded square with slightly rounded corners. The matching content color is applied automatically unless `color` explicitly overrides it. `size` controls the symbol's dimensions; padding increases the outer square. Without `background`, the icon remains unboxed.

Omit `label` beside explanatory text: the icon is then decorative (`aria-hidden`). For meaningful standalone icons, provide a non-empty `label` to render an accessible image name. Icons do not provide interactive behavior. In MDX, only these documented props are accepted; children, arbitrary classes, and executable expressions are rejected. The wrapper resolves the registry during the build; it does not ship the registry to browsers. Direct individual Lucide imports in theme `.astro` files remain available when build-time tree-shaking is preferred. See `/showcase/icons/` (German: `/de/showcase/icons/`) for previews and copyable examples. Lucide's separate license notices are retained in `third-party-licenses/lucide-LICENSE`.

## Structure and Theme

External HTTP(S) links automatically receive `target="_blank"` and `rel="noopener noreferrer"`, including Markdown reference/autolinks and header/footer links. External means a different origin from the validated production URL in `site.yaml`, so preview builds use the same classification. Internal/same-origin links, fragments, `mailto:`, and `tel:` retain their normal behavior. Authors do not add link attributes in content.

`ContentTable` wraps exactly one Markdown table in an MDX section. Its required `caption` becomes a native table caption. Optional props are `variant="plain|striped"`, `density="comfortable|compact"`, a boolean `wide` flag, and a one-based `highlight={2}` body-row index. Keep blank lines between the component tags and Markdown table. Column alignment uses standard Markdown colons. `wide` preserves a minimum table width of 60rem inside a keyboard-focusable horizontal scroll region.

```mdx
import { ContentTable } from 'sproutsite/components';

<ContentTable caption="Example projects" variant="striped">

    | Project | Status | Pages |
    | :--- | :---: | ---: |
    | North | Draft | 12 |
    | South | Reviewed | 8 |

</ContentTable>
```

This MDX component requires the Sproutsite configuration: a small rehype transform adds the caption, column-header scopes, and optional row marker to Astro's existing table AST. Validation uses `remark-gfm` to inspect the same Markdown table structure. No custom table parser or browser JavaScript is needed. Plain Markdown tables remain supported; `/showcase/tabellen/` demonstrates the enhanced component.

`FoundationSample` is a fixed visual theme specimen exported from `sproutsite/components`. Its required `kind` prop accepts `colors`, `type`, `spacing`, `radius`, `shadow`, or `focus`; it accepts no other props or children. For example, `<FoundationSample kind="colors" />` displays labeled swatches using the actual theme variables. It illustrates the theme rather than providing a general layout language. `/showcase/foundations/` contains live specimens and usage/CSS examples; the detailed token reference lives on `/dokumentation/theme/`.

The small reusable content and URL logic lives in `src/lib/sproutsite/`. It knows neither demo text nor Tailwind or DaisyUI classes. The default theme lives in `src/themes/default/` and includes the layout, header, hero, sections, and footer. DaisyUI is actively used there for navigation and theme elements.

The entry point for the default theme is `src/themes/default/styles/theme.css`. It documents the import order and remains the only central import. Global foundations live in `styles/foundation/`, semantic content variants in `styles/themes/`. Components follow Atomic Design: `atoms/`, `molecules/`, `organisms/`, and `layout/` for technical layout primitives. Every visible building block is organized locally as a pair, for example `components/organisms/Header/Header.astro` and `components/organisms/Header/Header.css`; `layouts/PageLayout/` follows the same pattern. Theme-owned classes begin with `ss-`, for example `ss-header` and `ss-header__inner`. The default theme is named `sproutsite`, intentionally light, and centrally defines semantic DaisyUI tokens, font sizes, spacing, radii, and shadows in its theme and foundation files.

Another theme can replace these components and the technical CSS integration without migrating Markdown or YAML. This is not yet a configurable theme loader and deliberately does not claim every UI library can be switched through a setting.

## Validation and Limitations

The demo keeps English showcase and documentation sources in the standard files and German translations in their `.de.md`, `.de.mdx`, and `page.de.yaml` counterparts. English routes use `/showcase/` and `/documentation/`; German routes use `/de/showcase/` and `/de/dokumentation/`, including localized URL segments. Keep both versions up to date when editing examples, labels, image descriptions, or metadata. Markdown links use the source file's locale, and Button applies the active locale and deployment base exactly once. Theme messages are bundled from the local YAML files using Vite raw imports; they are not read from paths relative to generated build chunks.

The accessibility script discovers all generated page routes and checks both languages on mobile and desktop. To investigate specific pages, set `SPROUTSITE_A11Y_ROUTES` to a comma-separated list of generated routes before running `node --import tsx scripts/test-a11y.ts`; omit it for the complete run. Build verification also checks internal page and fragment targets in both languages, including under `/demo/`.

The validator checks directory association, YAML fields, file names, tones, duplicate section numbers, Markdown hierarchy, raw HTML, disallowed link protocols, internal link targets, and generated heading IDs. The build checks all generated pages, metadata, canonicals, the sitemap, and base prefixes. Project-owned program logic is TypeScript only; `npm run test:source` checks this too.

Accessibility testing automates axe, visible keyboard focus, and mobile overflow checks. It does not replace a complete WCAG 2.2 AA conformance assessment or editorial review of headings and link text.

Future npm extraction still needs a defined public package surface, an installation test in a consumer project, package metadata/publishing, a project generator, and optional extensions. These capabilities are explicitly outside the scope of this milestone.

## License

Sproutsite is licensed under the Apache License, Version 2.0.

Copyright © 2026 Björn Hempel.

See [LICENSE](LICENSE) for the full license text and
[NOTICE](NOTICE) for attribution information.

This declaration covers first-party source code. Third-party software and fonts retain their own licenses. Existing visual assets with unverified provenance are not relicensed by this change; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for the asset scope, retained notices, and outstanding checks before redistribution.

The software license does not grant general trademark rights to the Sproutsite name, domain, or logos; see Section 6 of the license. No visible Sproutsite attribution in a generated website's footer is required by Apache 2.0.
