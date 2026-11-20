# Handoff: neutral assets for create-sproutsite

Sproutsite owns the canonical assets. The initializer has its own agent and
release process. Only this repository was changed for the asset-set task.
No npm publication, tag or Git push is implied. The current package version
number alone is not evidence that the new export is available on npm.

Send the following task to the agent in `create-sproutsite`:

```text
Bitte integriere die neutralen Starter-Dateien aus Sproutsite in create-sproutsite.
Bearbeite ausschließlich create-sproutsite; Sproutsite dient hier als Quelle.

Quelle im benachbarten Sproutsite-Projekt:
src/package/starter-assets/README.md
src/package/starter-assets/manifest.json
src/package/starter-assets/public/

Öffentlicher Paket-Einstieg: sproutsite/starter-assets
Dieser Export verweist auf manifest.json (schemaVersion: 1). Daneben liegt das
in publicDirectory angegebene Verzeichnis. Verwende diesen Vertrag statt
privater Theme-Pfade. Prüfe README und Manifest, bevor du die Kopierlogik anpasst.

1. Übernimm einen geprüften Stand in die mitgelieferten Generator-Vorlagen.
   Prüfe bei einer npm-Quelle Eigentümerschaft, verfügbare Version und Export.
   Die neu erstellten Dateien sind möglicherweise noch nicht veröffentlicht.
   Nutze bis dahin ein geprüftes lokales Archiv aus Sproutsite; behaupte nicht,
   dass eine ältere Registry-Version den Export bereits enthält. Erfinde keine
   Versionsnummer. Dokumentiere die verwendete Sproutsite-Version und die
   Manifest-Dateihashes. Halte die verwendete Website-Abhängigkeit kompatibel.

2. Kopiere den gesamten public/-Inhalt einschließlich LICENSE.txt und NOTICE.txt
   in den public/-Ordner der erzeugten Website. Im Generator bleiben diese
   Dateien Auslieferungskopien; die Quellen werden ausschließlich in Sproutsite
   gepflegt. Biete einen wiederholbaren Abgleich für Generator-Entwickler an.
   Beim Erstellen einer Website dürfen dafür weder GitHub-Dateien abgerufen
   noch zusätzliche Pakete installiert werden. --no-install muss funktionieren.

3. Aktuell liest die Vorlagenverarbeitung alle Dateien als UTF-8 und ersetzt
   darin Tokens. Kopiere statische Assets stattdessen bytegenau. Begrenze
   Token-Ersetzungen auf die vorgesehenen Textvorlagen. Erhalte die bisherigen
   Sicherheitsregeln für Zielverzeichnisse und überschreibe keine Nutzerdateien.

4. Übernimm manifest.branding in die bestehende site.yaml-Konfiguration.
   showName: true lässt den vom Nutzer gewählten Namen neben dem neutralen
   Symbol erscheinen. Verwende keine fest eingebrannte Sproutsite-Wortmarke.
   Setze den sharingImage.alt sinnvoll in der gewählten Sprache, gern mit dem
   eingegebenen Website-Namen. Beachte die bestehenden deutschen Metadaten- und
   Konfigurationspaare; keine widersprüchlichen Angaben oder doppelten YAML-Keys.

5. Binde das neutrale Hero-Beispiel über manifest.heroExample ein. Kopiere das
   Bild zusätzlich an contentDestination und übernimm die angegebenen
   Frontmatter-Werte. Astro erwartet für background-image ein relatives lokales
   Inhaltsbild, keine /images/-URL. Behalte die bisherigen Texte, Aktionen und
   Hero-Größen bei. Für die Sprachvarianten genügt dasselbe Bild.

6. Prüfe das gepackte Generator-Archiv: Alle Assets, Hinweise und Vorlagen
   enthalten; Hashes stimmen mit dem Sproutsite-Manifest überein. Teste EN/DE,
   --install und --no-install, eigene Website-Namen sowie / und /demo/.
   Kontrolliere check/build, Logo, Favicon, Manifest, absolute Sharing-URL,
   Hero-Bild, unveränderte Binärdateien und die erlaubten Zielpfade.

7. Aktualisiere README und Release-Anleitung. Beschreibe, wie Nutzer ihre
   Dateien unter public/branding/ und das lokale Hero-Bild ersetzen können.
   Sproutsite-Paketupdates dürfen diese Nutzerdateien nicht überschreiben.

Bitte eigenständig umsetzen und prüfen, aber nichts veröffentlichen, taggen,
committen oder pushen, solange ich das nicht ausdrücklich beauftrage.
Berichte über verwendete Quelle/Version, geänderte Dateien und Prüfungen.
```
