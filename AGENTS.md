# Sproutsite – Rules for Coding Agents

## Goal and Current Development Status

Sproutsite — The Agent-first Static CMS. It is an agent-first, Markdown-first Static CMS powered by Astro and TypeScript. Developers provide layouts and tested building blocks; authors and external coding agents such as Codex or Claude Code maintain versioned content, components and page structures in the repository. Sproutsite itself contains no AI agent and no traditional CMS administration backend. Astro generates static websites requiring no CMS server runtime.

The product name is exclusively `Sproutsite`, its technical name is `sproutsite`, its official website is `https://sproutsite.dev`, and its repository is `https://github.com/sproutsite/sproutsite`. Use `sproutsite` for the package and `@sproutsite/` only for actual standalone packages when appropriate and available. Do not invent additional packages. Development happens directly in this repository. Sproutsite and its separate `create-sproutsite` initializer are published to npm; registry package ownership and the tested version must be verified before installation. Further publication still requires an explicit request. The initializer lives in the sibling project and https://github.com/sproutsite/create-sproutsite. Recommend `npm create sproutsite@latest` for a new website; retain manual library integration for existing Astro projects.

After installing its development dependencies, this repository must run immediately as a demo website with `npm run dev`. Preserve this contributor workflow independently of the installed library and the separate project generator.

## Architecture Principles

- Use Astro standards, stable public APIs, Astro components, Content Collections with schemas, and native Markdown processing.
- Extend only where the agreed content structure requires additional logic. Do not implement a custom Markdown parser, router, build runner, or general template system.
- Use a standard Astro project with TypeScript and npm. Start without a monorepo, plugin registry, dependency-injection container, or custom CLI.
- Keep functions and modules understandable. Do not create abstractions for hypothetical use cases, unnecessary wrappers, or dependencies.
- Briefly document deviations from Astro conventions. Maintainability matters more than a minimal line count.
- Separate the content model and page assembly from presentation. The core must not know DaisyUI classes or assume concrete demo pages.
- Load Markdown through Astro. For YAML, use existing loaders or a small established YAML parser where singleton configuration requires it. Do not parse YAML yourself.
- Keep reusable logic in `src/lib/sproutsite/` and the default theme in `src/themes/default/`. Small standard files connect them to Astro. These boundaries support the typed local theme descriptors exported by sproutsite/themes.
- Website-owned CSS overrides are registered through `createSproutsiteConfig({ styles: [...] })` with project-relative CSS paths. The shared document uses one build-time CSS entry that imports the resolved theme styles from ancestor to descendant, then website files in list order. Astro/Vite own CSS compilation, assets and HMR. Keep this option limited to CSS. A separate `components` option selects only local Header/Footer Astro replacements with documented `site`/`route` props; absent slots retain their defaults. Public `DefaultHeader`/`DefaultFooter` imports allow delegation without alias recursion. Theme descriptors select the documented presentation slots using local file URLs and optional extends chains. Independent themes receive no implicit default styles, components or palette mapping. The shared document retains metadata, skip link and main; theme Layout and route-body components must preserve their documented slots.
- The only style entry point for the default theme is `src/themes/default/styles/theme.css`. Its documented import order is part of the cascade and may only change after subsequent verification.
- Structure theme styles clearly: `styles/foundation/` contains only global foundations without concrete Astro components (tokens, base styles, focus, layout helpers, and prose); `styles/themes/` contains only semantic mappings such as content tones.
- Theme components follow Atomic Design: use `components/atoms/` for small UI building blocks, `components/molecules/` for composed UI building blocks, `components/organisms/` for larger website areas, and `components/layout/` for technical layout primitives. Do not create empty categories; choose the smallest suitable category for each new component.
- Each default-theme component lives in its category within its own PascalCase directory, containing an `.astro` and `.css` file with the same name, for example `components/organisms/Header/Header.astro` and `components/organisms/Header/Header.css`. The CSS file contains only the presentation of that building block; empty or unrelated CSS files are not allowed.
- Theme-owned CSS classes use the `ss-` prefix and clear block-element naming within a building block, for example `ss-header` and `ss-header__inner`. DaisyUI classes remain allowed for their actual UI components.
- Use native CSS nesting consistently for theme components: a block encapsulates its elements, for example `.ss-hero { .ss-hero__inner { .ss-hero__title { … } } }`; a modifier encapsulates its pseudo-elements and differing elements, for example `.ss-hero--theme-1 { &::before { … } .ss-hero__inner { … } }`. Do not split related selectors into separate blocks. This project uses CSS with Tailwind, not SCSS.
- Use the same outer content edge via `site-shell` for the header, footer, hero, sections, and H1 fallback view. Constrain reading width inside this container where needed; differing outer indents for these standard areas are not allowed.
- Demo content remains in `src/content/`; it must not become a fixed part of the framework core later.
- At the beginning, verify compatible stable versions in the official documentation. Use a supported Node LTS version, document it, and commit a lockfile. Do not guess version numbers.

