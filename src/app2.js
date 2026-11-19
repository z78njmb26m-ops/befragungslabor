/* ---------- 2 Fragebogen ---------- */
function newQuestion(type){
  const n = P.questions.length + 1;
  const q = {id:uid(), var:"f"+n, type, text:"", help:"", required:false, options:[], ordered:false, min:1, max:10, minLabel:"", maxLabel:"", rows:[], cols:[], roles:{target:false, group:false, cluster:false}};
  if (type==="single") { q.options = ["Option 1","Option 2"]; q.roles.group = true; }
  if (type==="multi") { q.options = ["Option 1","Option 2"]; q.roles.cluster = true; }
  if (type==="scale") { q.roles.cluster = true; if (!P.questions.some(x=>x.roles&&x.roles.target)) q.roles.target = true; }
  if (type==="matrix") { q.rows = ["Aussage 1","Aussage 2"]; q.cols = ["stimme nicht zu","teils","stimme zu"]; q.ordered = true; }
  if (type==="consent") { q.var = "consent"; q.text = "Einverständnis"; q.required = true; q.options = ["Ich bin einverstanden, dass meine Antworten anonym für dieses Projekt ausgewertet werden."]; }
  return q;
}
const lines = s => String(s||"").split("\n").map(x=>x.trim()).filter(Boolean);
function qWarnings(q){
  const w = [], t = norm(q.text);
  if (!q.text.trim()) w.push("Fragetext fehlt.");
  if (/^(findest|fühlst|magst|würdest|gefällt|glaubst|denkst|hältst|bist du zufrieden) /.test(t) && q.type==="single" && q.options.length===2 && q.options.every(o=>/^(ja|nein)$/i.test(o))) w.push("Ja/Nein-Frage: Ergänze eine offene Warum-Frage oder nutze eine Skala.");
  if ((q.type==="single"||q.type==="multi") && q.options.length < 2) w.push("Mindestens zwei Antwortoptionen anlegen.");
  if (q.type==="scale" && (q.max - q.min < 2)) w.push("Die Skala sollte mindestens drei Stufen haben.");
  if (q.type==="scale" && (!q.minLabel || !q.maxLabel)) w.push("Beschrifte beide Enden der Skala.");
  if (q.text.length > 160) w.push("Sehr lange Frage. Kürzer formulieren.");
  if (/\b(und|oder)\b.*\?/.test(t) && q.type!=="long" && q.type!=="short" && t.split(/\bund\b/).length>2) w.push("Möglicherweise zwei Fragen in einer (doppelter Stimulus).");
  if (/\b(nicht wahr|oder\?|sicher auch|bestimmt)\b/.test(t)) w.push("Suggestive Formulierung vermeiden.");
  if (P.questions.filter(x=>x.var===q.var).length > 1) w.push("Variablenname ist doppelt vergeben.");
  return w;
}
function durationSec(){ return P.questions.reduce((s,q)=> s + ({consent:6, single:9, multi:14, scale:7, matrix:6*Math.max(1,q.rows.length), short:15, long:40}[q.type]||10), 0); }
function renderBuilder(){
  $("#qList").innerHTML = P.questions.length ? P.questions.map((q,i)=>{
    const w = qWarnings(q);
    let specific = "";
    if (q.type==="single"||q.type==="multi"||q.type==="consent") specific += `<label class="f">Antwortoptionen (eine pro Zeile)<textarea data-q="${q.id}" data-k="options" rows="${Math.min(10,Math.max(2,q.options.length))}">${esc(q.options.join("\n"))}</textarea></label>`;
    if (q.type==="single") specific += `<label class="hint" style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-q="${q.id}" data-k="ordered" ${q.ordered?"checked":""}> Antworten haben eine Reihenfolge (ordinal, z. B. „nie“ bis „oft“). Dann von niedrig nach hoch sortieren.</label>`;
    if (q.type==="scale") specific += `<div class="grid2"><label class="f">Von<input class="inp" type="number" data-q="${q.id}" data-k="min" value="${q.min}"></label><label class="f">Bis<input class="inp" type="number" data-q="${q.id}" data-k="max" value="${q.max}"></label><label class="f">Beschriftung unten<input class="inp" data-q="${q.id}" data-k="minLabel" value="${esc(q.minLabel)}"></label><label class="f">Beschriftung oben<input class="inp" data-q="${q.id}" data-k="maxLabel" value="${esc(q.maxLabel)}"></label></div>`;
    if (q.type==="matrix") specific += `<div class="grid2"><label class="f">Zeilen (Aussagen, eine pro Zeile)<textarea data-q="${q.id}" data-k="rows">${esc(q.rows.join("\n"))}</textarea></label><label class="f">Spalten (Antwortstufen von niedrig nach hoch)<textarea data-q="${q.id}" data-k="cols">${esc(q.cols.join("\n"))}</textarea></label></div>`;
    const numeric = q.type==="scale" || (q.type==="single"&&q.ordered);
    const roles = (q.type==="short"||q.type==="long"||q.type==="consent") ? "" : `<div class="roles">
      ${numeric?`<label><input type="checkbox" data-role="${q.id}" data-r="target" ${q.roles.target?"checked":""}> Zielvariable</label>`:""}
      ${q.type==="single"?`<label><input type="checkbox" data-role="${q.id}" data-r="group" ${q.roles.group?"checked":""}> Gruppen vergleichen</label>`:""}
      ${(numeric||q.type==="multi")?`<label><input type="checkbox" data-role="${q.id}" data-r="cluster" ${q.roles.cluster?"checked":""}> Für Typenbildung nutzen</label>`:""}</div>`;
    return `<div class="qcard"><div class="top"><span class="nr">${i+1}</span><span class="type">${TYPES[q.type]}</span>
      <div class="tools"><button class="btn small" type="button" data-mv="${q.id}" data-d="-1" aria-label="Nach oben">↑</button><button class="btn small" type="button" data-mv="${q.id}" data-d="1" aria-label="Nach unten">↓</button><button class="btn small" type="button" data-dup="${q.id}">Duplizieren</button><button class="btn small danger" type="button" data-del="${q.id}">Löschen</button></div></div>
      <div class="grid2" style="grid-template-columns:minmax(0,3fr) minmax(120px,1fr)"><label class="f">Fragetext<input class="inp" data-q="${q.id}" data-k="text" value="${esc(q.text)}" placeholder="Wie …?"></label><label class="f">Variablenname<input class="inp mono" data-q="${q.id}" data-k="var" value="${esc(q.var)}"></label></div>
      <label class="f">Hinweis unter der Frage (optional)<input class="inp" data-q="${q.id}" data-k="help" value="${esc(q.help)}"></label>
      ${specific}
      <div class="row" style="justify-content:space-between"><label class="hint" style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-q="${q.id}" data-k="required" ${q.required?"checked":""}> Pflichtfrage</label>${roles}</div>
      ${w.length?`<div class="warn">${w.map(esc).join(" · ")}</div>`:""}</div>`;
  }).join("") : `<div class="panel"><p class="empty">Noch keine Fragen. Füge rechts eine Frage hinzu oder lade unter „Projekt“ die Vorlage.</p></div>`;
  $$("[data-q]").forEach(el=>{ const ev = el.type==="checkbox" ? "onchange" : "oninput"; el[ev] = ()=>{ const q = P.questions.find(x=>x.id===el.dataset.q), k = el.dataset.k;
    if (el.type==="checkbox") q[k] = el.checked; else if (["options","rows","cols"].includes(k)) q[k] = lines(el.value); else if (k==="min"||k==="max") q[k] = parseInt(el.value)||0; else if (k==="var") q.var = el.value.replace(/[^\w.-]/g,"_"); else q[k] = el.value;
    save(); renderChecklist(); if (el.type==="checkbox") renderBuilder(); }; el.onblur = ()=>renderBuilder(); });
  $$("[data-role]").forEach(el=>el.onchange = ()=>{ const q = P.questions.find(x=>x.id===el.dataset.role); if (el.dataset.r==="target" && el.checked) P.questions.forEach(x=>x.roles.target=false); q.roles[el.dataset.r] = el.checked; if (el.dataset.r==="target") P.settings.target = el.checked ? q.var : ""; save(); renderBuilder(); });
  $$("[data-mv]").forEach(b=>b.onclick = ()=>{ const i = P.questions.findIndex(x=>x.id===b.dataset.mv), j = i + (+b.dataset.d); if (j<0||j>=P.questions.length) return; [P.questions[i],P.questions[j]] = [P.questions[j],P.questions[i]]; save(); renderBuilder(); });
  $$("[data-dup]").forEach(b=>b.onclick = ()=>{ const i = P.questions.findIndex(x=>x.id===b.dataset.dup); const c = JSON.parse(JSON.stringify(P.questions[i])); c.id = uid(); c.var += "_2"; c.roles.target = false; P.questions.splice(i+1,0,c); save(); renderBuilder(); });
  $$("[data-del]").forEach(b=>b.onclick = ()=>{ P.questions = P.questions.filter(x=>x.id!==b.dataset.del); save(); renderBuilder(); });
  renderChecklist();
}
$$("[data-add]").forEach(b=>b.onclick = ()=>{ P.questions.push(newQuestion(b.dataset.add)); save(); renderBuilder(); setTimeout(()=>{ const c = $$(".qcard"); const last = c[c.length-1]; if (last){ last.scrollIntoView({behavior:"smooth", block:"center"}); const inp = last.querySelector('[data-k="text"]'); if (inp) inp.focus(); } }, 50); });
function renderChecklist(){
  const qs = P.questions, min = Math.round(durationSec()/60);
  const items = [
    [qs.some(q=>q.type==="consent"), "Einverständnis am Anfang abfragen"],
    [qs.some(q=>q.roles&&q.roles.target), "Eine Zielvariable festlegen (Skala oder geordnete Auswahl)"],
    [qs.some(q=>q.type==="long"), "Offene Fragen für Geschichten und Begründungen (Warum?)"],
    [qs.filter(q=>q.type==="long").length <= 10, "Nicht mehr als zehn offene Fragen"],
    [min <= 10, `Geschätzte Dauer ca. ${min} Min. (Ziel: höchstens 10)`],
    [qs.every(q=>!qWarnings(q).length), "Keine Hinweise bei einzelnen Fragen"],
    [!qs.some(q=>/^(name|e-?mail|telefon|adresse)/i.test(q.text)), "Keine personenbezogenen Daten wie Name oder E-Mail"],
    [qs.some(q=>q.roles&&q.roles.cluster), "Merkmale für die Typenbildung ausgewählt"]
  ];
  $("#qCheck").innerHTML = items.map(([ok,t])=>`<li class="${ok?"good":"bad"}">${ok?"✓":"!"} ${esc(t)}</li>`).join("");
}

