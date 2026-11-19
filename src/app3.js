/* ---------- 3 Daten ---------- */
const ID_RX = /^(submission id|antwort-?id|response id|id|respondent id|antwortnummer)$/i;
const DATE_RX = /^(submission date|zeitstempel|timestamp|startzeit|start time|completion time|abschlusszeit|datum|date|erstellt am)$/i;
const qByVar = v => P.questions.find(q=>q.var===v);

// Spalte → Frage zuordnen (Fragetext steckt im Spaltenkopf)
function autoMap(header){
  const h = norm(header).replace(/[*:?]+$/,"").trim();
  if (ID_RX.test(h)) return "_id";
  if (DATE_RX.test(h)) return "_date";
  let best = null;
  for (const q of P.questions){
    const t = norm(q.text).replace(/[*:?]+$/,"").trim(); if (!t) continue;
    const hit = h === t || h.startsWith(t) || (t.length >= 10 && h.includes(t)) || (h.length >= 12 && t.startsWith(h));
    if (!hit) continue;
    let target = q.var;
    if (q.type==="matrix"){ const rest = h.replace(t,""); const ri = q.rows.map((r,i)=>({i, l:norm(r).length, hit: rest.includes(norm(r)) || rest.includes(norm(r).slice(0,20))})).filter(x=>x.hit).sort((a,b)=>b.l-a.l)[0]; if (ri) target = q.var + "::" + ri.i; }
    if (!best || t.length > best.len) best = {target, len:t.length};
  }
  return best ? best.target : "";
}
function str(v){ if (v == null) return ""; if (v instanceof Date) return v.toISOString().slice(0,16).replace("T"," "); return String(v).trim(); }
function matchOptions(s, options){
  let rest = " " + norm(s) + " "; const hits = [];
  [...options].sort((a,b)=>b.length-a.length).forEach(o=>{ const n = norm(o); if (n && rest.includes(n)){ hits.push(o); rest = rest.split(n).join(" | "); } });
  const leftover = rest.replace(/[|,;\n]+/g," ").replace(/\b(sonstiges|andere|other)\b:?/g,"").trim();
  return {hits: options.filter(o=>hits.includes(o)), other: leftover.length > 2 ? leftover : ""};
}
function matchCol(s, cols){ const n = norm(s); if (!n) return null; let i = cols.findIndex(c=>norm(c)===n); if (i>=0) return i; const c = cols.map((c,i)=>({i, l:c.length})).filter(x=>n.includes(norm(cols[x.i]))).sort((a,b)=>b.l-a.l)[0]; if (c) return c.i; const num = parseInt(n); return !isNaN(num) && num>=1 && num<=cols.length ? num-1 : null; }
function parseValue(q, raw, rowIdx){
  const s = str(raw); if (!s) return null;
  switch(q.type){
    case "scale": { const m = s.replace(",",".").match(/-?\d+(\.\d+)?/); return m ? +m[0] : null; }
    case "single": { const n = norm(s); const exact = q.options.find(o=>norm(o)===n); if (exact) return exact; const inc = q.options.filter(o=>n.includes(norm(o))).sort((a,b)=>b.length-a.length)[0]; return inc || s; }
    case "multi": { const m = matchOptions(s, q.options); return m.hits.length || m.other ? {hits:m.hits, other:m.other} : null; }
    case "consent": return true;
    case "matrix": {
      if (rowIdx != null){ const c = matchCol(s, q.cols); return c==null ? null : {[rowIdx]: c}; }
      const out = {}; const parts = s.split(/[\n;]+/);
      parts.forEach(p=>{ const np = norm(p); const ri = q.rows.map((r,i)=>({i,l:r.length})).filter(x=>np.includes(norm(q.rows[x.i]).slice(0,Math.min(24,norm(q.rows[x.i]).length)))).sort((a,b)=>b.l-a.l)[0]; if (!ri) return; const after = np.split(/[:=]|\s-\s/).slice(1).join(" ") || np.replace(norm(q.rows[ri.i]),""); const c = matchCol(after, q.cols); if (c!=null) out[ri.i] = c; });
      return Object.keys(out).length ? out : null; }
    default: return s;
  }
}
// Alle Fälle mit geparsten Werten
let _recCache = null;
function records(){
  if (_recCache) return _recCache;
  const map = P.data.mapping || {}, tv = P.settings.testVar, tval = norm(P.settings.testVal||"");
  _recCache = P.data.rows.map(row=>{
    const r = {id: row.id, date: row.date, v:{}};
    for (const [h, target] of Object.entries(map)){
      if (!target || target[0]==="_") continue; const [vn, ri] = target.split("::"); const q = qByVar(vn); if (!q) continue;
      const val = parseValue(q, row.cells[h], ri==null?null:+ri); if (val==null) continue;
      if (q.type==="matrix"){ r.v[vn] = Object.assign(r.v[vn]||{}, val); }
      else if (q.type==="multi" && r.v[vn]){ r.v[vn].hits = [...new Set([...r.v[vn].hits, ...val.hits])]; if (val.other) r.v[vn].other = [r.v[vn].other, val.other].filter(Boolean).join("; "); }
      else r.v[vn] = val;
    }
    const tq = tv && r.v[tv]; r.isTest = !!(tval && tq != null && norm(typeof tq==="object" ? JSON.stringify(tq) : tq).includes(tval));
    r.excluded = P.data.excluded.includes(r.id);
    return r;
  });
  return _recCache;
}
function invalidate(){ _recCache = null; }
const valid = () => records().filter(r=>!r.isTest && !r.excluded);

