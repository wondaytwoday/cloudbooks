/* 포털·ArchBook 목차·벤더 책 목차를 데이터 파일로 그린다.
   페이지는 <body data-page="portal|archbook|vendor" data-root="상대 경로" data-book="awsbook"> 로 구분한다. */
(function(){
  const body = document.body;
  const ROOT = body.dataset.root || './';
  const page = body.dataset.page;
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const get = p => fetch(ROOT + p).then(r => { if (!r.ok) throw new Error(p); return r.json(); });
  const fail = el => { el.innerHTML = '<p class="load-err">데이터를 불러오지 못했습니다. 저장소 루트에서 <code>python3 -m http.server</code>로 열어 주세요.</p>'; };
  const tile = k => window.CloudIcons ? CloudIcons.tile(k) : '';

  if (page === 'portal'){
    get('data/books.json').then(d => {
      $('shelf').innerHTML = d.books.map(b => `
        <a class="book ${b.vendor ? 'v-' + b.vendor : 'featured'}" href="${esc(b.path)}">
          <div class="bt">${tile(b.icon)}<div><h2>${esc(b.title)}</h2><span class="sub">${esc(b.subtitle)}</span></div></div>
          <p>${esc(b.description)}</p>
          <span class="badge ${esc(b.status)}">${esc(d.statusLabels[b.status])}</span>
        </a>`).join('');
    }).catch(() => fail($('shelf')));
  }

  if (page === 'archbook'){
    get('archbook/data/scenarios.json').then(d => {
      const groups = {};
      d.scenarios.forEach(s => (groups[s.level] = groups[s.level] || []).push(s));
      $('toc').innerHTML = Object.keys(d.levels).filter(l => groups[l]).map(l => `
        <div><h3>${esc(d.levels[l])}</h3><ol class="toc">${groups[l].map(s => {
          const inner = `<span class="no">${String(s.no).padStart(2,'0')}</span>
            <span class="tt"><b>${esc(s.title)}</b><span>${esc(s.question)}</span></span>
            <span class="vchips" aria-hidden="true"><i class="vchip v-aws"></i><i class="vchip v-gcp"></i><i class="vchip v-azure"></i></span>`;
          return s.file ? `<li><a href="${esc(s.file)}">${inner}</a></li>` : `<li><div aria-disabled="true">${inner}</div></li>`;
        }).join('')}</ol></div>`).join('');
    }).catch(() => fail($('toc')));
  }

  if (page === 'vendor'){
    const v = body.dataset.vendor;
    get('shared/data/vendor-toc.json').then(d => {
      const list = [...d.common, d.unique[v]];
      $('toc').innerHTML = `<ol class="toc">${list.map((c,i) => `
        <li><div aria-disabled="true"><span class="no">${String(i+1).padStart(2,'0')}</span>
        <span class="tt"><b>${esc(c.title)}</b><span>집필 예정</span></span>${tile(c.icon)}</div></li>`).join('')}</ol>`;
    }).catch(() => fail($('toc')));
  }
})();
