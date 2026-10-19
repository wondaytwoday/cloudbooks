window.SCENARIO = {
  no: 6, level: 'intermediate', title: '온프레미스 하이브리드 연결',
  lede: '모든 시스템이 한 번에 클라우드로 오지는 않습니다. 사내 ERP와 인증 서버는 그대로 두고 클라우드 앱이 그것을 불러야 하는 기간이 길게 이어집니다. 회선을 어떻게 이중화하고, 경로와 DNS를 어떻게 넘겨줄지가 이 장의 주제입니다.',
  region: {aws:'서울 데이터센터 ↔ ap-northeast-2', gcp:'서울 데이터센터 ↔ asia-northeast3', azure:'서울 데이터센터 ↔ Korea Central'},
  req: [
    {k:'사내 시스템', v:'ERP API, AD·DNS', s:'당분간 이전 계획 없음'},
    {k:'대역폭', v:'평시 500Mbps, 피크 2Gbps', s:'월말 정산 배치 때 피크'},
    {k:'가용성', v:'회선 하나가 끊겨도 유지', s:'백업 경로는 느려도 됨'},
    {k:'이전', v:'파일 서버 100TB', s:'3개월 안에 클라우드로'}
  ],
  intro: { arch: '평소에는 전용선, 끊기면 VPN이 경로를 이어받는 구성입니다. <b>전용선 장애</b>를 눌러 트래픽이 어디로 넘어가는지 보세요.' },
  diagram: {
    w: 680, h: 440,
    frames: [
      {id:'dc', kind:'onprem', x:20, y:20, w:200, h:400, label:'사내 데이터센터'},
      {id:'region', kind:'region', x:450, y:20, w:210, h:400, label:{aws:'ap-northeast-2', gcp:'asia-northeast3', azure:'Korea Central'}}
    ],
    nodes: [
      {id:'cpe', x:30, y:56, w:180, h:48, icon:'onprem', t:'사내 라우터', s:'BGP · 장비 2대'},
      {id:'dnson', x:30, y:156, w:180, h:48, icon:'dns', t:'사내 DNS · AD', s:'corp.example.local'},
      {id:'erp', x:30, y:256, w:180, h:48, icon:'vm', t:'ERP', s:'사내 API'},
      {id:'dx', cfg:'dedicated', x:245, y:76, w:185, h:56, icon:'dedicated', t:'전용선 (주 경로)', s:{aws:'Direct Connect · 2개 위치', gcp:'Dedicated Interconnect', azure:'ExpressRoute 회선'}, failS:'회선 끊김'},
      {id:'vpn', cfg:'vpn', x:245, y:200, w:185, h:56, icon:'vpn', t:'VPN (백업 경로)', s:{aws:'Site-to-Site VPN · 터널 2개', gcp:'HA VPN · 터널 2개', azure:'VPN Gateway · 액티브-액티브'}},
      {id:'gw', cfg:{aws:'hubnet', gcp:'dedicated', azure:'hubnet'}, x:460, y:56, w:190, h:56, icon:'router', t:'클라우드 게이트웨이', s:{aws:'DX 게이트웨이 + Transit Gateway', gcp:'Cloud Router (BGP)', azure:'허브 VNet의 ER·VPN 게이트웨이'}, kind:'reg'},
      {id:'resolver', cfg:'dnshybrid', x:460, y:156, w:190, h:48, icon:'dns', t:'DNS 해석', s:{aws:'Route 53 Resolver 엔드포인트', gcp:'Cloud DNS 전달 영역', azure:'DNS Private Resolver'}},
      {id:'app', x:460, y:256, w:190, h:48, icon:'vm', t:'클라우드 앱', s:{aws:'스포크 VPC', gcp:'Shared VPC 서비스 프로젝트', azure:'스포크 VNet'}},
      {id:'mon', x:460, y:348, w:190, h:44, icon:'mon', t:'회선 상태 경보', s:{aws:'CloudWatch · DX 지표', gcp:'Cloud Monitoring', azure:'Azure Monitor · ER 지표'}, kind:'alt'},
      {id:'mig', x:245, y:338, w:185, h:52, icon:'obj', t:'대량 데이터 이전', s:{aws:'DataSync · Snowball', gcp:'Storage Transfer · Appliance', azure:'Storage Mover · Data Box'}, kind:'alt'}
    ],
    edges: [
      {a:'cpe', b:'dx', label:'BGP'}, {a:'dx', b:'gw', label:'BGP'},
      {a:'cpe', b:'vpn', dash:true}, {a:'vpn', b:'gw', dash:true, label:'BGP (백업)'},
      {a:'app', b:'gw'}, {a:'erp', b:'cpe'},
      {a:'resolver', b:'dnson', dash:'both', label:'양방향 DNS 전달'},
      {a:'mig', b:'app', dash:true}
    ]
  },
  fail: {
    button: '전용선 장애', restore: '복구', title: '주 회선이 끊겼을 때',
    down: ['dx'],
    normal: {
      aws: ['사내 → Direct Connect → DX 게이트웨이 → Transit Gateway → 스포크 VPC. 같은 대역을 VPN으로도 광고하지만 Direct Connect 경로가 우선합니다.', '클라우드 앱이 corp.example.local을 찾으면 Route 53 Resolver 아웃바운드 엔드포인트가 사내 DNS로 넘깁니다.'],
      gcp: ['사내 → Dedicated Interconnect(VLAN 연결) → Cloud Router → VPC. 같은 대역을 HA VPN으로도 받지만 경로 우선순위(MED)로 전용선을 먼저 씁니다.', 'Cloud DNS 전달 영역이 corp.example.local 질의를 사내 DNS로 넘깁니다.'],
      azure: ['사내 → ExpressRoute 회선 → 허브 VNet의 ExpressRoute 게이트웨이 → 스포크 VNet. 같은 접두사라면 ExpressRoute가 VPN보다 우선합니다.', 'DNS Private Resolver 아웃바운드 엔드포인트와 전달 규칙이 corp.example.local을 사내 DNS로 넘깁니다.']
    },
    effects: {
      aws: [
        ['good','Direct Connect의 BGP 세션이 끊기면 그 경로가 빠지고, Transit Gateway는 VPN으로 받은 같은 대역 경로를 씁니다.'],
        ['warn','VPN 터널 하나의 대역폭은 최대 1.25Gbps입니다. 피크 2Gbps를 받으려면 Transit Gateway ECMP로 여러 터널을 묶거나 전용선을 두 위치로 이중화합니다.'],
        ['good','BFD를 켜 두면 회선 장애를 몇 초 안에 감지해 전환이 빨라집니다.']
      ],
      gcp: [
        ['good','Cloud Router가 Interconnect 쪽 경로를 잃으면 HA VPN으로 받은 경로로 바꿉니다.'],
        ['warn','VPN 터널 하나의 처리량에는 한계가 있어, 피크를 받으려면 터널을 여러 개 묶습니다.'],
        ['good','HA VPN은 게이트웨이 인터페이스 두 개에 터널을 모두 연결하면 99.99% SLA 구성이 됩니다.']
      ],
      azure: [
        ['good','ExpressRoute 경로가 사라지면 같은 허브의 VPN 게이트웨이 경로로 넘어갑니다(ExpressRoute·VPN 공존 구성).'],
        ['warn','VPN Gateway 처리량은 SKU로 정해집니다. 피크를 받을 수 있는 SKU인지 확인합니다.'],
        ['good','ExpressRoute 회선은 하나라도 주·보조 두 연결로 이뤄져 있어, 연결 하나의 장애는 회선 안에서 흡수됩니다. 피어링 위치 자체의 장애는 두 번째 회선으로 대비합니다.']
      ]
    }
  },
  scope: ['dedicated','vpn','hubnet','dnshybrid'],
  build: {
    aws: [
      {t:'Direct Connect 연결 주문 (2개 위치)', d:'사업자 개통 대기', cfg:'dedicated', nodes:['dx']},
      {t:'Transit Gateway', d:'네트워크 계정, RAM 공유', cfg:'hubnet', nodes:['gw']},
      {t:'DX 게이트웨이 + 전송 VIF', d:'TGW와 연결, 허용 접두사', cfg:'dedicated', nodes:['dx','gw']},
      {t:'고객 게이트웨이 + Site-to-Site VPN', d:'TGW에 연결, BGP', cfg:'vpn', nodes:['vpn']},
      {t:'BGP 경로 우선순위', d:'DX 우선, VPN 백업 (AS 경로 등)', cfg:'dedicated', nodes:['cpe','dx','vpn']},
      {t:'스포크 VPC 연결 + 라우팅', d:'VPC 라우팅 테이블에 사내 대역 → TGW', cfg:'hubnet', nodes:['app']},
      {t:'Resolver 인바운드·아웃바운드 엔드포인트', d:'corp.example.local 전달 규칙', cfg:'dnshybrid', nodes:['resolver','dnson']},
      {t:'DX 상태 경보', d:'ConnectionState, BGP 상태', nodes:['mon']}
    ],
    gcp: [
      {t:'Interconnect 연결 주문 (도메인 2개)', cfg:'dedicated', nodes:['dx']},
      {t:'Cloud Router', d:'ASN, 전역 동적 라우팅 검토', cfg:'dedicated', nodes:['gw']},
      {t:'VLAN 연결 × 2', d:'Cloud Router에 붙임', cfg:'dedicated', nodes:['dx','gw']},
      {t:'HA VPN 게이트웨이 + 외부 게이트웨이 + 터널 2개', d:'터널마다 BGP 세션', cfg:'vpn', nodes:['vpn']},
      {t:'경로 우선순위', d:'BGP MED 조정으로 Interconnect 우선', cfg:'route', nodes:['cpe','dx','vpn']},
      {t:'사내 쪽 맞춤 경로 광고', d:'Cloud Router 맞춤 광고, 35.199.192.0/19 포함', cfg:'dnshybrid', nodes:['gw']},
      {t:'Cloud DNS 전달 영역 + 인바운드 정책', cfg:'dnshybrid', nodes:['resolver','dnson']},
      {t:'서비스 프로젝트 연결', d:'Shared VPC라 라우팅 작업 없음', cfg:'hubnet', nodes:['app']}
    ],
    azure: [
      {t:'허브 VNet + GatewaySubnet', d:'/27 이상', cfg:'subnet', nodes:['gw']},
      {t:'ExpressRoute 회선', d:'서비스 키 → 사업자', cfg:'dedicated', nodes:['dx']},
      {t:'프라이빗 피어링 + ER 게이트웨이 + 연결', d:'게이트웨이 배포에 시간이 걸림', cfg:'dedicated', nodes:['dx','gw']},
      {t:'VPN Gateway (액티브-액티브) + 로컬 게이트웨이', d:'ER과 같은 GatewaySubnet에 공존', cfg:'vpn', nodes:['vpn']},
      {t:'경로 우선순위', d:'같은 접두사면 ER이 VPN보다 우선', cfg:'route', nodes:['cpe','dx','vpn']},
      {t:'스포크 피어링', d:'원격 게이트웨이 사용', cfg:'hubnet', nodes:['app']},
      {t:'DNS Private Resolver', d:'위임 서브넷 2개, 전달 규칙 집합', cfg:'dnshybrid', nodes:['resolver','dnson']},
      {t:'ER 회선 경보', d:'BGP 가용성, 피어링 상태', nodes:['mon']}
    ]
  },
  map: ['dedicated-link','site-vpn','network-hub','hybrid-dns','bulk-transfer','monitoring'],
  decisions: [
    {t:'전용선 이중화는 "위치"를 나누는 것',
     p:'회선 두 개를 같은 건물에 꽂으면 그 건물의 장애에는 둘 다 끊깁니다.',
     aws:'최대 복원력 구성은 서로 다른 Direct Connect 위치 두 곳에 연결을 두 개씩 두는 것입니다. 콘솔의 복원력 툴킷이 구성을 안내합니다.',
     gcp:'99.99% 구성은 두 도시권(metro)에 연결을 두 개씩, 총 네 개를 둡니다. 99.9%는 한 도시권의 서로 다른 엣지 가용성 도메인에 두 개입니다.',
     azure:'회선 하나에 주·보조 연결이 기본으로 있지만 같은 피어링 위치입니다. 위치 장애까지 대비하려면 다른 피어링 위치에 두 번째 회선을 둡니다.',
     so:'전용선은 개통에 수주에서 수개월이 걸립니다. VPN으로 먼저 연결하고 전용선을 추가하는 순서가 일반적입니다.'},
    {t:'경로 우선순위를 누가 정하는가',
     p:'같은 사내 대역을 전용선과 VPN 둘 다로 광고하면, 어느 쪽을 먼저 쓸지 규칙이 필요합니다.',
     aws:'같은 접두사라면 Direct Connect 경로가 VPN보다 우선합니다. 여러 전용선 사이는 AS_PATH 덧붙이기나 로컬 우선순위 커뮤니티로 조정합니다.',
     gcp:'Cloud Router의 BGP 세션별 기본 경로 우선순위(MED로 광고)로 전용선과 VPN의 순서를 정합니다.',
     azure:'같은 접두사라면 ExpressRoute가 사이트 간 VPN보다 우선합니다. 회선이 여러 개면 연결 가중치와 AS 경로로 조정합니다.',
     so:'의도한 백업이 실제로 백업으로 동작하는지는 정기적인 전환 시험으로만 확인할 수 있습니다.'},
    {t:'DNS를 양쪽 방향으로 넘기는 법',
     p:'클라우드 앱은 사내 이름을, 사내 시스템은 클라우드의 비공개 이름을 찾아야 합니다.',
     aws:'Route 53 Resolver 아웃바운드 엔드포인트와 전달 규칙으로 사내 도메인을 넘기고, 인바운드 엔드포인트로 사내에서 VPC의 비공개 영역을 조회하게 합니다.',
     gcp:'Cloud DNS 전달 영역으로 사내 도메인을 넘기고, 인바운드 서버 정책으로 사내에서 Cloud DNS를 조회할 IP를 엽니다.',
     azure:'DNS Private Resolver의 아웃바운드 엔드포인트와 전달 규칙 집합으로 사내 도메인을 넘기고, 인바운드 엔드포인트로 사내에서 비공개 DNS 영역을 조회합니다.',
     so:'구조는 세 클라우드가 같습니다. 양쪽이 서로에게 같은 도메인을 전달해 무한 순환이 생기지 않게 영역을 명확히 나눕니다.'},
    {t:'대량 이전은 회선이 답이 아닐 수 있다',
     p:'100TB를 1Gbps로 옮기면 열흘이 넘게 걸리고, 그동안 업무 트래픽과 회선을 나눠 써야 합니다.',
     aws:'온라인 전송은 DataSync, 오프라인은 Snowball 계열 장비로 옮깁니다.',
     gcp:'온라인 전송은 Storage Transfer Service, 오프라인은 Transfer Appliance를 씁니다.',
     azure:'온라인 전송은 AzCopy나 Storage Mover, 오프라인은 Data Box 계열을 씁니다.',
     so:'아래 시뮬레이터로 일수를 계산하고, 장비 배송 기간과 비교해 고릅니다.'}
  ],
  sims: [{type:'transfer', values:{tb:100, gbps:1, eff:70}, q:'100TB를 1Gbps 회선으로 옮기면 며칠이 걸릴까요?'}],
  iac: 'iac/scenario-06',
  checklist: [
    ['사내와 클라우드 대역이 겹친다','겹치는 대역은 라우팅할 수 없습니다. 연결 전에 사내 IP 대역표부터 받습니다.'],
    ['전용선을 한 위치에만 둔다','회선이 두 개여도 같은 건물이면 함께 끊깁니다.'],
    ['VPN 백업을 한 번도 시험하지 않았다','경로 우선순위나 방화벽 규칙 때문에 실제로는 넘어가지 않는 경우가 많습니다.'],
    ['VPN의 MTU를 고려하지 않는다','IPsec 오버헤드로 큰 패킷이 조각나거나 버려집니다. TCP MSS를 줄입니다.'],
    ['기본 경로(0.0.0.0/0)를 의도 없이 광고한다','클라우드의 인터넷 트래픽까지 사내로 끌려갑니다. 광고 범위를 필터링합니다.'],
    ['DNS 전달이 서로를 가리킨다','같은 도메인을 양쪽이 서로에게 넘기면 질의가 순환합니다.'],
    ['회선 상태에 경보가 없다','BGP 세션 다운, 대역폭 포화를 경보로 받아야 백업 경로로 버티는 동안 조치할 수 있습니다.'],
    ['개통 기간을 일정에 넣지 않았다','전용선은 회선 사업자 작업까지 수주에서 수개월이 걸립니다.']
  ],
  refs: [
    ['AWS Direct Connect 복원력 권장 사항', 'https://aws.amazon.com/directconnect/resiliency-recommendation/'],
    ['Dedicated Interconnect 99.99% 가용성 구성', 'https://cloud.google.com/network-connectivity/docs/interconnect/tutorials/dedicated-creating-9999-availability'],
    ['ExpressRoute와 VPN 공존 구성', 'https://learn.microsoft.com/azure/expressroute/expressroute-howto-coexist-resource-manager']
  ],
  next: '시나리오 07 · 데이터 레이크와 분석 파이프라인'
};
