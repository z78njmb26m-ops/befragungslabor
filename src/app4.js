/* ---------- Diagramme ---------- */
function W(el){ return Math.max(320, Math.min(900, (el && el.clientWidth) || 760)); }
function svgOpen(w,h,label){ return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">`; }
const cut = (s, n=44) => { s = String(s); return s.length > n ? s.slice(0, n-2) + "…" : s; };
const COLORS = ["var(--c1)","var(--c2)","var(--c3)","var(--c4)","var(--c5)","var(--accent)","var(--muted)"];
function ciDotChart(items, host, opts){
  const w = W(host), lab = Math.min(300, w*0.42), x0 = lab+12, x1 = w-60, rowH = 26, h = items.length*rowH + 44, sx = v => x0 + v*(x1-x0);
  let s = svgOpen(w,h,opts.label);
  for (const t of [0,.25,.5,.75,1]) s += `<line class="grid" x1="${sx(t)}" x2="${sx(t)}" y1="6" y2="${h-30}"/><text class="lbl" x="${sx(t)}" y="${h-12}" text-anchor="middle">${t*100} %</text>`;
  if (opts.ref!=null) s += `<line x1="${sx(opts.ref)}" x2="${sx(opts.ref)}" y1="6" y2="${h-30}" stroke="var(--sig)" stroke-dasharray="4,3"/>`;
  items.forEach((it,i)=>{ const y = 22 + i*rowH;
    s += `<text x="${lab}" y="${y+4}" text-anchor="end" font-size="12.5">${esc(cut(it.l))}</text>`;
    if (it.ci && it.ci[0]!=null) s += `<line x1="${sx(it.ci[0])}" x2="${sx(it.ci[1])}" y1="${y}" y2="${y}" stroke="var(--ink)" stroke-width="1.4"/><line x1="${sx(it.ci[0])}" x2="${sx(it.ci[0])}" y1="${y-5}" y2="${y+5}" stroke="var(--ink)"/><line x1="${sx(it.ci[1])}" x2="${sx(it.ci[1])}" y1="${y-5}" y2="${y+5}" stroke="var(--ink)"/>`;
    s += `<circle cx="${sx(it.p)}" cy="${y}" r="5" fill="var(--accent)" data-tip="${esc(it.l)}: ${it.k} von ${it.n} (${pct(it.k,it.n)}), 95 %-KI ${ciP(it.ci)}"/><text class="lbl num" x="${w-4}" y="${y+4}" text-anchor="end">${pct(it.k,it.n)}</text>`; });
  return s + `</svg>`;
}
function dotDist(values, min, max, host, lo, hi, label){
  const w = W(host), x0 = 40, x1 = w-20, sx = v => x0 + (v-min)/((max-min)||1)*(x1-x0);
  const counts = {}; values.forEach(v=>counts[v]=(counts[v]||0)+1); const mx = Math.max(1,...Object.values(counts));
  const r = mx > 14 ? 4 : 7, h = Math.max(110, mx*(2*r+3) + 80), base = h-46;
  let s = svgOpen(w,h,label) + `<line class="ax" x1="${x0}" x2="${x1}" y1="${base}" y2="${base}"/>`;
  for (let v=min; v<=max; v++) s += `<line class="ax" x1="${sx(v)}" x2="${sx(v)}" y1="${base}" y2="${base+4}"/><text class="lbl" x="${sx(v)}" y="${base+18}" text-anchor="middle">${v}</text>`;
  s += `<text class="lbl" x="${x0}" y="${h-4}">${esc(lo||"")}</text><text class="lbl" x="${x1}" y="${h-4}" text-anchor="end">${esc(hi||"")}</text>`;
  const m = S.mean(values), c = S.meanCI(values);
  if (c) s += `<rect x="${sx(Math.max(min,c[0]))}" y="8" width="${Math.max(1,sx(Math.min(max,c[1]))-sx(Math.max(min,c[0])))}" height="${base-8}" fill="var(--accent-soft)"/>`;
  if (m!=null) s += `<line x1="${sx(m)}" x2="${sx(m)}" y1="8" y2="${base}" stroke="var(--accent)" stroke-width="2"/><text x="${sx(m)+6}" y="20" font-size="12" fill="var(--accent)"><tspan font-style="italic">M</tspan> = ${de(m)}</text>`;
  for (const [v,cnt] of Object.entries(counts)) for (let i=0;i<cnt;i++) s += `<circle cx="${sx(+v)}" cy="${base - r - 2 - i*(2*r+3)}" r="${r}" fill="var(--ink)" fill-opacity=".78" data-tip="Wert ${v}: ${cnt} Person${cnt>1?"en":""}"/>`;
  return s + `</svg>`;
}
function forest(items, host, label){
  const w = W(host), lab = Math.min(300, w*0.42), x0 = lab+12, x1 = w-20, rowH = 26, h = items.length*rowH + 46, sx = v => x0 + (v+1)/2*(x1-x0);
  let s = svgOpen(w,h,label);
  for (const t of [-1,-.5,0,.5,1]) s += `<line class="${t===0?"ax":"grid"}" x1="${sx(t)}" x2="${sx(t)}" y1="6" y2="${h-30}"/><text class="lbl" x="${sx(t)}" y="${h-12}" text-anchor="middle">${de(t,1)}</text>`;
  items.forEach((it,i)=>{ const y = 20 + i*rowH;
    s += `<text x="${lab}" y="${y+4}" text-anchor="end" font-size="12.5">${esc(cut(it.l))}</text>`;
    if (it.r==null){ s += `<text class="lbl" x="${sx(0)+6}" y="${y+4}">zu wenige Daten</text>`; return; }
    if (it.ci) s += `<line x1="${sx(it.ci[0])}" x2="${sx(it.ci[1])}" y1="${y}" y2="${y}" stroke="var(--ink)" stroke-width="1.4"/>`;
    s += `<rect x="${sx(it.r)-5}" y="${y-5}" width="10" height="10" fill="${it.pHolm<.05?"var(--sig)":"var(--accent)"}" data-tip="${esc(it.l)}: rₛ = ${de(it.r)}, 95 %-KI ${ci(it.ci)}, p = ${fp(it.p)}, n = ${it.n}"/>`; });
  return s + `</svg>`;
}
function stacked(items, cols, host, label){
  const w = W(host), lab = Math.min(300, w*0.42), x0 = lab+12, x1 = w-20, rowH = 28, h = items.length*rowH + 60, sx = v => x0 + v*(x1-x0);
  const pal = cols.length===3 ? ["var(--c2)","var(--hair)","var(--c1)"] : cols.map((c,i)=>COLORS[i%COLORS.length]);
  let s = svgOpen(w,h,label);
  for (const t of [0,.5,1]) s += `<line class="grid" x1="${sx(t)}" x2="${sx(t)}" y1="6" y2="${h-50}"/><text class="lbl" x="${sx(t)}" y="${h-36}" text-anchor="middle">${t*100} %</text>`;
  items.forEach((it,i)=>{ const y = 12 + i*rowH; let acc = 0;
    s += `<text x="${lab}" y="${y+13}" text-anchor="end" font-size="12.5">${esc(cut(it.l))}</text>`;
    it.counts.forEach((c,j)=>{ const p = it.n ? c/it.n : 0; if (p>0) s += `<rect x="${sx(acc)}" y="${y}" width="${p*(x1-x0)}" height="18" fill="${pal[j]}" data-tip="${esc(cols[j])}: ${c} von ${it.n} (${pct(c,it.n)})"/>`; acc += p; }); });
  let lx = x0; cols.forEach((c,j)=>{ s += `<rect x="${lx}" y="${h-22}" width="11" height="11" fill="${pal[j]}"/><text class="lbl" x="${lx+15}" y="${h-13}">${esc(cut(c,22))}</text>`; lx += 30 + Math.min(22,c.length)*6.2; });
  return s + `</svg>`;
}
function scatterXY(pts, host, xl, yl, xr, yr, color){
  const w = W(host), h = 340, x0 = 52, x1 = w-16, y0 = 16, y1 = h-46;
  const sx = v => x0 + (v-xr[0])/((xr[1]-xr[0])||1)*(x1-x0), sy = v => y1 - (v-yr[0])/((yr[1]-yr[0])||1)*(y1-y0), rnd = S.rng(3);
  let s = svgOpen(w,h,`${xl} und ${yl}`);
  const stepX = Math.max(1, Math.ceil((xr[1]-xr[0])/10)), stepY = Math.max(1, Math.ceil((yr[1]-yr[0])/10));
  for (let v=xr[0]; v<=xr[1]; v+=stepX) s += `<line class="grid" x1="${sx(v)}" x2="${sx(v)}" y1="${y0}" y2="${y1}"/><text class="lbl" x="${sx(v)}" y="${y1+16}" text-anchor="middle">${v}</text>`;
  for (let v=yr[0]; v<=yr[1]; v+=stepY) s += `<line class="grid" x1="${x0}" x2="${x1}" y1="${sy(v)}" y2="${sy(v)}"/><text class="lbl" x="${x0-8}" y="${sy(v)+4}" text-anchor="end">${v}</text>`;
  s += `<text class="lbl" x="${(x0+x1)/2}" y="${h-6}" text-anchor="middle">${esc(cut(xl,80))}</text><text class="lbl" transform="translate(12 ${(y0+y1)/2}) rotate(-90)" text-anchor="middle">${esc(cut(yl,50))}</text>`;
  pts.forEach(p=>{ const jx = (rnd()-.5)*0.3*stepX, jy = (rnd()-.5)*0.3*stepY;
    s += `<circle cx="${sx(p.x+jx)}" cy="${sy(p.y+jy)}" r="7" fill="${color(p)}" fill-opacity=".85" stroke="var(--page)" stroke-width="1.5" data-tip="${esc(p.tip)}"/>`; });
  return s + `</svg>`;
}
let figN = 0, tabN = 0;
const fig = (title, svg, note) => `<figure><div class="cap"><b>Abbildung ${++figN}</b><i>${esc(title)}</i></div>${svg}${note?`<p class="note">${note}</p>`:""}</figure>`;
const tbl = (title, head, body, note) => `<div class="tbl"><div class="cap"><b>Tabelle ${++tabN}</b><i>${esc(title)}</i></div><table class="apa"><thead>${head}</thead><tbody>${body}</tbody></table>${note?`<p class="note">${note}</p>`:""}</div>`;
function bindTips(){
  const tip = $("#tip");
  $$("[data-tip]").forEach(el=>{
    el.addEventListener("mousemove", e=>{ tip.textContent = el.getAttribute("data-tip"); tip.style.left = Math.min(window.innerWidth-270, e.clientX+12)+"px"; tip.style.top = (e.clientY+12)+"px"; tip.style.opacity = 1; });
    el.addEventListener("mouseleave", ()=>{ tip.style.opacity = 0; });
  });
}

/* ---------- Analysen ---------- */
const sizeR = r => { const a = Math.abs(r); return a < .1 ? "vernachlässigbar" : a < .3 ? "klein" : a < .5 ? "mittel" : "groß"; };
const sizeD = d => { const a = Math.abs(d); return a < .147 ? "vernachlässigbar" : a < .33 ? "klein" : a < .474 ? "mittel" : "groß"; };
const sizeE = e => e < .01 ? "vernachlässigbar" : e < .08 ? "klein" : e < .26 ? "mittel" : "groß";
function freqs(rows, q){
  if (q.type==="multi"){ const base = rows.filter(r=>r.v[q.var]).length; return q.options.map(o=>{ const k = rows.filter(r=>r.v[q.var] && r.v[q.var].hits.includes(o)).length; return {l:o, k, n:base, p:base?k/base:0, ci:S.wilson(k,base)}; }); }
  const base = rows.filter(r=>r.v[q.var]!=null).length; const opts = [...q.options]; rows.forEach(r=>{ const v = r.v[q.var]; if (v!=null && !opts.includes(v)) opts.push(v); });
  return opts.map(o=>{ const k = rows.filter(r=>r.v[q.var]===o).length; return {l:o, k, n:base, p:base?k/base:0, ci:S.wilson(k,base)}; });
}
function correlations(rows, tv){
  const res = numericVars().filter(v=>v.key!==tv.key && v.q.var!==tv.q.var).map(v=>({key:v.key, l:v.short, ...S.spearman(rows.map(r=>[v.get(r), tv.get(r)]))})).filter(x=>x.n>=4);
  const adj = S.holm(res.map(r=>r.r==null?null:r.p)); res.forEach((r,i)=>r.pHolm = adj[i]); return res;
}
function groupTests(rows, tv){
  const res = P.questions.filter(q=>q.type==="single" && q.roles.group && q.var!==tv.q.var).map(q=>{
    const groups = freqs(rows, q).map(f=>({l:f.l, vals: rows.filter(r=>r.v[q.var]===f.l).map(tv.get).filter(x=>x!=null)})).filter(g=>g.vals.length>=2);
    if (groups.length < 2) return {q, groups, test:null};
    if (groups.length === 2){ const m = S.mannWhitney(groups[0].vals, groups[1].vals); return {q, groups, test:"U", stat:m.U, p:m.p, eff:m.delta, effL:"δ", size:sizeD(m.delta||0)}; }
    const k = S.kruskal(groups.map(g=>g.vals)); return {q, groups, test:"H", stat:k.H, df:k.df, p:k.p, eff:k.eps2, effL:"ε²", size:sizeE(k.eps2||0)};
  });
  const adj = S.holm(res.map(r=>r.test?r.p:null)); res.forEach((r,i)=>r.pHolm = adj[i]); return res;
}
function clusterVars(){ return numericVars().filter(v=>v.q.roles && v.q.roles.cluster); }
function cluster(rows){
  const vars = clusterVars(), n = rows.length;
  if (vars.length < 2 || n < 6) return {k:1, lab:rows.map(()=>0), sil:null, vars, reason: vars.length<2 ? "Für die Typenbildung sind mindestens zwei Merkmale nötig (im Fragebogen „Für Typenbildung nutzen“ ankreuzen)." : "Für die Typenbildung sind mindestens sechs gültige Fälle nötig."};
  const order = rows.map((r,i)=>i).sort((a,b)=>String(rows[a].id).localeCompare(String(rows[b].id)));
  const sorted = order.map(i=>rows[i]);
  const st = vars.map(v=>{ const vals = sorted.map(v.get); return {m:S.mean(vals), sd:S.sd(vals)||1}; });
  const X = sorted.map(r=>vars.map((v,j)=>{ const x = v.get(r); return ((x==null?st[j].m:x) - st[j].m)/st[j].sd; }));
  let best = null; const kmax = Math.min(5, Math.max(2, Math.floor(n/3)));
  for (let k=2; k<=kmax; k++){ const km = S.kmeans(X, k); if (!km) continue; const sl = S.silhouette(X, km.lab); if (!best || sl > best.sil) best = {k, lab:km.lab, sil:sl}; }
  if (!best) return {k:1, lab:rows.map(()=>0), sil:null, vars, reason:"Die Clusteranalyse fand keine Lösung."};
  const sizes = [...Array(best.k).keys()].map(c=>({c, n:best.lab.filter(l=>l===c).length})).sort((a,b)=>b.n-a.n || a.c-b.c);
  const remap = {}; sizes.forEach((s,i)=>remap[s.c]=i);
  const lab = new Array(n); order.forEach((orig,j)=>{ lab[orig] = remap[best.lab[j]]; });
  return {k:best.k, lab, sil:best.sil, vars};
}
const TYPE_L = i => String.fromCharCode(65+i);

/* ---------- KI-Aufgaben ---------- */
const longQs = () => P.questions.filter(q=>q.type==="long"||q.type==="short").filter(q=>q.var!==P.settings.testVar);
function caseText(r, nr, lab){
  const o = {nr}; if (lab!=null) o.typ = TYPE_L(lab);
  P.questions.forEach(q=>{ if (q.type==="consent" || q.var===P.settings.testVar) return; const v = r.v[q.var]; if (v==null) return; o[q.var] = q.type==="multi"||q.type==="matrix" ? cellText(q, v) : v; });
  return o;
}
function codebook(){ return P.questions.filter(q=>q.type!=="consent" && q.var!==P.settings.testVar).map(q=>`- ${q.var} (${TYPES[q.type]}): ${q.text}${q.type==="scale"?` [${q.min} = ${q.minLabel}, ${q.max} = ${q.maxLabel}]`:""}`).join("\n"); }
function aiSig(rows, extra=""){ return hashStr(rows.map(r=>r.id).sort().join(",") + "|" + P.questions.map(q=>q.var).join(",") + "|" + extra); }
const AI = {
  qual: {title:"Qualitative Inhaltsanalyse der offenen Antworten",
    prompt(ctx){ const qs = longQs(); return `Du bist Methodiker:in für qualitative Sozialforschung. Führe eine zusammenfassende, induktive Inhaltsanalyse nach Mayring mit den offenen Antworten einer Befragung durch.

Studie: ${P.meta.title||"–"}
Forschungsfrage: ${P.meta.rq||"–"}
Zielgruppe: ${P.meta.audience||"–"}
Offene Fragen:
${qs.map(q=>`- ${q.var}: ${q.text}`).join("\n")}

Regeln:
- Bilde 5 bis 9 Kategorien direkt aus dem Material. Erfinde nichts.
- Jede Kategorie hat eine Definition, ein wörtliches Ankerbeispiel (exakt so wie im Material) und die Fallnummern (nr), in denen sie vorkommt.
- Kategorien sollen sich gegenseitig ausschließen und auf die Forschungsfrage bezogen sein.
- Nenne auch Gegenbeispiele oder Widersprüche, wenn es welche gibt.

Antworte ausschließlich mit JSON in genau diesem Format:
{"kategorien":[{"name":"","definition":"","anker":"","nrs":[1,2],"fragen":["var"]}],"widersprueche":[""],"zusammenfassung":"3–5 Sätze"}

Antworten (JSON, nr = Fallnummer):
${JSON.stringify(ctx.rows.map((r,i)=>{ const o={nr:i+1}; qs.forEach(q=>{ if (r.v[q.var]) o[q.var]=r.v[q.var]; }); return o; }).filter(o=>Object.keys(o).length>1))}`; },
    render(d){ return `${d.zusammenfassung?`<p class="body">${esc(d.zusammenfassung)}</p>`:""}${tbl("Induktiv gebildete Kategorien der offenen Antworten", `<tr><th>Kategorie</th><th>Definition</th><th>Ankerbeispiel</th><th class="r">n</th></tr>`, (d.kategorien||[]).map(k=>`<tr><td><b>${esc(k.name)}</b></td><td>${esc(k.definition)}</td><td><i>„${esc(k.anker)}“</i></td><td class="r">${(k.nrs||[]).length}</td></tr>`).join(""), "Anmerkung. Kategorien KI-gestützt nach Mayring gebildet und vom Team zu prüfen. n = Anzahl Fälle, in denen die Kategorie vorkommt.")}${(d.widersprueche||[]).filter(Boolean).length?`<h3 class="sub">Widersprüche und Gegenbeispiele</h3>${ul(d.widersprueche)}`:""}`; }
  },
  personas: {title:"Personas je Typ",
    prompt(ctx){ return `Du bist UX-Researcher:in. Eine Clusteranalyse (k-Means, standardisierte Merkmale) hat die Befragten in ${ctx.cl.k} Typen eingeteilt. Schreibe für jeden Typ eine datenbasierte Persona.

Studie: ${P.meta.title||"–"}
Forschungsfrage: ${P.meta.rq||"–"}
Merkmale der Typenbildung: ${ctx.cl.vars.map(v=>v.short).join("; ")}

Typenprofile (Mittelwerte):
${ctx.profiles}

Codebuch:
${codebook()}
${P.protos.filter(p=>p.name).length?`
Proto-Personas des Teams (vor der Befragung angenommen):
${P.protos.filter(p=>p.name).map(p=>`- ${p.name}: ${p.text}`).join("\n")}
Gleiche sie mit den Typen ab: Was bestätigen die Daten, was widerlegen sie?`:""}

Regeln:
- Eine Persona pro Typ (Typ A, B, …). Jede Aussage muss sich auf die Daten stützen.
- Zitate exakt aus den offenen Antworten des jeweiligen Typs übernehmen und die Fallnummer nennen.
- Fiktiver Vorname, keine Klischees.

Antworte ausschließlich mit JSON in genau diesem Format:
{"personas":[{"typ":"A","name":"","typname":"kurzer Typname","kurzbeschreibung":"2 Sätze","zitat":"","zitat_nr":1,"ziele":[""],"pains":[""],"gains":[""],"verhalten":[""],"beleg":"auf welche Daten stützt sich das"}],"abgleich_proto":[{"proto":"","ergebnis":"bestätigt / teilweise / widerlegt","begruendung":""}]}

Fälle (JSON, typ = Typ aus der Clusteranalyse):
${JSON.stringify(ctx.rows.map((r,i)=>caseText(r, i+1, ctx.cl.lab[i])))}`; },
    render(d, ctx){ return `<div class="cards">${(d.personas||[]).map(p=>{ const ti = (p.typ||"A").charCodeAt(0)-65; return `<div class="pcard" style="border-top:4px solid ${COLORS[ti%COLORS.length]}"><span class="tag" style="color:${COLORS[ti%COLORS.length]}">Typ ${esc(p.typ)} · ${esc(p.typname||"")}${ctx&&ctx.cl&&ctx.cl.lab?` · n = ${ctx.cl.lab.filter(l=>l===ti).length}`:""}</span><h4>${esc(p.name)}</h4><p style="margin:0">${esc(p.kurzbeschreibung)}</p>${p.zitat?`<blockquote>„${esc(p.zitat)}“<small>Fall ${esc(p.zitat_nr||"")}</small></blockquote>`:""}<div class="sec">Ziele</div>${ul(p.ziele)}<div class="sec">Pains</div>${ul(p.pains)}<div class="sec">Gains</div>${ul(p.gains)}<div class="sec">Verhalten</div>${ul(p.verhalten)}${p.beleg?`<p class="note">Datenbasis: ${esc(p.beleg)}</p>`:""}</div>`; }).join("")}</div>${(d.abgleich_proto||[]).length?tbl("Abgleich mit den Proto-Personas", `<tr><th>Proto-Persona</th><th>Ergebnis</th><th>Begründung</th></tr>`, d.abgleich_proto.map(a=>`<tr><td>${esc(a.proto)}</td><td>${esc(a.ergebnis)}</td><td>${esc(a.begruendung)}</td></tr>`).join("")):""}`; }
  },
  hmw: {title:"Problem Statements und How-Might-We-Fragen",
    prompt(ctx){ return `Du bist Design-Thinking-Coach. Leite aus den Ergebnissen einer Befragung Problem Statements (Point of View) und How-Might-We-Fragen ab.

Studie: ${P.meta.title||"–"}
Forschungsfrage: ${P.meta.rq||"–"}

Zentrale Ergebnisse:
${ctx.summary}
${P.ai.personas&&P.ai.personas.json?`
Personas:
${(P.ai.personas.json.personas||[]).map(p=>`- Typ ${p.typ} ${p.name} (${p.typname}): ${p.kurzbeschreibung} Pains: ${(p.pains||[]).join("; ")}`).join("\n")}`:""}
${P.ai.qual&&P.ai.qual.json?`
Kategorien der offenen Antworten:
${(P.ai.qual.json.kategorien||[]).map(k=>`- ${k.name} (n = ${(k.nrs||[]).length}): ${k.definition}`).join("\n")}`:""}

Regeln:
- Problem Statement im Format: [Nutzer:in] braucht [Bedürfnis], weil [Erkenntnis].
- 5 bis 8 How-Might-We-Fragen („Wie könnten wir …?“), weder zu eng noch zu weit, jeweils mit Bezug auf die Daten.
- Keine Lösungen in die Fragen einbauen.

Antworte ausschließlich mit JSON in genau diesem Format:
{"problem_statements":[{"persona":"","statement":""}],"hmw":[{"frage":"","begruendung":""}]}`; },
    render(d){ return `${(d.problem_statements||[]).length?`<h3 class="sub">Problem Statements</h3>${d.problem_statements.map(p=>`<div class="hmw"><p>${esc(p.statement)}</p><small>${esc(p.persona||"")}</small></div>`).join("")}`:""}<h3 class="sub">How-Might-We-Fragen</h3>${(d.hmw||[]).map(h=>`<div class="hmw"><p>${esc(h.frage)}</p><small>${esc(h.begruendung||"")}</small></div>`).join("")}`; }
  }
};
function ul(a){ a = (a||[]).filter(Boolean); return a.length ? `<ul>${a.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>` : `<p class="empty">–</p>`; }
function parseAI(text){ const a = text.indexOf("{"), b = text.lastIndexOf("}"); if (a<0||b<a) throw new Error("Kein JSON gefunden."); return JSON.parse(text.slice(a, b+1)); }
function aiBox(task, ctx){
  const T = AI[task], st = P.ai[task], sig = ctx.sig;
  const result = st && st.json ? `${st.sig!==sig?`<div class="banner">Dieses Ergebnis beruht auf einem älteren Datenstand. Für den aktuellen Stand Prompt neu erzeugen.</div>`:""}${T.render(st.json, ctx)}` : "";
  return `${result}<div class="ai noprint" data-task="${task}"><h4>${esc(T.title)} mit KI</h4>
    <p class="hint">1. Prompt kopieren und in Claude, ChatGPT oder eine andere KI einfügen. 2. Die Antwort vollständig kopieren und unten einfügen. 3. „Übernehmen“. Es werden nur anonyme Antworten übergeben, keine IDs.</p>
    <div class="row"><button class="btn primary" type="button" data-aicopy="${task}">Prompt erzeugen und kopieren</button>${st&&st.json?`<button class="btn danger" type="button" data-aidel="${task}">Ergebnis entfernen</button>`:""}<span class="hint" data-aist="${task}"></span></div>
    <textarea data-aiin="${task}" rows="4" placeholder="Antwort der KI hier einfügen (JSON)"></textarea>
    <div class="row"><button class="btn" type="button" data-aiok="${task}">Übernehmen</button></div></div>`;
}
let AICTX = {};
function bindAI(){
  $$("[data-aicopy]").forEach(b=>b.onclick = async ()=>{ const t = b.dataset.aicopy, txt = AI[t].prompt(AICTX[t]); const ok = await copy(txt, $(`[data-aist="${t}"]`)); if (!ok){ const ta = $(`[data-aiin="${t}"]`); ta.value = txt; ta.select(); $(`[data-aist="${t}"]`).textContent = "Prompt steht im Feld unten. Markieren, kopieren, danach das Feld leeren und die Antwort einfügen."; } else $(`[data-aist="${t}"]`).textContent = `Prompt kopiert (${Math.round(txt.length/1000)} Tsd. Zeichen).`; });
  $$("[data-aiok]").forEach(b=>b.onclick = ()=>{ const t = b.dataset.aiok; try{ const j = parseAI($(`[data-aiin="${t}"]`).value); P.ai[t] = {json:j, sig:AICTX[t].sig, at:new Date().toISOString()}; save(); renderReport(t); }catch(e){ $(`[data-aist="${t}"]`).textContent = "Die Antwort ließ sich nicht lesen: " + e.message + " Bitte die komplette Antwort mit den geschweiften Klammern einfügen."; } });
  $$("[data-aidel]").forEach(b=>b.onclick = ()=>{ delete P.ai[b.dataset.aidel]; save(); renderReport(b.dataset.aidel); });
}

/* ---------- 4 Auswertung ---------- */
function renderReport(scrollTo){
  invalidate(); figN = 0; tabN = 0;
  const nv = numericVars();
  $("#targetSel").innerHTML = nv.length ? nv.map(v=>`<option value="${esc(v.key)}">${esc(v.label.slice(0,60))}</option>`).join("") : `<option value="">– keine numerische Frage –</option>`;
  const tv = targetVar(); if (tv) $("#targetSel").value = tv.key;
  $("#targetSel").onchange = ()=>{ P.settings.target = $("#targetSel").value; save(); renderReport(); };
  const paper = $("#paper"), all = records(), rows = valid(), n = rows.length;
  if (!P.questions.length || !n){ paper.innerHTML = `<div class="kicker">Auswertung</div><h1>${esc(P.meta.title||"Noch keine Daten")}</h1><p class="empty">${!P.questions.length?"Lege zuerst unter „Fragebogen“ die Fragen an oder lade die Vorlage.":"Lade unter „Daten“ den Export deines Formular-Tools. Danach erscheint hier der Bericht."}</p>`; $("#toc").innerHTML = ""; return; }
  const chapters = [], add = (id, title, html) => chapters.push({id, title, html});
  const qsAll = P.questions.filter(q=>q.type!=="consent" && q.var!==P.settings.testVar);
  const dates = rows.map(r=>r.date).filter(Boolean).sort();
  const findings = [];

  // 1 Methodik
  const cnt = t => qsAll.filter(q=>q.type===t).length;
  add("m", "Methodik", `<h3 class="sub">Design</h3><p class="body">Querschnittliche, anonyme Online-Befragung${P.meta.audience?` von ${esc(P.meta.audience)}`:""} mit standardisierten und offenen Fragen (Mixed-Methods-Design). ${P.meta.rq?`Leitende Forschungsfrage: <i>${esc(P.meta.rq)}</i>`:""}</p>
    <h3 class="sub">Instrument</h3><p class="body">Der Fragebogen umfasst ${qsAll.length} Items: ${[["single","Einfachauswahl"],["multi","Mehrfachauswahl"],["scale","Ratingskalen"],["matrix","Matrixfragen"],["short","Kurztext"],["long","offene Fragen"]].filter(([t])=>cnt(t)).map(([t,l])=>`${cnt(t)} ${l}`).join(", ")}. ${tv?`Zielvariable ist <i>${esc(tv.short)}</i> (${tv.min} bis ${tv.max}).`:"Es wurde keine Zielvariable festgelegt."} Das vollständige Codebuch steht im Anhang.</p>
    <h3 class="sub">Auswertung</h3><p class="body">Anteile werden mit 95 %-Konfidenzintervallen nach Wilson berichtet, Mittelwerte mit t-basierten Intervallen. Zusammenhänge werden als Rangkorrelation nach Spearman (r<sub>s</sub>) mit Fisher-z-Intervall geschätzt, Gruppenunterschiede mit dem Mann-Whitney-U-Test (Effektstärke Cliffs δ) bzw. dem Kruskal-Wallis-Test (ε²). Bei mehreren Tests wird nach Holm korrigiert. Die Typenbildung erfolgt per k-Means-Clusteranalyse auf z-standardisierten Merkmalen (k-means++, 30 Starts); die Clusterzahl wird über den mittleren Silhouettenkoeffizienten bestimmt. Offene Antworten werden KI-gestützt nach Mayring induktiv kategorisiert; die Kategorien sind vom Team zu prüfen.</p>`);

  // 2 Stichprobe
  const groupQs = P.questions.filter(q=>q.type==="single" && q.var!==P.settings.testVar);
  add("s", "Stichprobe", `<p class="body">Insgesamt gingen ${all.length} Antworten ein. ${all.filter(r=>r.isTest).length ? `${all.filter(r=>r.isTest).length} Testeinträge wurden entfernt. `:""}${all.filter(r=>r.excluded&&!r.isTest).length ? `${all.filter(r=>r.excluded&&!r.isTest).length} Fälle wurden manuell ausgeschlossen. `:""}In die Auswertung gehen <b>N = ${n}</b> Fälle ein${dates.length?`, erhoben zwischen ${esc(dates[0].slice(0,10))} und ${esc(dates[dates.length-1].slice(0,10))}`:""}.${n<30?` Bei dieser Stichprobengröße sind die Ergebnisse explorativ zu verstehen; Konfidenzintervalle sind entsprechend breit.`:""}</p>
    ${groupQs.length ? tbl("Zusammensetzung der Stichprobe", `<tr><th>Merkmal</th><th class="r">n</th><th class="r">%</th></tr>`, groupQs.map(q=>{ const f = freqs(rows, q); return `<tr class="grp"><td colspan="3"><b>${esc(q.text)}</b> <span class="hint">(n = ${f[0]?f[0].n:0})</span></td></tr>` + f.map(x=>`<tr><td style="padding-left:18px">${esc(x.l)}</td><td class="r">${x.k}</td><td class="r">${pct(x.k,x.n,1)}</td></tr>`).join(""); }).join(""), "Anmerkung. Prozente bezogen auf die gültigen Antworten der jeweiligen Frage.") : ""}`);

  // 3 Deskriptive Ergebnisse
  let d = "";
  if (nv.length) d += tbl("Deskriptive Statistik der numerischen Variablen", `<tr><th>Variable</th><th class="r">n</th><th class="r"><i>M</i></th><th class="r"><i>SD</i></th><th class="r"><i>Mdn</i></th><th class="r">95 %-KI</th><th class="r">Spanne</th></tr>`,
    nv.map(v=>{ const x = S.nums(rows.map(v.get)); return `<tr${tv&&v.key===tv.key?' style="font-weight:600"':""}><td>${esc(cut(v.short,60))}</td><td class="r">${x.length}</td><td class="r">${de(S.mean(x))}</td><td class="r">${de(S.sd(x))}</td><td class="r">${de(S.median(x),1)}</td><td class="r">${ci(S.meanCI(x))}</td><td class="r">${x.length?Math.min(...x)+"–"+Math.max(...x):"–"}</td></tr>`; }).join(""),
    "Anmerkung. Geordnete Auswahlfragen sind mit 1 = erste Antwortoption kodiert. Mehrfachauswahl als Anzahl gewählter Optionen (ohne „keine“). Fett: Zielvariable.");
  if (tv){ const x = S.nums(rows.map(tv.get)); const m = S.mean(x);
    d += `<div data-chart="target"></div>`; findings.push(`${tv.short}: M = ${de(m)} (SD = ${de(S.sd(x))}, 95 %-KI ${ci(S.meanCI(x))}, n = ${x.length}).`);
    const lowShare = x.filter(v=>v <= tv.min + (tv.max-tv.min)*0.4).length; d += `<p class="body">Im Mittel liegt <i>${esc(tv.short)}</i> bei <i>M</i> = ${de(m)} (<i>SD</i> = ${de(S.sd(x))}). ${pct(lowShare, x.length)} der Befragten liegen im unteren Bereich (≤ ${de(tv.min + (tv.max-tv.min)*0.4,1)}).</p>`; }
  P.questions.filter(q=>q.type==="multi").forEach(q=>{ const f = freqs(rows, q).sort((a,b)=>b.k-a.k); d += `<h3 class="sub">${esc(q.text)}</h3><div data-chart="multi:${esc(q.var)}"></div>`; const top = f[0]; if (top && top.k) findings.push(`${q.text} Häufigste Antwort: ${top.l} (${pct(top.k,top.n)}).`); });
  P.questions.filter(q=>q.type==="matrix").forEach(q=>{ d += `<h3 class="sub">${esc(q.text)}</h3><div data-chart="matrix:${esc(q.var)}"></div>`; });
  P.questions.filter(q=>q.type==="single" && !q.roles.group && q.var!==P.settings.testVar && !(tv && q.var===tv.q.var)).forEach(q=>{ d += `<h3 class="sub">${esc(q.text)}</h3><div data-chart="single:${esc(q.var)}"></div>`; });
  add("d", "Deskriptive Ergebnisse", d);

  // 4 Zusammenhänge
  let corr = [], gt = [];
  if (tv){
    corr = correlations(rows, tv).sort((a,b)=>Math.abs(b.r||0)-Math.abs(a.r||0)); gt = groupTests(rows, tv);
    const sig = corr.filter(c=>c.r!=null && c.pHolm<.05);
    let z = `<p class="body">Wie hängen die übrigen Merkmale mit <i>${esc(tv.short)}</i> zusammen? ${sig.length ? `Nach Holm-Korrektur ${sig.length===1?"ist ein Zusammenhang":"sind "+sig.length+" Zusammenhänge"} statistisch bedeutsam: ${sig.map(c=>`${esc(c.l)} (r<sub>s</sub> = ${de(c.r)}, ${sizeR(c.r)})`).join("; ")}.` : "Nach Holm-Korrektur ist kein Zusammenhang statistisch bedeutsam. Effektstärken und Intervalle zeigen dennoch, in welche Richtung die Daten deuten."}</p>`;
    if (corr.length){ z += `<div data-chart="forest"></div>` + tbl(`Rangkorrelationen mit ${tv.short}`, `<tr><th>Merkmal</th><th class="r">n</th><th class="r">r<sub>s</sub></th><th class="r">95 %-KI</th><th class="r"><i>p</i></th><th class="r"><i>p</i> (Holm)</th><th>Effekt</th></tr>`, corr.map(c=>`<tr><td>${esc(cut(c.l,60))}</td><td class="r">${c.n}</td><td class="r">${de(c.r)}</td><td class="r">${ci(c.ci)}</td><td class="r">${fp(c.p)}</td><td class="r">${fp(c.pHolm)}${c.pHolm<.05?' <span class="sigmark">*</span>':""}</td><td>${c.r==null?"–":sizeR(c.r)}</td></tr>`).join(""), "Anmerkung. Spearman-Rangkorrelation, Konfidenzintervall über Fisher-z. * p < 0,05 nach Holm-Korrektur. Effekt nach Cohen: ab 0,1 klein, ab 0,3 mittel, ab 0,5 groß.");
      const top = corr.find(c=>c.r!=null); if (top) findings.push(`Stärkster Zusammenhang mit ${tv.short}: ${top.l} (rs = ${de(top.r)}, ${peq(top.pHolm,"p(Holm)")}).`); }
    const gtv = gt.filter(g=>g.test);
    if (gtv.length) z += `<h3 class="sub">Gruppenvergleiche</h3>` + tbl(`Unterschiede in ${tv.short} nach Gruppen`, `<tr><th>Merkmal / Gruppe</th><th class="r">n</th><th class="r"><i>Mdn</i></th><th class="r"><i>M</i></th><th class="r">Test</th><th class="r"><i>p</i> (Holm)</th><th>Effekt</th></tr>`,
      gtv.map(g=>`<tr class="grp"><td colspan="4"><b>${esc(cut(g.q.text,70))}</b></td><td class="r">${g.test==="U"?`U = ${de(g.stat,1)}`:`H(${g.df}) = ${de(g.stat)}`}</td><td class="r">${fp(g.pHolm)}${g.pHolm<.05?' <span class="sigmark">*</span>':""}</td><td>${g.effL} = ${de(g.eff)} (${g.size})</td></tr>` + g.groups.map(x=>`<tr><td style="padding-left:18px">${esc(x.l)}</td><td class="r">${x.vals.length}</td><td class="r">${de(S.median(x.vals),1)}</td><td class="r">${de(S.mean(x.vals))}</td><td colspan="3"></td></tr>`).join("")).join(""),
      "Anmerkung. Zwei Gruppen: Mann-Whitney-U-Test, Effektstärke Cliffs δ (ab 0,15 klein, 0,33 mittel, 0,47 groß). Mehr als zwei Gruppen: Kruskal-Wallis-Test, ε² (ab 0,01 klein, 0,08 mittel, 0,26 groß). Gruppen mit weniger als zwei Fällen werden nicht getestet.");
    else z += `<p class="hint">Für Gruppenvergleiche im Fragebogen bei Einfachauswahl-Fragen „Gruppen vergleichen“ ankreuzen.</p>`;
    add("z", "Zusammenhänge", z);
  } else add("z", "Zusammenhänge", `<p class="empty">Lege im Fragebogen eine Zielvariable fest (Skala oder geordnete Auswahl), um Zusammenhänge zu berechnen.</p>`);

  // 5 Hypothesen
  if (P.hypotheses.length){
    const hr = P.hypotheses.map((h,i)=>{
      if (h.kind==="share"){ const q = qByVar(h.q); if (!q || !h.option) return {h, i, verdict:"unvollständig", detail:"Frage oder Option fehlt"}; const f = freqs(rows, q).find(x=>x.l===h.option) || {k:0,n:0,ci:[null,null]}; const t = h.threshold||.25;
        const verdict = !f.n ? "keine Daten" : f.ci[0]>t ? "gestützt" : f.ci[1]<t ? "nicht gestützt" : "nicht entscheidbar";
        return {h, i, verdict, detail:`${esc(h.option)}: ${f.k}/${f.n} (${pct(f.k,f.n)}), 95 %-KI ${ciP(f.ci)}; Schwelle ${Math.round(t*100)} %`}; }
      const a = nvByKey(h.a), b = nvByKey(h.b); if (!a || !b) return {h, i, verdict:"unvollständig", detail:"Variablen fehlen"};
      const c = S.spearman(rows.map(r=>[a.get(r), b.get(r)])); if (c.r==null) return {h, i, verdict:"keine Daten", detail:`n = ${c.n}`};
      const dirOk = h.dir==="neg" ? c.r<0 : c.r>0; const verdict = c.p<.05 ? (dirOk ? "gestützt" : "widerlegt (Gegenrichtung)") : "nicht gestützt";
      return {h, i, verdict, detail:`r<sub>s</sub> = ${de(c.r)}, 95 %-KI ${ci(c.ci)}, ${peq(c.p)}, n = ${c.n}; erwartet ${h.dir==="neg"?"negativ":"positiv"}`}; });
    const nOk = hr.filter(x=>x.verdict==="gestützt").length; findings.push(`${nOk} von ${hr.length} Hypothesen gestützt.`);
    add("h", "Hypothesenprüfung", `<p class="body">${nOk} von ${hr.length} Hypothesen werden durch die Daten gestützt.</p>` + tbl("Prüfung der Hypothesen", `<tr><th></th><th>Hypothese</th><th>Ergebnis</th><th>Kennwerte</th></tr>`, hr.map(x=>`<tr><td><b>H${x.i+1}</b></td><td>${esc(x.h.text||"(ohne Titel)")}</td><td><span class="chip ${x.verdict==="gestützt"?"ok":x.verdict.startsWith("nicht entscheidbar")?"":"warn"}">${x.verdict}</span></td><td>${x.detail}</td></tr>`).join(""), "Anmerkung. Anteils-Hypothesen gelten als gestützt, wenn das 95 %-Wilson-Intervall vollständig über der Relevanzschwelle liegt, als nicht gestützt, wenn es vollständig darunter liegt. Zusammenhangs-Hypothesen gelten als gestützt bei p < 0,05 in der erwarteten Richtung (ohne Mehrfachkorrektur, da vorab formuliert)."));
  }

  // 6 Abweichende Fälle
  if (tv && corr.length){
    const pr = corr.find(c=>c.r!=null && c.n>=5);
    if (pr){ const pv = nvByKey(pr.key); const pts = rows.map((r,i)=>({i, x:pv.get(r), y:tv.get(r)})).filter(p=>p.x!=null&&p.y!=null);
      const mx = S.mean(pts.map(p=>p.x)), my = S.mean(pts.map(p=>p.y)), sxx = pts.reduce((s,p)=>s+(p.x-mx)**2,0), b = sxx ? pts.reduce((s,p)=>s+(p.x-mx)*(p.y-my),0)/sxx : 0;
      const res = pts.map(p=>({...p, e:p.y-(my+b*(p.x-mx))})); const sdE = S.sd(res.map(p=>p.e)) || 1; const out = res.map(p=>({...p, z:p.e/sdE})).filter(p=>Math.abs(p.z)>1.5).sort((a,b)=>Math.abs(b.z)-Math.abs(a.z));
      const lq = longQs();
      add("a", "Abweichende Fälle", `<p class="body">Abweichende Fälle passen nicht zum allgemeinen Muster und sind für die Interpretation besonders aufschlussreich. Als Muster dient der stärkste Zusammenhang (${esc(pr.l)} mit ${esc(tv.short)}). Ausgewiesen werden Fälle mit einem standardisierten Residuum über 1,5.</p>` +
        (out.length ? out.map(p=>{ const r = rows[p.i]; const quotes = lq.map(q=>r.v[q.var]?`<div><small>${esc(q.text)}</small>„${esc(r.v[q.var])}“</div>`:"").join(""); return `<div class="qa"><div><b>Fall ${p.i+1}</b> · ${esc(cut(pr.l,40))} = ${p.x}, ${esc(cut(tv.short,40))} = ${p.y} · <i>z</i> = ${de(p.z)} (${p.z>0?"höher":"niedriger"} als erwartet)</div>${quotes||'<p class="empty">Keine offenen Antworten.</p>'}</div>`; }).join("") : `<p class="empty">Keine Fälle mit |z| > 1,5.</p>`));
    }
  }

  // 7 Typenbildung
  const cl = cluster(rows); let ty = "";
  if (cl.k < 2) ty = `<p class="empty">${esc(cl.reason||"")}</p>`;
  else {
    const silTxt = cl.sil > .5 ? "deutliche" : cl.sil > .25 ? "erkennbare, aber schwache" : "kaum ausgeprägte";
    findings.push(`Clusteranalyse: ${cl.k} Typen (Silhouette ${de(cl.sil)}).`);
    ty += `<p class="body">Die Clusteranalyse über ${cl.vars.length} Merkmale ergibt <b>${cl.k} Typen</b> (mittlerer Silhouettenkoeffizient ${de(cl.sil)}; ${silTxt} Struktur). Die Typen sind nach Größe benannt.</p>`;
    const types = [...Array(cl.k).keys()];
    ty += tbl("Profile der Typen (Mittelwerte)", `<tr><th>Merkmal</th><th class="r">Gesamt</th>${types.map(t=>`<th class="r" style="color:${COLORS[t]}">Typ ${TYPE_L(t)}</th>`).join("")}</tr>`,
      `<tr><td>n</td><td class="r">${n}</td>${types.map(t=>`<td class="r">${cl.lab.filter(l=>l===t).length}</td>`).join("")}</tr>` + cl.vars.map(v=>{ const tot = S.mean(rows.map(v.get)), sd = S.sd(rows.map(v.get))||1; return `<tr><td>${esc(cut(v.short,50))}</td><td class="r">${de(tot)}</td>${types.map(t=>{ const m = S.mean(rows.filter((r,i)=>cl.lab[i]===t).map(v.get)); const zz = m==null?0:(m-tot)/sd; return `<td class="r" style="${Math.abs(zz)>=.5?`font-weight:600;color:${zz>0?"var(--c1)":"var(--c2)"}`:""}">${de(m)}</td>`; }).join("")}</tr>`; }).join(""),
      "Anmerkung. Hervorgehoben: Abweichung vom Gesamtmittel um mindestens eine halbe Standardabweichung (blau höher, orange niedriger).");
    if (tv){ const xv = cl.vars.filter(v=>v.key!==tv.key).map(v=>({v, r:Math.abs(S.spearman(rows.map(r=>[v.get(r), tv.get(r)])).r||0)})).sort((a,b)=>b.r-a.r)[0];
      if (xv) ty += `<div data-chart="scatter" data-x="${esc(xv.v.key)}"></div>`; }
    const profiles = types.map(t=>`Typ ${TYPE_L(t)} (n = ${cl.lab.filter(l=>l===t).length}): ` + cl.vars.map(v=>`${v.short} ${de(S.mean(rows.filter((r,i)=>cl.lab[i]===t).map(v.get)))}`).join("; ")).join("\n");
    AICTX.personas = {rows, cl, profiles, sig:aiSig(rows, cl.k+"")};
    ty += `<h3 class="sub">Personas</h3>` + aiBox("personas", AICTX.personas);
  }
  add("t", "Typenbildung", ty);

  // 8 Qualitative Inhaltsanalyse
  const lq = longQs();
  if (lq.length){
    AICTX.qual = {rows, sig:aiSig(rows)};
    const answers = lq.map(q=>({q, a:rows.map((r,i)=>({nr:i+1, t:r.v[q.var]})).filter(x=>x.t)}));
    add("q", "Qualitative Inhaltsanalyse", aiBox("qual", AICTX.qual) + `<h3 class="sub">Alle offenen Antworten</h3><input class="inp noprint" id="qaSearch" placeholder="In den Antworten suchen …" style="width:100%;margin-bottom:8px">` +
      answers.map(x=>`<details class="qa-group"><summary><b>${esc(x.q.text)}</b> <span class="hint">(${x.a.length} Antworten)</span></summary><div class="qa">${x.a.map(a=>`<div data-qa><small>Fall ${a.nr}${cl.k>1?` · Typ ${TYPE_L(cl.lab[a.nr-1])}`:""}</small>${esc(a.t)}</div>`).join("")}</div></details>`).join(""));
  }

  // 9 Implikationen
  AICTX.hmw = {rows, summary:findings.map(f=>"- "+f).join("\n"), sig:aiSig(rows, JSON.stringify([!!P.ai.qual, !!P.ai.personas]))};
  add("i", "Implikationen", aiBox("hmw", AICTX.hmw));

  // 10 Limitationen
  add("l", "Limitationen", `<ul class="body">${[
    n < 30 ? `Kleine Stichprobe (N = ${n}): Tests haben geringe Teststärke, nicht signifikante Ergebnisse sind kein Beleg für fehlende Effekte.` : `Stichprobe N = ${n}; die Ergebnisse gelten für diese Stichprobe, nicht automatisch für die Grundgesamtheit.`,
    "Gelegenheitsstichprobe (Verteilung über das eigene Umfeld): Selbstselektion ist wahrscheinlich, die Repräsentativität eingeschränkt.",
    "Querschnittsdaten: Zusammenhänge erlauben keine kausalen Schlüsse.",
    "Selbstauskünfte können durch soziale Erwünschtheit verzerrt sein.",
    cl.k>1 ? "Die Typen sind ein exploratives Ergebnis; mit neuen Daten können sie sich verändern." : null,
    lq.length ? "Die Kategorien der offenen Antworten sind KI-gestützt; Interpretation und Prüfung liegen beim Team (Intercoder-Abgleich empfohlen)." : null
  ].filter(Boolean).map(x=>`<li>${x}</li>`).join("")}</ul>`);

  // Anhang
  add("c", "Anhang: Codebuch", tbl("Codebuch", `<tr><th>Variable</th><th>Typ</th><th>Frage</th><th>Werte</th><th>Rolle</th></tr>`, P.questions.map(q=>`<tr><td class="mono">${esc(q.var)}</td><td>${TYPES[q.type]}</td><td>${esc(q.text)}</td><td style="font-size:12px">${q.type==="scale"?`${q.min} = ${esc(q.minLabel)} … ${q.max} = ${esc(q.maxLabel)}`:q.type==="matrix"?`Zeilen: ${q.rows.map(esc).join("; ")}<br>Stufen: ${q.cols.map(esc).join(" < ")}`:q.options.length?q.options.map((o,i)=>q.ordered?`${i+1} = ${esc(o)}`:esc(o)).join("; "):"Freitext"}</td><td style="font-size:12px">${[q.roles&&q.roles.target&&"Ziel", q.roles&&q.roles.group&&"Gruppen", q.roles&&q.roles.cluster&&"Typen"].filter(Boolean).join(", ")}</td></tr>`).join("")));

  // Kurzfassung und Ausgabe
  const abstract = `Online-Befragung${P.meta.audience?` (Zielgruppe: ${P.meta.audience})`:""} mit N = ${n} gültigen Fällen. ` + findings.slice(0,1).concat(findings.filter(f=>/Stärkster|Hypothesen|Cluster/.test(f))).join(" ");
  paper.innerHTML = `<div class="kicker">${esc([P.meta.course, "Ergebnisbericht"].filter(Boolean).join(" · "))}</div><h1>${esc(P.meta.title||"Befragung")}</h1>
    <div class="meta">${esc(P.meta.author||"")}${P.meta.author?" · ":""}Stand ${new Date().toLocaleDateString("de-DE")} · N = ${n}</div>
    <div class="abstract"><h2>Kurzfassung</h2><p id="abstractText">${esc(abstract)}</p></div>
    ${chapters.map((c,i)=>`<section class="ch" id="ch-${c.id}"><h2><span class="n">${c.id==="c"?"A":i+1}</span>${esc(c.title)}</h2>${c.html}</section>`).join("")}
    <p class="note" style="margin-top:32px">Erstellt mit dem Befragungslabor ${VERSION} (Open Source, MIT-Lizenz). Alle Berechnungen laufen lokal im Browser.</p>`;
  $("#toc").innerHTML = chapters.map((c,i)=>`<a href="#ch-${c.id}"><span>${c.id==="c"?"A":i+1}</span>${esc(c.title)}</a>`).join("");
  $$("#toc a").forEach(a=>a.onclick = e=>{ e.preventDefault(); const el = $(a.getAttribute("href")); if (el) el.scrollIntoView({behavior:"smooth"}); });

  // Diagramme einsetzen
  $$("[data-chart]").forEach(host=>{
    const [kind, vn] = host.dataset.chart.split(":"); let html = "";
    if (kind==="target"){ const x = S.nums(rows.map(tv.get)); html = fig(`Verteilung: ${tv.short}`, dotDist(x, tv.min, tv.max, host, tv.q.type==="scale"?tv.q.minLabel:tv.q.options&&tv.q.options[0], tv.q.type==="scale"?tv.q.maxLabel:tv.q.options&&tv.q.options[tv.q.options.length-1], tv.short), "Anmerkung. Jeder Punkt ist eine Person. Linie: Mittelwert, Fläche: 95 %-Konfidenzintervall."); }
    if (kind==="multi"){ const q = qByVar(vn), f = freqs(rows, q).sort((a,b)=>b.k-a.k); const others = rows.filter(r=>r.v[q.var]&&r.v[q.var].other).length; html = fig(q.text, ciDotChart(f, host, {label:q.text}), `Anmerkung. Anteil der Personen, die die Option gewählt haben (Mehrfachnennung), n = ${f[0]?f[0].n:0}. Fehlerbalken: 95 %-KI nach Wilson.${others?` ${others}× freie Angabe unter „Sonstiges“.`:""}`); }
    if (kind==="single"){ const q = qByVar(vn), f = freqs(rows, q); if (!q.ordered) f.sort((a,b)=>b.k-a.k); html = fig(q.text, ciDotChart(f, host, {label:q.text}), `Anmerkung. n = ${f[0]?f[0].n:0}. Fehlerbalken: 95 %-KI nach Wilson.`); }
    if (kind==="matrix"){ const q = qByVar(vn); const items = q.rows.map((row,i)=>{ const vals = rows.map(r=>r.v[q.var]&&r.v[q.var][i]).filter(x=>x!=null); return {l:row, n:vals.length, counts:q.cols.map((c,j)=>vals.filter(v=>v===j).length), m:S.mean(vals)}; }); if (q.ordered) items.sort((a,b)=>(b.m||0)-(a.m||0)); html = fig(q.text, stacked(items, q.cols, host, q.text), `Anmerkung. Verteilung der Antworten je Zeile${q.ordered?", sortiert nach mittlerer Zustimmung":""}.`); }
    if (kind==="forest") html = fig(`Rangkorrelationen mit ${tv.short}`, forest(corr, host, `Rangkorrelationen mit ${tv.short}`), "Anmerkung. Quadrat: r<sub>s</sub>, Linie: 95 %-KI. Rot: signifikant nach Holm-Korrektur.");
    if (kind==="scatter"){ const xv = nvByKey(host.dataset.x); const pts = rows.map((r,i)=>({x:xv.get(r), y:tv.get(r), t:cl.lab[i], tip:`Fall ${i+1} · Typ ${TYPE_L(cl.lab[i])}: ${xv.short} ${xv.get(r)}, ${tv.short} ${tv.get(r)}`})).filter(p=>p.x!=null&&p.y!=null);
      html = fig(`Typen nach ${xv.short} und ${tv.short}`, scatterXY(pts, host, xv.short, tv.short, [xv.min, xv.max], [tv.min, tv.max], p=>COLORS[p.t%COLORS.length]), `Anmerkung. Farben: ${[...Array(cl.k).keys()].map(t=>`<span style="color:${COLORS[t]}">■</span> Typ ${TYPE_L(t)}`).join(" · ")}. Punkte leicht versetzt, damit gleiche Werte sichtbar bleiben.`); }
    host.innerHTML = html;
  });
  const qs = $("#qaSearch"); if (qs) qs.oninput = ()=>{ const t = norm(qs.value); $$("[data-qa]").forEach(el=>el.style.display = !t || norm(el.textContent).includes(t) ? "" : "none"); $$("details.qa-group").forEach(dd=>{ if (t) dd.open = true; }); };
  bindAI(); bindTips();
  $("#reportStatus").textContent = `${n} Fälle · ${figN} Abbildungen · ${tabN} Tabellen`;
  if (scrollTo){ const el = $(`[data-task="${scrollTo}"]`); if (el && el.scrollIntoView) el.scrollIntoView({block:"center"}); }
}
$("#printBtn").onclick = ()=>window.print();
$("#copyReport").onclick = ()=>{ const c = $("#paper").cloneNode(true); c.querySelectorAll(".ai,.noprint,svg,details").forEach(e=>e.remove()); const txt = (c.innerText || c.textContent).replace(/\n{3,}/g,"\n\n").trim(); copy(txt, $("#reportStatus")); };