// Numerische Variablen für Statistik
function numericVars(){
  const out = [];
  P.questions.forEach(q=>{
    if (q.type==="scale") out.push({key:q.var, q, label:`${q.var} · ${q.text}`, short:q.text, min:q.min, max:q.max, get:r=>typeof r.v[q.var]==="number" ? r.v[q.var] : null});
    if (q.type==="single" && q.ordered) out.push({key:q.var, q, label:`${q.var} · ${q.text} (1 = ${q.options[0]||""})`, short:q.text, min:1, max:q.options.length, get:r=>{ const i = q.options.indexOf(r.v[q.var]); return i<0 ? null : i+1; }});
    if (q.type==="matrix" && q.ordered) q.rows.forEach((row,i)=>out.push({key:`${q.var}.${i+1}`, q, label:`${q.var}.${i+1} · ${row}`, short:row, min:1, max:q.cols.length, get:r=>{ const m = r.v[q.var]; return m && m[i]!=null ? m[i]+1 : null; }}));
    if (q.type==="multi") out.push({key:q.var+"#", q, label:`${q.var}# · Anzahl gewählter Optionen: ${q.text}`, short:`Anzahl: ${q.text}`, min:0, max:q.options.length, get:r=>{ const m = r.v[q.var]; return m ? m.hits.filter(o=>!NONE_RX.test(o)).length : null; }});
  });
  return out;
}
const nvByKey = k => numericVars().find(v=>v.key===k);
function targetVar(){ const nv = numericVars(); const k = P.settings.target || (P.questions.find(q=>q.roles&&q.roles.target)||{}).var; return nv.find(v=>v.key===k) || null; }