/* ---------- Export des Fragebogens ---------- */
function exportText(){
  const L = [`${P.meta.title||"Befragung"}`, "", P.meta.rq ? `Hintergrund: ${P.meta.rq}` : "", ""];
  P.questions.forEach((q,i)=>{
    L.push(`${i+1}. ${q.text}${q.required?" *":""}   [${TYPES[q.type]}]`);
    if (q.help) L.push(`   Hinweis: ${q.help}`);
    if (q.type==="single"||q.type==="consent") q.options.forEach(o=>L.push(`   ( ) ${o}`));
    if (q.type==="multi") q.options.forEach(o=>L.push(`   [ ] ${o}`));
    if (q.type==="scale") L.push(`   Skala ${q.min} (${q.minLabel||"niedrig"}) bis ${q.max} (${q.maxLabel||"hoch"})`);
    if (q.type==="matrix"){ L.push(`   Spalten: ${q.cols.join(" | ")}`); q.rows.forEach(r=>L.push(`   - ${r}`)); }
    if (q.type==="short") L.push("   ______________________");
    if (q.type==="long") L.push("   ______________________________________________");
    L.push("");
  });
  L.push("* Pflichtfrage");
  return L.filter((x,i,a)=>!(x===""&&a[i-1]==="")).join("\n");
}
function exportGAS(){
  const data = P.questions.map(q=>({type:q.type, text:q.text, help:q.help, required:!!q.required, options:q.options, min:q.min, max:q.max, minLabel:q.minLabel, maxLabel:q.maxLabel, rows:q.rows, cols:q.cols}));
  return `// Befragungslabor: erstellt dein Formular in Google Forms.
// 1. script.google.com öffnen, „Neues Projekt“, diesen Code einfügen.
// 2. Oben „createForm“ auswählen und „Ausführen“ klicken, Zugriff erlauben.
// 3. Den Link zum Formular findest du im Ausführungsprotokoll.
const TITLE = ${JSON.stringify(P.meta.title || "Befragung")};
const DESCRIPTION = ${JSON.stringify(P.meta.rq ? "Hintergrund: " + P.meta.rq + "\n\nDie Teilnahme ist anonym und freiwillig." : "Die Teilnahme ist anonym und freiwillig.")};
const QUESTIONS = ${JSON.stringify(data, null, 1)};

function createForm(){
  const form = FormApp.create(TITLE);
  form.setDescription(DESCRIPTION);
  form.setProgressBar(true);
  QUESTIONS.forEach(function(q){
    var item;
    switch(q.type){
      case "consent": item = form.addCheckboxItem().setChoiceValues(q.options); break;
      case "single": item = form.addMultipleChoiceItem().setChoiceValues(q.options); break;
      case "multi": item = form.addCheckboxItem().setChoiceValues(q.options); break;
      case "scale": item = form.addScaleItem().setBounds(Math.max(0, Math.min(1, q.min)), Math.min(10, Math.max(3, q.max))).setLabels(q.minLabel || "", q.maxLabel || ""); break;
      case "matrix": item = form.addGridItem().setRows(q.rows).setColumns(q.cols); break;
      case "short": item = form.addTextItem(); break;
      default: item = form.addParagraphTextItem();
    }
    item.setTitle(q.text);
    if (q.help) item.setHelpText(q.help);
    if (q.required) item.setRequired(true);
  });
  Logger.log("Bearbeiten: " + form.getEditUrl());
  Logger.log("Teilen: " + form.getPublishedUrl());
}`;
}
function exportJotform(){
  return `Erstelle ein deutschsprachiges, anonymes Card Form (eine Frage pro Seite, Fortschrittsanzeige) mit dem Titel "${P.meta.title||"Befragung"}". Verwende exakt die folgenden Fragetexte und Antwortoptionen in dieser Reihenfolge, ohne Namen-, E-Mail- oder Kontaktfelder.${P.meta.rq?` Begrüßungstext: "Wir möchten herausfinden: ${P.meta.rq} Es gibt keine richtigen oder falschen Antworten, die Teilnahme ist anonym."`:""}

${P.questions.map((q,i)=>{
  const req = q.required ? " (Pflicht)" : " (optional)";
  if (q.type==="consent") return `${i+1}. Checkbox${req}: "${q.text}" mit der Option "${q.options[0]||""}"`;
  if (q.type==="single") return `${i+1}. Single choice${req}: "${q.text}" Optionen: ${q.options.join(" / ")}`;
  if (q.type==="multi") return `${i+1}. Multiple choice checkboxes${req}: "${q.text}" Optionen: ${q.options.join("; ")}`;
  if (q.type==="scale") return `${i+1}. Scale rating ${q.min} to ${q.max}${req}: "${q.text}" (${q.min} = ${q.minLabel}, ${q.max} = ${q.maxLabel})`;
  if (q.type==="matrix") return `${i+1}. Input table / matrix, one answer per row${req}: "${q.text}" Spalten: ${q.cols.join(" / ")}. Zeilen: ${q.rows.map(r=>`"${r}"`).join("; ")}`;
  if (q.type==="short") return `${i+1}. Short text${req}: "${q.text}"`;
  return `${i+1}. Long text${req}: "${q.text}"`;
}).join("\n")}

Danke-Seite: "Danke! Deine Antworten helfen uns sehr."`;
}
function exportMS(){
  return `So kommt der Fragebogen in Microsoft Forms:

1. Kopiere den Text unten in ein leeres Word-Dokument und speichere es.
2. Öffne forms.office.com, wähle „Schnellimport“ (Quick Import) und lade das Word-Dokument hoch.
3. Prüfe danach jede Frage: Fragetyp, Pflicht und Skalen werden nicht immer korrekt erkannt.
   Skalen als „Bewertung“ (Zahl) anlegen, Matrizen als „Likert“.
4. Unter „Einstellungen“ Namen und E-Mail NICHT erfassen, damit die Befragung anonym bleibt.

----------------------------------------
${exportText()}`;
}
$$("[data-export]").forEach(b=>b.onclick = ()=>{
  const k = b.dataset.export;
  const map = {
    text:["Als Text", "Für jedes Formular-Tool. Wichtig: Fragetexte beim Übertragen nicht ändern, sonst klappt die automatische Zuordnung beim Import nicht.", exportText()],
    gas:["Google Forms automatisch erstellen", "Öffne script.google.com, lege ein neues Projekt an, ersetze den Code durch diesen, wähle die Funktion „createForm“ und klicke auf „Ausführen“. Hinweis: Google erlaubt Skalen nur von 0 oder 1 bis 3–10.", exportGAS()],
    jotform:["Prompt für den Jotform-KI-Baukasten", "In Jotform „Formular erstellen“ → „Mit KI erstellen“ wählen und diesen Text einfügen. Danach prüfen, ob alle Fragen exakt übernommen wurden.", exportJotform()],
    msforms:["Microsoft Forms", "Microsoft Forms kann Word-Dokumente importieren.", exportMS()]
  }[k];
  $("#exportTitle").textContent = map[0]; $("#exportHelp").textContent = map[1]; $("#exportCode").textContent = map[2];
  $("#exportPanel").classList.remove("hidden"); $("#exportPanel").scrollIntoView({behavior:"smooth"});
});
$("#copyExport").onclick = ()=>copy($("#exportCode").textContent, $("#exportHelp"));
$("#closeExport").onclick = ()=>$("#exportPanel").classList.add("hidden");