## Mandatory Language: TypeScript Only

- Write all project-owned program logic in TypeScript: core code, helpers, browser code, tests, validation scripts, and programmatic tool configuration.
- Do not create `.js`, `.mjs`, or `.cjs` source files. Use `.ts`; do not introduce another programming language for project helper scripts.
- Use `astro.config.ts`. Test and other tool configurations must also be TypeScript where they require programmatic configuration. Choose tools that support TypeScript; report genuine limitations instead of silently adding JavaScript.
- Format formatable project sources with `npm run format`; use four spaces rather than tabs. Check unchanged formatting with `npm run format:check`. Do not format lockfiles or generated files.
- Use `astro/tsconfigs/strict` as the TypeScript base. Use precise types and inference; do not use blanket `any`, `@ts-ignore`, or disabled type checking to avoid errors.
- Astro components remain `.astro` files; write their program logic in TypeScript. Use typed component props.
- Browser scripts are processed by Astro: use TypeScript in processed `<script>` blocks or imported `.ts` modules. Do not use `is:inline`, HTML event handlers, or unprocessed JavaScript code in HTML strings.
- Generated JavaScript in build output and JavaScript in dependencies are allowed. TypeScript is transformed to JavaScript for execution; the source-code restriction does not apply to this required output.
- Markdown, YAML, CSS, JSON, and HTML templates inside `.astro` remain allowed for content, styles, data, and markup. npm scripts may invoke existing CLI tools; project-owned validation logic belongs in TypeScript files.
- During acceptance, check that no project-owned JavaScript source files exist. Exclude generated directories and dependencies from this check.

## Audience and Editorial Perspective

- The primary audience is the editorial user maintaining their own website with Sproutsite. Write from that person's perspective across the website and documentation: what they receive, which content files they edit, how they preview changes, and how they publish.
- Present the supplied design and components as existing tools for the user. Do not imply that editorial users must design a theme, build components, or develop Sproutsite before using it.
- Distinguish a user's own website project from the Sproutsite framework repository. Installing and using the library is a different workflow from cloning Sproutsite to contribute to it.
- Contributors to Sproutsite are the secondary audience. Put framework development, internal directories, tests, and contribution instructions in a clearly labeled second part, after the user workflow.
- Identify whose developers are meant whenever development is discussed: Sproutsite contributors or the team setting up an individual website. Avoid unexplained references to "developers" or "the project".
- Keep technical references precise, but explain their relevance to the editorial workflow first. Do not invent a graphical editor, installer, starter template, or command that does not exist.
- When explicitly requested, documentation may describe the intended npm consumer-installation workflow. Keep actual publication status identifiable and do not install an unverified registry package, publish a release, or claim unperformed installation tests.

## English Language Convention

- Unless explicitly specified otherwise, all English content must use American English (`en-US`), including website copy, documentation, Markdown files and other user-facing content. Use American spellings such as `color`, `behavior` and `optimize`.
- For existing content, correct spelling variants as needed without substantially rewriting the text solely to apply this rule.
- Preserve proper names, technical identifiers, API names and code. German content is unaffected.

## Writing Style for User-Facing Content

These rules apply to content primarily intended for prospective users or users, including the homepage, hero sections, product pages, the showcase, and comparable page copy. They do not apply to technical documentation, the README, API or configuration references, the changelog, validation errors, or code comments. For those, precision, completeness, and established technical writing conventions take precedence.

