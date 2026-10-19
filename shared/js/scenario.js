/* ArchBook 시나리오 공용 엔진
   챕터 HTML은 <main id="chapter">만 두고, window.SCENARIO 데이터로 전체 지면을 그린다.
   클라우드별로 다른 값은 {aws:'..', gcp:'..', azure:'..'} 형태로 쓰면 선택한 클라우드 값이 쓰인다.

   SCENARIO = {
     no, title, level, lede,
     req: [{k, v, s}],                                  요구사항 칸
     intro: { arch, map, dec, sim, iac, chk }            각 절 머리 문단 (선택)
     diagram: { w, h, aria,                              diagram 전체를 {aws:{..}, gcp:{..}, azure:{..}}로 써도 된다
       노드·프레임에 cfg:'igw'를 주면 누를 수 있고, shared/data/configs.js의 설정 화면이 열린다.
       노드 kind: ghost(직접 만들지 않는 자동 리소스) | chip(방화벽·라우팅처럼 붙는 설정, 작은 꼬리표)
       frames: [{id, x,y,w,h, kind, label, only}],       kind: region | net | zone | band | group | onprem | plain
       nodes:  [{id, x,y,w,h, icon, t, s, kind, only, failS}],
       edges:  [{a, b, label, dash, only, fail}],         fail: 'hide' | 'show'
       notes:  [{x, y, t, anchor, cls, only}] },
     fail: { button, restore, zones:[frameId], down:[nodeId], promote:[nodeId], normal:{v:[..]}, effects:{v:[[cls,text]]} },
     map: [serviceId],                                   shared/data/services.json의 id
     decisions: [{t, p, aws, gcp, azure, so}],
     sims: [{type, ...}],                                shared/js/sims.js
     scope: [configKey],                                 설정 범위 비교표 행
     build: {aws:[{t, d, cfg, nodes:[id]}], gcp:[..], azure:[..]},   구축 순서
     flows: [{id, t, hops:{aws:[{n:노드id, t:'거치는 곳', r:'적용되는 설정', cfg, ok:false면 여기서 차단}], ..}, note:{..}}]  통신 경로 추적
     iac: 'iac/scenario-NN',                             {aws,gcp,azure}/main.tf
     checklist: [[제목, 설명]],
     refs: [[제목, url]],
     next: '다음 장 안내'
   } */
