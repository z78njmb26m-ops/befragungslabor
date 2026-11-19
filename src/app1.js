/* =========================================================
   Befragungslabor · MIT-Lizenz
   Alles läuft lokal im Browser. Keine Daten verlassen den Rechner,
   außer du kopierst selbst einen KI-Prompt in ein Chat-Tool.
   ========================================================= */
const VERSION = "1.0.0";
const STORE = "befragungslabor-projekt";
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const norm = s => String(s ?? "").toLowerCase().normalize("NFC").replace(/[–—]/g,"-").replace(/\s+/g," ").trim();
const uid = () => Math.random().toString(36).slice(2,9);
const de = (x, d=2) => x == null || isNaN(x) ? "–" : x.toLocaleString("de-DE",{minimumFractionDigits:d, maximumFractionDigits:d});
const pct = (k, n, d=0) => n ? de(k/n*100, d) + " %" : "–";
const fp = p => p == null || isNaN(p) ? "–" : p < .001 ? "< 0,001" : de(p, 3);
const peq = (p, l="p") => p == null || isNaN(p) ? l+" = –" : p < .001 ? l+" < 0,001" : l+" = "+de(p, 3);
const ci = (a, d=2) => a && a[0]!=null ? `[${de(a[0],d)}; ${de(a[1],d)}]` : "–";
const ciP = a => a && a[0]!=null ? `[${de(a[0]*100,0)}; ${de(a[1]*100,0)}] %` : "–";
function hashStr(s){ let h1=0x811c9dc5, h2=0; for (let i=0;i<s.length;i++){ h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619)>>>0; h2 = (h2*31 + s.charCodeAt(i))>>>0; } return h1.toString(36)+h2.toString(36); }
const TYPES = {single:"Einfachauswahl", multi:"Mehrfachauswahl", scale:"Skala", matrix:"Matrix / Likert", short:"Kurztext", long:"Freitext", consent:"Einverständnis"};
const NONE_RX = /^(keine|keins|nichts|bisher eher nichts|nichts davon|keine davon|nein)\b/i;

