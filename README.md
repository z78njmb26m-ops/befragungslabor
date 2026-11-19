# Befragungslabor

Ein freies Werkzeug für studentische Befragungen. Du baust deinen Fragebogen, überträgst ihn in Google Forms, Jotform oder Microsoft Forms, lädst danach den Antwort-Export und bekommst einen wissenschaftlich aufgebauten Ergebnisbericht mit Statistik, Typenbildung und Personas.

- **Eine einzige Datei:** `index.html` herunterladen und im Browser öffnen. Keine Installation, kein Konto, kein Server.
- **Datenschutz:** Alle Antworten bleiben auf deinem Rechner. Nichts wird hochgeladen.
- **Kostenlos und offen:** MIT-Lizenz. Nutzen, anpassen, weitergeben.

## Schnellstart

1. `index.html` herunterladen und mit Chrome, Firefox, Safari oder Edge öffnen.
2. Unter **Projekt** auf „Vorlage laden“ klicken, um ein vollständiges Beispiel zu sehen, oder mit „Leeres Projekt“ starten.
3. Unter **Daten** die Datei `beispiel/beispieldaten.csv` laden. Das sind erfundene Testdaten.
4. Unter **Auswertung** den fertigen Bericht ansehen.

## Ablauf für deine eigene Befragung

| Schritt | Was du tust |
|---|---|
| 1 Projekt | Titel, Zielgruppe und Forschungsfrage eintragen. Optional Hypothesen und Proto-Personas anlegen. |
| 2 Fragebogen | Fragen aus Bausteinen bauen (Einfach- und Mehrfachauswahl, Skala, Matrix, Kurz- und Freitext, Einverständnis). Eine Frage als **Zielvariable** markieren. Merkmale für Gruppenvergleiche und Typenbildung ankreuzen. Der Qualitäts-Check warnt vor typischen Fehlern. |
| Export | Den Fragebogen in dein Formular-Tool übertragen (siehe unten). **Fragetexte dabei nicht ändern**, sonst klappt die automatische Zuordnung nicht. |
| 3 Daten | Den Antwort-Export als Excel oder CSV laden. Spalten werden automatisch zugeordnet. Neue Exporte einfach erneut laden; doppelte Antworten werden erkannt. Testeinträge und einzelne Fälle lassen sich ausschließen. |
| 4 Auswertung | Bericht mit Methodik, Stichprobe, Deskriptivstatistik, Zusammenhängen, Hypothesen, abweichenden Fällen, Typen, qualitativer Analyse, Implikationen, Limitationen und Codebuch. Drucken oder als PDF speichern. |

### Fragebogen ins Formular-Tool bringen

- **Google Forms (automatisch):** Export „Google Forms automatisch erstellen“ kopieren, auf [script.google.com](https://script.google.com) ein neues Projekt anlegen, Code einfügen, Funktion `createForm` auswählen und ausführen. Den Link zum Formular zeigt das Ausführungsprotokoll.
- **Jotform:** Export „Prompt für den Jotform-KI-Baukasten“ kopieren und in Jotform unter „Formular erstellen → Mit KI erstellen“ einfügen. Danach prüfen, ob alle Fragen exakt übernommen wurden.
- **Microsoft Forms:** Text in ein Word-Dokument kopieren und in Forms über „Schnellimport“ hochladen.
- **Andere Tools:** Export „Als Text“.

### Antworten exportieren

- **Google Forms:** Antworten → „In Google Tabellen ansehen“ → Datei → Herunterladen → Microsoft Excel (.xlsx) oder CSV.
- **Jotform:** Tabellen → Herunterladen → Excel oder CSV.
- **Microsoft Forms:** Antworten → „In Excel öffnen“.

## KI-gestützte Auswertung

Für drei Schritte erzeugt das Labor einen fertigen Prompt: qualitative Inhaltsanalyse der offenen Antworten (nach Mayring), Personas je Typ (inklusive Abgleich mit euren Proto-Personas) sowie Problem Statements und How-Might-We-Fragen. Prompt kopieren, in Claude, ChatGPT oder eine andere KI einfügen, die Antwort zurückkopieren und übernehmen. Der Prompt enthält keine IDs oder Zeitstempel. Prüfe trotzdem, ob in offenen Antworten Namen stehen, und kläre mit deinen Dozierenden, welche KI-Dienste erlaubt sind.

## Verfahren

| Verfahren | Wofür | Lesehilfe |
|---|---|---|
| Wilson-Konfidenzintervall | Anteile (z. B. „42 % nennen diese Hürde“) | 95 %-Bereich für den wahren Anteil |
| t-Konfidenzintervall | Mittelwerte | 95 %-Bereich für den wahren Mittelwert |
| Spearman r<sub>s</sub> mit Fisher-z-KI | Zusammenhang mit der Zielvariable | ab 0,1 klein, 0,3 mittel, 0,5 groß |
| Mann-Whitney-U, Cliffs δ | Zwei Gruppen vergleichen | δ ab 0,15 klein, 0,33 mittel, 0,47 groß |
| Kruskal-Wallis-H, ε² | Drei oder mehr Gruppen vergleichen | ε² ab 0,01 klein, 0,08 mittel, 0,26 groß |
| Holm-Korrektur | Schutz vor Zufallstreffern bei vielen Tests | p (Holm) < 0,05 gilt als bedeutsam |
| Standardisierte Residuen | Abweichende Fälle finden | \|z\| > 1,5 |
| k-Means (k-means++, 30 Starts) mit Silhouette | Typenbildung, 2 bis 5 Typen | Silhouette > 0,5 deutlich, 0,25–0,5 schwach |

Alle Berechnungen sind in reinem JavaScript umgesetzt (`src/stats.js`) und laufen lokal. Die Typenbildung ist unabhängig von der Reihenfolge der Daten und damit reproduzierbar.

## Speichern und im Team arbeiten

Das Projekt wird automatisch im Browser gespeichert (localStorage). Mit „Projekt speichern“ bekommst du eine `.json`-Datei mit Fragebogen, Daten und KI-Ergebnissen. Teile sie mit deiner Gruppe, damit alle denselben Stand haben. Achtung: Diese Datei enthält die Antworten. Lade sie nicht öffentlich hoch.

## Offline nutzen

Für Excel-Dateien lädt das Labor die Bibliothek [SheetJS](https://sheetjs.com) von cdnjs. Ohne Internet funktionieren CSV-Dateien weiterhin.

## Entwicklung

Der Quellcode liegt in `src/`. Daraus baut `build.sh` die Einzeldatei:

```sh
./build.sh
```

| Datei | Inhalt |
|---|---|
| `src/head.html` | Gestaltung (CSS) |
| `src/body.html` | Aufbau der fünf Ansichten |
| `src/stats.js` | Statistik |
| `src/app1.js` | Projekt, Speicherung, Vorlage |
| `src/app2.js` | Fragebogen-Baukasten und Export |
| `src/app3.js` | Import und Spaltenzuordnung |
| `src/app4.js` | Analysen, Diagramme, Bericht, KI-Prompts |
| `src/app5.js` | Methodenseite und Start |

Verbesserungen sind willkommen: Issue anlegen oder Pull Request stellen.

## Beispieldaten

`beispiel/beispieldaten.csv` enthält 34 **erfundene** Antworten (eine davon als Testeintrag markiert) im Format eines Google-Forms-Exports. `beispiel/vorlage-zugehoerigkeit.json` ist die Vorlage als Projektdatei ohne Antworten.

## Lizenz

MIT, siehe [LICENSE](LICENSE).
