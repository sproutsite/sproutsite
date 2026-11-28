# Deine zweisprachige Website

Deutsch ist die Standardsprache unter `/`. Die englische Fassung liegt unter `/en/`. Die Beispielseite „Über uns“ zeigt, wie der Sprachwechsel zwischen `/ueber-uns/` und `/en/about/` funktioniert.

```sh
npm install
npm run dev
```

Falls die Abhängigkeiten bereits installiert sind, genügt `npm run dev`.

- Website-Name, Produktionsadresse und gemeinsame Einstellungen stehen in `src/content/site.yaml`. `site.en.yaml` enthält die englischen Beschriftungen und Footertexte. Wenn du eine Navigationsliste änderst, gib für diese Sprache alle gewünschten Einträge an, einschließlich der Sprachwahl.
- `src/content/pages/` enthält die Texte. Dateien ohne Sprachsuffix sind englisch. Die deutschen Metadaten, Heroes und Sections stehen im selben Ordner mit dem Suffix `.de`. Verwende für übersetzte Sections denselben Dateinamen und dieselbe Nummer. Die URL-Segmente dürfen je Sprache verschieden sein.
- Die neutralen Branding-Dateien liegen unter `public/branding/`. Erhalte die mitgelieferten Lizenzhinweise bei der Weitergabe.
- Farben und Typografie änderst du in `src/content/site.yaml`. Für CSS-Anpassungen kannst du `src/styles/custom.css` nutzen.
- Hero und Footer verwenden `/images/hero.jpg` und `/images/footer.webp`. Beide Bilder änderst du in `src/content/site.yaml` unter `hero.background-image` und `footer.background-image`.
- Öffne den Website-Ordner in Codex oder Claude Code. `AGENTS.md` und der Seiten-Skill zeigen, wie der Agent Inhalte bearbeitet und beim Sproutsite-MCP nachschlägt.

Setze vor der Veröffentlichung deine Domain in `src/content/site.yaml` und überprüfe beide Sprachfassungen mit `npm run check` und `npm run build`. Veröffentliche anschließend den Inhalt von `dist/`.

[Anleitung für mehrsprachige Websites](https://sproutsite.dev/de/dokumentation/einstieg/deine-website/sprachen/)

## Website-Suche aktivieren

Setze `search.enabled: true` in `src/content/site.yaml`. Führe `npm run build` aus, damit der Index in `dist/pagefind/` entsteht. Starte dann `npm run dev` oder `npm run preview` und klicke auf die Lupe. Erzeuge den Index nach Inhaltsänderungen neu und veröffentliche den vollständigen Ordner `dist/`. Der Dialog sucht in der gewählten Sprache.

[Anleitung zur Website-Suche und Veröffentlichung](https://sproutsite.dev/de/dokumentation/einstieg/deine-website/suche/)
