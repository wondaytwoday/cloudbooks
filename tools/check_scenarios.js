// 시나리오 데이터 구조 검사 (tools/check.py가 node가 있으면 호출한다)
// cfg 키가 configs.js에 있는지, 엣지·구축 단계·장애 대상 id가 도면에 있는지, 설정 항목에 세 클라우드 값이 모두 있는지 본다.
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const load = f => { const window = {}; eval(fs.readFileSync(path.join(ROOT, f), 'utf8')); return window; };
const errs = [];
const CFG = load('shared/data/configs.js').CONFIGS;
const V = ['aws','gcp','azure'];
for (const [k, c] of Object.entries(CFG)) {
  if (k === 'checked') continue;
  for (const v of V) {
    const x = c[v];
    if (!x) { errs.push(`configs.js ${k}: ${v} 없음`); continue; }
    for (const f of ['name','scope','where','steps','fields','tf']) if (!x[f]) errs.push(`configs.js ${k}.${v}: ${f} 없음`);
  }
}
const pv = (x, v) => (x && typeof x === 'object' && !Array.isArray(x) && V.some(k => k in x)) ? x[v] : x;
for (const f of fs.readdirSync(path.join(ROOT, 'archbook/chapters')).filter(f => f.endsWith('.data.js'))) {
  const S = load('archbook/chapters/' + f).SCENARIO;
  for (const v of V) {
    const D = pv(S.diagram, v);
    const ids = new Set([...D.nodes, ...D.frames].map(o => o.id));
    const nodeIds = new Set(D.nodes.map(o => o.id));
    for (const o of [...D.nodes, ...D.frames]) {
      const key = pv(o.cfg, v);
      if (key && !CFG[key]) errs.push(`${f} ${v} ${o.id}: 없는 설정 키 ${key}`);
    }
    for (const e of D.edges || []) for (const id of [e.a, e.b]) if (!nodeIds.has(id)) errs.push(`${f} ${v}: 엣지가 없는 노드 ${id}를 가리킴`);
    if (S.build) for (const [i, b] of (S.build[v] || []).entries()) {
      if (b.cfg && !CFG[b.cfg]) errs.push(`${f} ${v} 구축 ${i + 1}: 없는 설정 키 ${b.cfg}`);
      for (const id of b.nodes || []) if (!ids.has(id)) errs.push(`${f} ${v} 구축 ${i + 1}: 도면에 없는 id ${id}`);
    }
  }
  for (const k of S.scope || []) if (!CFG[k]) errs.push(`${f}: 범위표에 없는 설정 키 ${k}`);
  for (const fl of S.flows || []) for (const v of V) {
    if (fl.only && !fl.only.includes(v)) continue;
    const D = pv(S.diagram, v), ids = new Set([...D.nodes, ...D.frames].map(o => o.id));
    const hops = pv(fl.hops, v);
    if (!hops || !hops.length) { errs.push(`${f} 경로 ${fl.id}: ${v} 홉 없음`); continue; }
    for (const h of hops) {
      if (h.n && !ids.has(h.n)) errs.push(`${f} 경로 ${fl.id} ${v}: 도면에 없는 id ${h.n}`);
      if (h.cfg && !CFG[h.cfg]) errs.push(`${f} 경로 ${fl.id} ${v}: 없는 설정 키 ${h.cfg}`);
    }
  }
}
errs.forEach(e => console.log('오류: ' + e));
process.exit(errs.length ? 1 : 0);
