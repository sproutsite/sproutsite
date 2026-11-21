# Generator handoff: local and inherited themes

Use the next published Sproutsite version containing the theme API. Version
0.5.28 does not include this capability. Nothing was published as part of this
implementation, and the separate generator repository was not edited.

This extends the previous CSS and Header/Footer handoffs. Their existing
options remain supported; the starter-assets manifest and copy layout do not
change.

## Task for the create-sproutsite agent

```text
Sproutsite unterstützt jetzt lokale Themes mit optionaler Vererbung.
Bitte nach der Veröffentlichung die tatsächliche neue Paketversion prüfen
und für die Starter verwenden. Noch nichts veröffentlichen, taggen oder pushen.

1. Erzeuge src/themes/website/theme.ts:

   import { defaultTheme, type SproutsiteTheme } from 'sproutsite/themes';

   export default {
       name: 'website',
       extends: defaultTheme,
       components: {
           Header: new URL('../../components/Header.astro', import.meta.url),
           Footer: new URL('../../components/Footer.astro', import.meta.url),
       },
   } satisfies SproutsiteTheme;

2. Importiere diesen Deskriptor in astro.config.ts und übergib ihn als theme
   an createSproutsiteConfig. Bestehende lokale Header-/Footer-Dateien und
   styles, Sprachrouten, Konfiguration und neutrale Starter-Assets erhalten.
   Bisherige components.Header/Footer-Pfade in den Theme-Deskriptor verschieben,
   damit diese dort bearbeitet werden können. Die Option components bleibt
   verfügbar, wird im Starter aber nicht zusätzlich für dieselben Slots gesetzt.
   Falls lokale Header-/Footer-Dateien noch fehlen, zunächst die Delegation an
   DefaultHeader/DefaultFooter wie im vorherigen Handoff anlegen. Die Darstellung
   bleibt unverändert. Keine Framework- oder Default-Theme-Dateien kopieren.

3. Dokumentiere die drei Wege: eigenes CSS, ein abgeleitetes Theme mit
   einzelnen Komponenten-Overrides, ein unabhängiges Theme ohne extends.
   Theme-Auswahl gehört in astro.config.ts, nicht in site.yaml.
   Die Theme-Datei verwendet lokale new URL(..., import.meta.url)-Angaben
   für .css- und .astro-Dateien. Vor der Auswahl müssen diese existieren.

4. Prioritäten: Basis-CSS, abgeleitete CSS-Dateien, Website-styles.
   Website-components.Header/Footer haben Vorrang vor Theme-Komponenten.
   Einzelne Theme-Komponenten werden ersetzt, alle anderen geerbt.
   Ohne extends gibt es keine impliziten Default-Styles oder Komponenten.
   Ein unabhängiges Theme muss sämtliche dokumentierten Slots bereitstellen;
   ausdrückliche Wiederverwendung per defaultTheme.components ist möglich.

5. Für Props ThemeProps<'Header'> und entsprechende Namen aus
   sproutsite/themes verwenden. Für explizite Delegation an mitgelieferte
   Implementierungen sproutsite/default-components verwenden. Nie den
   ausgewählten Ersatz in sich selbst importieren. Die bisherigen
   DefaultHeader/DefaultFooter-Exporte funktionieren weiterhin.

6. Änderungen an Deskriptor, Pfaden oder CSS-Liste erfordern einen Neustart.
   Änderungen an ausgewählten Astro-/CSS-Dateien nutzen Astro/Vite-HMR.
   Keine Registrierung beliebiger neuer MDX-Namen versprechen: Das ist
   weiterhin ein eigener offener Punkt. Bestehende dokumentierte Komponenten
   lassen sich dagegen ersetzen, auch innerhalb geerbter Bausteine.

7. Englische und deutsche Starter mit check und build testen. Ableitung,
   Header/Footer-Overrides, CSS-Reihenfolge, Sprachpfade, /demo/-Basispfad,
   Blog, Fehlervorschauen und unveränderte neutrale Assets prüfen.
   README, redaktionelle AGENTS.md und Changelog aktualisieren.
```

Reference: `/documentation/getting-started/your-website/custom-theme/` and
`/de/dokumentation/einstieg/deine-website/eigenes-theme/` after deployment.
