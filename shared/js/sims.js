/* ArchBook 시뮬레이터 라이브러리
   CloudSims.mount(el, {type, title?, q?, values?}, vendor)
   모든 계산은 교육용 근사이며, 각 시뮬레이터 아래 note에 계산식과 가정을 적는다. */
(function(){
  const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const fmt = (n, d=0) => Number(n).toLocaleString('ko-KR', {maximumFractionDigits:d, minimumFractionDigits:0});
  const ceil = Math.ceil;
  const mounted = [];
  const VN = {aws:'AWS', gcp:'GCP', azure:'Azure'};

  /* 작은 선 그래프 */
  function chart(series, o){
    const W = 360, H = 190, L = 44, R = 10, T = 12, B = 30;
    const xs = series.flatMap(s=>s.pts.map(p=>p[0])), ys = series.flatMap(s=>s.pts.map(p=>p[1]));
    const x0 = Math.min(...xs), x1 = Math.max(...xs) || 1, y1 = Math.max(...ys, o.yMin||0) * 1.08 || 1;
    const X = x => L + (x-x0)/(x1-x0||1)*(W-L-R), Y = y => H-B - y/y1*(H-T-B);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria||'')}">`;
    for (let i=0;i<=4;i++){ const v = y1*i/4, y = Y(v);
      s += `<line x1="${L}" x2="${W-R}" y1="${y}" y2="${y}" class="cg"/><text x="${L-6}" y="${y+4}" class="ct" text-anchor="end">${fmt(v, v<10?1:0)}</text>`; }
    for (let i=0;i<=4;i++){ const v = x0+(x1-x0)*i/4; s += `<text x="${X(v)}" y="${H-B+16}" class="ct" text-anchor="middle">${fmt(v, 0)}</text>`; }
    s += `<text x="${W-R}" y="${H-2}" class="ct" text-anchor="end">${esc(o.xLabel||'')}</text>`;
    series.forEach(se => {
      const d = se.pts.map((p,i)=>`${i?'L':'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join(' ');
      if (se.fill) s += `<path d="${d} L${X(se.pts.at(-1)[0])} ${Y(0)} L${X(se.pts[0][0])} ${Y(0)} z" class="ca ${se.cls}"/>`;
      s += `<path d="${d}" class="cl ${se.cls}"/>`;
    });
    s += '</svg>';
    s += `<div class="ckey">${series.map(se=>`<span><i class="${se.cls}"></i>${esc(se.name)}</span>`).join('')}</div>`;
    return s;
  }

  /* 정의: controls(슬라이더·선택·체크) + run(값, vendor) → HTML */
  const T = {};

  T.capacity = {
    title:'영역 하나가 죽어도 버티려면 몇 대가 필요할까', q:'영역을 2개에서 3개로 늘리면 총 대수는 늘까요, 줄까요?',
    c:[['peak','피크 요청 수',100,50000,100,3000,' RPS'],['per','인스턴스 1대 처리량',50,5000,50,400,' RPS'],['util','목표 사용률',40,90,5,70,'%'],['az','영역 수',2,3,1,2,'개']],
    run(v){ const need = ceil(v.peak/(v.per*v.util/100)), perAz = ceil(need/(v.az-1)), total = perAz*v.az;
      return `<div class="big">${fmt(total)}<small> 대 상시 운영</small></div><p>피크에 필요한 것은 <b>${fmt(need)}대</b>. 영역 하나가 빠져도 남은 ${v.az-1}개 영역에 ${fmt(perAz*(v.az-1))}대가 남도록 영역당 ${fmt(perAz)}대를 둡니다. 평소 여유분은 <b>${fmt((total-need)/need*100)}%</b>입니다.</p>`; },
    note:'필요 대수 = 올림(피크 ÷ (1대 처리량 × 목표 사용률)), 영역당 = 올림(필요 대수 ÷ (영역 수 − 1)).'
  };

  T.concurrency = {
    title:'동시에 몇 개의 실행 환경이 필요할까', q:'응답 시간이 2배가 되면 필요한 실행 환경 수는 어떻게 될까요?',
    c:[['rps','초당 요청 수',1,5000,1,500,' RPS'],['lat','평균 응답 시간',10,5000,10,200,' ms'],['per','컨테이너 1개가 동시에 받는 요청',1,1000,1,80,'개'],['limit','동시 실행 한도',100,10000,100,1000,'개']],
    run(v, vd){
      const conc = v.rps*v.lat/1000;
      const rows = [['aws','Lambda', ceil(conc), '실행 환경 하나가 요청 하나씩 처리'],
                    ['gcp','Cloud Run', ceil(conc/v.per), `인스턴스당 동시 요청 ${v.per}개 기준`],
                    ['azure','Functions (Flex Consumption)', ceil(conc/v.per), `인스턴스당 HTTP 동시 처리 ${v.per}개 기준`]];
      return `<div class="big">${fmt(conc,1)}<small> 개 요청이 동시에 처리 중</small></div>
        <table class="av"><thead><tr><th>서비스</th><th style="text-align:right">필요 수</th><th>기준</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r[0]===vd?'cur':''}"><td>${r[1]}</td><td class="n">${fmt(r[2])}${r[2]>v.limit?' <span class="bad">한도 초과</span>':''}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table>
        <p>한도를 넘으면 초과 요청은 거절(스로틀)되거나 대기합니다. 응답 시간을 줄이는 것이 동시성 한도를 늘리는 것과 같은 효과를 냅니다.</p>`; },
    note:'리틀의 법칙: 동시 처리 수 = 초당 요청 수 × 평균 응답 시간. 동시 실행 한도와 인스턴스당 동시 요청 수의 실제 기본값은 서비스·요금제·계정 할당량마다 다르므로 문서로 확인하세요.'
  };

  T.queue = {
    title:'몰려든 메시지를 소비자가 언제 다 처리할까', q:'소비자를 2배로 늘리면 적체가 풀리는 시간도 절반이 될까요?',
    c:[['base','평소 유입',1,5000,1,100,'건/초'],['mult','급증 배수',1,20,1,6,'배'],['dur','급증 지속',1,120,1,15,'분'],['n','소비자 수',1,200,1,8,'개'],['mu','소비자 1개 처리량',1,500,1,20,'건/초']],
    run(v){
      const cap = v.n*v.mu, peak = v.base*v.mult, T = v.dur*60;
      if (cap <= v.base) return `<div class="big bad">적체가 끝나지 않음</div><p>평소 유입(${fmt(v.base)}건/초)이 처리량(${fmt(cap)}건/초)보다 많아 급증이 없어도 큐가 계속 쌓입니다. 소비자를 늘리거나 처리 시간을 줄여야 합니다.</p>`;
      const grow = Math.max(0, peak-cap), backlog = grow*T, drain = backlog/(cap-v.base);
      const end = T + drain, pts = [];
      for (let i=0;i<=60;i++){ const t = end*1.15*i/60; const b = t<=T ? grow*t : Math.max(0, backlog-(cap-v.base)*(t-T)); pts.push([t/60, b]); }
      return `<div class="big">${fmt(backlog)}<small> 건 최대 적체</small></div>
        <p>급증 동안 초당 ${fmt(grow)}건씩 쌓이고, 끝난 뒤 초당 ${fmt(cap-v.base)}건씩 줄어 <b>${fmt(drain/60,1)}분</b> 뒤에 비워집니다. 마지막 메시지는 최대 약 <b>${fmt(backlog/cap/60,1)}분</b> 기다립니다.</p>
        ${chart([{name:'적체 메시지', cls:'s1', fill:true, pts}], {xLabel:'분', aria:'시간에 따른 큐 적체'})}`; },
    note:'유체 근사: 적체 증가 속도 = 유입 − 처리량, 소진 속도 = 처리량 − 평소 유입. 메시지 처리 실패와 재시도, 소비자 자동 확장은 넣지 않았습니다.'
  };

  T.spike = {
    title:'오토스케일이 따라오는 동안 몇 건을 놓칠까', q:'인스턴스가 뜨는 시간이 절반이 되면 놓치는 요청도 절반이 될까요?',
    c:[['base','평소 요청',100,20000,100,2000,' RPS'],['mult','피크 배수',2,50,1,10,'배'],['ramp','피크까지 걸리는 시간',10,1800,10,60,'초'],['delay','감지 + 부팅 지연',10,600,10,180,'초'],['per','인스턴스 1대 처리량',50,5000,50,500,' RPS'],['minI','미리 띄워 둔 인스턴스',1,500,1,6,'대']],
    run(v){
      const peak = v.base*v.mult, H = v.ramp + v.delay + 300, pts1=[], pts2=[];
      const dem = t => t<0 ? v.base : v.base + (peak-v.base)*Math.min(t/v.ramp,1);
      let lost = 0, total = 0, maxGap = 0;
      for (let t=0;t<=H;t++){
        const d = dem(t), inst = Math.max(v.minI, ceil(dem(t-v.delay)/v.per)), c = inst*v.per;
        lost += Math.max(0,d-c); total += d; maxGap = Math.max(maxGap, d-c);
        if (t % Math.max(1,Math.floor(H/60)) === 0){ pts1.push([t,d]); pts2.push([t,c]); }
      }
      const need = ceil(peak/v.per);
      return `<div class="big ${lost>0?'bad':''}">${fmt(lost)}<small> 건 처리 못 함 (${fmt(lost/total*100,2)}%)</small></div>
        <p>피크 ${fmt(peak)} RPS를 받으려면 ${fmt(need)}대가 필요합니다. 지연 ${v.delay}초 동안은 미리 띄워 둔 ${fmt(v.minI)}대(${fmt(v.minI*v.per)} RPS)로 버텨야 합니다. ${lost>0?`놓치지 않으려면 피크 직전까지 <b>${fmt(need)}대</b>를 미리 올려 두거나, 대기열로 요청을 받아 두어야 합니다.`:'지금 설정이면 놓치는 요청이 없습니다.'}</p>
        ${chart([{name:'들어오는 요청', cls:'s2', pts:pts1},{name:'처리 용량', cls:'s1', pts:pts2}], {xLabel:'초', aria:'요청과 처리 용량'})}`; },
    note:'수요는 피크까지 직선으로 오르고, 오토스케일러는 지연 시간만큼 늦게 그 시점 수요에 맞춰 대수를 맞춘다고 가정했습니다. 실제로는 지표 수집 주기, 쿨다운, 헬스체크 시간이 더해집니다.'
  };

  T.rpo = {
    title:'어떤 재해 복구 전략이 목표를 맞출까', q:'비동기 복제의 지연이 커지면 RTO와 RPO 중 어느 쪽이 나빠질까요?',
    c:[['tRpo','목표 RPO',0,1440,1,15,'분'],['tRto','목표 RTO',1,1440,1,60,'분'],['bk','백업 주기',1,24,1,24,'시간'],['restore','백업 복원 시간',5,720,5,180,'분'],['lag','복제 지연',0,600,1,5,'초'],['detect','장애 감지·판단',1,60,1,10,'분'],['promote','DB 승격',1,60,1,5,'분'],['scale','앱 확장',0,60,1,15,'분'],['ttl','DNS TTL',0,3600,30,60,'초']],
    run(v){
      const dns = v.ttl/60, lagM = v.lag/60;
      const rows = [
        ['백업·복원', v.bk*60, v.detect+v.restore+v.scale+dns, '다른 리전에 백업만 복제'],
        ['파일럿 라이트', lagM, v.detect+v.promote+v.scale+dns, 'DB 복제본만 켜 두고 앱은 최소'],
        ['웜 스탠바이', lagM, v.detect+v.promote+dns, '작게라도 전체 스택이 상시 동작'],
        ['액티브-액티브', lagM, v.detect, '두 리전이 함께 트래픽을 받음']];
      return `<table class="av"><thead><tr><th>전략</th><th style="text-align:right">RPO</th><th style="text-align:right">RTO</th><th>구성</th></tr></thead><tbody>${rows.map(r=>{
        const ok = r[1]<=v.tRpo && r[2]<=v.tRto;
        return `<tr class="${ok?'meet':''}"><td class="lbl">${r[0]}</td><td class="n ${r[1]>v.tRpo?'bad':''}">${fmt(r[1],1)}분</td><td class="n ${r[2]>v.tRto?'bad':''}">${fmt(r[2],1)}분</td><td>${r[3]}</td></tr>`; }).join('')}</tbody></table>
        <p>RPO는 <b>얼마나 최근 데이터까지 잃는가</b>, RTO는 <b>얼마나 오래 멈추는가</b>입니다. 복제 지연은 RPO를, 감지·승격·확장 시간은 RTO를 정합니다.</p>`; },
    note:'백업·복원의 RPO는 백업 주기 전체(최악), 나머지는 복제 지연으로 계산했습니다. 액티브-액티브라도 쓰기 충돌 처리, 동기 복제 시 지연 증가 같은 비용이 있습니다.'
  };

  T.cidr = {
    title:'이 주소 공간으로 서브넷이 몇 개 나올까', q:'같은 /16이라도 클라우드에 따라 필요한 서브넷 수가 다를까요?',
    c:[['vpc','VPC·VNet 접두사 (/n)',16,24,1,20,''],['az','영역 수',1,3,1,3,'개'],['tiers','계층 수 (퍼블릭·앱·DB…)',1,6,1,3,'개'],['sub','서브넷 접두사 (/n)',20,28,1,24,''],['envs','같은 대역을 나눠 쓸 환경 수',1,8,1,3,'개']],
    run(v, vd){
      const total = 2**(32-v.vpc), per = 2**(32-v.sub), fitN = total/per;
      const rows = [['aws','AWS', v.az*v.tiers, 5, '서브넷이 AZ 하나에 묶임'],['gcp','GCP', v.tiers, 4, '서브넷이 리전 전체에 걸침'],['azure','Azure', v.tiers, 5, '서브넷에 영역 구분 없음']];
      return `<p>/${v.vpc} 하나에는 /${v.sub} 서브넷이 <b>${fmt(fitN)}개</b> 들어갑니다. 환경 ${v.envs}개가 겹치지 않으려면 /${v.vpc}가 ${v.envs}개, 즉 주소 ${fmt(total*v.envs)}개가 필요합니다.</p>
        <table class="av"><thead><tr><th>클라우드</th><th style="text-align:right">필요 서브넷</th><th style="text-align:right">서브넷당 사용 가능 IP</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr class="${r[0]===vd?'cur':''}"><td>${r[1]}</td><td class="n ${r[2]>fitN?'bad':''}">${fmt(r[2])}</td><td class="n">${fmt(per-r[3])}</td><td>${r[4]}</td></tr>`).join('')}</tbody></table>`; },
    note:'각 서브넷에서 클라우드가 예약하는 주소: AWS 5개, Azure 5개, GCP 4개(기본 대역 기준). 환경끼리 VPC 피어링이나 허브로 연결하려면 대역이 겹치면 안 됩니다.'
  };

  T.podip = {
    title:'노드가 늘면 IP가 얼마나 필요할까', q:'노드당 파드 수를 늘리면 어느 클라우드의 VPC 주소가 가장 빨리 바닥날까요?',
    c:[['nodes','노드 수',3,1000,1,60,'대'],['pods','노드당 최대 파드',10,250,1,30,'개'],['sub','노드 서브넷 접두사 (/n)',16,26,1,22,'']],
    run(v, vd){
      const subIPs = 2**(32-v.sub);
      const gkeBlock = 2**Math.ceil(Math.log2(v.pods*2));
      const rows = [
        ['aws','EKS · VPC CNI', v.nodes*(1+v.pods), '노드 서브넷', '파드마다 VPC IP를 하나씩 씀 (접두사 위임 미사용 기준)'],
        ['gcp','GKE · VPC 네이티브', v.nodes, '노드 서브넷', `파드는 보조 대역에서 노드당 /${32-Math.log2(gkeBlock)}씩, 합계 ${fmt(v.nodes*gkeBlock)}개`],
        ['azure','AKS · Azure CNI Overlay', v.nodes, '노드 서브넷', `파드는 VNet 밖 오버레이 대역에서 노드당 /24씩, 합계 ${fmt(v.nodes*256)}개`]];
      return `<table class="av"><thead><tr><th>구성</th><th style="text-align:right">서브넷에서 쓰는 IP</th><th>파드 주소</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r[0]===vd?'cur':''}"><td>${r[1]}</td><td class="n ${r[2]>subIPs-5?'bad':''}">${fmt(r[2])} / ${fmt(subIPs)}</td><td>${r[4]}</td></tr>`).join('')}</tbody></table>
        <p>노드 서브넷 /${v.sub}의 주소는 ${fmt(subIPs)}개입니다. 빨간 숫자는 서브넷이 모자라다는 뜻입니다.</p>`; },
    note:'GKE는 노드당 최대 파드 수의 2배 이상인 2의 거듭제곱 크기 블록을 노드마다 잡습니다(110개면 /24). AKS 오버레이는 기본으로 노드당 /24를 씁니다. EKS는 접두사 위임을 켜면 /28 단위로 받아 소비가 달라집니다. 롤링 업데이트 때 늘어나는 노드 몫도 남겨 두세요.'
  };

  T.scan = {
    title:'쿼리 하나가 데이터를 얼마나 읽을까', q:'날짜 파티션만 걸어도 읽는 양이 몇 분의 일로 줄까요?',
    c:[['daily','하루 적재량 (원본)',1,5000,1,200,' GB'],['days','보관 기간',30,1825,1,365,'일'],['range','쿼리 기간',1,365,1,7,'일'],['cols','읽는 열 비율',1,100,1,15,'%'],['ratio','열 지향 압축률',1,15,1,5,'배']],
    run(v){
      const raw = v.daily*v.days, part = v.daily*Math.min(v.range,v.days), col = part/v.ratio*v.cols/100;
      const rows = [['원본 CSV·JSON, 파티션 없음', raw],['날짜 파티션', part],['파티션 + 열 지향(Parquet 등) + 필요한 열만', col]];
      return `<div class="big">${fmt(col,1)}<small> GB를 읽음 (최적화 후)</small></div>
        <table class="av"><tbody>${rows.map(r=>`<tr><td>${r[0]}</td><td class="n">${fmt(r[1],1)} GB</td><td class="barw"><div class="bar-i" style="width:${Math.max(r[1]/raw*100,0.6)}%"></div></td></tr>`).join('')}</tbody></table>
        <p>최적화 전보다 <b>${fmt(raw/col)}배</b> 적게 읽습니다. 읽은 양에 비례해 과금되는 쿼리 엔진(Athena, BigQuery 온디맨드, Synapse 서버리스 SQL)에서는 비용도 같은 비율로 줄어듭니다.</p>`; },
    note:'압축률과 열 비율은 데이터마다 크게 다릅니다. 파티션 수가 지나치게 많으면 메타데이터 처리 비용이 오히려 늘어납니다.'
  };

  T.rag = {
    title:'문서를 몇 조각으로 나누고, 질문 하나에 토큰을 얼마나 쓸까', q:'청크를 절반 크기로 줄이면 인덱스와 질문당 토큰은 어떻게 바뀔까요?',
    c:[['docs','문서 수',100,1000000,100,20000,'개'],['tok','문서당 평균 토큰',100,20000,100,1500,''],['chunk','청크 크기',100,2000,50,500,' 토큰'],['ov','청크 겹침',0,500,10,50,' 토큰'],['dim','임베딩 차원',256,3072,128,1024,''],['k','검색해서 넣는 청크 수',1,30,1,6,'개'],['sys','시스템 지시 + 대화 이력',0,20000,100,1500,' 토큰'],['win','모델 컨텍스트 창',4000,1000000,1000,128000,' 토큰']],
    run(v){
      const step = Math.max(1, v.chunk - v.ov), per = Math.max(1, ceil((v.tok - v.ov)/step)), chunks = v.docs*per;
      const embTok = chunks*v.chunk, mem = chunks*v.dim*4/1e9, q = v.sys + v.k*v.chunk + 200;
      return `<div class="big">${fmt(chunks)}<small> 개 청크</small></div>
        <table class="av"><tbody>
        <tr><td>임베딩에 넣는 총 토큰 (최초 1회)</td><td class="n">${fmt(embTok/1e6,1)}M</td></tr>
        <tr><td>벡터 원본 크기 (float32, 인덱스 부가 구조 제외)</td><td class="n">${fmt(mem,2)} GB</td></tr>
        <tr><td>질문 하나의 입력 토큰 (질문 200 포함)</td><td class="n ${q>v.win?'bad':''}">${fmt(q)}</td></tr>
        <tr><td>컨텍스트 창 사용률</td><td class="n">${fmt(q/v.win*100,1)}%</td></tr></tbody></table>
        <p>모델 호출 비용과 지연은 대부분 질문당 입력 토큰에 비례합니다. 청크 수(k)를 늘리기 전에 검색 품질(재순위, 필터)을 먼저 높이는 편이 쌉니다.</p>`; },
    note:'청크 수 = 올림((문서 토큰 − 겹침) ÷ (청크 − 겹침)). 벡터 크기 = 청크 × 차원 × 4바이트. 실제 인덱스(HNSW 등)는 그래프 구조 때문에 이보다 큽니다.'
  };

  T.gpu = {
    title:'이 모델을 서빙하려면 GPU 메모리가 얼마나 필요할까', q:'배치를 키우면 무엇이 먼저 모자랄까요, 가중치일까요 KV 캐시일까요?',
    c:[['p','모델 파라미터',1,400,1,8,'B'],['bits','가중치 정밀도',4,16,4,16,'비트'],['layers','레이어 수',8,128,1,32,''],['hidden','히든 크기',1024,16384,256,4096,''],['gqa','KV 헤드 비율 (GQA)',1,8,1,4,'분의 1'],['seq','요청당 토큰 길이',512,131072,512,8192,''],['batch','동시 요청 수',1,256,1,16,'개'],['gmem','GPU 1장 메모리',16,192,8,80,' GB']],
    run(v){
      const w = v.p*1e9*v.bits/8/1e9;
      const kv = 2*v.layers*(v.hidden/v.gqa)*2*v.seq*v.batch/1e9;
      const total = (w+kv)*1.1, g = ceil(total/v.gmem);
      return `<div class="big">${fmt(g)}<small> 장 (${fmt(total,1)} GB)</small></div>
        <table class="av"><tbody><tr><td>가중치</td><td class="n">${fmt(w,1)} GB</td><td class="barw"><div class="bar-i" style="width:${w/(w+kv)*100}%;background:var(--accent)"></div></td></tr>
        <tr><td>KV 캐시 (FP16)</td><td class="n">${fmt(kv,1)} GB</td><td class="barw"><div class="bar-i" style="width:${kv/(w+kv)*100}%"></div></td></tr></tbody></table>
        <p>가중치는 모델 크기로 고정되지만 KV 캐시는 <b>요청 길이 × 동시 요청 수</b>에 비례해 늘어납니다. 긴 문맥을 많이 받으려면 GPU를 늘리거나, KV 캐시를 줄이는 서빙 엔진 기능을 씁니다.</p>`; },
    note:'KV 캐시 = 2 × 레이어 × (히든 ÷ GQA 비율) × 2바이트 × 토큰 길이 × 동시 요청 수. 활성값과 프레임워크 몫으로 10%를 더했습니다. 모델 구조마다 실제 값은 다릅니다.'
  };

  T.transfer = {
    title:'데이터를 옮기는 데 며칠이 걸릴까', q:'10배 넓은 회선이면 정말 10배 빨리 끝날까요?',
    c:[['tb','옮길 데이터',1,2000,1,100,' TB'],['gbps','회선 대역폭',0.1,100,0.1,1,' Gbps'],['eff','실효 사용률',10,95,5,70,'%']],
    run(v){
      const sec = v.tb*8e12/(v.gbps*1e9*v.eff/100), days = sec/86400;
      const opts = [1,10,100].map(g=>[g, v.tb*8e12/(g*1e9*v.eff/100)/86400]);
      return `<div class="big">${fmt(days,1)}<small> 일</small></div>
        <table class="av"><tbody>${opts.map(o=>`<tr><td>${o[0]} Gbps</td><td class="n">${fmt(o[1],1)}일</td></tr>`).join('')}</tbody></table>
        <p>수십 TB 이상을 한 번에 옮길 때는 전용선 개통 기간과 비교해 오프라인 전송 장비(AWS Snowball 계열, Azure Data Box 등)도 검토합니다. 업무 시간 회선을 함께 쓰면 실효 사용률을 낮춰 잡으세요.</p>`; },
    note:'시간 = 데이터 × 8 ÷ (대역폭 × 실효 사용률). 프로토콜 오버헤드, 재전송, 지연 시간이 큰 구간의 TCP 창 크기 제한은 실효 사용률에 뭉뚱그렸습니다.'
  };

  T.logvol = {
    title:'감사 로그를 보관하려면 저장 공간이 얼마나 들까', q:'보관 기간을 1년에서 5년으로 늘리면 핫 스토리지도 5배가 필요할까요?',
    c:[['eps','초당 이벤트',1,50000,1,500,'건'],['bytes','이벤트당 크기',100,5000,50,800,'바이트'],['hot','검색용 보관 (핫)',7,365,1,90,'일'],['years','전체 보관 기간',1,10,1,5,'년'],['comp','보관 압축률',1,20,1,8,'배']],
    run(v){
      const day = v.eps*v.bytes*86400/1e9, hot = day*v.hot, arch = day*(v.years*365 - v.hot)/v.comp;
      return `<div class="big">${fmt(day,1)}<small> GB / 일</small></div>
        <table class="av"><tbody><tr><td>검색용 핫 저장 (${v.hot}일)</td><td class="n">${fmt(hot/1000,2)} TB</td></tr>
        <tr><td>보관용 아카이브 (나머지, 압축)</td><td class="n">${fmt(arch/1000,2)} TB</td></tr></tbody></table>
        <p>핫 저장은 검색이 필요한 기간만큼만 두고, 나머지는 변경 불가(WORM) 설정을 한 오브젝트 스토리지의 저렴한 계층으로 옮기는 것이 일반적입니다.</p>`; },
    note:'일일 용량 = 초당 이벤트 × 크기 × 86,400. 로그 분석 서비스는 수집량 기준으로 과금되는 경우가 많아, 핫 보관 기간이 비용을 크게 좌우합니다.'
  };

  T.rightsize = {
    title:'크기를 맞추고 약정을 걸면 얼마나 줄까', q:'평균 사용률 20%인 서버 100대는 몇 대로 줄일 수 있을까요?',
    c:[['n','현재 인스턴스',1,2000,1,100,'대'],['avg','평균 CPU 사용률',5,90,1,20,'%'],['peakR','피크 / 평균 비율',1,5,0.1,2.5,'배'],['target','목표 피크 사용률',40,90,5,70,'%'],['base','하루 내내 필요한 비율',0,100,5,60,'%']],
    run(v){
      const peakUse = Math.min(100, v.avg*v.peakR), need = ceil(v.n*peakUse/v.target);
      const cut = Math.max(0, (v.n-need)/v.n*100), baseN = ceil(need*v.base/100);
      return `<div class="big">${fmt(need)}<small> 대면 충분 (${fmt(cut)}% 감축)</small></div>
        <p>피크 때 사용률이 약 ${fmt(peakUse)}%이므로, 목표 ${v.target}%에 맞추면 ${fmt(need)}대가 필요합니다. 그중 하루 내내 켜 있는 <b>${fmt(baseN)}대</b>는 약정 할인(Savings Plans, 확약 사용 할인, 예약 인스턴스·절감 플랜)으로, 나머지 ${fmt(need-baseN)}대는 오토스케일과 온디맨드·스팟으로 덮습니다.</p>`; },
    note:'대수만 줄이는 계산입니다. 실제로는 메모리 병목, 인스턴스 세대 교체(같은 성능에 더 싼 세대), 스케줄 기반 종료(개발 환경 야간 종료)도 함께 봅니다.'
  };

  T.multicloud = {
    title:'두 번째 클라우드로 장애조치하면 중단이 얼마나 줄까', q:'장애조치 성공률이 낮다면 멀티클라우드가 오히려 나쁠 수 있을까요?',
    c:[['a','주 클라우드 연간 가용성',99,99.999,0.001,99.95,'%'],['k','연간 장애 횟수',1,20,1,3,'회'],['p','장애조치 성공 확률',0,100,5,80,'%'],['f','장애조치 소요',1,240,1,30,'분'],['extra','이중화로 늘어나는 운영 장애',0,10,1,1,'회/년']],
    run(v){
      const single = (1-v.a/100)*525600, d = single/v.k;
      const multi = v.k*((v.p/100)*Math.min(d, v.f) + (1-v.p/100)*d) + v.extra*v.f;
      return `<table class="av"><tbody><tr><td>단일 클라우드</td><td class="n">${fmt(single)}분/년</td></tr>
        <tr class="${multi<single?'meet':''}"><td class="lbl">두 클라우드 + 장애조치</td><td class="n ${multi>single?'bad':''}">${fmt(multi)}분/년</td></tr></tbody></table>
        <p>장애 한 번의 평균 길이는 ${fmt(d)}분입니다. 장애조치가 그보다 오래 걸리거나 자주 실패하면, 그리고 복잡해진 구성 자체가 장애를 만들면 이득이 사라집니다.</p>`; },
    note:'두 클라우드가 동시에 멈추는 경우는 무시했습니다. "늘어나는 운영 장애"는 복제·전환 자동화, 이중 배포 파이프라인처럼 구성이 복잡해져 생기는 사고를 뜻합니다.'
  };

  T.availability = {
    title:'영역을 늘리면 중단 시간은 얼마나 줄까', q:'영역 하나가 99.5%라면 단일 영역으로 99.9%를 맞출 수 있을까요?',
    c:[['a','영역 하나의 가용성',99,99.99,0.01,99.5,'%'],['lb','진입점 가용성',99.9,99.99,0.01,99.99,'%']],
    run(v){
      const a=v.a/100, lb=v.lb/100;
      const res=[1,2,3].map(n=>{ const t = lb*(1-Math.pow(1-a,n))*(n>=2?1-Math.pow(1-a,2):a); return [n,t,(1-t)*43200]; });
      return `<table class="av"><tbody>${res.map(r=>`<tr class="${r[1]>=0.999?'meet':''}"><td class="lbl">${r[0]===1?'단일 영역':r[0]+'개 영역'}</td><td class="n">${(r[1]*100).toFixed(3)}%</td><td class="n">${r[2]<1?fmt(r[2],1):fmt(r[2])}분/월</td></tr>`).join('')}</tbody></table>`; },
    note:'영역 장애가 독립이라고 가정한 근사입니다. 실제로는 함께 무너뜨리는 원인(배포 실수, 리전 장애)이 있어 이보다 낮습니다.'
  };

  /* ---------- 마운트 ---------- */
  function mount(el, cfg, vendor){
    const def = T[cfg.type]; if (!el || !def) return;
    const vals = Object.assign({}, ...def.c.map(c=>({[c[0]]:c[5]})), cfg.values||{});
    const uid = el.id;
    el.innerHTML = `<div class="sim-h"><h3>${esc(cfg.title||def.title)}</h3><p class="q">예측해 보기: ${esc(cfg.q||def.q)}</p></div>
      <div class="sim-b"><div class="ctl">${def.c.map(c=>`<label for="${uid}-${c[0]}"><span class="row">${esc(c[1])} <output id="${uid}-o-${c[0]}"></output></span>
        <input type="range" id="${uid}-${c[0]}" min="${c[2]}" max="${c[3]}" step="${c[4]}" value="${vals[c[0]]}"></label>`).join('')}</div>
      <div class="res" id="${uid}-res" aria-live="polite"></div></div><p class="note">${esc(cfg.note||def.note)}</p>`;
    const st = {vendor};
    const update = ()=>{
      const v = {};
      def.c.forEach(c=>{ const x = +document.getElementById(`${uid}-${c[0]}`).value; v[c[0]] = x;
        document.getElementById(`${uid}-o-${c[0]}`).textContent = (c[0]==='vpc'||c[0]==='sub'?'/':'') + fmt(x, String(c[4]).includes('.')?String(c[4]).split('.')[1].length:0) + c[6]; });
      document.getElementById(`${uid}-res`).innerHTML = def.run(v, st.vendor);
    };
    el.addEventListener('input', update); update();
    mounted.push({st, update});
  }
  window.CloudSims = { mount, types: T, vendorChanged(v){ mounted.forEach(m=>{ m.st.vendor = v; m.update(); }); } };
})();