// Import
async function readFile(file){
  const name = file.name.toLowerCase();
  if (/\.(csv|tsv|txt)$/.test(name) && !window.XLSX){ return parseCSV(await file.text()); }
  if (!window.XLSX) throw new Error("Der Excel-Leser (SheetJS) konnte nicht geladen werden. Prüfe die Internetverbindung oder speichere die Datei als CSV.");
  const buf = await file.arrayBuffer();
  const wb = /\.(csv|tsv|txt)$/.test(name) ? XLSX.read(new TextDecoder("utf-8").decode(buf), {type:"string", cellDates:true}) : XLSX.read(buf, {type:"array", cellDates:true});
  const ws = wb.Sheets[wb.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json(ws, {header:1, defval:"", raw:false, dateNF:"yyyy-mm-dd hh:mm"});
  return aoa;
}
function parseCSV(text){
  text = text.replace(/^﻿/,""); const first = text.split("\n")[0];
  const sep = [";", ",", "\t"].map(s=>({s, n:first.split(s).length})).sort((a,b)=>b.n-a.n)[0].s;
  const rows = []; let row = [], cell = "", q = false;
  for (let i=0;i<text.length;i++){ const c = text[i];
    if (q){ if (c==='"' && text[i+1]==='"'){ cell += '"'; i++; } else if (c==='"') q = false; else cell += c; }
    else if (c==='"') q = true; else if (c===sep){ row.push(cell); cell = ""; } else if (c==="\n" || c==="\r"){ if (c==="\r" && text[i+1]==="\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; } else cell += c; }
  if (cell || row.length){ row.push(cell); rows.push(row); }
  return rows.filter(r=>r.some(x=>String(x).trim()));
}
function importAoa(aoa, fileName){
  if (!aoa.length) throw new Error("Die Datei enthält keine Daten.");
  const headers = aoa[0].map((h,i)=>str(h) || "Spalte "+(i+1));
  const seen = {}; headers.forEach((h,i)=>{ if (seen[h]) headers[i] = h + " (" + (++seen[h]) + ")"; else seen[h] = 1; });
  const mapping = Object.assign({}, P.data.mapping||{});
  headers.forEach(h=>{ if (!(h in mapping)) mapping[h] = autoMap(h); });
  const idCol = headers.find(h=>mapping[h]==="_id"), dateCol = headers.find(h=>mapping[h]==="_date");
  const byId = new Map(P.data.rows.map(r=>[r.id, r])); let added = 0, updated = 0;
  aoa.slice(1).forEach(arr=>{
    const cells = {}; headers.forEach((h,i)=>{ const v = str(arr[i]); if (v) cells[h] = v; });
    if (!Object.keys(cells).length) return;
    const content = Object.entries(cells).filter(([h])=>mapping[h] && mapping[h][0]!=="_").sort().map(([h,v])=>h+"="+v).join("|");
    const id = idCol && cells[idCol] ? "id-" + cells[idCol] : "x-" + hashStr(content);
    const row = {id, date: dateCol ? cells[dateCol] || null : null, cells};
    if (byId.has(id)) updated++; else added++;
    byId.set(id, row);
  });
  P.data.rows = [...byId.values()]; P.data.headers = [...new Set([...(P.data.headers||[]), ...headers])];
  P.data.mapping = mapping; P.data.fileName = fileName; P.data.importedAt = new Date().toISOString();
  invalidate(); save();
  return {added, updated, total:P.data.rows.length};
}
$("#dataFile").onchange = async e=>{
  const f = e.target.files[0]; if (!f) return;
  try{ const res = importAoa(await readFile(f), f.name); $("#dataInfo").textContent = `${f.name}: ${res.added} neue, ${res.updated} bereits vorhandene Fälle. Insgesamt ${res.total}.`; renderData(); }
  catch(err){ $("#dataInfo").textContent = "Fehler beim Lesen: " + (err.message || err); }
  e.target.value = "";
};
$("#clearData").onclick = ()=>{ if (!P.data.rows.length || !confirmBox("Alle importierten Antworten aus diesem Projekt entfernen? Der Fragebogen bleibt erhalten.")) return; P.data = blankProject().data; invalidate(); save(); renderData(); };
$("#testVar").onchange = ()=>{ P.settings.testVar = $("#testVar").value; invalidate(); save(); renderData(); };
$("#testVal").oninput = ()=>{ P.settings.testVal = $("#testVal").value; invalidate(); save(); clearTimeout(window.__tv); window.__tv = setTimeout(renderData, 400); };

function cellText(q, v){
  if (v == null) return "";
  if (q.type==="multi") return [...v.hits, v.other && "Sonstiges: "+v.other].filter(Boolean).join("; ");
  if (q.type==="matrix") return Object.entries(v).map(([i,c])=>`${q.rows[i]}: ${q.cols[c]}`).join("; ");
  if (q.type==="consent") return "ja";
  return String(v);
}
function renderData(){
  $("#testVar").innerHTML = `<option value="">– keine –</option>` + P.questions.filter(q=>q.type!=="consent").map(q=>`<option value="${esc(q.var)}" ${q.var===P.settings.testVar?"selected":""}>${esc(q.var)} · ${esc(q.text.slice(0,50))}</option>`).join("");
  $("#testVal").value = P.settings.testVal || "";
  const recs = records(), headers = P.data.headers || [];
  if (!$("#dataInfo").textContent && P.data.rows.length) $("#dataInfo").textContent = `${P.data.rows.length} Fälle aus ${P.data.fileName||"Import"}`;
  if (!headers.length){ $("#mapOut").innerHTML = `<p class="empty">Noch keine Datei geladen. ${P.questions.length ? "" : "Lege zuerst den Fragebogen an, damit die Spalten zugeordnet werden können."}</p>`; $("#rawOut").innerHTML = ""; return; }
  const targets = [`<option value="">ignorieren</option>`, `<option value="_id">ID der Antwort</option>`, `<option value="_date">Datum</option>`];
  P.questions.forEach(q=>{ if (q.type==="matrix"){ targets.push(`<option value="${esc(q.var)}">${esc(q.var)} · ganze Matrix</option>`); q.rows.forEach((r,i)=>targets.push(`<option value="${esc(q.var)}::${i}">${esc(q.var)} · Zeile: ${esc(r.slice(0,40))}</option>`)); } else targets.push(`<option value="${esc(q.var)}">${esc(q.var)} · ${esc(q.text.slice(0,50))}</option>`); });
  const unmappedQs = P.questions.filter(q=>!Object.values(P.data.mapping).some(t=>t && t.split("::")[0]===q.var));
  const rowsH = headers.map(h=>{
    const t = P.data.mapping[h] || "", ex = P.data.rows.map(r=>r.cells[h]).find(Boolean) || "";
    let status = ""; if (t && t[0]!=="_"){ const [vn] = t.split("::"); const q = qByVar(vn); if (q){ const n = recs.filter(r=>r.v[vn]!=null).length; const raw = P.data.rows.filter(r=>r.cells[h]).length; status = n < raw*0.8 && q.type!=="long" && q.type!=="short" ? `<span class="chip warn">${n} von ${raw} erkannt</span>` : `<span class="chip ok">${n} Werte</span>`; } }
    return `<tr><td style="max-width:320px">${esc(h)}</td><td style="max-width:260px;color:var(--muted)">${esc(String(ex).slice(0,80))}</td><td><select data-map="${esc(h)}">${targets.map(o=>o.replace(`value="${esc(t)}"`, `value="${esc(t)}" selected`)).join("")}</select></td><td>${status}</td></tr>`; }).join("");
  $("#mapOut").innerHTML = `${unmappedQs.length ? `<div class="banner">Ohne Spalte: ${unmappedQs.map(q=>`<b>${esc(q.var)}</b>`).join(", ")}. Wurde der Fragetext im Formular geändert? Dann die Spalte unten von Hand zuordnen.</div>` : `<div class="banner info">Alle Fragen sind einer Spalte zugeordnet.</div>`}
    <div class="tbl"><table class="apa"><thead><tr><th>Spalte in der Datei</th><th>Beispielwert</th><th>Zuordnung</th><th>Erkannt</th></tr></thead><tbody>${rowsH}</tbody></table></div>`;
  $$("[data-map]").forEach(s=>s.onchange = ()=>{ P.data.mapping[s.dataset.map] = s.value; invalidate(); save(); renderData(); });
  const qs = P.questions.filter(q=>q.type!=="consent"), shown = recs.slice(0, 500);
  $("#rawOut").innerHTML = `<p class="hint">${recs.length} Fälle · ${recs.filter(r=>r.isTest).length} Testeinträge · ${recs.filter(r=>r.excluded).length} ausgeschlossen · <b>${valid().length} gehen in die Auswertung ein</b>${recs.length>500?" · Anzeige der ersten 500":""}</p>
    <table class="apa" style="font-size:12px"><thead><tr><th>Einbeziehen</th><th>#</th><th>Datum</th>${qs.map(q=>`<th title="${esc(q.text)}">${esc(q.var)}</th>`).join("")}</tr></thead><tbody>${shown.map((r,i)=>`<tr${r.isTest||r.excluded?' style="color:var(--muted)"':""}><td>${r.isTest?'<span class="chip">Test</span>':`<input type="checkbox" data-ex="${esc(r.id)}" ${r.excluded?"":"checked"} aria-label="Fall ${i+1} einbeziehen">`}</td><td class="r">${i+1}</td><td class="mono">${esc(r.date||"")}</td>${qs.map(q=>`<td style="max-width:240px">${esc(cellText(q, r.v[q.var]).slice(0,200))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  $$("[data-ex]").forEach(c=>c.onchange = ()=>{ const id = c.dataset.ex; P.data.excluded = c.checked ? P.data.excluded.filter(x=>x!==id) : [...P.data.excluded, id]; invalidate(); save(); renderData(); });
}