- Write naturally, directly, and clearly. Copy should sound like it was written by an experienced person, not generated automatically.
- Use short, precise sentences and everyday language instead of abstract technical or marketing language.
- Avoid typical AI phrases, artificial storytelling, exaggerated enthusiasm, and empty statements.
- Do not repeat information unnecessarily: every statement must add information or meaningfully develop the thought.
- Be specific instead of general. Use understandable examples, numbers, and real relationships when available.
- Prefer natural statements over constructions such as “X makes Y visible”, “More than just X”, or “Not only X, but also Y”.
- Headings should state the content clearly instead of manufacturing curiosity.
- Write from the audience's perspective: name the concrete problem, its practical effect, and the next helpful step.
- Do not explain the obvious or repeat in body copy what headings or illustrations already convey.
- Do not claim benefits, causes, or outcomes that cannot be substantiated.
- Review every finished text: does it sound natural, and does it contain unnecessary repetition or interchangeable phrasing? If so, revise it.

## Brand, Design, and Product Experience

- Default-theme website colours are configured through the optional semantic `colors` block in `site.yaml`; locale files inherit partial overrides. Accept opaque hex colours only. Preserve no-config defaults, validate known colour pairs and keep CSS mappings in the default theme. Brand-area foregrounds use `brand.content` independently of button foregrounds. SVGs, logos and raster artwork retain their own colours; users edit or replace them separately.

- Default-theme links are underlined only on hover. Keep native `<a>` elements; use the shared external-link attributes helper where needed. `site.yaml` controls `links.external.newTab` (defaults to true) and `links.external.icon` (defaults to false). Both are enabled for this demo. The trailing Lucide arrow is added only through CSS, including for email and telephone links; do not append duplicate icons or rewrite anchors into components.
- Links previously styled with medium weight use font-weight 600; unweighted links retain their existing weight. Every `target="_blank"` anchor requires both `noopener` and `noreferrer` in `rel`, including same-origin links. The build verifies this in rendered HTML.
- Inline emphasis in body text (`b` and `strong`, including Markdown bold text and text within components) uses font-weight 600. Preserve the existing weights of headings, logos, navigation, component labels and syntax highlighting; do not override the global bold-weight token for this rule.
- Describe Sproutsite accurately: it is an agent-first, Markdown-first Static CMS for Astro and TypeScript. External coding agents edit content and pages; Sproutsite does not include an AI agent.
- Preserve the modern, calm, organic, and confident visual language. Use existing navy, blue, teal, and green tokens; green is an accent, not a dominant surface. Reuse organic waves and soft gradients where appropriate.
- Before generating overview or card illustrations, read [the illustration guidelines](docs/assets/README.md) and inspect their primary buttons reference and the current website-guide images. The maintainer-approved style uses close, prominent matte 3D subjects, a pale upper wall around `#d9e3eb`, and a navy-to-teal wave with a defined upper crest fading softly into the floor. Preserve these proportions, materials, lighting and colours; do not revert to distant subjects or dark upper backgrounds. Verify responsive crops and record full prompts and provenance under `docs/assets/`.
- Prefer existing components and layout primitives. Keep typography, spacing, hierarchy, responsive behavior, contrast, and focus states clear; avoid visual clutter, glow effects, glassmorphism, and unnecessary animation.
- User-facing copy explains a concrete benefit without inventing features, commands, causes, or outcomes. Keep UI and explanatory copy in the active locale; established English brand claims are permitted on the German website. Preserve the information architecture unless a change is requested.
- On the Sproutsite homepage, brand precedes claim, explanation, and action. A product or landing-page hero needs this distinct hierarchy, a concise description, and a clear next action. Limit text width, keep decorative backgrounds readable, and make primary and secondary actions visibly distinct.

## Binding Content Contract

