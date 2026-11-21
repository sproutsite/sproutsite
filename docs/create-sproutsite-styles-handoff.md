# Generator handoff: website-owned CSS

Sproutsite prepares a CSS entry after version 0.5.26. Update the generator
only after the release containing it is published. Existing generated websites
remain compatible without this option; no asset-manifest changes are required.

No files in the separate initializer repository were changed here.

## Task for the create-sproutsite agent

```text
Die neue Sproutsite-Version unterstützt eigene CSS-Dateien über
createSproutsiteConfig({ styles: [...] }). Bitte nach ihrer Veröffentlichung
den Generator auf die tatsächliche neue npm-Version aktualisieren.
Version 0.5.26 enthält diesen CSS-Einstieg noch nicht.

1. Erzeuge src/styles/custom.css im Website-Projekt, mit kurzen Hinweisen
   und einem auskommentierten Beispiel für .ss-card ohne CSS-Ebene.
   Der Starter soll zunächst seine bisherige Darstellung behalten.

2. Binde die Datei in der generierten astro.config.ts ein:
   createSproutsiteConfig({ styles: ['./src/styles/custom.css'] })
   Bestehende Optionen, Inhalte und Sprachen erhalten. Die Liste gehört
   nicht in site.yaml oder eine Sprachdatei.

3. Dokumentiere: Default-Theme zuerst, danach CSS-Dateien in Listenreihenfolge.
   Die normale Kaskade und Spezifität gelten weiterhin; @layer components
   kann gegen höhere DaisyUI-/Utility-Ebenen verlieren. Farb- und
   Typografie-Einstellungen bleiben in site.yaml. CSS-Dateien gehören
   der eigenen Website und werden bei Paketupdates nicht ersetzt.

4. Erkläre, dass Änderungen innerhalb der CSS-Dateien die normale
   Entwicklungsvorschau aktualisieren. Nach einer Änderung der Dateiliste
   den Dev-Server neu starten. Fehlende oder ungültige CSS-Pfade sind Fehler.

5. Prüfe den englischen und deutschen Starter mit check und build sowie
   eine echte CSS-Änderung im Browser. Dateien und URLs müssen auch bei
   einem Deployment unter einem Unterverzeichnis funktionieren.

6. Kein Austausch von Komponenten und keine Theme-Vererbung versprechen:
   Dieser Einstieg unterstützt CSS-Anpassungen am Default-Theme.

7. README und Changelog aktualisieren. Zunächst lokal umsetzen und prüfen;
   noch nichts veröffentlichen, taggen oder pushen.
```
