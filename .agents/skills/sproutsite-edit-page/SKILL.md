---
name: sproutsite-edit-page
description: Create, edit, rename, move, or remove Sproutsite website pages and sections. Use for editorial changes to Markdown, MDX, page metadata, heroes, images, or page layouts that use existing components.
---

# Edit Sproutsite pages

1. Identify the target page from its URL and inspect its local source, site settings, and localized counterparts. Follow the project's `AGENTS.md` and the conventions of adjacent pages.
2. Before editing, consult the read-only Sproutsite MCP server at `https://mcp.sproutsite.dev/mcp`. Use the three tools according to what you need:
    - Use `search_documentation` for the relevant content feature or layout pattern.
    - Use `get_document` for a guide or `get_component` for a named component. Start with `view: "summary"` and make a separate call with `sectionId` to read the relevant section. Use the target language when supported.
    - Send only public framework concepts, component names, or documentation IDs. Check the documented API against the installed package or local source when versions differ. If MCP is unavailable, consult the local documentation and mention the fallback.
3. Apply the operation in the project:
    - **Create:** Follow the neighboring page structure and the documented content contract. Check that the URL is unique. Add a navigation entry when the request calls for one.
    - **Edit:** Preserve the established page structure and URL unless the request calls for a change. Follow the local conventions for copy, heading levels, images, and translations.
    - **Rename or move:** Distinguish a title change from a URL change. For a URL change, check localized routes, descendants, navigation, internal links, and relative assets. Preserve existing URLs where the request permits it. If an old URL needs a redirect, follow the project's existing deployment conventions.
    - **Remove:** Confirm the intended page and scope from the request. Inspect child pages, locales, incoming links, and shared assets before deleting anything. Remove or update references within scope. Preserve child pages and shared assets unless their removal is expressly in scope.
4. Run the project's content validation and inspect the changed routes with the existing preview or build workflow. For moves and removals, verify affected links and the old route's expected status or redirect. Report the pages and locales changed and the checks performed.
