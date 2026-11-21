# Generator handoff: local header and footer

Sproutsite prepares two replaceable layout slots after 0.5.27. Use the next
published version containing this feature. Existing starters without a
`components` option keep their current Header and Footer. The asset-copy
manifest is unchanged. The separate generator repository was not edited here.

## Task for the create-sproutsite agent

```text
Die nächste Sproutsite-Version unterstützt lokale Header-/Footer-Komponenten.
Bitte nach der Veröffentlichung auf die tatsächliche neue Version umstellen.
Version 0.5.27 enthält diesen Einstieg noch nicht.

1. Erzeuge src/components/Header.astro und src/components/Footer.astro als
   lokale, bearbeitbare Einstiege. Beide sollen zunächst an DefaultHeader
   beziehungsweise DefaultFooter aus 'sproutsite/components' delegieren.
   Die bisherige Gestaltung und das Verhalten bleiben so erhalten.

2. Verwende HeaderProps beziehungsweise FooterProps aus 'sproutsite' als
   Props-Typ. Die Komponenten erhalten die aufgelöste site-Konfiguration
   und die Inhaltsroute route ohne Sprachpräfix und Deployment-Basispfad.

3. Ergänze in der bestehenden astro.config.ts:
   components: {
       Header: './src/components/Header.astro',
       Footer: './src/components/Footer.astro',
   }
   styles und weitere Optionen beibehalten. components gehört nicht in
   site.yaml. Entfernen eines Eintrags stellt nur dessen Standard wieder her.

4. Dokumentiere: Nur Header und Footer sind ersetzbar. Keine allgemeine
   Theme-Vererbung und keine Registrierung beliebiger MDX-Komponenten
   versprechen. Für reine Stiländerungen bleibt styles zuständig.
   Interne #sproutsite/-Aliase nicht in Website-Komponenten importieren;
   zur Weiterverwendung immer DefaultHeader/DefaultFooter nehmen.

5. Prüfe den englischen und deutschen Starter mit check und build,
   Header-only, Footer-only und beiden Einträgen. Prüfe Sprachen,
   Unterseiten, mobile Navigation und Deployment-Basispfade im Browser.
   Bei eigener neuer HTML-Struktur liegt die mobile und zugängliche
   Bedienung beim Website-Team. Landing-Seiten lassen den Header weiterhin weg.

6. README und Changelog aktualisieren. Zunächst lokal umsetzen und prüfen;
   noch nichts veröffentlichen, taggen oder pushen.
```
