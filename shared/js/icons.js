/* CloudBooks 공용 아이콘
   1) 자체 선 아이콘 스프라이트를 페이지에 넣는다 (#g-<키>).
   2) shared/icons/manifest.json에 공식 아이콘 경로가 있으면 그 파일을 우선 쓴다.
   키: users dns edge lb nat vm db obj cache secret mon net sub fw pin */
(function(){
  const SYMBOLS = `
<symbol id="g-users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 19c0-3.3 2.7-5 6-5s6 1.7 6 5"/><circle cx="17" cy="9" r="2.3"/><path d="M16.5 14c2.6.2 4.5 1.9 4.5 5"/></symbol>
<symbol id="g-dns" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c-3.5 3.5-3.5 12.5 0 16M12 4c3.5 3.5 3.5 12.5 0 16"/></symbol>
<symbol id="g-edge" viewBox="0 0 24 24"><path d="M12 3l7 3v5.5c0 4.6-3 7.7-7 9.5-4-1.8-7-4.9-7-9.5V6z"/><path d="M9 12l2.2 2.2L15.5 10"/></symbol>
<symbol id="g-lb" viewBox="0 0 24 24"><circle cx="12" cy="5" r="2"/><path d="M12 7v4M12 11L5 17M12 11v6M12 11l7 6"/><circle cx="5" cy="18.5" r="1.6"/><circle cx="12" cy="18.5" r="1.6"/><circle cx="19" cy="18.5" r="1.6"/></symbol>
<symbol id="g-nat" viewBox="0 0 24 24"><path d="M3 12h6l3-5h8M12 12l0 0M9 12l3 5h8M17.5 4.5L20 7l-2.5 2.5M17.5 14.5L20 17l-2.5 2.5"/></symbol>
<symbol id="g-vm" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M9 20h6M12 16v4M7 8h4"/></symbol>
<symbol id="g-db" viewBox="0 0 24 24"><ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/></symbol>
<symbol id="g-obj" viewBox="0 0 24 24"><path d="M4 7h16l-2 13H6z"/><path d="M4 7c0-1.4 3.6-2.5 8-2.5S20 5.6 20 7"/></symbol>
<symbol id="g-cache" viewBox="0 0 24 24"><path d="M13 3L5.5 13H11l-1 8 7.5-10H12z"/></symbol>
<symbol id="g-secret" viewBox="0 0 24 24"><circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v2"/></symbol>
<symbol id="g-mon" viewBox="0 0 24 24"><path d="M4 20h16M4 4v16M7 15l4-5 3 3 5-6"/></symbol>
<symbol id="g-net" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 8h8v8H8z"/></symbol>
<symbol id="g-sub" viewBox="0 0 24 24"><rect x="3" y="5" width="8" height="14" rx="1.5"/><rect x="13" y="5" width="8" height="14" rx="1.5"/></symbol>
<symbol id="g-fw" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18M9 6v6M15 12v6M7 18v0"/></symbol>
<symbol id="g-pin" viewBox="0 0 24 24"><path d="M12 21s-6-5.5-6-10.5a6 6 0 0 1 12 0C18 15.5 12 21 12 21z"/><circle cx="12" cy="10.5" r="2"/></symbol>`;
  const holder = document.createElement('div');
  holder.innerHTML = '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' + SYMBOLS + '</svg>';
  document.body.prepend(holder.firstChild);

  /* 공식 아이콘이 없을 때 쓸 자체 선 아이콘 */
  const GLYPH = {cdn:'edge',waf:'edge',gslb:'lb',igw:'net',gpu:'vm',autoscale:'vm',pg:'db',nosql:'db',files:'obj',kms:'secret',
    logs:'mon',audit:'mon',privlink:'net',bastion:'secret',apigw:'lb',func:'cache',run:'vm',k8s:'sub',registry:'obj',queue:'nat',
    topic:'nat',eventbus:'nat',stream:'nat',workflow:'nat',dwh:'db',etl:'nat',query:'db',lakegov:'obj',vpn:'net',dedicated:'net',
    router:'lb',iam:'secret',org:'pin',account:'pin',guard:'edge',sechub:'edge',backup:'obj',ml:'vm',llm:'vm',search:'dns',
    auth:'users',cost:'mon',onprem:'vm',client:'users',gk8s:'sub',gdb:'db',gobj:'obj'};
  const base = document.currentScript.src.replace(/js\/icons\.js.*$/, 'icons/');
  const vendorNow = () => document.body.dataset.vendor;
  window.CloudIcons = {
    src: { aws:{}, gcp:{}, azure:{} },
    glyph: k => GLYPH[k] || k,
    ready: fetch(base + 'manifest.json').then(r => r.ok ? r.json() : {}).then(m => {
      for (const v of ['aws','gcp','azure']) for (const [k,p] of Object.entries(m[v]||{})) window.CloudIcons.src[v][k] = base + p;
    }).catch(() => {}),
    /* 공식 아이콘 경로 (없으면 null) */
    url(key, v){ v = v || vendorNow(); return (this.src[v] || {})[key] || null; },
    /* 범례·표용 작은 타일: 공식 아이콘이 있으면 그 이미지, 없으면 자체 아이콘 */
    tile(key, v){
      const u = this.url(key, v);
      if (u) return `<img class="tile" src="${u}" alt="" loading="lazy">`;
      return `<svg class="tile" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="5"/><use href="#g-${GLYPH[key]||key}" class="gl" x="3" y="3" width="18" height="18"/></svg>`;
    }
  };
})();
