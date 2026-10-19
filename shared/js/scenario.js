/* ArchBook 시나리오 공용 엔진
   챕터 HTML은 <main id="chapter">만 두고, window.SCENARIO 데이터로 전체 지면을 그린다.
   클라우드별로 다른 값은 {aws:'..', gcp:'..', azure:'..'} 형태로 쓰면 선택한 클라우드 값이 쓰인다.

   SCENARIO = {
     no, title, level, lede,
     req: [{k, v, s}],                                  요구사항 칸
     intro: { arch, map, dec, sim, iac, chk }            각 절 머리 문단 (선택)
     diagram: { w, h, aria,
       frames: [{id, x,y,w,h, kind, label, only}],       kind: region | net | zone | band | group | onprem | plain
       nodes:  [{id, x,y,w,h, icon, t, s, kind, only, failS}],
       edges:  [{a, b, label, dash, only, fail}],         fail: 'hide' | 'show'
       notes:  [{x, y, t, anchor, cls, only}] },
     fail: { button, restore, zones:[frameId], down:[nodeId], promote:[nodeId], normal:{v:[..]}, effects:{v:[[cls,text]]} },
     map: [serviceId],                                   shared/data/services.json의 id
     decisions: [{t, p, aws, gcp, azure, so}],
     sims: [{type, ...}],                                shared/js/sims.js
     iac: 'iac/scenario-NN',                             {aws,gcp,azure}/main.tf
     checklist: [[제목, 설명]],
     refs: [[제목, url]],
     next: '다음 장 안내'
   } */
