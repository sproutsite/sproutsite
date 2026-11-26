---
name: sproutsite-update-starter-docs
description: Bring Sproutsite's English and German starter documentation in sync with changes to the starter templates or the create-sproutsite generator. Use when generator commands, language routes, bundled files, or website settings have changed.
---

# Update Sproutsite starter documentation

1. Identify what changed and where it is available. Inspect `starters/minimal/`, the shared files under `src/package/starter-assets/public/`, and the relevant configuration or CLI implementation. Compare the local preview with the generator's pinned template source when the sibling checkout is available. If a claim depends on what `npm create sproutsite@latest` delivers, verify the public npm version and its behavior or documented options. A local template, Git tag, or successful dry run is insufficient evidence of npm availability.
2. Check the root README and the relevant pages under `src/content/pages/documentation/getting-started/`, including German counterparts. Update only the affected instructions. Distinguish commands for an editorial user's generated website from contributor commands such as `npm run dev:starter`. For bilingual instructions, verify the default language at `/`, the second language's prefix, and the configuration and content filenames for both directions.
3. Start with what the website owner edits. For branding, navigation, or background changes, show the existing settings and public file paths before explaining CSS or component overrides. Describe fallback or locale inheritance when it affects the example. Preserve established URLs and useful advanced instructions. Follow the language and content rules in `AGENTS.md`. Use the `sproutsite-edit-page` workflow for changes to site content.
4. Run content validation and, when feasible, the website build and format check. Inspect the changed pages in both locales and check example commands against the appropriate starter or generator. Report which flows were verified and whether any instructions describe local or upcoming behavior.

Maintain these docs in the Sproutsite repository. If the generator still needs a change, record the discrepancy for its maintainer.
