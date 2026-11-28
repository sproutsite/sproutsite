# Your website

This website uses Sproutsite's default theme and an English content starter.

```sh
npm install
npm run dev
```

If dependencies were installed by the generator, skip `npm install`.

- `src/content/site.yaml`: complete base configuration for the website name, production URL, `i18n`, branding, navigation and footer. Optional `site.<locale>.yaml` files contain only overrides: objects inherit individual fields, while lists replace the inherited list entirely.
- `src/content/pages/page.yaml`: homepage title and description for search and browser metadata.
- `src/content/pages/hero.md`: introductory hero and visible H1.
- Hero and footer backgrounds: set `hero.background-image` and `footer.background-image` in `src/content/site.yaml`. The starter uses `public/images/hero.jpg` and `public/images/footer.webp` on every page.
- `public/branding/`: neutral logo, favicon, app icons and sharing image. Replace the files or change `branding` in `site.yaml`. Keep `logo.showName: true` to show your website name beside the symbol, and adjust the sharing-image alternative text to describe your own image.
- Numbered `.md` and `.mdx` files: individual content sections, starting at `01`.
- `AGENTS.md`: guidance for editorial work with an external coding agent.

To add a page, create a directory containing `page.yaml`, an optional hero and numbered sections. Add a navigation link in `site.yaml` if needed. MDX can use documented components from `sproutsite/components`.

Open the generated project in Codex or Claude Code and ask the agent to create, edit, move, or remove a page. Both use the bundled `sproutsite-edit-page` skill and consult Sproutsite MCP for public documentation when working on pages. Claude Code may ask you to approve the project MCP server on first use. Project content stays local.

Keep `i18n.locale` and `i18n.defaultLocale` set to `en`, with `i18n.locales: [en]`, for this English starter at `/`. External-link settings are `links.external.newTab` and `links.external.icon`. No blog configuration is generated; if you add one, use `blog.hero.title`, `blog.hero.eyebrow`, `blog.hero.description` and `blog.articles.heading`.

## Customize the theme

The starter selects `src/themes/website/theme.ts` in `astro.config.ts`. Use `src/styles/custom.css` for visual changes, a theme with `extends: defaultTheme` to replace selected components, or an independent theme without `extends` for a complete implementation. An independent theme supplies every documented slot and its own CSS. You can reuse specific entries explicitly through `defaultTheme.components`.

In the descriptor, point to existing local `.astro` and `.css` files with `new URL('relative/path', import.meta.url)`. The starter selects its own Header and Footer and inherits the remaining components. Removing either entry from the descriptor restores that inherited component. Astro configuration can also set `components.Header` or `components.Footer` to take precedence over the theme. Landing pages omit the header. Theme selection belongs in `astro.config.ts`; editorial settings remain in `site.yaml`.

Use `ThemeProps<'Header'>` or the matching slot name from `sproutsite/themes`. The header and footer receive the resolved `site` and the content `route` without the language prefix or deployment base. Delegate through `sproutsite/default-components` to call the shipped implementation without re-entering the active replacement. Existing documented MDX components can be replaced, including inside inherited components. MDX still uses its documented component names. Check mobile navigation, keyboard access and focus when changing markup.

Restart the dev server after changing the descriptor, paths or CSS list. Edits to selected Astro and CSS files use Astro/Vite hot updates.

## Customize the design

Edit `src/styles/custom.css` to adjust the default theme. The commented Card example leaves the initial appearance intact. Sproutsite loads base theme CSS, derived theme CSS, then the files listed under `styles` in `astro.config.ts`, in list order. The cascade and specificity still apply, and rules in `@layer components` can lose to higher DaisyUI or utility layers. Keep colors and typography in `src/content/site.yaml`. Your CSS files survive Sproutsite package updates. Edits to registered CSS files update the development preview. Restart the dev server after changing the file list. Missing or invalid CSS paths cause an error.

```sh
npm run check
npm run build
npm run preview
```

Set your real production URL before deployment. Deploy the complete `dist/` directory. It contains `sitemap.xml`, `404.html` and `500.html`; configure your host to use the error documents. This starter contains no blog articles; blog routes and collection behavior are supplied by the installed library.

The artwork belongs to your project's files. Sproutsite package updates do not replace it. Omit a page background to inherit that default, or set `background-image: null` to disable it. Preserve `public/LICENSE.txt` and `public/NOTICE.txt` when redistributing the supplied Apache-2.0 artwork. No visible attribution or Sproutsite wordmark is required. Review appearance, contrast and sharing previews after replacing artwork.

Sproutsite remains an installed dependency, not a copied theme. Commit `package-lock.json` after installation. The starter restricts Sproutsite upgrades to the tested `0.5.x` line; review version changes before upgrading beyond it.

The website package is private to prevent accidental npm publication. Your own content remains yours; choose its licensing separately. Sproutsite and the original starter templates are Apache-2.0; see LICENSE-SPROUTSITE and NOTICE-SPROUTSITE for the supplied starter files. Dependency licenses and trademark rights remain separate.

[Documentation](https://sproutsite.dev/documentation/) · [Components](https://sproutsite.dev/showcase/)

## Enable site search

Set `search.enabled: true` in `src/content/site.yaml`. Run `npm run build` to generate `dist/pagefind/`, then start `npm run dev` or `npm run preview` and click the magnifying glass. Rebuild after changing searchable content and deploy the complete `dist/` directory. The dialog searches in the active language.

[Site search setup and hosting](https://sproutsite.dev/documentation/getting-started/your-website/search/)
