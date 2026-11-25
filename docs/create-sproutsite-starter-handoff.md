# Handoff: neutral assets for create-sproutsite

## Import the shared hero and footer backgrounds

Use this handoff for the next update of the existing pinned starter importer.

```text
Importiere einen geprüften Sproutsite-Commit mit den neuen Starter-Wellen über
den bestehenden starter:import-Prozess. Verwende eine Sproutsite-Abhängigkeit,
die footer.background-image unterstützt. Prüfe die Version vor der Freigabe.

- Übernimm die kanonischen Vorlagen unter starters/minimal/ und kopiere
  public/ aus dem Starter-Asset-Manifest bytegenau inklusive der Lizenzhinweise.
- Übernimm src/styles/backgrounds.css aus der gemeinsamen Vorlage sowie die
  Registrierung vor src/styles/custom.css in astro.config.ts.
- Übernimm hero.background-image: /images/hero.jpg und
  footer.background-image: /images/footer.webp aus der jeweiligen site.yaml.
  Die Startseiten-Heros erben die globale Einstellung. Kopiere das Hero-Bild
  für diese Vorlagen nicht zusätzlich über das optionale heroExample-Rezept.
- Prüfe EN, DE, EN mit Deutsch unter /de/ und DE mit Englisch unter /en/.
  Prüfe im gepackten Generator die Vorlagen samt --no-install, die Hashes
  beider Bilder und ihre URLs im HTML für / und /demo/. Beim Erstellen
  einer Website werden die Assets aus dem Generator-Archiv kopiert.
- Übernimm das neutrale Dokument-Icon aus public/branding/ mit den erzeugten
  Browser- und App-Icons. Beide Sprachen verwenden dieselbe Logodatei auf
  hellem und dunklem Grund. Der Website-Name stammt weiterhin aus site.yaml.
```

## Original handoff for generators predating the pinned importer

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
   Frontmatter-Werte. Dieses Rezept nutzt ein relatives lokales
   Inhaltsbild für Astros Bildoptimierung. Alternativ kann das inzwischen
   unterstützte globale hero.background-image auf /images/hero.jpg zeigen;
   diese öffentliche Datei wird unverändert ausgeliefert. Behalte die bisherigen Texte, Aktionen und
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