```text
src/content/
├── site.yaml
└── pages/
    ├── page.yaml
    ├── hero.md
    ├── 01-introduction.mdx # MDX layout section
    ├── 02-benefits.md
    ├── 03-further-reading.md
    ├── faq/
    │   ├── page.yaml
    │   ├── hero.md
    │   ├── 01-general-questions.md
    │   └── 02-content-management.md
    ├── info/
    │   ├── page.yaml
    │   ├── hero.md
    │   ├── 01-about-sproutsite.md
    │   └── 02-workflow.md
    ├── showcase/
    │   ├── page.yaml
    │   ├── hero.md
    │   ├── 01-areas.mdx
    │   ├── _assets/
    │   │   ├── layout-landscape.png
    │   │   └── layout-portrait.png
    │   ├── foundations/
    │   │   ├── page.yaml
    │   │   └── 01-foundations.md
    │   ├── layout/
    │   │   ├── page.yaml
    │   │   └── 01-layout.mdx
    │   ├── typography/
    │   ├── navigation/
    │   ├── sections/
    │   ├── alerts/
    │   ├── badges/
    │   ├── buttons/
    │   ├── images/
    │   └── cards/
    ├── documentation/
    │   ├── page.yaml
    │   ├── hero.md
    │   ├── 01-overview.mdx
    │   ├── getting-started/
    │   ├── content/
    │   ├── layout/
    │   ├── theme/
    │   ├── checks/
    │   └── package/
    ├── blog/
    │   ├── _assets/
    │   ├── 2026-10-27.project-foundation/
    │   │   ├── page.yaml
    │   │   ├── hero.md
    │   │   ├── 01-basic-idea.mdx
    │   │   └── 02-architecture.mdx
    │   ├── 2026-10-30.content-collections/
    │   ├── 2026-11-03.component-system/
    │   └── 2026-11-08.quality-workshop/
    └── contact/
        ├── page.yaml
        └── 01-contact.md
```

### Global Configuration: `site.yaml`

At a minimum:

```yaml
name: Sproutsite
url: https://sproutsite.dev
base: /
hero:
    classes:
        - ss-hero--theme-1
    background-image: /backgrounds/hero-waves.svg
header:
    links:
        - label: Startseite
          href: /
        - label: FAQ
          href: /faq/
        - label: Info
          href: /info/
        - label: Showcase
          href: /showcase/
        - label: Dokumentation
          href: /dokumentation/
        - label: Blog
          href: /blog/
        - label: Kontakt
          href: /kontakt/
footer:
    text: Eine Beispielwebsite mit Sproutsite.
    links:
        - label: Kontakt
          href: /kontakt/
i18n:
    locale: de
    defaultLocale: de
    locales:
        - de
```

Website name, `i18n`, production URL, base path, global `hero.classes`, navigation, and footer are maintained here. `i18n.locale` identifies the active configuration; the base locale must match `i18n.defaultLocale`. `i18n.locales` lists enabled languages; its order does not determine the default. Optional `site.<locale>.yaml` files inherit the base recursively: objects merge by field, arrays replace entirely, omitted fields inherit. Production URL, base, default locale and enabled languages remain shared. Group external-link options under `links.external` (`newTab`, `icon`) and blog copy under `blog.hero` and `blog.articles.heading`. Legacy language/link/blog keys remain readable for existing consumers; never mix legacy and grouped spellings within one layer. `hero.classes` is optional, contains at most eight theme classes with the `ss-` prefix, and applies to every hero and H1 fallback view without `hero.md`; `classes` in an individual `hero.md` overrides this value completely. Use the same validated values for Astro configuration, links, canonicals, and the sitemap; do not duplicate configuration. Astro configuration must not import Content APIs that are only available within the Astro runtime. Use a small Node-compatible loader for singleton configuration needed in more than one place.

`https://sproutsite.dev` is the canonical product website. Consumer sites configure their own production URL. The demo does not require external fonts, tracking, or services. Use the approved Sproutsite sprout-and-layers logo in `src/themes/default/assets/branding/`; do not reintroduce an obsolete logo. Brand colors are separate tokens in `foundation/tokens.css`. Reproduce derived assets with `npm run branding:generate`; keep SVGs standalone and preserve the local font's license. The shared `BrandLogo` atom adapts to header and footer text colors. The default theme registers a static web app manifest via Astro's `injectRoute()` API; this is a metadata endpoint, not a content page or a custom router.

