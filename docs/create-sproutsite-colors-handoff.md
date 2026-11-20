# Generator handoff: website colours

The `colors` configuration is prepared in Sproutsite after 0.5.25. Use the
actual next published version when updating the initializer; do not assume
that the already published 0.5.25 contains this feature.

The separate generator owns its templates, documentation, tests and release.
No generator files were changed here. Existing starters remain compatible:
omitting `colors` retains the default palette. The starter asset manifest and
public asset copy contract are unchanged.

## Task for the create-sproutsite agent

```text
Die neue Sproutsite-Version unterstützt eine optionale globale Farbpalette.
Bitte nach ihrer npm-Veröffentlichung create-sproutsite darauf aktualisieren.
Verwende die tatsächlich veröffentlichte Version mit diesem Feature, nicht
pauschal die zuvor veröffentlichte 0.5.25.

1. Ergänze in der generierten site.yaml einen bearbeitbaren colors-Block mit
   passenden Standardwerten aus der neuen Sproutsite-Dokumentation:
   - surfaces: default, muted, border, text
   - primary und secondary: jeweils color und content
   - brand: background, backgroundEnd, gradient, content, highlight, accent
   Die Rollen accent, neutral, info, success, warning und error unterstützen
   ebenfalls color/content; ohne Angaben gelten die Theme-Standards.

2. Erhalte den englischen und deutschen Starter. Sprachdateien erben die
   Basiswerte; dupliziere dort keine gemeinsame Palette. Opaque Hex-Werte
   (#RGB oder #RRGGBB) müssen in YAML als Strings geschrieben werden.

3. Dokumentiere den Einstieg mit einer einzelnen Primärfarbenänderung und
   den Kontrastprüfungen. Die Prüfungen decken bekannte Farbpaare ab, keine
   vollständige Barrierefreiheit aller Zustände und Bildüberlagerungen.

4. SVG-Wellen, Logos und Bilder behalten ihre eigenen Farben. Weise Nutzer
   darauf hin, diese nach einer Palettenänderung bei Bedarf selbst zu ändern
   oder auszutauschen. Keine automatische Umfärbung oder neue Asset-Pfade
   erfinden. Der Starter-Asset-Vertrag wurde für dieses Feature nicht geändert.

5. Prüfe beide Starter mit check und build, eine eigene Primärfarbe, geerbte
   Werte und die unveränderte Darstellung bei fehlendem colors-Block.
   Kontrolliere auch mobile Navigation, Footer und Hero. Ein unzureichender
   geprüfter Kontrast muss mit einer verständlichen Meldung fehlschlagen.

6. README und Changelog aktualisieren. Zunächst lokal umsetzen und prüfen;
   noch nichts veröffentlichen, taggen oder pushen.
```
