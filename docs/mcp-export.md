# Documentation export for sproutsite-mcp

Sproutsite owns the documentation, showcase and examples. The separate `sproutsite-mcp` project can consume a versioned snapshot to implement search and document/component retrieval. This repository exports data; it does not run an MCP server or publish an HTTP MCP endpoint.

## Build the snapshot

Use a checkout of Sproutsite containing this exporter, Node.js 24 or a newer supported LTS version, and the development dependencies:

```sh
npm ci
npm run export:mcp
```

The command validates the content contract, runs the separate native Astro configuration `astro.mcp.config.ts`, then verifies the artifact. Its static endpoints read the standard Astro Content Collections. They assemble pages with the same locale, section-order and canonical-URL helpers as the website. The export does not render website pages, need legal-identity `.env` values or execute MDX components. It does not change `dist/`.

The generated, ignored directory contains exactly:

```text
artifacts/mcp/
├── snapshot.json
├── schema.json
├── LICENSE
├── NOTICE
└── THIRD_PARTY_NOTICES.md
```

`snapshot.json` is a self-contained UTF-8 JSON bundle. `schema.json` is its generated JSON Schema. The three notice files are copied unchanged. Imported preview images, fonts, scripts, public branding assets and private configuration are not part of this artifact. The source package's npm allowlist also excludes the exporter and generated data; installing `sproutsite` alone does not provide this snapshot.

The ordinary `npm run build` still builds only the website. Exporting is an explicit repository command. Run website and export builds sequentially. You can test subpath handling with `SPROUTSITE_BASE=/demo/ npm run export:mcp`; restore the production configuration when preparing data for publication.

## Contract: schema version 1

The schema version describes the data format, independently of the Sproutsite package version and the separate MCP server version. Consumers must reject unsupported schema versions rather than guess how to interpret them.

| Top-level field            | Meaning                                                                     |
| -------------------------- | --------------------------------------------------------------------------- |
| `schemaVersion`            | Integer `1` for this contract                                               |
| `sproutsiteVersion`        | Matching package.json / VERSION value                                       |
| `source.repository`        | Repository URL from package metadata                                        |
| `source.commit`            | Git revision, or `null` when unavailable                                    |
| `source.dirty`             | Whether the checkout has local changes, or `null` when unavailable          |
| `source.license`           | Project license identifier, `Apache-2.0`; preserve the accompanying notices |
| `defaultLocale`, `locales` | Configured default language and enabled languages                           |
| `documents`                | All configured documentation and showcase pages                             |
| `components`               | Public runtime component exports and their documentation references         |

Only the `documentation/` and `showcase/` content trees are included. The current repository provides English and German. Blog posts, homepage copy, contact pages, legal notices and privacy pages are excluded. Disabled locales are excluded too. There are no automatically invented translations.

### Documents

A document's stable `id` combines its source directory identity and locale, for example `showcase/features:en`. `pageId` omits the locale. Changing a translated URL segment does not change these identities. `translations` contains reciprocal references to actual counterparts only.

Each document contains:

- `kind`, `locale`, `title`, `heading`, `description` and the absolute canonical `url`.
- Complete normalized `markdown` for retrieval and `searchText` for a local search index.
- Ordered `sections`: hero first, then numbered content sections. Each has its source identity, normalized Markdown, original import statements, native Markdown heading anchors, fenced examples, structured tables, alert/badge notices and any unresolved expressions.
- `sourceFiles` with repository-relative paths and SHA-256 hashes of the original files, including frontmatter.
- A `sha256` content identity and actual language counterparts.

Section `headings[].anchor` uses the website's filename prefix and GitHub-style heading slug. It refers to the original page, not a new exported route. Tables expose their exact header and cell text. Component parameter descriptions remain in those documented tables and Markdown; no undocumented parameter types or defaults are inferred.

`imports` are original reference statements, not executable modules in the bundle. Examples retain their original code and language. Referenced local images and files remain in the source repository and are not bundled as binaries. Examples are documentation, not complete generated website projects.

### Markdown normalization

The exporter uses remark's existing Markdown, GFM and MDX AST and `remark-stringify`; it does not introduce a Markdown parser or execute MDX.

- Top-level MDX imports are moved to `sections[].imports`.
- A Tabs group with a `Code` tab keeps that tab and omits the duplicate preview. Groups without a Code tab retain their content.
- Layout wrappers are removed while retaining headings, prose, links, lists and tables. Feature and accordion titles remain readable headings; links from Buttons remain links.
- Informative image alternative text is retained; decorative icons are omitted.
- Alerts and literal Card badges retain their text, including hover explanations, in Markdown and structured `notices`. A notice is not treated as an implementation-status declaration for an entire page or component.
- Dynamic body expressions are not evaluated. Their source is recorded in `unresolvedExpressions`; no runtime value is fabricated.
- Repeated fenced examples are deduplicated in a section's `examples` list. Their code is preserved. Code blocks in normalized Markdown remain reference text.
- Prose links become absolute URLs using the active language, production URL and base. Links and paths inside code examples stay unchanged.

### Component index

The index reads the actual runtime named exports of `src/package/components.ts` through the TypeScript AST; type-only exports are excluded. Each component has its exact `name`, `importPath` and document IDs by locale. Multiple components can share one guide, such as `Columns` and `Column`. `DefaultHeader` and `DefaultFooter` point to the website component-override guide. The export fails if a public component lacks a documentation mapping.

The small mapping in `tools/mcp-export/snapshot.ts` is navigation metadata, not a second component API definition. When a public component is introduced or its guide is moved, update that mapping and the documentation together.

### Integrity and provenance

`source.commit` identifies HEAD, not uncommitted edits. For release data, use a committed, clean checkout and check that `source.dirty` is `false`. Source archives without Git history explicitly export `null` provenance. There is no generated timestamp; identical inputs and provenance produce the same snapshot.

Source-file hashes cover the raw UTF-8 files. Example hashes cover `language + "\n" + code`. A document hash covers all document fields except `sha256`: recursively sort object keys, preserve array order, serialize compact JSON and hash its UTF-8 bytes with SHA-256. It is a content identifier, not a signature or proof that an artifact is trustworthy.

`scripts/verify-mcp-export.ts` checks the schema, complete page coverage, unique IDs, reciprocal translations, source/example/document hashes, all public component references and the artifact's exact file list. Unit fixtures also check locale/base behavior, preview removal, table/example preservation and nonexecution of expressions.

## Handoff to sproutsite-mcp

The MCP project should:

1. Obtain this artifact from a pinned, reviewed Sproutsite revision or a separately published release artifact. Do not depend on a changing `main` checkout or fetch HTML on every tool call.
2. Validate `snapshot.json` against `schema.json`, require supported `schemaVersion`, check the expected `sproutsiteVersion` and inspect provenance.
3. Build a local index over `searchText`; use `id` for document retrieval and `components[].documents` for component lookup.
4. Return selected documents or sections with their source URL, locale, Sproutsite version and relevant notices. Do not put the complete bundle into every model response. Keep open/partly available capability statements attached to their context.
5. Copy the five files into the Docker image, preserve the license/NOTICE information and serve them as read-only reference data. Never evaluate imports, snippets or unresolved expressions.

A local transfer archive can be created after reviewing the export:

```sh
tar -czf artifacts/sproutsite-mcp-data.tar.gz -C artifacts/mcp .
```

The current workflow does not upload an artifact, publish a container or configure `mcp.sproutsite.dev`. Deployment, the MCP transport, client setup, search implementation and optional support for multiple Sproutsite snapshots belong to the separate server project.
