# Website editorial guidelines

- English is the default language at `/`. German starts at `/de/`. Use American English and natural German. Ask for missing facts about the website owner or their work.
- Use `sproutsite-edit-page` for pages and sections. Look up guides and components at `https://mcp.sproutsite.dev/mcp` using public search terms and document IDs. Check the installed version when it differs from the documentation.
- Edit pages under `src/content/pages/`. Place `page.yaml` and `page.de.yaml` together for each translated page. Unsuffixed files hold English copy. Files with the `.de` suffix hold German copy. Match translated section numbers and base filenames. Start sections with H2. The hero or page supplies H1.
- When editing navigation or footer copy, check the shared settings in `src/content/site.yaml` and the German overrides in `src/content/site.de.yaml`. Keep the language switcher in both navigation lists while it is part of the website. Verify links to the matching translation.
- Use documented components from `sproutsite/components`. Keep shared theme settings in `site.yaml` and local CSS in `src/styles/custom.css`. Use approved artwork and preserve its licenses and notices.
- Run `npm run check` and `npm run build` after edits. Check both languages in the preview. Publish only upon explicit request.