### Page: `page.yaml`

```yaml
title: Energie verstehen und gezielt optimieren
description: Eine aussagekräftige Beschreibung dieser Beispielseite.
url: energie
```

- `title` and `description` are non-empty required fields used for HTML metadata: `title` for the `<title>` tag and `description` for the meta description. `url` is optional and contains exactly one URL segment using lowercase letters, digits, and hyphens.
- Every directory containing `page.yaml` defines a page; directories without this file may serve purely as grouping for deeper pages. Directories whose name begins with `_` are reserved support directories (such as `_assets/`), must not contain `page.yaml`, and never produce a page.
- Without `url`, the relative directory path determines the URL: root → `/`, `faq/` → `/faq/`, `services/monitoring/` → `/services/monitoring/`. A `url` value replaces only the segment of its own directory; for child pages, the `url` values of existing parent pages are also used. Therefore, `documentation/page.yaml` with `url: dokumentation` and `documentation/getting-started/page.yaml` with `url: einstieg` continue to produce `/dokumentation/einstieg/`.
- Do not implement additional slug overrides or translation systems beyond this single explicit URL-segment value during this phase.
- For pages without a hero, `title` is also the visible main heading.

- Explicit QR/advertising landing pages may set `layout: landing` in `page.yaml`. This omits the header and automatic H1 fallback; `hero.md` is disallowed. Exactly one visible `h1` must be supplied by the section content, which may begin with an image. Other pages keep the default layout and heading rules.

### Optional Hero: `hero.md`

```md
---
title: Energie verstehen und gezielt optimieren
eyebrow: Willkommen bei Sproutsite
tone: brand
classes:
    - ss-hero--visual
background-image: ./_assets/hero-visual.png
---

Eine kurze Einführung in die Inhalte dieser Seite.

[Mehr erfahren](/info/)
```

- The presence of the file activates the hero. Do not add another activation option to `page.yaml`.
- `title` is a non-empty required field rendered as the visible `h1`; `titleHighlight` is an optional text fragment from `title` rendered with the theme highlight class; `eyebrow` is optional; `tone` has a documented default.
- `classes` is optional and contains at most eight additional theme classes for the outer hero `section` element. Each class starts with `ss-` and may only contain lowercase letters, digits, `_`, and `-`, for example `ss-hero--visual`. When `classes` is supplied as a list, it completely overrides global `hero.classes` from `site.yaml`. `classes: null` deliberately removes global classes; when the field is absent, global classes apply. This lets theme developers add gradients, overlays, or textures without copying the hero. These classes are only intended for `hero.md`, not for sections.
- Global `hero.background-image` in `site.yaml` is an optional safe public-root image path, e.g. `/backgrounds/hero-waves.svg`. It also applies to H1 fallbacks, the blog overview and error heroes. Local `background-image` in `hero.md` overrides it; omission inherits it and `null` disables the image. Local values support public-root SVG/raster paths and relative images through Astro's image schema. Raster imports are optimized, public files and SVGs are preserved. Without either image setting only the configured CSS backgrounds remain. Classes and background-image are independent; `classes: null` does not disable a global image. Decorative images have empty alternatives; meaningful images belong in content.
- `claim` is an optional prominent line rendered below the H1. `actions` is optional and contains one or two `{ label, href, variant }` entries. `variant` is `primary` or `secondary`; the shared hero renders them with the existing Button component. `tagline` is an optional short line rendered below the actions.
- The shared hero component renders the title and Markdown content entirely from `hero.md`.
- Without a hero, the layout renders `page.yaml.title` as a compact visible H1 fallback before the sections. It receives global `hero.classes` from `site.yaml`; without `hero.md`, there is no local override. This is the only intended visible fallback for pages without a hero.
- The homepage, FAQ, and Info use the same hero component with their own content. Do not create three copied implementations.

### Blog: `src/content/blog/YYYY-MM-DD.article-slug/`

The optional `blog` object in `site.yaml` configures the overview's `title`, `eyebrow`, `description`, and article-list `heading`; when provided, all four must be non-empty strings. Consumer projects use these settings instead of changing the shared BlogIndex component.

