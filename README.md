# Sproutsite

[![GitHub Release](https://img.shields.io/github/v/release/sproutsite/sproutsite?display_name=tag&sort=semver)](https://github.com/sproutsite/sproutsite/releases)

**Sproutsite — The Agent-Ready Static CMS**

Agent-ready, Markdown-first Static CMS powered by Astro and TypeScript.

Sproutsite is an npm-based developer tool for file-based content, page structures, and reusable components. External coding agents such as Codex or Claude Code can edit the repository; **Sproutsite itself contains no AI agent**. There is no traditional CMS administration backend. Astro generates a static website that needs no CMS server runtime, while Git keeps content changes reviewable.

_Plant an idea. Grow your website._

Official website: [sproutsite.dev](https://sproutsite.dev) · [Documentation](https://sproutsite.dev/documentation/) · [Component showcase](https://sproutsite.dev/showcase/) · [Source code](https://github.com/sproutsite/sproutsite)

## Installation

Use Sproutsite in your own Astro project. You maintain the content files; the package provides the content model, page assembly, and default theme. The published `create-sproutsite` generator prepares a minimal English or German website. Sproutsite has no administration interface.

Requires Node.js 24 or a newer supported LTS version, and npm. Create an English website:

```sh
npm create sproutsite@latest my-website -- --language en
cd my-website
npm run dev
```

For German content, use `--language de`. The assistant asks for a website name and whether to install dependencies. If you skip installation, run `npm install` before `npm run dev`. The starter includes Astro configuration, content collections, a shared page route, a small homepage and editorial guidance in `AGENTS.md`. Edit the generated files under `src/content/`; the design stays in the installed Sproutsite package.

The German starter serves German directly at `/`. It follows the existing locale convention with `site.de.yaml`, `page.de.yaml` and `.de.md`/`.de.mdx` content, plus base configuration and page metadata. Its README explains which configuration and metadata pairs to keep synchronized. It does not generate an English website.

Set your production URL before deployment. The new website's README explains preview, content editing and building. The generator has its own [repository](https://github.com/sproutsite/create-sproutsite) and [npm package](https://www.npmjs.com/package/create-sproutsite); its version is independent of the library.

### Manual installation in an Astro project

For an existing Astro project, or to configure a new project by hand, use the following setup. The current package supports Astro 7 and MDX 8; these commands use the tested peer-dependency ranges. If you used the generator, skip this manual setup and continue with [Write, Preview, and Publish](#write-preview-and-publish).

The library is available on [npm](https://www.npmjs.com/package/sproutsite). For local library changes, use the archive workflow under [Testing a Local Package](#testing-a-local-package).

```sh
mkdir my-website
cd my-website
npm init -y
npm install sproutsite astro@^7.4.12 @astrojs/mdx@^8.1.6
npm install --save-dev @astrojs/check typescript
```

In your project's `package.json`, set `"type": "module"` and add these scripts, preserving the other fields:

```json
{
    "type": "module",
    "scripts": {
        "dev": "astro dev",
        "check": "astro check",
        "build": "astro build",
        "preview": "astro preview"
    }
}
```

These are consumer-project scripts. Sproutsite's repository has additional development and publication checks described below.

## Set Up Your Website

Create these files in your project:

```text
my-website/
├── astro.config.ts
├── package.json
├── tsconfig.json
└── src/
    ├── content.config.ts
    ├── pages/
    │   └── [...slug].astro
    └── content/
        ├── site.yaml
        └── pages/
            ├── page.yaml
            ├── hero.md
            └── 01-introduction.md
```

`astro.config.ts`:

```ts
import { defineConfig } from 'astro/config';
import { createSproutsiteConfig } from 'sproutsite/config';

export default defineConfig(createSproutsiteConfig());
```

This configuration registers MDX, the default theme's Tailwind integration, sitemap, and error pages. You do not need to add separate MDX or Tailwind integrations for this setup. In an existing Astro project, merge the setup carefully and remove routes that would conflict with Sproutsite's generated pages, such as a starter `src/pages/index.astro`.

`tsconfig.json`:

```json
{
    "extends": "astro/tsconfigs/strict"
}
```

`src/content.config.ts`:

```ts
import { createSproutsiteCollections } from 'sproutsite/content';

export const collections = createSproutsiteCollections();
```

`src/pages/[...slug].astro`:

```astro
---
import SproutsitePage, { getSproutsiteStaticPaths } from 'sproutsite/page';

export async function getStaticPaths() {
    return getSproutsiteStaticPaths();
}
---

<SproutsitePage {...Astro.props} />
```

`src/content/site.yaml`:

```yaml
name: My website
url: https://example.com
base: /
language: en
locales: [en]
header:
    links:
        - label: Home
          href: /
footer:
    text: My website, built with Sproutsite.
    links:
        - label: Home
          href: /
```

Replace `name`, `url`, and the footer copy with your own details. `url` is your production origin, even during local development. A visible Sproutsite attribution is optional. Set `base` if the website will be hosted under a subpath, for example `/demo/`.

`src/content/pages/page.yaml`:

```yaml
title: My website
description: Practical notes and updates from our team.
```

`src/content/pages/hero.md`:

```md
---
title: Welcome to our website
eyebrow: Our team
type: small
tone: brand
---

Find our latest notes, project updates, and useful resources.
```

`src/content/pages/01-introduction.md`:

```md
---
tone: default
---

## Notes from our team

This is our first page. Edit this file to update the website.
```

## Write, Preview, and Publish

Run `npm run dev` and open the local address printed by Astro. Edit Markdown files under `src/content/` to change the page content. Add a directory with `page.yaml` and numbered sections to create another page; add its link to `site.yaml` when it should appear in navigation. An optional `hero.md` supplies the page's introductory area.

Use `.mdx` sections when you need documented components such as cards, columns, features, or accordions:

```mdx
import { Feature } from 'sproutsite/components';

## What you can find here

<Feature icon="BookOpen" title="Team notes">
    Practical guides maintained alongside our project.
</Feature>
```

Keep the content in your project and commit it to Git. An external coding agent can help edit these files; Sproutsite does not run an agent or translate content automatically. The installed package supplies the default theme and its components, while custom component or design development remains a developer task.

```sh
npm run check
npm run build
npm run preview
```

Deploy the complete `dist/` directory to your static host. The build includes the website, local assets, sitemap, manifest, and `404.html`/`500.html` error documents. Configure your web server to use those error documents; generated files do not configure Apache or Nginx automatically. See [Deployment](https://sproutsite.dev/documentation/deployment/) and [Error Pages](#error-pages).

The sections below describe the content format and component options. Repository development and release checks follow under [Developing Sproutsite](#developing-sproutsite).

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
├── 01-introduction.md   # start at 01, then number sections consecutively
└── faq/
    ├── page.yaml
    └── 01-questions.md
```

`page.yaml` requires a non-empty `title` and `description`. Both values are used for HTML metadata: `title` becomes the `<title>` tag and `description` becomes the meta description. Without `url`, its directory becomes the URL directly: `faq/page.yaml` becomes `/faq/`; a deeper `services/monitoring/page.yaml` becomes `/services/monitoring/`. The optional single URL segment `url` lets an English source path retain a localized public URL: `documentation/page.yaml` with `url: dokumentation` produces `/dokumentation/`. URL segments of parent pages are also considered for child pages.

A `hero.md` activates the shared hero and requires a frontmatter `title`, rendered as the visible `h1`. `titleHighlight` may select one text fragment from that title for the theme highlight. `hero-classes` in `site.yaml` may optionally set up to eight theme classes for each hero and for the H1 fallback view without `hero.md`. A `classes` list in an individual `hero.md` completely overrides that global list; `classes: null` removes global classes for that hero. Classes must begin with `ss-`, for example `ss-hero--visual`, so a theme can add gradients, overlays, or textures. `background-image` optionally references a local image relative to `hero.md`; Astro validates it and emits an optimized decorative hero image. `claim` adds a prominent line below the title. `actions` optionally defines one or two Button-based calls to action with `label`, `href`, and `variant: primary|secondary`; `tagline` adds a short line below them. If these settings are omitted, the hero receives no additional image or actions. Delete the file to render `page.yaml.title` as a compact visible H1 fallback above the sections; it still receives global `hero-classes`. Sections must be named `NN-name.md`, begin with an `h2`, and may set `tone: default`, `muted`, or `brand` in frontmatter. By default, `ss-section__content` constrains content to a readable width. `fullWidth: true` in section frontmatter removes this inner constraint; the shared outer `site-shell` and Markdown typography remain active. For numbered page and blog sections, `tone` also accepts an object with both `odd` and `even`. Each value is `default`, `muted`, or `brand`. The numeric filename prefix selects the tone, including translated files; it does not depend on the section's position in the page. Scalar tones remain fixed, and omitting `tone` still means `default`. Heroes only accept scalar tones. Use a YAML mapping, not a list:

```yaml
tone:
    odd: default
    even: muted
```

Section frontmatter may also set `spacing: small | default | large`. Omitted spacing means `default`, preserving the existing padding. From 64rem viewport width, `small` halves and `large` doubles both top and bottom padding; below 64rem, all variants retain the original mobile padding. This applies to numbered page and blog sections, independently of tone and content width, and does not affect heroes. The theme exposes `ss-section--spacing-small`, `ss-section--spacing-default`, and `ss-section--spacing-large`. See `/showcase/sections/` for live examples. Internal links always stay website-root-relative, for example `/faq/`; Sproutsite applies `base` exactly once. Heading IDs are derived from file names and headings, for example `01-introduction-inhalte-direkt-im-projekt-pflegen`, so anchor links remain unique across assembled Markdown files.

The optional hero frontmatter `type` accepts `small` (the default), `big`, or `fullscreen`. It adds `ss-hero--small`, `ss-hero--big`, or `ss-hero--fullscreen` alongside the existing theme classes. Both homepage translations explicitly use `big`; other heroes default to `small`. The blog overview and compact H1 fallback also receive `ss-hero--small`. The `big` variant adds more top spacing. Other variant-specific styling is still being prepared; `small` retains the base presentation, and `fullscreen` does not yet force a viewport-height hero.

```md
---
title: Beispiel-Hero
type: small
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

English and German content can be maintained in the same project. Configure `locales: [en, de]` in `site.yaml`, add `site.de.yaml` with German navigation and the same production URL/base, and add translated `page.de.yaml`, `hero.de.md`, and numbered `.de.md`/`.de.mdx` sections. Add `src/pages/de/[...slug].astro` using the same page component and an async `getStaticPaths()` wrapper that calls `getSproutsiteStaticPaths('de')`. Each locale uses its own copy and optional URL segments; translations are not generated automatically. Keep section numbers aligned between languages.

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

The file would be named `01-introduction.mdx`. Areas stack on mobile; from desktop widths onward, a 12-column grid applies. A `Columns` block contains one or more direct `Column` elements. `Column` accepts `span={1}` through `span={12}`; without a value, a column occupies the full width (`12`). Columns automatically continue on the next row when the next span no longer fits in the twelve available grid tracks. Eight columns with `span={4}`, for example, form rows of three, three, and two elements. Smaller totals intentionally leave empty space. The grid gap controls both horizontal and vertical spacing. For every Columns layout, `gap` accepts `xs` (0.5rem), `sm` (1rem), `md` (2rem, the existing gap without separators), `lg` (4rem), or `xl` (6rem). `gapMobile` optionally overrides the value below 64rem. Plain columns inherit the same gap on mobile. Existing divider layouts keep their prior defaults and half-sized mobile fallback. A divider or icon uses this same gap, never an additional gap. Existing `dividerGap` / `dividerGapMobile` remain supported; explicit `gap` / `gapMobile` take precedence over them for each axis. For example, `<Columns gap="xl" gapMobile="sm">` creates 6rem gaps on desktop and 1rem gaps on mobile without any separator. See `/showcase/layout/` for examples. Add `<Columns divider>` for subtle gray separators between adjacent columns, or `<Columns divider dividerColor="#94a3b8">` for a custom CSS hex color (3, 4, 6, or 8 digits). With dividers enabled, `dividerGap` accepts `xs` (2rem), `sm` (4rem), `md` (6rem, default), `lg` (8rem), or `xl` (12rem). Half the total gap sits on either side of the line. Set `dividerGap="lg"` for 8rem; it affects both column and row gaps. Below 64rem, `dividerGapMobile` optionally overrides the gap between stacked columns; each mobile preset uses half its desktop value, and when omitted the mobile gap is half of `dividerGap`. For example, `<Columns divider dividerGap="xl" dividerGapMobile="md">` uses 12rem on desktop and 3rem when stacked. Both values scale with the root font size. Presets use theme CSS modifiers such as `ss-columns--divider-gap-xl` and `ss-columns--divider-gap-mobile-md`, rather than inline spacing values. Vertical lines have a 20% inset at both ends. On mobile, divider lines run horizontally between stacked areas. `separator="MoveRight"` replaces the line with a decorative Lucide icon; any canonical icon name, such as `Plus` or `ChevronRight`, can be used. It also works without `divider` and takes precedence when both are set. `separatorAlign="centered"` (default) centers icons against the whole column. `separatorAlign="top"` aligns their centers with a direct vertical Feature icon, or 1.75rem below the column top for other content; mobile positioning stays between stacked areas. The icon uses the same spacing presets and optional `dividerColor`, defaults to the primary theme color, and rotates 90 degrees on mobile. Icons only appear between adjacent columns in the same desktop row, or between stacked columns on mobile. They progressively enhance the static content via a locally rendered Icon template and the existing processed browser script; without JavaScript the icons are omitted. With dividers, equivalent twelve-span flex rows keep large gaps between actual content areas rather than between all twelve internal grid tracks. Desktop row starts have no separator; a small processed TypeScript script uses ResizeObserver to identify actual row boundaries for arbitrary spans without clipping focus outlines or shadows. Without JavaScript, mobile separators remain visible and desktop separators are omitted.

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

## Features

The default theme's `Feature` molecule pairs a decorative Lucide icon with a heading and a short Markdown description:

```mdx
import { Feature } from 'sproutsite/components';

<Feature icon="Zap" title="Static output">
    Prebuilt pages that can be served by static hosting.
</Feature>
```

`icon` is a canonical Lucide component name; `title` is required. `layout` accepts `horizontal` (default, icon left of the text), `vertical` (icon above centered text), or `card` (icon above left-aligned text on a shared padded, rounded surface). For card layout, the whole background defaults to 8% icon color and 92% transparent, `backgroundColor` sets that entire surface, the icon has no separate box, and `variant` is ignored. Other layouts retain their existing background rules. All layouts support the same colors and heading levels; visual variants apply only to horizontal and vertical layouts. `iconSize` accepts `xs`, `sm`, `md` (default), `lg`, or `xl`. Symbols measure 14, 21, 28, 42, or 56px; boxes measure 1.75, 2.625, 3.5, 5.25, or 7rem respectively. `xs` is half the default size and `xl` doubles it. Text sizes remain unchanged. `variant` accepts `soft` (default), `solid`, or `plain`. `color` uses `primary` (default), `secondary`, `accent`, `neutral`, `info`, `success`, `warning`, or `error`, or a CSS hex value with 3, 4, 6, or 8 digits. Hex values always use the custom icon color with a softly tinted background and ignore `variant`. Set `backgroundColor="#E9EFDF"` to choose an explicit hex background instead; it overrides the variant background. `headingLevel` defaults to `3` and accepts numeric values from `2` to `6`; match it to the enclosing section. A section may begin directly with features using `headingLevel={2}`, without a separate Markdown heading. Combine features with the existing `Columns`/`Column` layout for responsive groups. Examples are available at `/showcase/features/` and `/de/showcase/features/`, and in Storybook.

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

This MDX component requires the Sproutsite configuration: a small rehype transform adds the caption, column-header scopes, and optional row marker to Astro's existing table AST. Validation uses `remark-gfm` to inspect the same Markdown table structure. No custom table parser or browser JavaScript is needed. Plain Markdown tables remain supported; `/showcase/tables/` demonstrates the enhanced component.

`FoundationSample` is a fixed visual theme specimen exported from `sproutsite/components`. Its required `kind` prop accepts `colors`, `type`, `spacing`, `radius`, `shadow`, or `focus`; it accepts no other props or children. For example, `<FoundationSample kind="colors" />` displays labeled swatches using the actual theme variables. It illustrates the theme rather than providing a general layout language. `/showcase/foundations/` contains live specimens and usage/CSS examples; the detailed token reference lives on `/documentation/theme/`.

The small reusable content and URL logic lives in `src/lib/sproutsite/`. It knows neither demo text nor Tailwind or DaisyUI classes. The default theme lives in `src/themes/default/` and includes the layout, header, hero, sections, and footer. DaisyUI is actively used there for navigation and theme elements.

The entry point for the default theme is `src/themes/default/styles/theme.css`. It documents the import order and remains the only central import. Global foundations live in `styles/foundation/`, semantic content variants in `styles/themes/`. Components follow Atomic Design: `atoms/`, `molecules/`, `organisms/`, and `layout/` for technical layout primitives. Every visible building block is organized locally as a pair, for example `components/organisms/Header/Header.astro` and `components/organisms/Header/Header.css`; `layouts/PageLayout/` follows the same pattern. Theme-owned classes begin with `ss-`, for example `ss-header` and `ss-header__inner`. The default theme is named `sproutsite`, intentionally light, and centrally defines semantic DaisyUI tokens, font sizes, spacing, radii, and shadows in its theme and foundation files.

Another theme can replace these components and the technical CSS integration without migrating Markdown or YAML. This is not yet a configurable theme loader and deliberately does not claim every UI library can be switched through a setting.

## Accordions

Import `{ Accordion, AccordionItem }` from `sproutsite/components` in an MDX section. `Accordion` accepts `multiple` (boolean, default false) and direct `AccordionItem` children. Items require `title`, accept `open` and an optional canonical PascalCase Lucide `icon`, and render Markdown in their default slot. Use at most one initially open item unless `multiple` is true.

`color` accepts Feature's semantic colors or validated CSS hex colors, defaulting to primary. Icon geometry matches Feature's medium size. `backgroundColor` overrides the icon box's default 8% color tint. `surfaceColor`, `openSurfaceColor`, and `openBorderColor` accept CSS hex colors for the closed background and open background/border; defaults are white/gray when closed and a light blue surface/blue border when open.

```mdx
import { Accordion, AccordionItem } from 'sproutsite/components';

<Accordion>
    <AccordionItem title="Does Sproutsite contain an agent?" icon="Layers" open>
        No. Your external coding agent edits files in the repository.
    </AccordionItem>
    <AccordionItem title="Do I need a CMS server?">
        No. Deploy the static output.
    </AccordionItem>
</Accordion>
```

Native details/summary provides keyboard operation. A small processed TypeScript module scopes single-open behavior to each group and closes open items when clicking noninteractive answer areas. Links, buttons, and text selection remain usable. Without JavaScript, headings still toggle items; whole-answer closing and single-open grouping are progressive enhancements. Do not nest Accordion groups. Custom colors need their own contrast review. See `/showcase/accordions/` for bilingual live examples and Storybook's Molecules/Accordion and Molecules/AccordionItem for controls.

## Sitemap

The configured Astro build generates `dist/sitemap.xml` using the official Astro sitemap integration. It lists every regular page and blog article with its absolute canonical URL, `lastmod`, and reciprocal `xhtml:link` language alternatives. Translations are matched by content identity, including different URL segments such as `/documentation/` and `/de/dokumentation/`; missing translations are not replaced with homepage links. `x-default` points to the existing default-language version. Error pages are excluded.

`lastmod` uses the latest Git commit touching a page's source directory or applicable site configuration. Local edits and untracked sources use their file modification timestamps when later. The blog overview considers article metadata. Without available Git history, source modification times are the fallback; preserve meaningful timestamps in exported source archives. These dates describe content/configuration changes, not every rebuild or a full dependency/theme change audit.

The existing `sitemap-index.xml` and `sitemap-0.xml` remain valid. `sitemap.xml` exposes the generated URL list directly; if the integration splits a large site into multiple chunks, it exposes the sitemap index instead. The document head links to `/sitemap.xml`, respecting the configured deployment base. No custom XML serializer is used.

## Error Pages

The default theme registers standard Astro custom 404 and 500 routes. In `npm run dev`, open `/404` or `/500` to preview the corresponding error page without triggering a server failure. Unknown URLs render the custom 404 page with HTTP status 404. Both pages reuse the small Hero, header, and footer. Agent references in their playful copy are fictional; Sproutsite contains no integrated agent.

`npm run build` emits `dist/404.html` and `dist/500.html` in the default language. Each additional configured language gets flat files with a language suffix: with English as default and German enabled, `dist/404-de.html` and `dist/500-de.html`. Development previews use `/404`, `/500`, `/de/404`, and `/de/500`; the localized preview directories are not retained in the build. All error pages are marked `noindex` and excluded from the sitemap. During development, the 404 also uses German for unknown `/de/` URLs when German is configured. A static host needs its own error-document configuration, including selection of the localized file; generating HTML does not configure the server or simulate server failures. Astro renders the localized routes normally, and a small build hook moves their HTML files to the server-friendly filenames.

For an Apache site whose document root contains `dist/`, configure local error documents:

```apache
ErrorDocument 404 /404.html
ErrorDocument 500 /500.html
```

For an Nginx server with the same document root:

```nginx
error_page 404 /404.html;
error_page 500 /500.html;
```

These local error documents preserve the original error status. For a subpath deployment, prefix the error-document URLs with the deployment base (for example `/demo/404.html`). Error pages still load their shared CSS, logo, and scripts from the generated asset directory, so deploy the complete build. See the official [Astro error-page documentation](https://docs.astro.build/en/basics/astro-pages/), [Apache ErrorDocument reference](https://httpd.apache.org/docs/2.4/mod/core.html#errordocument), and [Nginx error_page reference](https://nginx.org/en/docs/http/ngx_http_core_module.html#error_page).

## Validation and Limitations

A website without blog articles does not need `src/content/blog/`. Missing, empty and asset-only blog directories are handled without missing-directory or empty-collection warnings. The existing empty blog overview remains available; no page URLs are removed. Once source files exist, Astro's glob loader performs the normal loading, schema validation and content watching. A small optional-blog loader waits for the first source file using Astro's public loader watcher API; it does not create placeholders or filter diagnostics for actual content. Page rendering and language navigation query optional collections only after Astro has stored their first entry. A small internal readiness collection records this state through the public loader store API, including watcher updates; files appearing on disk alone do not imply that parsing has finished. This avoids empty-collection warnings during first-article loading and also supports a custom blog directory. The package test checks both warning-free builds and adding, editing and removing the first article without restarting the dev server, with deliberately delayed parsing to exercise requests while loading is still in progress.

The demo keeps English showcase and documentation sources in the standard files and German translations in their `.de.md`, `.de.mdx`, and `page.de.yaml` counterparts. English routes use `/showcase/` and `/documentation/`; German routes use `/de/showcase/` and `/de/dokumentation/`, including localized URL segments. Keep both versions up to date when editing examples, labels, image descriptions, or metadata. Markdown links use the source file's locale, and Button applies the active locale and deployment base exactly once. Theme messages are bundled from the local YAML files using Vite raw imports; they are not read from paths relative to generated build chunks.

The accessibility script discovers all generated page routes and checks both languages on mobile and desktop. To investigate specific pages, set `SPROUTSITE_A11Y_ROUTES` to a comma-separated list of generated routes before running `node --import tsx scripts/test-a11y.ts`; omit it for the complete run. Build verification also checks internal page and fragment targets in both languages, including under `/demo/`.

The validator checks directory association, YAML fields, file names, tones, duplicate section numbers, Markdown hierarchy, raw HTML, disallowed link protocols, internal link targets, and generated heading IDs. The build checks all generated pages, metadata, canonicals, the sitemap, and base prefixes. Project-owned program logic is TypeScript only; `npm run test:source` checks this too.

Accessibility testing automates axe, visible keyboard focus, and mobile overflow checks. It does not replace a complete WCAG 2.2 AA conformance assessment or editorial review of headings and link text.

Both the library and the separate `create-sproutsite` initializer are published to npm. The generator is maintained in its own repository with its own version and publication workflow. It creates the documented Astro setup and starter content rather than copying the framework or theme. It supports English or German, optional dependency installation, and localized editorial guidance. Optional extensions remain outside the current scope.

## Testing a Local Package

When testing changes to the library, create an archive in the Sproutsite repository:

```sh
npm pack
```

Use the filename printed by npm. In your separate consumer project, replace the registry installation command with:

```sh
npm install /absolute/path/to/sproutsite-VERSION.tgz astro@^7.4.12 @astrojs/mdx@^8.1.6
npm install --save-dev @astrojs/check typescript
```

Replace `VERSION` with the packed version, then follow the same configuration and content setup above. The archive contains the library and default theme, not the demo content, repository scripts, or Storybook. Install it in a separate directory rather than into the Sproutsite checkout.

## Developing Sproutsite

Node.js 24 LTS or later is required. `.nvmrc` pins Node.js 24.22.2 for local development.

```sh
git clone https://github.com/sproutsite/sproutsite.git
cd sproutsite
npm install
npm run dev
```

The dev server deliberately starts with `--force`, so changes to Content Collections, MDX components, and local package files are checked without an outdated Astro content cache.

The running demo documents itself at `/documentation/` (German: `/de/dokumentation/`): it contains setup, the content contract, layout components, theme, checks, and local package use. The visible [showcase](https://sproutsite.dev/showcase/) instead collects component examples.
The [blog](https://sproutsite.dev/blog/) is a small, file-based project journal. Each article lives in a `YYYY-MM-DD.article-slug/` directory in `src/content/blog/` and uses the same `page.yaml`, `hero.md`, and numbered sections as a normal page. `page.yaml` validates the title, description, date, local card image, and alternative text; the date prefix orders source directories while the URL only uses `article-slug`. Astro generates the overview and article routes from the collection, and every section supports the usual tones and documented MDX components.

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
npm run test:package # install and build the local archive in a fresh consumer
npm run prepublishOnly # run all publication checks without publishing
```

Storybook is a local developer tool and not part of the published website. It renders the existing `.astro` components with the default Sproutsite theme. Stories live in `stories/`, use TypeScript, and directly import their corresponding component. The initial set covers `Button`, `Badge`, `Alert`, `Card`, and `ContentImage`; add a story whenever a reusable component or meaningful variant is introduced. The running demo documents the workflow at `/documentation/storybook/`.

`npm run build:demo` sets `SPROUTSITE_BASE=/demo/` only for that command; `src/content/site.yaml` remains unchanged. The product website uses `https://sproutsite.dev`; consumer projects must configure their own production URL. Before deployment, check indexability and any staging protection. `robots.txt` is not access control.

The product identity is consistently Sproutsite: package imports use `sproutsite/*`, public helpers use `createSproutsiteCollections()`, `createSproutsiteConfig()` and `getSproutsiteStaticPaths()`, and theme classes use the `ss-` prefix. Update local consumers' dependency, imports, environment variables and custom theme overrides together.

### Logo and icons

The reference-based sprout and three-layer symbol lives in `src/themes/default/assets/branding/`. `logo.svg` (navy wordmark), `logo-dark.svg` (white wordmark), `logo-monochrome.svg`, `icon.svg`, and `icon-monochrome.svg` are standalone vector assets with transparent backgrounds and outlined Nunito lettering. They need no external font. The shared `BrandLogo` atom uses the existing locally hosted Nunito font, inherits the light/dark text color, and is used in the header and footer. Consumer sites with a different `site.name` retain their own text wordmark.

`favicon.svg` uses flat colors for small displays. The ICO contains native 16, 32, and 48 pixel frames; separate PNGs provide those sizes too. The Apple touch icon is 180 pixels; web app icons are 192 and 512 pixels, with navy backgrounds and safe internal padding. `PageLayout` links the icons and the static `/site.webmanifest` endpoint registered by `createSproutsiteConfig()` through Astro's standard `injectRoute()` API. Imported asset URLs and the configured base are respected; no CMS runtime or service worker is added. These are the default theme's icons; a differently branded consumer should replace them when replacing the theme. The Sproutsite social card is emitted only for the product site (`site.name: Sproutsite`).

Brand colors are separate `--color-brand-*` tokens in `styles/foundation/tokens.css`; the existing semantic UI palette is unchanged. Run `npm run branding:generate` after changing the vector geometry or brand tokens, then `npm run format`. The TypeScript generator uses `fontkit` and `sharp` only during development. Its local source font is `scripts/assets/nunito-variable.ttf` from the [official Nunito distribution](https://github.com/google/fonts/tree/main/ofl/nunito), covered by the adjacent SIL Open Font License. Generated assets are committed and ordinary builds do not regenerate or download them.

## Publication Checks

Run `npm run test:package` to test the actual npm archive in a fresh consumer project. It checks package metadata/version consistency, required exports and license files, and exclusion of demo/development files. It then installs the local tarball (not a registry package named Sproutsite), runs Astro/TypeScript checking, and builds the consumer for `/` and `/demo/`. The fixture exercises English/German routes, a Markdown section, an MDX accordion with a Lucide icon, theme CSS and fonts, version display, error documents, manifest, and multilingual sitemap. It also verifies that the installed library is a real copy rather than a symlink to this checkout. Missing and asset-only blogs must build without optional-blog warnings. A temporary Astro dev server then checks adding, editing and removing the first article without a restart, and is stopped after the test.

The test uses `scripts/fixtures/package-consumer/`, pins its direct Astro/MDX/checking dependencies to versions in the repository lockfile, and lets npm resolve the library's published dependency ranges. npm may need network access and uses its normal cache. Temporary files are removed after success and retained with their path printed after failure. Lifecycle scripts are suppressed during packing and installation to prevent recursive publication checks and ensure the archive already contains everything it needs. During `npm publish --dry-run`, the nested checks still create and install a real local archive; only their child processes override the inherited dry-run setting, so the outer publication remains a dry run.

`npm run prepublishOnly` runs formatting, TypeScript-source enforcement, content/Astro checking, unit tests, the demo build/output checks, and the consumer installation test. npm runs this gate automatically before publishing from this repository; any failing command stops the sequence. Neither running the gate manually nor running the package test publishes anything. A normal `npm pack` remains separate from this gate. Run the existing Storybook and accessibility checks as well when changing components or interactions. Do not bypass the gate with `--ignore-scripts` when publishing; publishing an existing tarball also requires checking that exact artifact beforehand.

## Dependency Security

Reviewed on 2026-11-18. The tested Astro version is 7.4.12, which is also the minimum accepted by this package's peer range. It includes the fixes for [dynamic-tag attribute injection](https://github.com/advisories/GHSA-mh32-jxcr-mh9f) and the [Node image endpoint path issue](https://github.com/advisories/GHSA-r3h5-4585-7x3w). The default Sproutsite website uses static output without the Node adapter, but the supported Astro range excludes those affected versions regardless.

The transitive [picomatch ReDoS advisory GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) remains open: the latest published picomatch version is 4.0.7 and the advisory lists no patched release. npm reports it through several Astro, globbing and developer-tool dependency paths; these are not separate root vulnerabilities. No audit exception or replacement package has been added to hide these reports.

This finding concerns Node-based tooling. Deploying `dist/` does not deploy a Node runtime or its npm dependencies. The static output does not eliminate the need to review build inputs and development tooling, and this project does not claim the dependency tree is free of vulnerabilities. Recheck `npm audit` after upstream patches are published. Do not use `npm audit fix --force` without reviewing the proposed changes; its current suggestions include incompatible Astro/MDX downgrades.

## License

Sproutsite is licensed under the Apache License, Version 2.0.

Copyright © 2026 Björn Hempel.

See [LICENSE](LICENSE) for the full license text and
[NOTICE](NOTICE) for attribution information.

This declaration covers first-party source code. The maintainer has also authorized Apache-2.0 licensing of the project's branding assets, their generated icon variants and social card, and `hero-waves.svg`, to the extent he holds rights that he can license. Their AI-assisted provenance and derivation are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Third-party software and fonts retain their own licenses. Other demo illustrations with unresolved provenance or licensing are not automatically covered by this artwork authorization; see the same file for scope and outstanding checks.

The software license does not grant general trademark rights to the Sproutsite name, domain, or logos; see Section 6 of the license. No visible Sproutsite attribution in a generated website's footer is required by Apache 2.0.
