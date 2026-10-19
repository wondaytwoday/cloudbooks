window.SCENARIO = {
  no: 10, level: 'advanced', title: '트래픽 급증 대응',
  lede: '티켓 오픈, 한정판 판매처럼 시각이 정해진 급증은 오토스케일만으로는 받을 수 없습니다. 인스턴스가 뜨는 몇 분 사이에 피크가 지나가기 때문입니다. 엣지에서 줄이고, 미리 올리고, 대기실로 속도를 맞추고, 재고 차감 병목을 없애는 네 가지를 함께 씁니다.',
  region: {aws:'ap-northeast-2', gcp:'asia-northeast3', azure:'Korea Central'},
  req: [
    {k:'평시', v:'2,000 RPS', s:'공연 정보 조회 위주'},
    {k:'오픈 순간', v:'60초 만에 50배', s:'최대 10만 RPS'},
    {k:'재고', v:'좌석 1만 석', s:'초과 판매·중복 구매 금지'},
    {k:'공정성', v:'선착순 + 봇 차단', s:'매크로 차단 요구'}
  ],
  intro: { arch: '백엔드는 정해진 속도로만 요청을 받고, 나머지는 엣지와 대기실이 막아 줍니다. <b>오픈 순간 50배 유입</b>을 눌러 각 단계가 무엇을 하는지 보세요.' },
  diagram: {
    w: 680, h: 460,
    frames: [
      {id:'region', kind:'region', x:240, y:124, w:426, h:326, label:{aws:'서울 리전 · ap-northeast-2', gcp:'서울 리전 · asia-northeast3', azure:'서울 리전 · Korea Central'}, labelRight:true},
      {id:'edgeband', kind:'band', x:14, y:52, w:652, h:62, label:'엣지'}
    ],
    nodes: [
      {id:'users', x:280, y:6, w:120, h:34, icon:'users', t:'예매 고객', s:''},
      {id:'edge', x:230, y:60, w:240, h:48, icon:'waf', t:'CDN + WAF', s:{aws:'CloudFront · WAF Bot Control', gcp:'Cloud CDN · Cloud Armor', azure:'Front Door · WAF 봇 관리'}, kind:'reg', failS:'봇·과다 요청 차단 중'},
      {id:'room', x:20, y:150, w:200, h:52, icon:{aws:'func', gcp:'run', azure:'func'}, t:'가상 대기실', s:{aws:'Virtual Waiting Room on AWS', gcp:'Cloud Run 대기열 서비스', azure:'Functions 대기열 서비스'}, failS:'순번 발급 · 입장 속도 조절'},
      {id:'tokens', x:20, y:250, w:200, h:48, icon:'nosql', t:'순번·입장 토큰', s:{aws:'DynamoDB', gcp:'Firestore', azure:'Cosmos DB'}},
      {id:'api', x:252, y:150, w:200, h:48, icon:'autoscale', t:'예매 API', s:{aws:'Auto Scaling · 예약 확장', gcp:'MIG · 확장 일정', azure:'VMSS · 일정 프로필'}, failS:'미리 늘린 용량으로 처리'},
      {id:'cache', x:462, y:150, w:194, h:48, icon:'cache', t:'좌석 재고 카운터', s:{aws:'ElastiCache · 원자 차감', gcp:'Memorystore · 원자 차감', azure:'Managed Redis · 원자 차감'}},
      {id:'q', x:252, y:250, w:200, h:48, icon:'queue', t:'주문 대기열', s:{aws:'SQS', gcp:'Pub/Sub', azure:'Service Bus'}},
      {id:'worker', x:462, y:250, w:194, h:48, icon:{aws:'func', gcp:'run', azure:'func'}, t:'주문 확정', s:'결제 · 좌석 배정'},
      {id:'db', x:462, y:350, w:194, h:48, icon:'db', t:'예매 DB', s:{aws:'Aurora MySQL', gcp:'Cloud SQL', azure:'MySQL Flexible Server'}},
      {id:'mon', x:252, y:350, w:200, h:48, icon:'mon', t:'실시간 지표', s:'입장 속도 · 큐 깊이', kind:'alt'}
    ],
    edges: [
      {a:'users', b:'edge'},
      {a:'edge', b:'room', label:'토큰 없음'},
      {a:'room', b:'tokens', dash:true},
      {a:'edge', b:'api', label:'입장 토큰 있음', lx:30},
      {a:'api', b:'cache', label:'차감'},
      {a:'api', b:'q'}, {a:'q', b:'worker'}, {a:'worker', b:'db'}
    ]
  },
  fail: {
    button: '오픈 순간 50배 유입', restore: '평시로', title: '오픈 직후 60초 동안 일어나는 일',
    down: [],
    normal: {
      aws: ['평시에는 공연 정보가 CloudFront에서 캐시로 응답되고, 예매 API는 평시 용량으로 돕니다.', '오픈 30분 전 예약 확장이 예매 API를 피크 용량으로 미리 늘립니다.'],
      gcp: ['평시에는 공연 정보가 Cloud CDN에서 캐시로 응답되고, 예매 API는 평시 용량으로 돕니다.', '오픈 30분 전 확장 일정이 관리형 인스턴스 그룹의 최소 대수를 올립니다.'],
      azure: ['평시에는 공연 정보가 Front Door 캐시로 응답되고, 예매 API는 평시 용량으로 돕니다.', '오픈 30분 전 자동 확장 일정 프로필이 VM Scale Set의 최소 대수를 올립니다.']
    },
    effects: {
      aws: [
        ['good','WAF 속도 기반 규칙과 Bot Control이 같은 IP·자동화 도구의 반복 요청을 엣지에서 거릅니다.'],
        ['good','대기실이 백엔드 처리량에 맞춰 입장 토큰을 발급하고, 나머지 고객은 순번을 받아 엣지에서 기다립니다.'],
        ['good','예약 확장으로 이미 피크 용량이 떠 있습니다. 로드밸런서도 급증 직후 용량이 필요하면 ALB 용량 단위(LCU) 예약을 씁니다.'],
        ['warn','좌석 재고를 DB의 한 행에서 차감하면 그 행에 잠금이 몰립니다. 캐시의 원자 연산으로 차감하고, 확정은 큐로 넘깁니다.']
      ],
      gcp: [
        ['good','Cloud Armor 속도 제한 규칙과 reCAPTCHA 연동 봇 관리가 엣지에서 거릅니다.'],
        ['good','전역 외부 Application LB는 사전 웜업 없이 급증을 받도록 설계되어 있습니다.'],
        ['good','확장 일정으로 미리 늘린 인스턴스가 받고, 대기실이 입장 속도를 그 처리량에 맞춥니다.'],
        ['warn','좌석 재고를 한 문서·한 행에서 차감하면 쓰기 경합이 몰립니다. 캐시의 원자 연산이나 카운터 분할을 씁니다.']
      ],
      azure: [
        ['good','Front Door WAF의 속도 제한 사용자 지정 규칙과 봇 관리자 규칙 집합이 거릅니다.'],
        ['good','일정 프로필로 미리 늘린 VM Scale Set이 받고, 대기실이 입장 속도를 맞춥니다.'],
        ['warn','Application Gateway v2를 함께 쓴다면 최소 인스턴스 수를 미리 올려 둬야 급증 직후 용량이 모자라지 않습니다.'],
        ['warn','좌석 재고를 한 행에서 차감하면 잠금이 몰립니다. Redis 원자 연산이나 Cosmos DB 낙관적 동시성(ETag)으로 처리합니다.']
      ]
    }
  },
  map: ['cdn','waf-bot','waiting-room','scheduled-scaling','cache','message-queue'],
  decisions: [
    {t:'엣지에서 요청 자체를 줄이기',
     p:'가장 싼 요청은 백엔드까지 오지 않는 요청입니다. 공연 정보, 이미지, 남은 좌석 요약처럼 몇 초 늦어도 되는 응답은 캐시합니다.',
     aws:'CloudFront 캐시와 짧은 TTL로 조회 요청을 흡수하고, AWS WAF 속도 기반 규칙과 Bot Control로 자동화된 요청을 거릅니다.',
     gcp:'Cloud CDN으로 조회를 흡수하고, Cloud Armor 속도 제한과 reCAPTCHA Enterprise 연동 봇 관리로 거릅니다.',
     azure:'Front Door 캐시로 흡수하고, Front Door WAF의 속도 제한 규칙과 봇 관리자 규칙 집합으로 거릅니다.',
     so:'남은 좌석 수처럼 자주 바뀌는 값도 1~2초 캐시만으로 백엔드 요청이 수십 분의 일로 줄어듭니다.'},
    {t:'용량을 미리 올리는 법',
     p:'반응형 오토스케일은 지표 수집, 판단, 부팅에 몇 분이 걸립니다. 시각을 아는 급증은 일정으로 미리 올립니다.',
     aws:'Auto Scaling 예약 작업으로 최소 대수를 올리고, 웜 풀로 부팅 시간을 줄입니다. ALB는 필요하면 용량 단위(LCU) 예약을 씁니다.',
     gcp:'관리형 인스턴스 그룹의 확장 일정으로 최소 대수를 올립니다. 전역 LB는 사전 웜업이 필요 없습니다.',
     azure:'자동 확장 설정에 일정 프로필을 넣어 최소 대수를 올리고, Application Gateway v2는 최소 인스턴스 수를 미리 올립니다.',
     so:'아래 시뮬레이터에서 "미리 띄워 둔 인스턴스"를 늘려 가며 놓치는 요청이 0이 되는 지점을 찾아보세요.'},
    {t:'대기실: 백엔드가 받을 만큼만 들여보내기',
     p:'용량을 아무리 올려도 50배를 다 받는 것은 비쌉니다. 받을 수 있는 속도로만 입장시키고 나머지는 순번을 줍니다.',
     aws:'AWS 솔루션 라이브러리의 Virtual Waiting Room on AWS를 배포하거나, 엣지 함수와 DynamoDB로 직접 만듭니다.',
     gcp:'관리형 대기실 제품은 없으므로 Cloud Run과 Firestore·Memorystore로 순번·토큰 서비스를 만들고 LB 앞단에서 검사합니다.',
     azure:'관리형 대기실 제품은 없으므로 Functions와 Cosmos DB·Redis로 순번·토큰 서비스를 만들고 Front Door 규칙으로 검사합니다.',
     so:'대기실은 비용뿐 아니라 공정성(순번)과 봇 차단 문제도 함께 풉니다.'},
    {t:'재고 차감의 병목 없애기',
     p:'모든 요청이 "좌석 1만 석"이라는 한 값을 줄이려 하면, 그 값이 놓인 한 행·한 키에 쓰기가 몰립니다.',
     aws:'ElastiCache의 원자 감소 연산으로 차감하거나, DynamoDB 조건부 쓰기로 "0보다 클 때만" 줄입니다.',
     gcp:'Memorystore의 원자 연산을 쓰거나, Firestore에서는 분산 카운터로 문서를 여러 개로 나눕니다.',
     azure:'Azure Managed Redis의 원자 연산을 쓰거나, Cosmos DB의 ETag로 낙관적 동시성 제어를 합니다.',
     so:'구역별로 재고를 나누면 핫 키가 여러 개로 흩어져 처리량이 늘어납니다.'}
  ],
  sims: [{type:'spike', values:{base:2000, mult:50, ramp:60, delay:180, per:500, minI:20}, q:'평시 용량만 띄워 두면 오픈 직후 몇 %를 놓칠까요?'}],
  iac: 'iac/scenario-10',
  checklist: [
    ['부하 시험 없이 오픈한다','예상 피크의 1.5배 이상으로 미리 시험합니다. 클라우드별 부하 시험 정책을 먼저 확인합니다.'],
    ['인스턴스 할당량을 확인하지 않았다','예약 확장이 vCPU 한도에 막혀 실패합니다. 미리 올려 둡니다.'],
    ['로그인·결제 같은 의존 서비스를 잊었다','예매 API는 버텨도 로그인 서비스나 결제사 API 한도에서 막힙니다.'],
    ['DB 커넥션 수를 계산하지 않았다','인스턴스가 늘어난 만큼 커넥션이 늘어 DB가 먼저 거절합니다. 커넥션 풀·프록시를 씁니다.'],
    ['클라이언트가 실패하면 즉시 재시도한다','새로고침 폭탄이 급증을 몇 배로 키웁니다. 대기 화면과 백오프를 앱에 넣습니다.'],
    ['오픈 시각에 캐시를 비운다','캐시가 비는 순간 모든 요청이 원본으로 갑니다. 미리 채워 두고 오픈 때는 값만 바꿉니다.'],
    ['한 행에서 재고를 차감한다','잠금 경합으로 처리량이 몇백 건에서 멈춥니다.'],
    ['상태 안내 경로가 없다','장애 공지를 같은 서버에서 하면 함께 죽습니다. 정적 상태 페이지를 따로 둡니다.']
  ],
  refs: [
    ['Virtual Waiting Room on AWS', 'https://aws.amazon.com/solutions/implementations/virtual-waiting-room-on-aws/'],
    ['관리형 인스턴스 그룹 확장 일정', 'https://cloud.google.com/compute/docs/autoscaler/scaling-schedules'],
    ['Azure 자동 확장 일정 프로필', 'https://learn.microsoft.com/azure/azure-monitor/autoscale/autoscale-multiprofile']
  ],
  next: '시나리오 11 · ML 학습과 추론 서빙'
};
