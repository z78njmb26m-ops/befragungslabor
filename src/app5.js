/* ---------- Methoden ---------- */
function renderHelp(){
  $("#v-help").innerHTML = `<h2 class="vt">Methoden und Anleitung</h2>
  <p class="lead">Das Befragungslabor ist ein freies Werkzeug für studentische Befragungen: Fragebogen bauen, in ein Formular-Tool übertragen, Antworten importieren und wissenschaftlich auswerten. Es läuft vollständig in deinem Browser. Antworten werden nirgendwohin hochgeladen.</p>
  <div class="panel"><h3>So gehst du vor</h3><ol>
    <li><b>Projekt:</b> Titel, Zielgruppe und Forschungsfrage eintragen. Optional Hypothesen und Proto-Personas anlegen.</li>
    <li><b>Fragebogen:</b> Fragen aus Bausteinen bauen. Eine Frage als <i>Zielvariable</i> markieren (das, was erklärt werden soll, z. B. Zufriedenheit oder Zugehörigkeit). Merkmale für Gruppenvergleiche und Typenbildung ankreuzen. Der Qualitäts-Check zeigt typische Fehler.</li>
    <li><b>Export:</b> In Google Forms per Skript automatisch anlegen, in Jotform per KI-Baukasten oder in Microsoft Forms per Word-Import. Fragetexte dabei nicht ändern, sonst klappt die automatische Zuordnung nicht.</li>
    <li><b>Daten:</b> Den Antwort-Export (Excel oder CSV) laden. Bei Google Forms: Antworten → „In Google Tabellen ansehen“ → Datei → Herunterladen → .xlsx. Bei Jotform: Tabelle → Download → Excel. Bei Microsoft Forms: Antworten → „In Excel öffnen“. Später einfach die neue Datei erneut laden; doppelte Antworten werden erkannt.</li>
    <li><b>Auswertung:</b> Der Bericht entsteht automatisch. Für Kategorien, Personas und How-Might-We-Fragen den Prompt kopieren, in eine KI einfügen und die Antwort zurückkopieren.</li>
    <li><b>Sichern:</b> „Projekt speichern“ erzeugt eine .json-Datei mit Fragebogen, Daten und KI-Ergebnissen. Teile sie mit deiner Gruppe, damit alle denselben Stand haben.</li></ol></div>
  <div class="panel"><h3>Verfahren und Lesehilfen</h3><dl>
    <dt>95 %-Konfidenzintervall (KI)</dt><dd>Bereich, in dem der wahre Wert mit hoher Wahrscheinlichkeit liegt. Je kleiner die Stichprobe, desto breiter. Für Anteile nach Wilson, für Mittelwerte über die t-Verteilung.</dd>
    <dt>Spearman-Korrelation r<sub>s</sub></dt><dd>Zusammenhang zweier geordneter Merkmale von −1 bis +1, robust gegenüber Ausreißern und für Skalen geeignet. Ab |0,1| klein, |0,3| mittel, |0,5| groß (Cohen, 1988).</dd>
    <dt>p-Wert und Holm-Korrektur</dt><dd>p &lt; 0,05 bedeutet: Ein so deutliches Ergebnis wäre ohne echten Zusammenhang unwahrscheinlich. Wer viele Tests rechnet, findet zufällig Treffer. Die Holm-Korrektur gleicht das aus.</dd>
    <dt>Mann-Whitney-U und Cliffs δ</dt><dd>Vergleicht zwei Gruppen ohne Normalverteilungsannahme. δ ist die Effektstärke: ab 0,15 klein, 0,33 mittel, 0,47 groß (Romano et al., 2006).</dd>
    <dt>Kruskal-Wallis-H und ε²</dt><dd>Vergleich von drei oder mehr Gruppen. ε² ab 0,01 klein, 0,08 mittel, 0,26 groß (Tomczak &amp; Tomczak, 2014).</dd>
    <dt>Anteils-Hypothese</dt><dd>Gestützt, wenn das ganze Konfidenzintervall über der festgelegten Relevanzschwelle liegt; nicht gestützt, wenn es ganz darunter liegt; sonst nicht entscheidbar (mehr Daten nötig).</dd>
    <dt>Abweichende Fälle</dt><dd>Personen, deren Wert der Zielvariable stark vom Muster des stärksten Zusammenhangs abweicht (standardisiertes Residuum über 1,5). Sie lohnen ein Nachfragen im Interview.</dd>
    <dt>Clusteranalyse (k-Means)</dt><dd>Teilt die Befragten nach den ausgewählten Merkmalen in Typen. Die Zahl der Typen (2 bis 5) wird über den Silhouettenkoeffizienten gewählt: über 0,5 deutliche, 0,25 bis 0,5 schwache, darunter kaum Struktur (Kaufman &amp; Rousseeuw, 1990). Das Ergebnis ist unabhängig von der Reihenfolge der Daten.</dd>
    <dt>Qualitative Inhaltsanalyse</dt><dd>Offene Antworten werden induktiv zu Kategorien verdichtet (Mayring, 2015). Die KI liefert einen Vorschlag mit Definition und Ankerbeispiel; das Team prüft und überarbeitet ihn.</dd></dl></div>
  <div class="panel"><h3>Gute Fragen formulieren</h3><ul>
    <li>Offen nach Erlebnissen fragen („Erzähl von einem Moment, als …“) statt nach Meinungen.</li>
    <li>Keine Ja/Nein-Fragen ohne Warum-Nachfrage.</li>
    <li>Eine Frage, ein Gedanke. Keine Suggestivfragen.</li>
    <li>Skalen an beiden Enden beschriften. Geordnete Antworten von niedrig nach hoch sortieren.</li>
    <li>Höchstens zehn Minuten Bearbeitungszeit. Keine Namen oder E-Mail-Adressen erfragen.</li></ul></div>
  <div class="panel"><h3>Datenschutz</h3><p>Alle Daten bleiben in deinem Browser (localStorage) und in den Dateien, die du selbst speicherst. Für den Excel-Import wird die Bibliothek SheetJS von cdnjs geladen; CSV-Dateien funktionieren auch offline. In KI-Prompts gehen nur Antworten ohne IDs und Zeitstempel. Prüfe trotzdem, ob offene Antworten Namen enthalten, bevor du sie an eine KI gibst, und kläre mit deinen Dozierenden, welche KI-Dienste erlaubt sind.</p></div>
  <p class="hint">Befragungslabor ${VERSION} · MIT-Lizenz · Fehler gefunden? Im GitHub-Repository ein Issue anlegen.</p>`;
}

/* ---------- Start ---------- */
(function start(){
  const v = (location.hash||"").slice(1);
  show(["project","builder","data","report","help"].includes(v) ? v : (P.questions.length ? (P.data.rows.length ? "report" : "builder") : "project"));
  if (P.data.rows.length) $("#saveInfo").textContent = `${P.data.rows.length} Fälle geladen`;
})();
