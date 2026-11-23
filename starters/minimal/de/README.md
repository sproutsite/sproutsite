# Deine Website

Diese Website verwendet das Standard-Theme von Sproutsite und einen deutschen Inhaltsstarter. Die deutsche Startseite liegt direkt unter `/`.

```sh
npm install
npm run dev
```

Wenn der Generator die Abhängigkeiten bereits installiert hat, entfällt `npm install`.

- `src/content/site.yaml`: vollständige Basiskonfiguration für Name, Produktionsadresse, `i18n`, Branding, Navigation und Footer. `site.de.yaml` enthält nur optionale Abweichungen und beginnt als leeres Objekt (`{}`). Objekte erben einzelne Felder, Listen ersetzen die bisherige Liste vollständig. Eine geänderte Footer-Beschreibung erhält die geerbten Links; für geänderte Navigationslinks muss die gesamte gewünschte Liste angegeben werden.
- `src/content/pages/page.yaml` und `page.de.yaml`: Titel und Beschreibung für die Startseite. Halte beide Metadaten-Dateien synchron.
- `src/content/pages/hero.de.md`: Einleitung und sichtbare H1.
- `src/content/pages/_assets/hero.jpg`: lokales Bild der Startseite, über `background-image: ./_assets/hero.jpg` eingebunden und von Astro optimiert. Ersetze diese Datei oder verwende ein anderes relatives Inhaltsbild. Öffentliche Bildpfade werden in Sproutsite 0.5.25 ebenfalls unterstützt. `classes: null` unterdrückt geerbte globale Klassen und erhält das kleine Hero-Layout.
- `public/branding/`: neutrales Logo, Favicon, App-Icons und Vorschaubild für geteilte Links. Ersetze die Dateien oder passe `branding` in `site.yaml` an; gezielte deutsche Abweichungen gehören in `site.de.yaml`. Mit `logo.showName: true` bleibt dein Website-Name neben dem Symbol sichtbar. Passe den Alternativtext des Vorschaubilds an dein eigenes Bild an.
- Nummerierte `.de.md`- und `.de.mdx`-Dateien: einzelne Inhaltsbereiche ab `01`.
- `AGENTS.md`: Regeln für die redaktionelle Arbeit mit einem externen Coding-Agenten.

Die `.de`-Dateien und die ergänzenden Basis-Metadaten folgen dem Sprachvertrag von Sproutsite. Es wird keine englische Website erzeugt. Bei einer neuen Seite lege einen Ordner mit `page.yaml`, `page.de.yaml`, optionalem `hero.de.md` und nummerierten deutschen Sections an. Ergänze bei Bedarf die Navigation in der Basiskonfiguration `site.yaml`; `site.de.yaml` bleibt Abweichungen vorbehalten. MDX kann dokumentierte Komponenten aus `sproutsite/components` verwenden.

Für diesen deutschen Starter unter `/` stehen `i18n.locale` und `i18n.defaultLocale` auf `de`, `i18n.locales` auf `[de]`. Externe Links werden über `links.external.newTab` und `links.external.icon` eingestellt. Globale Hero-Vorgaben stehen unter `hero.classes` und `hero.background-image`; als Hintergrund ist das vorhandene `/images/hero.jpg` eingetragen. Die Startseite verwendet weiterhin ihr relatives lokales Inhaltsbild und `classes: null`. Ein zusätzlicher SVG-Hintergrund wird nicht mitgeliefert. Blog-Einstellungen werden nicht erzeugt; bei einer späteren Ergänzung verwende `blog.hero.title`, `blog.hero.eyebrow`, `blog.hero.description` und `blog.articles.heading`.

Öffne das erzeugte Projekt in Codex oder Claude Code und bitte den Agenten, eine Seite anzulegen, zu bearbeiten, zu verschieben oder zu löschen. Beide nutzen dazu den mitgelieferten Skill `sproutsite-edit-page` und schlagen öffentliche Dokumentation beim Sproutsite-MCP nach. Claude Code kann beim ersten Zugriff um Freigabe des Projekt-MCP-Servers bitten. Projektinhalte bleiben lokal.

## Theme anpassen

Der Starter wählt `src/themes/website/theme.ts` in `astro.config.ts` aus. Für reine Stiländerungen nutze `src/styles/custom.css`. Ein Theme mit `extends: defaultTheme` kann einzelne Komponenten ersetzen. Ein eigenständiges Theme ohne `extends` liefert alle dokumentierten Slots und sein eigenes CSS. Über `defaultTheme.components` kannst du einzelne mitgelieferte Komponenten ausdrücklich übernehmen.

