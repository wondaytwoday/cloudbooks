/* 벤더 책(AWSBook·GCPBook·AzureBook) 챕터 렌더러
   <body data-vendor="aws" data-root="../../" data-chapter="network"> 와
   ../data/chapters.js 의 window.VBOOK = { vendor, title, chapters:[{id, title, lede, concepts:[{icon,t,d}], defaults:[], pitfalls:[[t,d]], services:[], scenarios:[], refs:[[t,u]]}] } 를 읽는다. */
(function(){
  const B = window.VBOOK, body = document.body, ROOT = body.dataset.root || '../../';
  const id = body.dataset.chapter, idx = B.chapters.findIndex(c => c.id === id), C = B.chapters[idx];
  const NAMES = {aws:'AWS', gcp:'GCP', azure:'Azure'};
  const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const $ = x => document.getElementById(x);
  const v = B.vendor;
  try{ localStorage.setItem('archbook-vendor', v); }catch(e){} /* 사례집으로 넘어가면 같은 클라우드로 열림 */
  const pad = n => String(n).padStart(2,'0');
  const main = $('chapter');
  if (!C){ main.innerHTML = '<p class="load-err">챕터를 찾지 못했습니다.</p>'; return; }

  document.title = `${C.title} · ${B.title}`;
  /* services.json id → shared/data/configs.js 키 */
  const SVC_CFG = {'network':'vpc','subnet':'subnet','internet-gateway':'igw','route-table':'route','firewall':'firewall','nat':'nat','dns':'dns','cdn':'cdn','waf':'waf',
    'l7-lb':'lb','vm-autoscale':'vmgroup','mysql-ha':'dbha','cache':'cache','object-storage':'bucket','secrets':'secret','api-gateway':'apigw','serverless-compute':'func',
    'serverless-container':'func','nosql':'nosql','sso':'sso','guardrail':'guardrail','org-audit':'audit','network-hub':'hubnet','k8s-managed':'k8s','pod-identity':'podid',
    'event-bus':'eventbus','message-queue':'queue','pubsub-topic':'queue','dedicated-link':'dedicated','site-vpn':'vpn','hybrid-dns':'dnshybrid','global-traffic':'gslb',
    'cross-region-db':'dbdr','private-endpoint':'privlink','egress-filter':'egressfw','kms':'kms','admin-access':'admin','account-unit':'account','llm-api':'llm'};
  const CFG = window.CONFIGS || {};
  const cfgKeys = [...new Set((C.configs || (C.services||[]).map(s=>SVC_CFG[s])).filter(k=>k && CFG[k]))];
  let sn = 4;
  function cfgCard(k){
    const c = CFG[k][v] || {};
    return `<details class="cfgcard"><summary><b>${esc(c.name)}</b>${c.auto?' <span class="auto">직접 만들지 않음</span>':''}<span class="k">${esc(CFG[k].title)} · 범위: ${esc(c.scope)}</span></summary>
      <div class="insp"><dl class="where"><div><dt>설정 범위</dt><dd>${esc(c.scope)}</dd></div><div><dt>만드는 위치</dt><dd>${esc(c.where)}</dd></div></dl>
      <div class="icols"><div><h4>${c.auto?'동작 방식':'만드는 순서'}</h4><ol class="steps">${(c.steps||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div>
      <div><h4>주요 설정값</h4><div class="tbl in"><table class="cfgt"><thead><tr><th>항목</th><th>예시 값</th><th>설명</th></tr></thead><tbody>${(c.fields||[]).map(f=>`<tr><th scope="row">${esc(f[0])}</th><td class="mono">${esc(f[1])}</td><td>${esc(f[2]||'')}</td></tr>`).join('')}</tbody></table></div>
      <h4>Terraform 리소스</h4><p class="tf">${(c.tf||[]).map(t=>`<code>${esc(t)}</code>`).join(' ')}</p></div></div>
      ${c.note?`<p class="inote">${esc(c.note)}</p>`:''}
      <div class="cmp"><h4>세 클라우드에서는</h4><table><tbody>${['aws','gcp','azure'].map(x=>{ const o=CFG[k][x]||{}; return `<tr class="${x===v?'on':''}"><th scope="row"><span class="vbtn v-${x}" ${x===v?'aria-current="true"':''}>${NAMES[x]}</span></th><td><b>${esc(o.name)}</b>${o.auto?' <span class="auto">자동</span>':''}</td><td>${esc(o.scope)}</td></tr>`; }).join('')}</tbody></table></div></div></details>`;
  }
  const prev = B.chapters[idx-1], next = B.chapters[idx+1];
  main.innerHTML = `
    <header class="top"><div class="eyebrow">${esc(B.title)} · ${pad(idx+1)}장</div>
      <h1>${esc(C.title)}</h1><p class="lede">${esc(C.lede)}</p></header>
    <section><span class="secno">${idx+1}.1</span><h2>핵심 개념</h2>
      <div class="concepts">${C.concepts.map(k=>`<article class="concept"><div class="ct-h"><span class="ct-ic" data-icon="${esc(k.icon||'')}"></span><h3>${esc(k.t)}</h3></div><p>${esc(k.d)}</p></article>`).join('')}</div></section>
    <section><span class="secno">${idx+1}.2</span><h2>기본으로 이렇게 시작합니다</h2>
      <ol class="defaults">${C.defaults.map(d=>`<li>${esc(d)}</li>`).join('')}</ol></section>
    <section><span class="secno">${idx+1}.3</span><h2>흔한 함정</h2>
      <ul class="check pit">${C.pitfalls.map(p=>`<li><span class="pit-mark" aria-hidden="true">!</span><div><b>${esc(p[0])}</b><span>${esc(p[1])}</span></div></li>`).join('')}</ul></section>
    <section><span class="secno">${idx+1}.4</span><h2>다른 클라우드에서는</h2>
      <p>같은 역할의 서비스를 나란히 놓았습니다. 범위(영역·리전·전역)의 차이가 설계를 바꿉니다.</p>
      <div class="tbl"><table id="mapTable"></table></div></section>
    ${cfgKeys.length ? `<section><span class="secno">${idx+1}.${++sn}</span><h2>실제 설정 화면</h2>
      <p>이 장 리소스를 ${NAMES[v]}에서 만들 때 설정이 걸리는 범위, 만드는 순서, 주요 값입니다. 항목을 펼치면 다른 두 클라우드의 범위도 함께 보입니다.</p>
      <div class="cfglist">${cfgKeys.map(cfgCard).join('')}</div></section>` : ''}
    ${C.scenarios && C.scenarios.length ? `<section><span class="secno">${idx+1}.${++sn}</span><h2>사례집에서 이어 읽기</h2>
      <ul class="xref" id="xref"></ul></section>` : ''}
    <footer><b>공식 문서</b><ul>${(C.refs||[]).map(r=>`<li><a href="${esc(r[1])}" target="_blank" rel="noopener">${esc(r[0])}</a></li>`).join('')}</ul>
      <p>서비스 이름과 동작은 2026년 10월 기준입니다. 한도와 요금은 자주 바뀌므로 공식 문서로 다시 확인하세요.</p>
      <nav class="pager">${prev?`<a href="${esc(prev.id)}.html">← ${esc(prev.title)}</a>`:'<span></span>'}<a href="../">목차</a>${next?`<a href="${esc(next.id)}.html">${esc(next.title)} →</a>`:'<span></span>'}</nav></footer>`;

  function icons(){
    document.querySelectorAll('.ct-ic').forEach(el => { const k = el.dataset.icon; el.innerHTML = k ? CloudIcons.tile(k, v) : ''; });
  }
  icons(); CloudIcons.ready.then(icons);

  fetch(ROOT+'shared/data/services.json').then(r=>r.json()).then(d=>{
    const M = {}; d.services.forEach(s=>M[s.id]=s);
    const rows = (C.services||[]).map(x=>M[x]).filter(Boolean);
    const vs = ['aws','gcp','azure'];
    const draw = () => $('mapTable').innerHTML = `<thead><tr><th scope="col">역할</th>${vs.map(x=>`<th scope="col" class="v-${x} ${x===v?'on':''}">${NAMES[x]}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><th scope="row">${CloudIcons.tile(r.icon, v)}${esc(r.role)}</th>${vs.map(x=>`<td class="${x===v?'on':''}">${esc(r[x].name)}${r[x].scope?`<span class="k">${esc(r[x].scope)}</span>`:''}</td>`).join('')}</tr>`).join('')}</tbody>`;
    draw(); CloudIcons.ready.then(draw);
  }).catch(()=>{ $('mapTable').innerHTML = '<caption class="load-err">매핑 데이터를 불러오지 못했습니다. 저장소 루트에서 python3 -m http.server로 열어 주세요.</caption>'; });

  if ($('xref')) fetch(ROOT+'archbook/data/scenarios.json').then(r=>r.json()).then(d=>{
    $('xref').innerHTML = d.scenarios.filter(s=>C.scenarios.includes(s.no)).map(s=>
      `<li><a href="${ROOT}archbook/${esc(s.file||'')}"><span class="no">${pad(s.no)}</span><span><b>${esc(s.title)}</b><span>${esc(s.question)}</span></span></a></li>`).join('');
  }).catch(()=>{});
})();