/* ---------- Projekt ---------- */
function blankProject(){
  return { version: VERSION, meta:{title:"", author:"", course:"", audience:"", rq:""}, questions:[], hypotheses:[], protos:[],
    settings:{testVar:"", testVal:"TEST", target:""}, data:{rows:[], excluded:[], mapping:[], fileName:"", importedAt:null}, ai:{} };
}
let P = load() || blankProject();
function load(){ try{ const s = localStorage.getItem(STORE); return s ? migrate(JSON.parse(s)) : null; }catch(e){ return null; } }
function migrate(p){ const b = blankProject(); return {...b, ...p, meta:{...b.meta, ...(p.meta||{})}, settings:{...b.settings, ...(p.settings||{})}, data:{...b.data, ...(p.data||{})}, ai:p.ai||{}}; }
let saveT;
function save(){ clearTimeout(saveT); saveT = setTimeout(()=>{ try{ localStorage.setItem(STORE, JSON.stringify(P)); $("#saveInfo").textContent = "Gespeichert " + new Date().toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"}); }catch(e){ $("#saveInfo").textContent = "Speichern im Browser nicht möglich. Bitte „Projekt speichern“ nutzen."; } }, 300); }
async function download(name, text, type="application/json"){
  try{ if (window.claude && window.claude.use){ const dl = await window.claude.use("downloads"); if (dl){ await dl.save({filename:name, data:text}); return; } } }catch(e){ if (e && e.name!=="TypeError") return; }
  const a = $("#dl"); const url = URL.createObjectURL(new Blob([text], {type})); a.href = url; a.download = name; a.click(); setTimeout(()=>URL.revokeObjectURL(url), 2000); }
async function copy(text, okEl){ try{ await navigator.clipboard.writeText(text); if (okEl) okEl.textContent = "Kopiert."; return true; }catch(e){ if (okEl) okEl.textContent = "Kopieren nicht möglich. Text bitte markieren und manuell kopieren."; return false; } }

/* ---------- Vorlage ---------- */
function templateProject(){
  const p = blankProject();
  p.meta = {title:"Zugehörigkeit im ersten Semester", author:"Projektgruppe", course:"Design Thinking", audience:"Studierende im ersten Semester",
    rq:"Wie könnten wir neuen Studierenden helfen, im ersten Semester echte Beziehungen zu Kommiliton:innen aufzubauen, damit sie sich zugehörig fühlen und ihr Studium fortsetzen?"};
  const Q = (type, v, text, extra={}) => ({id:uid(), var:v, type, text, help:"", required:false, options:[], ordered:false, min:1, max:10, minLabel:"", maxLabel:"", rows:[], cols:[], roles:{target:false, group:false, cluster:false}, ...extra});
  const offers = ["Ersti-Woche / O-Woche","Ersti-Fahrt / Kennenlern-Tag","Tutorien","Mentoring-Programm","Buddy-Programm (international)","Hochschulsport","Fachschaft / AStA","Hochschulgruppen","Kurs-Gruppenchats","Partys / Events","Lernräume / Lerncafé","Campus-App / Online-Plattform","Keine davon"];
  p.questions = [
    Q("consent","consent","Einverständnis",{required:true, options:["Ich bin einverstanden, dass meine Antworten anonym für dieses Hochschulprojekt ausgewertet werden."]}),
    Q("single","sem","Im wievielten Semester bist du?",{options:["1.","2.","3.","4. oder höher"], ordered:true, roles:{group:false,cluster:false,target:false}}),
    Q("short","course","Was studierst du?"),
    Q("single","living","Wie wohnst du gerade?",{options:["allein","in einer WG","bei meinen Eltern","mit Partner:in","im Wohnheim"], roles:{group:true,cluster:false,target:false}}),
    Q("single","commute","Wie lange brauchst du zur Uni (einfacher Weg)?",{options:["unter 15 Min.","15–30 Min.","30–60 Min.","über 1 Stunde"], ordered:true, roles:{group:false,cluster:true,target:false}}),
    Q("single","job","Hast du einen Nebenjob?",{options:["nein","bis 10 Std. pro Woche","10–20 Std. pro Woche","mehr als 20 Std. pro Woche"], ordered:true, roles:{group:false,cluster:true,target:false}}),
    Q("single","newcity","Bist du fürs Studium in eine neue Stadt gezogen?",{options:["ja","nein"], roles:{group:true,cluster:false,target:false}}),
    Q("long","ice","Was war bisher dein schönster Moment im Studium?"),
    Q("single","firstweek","Wie hast du deine erste Woche an der Uni erlebt?",{options:["sehr schwierig","eher schwierig","gemischt","eher gut","richtig gut"], ordered:true, roles:{group:false,cluster:true,target:false}}),
    Q("long","firstweek_story","Welcher Moment aus deiner ersten Woche ist dir besonders hängen geblieben?"),
    Q("scale","belong","Wie sehr fühlst du dich mittlerweile integriert und angekommen?",{min:1,max:10,minLabel:"gar nicht",maxLabel:"voll und ganz", roles:{target:true,group:false,cluster:true}}),
    Q("long","belong_why","Woran merkst du, wie angekommen du dich fühlst?"),
    Q("multi","helpers","Was hat dir geholfen, Anschluss zu finden?",{options:["Ersti-Woche / O-Woche","Ersti-Fahrt","Gruppenarbeit / Projekt","Lerngruppe","Tutorium","Sitznachbar:in in der Vorlesung","Gruppenchat","Partys","WG / Wohnheim","Hochschulsport / Verein","Hochschulgruppe / Fachschaft","Buddy / Mentor:in","Kannte schon Leute","Fahrgemeinschaft","Social Media","Bisher eher nichts"]}),
    Q("long","helpers_story","Wie genau ist daraus ein Kontakt entstanden?"),
    Q("scale","introextro","Würdest du dich eher als introvertiert oder extrovertiert beschreiben?",{min:1,max:10,minLabel:"introvertiert",maxLabel:"extrovertiert", roles:{target:false,group:false,cluster:true}}),
    Q("multi","known","Welche Angebote deiner Uni zum Vernetzen kennst du?",{options:offers}),
    Q("multi","used","Welche dieser Angebote hast du selbst genutzt?",{options:offers, roles:{target:false,group:false,cluster:true}}),
    Q("single","alone","Wie oft fühlst du dich an der Uni allein oder fehl am Platz?",{options:["nie","selten","manchmal","oft"], ordered:true, roles:{target:false,group:false,cluster:true}}),
    Q("long","alone_story","Magst du von so einem Moment erzählen?"),
    Q("multi","barriers","Was macht es dir schwer, Leute kennenzulernen?",{options:["Lange Pendelzeit","Nebenjob","Große, anonyme Vorlesungen","Hemmung, Fremde anzusprechen","Gruppen haben sich schon gebildet","Kennenlern-Events sind meist Partys","Ich weiß nicht, wo was los ist","Gruppenchats, aber kein echter Kontakt","Sprache / neu in Deutschland","Online-Vorlesungen","Nichts davon, läuft gut"], roles:{target:false,group:false,cluster:true}}),
    Q("scale","quality","Was ist dir im Studium wichtiger?",{min:1,max:10,minLabel:"wenige enge Freund:innen",maxLabel:"viele Bekannte"}),
    Q("long","real_what","Was macht für dich einen echten Kontakt aus?"),
    Q("matrix","ideas","Würde dir das im ersten Semester helfen?",{rows:["Feste Lerngruppe ab Woche 1","Buddy aus einem höheren Semester","App, die nach Interessen und Stundenplan matcht","Lockere Treffen in den Pausen zwischen Vorlesungen","Kennenlernen über Aktivitäten wie Sport oder Kochen statt Partys"], cols:["eher nicht","vielleicht","auf jeden Fall"], ordered:true}),
    Q("long","ideas_why","Was müsste so ein Angebot haben, damit du es wirklich nutzt?"),
    Q("long","perfect","Wie sähe für dich die perfekte erste Woche an der Uni aus?"),
    Q("long","more","Gibt es noch etwas, das dir wichtig ist?"),
    Q("short","team","Eingetragen vom Team (Name)",{help:"nur für das Projektteam"})
  ];
  const hs = (t, opt) => ({id:uid(), kind:"share", text:t, q:"barriers", option:opt, threshold:0.25});
  p.hypotheses = [
    hs("Nach der Ersti-Woche wird der Anschluss schwer", "Gruppen haben sich schon gebildet"),
    hs("Große Vorlesungen wirken anonym", "Große, anonyme Vorlesungen"),
    hs("Gruppenchats ersetzen keinen echten Kontakt", "Gruppenchats, aber kein echter Kontakt"),
    hs("Pendeln verhindert Kontakte", "Lange Pendelzeit"),
    hs("Hemmungen, Fremde anzusprechen", "Hemmung, Fremde anzusprechen"),
    {id:uid(), kind:"corr", text:"Wer sich öfter allein fühlt, fühlt sich weniger zugehörig", a:"alone", b:"belong", dir:"neg"},
    {id:uid(), kind:"corr", text:"Extrovertierte fühlen sich zugehöriger", a:"introextro", b:"belong", dir:"pos"}
  ];
  p.protos = [
    {id:uid(), name:"Paris", text:"20, BWL, extrovertiert, pendelt über eine Stunde, viele Party-Bekanntschaften, kaum enge Freundschaften. Pains: verpasst spontane Treffen, oberflächliche Kontakte. Gains: wenige enge Freundschaften, Kontakte tagsüber."},
    {id:uid(), name:"Hilton", text:"19, introvertiert, sportlich, wohnt in der Nähe, kaum Kontakte, sitzt allein. Pains: Kennenlernformate sind Partys, Hemmung Fremde anzusprechen, Gruppen haben sich schon gebildet. Gains: feste Lerngruppe, Kontakte über Interessen."}
  ];
  p.settings = {testVar:"team", testVal:"TEST", target:"belong"};
  return p;
}

/* ---------- Navigation ---------- */
function show(view){
  $$(".view").forEach(v=>v.classList.toggle("on", v.id === "v-"+view));
  $$("nav.steps button").forEach(b=>b.toggleAttribute("aria-current", b.dataset.view === view) || (b.dataset.view===view && b.setAttribute("aria-current","page")));
  $$("nav.steps button").forEach(b=>{ if (b.dataset.view===view) b.setAttribute("aria-current","page"); else b.removeAttribute("aria-current"); });
  if (view==="project") renderProject();
  if (view==="builder") renderBuilder();
  if (view==="data") renderData();
  if (view==="report") renderReport();
  if (view==="help") renderHelp();
  try{ history.replaceState(null, "", "#"+view); }catch(e){}
  window.scrollTo({top:0});
}
$$("nav.steps button").forEach(b=>b.onclick = ()=>show(b.dataset.view));

/* ---------- 1 Projekt ---------- */
function varOptions(filter){ return P.questions.filter(filter).map(q=>`<option value="${esc(q.var)}">${esc(q.var)} · ${esc(q.text.slice(0,60))}</option>`).join(""); }
function renderProject(){
  $$("[data-p]").forEach(el=>{ el.value = P.meta[el.dataset.p] || ""; el.oninput = ()=>{ P.meta[el.dataset.p] = el.value; save(); }; });
  $("#projHint").textContent = `${P.questions.length} Fragen · ${P.hypotheses.length} Hypothesen · ${P.data.rows.length} importierte Fälle`;
  const choiceQs = P.questions.filter(q=>q.type==="single"||q.type==="multi");
  $("#hypList").innerHTML = P.hypotheses.length ? P.hypotheses.map((h,i)=>{
    if (h.kind==="share"){ const q = P.questions.find(x=>x.var===h.q); const opts = q ? q.options : [];
      return `<div class="qcard"><div class="top"><span class="nr">H${i+1}</span><span class="type">Anteil</span><div class="tools"><button class="btn small danger" type="button" data-hdel="${h.id}">Entfernen</button></div></div>
        <label class="f">Hypothese<input class="inp" data-h="${h.id}" data-k="text" value="${esc(h.text)}"></label>
        <div class="grid2"><label class="f">Frage<select data-h="${h.id}" data-k="q"><option value="">–</option>${choiceQs.map(q=>`<option value="${esc(q.var)}" ${q.var===h.q?"selected":""}>${esc(q.var)} · ${esc(q.text.slice(0,50))}</option>`).join("")}</select></label>
        <label class="f">Antwortoption<select data-h="${h.id}" data-k="option"><option value="">–</option>${opts.map(o=>`<option ${o===h.option?"selected":""}>${esc(o)}</option>`).join("")}</select></label>
        <label class="f">Relevanzschwelle (%)<input class="inp" type="number" min="1" max="99" data-h="${h.id}" data-k="threshold" value="${Math.round((h.threshold||.25)*100)}"></label></div>
        <span class="hint">Gestützt, wenn das 95 %-Konfidenzintervall des Anteils vollständig über der Schwelle liegt.</span></div>`; }
    const nv = numericVars();
    const sel = (k) => `<select data-h="${h.id}" data-k="${k}"><option value="">–</option>${nv.map(v=>`<option value="${esc(v.key)}" ${v.key===h[k]?"selected":""}>${esc(v.label.slice(0,70))}</option>`).join("")}</select>`;
    return `<div class="qcard"><div class="top"><span class="nr">H${i+1}</span><span class="type">Zusammenhang</span><div class="tools"><button class="btn small danger" type="button" data-hdel="${h.id}">Entfernen</button></div></div>
      <label class="f">Hypothese<input class="inp" data-h="${h.id}" data-k="text" value="${esc(h.text)}"></label>
      <div class="grid2"><label class="f">Variable A${sel("a")}</label><label class="f">Variable B${sel("b")}</label>
      <label class="f">Erwartete Richtung<select data-h="${h.id}" data-k="dir"><option value="pos" ${h.dir==="pos"?"selected":""}>positiv (je mehr A, desto mehr B)</option><option value="neg" ${h.dir==="neg"?"selected":""}>negativ (je mehr A, desto weniger B)</option></select></label></div>
      <span class="hint">Gestützt, wenn die Spearman-Korrelation in der erwarteten Richtung liegt und p &lt; 0,05.</span></div>`;
  }).join("") : `<p class="empty">Noch keine Hypothesen.</p>`;
  $$("[data-h]").forEach(el=>el.onchange = el.oninput = ()=>{ const h = P.hypotheses.find(x=>x.id===el.dataset.h); let v = el.value; if (el.dataset.k==="threshold") v = Math.max(1,Math.min(99,+v||25))/100; h[el.dataset.k] = v; if (el.dataset.k==="q"){ h.option = ""; renderProject(); } save(); });
  $$("[data-hdel]").forEach(b=>b.onclick = ()=>{ P.hypotheses = P.hypotheses.filter(h=>h.id!==b.dataset.hdel); save(); renderProject(); });
  $("#protoList").innerHTML = P.protos.map(p=>`<div class="qcard"><div class="grid2"><label class="f">Name<input class="inp" data-pr="${p.id}" data-k="name" value="${esc(p.name)}"></label></div><label class="f">Beschreibung (Steckbrief, Pains, Gains)<textarea data-pr="${p.id}" data-k="text">${esc(p.text)}</textarea></label><div class="row"><button class="btn small danger" type="button" data-prdel="${p.id}">Entfernen</button></div></div>`).join("") || `<p class="empty">Keine Proto-Personas.</p>`;
  $$("[data-pr]").forEach(el=>el.oninput = ()=>{ P.protos.find(x=>x.id===el.dataset.pr)[el.dataset.k] = el.value; save(); });
  $$("[data-prdel]").forEach(b=>b.onclick = ()=>{ P.protos = P.protos.filter(x=>x.id!==b.dataset.prdel); save(); renderProject(); });
}
$("#addHypShare").onclick = ()=>{ P.hypotheses.push({id:uid(), kind:"share", text:"", q:"", option:"", threshold:.25}); save(); renderProject(); };
$("#addHypCorr").onclick = ()=>{ P.hypotheses.push({id:uid(), kind:"corr", text:"", a:"", b:"", dir:"pos"}); save(); renderProject(); };
$("#addProto").onclick = ()=>{ P.protos.push({id:uid(), name:"", text:""}); save(); renderProject(); };
function confirmReplace(){ return !P.questions.length && !P.data.rows.length ? true : confirmBox("Das aktuelle Projekt wird ersetzt. Vorher mit „Projekt speichern“ sichern, falls du es noch brauchst. Fortfahren?"); }
function confirmBox(msg){ return window.confirm ? window.confirm(msg) : true; }
$("#newBlank").onclick = ()=>{ if (!confirmReplace()) return; P = blankProject(); save(); renderProject(); };
$("#newTemplate").onclick = ()=>{ if (!confirmReplace()) return; P = templateProject(); save(); renderProject(); };
$("#saveFile").onclick = ()=>{ const name = (P.meta.title || "befragung").replace(/[^\wäöüÄÖÜß-]+/g,"_").slice(0,50) + ".json"; download(name, JSON.stringify(P, null, 2)); };
$("#loadFile").onchange = async e=>{ const f = e.target.files[0]; if (!f) return; try{ const p = JSON.parse(await f.text()); if (!p.questions) throw 0; P = migrate(p); save(); renderProject(); $("#projHint").textContent = "Projekt geladen: " + f.name; }catch(err){ $("#projHint").textContent = "Die Datei ist keine gültige Projektdatei."; } e.target.value = ""; };