Verweise im Deskriptor mit `new URL('relativer/pfad', import.meta.url)` auf vorhandene lokale `.astro`- und `.css`-Dateien. Der Starter wählt seinen eigenen Header und Footer aus und erbt die übrigen Komponenten. Wenn du einen Eintrag entfernst, greift wieder die geerbte Komponente. `components.Header` und `components.Footer` in der Astro-Konfiguration haben Vorrang vor dem Theme. Landingpages lassen den Header weg. Die Theme-Auswahl steht in `astro.config.ts`, redaktionelle Einstellungen bleiben in `site.yaml`.

Verwende `ThemeProps<'Header'>` oder den Namen des jeweiligen Slots aus `sproutsite/themes`. Header und Footer erhalten die aufgelöste Konfiguration `site` und die Inhaltsroute `route` ohne Sprachpräfix und Deployment-Basis. Delegiere über `sproutsite/default-components` an die mitgelieferten Implementierungen, damit der aktive Ersatz sich nicht selbst aufruft. Die dokumentierten MDX-Komponenten lassen sich auch innerhalb geerbter Bausteine ersetzen. In MDX gelten weiterhin die dokumentierten Komponentennamen. Prüfe bei eigener HTML-Struktur die mobile Navigation, Tastaturbedienung und Fokusführung.

Starte den Dev-Server nach Änderungen am Deskriptor, an Pfaden oder an der CSS-Liste neu. Änderungen an ausgewählten Astro- und CSS-Dateien übernimmt Astro/Vite in der laufenden Vorschau.

## Darstellung mit CSS anpassen

Passe das Standard-Theme in `src/styles/custom.css` an. Das auskommentierte Card-Beispiel lässt die anfängliche Darstellung unverändert. Sproutsite lädt zuerst das CSS des Basis-Themes, dann das CSS des abgeleiteten Themes und schließlich die Dateien unter `styles` in `astro.config.ts` in Listenreihenfolge. Kaskade und Spezifität gelten weiterhin. Regeln in `@layer components` können gegen höhere DaisyUI- oder Utility-Ebenen verlieren. Farben und Typografie bleiben in `src/content/site.yaml`. Deine CSS-Dateien bleiben bei Paketupdates erhalten. Änderungen an eingebundenen Dateien aktualisieren die Entwicklungsvorschau. Starte den Dev-Server nach Änderungen an der Dateiliste neu. Fehlende oder ungültige CSS-Pfade führen zu einem Fehler.

```sh
npm run check
npm run build
npm run preview
```

Setze vor der Veröffentlichung die echte Produktionsadresse. Lade den gesamten `dist/`-Ordner hoch. Er enthält `sitemap.xml`, `404.html` und `500.html`; die Fehlerseiten müssen zusätzlich beim Hosting eingerichtet werden. Dieser Starter enthält keine Blogartikel. Blog-Routen und das Verhalten leerer Collections liefert die installierte Bibliothek.

Die Grafiken sind eigene Projektdateien und werden durch Sproutsite-Paketupdates nicht ersetzt. Die Startseite verwendet die lokale Inhaltskopie; `public/images/hero.jpg` liefert die globale Hero-Vorgabe. Ohne eigene Hintergrundangabe erbt eine Seite diese Vorgabe, `background-image: null` deaktiviert sie. Erhalte `public/LICENSE.txt` und `public/NOTICE.txt`, wenn du die mitgelieferten Apache-2.0-Grafiken weiterverbreitest. Sichtbare Namensnennung oder eine Sproutsite-Wortmarke sind nicht vorgeschrieben. Prüfe nach einem Austausch Darstellung, Kontraste und Link-Vorschauen.

Sproutsite bleibt eine installierte Abhängigkeit; das Theme wird nicht kopiert. Committe nach der Installation auch `package-lock.json`. Der Starter begrenzt Sproutsite-Updates auf die getestete `0.5.x`-Reihe. Prüfe Änderungen, bevor du darüber hinaus aktualisierst.

Das Website-Paket ist privat, um eine versehentliche npm-Veröffentlichung zu verhindern. Über die Lizenz deiner eigenen Inhalte entscheidest du selbst. Sproutsite und die ursprünglichen Startervorlagen stehen unter Apache-2.0; für die mitgelieferten Dateien liegen LICENSE-SPROUTSITE und NOTICE-SPROUTSITE bei. Lizenzen von Abhängigkeiten und Markenrechte bleiben getrennt.

[Dokumentation](https://sproutsite.dev/de/dokumentation/) · [Komponenten](https://sproutsite.dev/de/showcase/)