Each direct article directory in `src/content/blog/` is named `YYYY-MM-DD.article-slug`. The date prefix keeps the source tree chronologically ordered; only the lowercase hyphenated `article-slug` becomes the final URL segment below `/blog/`. Every article uses the same `page.yaml`, `hero.md`, and numbered Section structure as a normal content page. The overview at `/blog/` is generated automatically and orders articles by descending `pubDate`.

```yaml
# page.yaml
title: A meaningful article title
description: A short card and metadata description.
pubDate: 2026-11-08
image: ../_assets/article-visual.png
imageAlt: Meaningful alternative text for the article image
```

All `page.yaml` fields are required. `image` is a local raster asset relative to `page.yaml` and is optimized by Astro for the overview card. `hero.md` owns the visible H1, eyebrow, tone, optional classes, and introductory Markdown; the date from `page.yaml` is rendered in this shared hero. Numbered sections support the same tones, reading width, and documented MDX components as normal content pages. Do not use `h1` in article Markdown.

### Sections: `NN-name.md` and `NN-name.mdx`

```md
---
tone: muted
fullWidth: true
---

## Ein eigener Inhaltsbereich

Hier steht normaler Markdown-Inhalt.

[Antworten auf häufige Fragen](/faq/)
```

- Only files directly in a page directory belong to that page; do not mix them with child pages.
- Start each page's sections at `01` and number them consecutively (`01`, `02`, `03`, …), using at least two digits and descriptive lowercase hyphenated names; sort numerically. Do not start at `00` or leave gaps. Duplicate numbers are errors. Keep translated section files numbered identically. Standard sections use `.md`; an `.mdx` file is allowed only for documented MDX layout components.
- `tone`: `default`, `muted`, or `brand`; omission means `default`. Numbered page and blog sections may instead use a YAML object with both `odd` and `even`, each containing one of those tones. Resolve it from the numeric filename prefix (including localized files), never from the array position. Fixed scalar tones remain unchanged. Heroes only accept scalar tones.
- `fullWidth`: an optional Boolean for sections; an omitted value means `false` and constrains content to the reading column. With `true`, only `ss-section__content` is omitted; `content-prose` and the outer `site-shell` remain active. The area therefore uses the full content width but not the browser edge.
- `spacing`: optional `small`, `default`, or `large`; omission means `default`. It controls the section's top and bottom padding. In the default theme, from 64rem viewport width, `small` halves and `large` doubles the existing section spacing; below that width, all variants retain the existing padding. This applies to numbered page and blog sections, not heroes, and is independent of tone and content width. Keep its CSS modifiers inside the Section component.
- One file renders one semantic content section. It starts with a meaningful `h2`; further levels must follow logically. Do not use `h1` in hero or section Markdown.
- Do not use custom section directives, control comments, CSS classes, or inline styles in content files. MDX is allowed only in `.mdx` sections and may import only documented Sproutsite components and relative local images; do not use browser scripts or arbitrary JSX elements.
- For the MVP, the content contract supports normal Markdown without raw HTML or executable code. Check disallowed constructs using the existing Markdown AST; do not recreate a regex parser. Fenced code blocks remain normal content.
- Heading IDs must be unique within the assembled page, including equal headings in different files. Use a small deterministic strategy and document anchor links.

### MDX Layout Components

- When using MDX in a consumer project, install `@astrojs/mdx` as a direct dependency. Sproutsite configuration includes the official MDX integration.
- The first standard building block is a 12-column layout: `Columns` contains one or more direct `Column` areas with spans from 1 to 12. Common distributions include `6 + 6`, `8 + 4`, and `4 + 4 + 4`. It renders stacked on mobile and side by side from desktop widths upward.
- New components are developer work: they require a tested Astro component, a documented export, and clear MDX usage. Do not develop an unrestricted layout language.

## Validation, Routing, and Development

