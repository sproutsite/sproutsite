# Website editorial guidelines

This is the user's website, built with Sproutsite and Astro. The installed library provides the design and components. Sproutsite contains no AI agent or administration backend; external coding agents help maintain these files.

- Write for visitors and the person maintaining this website. Use clear English, concrete benefits, and natural headings. Avoid invented facts, exaggerated claims, repetitive copy, and generic marketing phrases.
- Use American English (en-US) for English-language content unless explicitly requested otherwise.
- Automatically use the bundled `sproutsite-edit-page` skill for page and section work. Before creating, editing, moving, or deleting a page, use the Sproutsite MCP server's `search_documentation` to find relevant guidance, `get_document` for guides, and `get_component` for components as needed. Start with `view: "summary"` in the detail tools, then request the relevant `sectionId` for imports, parameters, or examples. Check the installed Sproutsite version if the documentation differs. If MCP is unavailable, use local sources and briefly mention the fallback. Send only public framework terms, component names, or documentation IDs. Keep project content local.
- Ask for missing business facts instead of inventing contact details, prices, services, or credentials. Use only approved images and preserve licensing and attribution notices.
- For editorial tasks, edit content under `src/content/`, the relevant website settings, and approved assets. Do not change the installed package or invent new components to make content fit.
- Global website settings, navigation, production URL and footer belong in `src/content/site.yaml`. Set the real production URL before deployment; `https://example.com` is a placeholder.
- Each page is a directory under `src/content/pages/` with `page.yaml` (`title` and `description`), optional `hero.md`, and numbered sections starting at `01`. Keep numbering consecutive and descriptive. A new page is not automatically added to the menu.
- The hero supplies the H1. Without it, the page title becomes the H1. Sections start with H2; do not add another H1. Use meaningful headings, descriptive links and appropriate image alternative text.
- `.md` is for ordinary Markdown. `.mdx` may import only documented components from `sproutsite/components`. Keep scripts, arbitrary HTML and custom CSS out of content files. Existing components and tokens define the design.
- Use root-relative internal links such as `/about/`. Local images belong in `_assets/` and are referenced relatively. Do not use absolute developer filesystem paths.
- Keep the complete website configuration in `src/content/site.yaml`, using `i18n`, `links.external` and `hero` for locale, external-link and global hero settings. Language-specific site files contain only overrides: objects inherit fields and lists replace the full list. Optional blog settings use `blog.hero` (title, eyebrow, description) and `blog.articles.heading`.
- Adjust the default theme in `src/styles/custom.css`. Keep colors and typography in `src/content/site.yaml`.
- The local theme descriptor is `src/themes/website/theme.ts`. For agreed layout changes, edit the selected Header and Footer in `src/components/` and use `sproutsite/default-components` to delegate. Keep the theme selection in `astro.config.ts`.
- Neutral branding files are owned by this website under `public/branding/`; the hero and footer use the artwork in `public/images/` configured in `site.yaml`. Replace them only with approved artwork, update branding paths and alternative text as needed, and retain `public/LICENSE.txt` and `public/NOTICE.txt` for supplied artwork. Package updates do not overwrite these copies.
- Check desktop and mobile reading order, spacing, contrast and keyboard operation. Be candid about unclear copy, weak calls to action, redundant sections and missing information; explain the practical improvement.
- Run `npm run check` and `npm run build` after edits; do not report checks you did not run. Preview with `npm run dev`. A successful automated check does not replace visual and editorial review.
- Publish only with the user's explicit request. Deploy the complete `dist/` directory; configure the host's error documents separately. Never commit secrets or automatically publish this private website package to npm.

Developer work is secondary and requires an agreed scope. Keep Astro standards and TypeScript, preserve the content model, reuse documented Sproutsite components, and do not edit `node_modules/`. Preserve Apache-2.0 and third-party notices for distributed dependencies; the software license does not grant trademark rights or determine the license of this website's own content.

Reference: https://sproutsite.dev/documentation/
