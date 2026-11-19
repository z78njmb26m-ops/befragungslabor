/* ---------- Statistik ---------- */
const S = {};
S.nums = a => a.filter(x => typeof x === "number" && !isNaN(x));
S.mean = a => { a = S.nums(a); return a.length ? a.reduce((s,x)=>s+x,0)/a.length : null; };
S.sd = a => { a = S.nums(a); if (a.length < 2) return null; const m = S.mean(a); return Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1)); };
S.quantile = (a, q) => { a = S.nums(a).slice().sort((x,y)=>x-y); if (!a.length) return null; const p = (a.length-1)*q, lo = Math.floor(p), hi = Math.ceil(p); return a[lo] + (a[hi]-a[lo])*(p-lo); };
S.median = a => S.quantile(a, .5);
S.T975 = [0,12.706,4.303,3.182,2.776,2.571,2.447,2.365,2.306,2.262,2.228,2.201,2.179,2.160,2.145,2.131,2.120,2.110,2.101,2.093,2.086,2.080,2.074,2.069,2.064,2.060,2.056,2.052,2.048,2.045,2.042];
S.tcrit = df => df <= 0 ? null : df <= 30 ? S.T975[df] : df <= 60 ? 2.0 : df <= 120 ? 1.98 : 1.96;
S.meanCI = a => { a = S.nums(a); const n = a.length; if (n < 2) return null; const m = S.mean(a), se = S.sd(a)/Math.sqrt(n), t = S.tcrit(n-1); return [m - t*se, m + t*se]; };
S.wilson = (k, n, z = 1.96) => { if (!n) return [null, null]; const p = k/n, d = 1 + z*z/n, c = p + z*z/(2*n), h = z*Math.sqrt(p*(1-p)/n + z*z/(4*n*n)); return [Math.max(0,(c-h)/d), Math.min(1,(c+h)/d)]; };
S.erf = x => { const s = Math.sign(x); x = Math.abs(x); const t = 1/(1+0.3275911*x); const y = 1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x); return s*y; };
S.phi = z => 0.5*(1+S.erf(z/Math.SQRT2));
S.lgamma = x => { const c=[76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,0.1208650973866179e-2,-0.5395239384953e-5]; let y=x, t=x+5.5; t -= (x+0.5)*Math.log(t); let s=1.000000000190015; for (const ci of c) s += ci/++y; return -t+Math.log(2.5066282746310005*s/x); };
S.betacf = (a,b,x) => { const MAXIT=200, EPS=3e-12, FPMIN=1e-300; let qab=a+b, qap=a+1, qam=a-1, c=1, d=1-qab*x/qap; if (Math.abs(d)<FPMIN) d=FPMIN; d=1/d; let h=d;
  for (let m=1;m<=MAXIT;m++){ const m2=2*m; let aa=m*(b-m)*x/((qam+m2)*(a+m2)); d=1+aa*d; if(Math.abs(d)<FPMIN)d=FPMIN; c=1+aa/c; if(Math.abs(c)<FPMIN)c=FPMIN; d=1/d; h*=d*c;
    aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2)); d=1+aa*d; if(Math.abs(d)<FPMIN)d=FPMIN; c=1+aa/c; if(Math.abs(c)<FPMIN)c=FPMIN; d=1/d; const del=d*c; h*=del; if(Math.abs(del-1)<EPS)break; } return h; };
S.ibeta = (x,a,b) => { if (x<=0) return 0; if (x>=1) return 1; const bt = Math.exp(S.lgamma(a+b)-S.lgamma(a)-S.lgamma(b)+a*Math.log(x)+b*Math.log(1-x)); return x < (a+1)/(a+b+2) ? bt*S.betacf(a,b,x)/a : 1-bt*S.betacf(b,a,1-x)/b; };
S.tTwoSided = (t, df) => S.ibeta(df/(df+t*t), df/2, 0.5);
S.rank = a => { const idx = a.map((v,i)=>[v,i]).sort((x,y)=>x[0]-y[0]); const r = new Array(a.length); let i = 0;
  while (i < idx.length){ let j = i; while (j+1 < idx.length && idx[j+1][0] === idx[i][0]) j++; const avg = (i+j)/2 + 1; for (let k=i;k<=j;k++) r[idx[k][1]] = avg; i = j+1; } return r; };
S.pearson = (x, y) => { const n = x.length, mx = S.mean(x), my = S.mean(y); let sxy=0, sxx=0, syy=0; for (let i=0;i<n;i++){ sxy+=(x[i]-mx)*(y[i]-my); sxx+=(x[i]-mx)**2; syy+=(y[i]-my)**2; } return sxx && syy ? sxy/Math.sqrt(sxx*syy) : null; };
S.spearman = (pairs) => { pairs = pairs.filter(([a,b]) => typeof a==="number" && typeof b==="number"); const n = pairs.length; if (n < 4) return {n, r:null};
  const r = S.pearson(S.rank(pairs.map(p=>p[0])), S.rank(pairs.map(p=>p[1]))); if (r == null) return {n, r:null};
  const rr = Math.max(-0.9999, Math.min(0.9999, r)); const t = rr*Math.sqrt((n-2)/(1-rr*rr)); const p = S.tTwoSided(t, n-2);
  let ci = null; if (n > 3){ const z = Math.atanh(rr), se = Math.sqrt(1.06/(n-3)); ci = [Math.tanh(z-1.96*se), Math.tanh(z+1.96*se)]; }
  return {n, r, p, ci}; };
