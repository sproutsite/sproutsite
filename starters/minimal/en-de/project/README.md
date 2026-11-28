# Your bilingual website

English is the default language at `/`. The German version starts at `/de/`. Try the language switcher on the About page to move between `/about/` and `/de/ueber-uns/`.

```sh
npm install
npm run dev
```

If the dependencies are already installed, run `npm run dev`.

- Set the website name, production URL, and shared settings in `src/content/site.yaml`. Edit German navigation and footer copy in `src/content/site.de.yaml`. When changing a navigation list, include every link for that language and the language switcher.
- Edit both languages in the same page folder under `src/content/pages/`. Unsuffixed files are English. German page metadata, heroes, and sections use the `.de` suffix. Match section numbers and base filenames across languages. Translated pages can have different URL segments.
- Branding assets live in `public/branding/`. Change the hero and footer images via `hero.background-image` and `footer.background-image` in `src/content/site.yaml`. Preserve the supplied asset licenses and notices when redistributing them.
- Set colors and typography in `src/content/site.yaml`. Use `src/styles/custom.css` for CSS changes.
- Open the website folder in Codex or Claude Code. `AGENTS.md` and the page editing skill guide the agent through editing content and looking up Sproutsite documentation via MCP.

Before publishing, set your production URL in `src/content/site.yaml` and run `npm run check` and `npm run build`. Deploy the contents of `dist/`.

[Guide to multilingual websites](https://sproutsite.dev/documentation/getting-started/your-website/languages/)

## Enable site search

Set `search.enabled: true` in `src/content/site.yaml`. Run `npm run build` to generate `dist/pagefind/`, then start `npm run dev` or `npm run preview` and click the magnifying glass. Rebuild after changing searchable content and deploy the complete `dist/` directory. The dialog searches in the active language.

[Site search setup and hosting](https://sproutsite.dev/documentation/getting-started/your-website/search/)