(function(){
  const S = window.SCENARIO;
  const ROOT = document.body.dataset.root || '../../';
  const NAMES = {aws:'AWS', gcp:'GCP', azure:'Azure'};
  const LEVELS = {basic:'기초', intermediate:'중급', advanced:'고급', synthesis:'종합'};
  const LEGEND = {users:'사용자',client:'클라이언트',dns:'DNS',cdn:'CDN',edge:'CDN·WAF',waf:'WAF',lb:'로드밸런서',gslb:'글로벌 트래픽',nat:'NAT',igw:'인터넷 게이트웨이',
    vm:'VM',gpu:'GPU VM',autoscale:'오토스케일',db:'관계형 DB',pg:'PostgreSQL',nosql:'NoSQL',obj:'오브젝트 스토리지',files:'파일 스토리지',cache:'캐시',secret:'시크릿',
    kms:'키 관리',mon:'모니터링',logs:'로그',audit:'감사 로그',net:'가상 네트워크',sub:'서브넷',fw:'방화벽',privlink:'비공개 연결',bastion:'관리 접속',
    apigw:'API 게이트웨이',func:'함수',run:'서버리스 컨테이너',k8s:'쿠버네티스',registry:'컨테이너 레지스트리',queue:'큐',topic:'토픽',eventbus:'이벤트 버스',
    stream:'스트림',workflow:'워크플로',dwh:'데이터 웨어하우스',etl:'ETL',query:'서버리스 쿼리',lakegov:'데이터 거버넌스',vpn:'VPN',dedicated:'전용선',
    router:'라우팅 허브',iam:'IAM',org:'조직',account:'계정',guard:'가드레일',sechub:'보안 현황',backup:'백업',ml:'ML 플랫폼',llm:'LLM',search:'벡터 검색',
    auth:'사용자 인증',cost:'비용',onprem:'온프레미스'};

  let vendor = 'aws', failed = false, MAP = null, CODE = {aws:null, gcp:null, azure:null};
  try{ const s = localStorage.getItem('archbook-vendor'); if (NAMES[s]) vendor = s; }catch(e){}

  const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const isPV = x => x && typeof x === 'object' && !Array.isArray(x) && ('aws' in x || 'gcp' in x || 'azure' in x);
  const pv = x => isPV(x) ? x[vendor] : x;
  const shown = o => !o.only || o.only.includes(vendor);
  const $ = id => document.getElementById(id);

  /* ---------- 지면 뼈대 ---------- */
  const I = S.intro || {};
  const pad = n => String(n).padStart(2,'0');
  const sec = (n, id, title, intro, inner) => `<section id="${id}"><span class="secno">${S.no}.${n}</span><h2>${esc(title)}</h2>${intro?`<p>${intro}</p>`:''}${inner}</section>`;
  let n = 0;
  const parts = [];
  parts.push(sec(++n,'req','요구사항', I.req || '이 숫자들이 뒤의 모든 설계 결정을 정합니다.',
    `<dl class="req">${S.req.map(r=>`<div><dt>${esc(r.k)}</dt><dd>${esc(r.v)}<small>${esc(r.s||'')}</small></dd></div>`).join('')}</dl>`));
  parts.push(sec(++n,'arch','아키텍처 도면', I.arch || '',
    `<div class="figure"><div class="fig-tools"><span class="t" id="figTitle"></span>${S.fail?`<button type="button" class="btn" id="failBtn" aria-pressed="false"></button>`:''}</div>
     <div class="scroll"><svg id="diagram" viewBox="0 0 ${S.diagram.w} ${S.diagram.h}" style="min-width:${Math.min(S.diagram.w,680)}px" role="img" aria-label="${esc(S.diagram.aria||S.title+' 아키텍처 도면')}"></svg></div>
     <div class="legend" id="legend" aria-label="아이콘 범례"></div><div class="effects" id="effects"></div></div>`));
  if (S.map) parts.push(sec(++n,'map','리소스 매핑표', I.map || '같은 역할을 하는 리소스를 한 줄에 놓았습니다. 이름이 비슷해도 <b>범위</b>가 다르면 설계가 달라집니다.', `<div class="tbl"><table id="mapTable"></table></div>`));
  if (S.decisions) parts.push(sec(++n,'dec','세 클라우드가 갈리는 설계 결정', I.dec || '서비스 이름만 바꿔 끼우면 놓치는 지점들입니다.', `<div class="decisions" id="decisions"></div>`));
  if (S.sims && S.sims.length) parts.push(sec(++n,'sim','설계 시뮬레이터', I.sim || '결과를 먼저 예측해 본 뒤 값을 움직여 확인하세요.', S.sims.map((_,i)=>`<div class="sim" id="sim${i}"></div>`).join('')));
  if (S.iac) parts.push(sec(++n,'iac','IaC 골격 (Terraform)', I.iac || '클라우드마다 달라지는 핵심 설정만 추린 골격입니다. 필수 인자 일부를 생략했으므로 그대로 적용되지는 않습니다.',
    `<div class="code"><div class="code-h"><span id="codeName"></span><button type="button" class="btn" id="copyBtn">복사</button></div><pre id="codeBox"></pre></div>`));
  if (S.checklist) parts.push(sec(++n,'mistakes','흔한 실수 점검표', (I.chk || '설계 리뷰 때 그대로 쓸 수 있습니다. 해당 없음을 확인한 항목에 체크하세요.') + ' <span class="progress" id="chkProg"></span>', `<ul class="check" id="checklist"></ul>`));

  const main = $('chapter');
  main.innerHTML = `
    <header class="top"><div class="eyebrow">ArchBook · 시나리오 ${pad(S.no)} · ${LEVELS[S.level]||''}</div>
    <h1>${esc(S.title)}</h1><p class="lede">${S.lede}</p></header>
    ${parts.join('')}
    <footer><b>더 읽을 곳</b><ul>${(S.refs||[]).map(r=>`<li><a href="${esc(r[1])}" target="_blank" rel="noopener">${esc(r[0])}</a></li>`).join('')}</ul>
    <p>서비스 이름과 동작은 ${esc(S.checked||'2026년 10월')} 기준으로 정리했습니다. SKU·요금제·리전에 따라 동작이 다를 수 있으므로 실제 설계 전에 각 사 문서로 다시 확인하세요.${S.next?' 다음 장: '+esc(S.next)+'.':''}</p>
    <p><a href="../">ArchBook 목차로</a></p></footer>`;
  document.title = `${S.title} · ArchBook`;

  /* ---------- 도면 ---------- */
  function box(x,y,w,h,cls,r){ return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r==null?6:r}" class="${cls}"/>`; }
  function txt(x,y,s,cls,a){ return `<text x="${x}" y="${y}" class="${cls}" text-anchor="${a||'start'}">${esc(s)}</text>`; }
  function icon(ic, x, y, t){
    const u = CloudIcons.url(ic, vendor);
    if (u) return `<image href="${u}" x="${x}" y="${y}" width="${t}" height="${t}"/>`;
    return box(x,y,t,t,'ic-bg',5) + `<use href="#g-${CloudIcons.glyph(ic)}" class="gl" x="${x+t*.14}" y="${y+t*.14}" width="${t*.72}" height="${t*.72}"/>`;
  }
  function node(o, down, promo){
    const h = o.h || 44, w = o.w || 170;
    const cls = ['n', o.kind||'', promo?'promo':''].join(' ');
    let s = box(o.x,o.y,w,h,cls,5);
    let tx = o.x + w/2, an = 'middle';
    const ic = pv(o.icon);
    if (ic){ const t = Math.min(26, h-10); s += icon(ic, o.x+6, o.y+(h-t)/2, t); tx = o.x + t + 13; an = 'start'; }
    const t1 = pv(o.t), t2 = (failed && o.failS) ? pv(o.failS) : pv(o.s);
    if (t2){ s += txt(tx, o.y+h/2-2, t1, 'lab-n', an) + txt(tx, o.y+h/2+12, t2, 'lab-sub', an); }
    else s += txt(tx, o.y+h/2+4, t1, 'lab-n', an);
    return `<g class="${down?'is-down':''}">${s}</g>`;
  }
  function anchor(o, tx, ty){
    const w = o.w||170, h = o.h||44, cx = o.x+w/2, cy = o.y+h/2;
    const dx = tx-cx, dy = ty-cy;
    if (!dx && !dy) return [cx,cy];
    const sx = dx ? (w/2)/Math.abs(dx) : Infinity, sy = dy ? (h/2)/Math.abs(dy) : Infinity;
    const k = Math.min(sx, sy);
    return [cx+dx*k, cy+dy*k];
  }
  function render(){
    const D = S.diagram, F = S.fail || {};
    const nodes = D.nodes.filter(shown), byId = {};
    nodes.forEach(o => byId[o.id] = o);
    const downSet = new Set(failed ? (F.down||[]) : []);
    const promoSet = new Set(failed ? (F.promote||[]) : []);
    let s = `<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="arrow"/></marker></defs>`;
    const FK = {region:'f-region', net:'f-net', zone:'f-zone', band:'f-band', group:'grp', onprem:'f-onprem', plain:'f-sub'};
    D.frames.filter(shown).forEach(f => {
      s += box(f.x,f.y,f.w,f.h,FK[f.kind]||'f-sub', f.kind==='band'?6:8);
      const lab = pv(f.label);
      if (lab){
        const cls = f.kind==='net'||f.kind==='group' ? 'lab-acc' : (f.kind==='zone' ? 'lab-z' : 'lab-s');
        if (f.kind==='zone' || f.kind==='band' || f.labelRight) s += txt(f.x+f.w-8, f.y+14, lab, cls, 'end');
        else s += txt(f.x+10, f.y+16, lab, cls);
      }
    });
    const labels = [];
    (D.edges||[]).filter(shown).forEach(e => {
      if (e.fail==='hide' && failed) return;
      if (e.fail==='show' && !failed) return;
      const A = byId[e.a], B = byId[e.b]; if (!A||!B) return;
      const bc = [B.x+(B.w||170)/2, B.y+(B.h||44)/2], ac = [A.x+(A.w||170)/2, A.y+(A.h||44)/2];
      const p1 = anchor(A, bc[0], bc[1]), p2 = anchor(B, ac[0], ac[1]);
      const dead = downSet.has(e.a) || downSet.has(e.b);
      s += `<path d="M${p1[0].toFixed(1)} ${p1[1].toFixed(1)} L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}" class="e ${e.dash?'rep':''} ${dead?'dead':''}" ${e.dash==='both'?'':'marker-end="url(#ar)"'}/>`;
      const lab = pv(e.label);
      if (lab) labels.push(txt((p1[0]+p2[0])/2 + (e.lx||0), (p1[1]+p2[1])/2 - 4 + (e.ly||0), lab, 'lab-e', 'middle'));
    });
    nodes.forEach(o => s += node(o, downSet.has(o.id), promoSet.has(o.id)));
    s += labels.join('');
    (D.notes||[]).filter(shown).forEach(t => { if (t.fail==='show' && !failed) return; s += txt(t.x, t.y, pv(t.t), t.cls||'lab-s', t.anchor||'start'); });
    if (failed) (F.zones||[]).forEach(id => {
      const f = D.frames.find(x => x.id===id && shown(x)); if (!f) return;
      s += box(f.x,f.y,f.w,f.h,'down-ov',8) + txt(f.x+f.w/2, f.y+f.h/2, '✕ '+(F.zoneLabel||'장애'), 'lab-fail', 'middle');
    });
    $('diagram').innerHTML = s;

    $('figTitle').innerHTML = `<span class="vtag">${NAMES[vendor]}</span>${esc(pv(S.region)||'')}`;
    const eff = $('effects');
    if (F && failed) eff.innerHTML = `<h3>${esc(F.title||'장애 시 일어나는 일')}</h3><ul>${(pv(F.effects)||[]).map(f=>`<li class="${f[0]}">${esc(f[1])}</li>`).join('')}</ul>`;
    else eff.innerHTML = `<h3>정상 흐름</h3><ul>${(pv(F.normal||S.normal)||[]).map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`;
    const fb = $('failBtn');
    if (fb){ fb.setAttribute('aria-pressed', failed); fb.textContent = failed ? (F.restore||'복구') : F.button; }
    const used = [...new Set(nodes.map(o=>pv(o.icon)).filter(Boolean))];
    $('legend').innerHTML = used.map(k=>`<span>${CloudIcons.tile(k, vendor)}${esc(LEGEND[k]||k)}</span>`).join('');
  }

  /* ---------- 매핑표 ---------- */
  function renderMap(){
    const el = $('mapTable'); if (!el) return;
    if (!MAP){ el.innerHTML = '<caption class="load-err">매핑 데이터를 불러오지 못했습니다. 저장소 루트에서 python3 -m http.server로 열어 주세요.</caption>'; return; }
    const idx = {aws:0,gcp:1,azure:2}[vendor];
    const rows = S.map.map(id => MAP[id]).filter(Boolean);
    const h = ['aws','gcp','azure'].map((v,i)=>`<th scope="col" class="v-${v} ${i===idx?'on':''}">${NAMES[v]}</th>`).join('');
    el.innerHTML = `<thead><tr><th scope="col">역할</th>${h}</tr></thead><tbody>${rows.map(r=>`<tr><th scope="row">${CloudIcons.tile(r.icon, vendor)}${esc(r.role)}</th>${
      ['aws','gcp','azure'].map((v,i)=>`<td class="${i===idx?'on':''}">${esc(r[v].name)}${r[v].scope?`<span class="k">${esc(r[v].scope)}</span>`:''}</td>`).join('')}</tr>`).join('')}</tbody>`;
  }

  /* ---------- 설계 결정 ---------- */
  function renderDec(){
    const el = $('decisions'); if (!el) return;
    el.innerHTML = S.decisions.map(d=>`<article class="dec"><h3>${esc(d.t)}</h3><p>${esc(d.p)}</p>
      <dl class="v">${['aws','gcp','azure'].map(k=>`<dt class="v-${k}">${NAMES[k]}</dt><dd class="${k===vendor?'on':''}">${esc(d[k])}</dd>`).join('')}</dl>
      <p class="so"><b>그래서</b> ${esc(d.so)}</p></article>`).join('');
  }

  /* ---------- 코드 ---------- */
  function hl(src){
    return esc(src).split('\n').map(l=>{
      const i = l.indexOf('#'); let a = i>=0 ? l.slice(0,i) : l; const c = i>=0 ? l.slice(i) : '';
      a = a.replace(/"([^"]*)"/g,'<span class="s">"$1"</span>');
      return a + (c?`<span class="c">${c}</span>`:'');
    }).join('\n');
  }
  function renderCode(){
    if (!S.iac) return;
    $('codeName').textContent = `${S.iac}/${vendor}/main.tf`;
    const c = CODE[vendor];
    $('codeBox').innerHTML = c==null ? '불러오는 중…' : c===false ? '<span class="s">Terraform 파일을 불러오지 못했습니다. 저장소 루트에서 python3 -m http.server로 열어 주세요.</span>' : hl(c);
  }

  /* ---------- 점검표 ---------- */
  function renderChk(){
    const el = $('checklist'); if (!el) return;
    el.innerHTML = S.checklist.map((c,i)=>`<li><input type="checkbox" id="chk${i}"><label for="chk${i}"><b>${esc(c[0])}</b><span>${esc(c[1])}</span></label></li>`).join('');
    const upd = ()=>{ $('chkProg').textContent = `${el.querySelectorAll('input:checked').length} / ${S.checklist.length} 확인`; };
    el.addEventListener('change', upd); upd();
  }

  /* ---------- 클라우드 전환 ---------- */
  function setVendor(v){
    vendor = v; document.body.dataset.vendor = v;
    try{ localStorage.setItem('archbook-vendor', v); }catch(e){}
    document.querySelectorAll('#vendorSeg button').forEach(b=>b.setAttribute('aria-pressed', b.dataset.v===v));
    render(); renderMap(); renderDec(); renderCode();
    if (window.CloudSims) CloudSims.vendorChanged(v);
  }
  document.querySelectorAll('#vendorSeg button').forEach(b=>b.addEventListener('click',()=>setVendor(b.dataset.v)));
  const fb = $('failBtn'); if (fb) fb.addEventListener('click',()=>{ failed = !failed; render(); });
  const cb = $('copyBtn');
  if (cb) cb.addEventListener('click', e=>{
    const b = e.currentTarget, t = CODE[vendor] || '';
    const done = ok=>{ b.textContent = ok?'복사됨':'선택됨'; setTimeout(()=>b.textContent='복사',1500); };
    const sel = ()=>{ const r=document.createRange(); r.selectNodeContents($('codeBox')); const s=getSelection(); s.removeAllRanges(); s.addRange(r); };
    try{ navigator.clipboard.writeText(t).then(()=>done(true),()=>{sel();done(false);}); }catch(err){ sel(); done(false); }
  });

  if (window.CloudSims) (S.sims||[]).forEach((cfg,i)=>CloudSims.mount($('sim'+i), cfg, vendor));
  renderChk();
  setVendor(vendor);

  fetch(ROOT+'shared/data/services.json').then(r=>{ if(!r.ok) throw 0; return r.json(); }).then(d=>{
    MAP = {}; d.services.forEach(s=>MAP[s.id]=s);
  }).catch(()=>{}).finally(renderMap);
  if (S.iac) Promise.all(['aws','gcp','azure'].map(v=>fetch(ROOT+S.iac+'/'+v+'/main.tf').then(r=>{ if(!r.ok) throw 0; return r.text(); })
    .then(t=>{ CODE[v]=t.replace(/\n$/,''); }).catch(()=>{ CODE[v]=false; }))).then(renderCode);
  CloudIcons.ready.then(()=>{ render(); renderMap(); });
  window.ArchBook = { get vendor(){ return vendor; } };
})();