- Use suitable Content Collections and Astro schemas. A small shared function supplements directory relationships and numeric sorting.
- Generate pages through one shared static Astro route with `getStaticPaths()`, including the homepage. Do not hand-write routes for individual demo pages.
- Validate YAML fields and frontmatter strictly. Errors name the file, field or cause, and expected values. Do not silently fall back for invalid configuration.
- Hero or section files without directly associated `page.yaml` are errors. Do not silently ignore incorrectly named content files; report them clearly. README files belong outside the content directory.
- Internal content links are website-root-relative, for example `/faq/`, without the deployment subpath. Apply `base` exactly once to such links and local public asset URLs.
- Handle external URLs, `mailto:`, `tel:`, query strings, and fragment targets correctly. Do not allow invalid URL protocols such as `javascript:` or protocol-relative URLs in the content contract.
- Check internal page targets and fragments against the finished output; ordinary static files such as images must not be interpreted as pages.
- Ensure safe path normalization: no path traversal and no silent URL collisions.
- Changes, additions, and removals of content files must be reflected by the dev server. Check YAML changes too. If global build configuration requires a restart, document this honestly; do not build a complex custom watch system.

## Replaceable Presentation with DaisyUI

- Integrate Tailwind CSS and DaisyUI according to their current official Astro instructions.
- Actually use DaisyUI in navigation, links/buttons, the hero, or other suitable theme elements.
- Keep DaisyUI- and Tailwind-specific classes and styles in the default theme and its technical integration. Do not put such details into content schemas or core modules.
- Map semantic `tone` values to static, tested color variants. Do not dynamically compose Tailwind class names in a way that bypasses CSS detection.
- Ensure readable Markdown typography including lists, links, tables, and code.
- A later theme replacement must not require content migration. It may require changes to components and CSS/build integration. Do not falsely promise that every UI library is already interchangeable through a configuration switch.
- Ship one default theme and a local derived demo entry. Preserve the documented local inheritance contract; do not build a theme marketplace, runtime switcher or unrelated plugin system.
- Use a shared header and footer on all pages. Navigation has an active page state. For six links, a responsive wrapping navigation without a JavaScript menu is sufficient.
- The agreed content, navigation, footer, site metadata, and color variants are configurable. Arbitrary layout structures remain developer work; do not build a visual page builder.

## Accessibility and SEO

These requirements apply to implementation and content tasks, not only at the end of the project.

- Target WCAG 2.2 AA. Do not claim full conformance based on automated tests alone.
- Use semantic HTML, correct `lang`, a skip link, exactly one `main`, one visible `h1` as a project convention, and a logical heading structure.
- Provide keyboard operation, visible and unobscured focus indicators, meaningful reading order, sufficiently large interactive targets, and responsive presentation without avoidable horizontal page overflow.
- Check contrast for every supported color variant; make links in running text recognizable. Do not convey information through color alone.
- Use meaningful link text; use links for navigation and buttons for actions. Mark active navigation with `aria-current="page"`.
- Images need meaningful alternative text or deliberately empty alternative text when decorative. If images are used, consider dimensions, responsive delivery, and suitable loading behavior. Do not add images merely to satisfy a checklist.
- Do not use unnecessary animation; if used, respect `prefers-reduced-motion`. Prefer native HTML semantics over unnecessary ARIA.
- Use individual HTML titles and meta descriptions from validated data; derive absolute canonical URLs from the same production URL, base, and route. Do not create duplicate base prefixes.
- Prefer the official Astro sitemap integration. Use static crawlable links and correct status/404 handling; do not use a catch-all that renders unknown URLs as the homepage.
- Do not add meta keywords, fabricated JSON-LD, or ranking promises. The FAQ may initially remain regular Markdown text; no accordion or FAQ schema is required.
- Before publishing, document the production URL, indexability, and any staging protection that must be checked. `robots.txt` is not access control.

## Agent Work Modes

During framework development, core, theme, and Astro configuration may be changed within the agreed scope.
For content-only tasks, edit only content, approved website settings, and assets. Do not expand the content model or styles without being asked in order to force content to fit.
These rules are behavior instructions, not a technical sandbox. Do not claim that an agent with full file access cannot change the layout.

## Repository-Local Codex Skills and Versions

- Repository-specific workflows are located in `.codex/skills/`. Use them when the user explicitly invokes their name or shortcut.
- Release workflows prepare a release; run `npm publish`, create a GitHub release, tag, or push only with an explicit request.
- The publishable version must match in `package.json`, `VERSION`, and `CHANGELOG.md`. The changelog follows Keep a Changelog and SemVer.

