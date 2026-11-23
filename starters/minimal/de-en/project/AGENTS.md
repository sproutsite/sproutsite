# Redaktionelle Regeln für diese Website

- Deutsch ist die Standardsprache unter `/`, Englisch liegt unter `/en/`. Schreibe in natürlichem Deutsch und verwende für englische Texte amerikanisches Englisch. Frage nach fehlenden Fakten, bevor du Angaben zur Website erfindest.
- Nutze für Seiten und Abschnitte `sproutsite-edit-page`. Schlage passende Anleitungen und Komponenten über `https://mcp.sproutsite.dev/mcp` nach. Sende nur öffentliche Suchbegriffe und Dokumentations-IDs. Ziehe die installierte Version heran, wenn sie vom Dokumentationsstand abweicht.
- Bearbeite Seiten unter `src/content/pages/`. Pro Seite liegen `page.yaml` und `page.de.yaml` im selben Ordner. Dateien ohne Sprachsuffix sind englisch, Dateien mit `.de` deutsch. Verwende für die Übersetzungen derselben Section identische Nummern und Grundnamen. Beginne Sections mit H2. Der Hero oder die Seite liefert die H1.
- Pflegst du Navigation oder Footer, prüfe `src/content/site.yaml` und die englischen Abweichungen in `src/content/site.en.yaml`. Behalte den Sprachwähler in beiden Navigationslisten bei, solange er zur Website gehört. Prüfe bei Änderungen auch die Links zur entsprechenden Sprachfassung.
- Verwende die dokumentierten Komponenten aus `sproutsite/components`. Gemeinsame Gestaltungseinstellungen gehören in `site.yaml`, lokales CSS in `src/styles/custom.css`. Verwende freigegebene Bilder und erhalte Lizenz- und Urheberhinweise.
- Prüfe Änderungen mit `npm run check` und `npm run build`. Kontrolliere in der Vorschau beide Sprachen. Veröffentliche erst auf ausdrücklichen Auftrag.
