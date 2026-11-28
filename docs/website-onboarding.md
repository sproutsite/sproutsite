# Website onboarding documentation

The English and German quick starts share four steps followed by four groups of next-step cards. The following child pages are deliberately kept below `documentation/getting-started/your-website/`; translated URL segments are configured by their own `page.de.yaml`. Existing manual integration remains available. No framework APIs were added for this content change.

## Topic status

Status describes the documented workflow, not a guarantee that every possible variation is implemented. Partial and open topics have visible Alerts. Do not remove an open topic merely because its implementation is not available. Update its guide and status when a supported workflow is added.

| Source directory           | German URL segment           | Status    |
| -------------------------- | ---------------------------- | --------- |
| settings                   | einstellungen                | available |
| pages-and-sections         | seiten-und-abschnitte        | available |
| layouts-and-components     | layouts-und-bausteine        | available |
| images-and-files           | bilder-und-dateien           | available |
| blog                       | blog                         | available |
| languages                  | sprachen                     | partial   |
| hero                       | hero                         | partial   |
| typography                 | schriften                    | available |
| colors                     | farben                       | available |
| branding                   | markenauftritt               | available |
| theme-overrides            | theme-anpassen               | available |
| header-and-footer          | header-und-footer            | available |
| custom-theme               | eigenes-theme                | available |
| deployment                 | veroeffentlichen             | available |
| seo                        | auffindbarkeit               | available |
| contact-and-legal          | kontakt-und-betreiberangaben | available |
| checks-and-troubleshooting | pruefen-und-fehler-beheben   | available |
| updates-and-backups        | updates-und-sicherung        | partial   |
| coding-agents              | coding-agenten               | available |
| manual-setup               | manuell-einrichten           | available |
| custom-components          | eigene-bausteine             | open      |
| forms                      | formulare                    | open      |
| search                     | suche                        | available |

The language guide covers English or German as default, explicit `i18n` settings and inherited locale overrides. Further UI/content locales remain open; changing the default requires matching standard Astro route files.

The small-design-changes guide now covers the supported CSS entry (`createSproutsiteConfig({ styles: [...] })`). Header/Footer replacement is documented separately through `components`; typed descriptors support derived and independent themes. Importing website-owned components into content MDX remains open.

The published starter includes opt-in Pagefind search as of create-sproutsite 0.4.0. The guide covers activation, preview, deployment, and links to the retrofit steps for existing websites.

## Preserved detailed instructions

The original numbered quick-start sections were moved to the destinations below in both languages. Their original content was retained. These sections remain the detailed reference, while the entry page only covers a first successful edit. Existing page routes, including manual setup, remain unchanged.

| Previous section       | New section                                     |
| ---------------------- | ----------------------------------------------- |
| 01-before-you-start    | checks-and-troubleshooting/01-before-you-start  |
| 02-create-website      | checks-and-troubleshooting/02-generator-details |
| 03-start-agent         | coding-agents/01-start-agent                    |
| 04-edit-content        | pages-and-sections/01-edit-content              |
| 05-preview-and-publish | deployment/01-preview-and-publish               |

Illustrations and full prompts are recorded in [your-website-images.md](assets/your-website-images.md).
