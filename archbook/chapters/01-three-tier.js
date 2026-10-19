/* ArchBook 시나리오 01 · 3티어 웹서비스
   챕터 고유 데이터(V: 도면 라벨, DEC: 설계 결정, CHK: 점검표)와 시뮬레이터.
   공유 데이터: shared/data/services.json, iac/scenario-01/*, shared/icons/manifest.json */
(function(){
const V = {
  aws:{
    name:'AWS', region:'ap-northeast-2', net:'VPC · 리전 범위', zones:['ap-northeast-2a','ap-northeast-2c'],
    dns:'Route 53', edge:'CloudFront + AWS WAF', lb:'Application Load Balancer', lbScope:'리전',
    group:'EC2 Auto Scaling 그룹', vm:'EC2', db:'RDS MySQL', dbHa:'Multi-AZ',
    mode:'zonal', subs:['퍼블릭 서브넷','앱 서브넷','DB 서브넷'], nat:'NAT GW',
    obj:'S3', cache:'ElastiCache', secret:'Secrets Manager', mon:'CloudWatch',
    fail:[
      ['good','ALB가 헬스체크로 첫 번째 AZ의 대상을 빼고 남은 AZ로만 보냅니다.'],
      ['good','Auto Scaling 그룹이 모자란 인스턴스를 정상 AZ에 새로 띄웁니다. 뜨는 몇 분 동안은 남은 대수로 버텨야 합니다.'],
      ['good','RDS Multi-AZ가 대기 인스턴스를 승격합니다(보통 1~2분). 엔드포인트 이름은 그대로라 앱은 재연결만 하면 됩니다.'],
      ['warn','첫 번째 AZ의 NAT GW도 함께 사라집니다. 두 번째 AZ의 앱 서브넷이 자기 AZ의 NAT GW로 라우팅되어 있어야 외부 API 호출이 유지됩니다.']
    ]
  },
  gcp:{
    name:'GCP', region:'asia-northeast3', net:'VPC · 글로벌 범위', zones:['asia-northeast3-a','asia-northeast3-b'],
    dns:'Cloud DNS', edge:'Cloud CDN + Cloud Armor', lb:'외부 Application LB', lbScope:'글로벌',
    group:'리전 관리형 인스턴스 그룹', vm:'VM', db:'Cloud SQL', dbHa:'HA (리전)',
    mode:'regional', subs:['퍼블릭 서브넷 없음 · VM에 외부 IP를 주지 않음','app 서브넷 · 리전 범위, 모든 영역에 걸침','비공개 서비스 연결 (Cloud SQL 전용 대역)'], nat:'Cloud NAT · 리전 관리형',
    obj:'Cloud Storage', cache:'Memorystore', secret:'Secret Manager', mon:'Cloud Monitoring',
    fail:[
      ['good','리전 관리형 인스턴스 그룹이 첫 번째 영역의 인스턴스를 비정상으로 판단하고 남은 영역에 다시 만듭니다.'],
      ['good','글로벌 로드밸런서는 정상 백엔드로만 요청을 보냅니다.'],
      ['good','Cloud SQL HA가 다른 영역의 대기 인스턴스로 장애조치합니다. 접속 IP는 유지됩니다.'],
      ['good','Cloud NAT는 특정 영역에 묶인 장비가 아니라 리전 단위 관리형 서비스라 영향을 받지 않습니다.']
    ]
  },
  azure:{
    name:'Azure', region:'Korea Central', net:'VNet · 리전 범위', zones:['영역 1','영역 2'],
    dns:'Azure DNS', edge:'Front Door + WAF', lb:'Application Gateway v2', lbScope:'리전',
    group:'VM Scale Set (영역 분산)', vm:'VM', db:'MySQL Flexible Server', dbHa:'영역 중복 HA',
    mode:'regional', subs:['AppGW 전용 서브넷','app 서브넷 · 영역 구분 없이 VNet 안에 생성','db 서브넷 · Flexible Server에 위임'], nat:'NAT Gateway',
    obj:'Blob Storage', cache:'Azure Managed Redis', secret:'Key Vault', mon:'Azure Monitor',
    fail:[
      ['good','여러 영역에 분산한 VM Scale Set이 남은 영역에서 인스턴스를 유지하고 늘립니다.'],
      ['good','영역 중복으로 배포한 Application Gateway v2는 계속 요청을 받습니다.'],
      ['good','Flexible Server 영역 중복 HA가 다른 영역의 대기 서버로 장애조치합니다.'],
      ['warn','NAT Gateway를 영역 1에 고정했다면 아웃바운드 연결이 끊길 수 있습니다. 사용하는 SKU의 영역 동작을 확인하고 배치를 정하세요.']
    ]
  }
};

/* 공식 아이콘은 shared/icons/manifest.json에 등록 (shared/js/icons.js가 읽음) */
const ICON_SRC = CloudIcons.src;

let vendor = 'aws', failA = false;
try{ const s = localStorage.getItem('archbook-vendor'); if (V[s]) vendor = s; }catch(e){}

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function rect(x,y,w,h,cls,r){ return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r==null?6:r}" class="${cls}"/>`; }
function txt(x,y,s,cls,anchor){ return `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor||'start'}">${esc(s)}</text>`; }
function node(x,y,w,h,l1,l2,cls,ic){
  let s = rect(x,y,w,h,'n '+(cls||''),5);
  let tx = x+w/2, an = 'middle';
  if (ic){
    const t = Math.min(24,h-8);
    const src = (ICON_SRC[vendor]||{})[ic];
    if (src) s += `<image href="${src}" x="${x+5}" y="${y+(h-t)/2}" width="${t}" height="${t}"/>`;
    else s += rect(x+5,y+(h-t)/2,t,t,'ic-bg',5) + `<use href="#g-${ic}" class="gl" x="${x+5+t*0.14}" y="${y+(h-t)/2+t*0.14}" width="${t*0.72}" height="${t*0.72}"/>`;
    tx = x+t+11; an = 'start';
  }
  if (l2){ s += txt(tx,y+h/2-2,l1,'lab-n',an) + txt(tx,y+h/2+12,l2,'lab-sub',an); }
  else s += txt(tx,y+h/2+4,l1,'lab-n',an);
  return s;
}
function line(x1,y1,x2,y2,cls){ return `<path d="M${x1} ${y1} L${x2} ${y2}" class="e ${cls||''}" marker-end="${cls&&cls.includes('rep')?'':'url(#ar)'}"/>`; }

function render(){
  const v = V[vendor];
  const C = [48,348], CW = 284;
  const rows = {r1:[252,54], r2:[314,76], r3:[398,72]};
  let s = `<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="arrow"/></marker></defs>`;

  // 바깥: 사용자, 엣지
  s += node(280,8,120,32,'사용자',null,'','users');
  s += node(140,66,180,40,'DNS',v.dns,'alt','dns');
  s += node(360,66,190,40,'CDN · WAF',v.edge,'alt','edge');
  // 리전 · 네트워크
  s += rect(20,126,640,452,'f-region',10) + txt(34,146,'서울 리전 · '+v.region,'lab-z');
  s += rect(34,156,612,334,'f-net',8) + txt(46,172,v.net,'lab-acc');
  // 영역 공용 밴드 (GCP, Azure)
  if (v.mode==='regional'){
    if (vendor==='azure') s += rect(40,rows.r1[0],600,rows.r1[1],'f-band',6) + txt(48,rows.r1[0]+14,v.subs[0],'lab-s');
    s += rect(40,rows.r2[0],600,rows.r2[1],'f-band',6) + txt(48,rows.r2[0]+14,v.subs[1],'lab-s');
    s += rect(40,rows.r3[0],600,rows.r3[1],'f-band',6) + txt(48,rows.r3[0]+14,v.subs[2],'lab-s');
  }
  // 영역 기둥
  C.forEach((x,i)=>{
    s += rect(x,226,CW,252,'f-zone',8) + txt(x+CW-8,240,v.zones[i],'lab-z','end');
    if (v.mode==='zonal'){
      ['r1','r2','r3'].forEach((k,j)=>{ s += rect(x+8,rows[k][0],CW-16,rows[k][1],'f-sub',5) + txt(x+16,rows[k][0]+14,v.subs[j],'lab-s'); });
    }
  });
  // 로드밸런서
  s += node(190,180,300,38,v.lb,v.lbScope+' 범위 · 두 영역에 걸침','reg','lb');
  // 오토스케일 그룹 윤곽
  s += rect(44,rows.r2[0]+20,592,50,'grp',8);
  s += txt(632,rows.r2[0]+14,v.group,'lab-acc','end');

  // 엣지 선
  s += line(320,40,250,66) + line(360,40,430,66) + line(445,106,395,180);
  const vmX = (i,k)=> C[i] + (k===0?30:154);
  const vmY = rows.r2[0]+26, vmH=36, vmW=100;
  const dbX = i => C[i]+44, dbY = rows.r3[0]+24, dbW=196, dbH=38;
  const primary = failA ? 1 : 0;
  for (let i=0;i<2;i++) for (let k=0;k<2;k++){
    const cx = vmX(i,k)+vmW/2;
    const dead = failA && i===0;
    if (!dead){
      s += line(Math.min(Math.max(cx,210),470),218,cx,vmY);
      s += line(cx,vmY+vmH,dbX(primary)+dbW/2+(cx<340?-30:30),dbY);
    }
  }
  s += `<path d="M${dbX(0)+dbW} ${dbY+dbH/2} L${dbX(1)} ${dbY+dbH/2}" class="e rep"/>` + txt(340,dbY+dbH/2-6,'동기 복제','lab-s','middle');

  // NAT
  if (vendor==='aws'){ C.forEach((x,i)=>{ s += node(x+86,rows.r1[0]+20,112,28,v.nat,null,'','nat'); }); }
  if (vendor==='gcp'){ s += txt(48,rows.r1[0]+30,v.subs[0],'lab-s') + node(400,rows.r1[0]+12,230,32,v.nat,null,'reg','nat'); }
  if (vendor==='azure'){ s += node(C[0]+80,rows.r1[0]+20,136,28,v.nat,null,'','nat'); }

  // VM, DB
  for (let i=0;i<2;i++){
    for (let k=0;k<2;k++) s += node(vmX(i,k),vmY,vmW,vmH,v.vm,'앱 서버','','vm');
    const isP = i===primary;
    const label = isP ? (failA ? 'Primary · 승격' : 'Primary') : 'Standby';
    s += node(dbX(i),dbY,dbW,dbH,v.db,label+' · '+v.dbHa, isP&&failA ? 'promo' : (isP?'':'alt'),'db');
  }

  // 관리형 서비스 줄
  const ms = [['오브젝트',v.obj,'obj'],['캐시',v.cache,'cache'],['시크릿',v.secret,'secret'],['모니터링',v.mon,'mon']];
  ms.forEach((m,i)=>{ s += node(40+i*152,502,146,46,m[0],m[1],'alt',m[2]); });
  s += txt(340,570,'관리형 서비스는 영역을 클라우드가 알아서 나눔 (설정에 따라 다름)','lab-s','middle');

  // 장애 오버레이
  if (failA){
    s += rect(C[0],226,CW,252,'down-ov',8);
    s += txt(C[0]+CW/2,300,'✕ 영역 장애','lab-fail','middle');
    if (vendor==='azure') s += txt(C[0]+147,rows.r1[0]+60,'아웃바운드 확인 필요','lab-warn','middle');
  }
  document.getElementById('diagram').innerHTML = s;

  // 영향 목록
  const eff = document.getElementById('effects');
  if (failA){
    eff.innerHTML = '<h3>'+esc(v.zones[0])+' 장애 시 일어나는 일</h3><ul>' + v.fail.map(f=>`<li class="${f[0]}">${esc(f[1])}</li>`).join('') + '</ul>';
  } else {
    eff.innerHTML = '<h3>정상 흐름</h3><ul><li>사용자 → '+esc(v.dns)+' → '+esc(v.edge)+' → '+esc(v.lb)+' → 두 영역의 앱 서버 → '+esc(v.db)+' Primary</li><li>DB는 다른 영역의 대기 인스턴스로 동기 복제됩니다. 대기 인스턴스는 읽기 요청을 받지 않습니다.</li></ul>';
  }
  document.getElementById('figTitle').innerHTML = '<span class="vtag">'+esc(v.name)+'</span>' + esc(v.region);
  const fb = document.getElementById('failBtn');
  fb.setAttribute('aria-pressed', failA);
  fb.textContent = failA ? '영역 복구' : '첫 번째 영역 장애 발생';
}

// 매핑표: shared/data/services.json에서 읽음 (세 클라우드 책이 같은 파일을 씀)
let MAP = null, MAP_ICONS = [];
function renderMap(){
  const idx = {aws:0,gcp:1,azure:2}[vendor];
  if (!MAP){ document.getElementById('mapTable').innerHTML = '<caption class="load-err">매핑 데이터를 불러오지 못했습니다. 저장소 루트에서 python3 -m http.server로 열어 주세요.</caption>'; return; }
  const RI = MAP_ICONS;
  const h = [['AWS','aws'],['GCP','gcp'],['Azure','azure']].map((n,i)=>`<th scope="col" class="v-${n[1]} ${i===idx?'on':''}">${n[0]}</th>`).join('');
  let b = MAP.map((r,ri)=>{
    let tds = '';
    for (let i=0;i<3;i++){ const n=r[1+i*2], k=r[2+i*2]; tds += `<td class="${i===idx?'on':''}">${esc(n)}${k?`<span class="k">${esc(k)}</span>`:''}</td>`; }
    return `<tr><th scope="row">${CloudIcons.tile(RI[ri])}${esc(r[0])}</th>${tds}</tr>`;
  }).join('');
  document.getElementById('mapTable').innerHTML = `<thead><tr><th scope="col">역할</th>${h}</tr></thead><tbody>${b}</tbody>`;
}

// 결정 포인트
const DEC = [
  {t:'서브넷을 어디에 걸치는가',
   p:'영역 장애를 견디려면 앱 서버가 여러 영역에 있어야 합니다. 그 영역 분산을 네트워크에서 하느냐, 인스턴스 그룹에서 하느냐가 다릅니다.',
   aws:'서브넷 하나가 AZ 하나에 묶입니다. AZ 수 × 계층 수만큼 서브넷과 CIDR을 계획해야 합니다.',
   gcp:'서브넷이 리전 전체에 걸칩니다. 영역 분산은 리전 관리형 인스턴스 그룹 설정에서 정합니다.',
   azure:'서브넷에 영역 개념이 없습니다. 영역 분산은 VM Scale Set의 zones 설정에서 정합니다.',
   so:'AWS에서 가져온 설계를 그대로 옮기면 GCP·Azure에서는 불필요하게 서브넷이 늘어납니다. 반대 방향이면 AZ별 서브넷을 빠뜨리기 쉽습니다.'},
  {t:'로드밸런서는 리전인가 글로벌인가',
   p:'지금은 서울 리전 하나지만, 나중에 다른 리전을 추가할 가능성이 있다면 진입점의 범위가 중요해집니다.',
   aws:'ALB는 리전 리소스입니다. 여러 리전을 묶으려면 CloudFront나 Global Accelerator, Route 53 라우팅을 앞에 둡니다.',
   gcp:'외부 Application LB는 글로벌 Anycast IP 하나로 여러 리전 백엔드를 받을 수 있습니다.',
   azure:'Application Gateway는 리전 리소스입니다. 글로벌 진입점은 Front Door가 맡습니다.',
   so:'GCP는 리전 확장 시 진입점을 바꿀 필요가 적고, AWS·Azure는 처음부터 CDN 계층을 진입점으로 두면 나중이 편합니다.'},
  {t:'NAT의 고가용성은 누가 책임지나',
   p:'앱 서버는 비공개 서브넷에 있으므로 결제사 API 같은 외부 호출은 NAT를 거칩니다. NAT가 멈추면 사이트는 열려도 결제가 실패합니다.',
   aws:'NAT GW는 AZ 리소스입니다. AZ마다 하나씩 두고, 각 AZ 앱 서브넷의 라우팅 테이블이 같은 AZ의 NAT를 가리키게 합니다.',
   gcp:'Cloud NAT는 리전 단위 관리형 서비스라 영역 배치를 신경 쓰지 않아도 됩니다.',
   azure:'NAT Gateway는 SKU에 따라 영역 동작이 다릅니다. 영역 고정 리소스라면 영역별 구성을 따로 설계해야 합니다.',
   so:'AWS에서 NAT GW를 하나만 두면 비용은 아끼지만 그 AZ 장애 때 다른 AZ의 외부 호출까지 끊기고, AZ 간 데이터 전송 요금도 붙습니다.'},
  {t:'DB 장애조치를 앱이 견디는가',
   p:'세 클라우드 모두 다른 영역에 동기 복제 대기 인스턴스를 두고 자동 장애조치합니다. 차이는 클라우드보다 앱 쪽에 있습니다.',
   aws:'엔드포인트 DNS가 새 Primary를 가리킵니다. 앱이 DNS를 오래 캐시하면 장애조치 후에도 옛 주소로 붙습니다.',
   gcp:'접속 IP가 유지되므로 연결만 다시 맺으면 됩니다.',
   azure:'서버 이름(FQDN)이 새 Primary로 바뀝니다. AWS와 마찬가지로 DNS 캐시 시간을 짧게 둡니다.',
   so:'공통 원칙: 커넥션 풀에 재연결과 재시도를 넣고, 장애조치 동안 쓰기가 수십 초에서 수 분 멈출 수 있음을 전제로 설계합니다.'}
];
function renderDec(){
  const names = {aws:'AWS',gcp:'GCP',azure:'Azure'};
  document.getElementById('decisions').innerHTML = DEC.map(d=>`
    <article class="dec"><h3>${esc(d.t)}</h3><p>${esc(d.p)}</p>
    <dl class="v">${['aws','gcp','azure'].map(k=>`<dt class="v-${k}">${names[k]}</dt><dd class="${k===vendor?'on':''}">${esc(d[k])}</dd>`).join('')}</dl>
    <p class="so"><b>그래서</b> ${esc(d.so)}</p></article>`).join('');
}

// 코드
const CODE = {
  aws:{f:'iac/scenario-01/aws/main.tf', c:null},
  gcp:{f:'iac/scenario-01/gcp/main.tf', c:null},
  azure:{f:'iac/scenario-01/azure/main.tf', c:null}
};
function hl(src){
  return esc(src).split('\n').map(l=>{
    const i = l.indexOf('#');
    let a = i>=0 ? l.slice(0,i) : l, c = i>=0 ? l.slice(i) : '';
    a = a.replace(/(&quot;|")([^"]*)(")/g,'<span class="s">"$2"</span>');
    return a + (c ? `<span class="c">${c}</span>` : '');
  }).join('\n');
}
function renderCode(){
  document.getElementById('codeName').textContent = CODE[vendor].f;
  const c = CODE[vendor].c;
  document.getElementById('codeBox').innerHTML = c==null ? '불러오는 중…' : c===false ? '<span class="s">Terraform 파일을 불러오지 못했습니다. 저장소 루트에서 python3 -m http.server로 열어 주세요.</span>' : hl(c);
}
document.getElementById('copyBtn').addEventListener('click', e=>{
  const b = e.currentTarget, t = CODE[vendor].c || '';
  const done = ok => { b.textContent = ok ? '복사됨' : '선택됨'; setTimeout(()=>b.textContent='복사',1500); };
  try{
    navigator.clipboard.writeText(t).then(()=>done(true), ()=>{ selectCode(); done(false); });
  }catch(err){ selectCode(); done(false); }
});
function selectCode(){ const r=document.createRange(); r.selectNodeContents(document.getElementById('codeBox')); const s=getSelection(); s.removeAllRanges(); s.addRange(r); }

// 시뮬레이터 1: 용량
const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString('ko-KR');
function cap(){
  const peak=+$('cPeak').value, per=+$('cPer').value, util=+$('cUtil').value, az=+$('cAz').value;
  $('oPeak').textContent = fmt(peak)+' RPS'; $('oPer').textContent = fmt(per)+' RPS'; $('oUtil').textContent = util+'%';
  const need = Math.ceil(peak/(per*util/100));
  const perAz = Math.ceil(need/(az-1));
  const total = perAz*az;
  const naive = Math.ceil(need/az)*az;
  const over = Math.round((total-need)/need*100);
  let rows = '';
  for (let i=0;i<az;i++){
    const dead = i===0;
    const dots = perAz<=40 ? '<div class="dots">'+Array.from({length:perAz},()=>'<i></i>').join('')+'</div>' : `<span class="cnt">${fmt(perAz)}대</span>`;
    rows += `<div class="azrow ${dead?'dead':''}"><span class="nm">${dead?'영역 1 · 장애':'영역 '+(i+1)}</span>${dots}</div>`;
  }
  $('capRes').innerHTML = `<div class="big">${fmt(total)}<small> 대 상시 운영</small></div>
    <p>피크를 감당하는 데 필요한 것은 <b>${fmt(need)}대</b>. 영역 하나가 빠져도 남은 ${az-1}개 영역에 ${fmt(perAz*(az-1))}대가 남도록 영역당 ${fmt(perAz)}대를 둡니다. 평소 여유분은 <b>${over}%</b>입니다.</p>
    ${rows}
    <p>영역 장애를 고려하지 않았다면 ${fmt(naive)}대로 끝났을 계산입니다. ${az===2?'영역을 3개로 바꿔 여유분이 어떻게 변하는지 비교해 보세요.':'영역이 많을수록 영역 하나가 차지하는 비중이 작아져 여유분 부담이 줄어듭니다.'}</p>`;
}
['cPeak','cPer','cUtil','cAz'].forEach(id=>$(id).addEventListener('input',cap));

// 시뮬레이터 2: 가용성
function av(){
  const a=+$('aZone').value/10000, lb=+$('aLb').value/10000, ha=$('aHa').checked;
  $('oZone').textContent = (a*100).toFixed(2)+'%'; $('oLb').textContent = (lb*100).toFixed(2)+'%';
  const res = [1,2,3].map(n=>{
    const app = 1-Math.pow(1-a,n);
    const db = (ha && n>=2) ? 1-Math.pow(1-a,2) : a;
    const t = lb*app*db;
    return {n, t, min:(1-t)*43200};
  });
  const max = res[0].min;
  $('avTbl').innerHTML = '<thead><tr><th>구성</th><th style="text-align:right">가용성</th><th style="text-align:right">월 중단</th><th class="barw"></th></tr></thead><tbody>' +
    res.map(r=>`<tr class="${r.t>=0.999?'meet':''}"><td class="lbl">${r.n===1?'단일 영역':r.n+'개 영역'}</td><td class="n">${(r.t*100).toFixed(3)}%</td><td class="n">${r.min<1?r.min.toFixed(1):fmt(Math.round(r.min))}분</td><td class="barw"><div class="bar-i" style="width:${Math.max(r.min/max*100,1)}%"></div></td></tr>`).join('') +
    '</tbody>' + `<caption style="caption-side:bottom;text-align:left;font-size:13px;color:var(--muted);padding-top:8px">목표 99.9%는 월 43분 이하입니다.${!ha?' DB 대기 인스턴스가 없으면 앱을 아무리 분산해도 DB가 단일 영역 가용성에 묶입니다.':''}</caption>`;
}
['aZone','aLb','aHa'].forEach(id=>$(id).addEventListener('input',av));

// 체크리스트
const CHK = [
  ['NAT를 영역 하나에만 둔다','그 영역이 죽으면 다른 영역의 외부 API 호출까지 끊깁니다.'],
  ['DB에 공인 IP나 퍼블릭 접근을 열어 둔다','관리 편의로 잠깐 열었다가 그대로 남는 경우가 가장 많습니다. 접근은 배스천이나 관리형 터널로.'],
  ['세션을 앱 서버 메모리에 저장한다','인스턴스가 교체되거나 축소될 때 로그인이 풀립니다. 세션은 캐시로 뺍니다.'],
  ['헬스체크 경로가 DB까지 확인한다','DB 장애조치 몇 분 동안 모든 앱 서버가 비정상으로 빠져 사이트 전체가 내려갑니다. 헬스체크는 앱 자체 상태만 봅니다.'],
  ['오토스케일 최소값을 영역 수보다 작게 둔다','최소 1대면 그 1대가 있는 영역이 단일 장애점이 됩니다.'],
  ['영역 간 트래픽 요금을 계산하지 않는다','앱과 DB, 앱과 캐시가 다른 영역에 있으면 요청마다 영역 간 전송 요금이 쌓입니다.'],
  ['DB 비밀번호를 코드나 환경 변수 파일에 넣는다','시크릿 관리 서비스에 두고, 인스턴스 권한(역할·서비스 계정·관리 ID)으로 읽게 합니다.'],
  ['장애조치를 한 번도 실제로 해 보지 않는다','세 클라우드 모두 수동 장애조치 기능이 있습니다. 운영 전에 한 번 돌려 보고 앱의 재연결 시간을 잽니다.']
];
function renderChk(){
  $('checklist').innerHTML = CHK.map((c,i)=>`<li><input type="checkbox" id="chk${i}"><label for="chk${i}"><b>${esc(c[0])}</b><span>${esc(c[1])}</span></label></li>`).join('');
  const upd = ()=>{ const n = document.querySelectorAll('#checklist input:checked').length; $('chkProg').textContent = `${n} / ${CHK.length} 확인`; };
  $('checklist').addEventListener('change',upd); upd();
}

// 클라우드 전환
function setVendor(v){
  vendor = v;
  document.body.dataset.vendor = v;
  try{ localStorage.setItem('archbook-vendor', v); }catch(e){}
  document.querySelectorAll('#vendorSeg button').forEach(b=>b.setAttribute('aria-pressed', b.dataset.v===v));
  render(); renderMap(); renderDec(); renderCode();
}
document.querySelectorAll('#vendorSeg button').forEach(b=>b.addEventListener('click',()=>setVendor(b.dataset.v)));
$('failBtn').addEventListener('click',()=>{ failA=!failA; render(); });

document.getElementById('legend').innerHTML = [['users','사용자'],['dns','DNS'],['edge','CDN·WAF'],['lb','로드밸런서'],['nat','NAT'],['vm','앱 서버'],['db','DB'],['obj','오브젝트'],['cache','캐시'],['secret','시크릿'],['mon','모니터링']].map(([k,t])=>`<span>${CloudIcons.tile(k)}${t}</span>`).join('');
setVendor(vendor); cap(); av(); renderChk();

// 공유 데이터 불러오기 (저장소 루트 기준 경로)
const ROOT = '../../';
fetch(ROOT+'shared/data/services.json').then(r=>{ if(!r.ok) throw 0; return r.json(); }).then(d=>{
  MAP = d.services.map(s=>[s.role,s.aws.name,s.aws.scope,s.gcp.name,s.gcp.scope,s.azure.name,s.azure.scope]);
  MAP_ICONS = d.services.map(s=>s.icon);
}).catch(()=>{}).finally(renderMap);
Promise.all(['aws','gcp','azure'].map(v=>fetch(ROOT+CODE[v].f).then(r=>{ if(!r.ok) throw 0; return r.text(); }).then(t=>{ CODE[v].c=t.replace(/\n$/,''); }).catch(()=>{ CODE[v].c=false; }))).then(renderCode);
CloudIcons.ready.then(render);
})();