### Legal identity data

- Keep personal website-operator details in the ignored root `.env`; `.env.dist` contains examples only and is safe to commit.
- Legal-notice content uses the documented `LegalIdentity` component instead of hardcoded operator details. Its `contact` view renders address/contact cards; `name` renders the operator name.
- Development previews without complete operator details show marked examples. Builds rendering this component require a complete `.env` with the examples replaced. Consumer sites without the component do not need these variables.
- Do not add private operator details to content, metadata, tests, logs or documentation. Preserve public source-code copyright and attribution notices independently.
- Privacy hosting and retention metadata comes from the documented `PrivacyInfrastructure` component and `PRIVACY_*` keys in `.env`. Do not infer absence of server logs from static generation or invent deletion periods. An empty log retention period remains explicitly unresolved. Published retention statements must match actual server and mailbox practice; editing `.env` does not configure deletion.

### Licensing

- Sproutsite is licensed under Apache License 2.0.
- Preserve all applicable copyright, license, and NOTICE information.
- New first-party source code follows the project's Apache-2.0 license unless explicitly stated otherwise.
- Do not remove or overwrite third-party license notices.
- Do not introduce dependencies or assets with incompatible licensing without review.
- The software license does not grant trademark rights.
- Do not add attribution requirements beyond Apache 2.0.

Existing asset provenance exceptions and pending checks are documented in `THIRD_PARTY_NOTICES.md`; do not assume that the source-code license clears these assets. Keep official and third-party license texts unchanged and include the applicable notices when preparing distribution archives.

## Verification and Documentation

Provide at least these commands:

- `npm run dev`: local Astro preview from this repository.
- `npm run build`: validated static output to `dist/`.
- `npm run preview`: preview the build.
- `npm run check`: Astro/TypeScript checking plus required content validation.
- `npm test`: a few meaningful tests of project-owned conventions.
- `npm run test:package`: pack and install the actual archive into a fresh temporary consumer, then check/build it for `/` and `/demo/`. Verify missing/empty optional blogs stay quiet, and add/edit/remove the first article in a temporary dev server without restarting it. Requires npm dependency access or a suitable cache; does not publish.
- `npm run prepublishOnly`: execute the publication checks manually without publishing. npm also runs this hook before publication from this repository; do not bypass it or publish a separate untested artifact.
- `npm run test:a11y`: reproducible browser verification of all generated demo, showcase, and documentation pages, for example with Playwright and axe-core.
- `npm run storybook`: local isolated component workshop using Storybook Astro on port 6006.
- `npm run build:storybook`: static Storybook build to `storybook-static/`.

Use existing tools; do not build a custom test platform. Check especially sorting and duplicate numbers, deep directory association, missing page metadata, invalid tones, hero presence, H1 fallback, unique IDs, and base URL behavior. Temporary fixtures for deeper pages are sufficient; the visible demo includes the homepage, content pages, showcase, and documentation.

Check built output for internal links and metadata. Test once with `/` and once with a subpath such as `/demo/`. Check desktop and mobile presentation as well as keyboard operation. Automated checks do not replace editorial judgment of headings or alternative text.

README in English: setup, Node version, commands, project structure, adding pages/sections, removing the hero, changing navigation/footer, color variants, links/base, replacing the theme, and planned npm extraction. Keep code identifiers in English. Document checks that were actually run and open limitations; never report unrun tests as passed.

## Future npm Distribution and Deliberately Excluded Scope

Keep core and base layout separated so they can later be extracted into an npm package. Do not use absolute developer paths or core imports from demo content. Briefly document the planned public surface without implementing unused APIs now.

Local archive installation testing is implemented through `npm run test:package`. The library is published; the minimal generator is a separate sibling project and has its own tests and publication lifecycle. Keep generator code and templates out of the framework package. A custom MCP server, extensions/marketplace, multisite, an administration backend, integrated AI agents, authentication, a form backend, automated deployment and a complex layout language remain outside the current scope.

Do not publish or deploy anything without the corresponding request. Do not treat an invented license or package-name availability as resolved.