(function(){
  const S = window.SCENARIO;
  const ROOT = document.body.dataset.root || '../../';
  const NAMES = {aws:'AWS', gcp:'GCP', azure:'Azure'};
  const LEVELS = {basic:'기초', intermediate:'중급', advanced:'고급', synthesis:'종합', network:'네트워크 실전', hybrid:'전용선 하이브리드'};
  const LEGEND = {users:'사용자',client:'클라이언트',dns:'DNS',cdn:'CDN',edge:'CDN·WAF',waf:'WAF',lb:'로드밸런서',gslb:'글로벌 트래픽',nat:'NAT',igw:'인터넷 게이트웨이',
    vm:'VM',gpu:'GPU VM',autoscale:'오토스케일',db:'관계형 DB',pg:'PostgreSQL',nosql:'NoSQL',obj:'오브젝트 스토리지',files:'파일 스토리지',cache:'캐시',secret:'시크릿',
    kms:'키 관리',mon:'모니터링',logs:'로그',audit:'감사 로그',net:'가상 네트워크',sub:'서브넷',fw:'방화벽',privlink:'비공개 연결',bastion:'관리 접속',
    apigw:'API 게이트웨이',func:'함수',run:'서버리스 컨테이너',k8s:'쿠버네티스',registry:'컨테이너 레지스트리',queue:'큐',topic:'토픽',eventbus:'이벤트 버스',
    stream:'스트림',workflow:'워크플로',dwh:'데이터 웨어하우스',etl:'ETL',query:'서버리스 쿼리',lakegov:'데이터 거버넌스',vpn:'VPN',dedicated:'전용선',
    router:'라우팅 허브',iam:'IAM',org:'조직',account:'계정',guard:'가드레일',sechub:'보안 현황',backup:'백업',ml:'ML 플랫폼',llm:'LLM',search:'벡터 검색',
    auth:'사용자 인증',cost:'비용',onprem:'온프레미스',gk8s:'쿠버네티스 (공통)',gdb:'DB (공통)',gobj:'스토리지 (공통)'};

  let vendor = 'aws', failed = false, MAP = null, CODE = {aws:null, gcp:null, azure:null};
  try{ const s = localStorage.getItem('archbook-vendor'); if (NAMES[s]) vendor = s; }catch(e){}

  const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const isPV = x => x && typeof x === 'object' && !Array.isArray(x) && ('aws' in x || 'gcp' in x || 'azure' in x);
  const pv = x => isPV(x) ? x[vendor] : x;
  const shown = o => !o.only || o.only.includes(vendor);
  const $ = id => document.getElementById(id);

  /* ---------- 지면 뼈대 ---------- */
  const I = S.intro || {};
  const CFG = window.CONFIGS || {};
  const DIAGS = isPV(S.diagram) ? Object.values(S.diagram) : [S.diagram];
  const HAS_CFG = DIAGS.some(d => d.nodes.some(o=>o.cfg) || d.frames.some(f=>f.cfg));
  let sel = null, hl = new Set();   // sel: {id?, key}
  let flow = null;                   // 선택한 통신 경로 id
  const pad = n => String(n).padStart(2,'0');
  const sec = (n, id, title, intro, inner) => `<section id="${id}"><span class="secno">${S.no}.${n}</span><h2>${esc(title)}</h2>${intro?`<p>${intro}</p>`:''}${inner}</section>`;
  let n = 0;
  const parts = [];
  parts.push(sec(++n,'req','요구사항', I.req || '이 숫자들이 뒤의 모든 설계 결정을 정합니다.',
    `<dl class="req">${S.req.map(r=>`<div><dt>${esc(r.k)}</dt><dd>${esc(r.v)}<small>${esc(r.s||'')}</small></dd></div>`).join('')}</dl>`));
  parts.push(sec(++n,'arch','아키텍처 도면', I.arch || '',
    `<div class="figure"><div class="fig-tools"><span class="t" id="figTitle"></span>${S.fail?`<button type="button" class="btn" id="failBtn" aria-pressed="false"></button>`:''}</div>
     ${S.flows?`<div class="flowbar"><span class="fl-l">통신 경로 추적</span><div class="fl-list" id="flowList" role="group" aria-label="통신 경로 고르기"></div></div>`:''}
     <div class="scroll"><svg id="diagram" viewBox="0 0 ${DIAGS[0].w} ${DIAGS[0].h}" role="img" aria-label="${esc(S.diagram.aria||S.title+' 아키텍처 도면')}"></svg></div>
     ${HAS_CFG?`<p class="howto">상자를 누르면 그 리소스의 실제 설정이 열립니다. <span class="k-ghost">점선 상자</span>는 클라우드가 알아서 만들어 직접 만들 필요가 없는 것, <span class="k-chip">작은 꼬리표</span>는 방화벽·라우팅 같은 설정이 붙는 위치입니다.</p>`:''}
     ${S.flows?`<div class="flowpanel" id="flowPanel" aria-live="polite" hidden></div>`:''}
     <div class="insp" id="insp" aria-live="polite" hidden></div>
     <div class="legend" id="legend" aria-label="아이콘 범례"></div><div class="effects" id="effects"></div></div>`));
  if (S.map) parts.push(sec(++n,'map','리소스 매핑표', I.map || '같은 역할을 하는 리소스를 한 줄에 놓았습니다. 이름이 비슷해도 <b>범위</b>가 다르면 설계가 달라집니다.', `<div class="tbl"><table id="mapTable"></table></div>`));
  if (S.build) parts.push(sec(++n,'build','설정 범위와 구축 순서', I.build || '도면은 비슷해도 직접 만드는 리소스, 설정이 걸리는 단위, 만드는 순서는 클라우드마다 다릅니다. 표의 칸이나 단계를 누르면 실제 설정 항목이 열립니다.',
    `${S.scope?`<div class="tbl"><table id="scopeTable" class="scope"></table></div>`:''}<div class="build" id="buildCols"></div><div class="insp bpanel" id="bInsp" aria-live="polite" hidden></div>`));
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
  const tw = (t, k) => [...String(t)].reduce((a,c)=>a+(c.charCodeAt(0)>0x1100?k*1.02:k*.58),0);
  function wrapHit(o, inner, extra){
    const key = pv(o.cfg);
    const cls = [extra||'', hl.has(o.id)?'hl':'', sel&&sel.id===o.id?'sel':'', FP.on.has(o.id)?'onpath':'', FP.bad===o.id?'blocked':''].join(' ');
    if (!key || !CFG[key]) return `<g class="${cls}">${inner}</g>`;
    const nm = (CFG[key][vendor]||{}).name || CFG[key].title;
    return `<g class="hit ${cls}" data-id="${esc(o.id)}" data-cfg="${esc(key)}" tabindex="0" role="button" aria-label="${esc(pv(o.t)||pv(o.label)||nm)} 설정 보기">${inner}</g>`;
  }
  const nw = o => o.kind==='chip' ? (o.w || Math.round(tw(pv(o.t),10.5)+16)) : (o.w||170);
  const nh = o => o.kind==='chip' ? 18 : (o.h||44);
  function chip(o){
    const t = pv(o.t), w = o.w || Math.round(tw(t,10.5)+16), h = 18;
    return wrapHit(o, box(o.x,o.y,w,h,'chip',9) + txt(o.x+w/2, o.y+12.5, t, 'lab-chip', 'middle'), 'chipg');
  }
  function node(o, down, promo){
    if (o.kind==='chip') return chip(o);
    const h = o.h || 44, w = o.w || 170;
    const cls = ['n', o.kind||'', promo?'promo':''].join(' ');
    let s = box(o.x,o.y,w,h,cls,5);
    if (o.kind==='ghost') s += box(o.x+w-34, o.y-7, 30, 14, 'ghost-tag', 7) + txt(o.x+w-19, o.y+3.5, '자동', 'lab-ghost', 'middle');
    let tx = o.x + w/2, an = 'middle';
    const ic = pv(o.icon);
    if (ic){ const t = Math.min(26, h-10); s += icon(ic, o.x+6, o.y+(h-t)/2, t); tx = o.x + t + 13; an = 'start'; }
    const t1 = pv(o.t), t2 = (failed && o.failS) ? pv(o.failS) : pv(o.s);
    if (t2){ s += txt(tx, o.y+h/2-2, t1, 'lab-n', an) + txt(tx, o.y+h/2+12, t2, 'lab-sub', an); }
    else s += txt(tx, o.y+h/2+4, t1, 'lab-n', an);
    return wrapHit(o, s, down?'is-down':'');
  }
  function anchor(o, tx, ty){
    const w = nw(o), h = nh(o), cx = o.x+w/2, cy = o.y+h/2;
    const dx = tx-cx, dy = ty-cy;
    if (!dx && !dy) return [cx,cy];
    const sx = dx ? (w/2)/Math.abs(dx) : Infinity, sy = dy ? (h/2)/Math.abs(dy) : Infinity;
    const k = Math.min(sx, sy);
    return [cx+dx*k, cy+dy*k];
  }
  let FP = {on:new Set(), bad:null, hops:[]};
  function flowState(){
    const f = flow && (S.flows||[]).filter(shown).find(x=>x.id===flow);
    if (!f) return {on:new Set(), bad:null, hops:[]};
    const hops = pv(f.hops) || [];
    const k = hops.findIndex(h=>h.ok===false);
    const used = k<0 ? hops : hops.slice(0,k+1);
    return {on:new Set(used.map(h=>h.n).filter(Boolean)), bad: k<0 ? null : hops[k].n, hops:used, all:hops, k};
  }
  function render(){
    FP = flowState();
    const D = pv(S.diagram), F = S.fail || {};
    const svg = $('diagram');
    svg.setAttribute('viewBox', `0 0 ${D.w} ${D.h}`); svg.style.minWidth = Math.min(D.w,680)+'px';
    const nodes = D.nodes.filter(o => shown(o) && (o.fail!=='show' || failed)), byId = {};
    nodes.forEach(o => byId[o.id] = o);
    const downSet = new Set(failed ? (F.down||[]) : []);
    const promoSet = new Set(failed ? (F.promote||[]) : []);
    let s = `<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="arrow"/></marker><marker id="arf" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="arrow-f"/></marker><marker id="arx" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="arrow-x"/></marker></defs>`;
    const FK = {region:'f-region', net:'f-net', zone:'f-zone', band:'f-band', group:'grp', onprem:'f-onprem', plain:'f-sub'};
    D.frames.filter(shown).forEach(f => {
      const fc = (FK[f.kind]||'f-sub') + (FP.bad===f.id?' fbad':(hl.has(f.id)||FP.on.has(f.id)?' hl':'')) + (sel&&sel.id===f.id?' sel':'');
      s += box(f.x,f.y,f.w,f.h,fc, f.kind==='band'?6:8);
      const lab = pv(f.label);
      if (lab){
        const key = pv(f.cfg);
        const cls = (f.kind==='net'||f.kind==='group' ? 'lab-acc' : (f.kind==='zone' ? 'lab-z' : 'lab-s')) + (key&&CFG[key]?' lab-cfg':'');
        const right = f.kind==='zone' || f.kind==='band' || f.labelRight;
        const lx = right ? f.x+f.w-8 : f.x+10, ly = right ? f.y+14 : f.y+16;
        let t = txt(lx, ly, lab, cls, right?'end':'start');
        if (key && CFG[key]){
          const w = tw(lab, 11) + 12;
          t = `<rect x="${right?lx-w+4:lx-6}" y="${ly-13}" width="${w}" height="18" class="lab-hit" rx="4"/>` + t;
          s += wrapHit(f, t);
        } else s += t;
      }
    });
    const labels = [];
    (D.edges||[]).filter(shown).forEach(e => {
      if (e.fail==='hide' && failed) return;
      if (e.fail==='show' && !failed) return;
      const A = byId[e.a], B = byId[e.b]; if (!A||!B) return;
      const bc = [B.x+nw(B)/2, B.y+nh(B)/2], ac = [A.x+nw(A)/2, A.y+nh(A)/2];
      const p1 = anchor(A, bc[0], bc[1]), p2 = anchor(B, ac[0], ac[1]);
      const dead = downSet.has(e.a) || downSet.has(e.b);
      s += `<path d="M${p1[0].toFixed(1)} ${p1[1].toFixed(1)} L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}" class="e ${e.dash?'rep':''} ${dead?'dead':''}" ${e.dash==='both'?'':'marker-end="url(#ar)"'}/>`;
      const lab = pv(e.label);
      if (lab) labels.push(txt((p1[0]+p2[0])/2 + (e.lx||0), (p1[1]+p2[1])/2 - 4 + (e.ly||0), lab, 'lab-e', 'middle'));
    });
    nodes.forEach(o => s += node(o, downSet.has(o.id), promoSet.has(o.id)));
    s += labels.join('');
    if (FP.hops.length){
      const pts = FP.hops.filter(h=>h.n && byId[h.n]);
      for (let i=1;i<pts.length;i++){
        const A = byId[pts[i-1].n], B = byId[pts[i].n]; if (A===B) continue;
        const ah = A.kind==='chip'?18:(A.h||44), bh = B.kind==='chip'?18:(B.h||44);
        const ac = [A.x+nw(A)/2, A.y+ah/2], bc = [B.x+nw(B)/2, B.y+bh/2];
        const p1 = anchor(A, bc[0], bc[1]), p2 = anchor(B, ac[0], ac[1]);
        const bad = pts[i].ok===false;
        s += `<path d="M${p1[0].toFixed(1)} ${p1[1].toFixed(1)} L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}" class="flowp ${bad?'bad':''}" marker-end="url(#${bad?'arx':'arf'})"/>`;
      }
      if (FP.bad && byId[FP.bad]){ const B = byId[FP.bad], bw = nw(B); s += `<g class="xmark"><circle cx="${B.x+bw-2}" cy="${B.y+2}" r="9"/><text x="${B.x+bw-2}" y="${B.y+6}" text-anchor="middle">✕</text></g>`; }
    }
    (D.notes||[]).filter(shown).forEach(t => { if (t.fail==='show' && !failed) return; s += txt(t.x, t.y, pv(t.t), t.cls||'lab-s', t.anchor||'start'); });
    if (failed) (F.zones||[]).forEach(id => {
      const f = D.frames.find(x => x.id===id && shown(x)); if (!f) return;
      s += box(f.x,f.y,f.w,f.h,'down-ov',8) + txt(f.x+f.w/2, f.y+f.h/2, '✕ '+(F.zoneLabel||'장애'), 'lab-fail', 'middle');
    });
    svg.innerHTML = s;

    $('figTitle').innerHTML = `<span class="vtag">${NAMES[vendor]}</span>${esc(pv(S.region)||'')}`;
    const eff = $('effects');
    if (F && failed) eff.innerHTML = `<h3>${esc(F.title||'장애 시 일어나는 일')}</h3><ul>${(pv(F.effects)||[]).map(f=>`<li class="${f[0]}">${esc(f[1])}</li>`).join('')}</ul>`;
    else if (!(F.normal||S.normal)) { eff.hidden = true; }
    else eff.innerHTML = `<h3>정상 흐름</h3><ul>${(pv(F.normal||S.normal)||[]).map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`;
    const fb = $('failBtn');
    if (fb){ fb.setAttribute('aria-pressed', failed); fb.textContent = failed ? (F.restore||'복구') : F.button; }
    const used = [...new Set(nodes.map(o=>pv(o.icon)).filter(Boolean))];
    renderInsp(); renderFlows();
    $('legend').innerHTML = used.map(k=>`<span>${CloudIcons.tile(k, vendor)}${esc(LEGEND[k]||k)}</span>`).join('');
  }

  /* ---------- 통신 경로 ---------- */
  function flowOK(f){ const h = pv(f.hops)||[]; return !h.some(x=>x.ok===false); }
  function renderFlows(){
    const L = $('flowList'); if (!L) return;
    L.innerHTML = S.flows.filter(shown).map(f=>{ const ok = flowOK(f); return `<button type="button" class="flowbtn ${ok?'ok':'no'}" data-flow="${esc(f.id)}" aria-pressed="${flow===f.id}"><span class="fi" aria-hidden="true">${ok?'✓':'✕'}</span>${esc(f.t)}</button>`; }).join('');
    const P = $('flowPanel');
    const f = flow && S.flows.filter(shown).find(x=>x.id===flow);
    if (!f){ P.hidden = true; return; }
    const st = FP, ok = st.k<0 || st.k==null;
    P.hidden = false;
    P.innerHTML = `<div class="fp-h"><b>${esc(f.t)}</b><span class="verdict ${ok?'ok':'no'}">${ok?'통과':'차단'}</span><button type="button" class="btn sm" data-flowclose="1">닫기</button></div>
      ${pv(f.d)?`<p class="fp-d">${esc(pv(f.d))}</p>`:''}
      <ol class="hops">${st.all.map((h,i)=>{ const cut = st.k>=0 && i>st.k; const bad = h.ok===false;
        return `<li class="${bad?'bad':''} ${cut?'cut':''}"><span class="hn">${i+1}</span><div><b>${esc(h.t)}</b><span class="hr">${esc(h.r||'')}</span>${h.cfg&&CFG[h.cfg]?` <button type="button" class="lnk" data-hopcfg="${esc(h.cfg)}" data-hopn="${esc(h.n||'')}">설정 보기</button>`:''}</div><span class="hv">${cut?'—':bad?'차단':i===0?'출발':'통과'}</span></li>`; }).join('')}</ol>
      ${pv(f.note)?`<p class="fp-n">${esc(pv(f.note))}</p>`:''}`;
  }

  /* ---------- 설정 보기 ---------- */
  function findObj(id){ const D = pv(S.diagram); return D.nodes.find(o=>o.id===id) || D.frames.find(f=>f.id===id); }
  function cfgHTML(key, why, closeId){
    const C = CFG[key]; if (!C) return '';
    const c = C[vendor] || {};
    const list = a => (a||[]).map(x=>`<li>${esc(x)}</li>`).join('');
    return `<div class="ih"><div><span class="vtag">${NAMES[vendor]}</span><b class="nm">${esc(c.name)}</b>${c.auto?'<span class="auto">직접 만들지 않음</span>':''}<span class="ttl">${esc(C.title)}</span></div>
      ${closeId?`<button type="button" class="btn sm" data-close="${closeId}" aria-label="설정 닫기">닫기</button>`:''}</div>
      <dl class="where"><div><dt>설정 범위</dt><dd>${esc(c.scope)}</dd></div><div><dt>만드는 위치</dt><dd>${esc(c.where)}</dd></div></dl>
      ${why?`<p class="why"><b>이 장에서</b> ${esc(why)}</p>`:''}
      <div class="icols"><div><h4>${c.auto?'동작 방식':'만드는 순서'}</h4><ol class="steps">${list(c.steps)}</ol></div>
      <div><h4>주요 설정값</h4><div class="tbl in"><table class="cfgt"><thead><tr><th>항목</th><th>예시 값</th><th>설명</th></tr></thead><tbody>${(c.fields||[]).map(f=>`<tr><th scope="row">${esc(f[0])}</th><td class="mono">${esc(f[1])}</td><td>${esc(f[2]||'')}</td></tr>`).join('')}</tbody></table></div>
      <h4>Terraform 리소스</h4><p class="tf">${(c.tf||[]).map(t=>`<code>${esc(t)}</code>`).join(' ')}</p></div></div>
      ${c.note?`<p class="inote">${esc(c.note)}</p>`:''}
      <div class="cmp"><h4>세 클라우드에서는</h4><table><tbody>${['aws','gcp','azure'].map(v=>{ const x=C[v]||{}; return `<tr class="${v===vendor?'on':''}"><th scope="row"><button type="button" class="vbtn v-${v}" data-vendor="${v}" aria-pressed="${v===vendor}">${NAMES[v]}</button></th><td><b>${esc(x.name)}</b>${x.auto?' <span class="auto">자동</span>':''}</td><td>${esc(x.scope)}</td></tr>`; }).join('')}</tbody></table></div>`;
  }
  function renderInsp(){
    const el = $('insp'); if (!el) return;
    if (!sel || sel.from!=='fig'){ el.hidden = true; return; }
    const o = sel.id ? findObj(sel.id) : null;
    const key = (sel.fixed || !o) ? sel.key : (pv(o.cfg) || sel.key);
    if (!key || !CFG[key]){ el.hidden = true; return; }
    el.hidden = false; el.innerHTML = cfgHTML(key, o && !sel.fixed && pv(o.why), 'insp');
  }
  function renderBuild(){
    const el = $('buildCols'); if (!el) return;
    const st = (v,b) => { const c = b.cfg && CFG[b.cfg] && CFG[b.cfg][v]; return c ? c : null; };
    const st2 = $('scopeTable');
    if (st2) st2.innerHTML = `<thead><tr><th scope="col">설정</th>${['aws','gcp','azure'].map(v=>`<th scope="col" class="v-${v} ${v===vendor?'on':''}">${NAMES[v]}</th>`).join('')}</tr></thead><tbody>${
      S.scope.filter(k=>CFG[k]).map(k=>`<tr><th scope="row">${esc(CFG[k].title)}</th>${['aws','gcp','azure'].map(v=>{ const c=CFG[k][v]||{}; const on = sel&&sel.from==='build'&&sel.key===k&&v===vendor;
        return `<td class="${v===vendor?'on':''} ${on?'cur':''}"><button type="button" class="cell" data-key="${k}" data-v="${v}">${esc(c.name)}${c.auto?' <span class="auto">자동</span>':''}<span class="k">${esc(c.scope)}</span></button></td>`; }).join('')}</tr>`).join('')}</tbody>`;
    el.innerHTML = ['aws','gcp','azure'].map(v=>{ const L = S.build[v]||[]; const mk = L.filter(b=>{ const c=st(v,b); return !(b.auto || (c&&c.auto)); }).length;
      return `<div class="bcol v-${v} ${v===vendor?'on':''}"><h3><span class="dot"></span>${NAMES[v]}<small>${L.length}단계 · 직접 만드는 단계 ${mk}</small></h3><ol>${L.map((b,i)=>{ const c=st(v,b); const auto = b.auto || (c&&c.auto);
        const on = !!(sel&&sel.from==='build'&&sel.v===v&&sel.i===i);
        return `<li class="${auto?'isauto':''} ${on?'cur':''}"><button type="button" class="step" data-v="${v}" data-i="${i}" aria-pressed="${on}"><span class="no">${i+1}</span><span class="bt"><b>${esc(b.t)}</b>${b.d?`<span>${esc(b.d)}</span>`:''}${c?`<em>${esc(c.name)} · ${esc(b.scope||c.scope)}</em>`:''}</span></button></li>`; }).join('')}</ol></div>`; }).join('');
    const p = $('bInsp');
    if (sel && sel.from==='build' && CFG[sel.key]){
      const b = sel.i!=null ? (S.build[vendor]||[])[sel.i] : null;
      p.hidden = false;
      p.innerHTML = (b?`<p class="bstep"><span class="no">${sel.i+1}</span>${esc(b.t)}${b.nodes&&b.nodes.length?` <button type="button" class="btn sm" data-show="1">도면에서 위치 보기</button>`:''}</p>`:'') + cfgHTML(sel.key, b && b.why, 'bInsp');
    } else if (sel && sel.from==='build' && sel.i!=null){
      const b = (S.build[vendor]||[])[sel.i];
      p.hidden = false; p.innerHTML = `<p class="bstep"><span class="no">${sel.i+1}</span>${esc(b.t)} <button type="button" class="btn sm" data-close="bInsp">닫기</button></p>${b.d?`<p>${esc(b.d)}</p>`:''}`;
    } else p.hidden = true;
  }
  function pick(next){ sel = next; hl = new Set(next && next.nodes || []); render(); renderBuild(); }
  function onDiagram(e){
    const g = e.target.closest('[data-cfg]'); if (!g) return;
    if (e.type==='keydown' && e.key!=='Enter' && e.key!==' ') return;
    e.preventDefault();
    const id = g.dataset.id;
    if (sel && sel.id===id && sel.from==='fig'){ pick(null); return; }
    pick({id, key:g.dataset.cfg, from:'fig'});
    const p = $('insp'); if (p && p.scrollIntoView) p.scrollIntoView({block:'nearest', behavior:'smooth'});
    const again = document.querySelector(`#diagram [data-id="${CSS.escape(id)}"]`); if (again && e.type==='keydown') again.focus();
  }
  document.addEventListener('click', e=>{
    const fbn = e.target.closest('[data-flow]');
    if (fbn){ flow = flow===fbn.dataset.flow ? null : fbn.dataset.flow; sel = null; hl = new Set(); render(); renderBuild(); return; }
    if (e.target.closest('[data-flowclose]')){ flow = null; render(); return; }
    const hc = e.target.closest('[data-hopcfg]');
    if (hc){ sel = {id: hc.dataset.hopn || null, key: hc.dataset.hopcfg, from:'fig', fixed:true}; render(); renderBuild(); const p=$('insp'); if (p && p.scrollIntoView) p.scrollIntoView({block:'nearest', behavior:'smooth'}); return; }
    const c = e.target.closest('[data-close]'); if (c){ pick(null); return; }
    const vb = e.target.closest('.insp [data-vendor]'); if (vb){ setVendor(vb.dataset.vendor); return; }
    const sh = e.target.closest('[data-show]');
    if (sh){ hl = new Set(((S.build[vendor]||[])[sel.i]||{}).nodes||[]); render(); $('arch').scrollIntoView({behavior:'smooth'}); return; }
    const cell = e.target.closest('#scopeTable .cell');
    if (cell){ if (cell.dataset.v!==vendor) setVendor(cell.dataset.v); pick({key:cell.dataset.key, from:'build'}); return; }
    const stp = e.target.closest('#buildCols .step');
    if (stp){ const v = stp.dataset.v, i = +stp.dataset.i;
      if (sel && sel.from==='build' && sel.v===v && sel.i===i){ pick(null); return; }
      if (v!==vendor) setVendor(v);
      const b = S.build[v][i]; pick({key:b.cfg, from:'build', v, i, nodes:b.nodes}); }
  });

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
  function hilite(src){
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
    $('codeBox').innerHTML = c==null ? '불러오는 중…' : c===false ? '<span class="s">Terraform 파일을 불러오지 못했습니다. 저장소 루트에서 python3 -m http.server로 열어 주세요.</span>' : hilite(c);
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
    if (sel && sel.from==='build' && sel.i!=null && sel.v!==v){ const b=(S.build[v]||[]).find(x=>x.cfg===sel.key); sel = b ? {key:b.cfg, from:'build', v, i:S.build[v].indexOf(b), nodes:b.nodes} : {key:sel.key, from:'build'}; hl = new Set(sel.nodes||[]); }
    render(); renderMap(); renderDec(); renderCode(); renderBuild();
    if (window.CloudSims) CloudSims.vendorChanged(v);
  }
  document.querySelectorAll('#vendorSeg button').forEach(b=>b.addEventListener('click',()=>setVendor(b.dataset.v)));
  $('diagram').addEventListener('click', onDiagram); $('diagram').addEventListener('keydown', onDiagram);
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
