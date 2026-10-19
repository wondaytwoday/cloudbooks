window.SCENARIO = {
  no: 14, level: 'synthesis', title: '멀티클라우드는 언제 의미가 있나',
  lede: '"한 클라우드가 멈추면 어떡하냐"는 질문에 멀티클라우드가 답처럼 보이지만, 두 클라우드를 오가는 구성은 그 자체로 복잡도와 비용, 새로운 장애 원인을 만듭니다. 이 장은 세 클라우드를 비교해 온 책의 마지막으로, 언제 두 클라우드를 함께 쓰고 언제 쓰지 말아야 하는지를 다룹니다.',
  region: {aws:'주 클라우드 AWS', gcp:'주 클라우드 Google Cloud', azure:'주 클라우드 Azure'},
  req: [
    {k:'요구', v:'클라우드 하나 장애 대비', s:'경영진 요청'},
    {k:'서비스', v:'주문 API + PostgreSQL', s:'컨테이너로 운영'},
    {k:'팀', v:'인프라 담당 3명', s:'한 클라우드에 익숙'},
    {k:'판단 기준', v:'연간 중단 시간과 총비용', s:'복잡도 증가분 포함'}
  ],
  intro: {
    arch: '위에서 고른 클라우드를 주 클라우드로, 다른 클라우드 하나를 대기로 두는 액티브-패시브 구성입니다. 대기 쪽은 클라우드 공통 아이콘으로 표시했습니다. <b>주 클라우드 리전 장애</b>를 눌러 넘어갈 때 무엇이 남는지 보세요.',
    dec: '세 클라우드가 서로를 어떻게 연결하고 관리하는지, 그리고 이식성을 어디까지 지킬지가 핵심입니다.'
  },
  diagram: {
    w: 680, h: 470,
    frames: [
      {id:'A', kind:'region', x:20, y:126, w:310, h:270, label:{aws:'AWS · ap-northeast-2 (주)', gcp:'Google Cloud · asia-northeast3 (주)', azure:'Azure · Korea Central (주)'}},
      {id:'B', kind:'onprem', x:350, y:126, w:310, h:270, label:'두 번째 클라우드 · 서울 (대기)'}
    ],
    nodes: [
      {id:'users', x:280, y:6, w:120, h:34, icon:'users', t:'고객'},
      {id:'dns', x:220, y:56, w:240, h:48, icon:'dns', t:'DNS · 상태 확인 전환', s:'두 클라우드 밖에 둘지 검토'},
      {id:'ak', x:35, y:162, w:280, h:48, icon:'k8s', t:'주문 서비스 컨테이너', s:{aws:'EKS', gcp:'GKE', azure:'AKS'}},
      {id:'adb', x:35, y:250, w:280, h:48, icon:'pg', t:'PostgreSQL', s:{aws:'Aurora PostgreSQL', gcp:'Cloud SQL for PostgreSQL', azure:'Azure Database for PostgreSQL'}},
      {id:'aobj', x:35, y:336, w:280, h:44, icon:'obj', t:'파일', s:{aws:'S3', gcp:'Cloud Storage', azure:'Blob Storage'}},
      {id:'bk', x:365, y:162, w:280, h:48, icon:'gk8s', t:'같은 컨테이너 이미지', s:'상대 클라우드의 관리형 쿠버네티스', failS:'트래픽 받는 중'},
      {id:'bdb', x:365, y:250, w:280, h:48, icon:'gdb', t:'PostgreSQL 복제본', s:'논리 복제 · 비동기', failS:'승격 → 쓰기 가능', kind:'alt'},
      {id:'bobj', x:365, y:336, w:280, h:44, icon:'gobj', t:'파일 사본', s:'복제 도구로 주기 복사', kind:'alt'},
      {id:'ci', x:220, y:414, w:240, h:44, icon:'workflow', t:'Terraform · GitOps', s:'두 클라우드에 같은 정의 배포', kind:'alt'}
    ],
    edges: [
      {a:'users', b:'dns'},
      {a:'dns', b:'ak', fail:'hide'}, {a:'dns', b:'bk', dash:true, fail:'hide'},
      {a:'dns', b:'bk', fail:'show', label:'전환'},
      {a:'ak', b:'adb'}, {a:'bk', b:'bdb'},
      {a:'adb', b:'bdb', dash:'both', label:{aws:'Site-to-Site VPN', gcp:'Cross-Cloud Interconnect', azure:'VPN Gateway'}, ly:-24},
      {a:'aobj', b:'bobj', dash:'both', label:'송신 요금 발생', ly:-24},
      {a:'ci', b:'ak', dash:true}, {a:'ci', b:'bk', dash:true}
    ]
  },
  fail: {
    button: '주 클라우드 리전 장애', restore: '복구', title: '주 클라우드의 서울 리전이 멈췄을 때',
    zones: ['A'], zoneLabel: '리전 장애', down: ['ak','adb','aobj'], promote: ['bk','bdb'],
    normal: {
      aws: ['DNS 상태 확인이 통과하는 동안 모든 요청은 AWS로 갑니다. 대기 클라우드의 컨테이너는 최소 대수로 떠 있습니다.', 'Aurora PostgreSQL의 논리 복제가 VPN을 거쳐 상대 클라우드의 PostgreSQL로 변경분을 보냅니다.'],
      gcp: ['DNS 상태 확인이 통과하는 동안 모든 요청은 Google Cloud로 갑니다.', 'Cloud SQL for PostgreSQL의 논리 복제가 Cross-Cloud Interconnect를 거쳐 상대 클라우드로 변경분을 보냅니다.'],
      azure: ['DNS 상태 확인이 통과하는 동안 모든 요청은 Azure로 갑니다.', 'Azure Database for PostgreSQL의 논리 복제가 VPN을 거쳐 상대 클라우드로 변경분을 보냅니다.']
    },
    effects: {
      aws: [
        ['good','DNS가 상대 클라우드로 바뀌면 같은 컨테이너 이미지가 요청을 받습니다.'],
        ['warn','논리 복제는 비동기라 지연만큼의 데이터를 잃고, 승격 후 시퀀스 값과 권한을 맞추는 작업이 필요합니다.'],
        ['warn','IAM, 시크릿, 관측, 네트워크 정책은 클라우드마다 달라 두 벌을 따로 관리하고 따로 시험해야 합니다.'],
        ['good','Route 53의 데이터 플레인은 리전과 무관한 글로벌 서비스라, 서울 리전 장애에도 DNS 응답은 보통 이어집니다.']
      ],
      gcp: [
        ['good','DNS가 상대 클라우드로 바뀌면 같은 컨테이너 이미지가 요청을 받습니다.'],
        ['warn','논리 복제는 비동기라 지연만큼의 데이터를 잃고, 승격 후 시퀀스 값과 권한을 맞추는 작업이 필요합니다.'],
        ['warn','IAM, 시크릿, 관측, 네트워크 정책은 클라우드마다 달라 두 벌을 따로 관리하고 따로 시험해야 합니다.'],
        ['good','Cloud DNS는 글로벌 서비스라 한 리전 장애에 DNS 응답은 보통 이어집니다.']
      ],
      azure: [
        ['good','DNS가 상대 클라우드로 바뀌면 같은 컨테이너 이미지가 요청을 받습니다.'],
        ['warn','논리 복제는 비동기라 지연만큼의 데이터를 잃고, 승격 후 시퀀스 값과 권한을 맞추는 작업이 필요합니다.'],
        ['warn','IAM, 시크릿, 관측, 네트워크 정책은 클라우드마다 달라 두 벌을 따로 관리하고 따로 시험해야 합니다.'],
        ['good','Azure DNS는 글로벌 서비스라 한 지역 장애에 DNS 응답은 보통 이어집니다.']
      ]
    }
  },
  map: ['multicloud-mgmt','cross-cloud-link','k8s-managed','iac-native'],
  decisions: [
    {t:'다른 클라우드의 자원을 함께 관리하는 도구',
     p:'두 클라우드를 따로 운영하면 사람이 두 배로 필요합니다. 각 클라우드는 "남의 자원도 우리 콘솔에서"를 위한 도구를 내놓고 있습니다.',
     aws:'Systems Manager 하이브리드 활성화로 다른 곳의 서버를 관리하고, EKS Hybrid Nodes로 클라우드 밖 노드를 EKS 클러스터에 붙입니다.',
     gcp:'GKE 연결 클러스터로 EKS·AKS를 Google Cloud 콘솔에서 함께 관리하고, BigQuery Omni로 S3·Blob의 데이터를 옮기지 않고 조회합니다.',
     azure:'Azure Arc로 다른 클라우드의 서버와 쿠버네티스를 Azure 리소스처럼 등록해 정책·모니터링·업데이트를 한곳에서 합니다.',
     so:'관리 도구를 한쪽으로 모으면 편하지만, 그 도구가 있는 클라우드가 멈추면 관리도 멈춥니다.'},
    {t:'클라우드끼리 잇는 방법과 요금',
     p:'복제와 장애조치를 하려면 두 클라우드 사이에 안정적인 경로가 필요하고, 그 경로를 지나는 데이터에는 송신 요금이 붙습니다.',
     aws:'Site-to-Site VPN으로 상대 클라우드의 VPN 게이트웨이와 연결합니다. 대역폭이 크면 전용선 사업자를 통해 연결합니다.',
     gcp:'Cross-Cloud Interconnect로 AWS·Azure 등과 물리 전용 연결을 맺을 수 있고, HA VPN으로도 연결합니다.',
     azure:'VPN Gateway로 연결하거나, ExpressRoute와 사업자 연결을 조합합니다.',
     so:'클라우드 간 데이터 전송은 보내는 쪽의 송신 요금이 기본입니다. 대용량 데이터를 양쪽에 두는 설계는 비용부터 계산합니다.'},
    {t:'이식성을 어디까지 지킬 것인가',
     p:'두 클라우드에서 똑같이 돌리려면 양쪽에 다 있는 기능만 써야 합니다. 그만큼 각 클라우드의 강점을 포기합니다.',
     aws:'Aurora, DynamoDB, Lambda처럼 AWS 고유 서비스를 쓰면 생산성은 오르지만 상대 클라우드에 같은 것이 없습니다.',
     gcp:'BigQuery, Spanner처럼 Google Cloud 고유 강점은 다른 클라우드로 그대로 옮길 수 없습니다.',
     azure:'Cosmos DB, Entra ID 깊은 연동처럼 Azure 고유 기능은 다른 클라우드에서 대체품을 찾아야 합니다.',
     so:'컨테이너, PostgreSQL, Terraform 같은 이식 가능한 층과, 고유 서비스를 쓰는 층을 의식적으로 나눕니다. 모든 층을 이식 가능하게 만들면 가장 낮은 공통분모만 남습니다.'},
    {t:'정말 필요한가: 판단 기준',
     p:'아래 시뮬레이터에서 장애조치 성공률과 늘어나는 운영 사고를 넣어 보면, 단일 클라우드보다 나빠지는 구간이 생각보다 넓습니다.',
     aws:'AWS 리전 하나의 장애가 걱정이라면 같은 클라우드의 다른 리전으로 가는 DR(시나리오 08)이 훨씬 싸고 단순합니다.',
     gcp:'Google Cloud 리전 하나의 장애가 걱정이라면 같은 클라우드 안의 멀티 리전 구성이 먼저입니다.',
     azure:'Azure 지역 하나의 장애가 걱정이라면 쌍 지역을 쓰는 DR이 먼저입니다.',
     so:'규제상 집중 위험 분산 요구, 고객 계약 조건, 인수합병, 특정 클라우드에만 있는 서비스가 아니라면 단일 클라우드 멀티 리전부터 시작합니다.'}
  ],
  sims: [{type:'multicloud'}],
  iac: 'iac/scenario-14',
  checklist: [
    ['가장 낮은 공통분모만 쓴다','양쪽 클라우드의 강점을 다 포기하고 운영 부담만 두 배가 됩니다.'],
    ['데이터 송신 요금을 계산하지 않았다','복제·백업 트래픽이 매달 클라우드 간 송신 요금으로 쌓입니다.'],
    ['IAM과 시크릿을 두 벌로 손관리한다','한쪽만 갱신돼 장애조치 때 인증이 실패합니다. 외부 IdP 연동과 시크릿 동기화를 자동화합니다.'],
    ['대기 클라우드로 넘겨 본 적이 없다','두 클라우드 사이 전환은 리전 전환보다 실패할 지점이 훨씬 많습니다.'],
    ['관측이 클라우드마다 흩어져 있다','장애 때 어느 쪽이 문제인지 한 화면에서 봐야 합니다.'],
    ['팀이 한 클라우드만 안다','장애 상황에 처음 보는 콘솔을 다루게 됩니다. 운영 인력 교육을 비용에 넣습니다.'],
    ['DNS·인증서가 한 클라우드에 묶여 있다','전환 경로 자체가 주 클라우드에 의존하지 않는지 확인합니다.'],
    ['계약과 지원이 두 배인 것을 잊었다','지원 플랜, 약정 할인, 보안 심사가 클라우드마다 따로 듭니다.']
  ],
  refs: [
    ['AWS Well-Architected 신뢰성 원칙', 'https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html'],
    ['Cross-Cloud Interconnect 개요', 'https://cloud.google.com/network-connectivity/docs/interconnect/concepts/cci-overview'],
    ['Azure Arc 개요', 'https://learn.microsoft.com/azure/azure-arc/overview']
  ],
  next: '각 클라우드 책(AWSBook·GCPBook·AzureBook)에서 이 책에 나온 서비스를 더 깊이 다룹니다'
};