S.mannWhitney = (x, y) => { x = S.nums(x); y = S.nums(y); const n1 = x.length, n2 = y.length; if (n1 < 2 || n2 < 2) return {n1, n2, U:null};
  const all = x.concat(y), r = S.rank(all); const R1 = r.slice(0,n1).reduce((s,v)=>s+v,0); const U1 = R1 - n1*(n1+1)/2, U = Math.min(U1, n1*n2-U1);
  const N = n1+n2; const counts = {}; all.forEach(v=>counts[v]=(counts[v]||0)+1); const tie = Object.values(counts).reduce((s,t)=>s+(t**3-t),0);
  const sigma = Math.sqrt(n1*n2/12*((N+1) - tie/(N*(N-1)))); const z = sigma ? (Math.abs(U1 - n1*n2/2) - 0.5)/sigma : 0; const p = sigma ? Math.min(1, 2*(1-S.phi(Math.max(0,z)))) : 1;
  let gt=0, lt=0; for (const a of x) for (const b of y){ if (a>b) gt++; else if (a<b) lt++; } const delta = (gt-lt)/(n1*n2);
  return {n1, n2, U, z, p, r: z/Math.sqrt(N), delta, mdn1:S.median(x), mdn2:S.median(y)}; };
S.holm = ps => { const idx = ps.map((p,i)=>[p,i]).filter(x=>x[0]!=null).sort((a,b)=>a[0]-b[0]); const m = idx.length, out = ps.map(()=>null); let prev = 0;
  idx.forEach(([p,i],k)=>{ const adj = Math.min(1, Math.max(prev, (m-k)*p)); out[i] = adj; prev = adj; }); return out; };
S.rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
S.dist = (a,b) => Math.sqrt(a.reduce((s,v,i)=>s+(v-b[i])**2,0));
S.kmeans = (X, k, seed = 7, inits = 30) => { const rnd = S.rng(seed); let best = null;
  for (let it=0; it<inits; it++){
    const C = [X[Math.floor(rnd()*X.length)].slice()];
    while (C.length < k){ const d = X.map(x=>Math.min(...C.map(c=>S.dist(x,c)))**2), tot = d.reduce((s,v)=>s+v,0); let r = rnd()*tot, j = 0; while (j < X.length-1 && (r -= d[j]) > 0) j++; C.push(X[j].slice()); }
    let lab = new Array(X.length).fill(0);
    for (let iter=0; iter<100; iter++){ const nl = X.map(x=>{ let bi=0, bd=Infinity; C.forEach((c,ci)=>{ const dd=S.dist(x,c); if (dd<bd){bd=dd;bi=ci;} }); return bi; });
      const changed = nl.some((v,i)=>v!==lab[i]); lab = nl;
      for (let c=0;c<k;c++){ const m = X.filter((_,i)=>lab[i]===c); if (m.length) C[c] = m[0].map((_,d)=>S.mean(m.map(v=>v[d]))); }
      if (!changed && iter>0) break; }
    if (new Set(lab).size < k) continue;
    const sse = X.reduce((s,x,i)=>s+S.dist(x,C[lab[i]])**2,0);
    if (!best || sse < best.sse) best = {lab, C, sse}; }
  return best; };
S.silhouette = (X, lab) => { const ks = [...new Set(lab)]; if (ks.length < 2) return null; const s = X.map((x,i)=>{
    const own = X.filter((_,j)=>j!==i && lab[j]===lab[i]); if (!own.length) return 0; const a = S.mean(own.map(y=>S.dist(x,y)));
    const b = Math.min(...ks.filter(k=>k!==lab[i]).map(k=>S.mean(X.filter((_,j)=>lab[j]===k).map(y=>S.dist(x,y)))));
    return (b-a)/Math.max(a,b); }); return S.mean(s); };
S.gammaP = (a, x) => { if (x <= 0) return 0; if (x < a+1){ let sum = 1/a, del = sum, ap = a; for (let n=0;n<200;n++){ ap++; del *= x/ap; sum += del; if (Math.abs(del) < Math.abs(sum)*1e-12) break; } return sum*Math.exp(-x + a*Math.log(x) - S.lgamma(a)); }
  let b = x+1-a, c = 1/1e-300, d = 1/b, h = d; for (let i=1;i<200;i++){ const an = -i*(i-a); b += 2; d = an*d + b; if (Math.abs(d)<1e-300) d=1e-300; c = b + an/c; if (Math.abs(c)<1e-300) c=1e-300; d = 1/d; const del = d*c; h *= del; if (Math.abs(del-1)<1e-12) break; }
  return 1 - Math.exp(-x + a*Math.log(x) - S.lgamma(a))*h; };
S.chi2p = (x, df) => 1 - S.gammaP(df/2, x/2);
S.kruskal = groups => { groups = groups.map(S.nums).filter(g=>g.length>=2); const k = groups.length; if (k < 2) return {k, H:null};
  const all = groups.flat(), N = all.length, r = S.rank(all); let idx = 0, H = 0;
  for (const g of groups){ const R = r.slice(idx, idx+g.length).reduce((s,v)=>s+v,0); H += R*R/g.length; idx += g.length; }
  H = 12/(N*(N+1))*H - 3*(N+1); const counts = {}; all.forEach(v=>counts[v]=(counts[v]||0)+1); const tie = Object.values(counts).reduce((s,t)=>s+(t**3-t),0); const C = 1 - tie/(N**3-N); if (C>0) H /= C;
  return {k, N, H, df:k-1, p: S.chi2p(H, k-1), eps2: H/((N*N-1)/(N+1)), ns: groups.map(g=>g.length), mdns: groups.map(S.median)}; };
