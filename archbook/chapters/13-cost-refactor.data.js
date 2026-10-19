window.SCENARIO = {
  no: 13, level: 'synthesis', title: '비용 최적화 리팩터링',
  lede: '새로 짓는 대신, 이미 1년째 돌고 있는 시스템의 청구서를 줄이는 장입니다. 앞 장들의 구성이 섞여 있고, 비용은 서버 크기보다 데이터 전송, 로그, 꺼지지 않는 개발 환경 같은 곳에서 새는 경우가 많습니다.',
  region: {aws:'ap-northeast-2 · 운영 1년차', gcp:'asia-northeast3 · 운영 1년차', azure:'Korea Central · 운영 1년차'},
  req: [
    {k:'현황', v:'청구서 1년 새 2배', s:'트래픽은 1.4배 증가'},
    {k:'목표', v:'30% 절감', s:'응답 시간·가용성은 그대로'},
    {k:'구성', v:'3티어 + 데이터 레이크 + dev·stg', s:'시나리오 01·07의 조합'},
    {k:'단서', v:'앱 서버 평균 CPU 20%', s:'dev·stg는 24시간 가동'}
  ],
  intro: { arch: '비용이 새는 지점을 시스템 도면 위에 표시했습니다. <b>최적화 적용</b>을 눌러 각 지점에서 무엇을 바꾸는지 보세요.' },
  diagram: {
    w: 680, h: 380,
    frames: [],
    nodes: [
      {id:'cost', x:230, y:10, w:220, h:50, icon:'cost', t:'비용 가시성', s:{aws:'Cost Explorer · 데이터 내보내기', gcp:'결제 데이터 → BigQuery', azure:'Cost Management 내보내기'}, kind:'reg'},
      {id:'compute', x:20, y:100, w:200, h:54, icon:'autoscale', t:'앱 서버 40대 · CPU 20%', s:{aws:'m6i.2xlarge 온디맨드', gcp:'n2-standard-8 온디맨드', azure:'D8s v5 종량제'}, failS:'크기 조정 + 약정 할인'},
      {id:'db', x:240, y:100, w:200, h:54, icon:'db', t:'DB 최대 사양', s:'안 쓰는 읽기 복제본 2개', failS:'복제본 정리 · 사양 한 단계↓'},
      {id:'nat', x:460, y:100, w:200, h:54, icon:'nat', t:'NAT 처리 요금', s:'스토리지 트래픽이 NAT 경유', failS:'비공개 경로로 우회'},
      {id:'store', x:20, y:200, w:200, h:54, icon:'obj', t:'오브젝트 300TB', s:'전부 표준 계층', failS:'접근 빈도별 자동 계층'},
      {id:'logs', x:240, y:200, w:200, h:54, icon:'logs', t:'로그 수집 하루 2TB', s:'디버그 로그까지 전부', failS:'수준 필터 · 보관 30일'},
      {id:'xaz', x:460, y:200, w:200, h:54, icon:'net', t:'영역 간 트래픽', s:'앱과 캐시가 다른 영역', failS:'같은 영역 우선 라우팅'},
      {id:'dev', x:20, y:300, w:200, h:54, icon:'account', t:'dev·stg 24시간 가동', s:'업무 시간에만 사용', failS:'야간·주말 자동 종료'},
      {id:'snap', x:240, y:300, w:200, h:54, icon:'backup', t:'오래된 스냅샷·볼륨', s:'주인 없는 리소스', failS:'태그 기준 정리'},
      {id:'egress', x:460, y:300, w:200, h:54, icon:'cdn', t:'인터넷 송신', s:'이미지를 원본에서 직접', failS:'CDN 캐시 적중률↑'}
    ],
    edges: [
      {a:'cost', b:'compute', dash:true}, {a:'cost', b:'db', dash:true}, {a:'cost', b:'nat', dash:true}
    ],
    notes: [
      {x:340, y:84, t:'태그·라벨로 팀·서비스·환경별로 나눠 봐야 새는 곳이 보입니다', anchor:'middle'}
    ]
  },
  fail: {
    button: '최적화 적용', restore: '이전 상태', title: '지점마다 쓰는 도구',
    down: [], promote: ['compute','db','nat','store','logs','xaz','dev','snap','egress'],
    normal: {
      aws: ['Cost Explorer에서 서비스·태그별로 나눠 보면, EC2 다음으로 NAT 게이트웨이 처리 요금과 CloudWatch Logs 수집 요금이 크게 잡혀 있습니다.'],
      gcp: ['결제 데이터를 BigQuery로 내보내 SKU·라벨별로 보면, Compute Engine 다음으로 Cloud NAT 처리량과 Cloud Logging 수집량이 크게 잡혀 있습니다.'],
      azure: ['Cost Management에서 서비스·태그별로 보면, VM 다음으로 NAT Gateway 처리량과 Log Analytics 수집량이 크게 잡혀 있습니다.']
    },
    effects: {
      aws: [
        ['good','Compute Optimizer 권장에 따라 크기를 줄이고, 하루 내내 도는 기준 용량만 Compute Savings Plans로 약정합니다.'],
        ['good','S3·DynamoDB는 게이트웨이 VPC 엔드포인트를 쓰면 NAT를 거치지 않고, 엔드포인트 자체에 추가 요금이 없습니다.'],
        ['good','S3 Intelligent-Tiering이나 수명 주기 규칙으로 접근이 뜸한 객체를 싼 계층으로 옮깁니다.'],
        ['good','Instance Scheduler로 dev·stg를 업무 시간에만 켜고, 오래된 EBS 스냅샷과 미연결 볼륨을 정리합니다.']
      ],
      gcp: [
        ['good','Recommender의 크기 조정·유휴 리소스 권장을 적용하고, 기준 용량은 확약 사용 할인(CUD)으로 약정합니다.'],
        ['good','비공개 Google 액세스를 켜면 VM이 외부 IP 없이 Google API에 닿아, 그 트래픽이 Cloud NAT를 거치지 않습니다.'],
        ['good','버킷에 Autoclass를 켜면 객체 접근 패턴에 따라 저장 계층을 자동으로 옮깁니다.'],
        ['good','인스턴스 일정으로 dev·stg VM을 업무 시간에만 켜고, 미사용 디스크·스냅샷을 정리합니다.']
      ],
      azure: [
        ['good','Advisor의 크기 조정 권장을 적용하고, 기준 용량은 예약이나 Azure 절감 플랜으로 약정합니다.'],
        ['good','스토리지·Key Vault 트래픽은 서비스 엔드포인트나 Private Endpoint로 보내 NAT Gateway 처리량에서 뺍니다.'],
        ['good','수명 주기 관리 정책으로 마지막 접근 시간 기준 쿨·아카이브 계층으로 옮깁니다.'],
        ['good','dev·stg VM에 자동 종료 일정을 걸고, 개발·테스트 구독 가격을 검토합니다.']
      ]
    }
  },
  map: ['cost-mgmt','rightsizing','commitment','storage-tiering','spot','vm-schedule'],
  decisions: [
    {t:'약정 할인: 무엇에, 얼마나',
     p:'약정은 1~3년 묶이는 결정입니다. 크기를 먼저 줄이고, 그다음 남은 기준 용량에만 겁니다.',
     aws:'Compute Savings Plans는 인스턴스 패밀리·리전이 바뀌어도, Fargate·Lambda에도 적용됩니다. 특정 인스턴스에 묶는 대신 할인 폭이 큰 EC2 Instance Savings Plans도 있습니다.',
     gcp:'확약 사용 할인(CUD)은 리소스 기반과 지출 기반이 있습니다. 일부 머신 계열은 오래 켜 두면 지속 사용 할인이 자동으로 붙습니다.',
     azure:'VM·DB 같은 리소스별 예약과, 컴퓨트 전반에 시간당 사용 금액을 약정하는 Azure 절감 플랜이 있습니다.',
     so:'아래 시뮬레이터처럼 하루 내내 켜져 있는 대수까지만 약정하고, 나머지는 오토스케일과 스팟으로 덮습니다.'},
    {t:'데이터 전송 요금의 함정',
     p:'청구서에서 가장 이해하기 어려운 항목입니다. 같은 데이터라도 어디를 거치느냐에 따라 요금이 붙습니다.',
     aws:'NAT 게이트웨이는 처리한 GB마다 과금됩니다. S3·DynamoDB는 게이트웨이 엔드포인트로 우회하고, AZ 간 전송도 과금되므로 같은 AZ 우선 라우팅을 검토합니다.',
     gcp:'비공개 Google 액세스로 Google API 트래픽을 Cloud NAT 밖으로 빼고, 영역 간 전송 요금을 확인합니다. 인터넷 송신은 프리미엄·표준 네트워크 등급에 따라 단가가 다릅니다.',
     azure:'NAT Gateway 처리량, 가상 네트워크 피어링, 인터넷 송신 요금을 나눠 봅니다. PaaS 트래픽은 서비스 엔드포인트나 Private Endpoint로 보냅니다.',
     so:'흐름 로그(VPC 흐름 로그, NSG 흐름 로그)를 며칠만 켜서 어떤 트래픽이 어디를 지나는지 먼저 확인합니다.'},
    {t:'스토리지 계층 자동화',
     p:'쌓이기만 하고 읽히지 않는 데이터가 표준 계층에 남아 있는 경우가 많습니다.',
     aws:'S3 Intelligent-Tiering이 접근 패턴에 따라 계층을 옮깁니다. 128KB 미만 객체는 자동 계층 이동 대상이 아닙니다.',
     gcp:'Autoclass를 켠 버킷은 객체마다 접근 패턴에 따라 계층을 자동으로 옮깁니다.',
     azure:'수명 주기 관리 정책에 마지막 접근 시간 조건을 쓰면 읽히지 않는 Blob을 쿨·아카이브로 옮깁니다.',
     so:'작은 객체가 수억 개라면 계층 전환 요청 요금이 절감액보다 클 수 있습니다. 먼저 객체 크기 분포를 봅니다.'},
    {t:'스팟과 자동 종료',
     p:'중단돼도 되는 작업(배치, CI, 개발 환경)은 정가로 돌릴 이유가 없습니다.',
     aws:'스팟 인스턴스는 회수 2분 전에 통지됩니다. 오토스케일 그룹에서 여러 인스턴스 유형을 섞으면 회수 위험이 줄어듭니다.',
     gcp:'스팟 VM은 회수 30초 전에 통지됩니다. GKE에서는 스팟 노드 풀로 배치 작업을 분리합니다.',
     azure:'스팟 VM은 예약 이벤트로 30초 전에 통지됩니다. 개발 VM에는 자동 종료 일정을 겁니다.',
     so:'운영 웹 서버처럼 끊기면 안 되는 작업에는 쓰지 않고, 중단을 견디는 작업부터 옮깁니다.'}
  ],
  sims: [{type:'rightsize', values:{n:40, avg:20, peakR:2.5, target:70, base:60}}],
  iac: 'iac/scenario-13',
  checklist: [
    ['태그·라벨 없이 비용을 본다','누가 쓴 돈인지 모르면 줄일 사람도 없습니다. 태그 정책부터 강제합니다.'],
    ['크기 조정 전에 약정부터 산다','과하게 큰 인스턴스를 3년 동안 할인받는 셈입니다.'],
    ['주인 없는 리소스가 남아 있다','미연결 볼륨, 오래된 스냅샷, 쓰지 않는 공인 IP, 빈 로드밸런서를 정기적으로 정리합니다.'],
    ['dev·stg가 24시간 켜져 있다','업무 시간만 켜도 주당 가동 시간이 3분의 1 이하로 줄어듭니다.'],
    ['로그를 전부 수집한다','디버그 로그와 헬스체크 로그를 수집 단계에서 거르고, 보관 기간을 나눕니다.'],
    ['스토리지 트래픽이 NAT를 지난다','비공개 경로로 돌리면 성능도 좋아집니다.'],
    ['이전 세대 인스턴스를 그대로 쓴다','같은 사양의 최신 세대(특히 ARM 계열)가 더 싸고 빠른 경우가 많습니다.'],
    ['비용 이상 경보가 없다','설정 실수로 하루에 한 달치가 나가도 청구서를 받을 때까지 모릅니다. 예산 경보와 이상 탐지를 켭니다.']
  ],
  refs: [
    ['AWS Well-Architected 비용 최적화', 'https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html'],
    ['Google Cloud 비용 최적화 원칙', 'https://cloud.google.com/architecture/framework/cost-optimization'],
    ['Azure Well-Architected 비용 최적화', 'https://learn.microsoft.com/azure/well-architected/cost-optimization/']
  ],
  next: '시나리오 14 · 멀티클라우드는 언제 의미가 있나'
};
