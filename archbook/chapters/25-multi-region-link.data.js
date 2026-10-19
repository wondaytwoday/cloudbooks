window.SCENARIO = {
  no: 25, level: 'hybrid', title: '전용선 하나로 여러 리전·여러 VPC 연결',
  lede: '서울에 들어온 전용선 하나로 서울 리전과 도쿄 리전(DR)을 모두 써야 합니다. 리전마다 전용선을 새로 넣는 것은 비싸고 오래 걸립니다. AWS는 전역 리소스인 DX 게이트웨이에 리전별 Transit Gateway를 붙이고, GCP는 전역 VPC와 전역 동적 라우팅으로 한 리전의 연결을 모든 리전이 함께 쓰며, Azure는 회선 하나를 여러 지역의 게이트웨이에 연결하되 다른 지정학 지역이면 Premium 추가 기능이 필요합니다. 그리고 "리전끼리도 이 전용선을 지나가면 되겠지"라는 기대가 어디서 깨지는지 확인합니다.',
  region: {aws:'서울 DX 위치 → 서울·도쿄 리전', gcp:'서울 Interconnect → 전역 VPC', azure:'Seoul 피어링 위치 → Korea Central · Japan East'},
  req: [
    {k:'전용선', v:'서울 1곳 (이중화 포함)', s:'도쿄에는 회선 없음'},
    {k:'리전', v:'서울(주) · 도쿄(DR)', s:'사내에서 둘 다 접근'},
    {k:'리전 간', v:'서울 ↔ 도쿄 복제', s:'DB 복제 트래픽'},
    {k:'대역', v:'서울 10.20.0.0/16 · 도쿄 10.40.0.0/16', s:''}
  ],
  intro: {
    arch: '<b>서울 앱 → 도쿄 앱</b>을 골라 세 클라우드를 비교해 보세요. AWS는 DX 게이트웨이가 리전 사이를 이어 주지 않고, GCP는 같은 VPC라 전용선과 무관하게 바로 가며, Azure는 VNet 피어링으로 갑니다.'
  },

  diagram: {
    aws: { w: 700, h: 560, aria: 'AWS: 서울 Direct Connect, 전역 DX 게이트웨이에 서울·도쿄 Transit Gateway 연결, TGW 피어링',
      frames: [
        {id:'corp', kind:'onprem', x:14, y:14, w:672, h:96, label:'사내 IDC 192.168.0.0/16'},
        {id:'rs', kind:'region', x:14, y:290, w:326, h:256, label:'ap-northeast-2 서울'},
        {id:'rt', kind:'region', x:360, y:290, w:326, h:256, label:'ap-northeast-1 도쿄'}
      ],
      nodes: [
        {id:'srv', x:30, y:42, w:200, h:44, icon:'vm', t:'사내 업무 시스템', s:'192.168.20.0/24'},
        {id:'cpe', x:470, y:42, w:200, h:44, icon:'router', t:'사내 라우터', s:'BGP', cfg:'bgppref'},
        {id:'dx', x:470, y:130, w:200, h:44, icon:'dedicated', t:'Direct Connect (서울)', s:'전송 VIF', cfg:'dedicated'},
        {id:'gw', x:250, y:212, w:200, h:46, icon:'router', t:'DX 게이트웨이', s:'전역 리소스', kind:'reg', cfg:'dedicated', why:'DX 게이트웨이는 어느 리전에도 속하지 않습니다. 서울 회선 하나로 여러 리전의 TGW에 연결합니다. 연결마다 사내에 광고할 허용 접두사를 정합니다.'},
        {id:'ap1', kind:'chip', x:30, y:224, t:'허용 접두사: 10.20.0.0/16', cfg:'dedicated'},
        {id:'ap2', kind:'chip', x:480, y:224, t:'허용 접두사: 10.40.0.0/16', cfg:'dedicated'},
        {id:'tgws', x:30, y:330, w:200, h:44, icon:'router', t:'TGW 서울', s:'DXGW 연결', kind:'reg', cfg:'hubnet'},
        {id:'tgwt', x:376, y:330, w:200, h:44, icon:'router', t:'TGW 도쿄', s:'DXGW 연결', kind:'reg', cfg:'hubnet'},
        {id:'peer', kind:'chip', x:236, y:342, t:'TGW 피어링', cfg:'hubnet', why:'리전 간 통신은 TGW 피어링(정적 경로)이나 VPC 피어링으로 합니다. AWS 백본을 지나며 리전 간 전송 요금이 붙습니다.'},
        {id:'apps', x:30, y:450, w:200, h:44, icon:'vm', t:'서울 앱', s:'10.20.10.0/24', cfg:'vmgroup'},
        {id:'appt', x:376, y:450, w:200, h:44, icon:'vm', t:'도쿄 앱 (DR)', s:'10.40.10.0/24', cfg:'vmgroup'},
        {id:'nohair', kind:'chip', x:236, y:266, t:'DXGW: TGW ↔ TGW 전달 안 함', cfg:'dedicated'}
      ],
      edges: [{a:'cpe', b:'dx'}, {a:'dx', b:'gw'}, {a:'gw', b:'tgws'}, {a:'gw', b:'tgwt'}, {a:'tgws', b:'apps'}, {a:'tgwt', b:'appt'}]
    },

    gcp: { w: 700, h: 560, aria: 'GCP: 서울 Interconnect와 Cloud Router, 전역 동적 라우팅의 VPC 하나에 서울·도쿄 서브넷',
      frames: [
        {id:'corp', kind:'onprem', x:14, y:14, w:672, h:96, label:'사내 IDC 192.168.0.0/16'},
        {id:'vpcf', kind:'net', x:14, y:200, w:672, h:346, label:'vpc-global · routing_mode = GLOBAL', cfg:'vpc'},
        {id:'rs', kind:'region', x:26, y:290, w:316, h:244, label:'asia-northeast3 서울'},
        {id:'rt', kind:'region', x:358, y:290, w:316, h:244, label:'asia-northeast1 도쿄'}
      ],
      nodes: [
        {id:'srv', x:30, y:42, w:200, h:44, icon:'vm', t:'사내 업무 시스템', s:'192.168.20.0/24'},
        {id:'cpe', x:470, y:42, w:200, h:44, icon:'router', t:'사내 라우터', s:'BGP', cfg:'bgppref'},
        {id:'dx', x:470, y:130, w:200, h:44, icon:'dedicated', t:'Interconnect (서울)', s:'VLAN 연결', cfg:'dedicated'},
        {id:'gw', x:40, y:226, w:200, h:46, icon:'router', t:'Cloud Router (서울)', s:'전역 동적 라우팅', kind:'reg', cfg:'dedicated', why:'VPC 동적 라우팅 모드가 전역이면 서울 Cloud Router가 배운 사내 경로가 도쿄 리전에도 들어가고, 도쿄 서브넷도 사내로 광고됩니다.'},
        {id:'ap1', kind:'chip', x:256, y:238, t:'광고: 10.20.0.0/16 · 10.40.0.0/16 (모든 리전)', cfg:'dedicated'},
        {id:'tgws', kind:'chip', x:40, y:330, t:'서울 VM의 사내 경로 (기본 우선순위)', cfg:'route'},
        {id:'tgwt', kind:'chip', x:372, y:330, t:'도쿄 VM의 사내 경로 (+ 리전 간 비용)', cfg:'route', why:'다른 리전에서 배운 동적 경로에는 리전 간 비용이 우선순위에 더해집니다. 도쿄에도 연결이 생기면 도쿄 연결이 자동으로 선호됩니다.'},
        {id:'peer', kind:'chip', x:236, y:400, t:'같은 VPC: 리전 간 직접', cfg:'vpc'},
        {id:'apps', x:40, y:450, w:200, h:44, icon:'vm', t:'서울 앱', s:'subnet-seoul 10.20.10.0/24', cfg:'vmgroup'},
        {id:'appt', x:372, y:450, w:200, h:44, icon:'vm', t:'도쿄 앱 (DR)', s:'subnet-tokyo 10.40.10.0/24', cfg:'vmgroup'},
        {id:'nohair', kind:'chip', x:440, y:266, t:'도쿄에 Cloud Router 없음', cfg:'dedicated'}
      ],
      edges: [{a:'cpe', b:'dx'}, {a:'dx', b:'gw'}, {a:'apps', b:'appt', dash:'both'}]
    },

    azure: { w: 700, h: 560, aria: 'Azure: Seoul 피어링 위치의 ExpressRoute 회선 하나를 Korea Central과 Japan East의 게이트웨이에 연결, 허브 간 전역 VNet 피어링',
      frames: [
        {id:'corp', kind:'onprem', x:14, y:14, w:672, h:96, label:'사내 IDC 192.168.0.0/16'},
        {id:'rs', kind:'region', x:14, y:290, w:326, h:256, label:'Korea Central'},
        {id:'rt', kind:'region', x:360, y:290, w:326, h:256, label:'Japan East'}
      ],
      nodes: [
        {id:'srv', x:30, y:42, w:200, h:44, icon:'vm', t:'사내 업무 시스템', s:'192.168.20.0/24'},
        {id:'cpe', x:470, y:42, w:200, h:44, icon:'router', t:'사내 라우터', s:'BGP', cfg:'bgppref'},
        {id:'dx', x:470, y:130, w:200, h:44, icon:'dedicated', t:'ExpressRoute 회선', s:'Seoul 피어링 위치', cfg:'dedicated'},
        {id:'gw', x:250, y:212, w:200, h:46, icon:'router', t:'회선 연결 2개', s:'지역마다 ER 게이트웨이', kind:'reg', cfg:'dedicated'},
        {id:'ap1', kind:'chip', x:30, y:224, t:'Korea Central: Standard로 충분', cfg:'dedicated'},
        {id:'ap2', kind:'chip', x:470, y:224, t:'Japan East: Premium 필요', cfg:'dedicated', why:'Standard 회선은 같은 지정학 지역(한국) 안의 VNet만 연결합니다. 일본 지역에 연결하려면 Premium 추가 기능이 필요하고 요금이 늘어납니다.'},
        {id:'tgws', x:30, y:330, w:200, h:44, icon:'router', t:'ER 게이트웨이 (허브)', s:'Korea Central', kind:'reg', cfg:'dedicated'},
        {id:'tgwt', x:376, y:330, w:200, h:44, icon:'router', t:'ER 게이트웨이 (허브)', s:'Japan East', kind:'reg', cfg:'dedicated'},
        {id:'peer', kind:'chip', x:236, y:400, t:'전역 VNet 피어링', cfg:'peering', why:'지역 간 VNet 통신은 허브끼리 전역 VNet 피어링으로 합니다. 같은 회선을 거쳐 돌아가는(헤어핀) 방식은 권장되지 않습니다.'},
        {id:'apps', x:30, y:450, w:200, h:44, icon:'vm', t:'서울 앱', s:'10.20.10.0/24', cfg:'vmgroup'},
        {id:'appt', x:376, y:450, w:200, h:44, icon:'vm', t:'도쿄 앱 (DR)', s:'10.40.10.0/24', cfg:'vmgroup'},
        {id:'nohair', kind:'chip', x:236, y:266, t:'회선 경유 VNet 간 통신: 비권장', cfg:'dedicated'}
      ],
      edges: [{a:'cpe', b:'dx'}, {a:'dx', b:'gw'}, {a:'gw', b:'tgws'}, {a:'gw', b:'tgwt'}, {a:'tgws', b:'apps'}, {a:'tgwt', b:'appt'}]
    }
  },

  flows: [
    {id:'seoul', t:'사내 → 서울 앱',
     d:'가장 단순한 경로입니다.',
     hops:{
      aws:[{n:'srv', t:'사내 업무 시스템', r:''},{n:'cpe', t:'사내 라우터', r:'10.20.0.0/16 → 전용선', cfg:'bgppref'},{n:'dx', t:'Direct Connect', r:'', cfg:'dedicated'},{n:'gw', t:'DX 게이트웨이', r:'서울 TGW 연결의 허용 접두사', cfg:'dedicated'},{n:'tgws', t:'TGW 서울', r:'', cfg:'hubnet'},{n:'apps', t:'서울 앱', r:''}],
      gcp:[{n:'srv', t:'사내 업무 시스템', r:''},{n:'cpe', t:'사내 라우터', r:'', cfg:'bgppref'},{n:'dx', t:'Interconnect', r:'', cfg:'dedicated'},{n:'gw', t:'Cloud Router (서울)', r:'', cfg:'dedicated'},{n:'apps', t:'서울 앱', r:''}],
      azure:[{n:'srv', t:'사내 업무 시스템', r:''},{n:'cpe', t:'사내 라우터', r:'', cfg:'bgppref'},{n:'dx', t:'ExpressRoute 회선', r:'', cfg:'dedicated'},{n:'gw', t:'회선 연결', r:'', cfg:'dedicated'},{n:'tgws', t:'ER 게이트웨이 Korea Central', r:'', cfg:'dedicated'},{n:'apps', t:'서울 앱', r:''}]
     }},
    {id:'tokyo', t:'사내 → 도쿄 앱 (도쿄에는 회선 없음)',
     d:'서울 전용선 하나로 도쿄 리전에 닿습니다.',
     hops:{
      aws:[{n:'srv', t:'사내 업무 시스템', r:''},{n:'cpe', t:'사내 라우터', r:'10.40.0.0/16 → 전용선 (DXGW가 광고)', cfg:'bgppref'},{n:'dx', t:'Direct Connect (서울)', r:'', cfg:'dedicated'},{n:'gw', t:'DX 게이트웨이', r:'도쿄 TGW 연결로. AWS 백본으로 리전 이동', cfg:'dedicated'},{n:'tgwt', t:'TGW 도쿄', r:'', cfg:'hubnet'},{n:'appt', t:'도쿄 앱', r:''}],
      gcp:[{n:'srv', t:'사내 업무 시스템', r:''},{n:'cpe', t:'사내 라우터', r:'Cloud Router가 도쿄 서브넷도 광고 (전역 모드)', cfg:'bgppref'},{n:'dx', t:'Interconnect (서울)', r:'', cfg:'dedicated'},{n:'gw', t:'Cloud Router (서울)', r:'', cfg:'dedicated'},{n:'tgwt', t:'도쿄 VM의 사내 경로', r:'응답: 서울에서 배운 경로 + 리전 간 비용', cfg:'route'},{n:'appt', t:'도쿄 앱', r:''}],
      azure:[{n:'srv', t:'사내 업무 시스템', r:''},{n:'cpe', t:'사내 라우터', r:'', cfg:'bgppref'},{n:'dx', t:'ExpressRoute 회선 (Seoul)', r:'Premium 추가 기능 활성', cfg:'dedicated'},{n:'ap2', t:'Japan East 연결', r:'다른 지정학 지역 → Premium 필요', cfg:'dedicated'},{n:'tgwt', t:'ER 게이트웨이 Japan East', r:'', cfg:'dedicated'},{n:'appt', t:'도쿄 앱', r:''}]
     },
     note:{aws:'서울 회선이 끊기면 도쿄도 함께 끊깁니다. DR 목적이라면 도쿄 쪽 DX 위치나 VPN 백업을 별도로 둡니다.', gcp:'도쿄 연결을 나중에 추가하면 도쿄 VM은 자동으로 가까운 연결을 선호합니다(리전 간 비용 차이).', azure:'Premium은 회선 단위 요금입니다. 지정학 지역이 같은 Korea South라면 Standard로 됩니다.'}},
    {id:'inter', t:'서울 앱 → 도쿄 앱 (리전 간 복제)',
     d:'DB 복제 트래픽이 리전 사이를 오갑니다. 전용선을 거쳐 가면 될까요?',
     hops:{
      aws:[{n:'apps', t:'서울 앱', r:'10.40.10.x'},{n:'tgws', t:'TGW 서울', r:'DXGW 연결에서 배운 10.40.0.0/16? → DXGW는 연결된 TGW 사이 경로를 서로 광고하지 않음', cfg:'hubnet'},{n:'gw', t:'DX 게이트웨이', r:'TGW ↔ TGW 전달을 하지 않음 → 경로 없음', cfg:'dedicated', ok:false},{n:'appt', t:'도쿄 앱', r:''}],
      gcp:[{n:'apps', t:'서울 앱', r:'10.40.10.x'},{n:'peer', t:'VPC 서브넷 경로', r:'같은 전역 VPC라 Google 백본으로 직접. 전용선을 거치지 않음', cfg:'vpc'},{n:'appt', t:'도쿄 앱', r:'방화벽 규칙만 맞으면 됨'}],
      azure:[{n:'apps', t:'서울 앱', r:'10.40.10.x'},{n:'tgws', t:'허브 Korea Central', r:'', cfg:'dedicated'},{n:'peer', t:'전역 VNet 피어링', r:'허브 ↔ 허브. 회선을 돌아가는 경로는 쓰지 않음', cfg:'peering'},{n:'tgwt', t:'허브 Japan East', r:'', cfg:'dedicated'},{n:'appt', t:'도쿄 앱', r:''}]
     },
     note:{aws:'TGW 피어링을 만들고 양쪽 TGW 라우팅 테이블에 상대 대역 정적 경로를 넣습니다.', gcp:'리전 간 트래픽 요금은 붙지만 연결 설정은 없습니다.', azure:'허브 간 피어링과 각 허브 방화벽의 UDR을 맞춥니다. Virtual WAN을 쓰면 허브 간 연결을 관리형으로 처리합니다.'}}
  ],

  scope: ['dedicated','hubnet','peering','route'],
  build: {
    aws: [
      {t:'DX 게이트웨이 + 서울 전송 VIF', d:'', cfg:'dedicated', nodes:['gw','dx']},
      {t:'서울·도쿄 TGW를 DXGW에 연결', d:'연결마다 허용 접두사', cfg:'dedicated', nodes:['tgws','tgwt','ap1','ap2']},
      {t:'TGW 피어링 (서울 ↔ 도쿄)', d:'수락 후 양쪽 정적 경로', cfg:'hubnet', nodes:['peer']},
      {t:'VPC 라우팅', d:'사내 대역 → 각 리전 TGW', cfg:'route', nodes:['apps','appt']}
    ],
    gcp: [
      {t:'VPC 동적 라우팅 모드 GLOBAL', d:'', cfg:'vpc', nodes:['vpcf']},
      {t:'서울 Cloud Router + VLAN 연결', d:'', cfg:'dedicated', nodes:['gw','dx']},
      {t:'도쿄 서브넷 추가', d:'경로·광고 작업 없음', cfg:'subnet', nodes:['appt','tgwt'], auto:true},
      {t:'방화벽: 사내·리전 간 허용', d:'', cfg:'firewall', nodes:['peer']}
    ],
    azure: [
      {t:'ExpressRoute 회선 (Premium 추가 기능)', d:'Japan East 연결용', cfg:'dedicated', nodes:['dx','ap2']},
      {t:'지역별 허브 + ER 게이트웨이', d:'', cfg:'dedicated', nodes:['tgws','tgwt']},
      {t:'회선 연결 2개', d:'같은 회선을 두 게이트웨이에', cfg:'dedicated', nodes:['gw']},
      {t:'허브 간 전역 VNet 피어링', d:'', cfg:'peering', nodes:['peer']}
    ]
  },

  map: ['dedicated-link','network-hub','cross-region-db'],

  decisions: [
    {t:'한 리전의 회선으로 다른 리전에 닿는 방법',
     p:'회선은 한 곳에 있어도 클라우드 백본이 리전 사이를 잇습니다. 그 연결을 무엇이 맡는지가 다릅니다.',
     aws:'전역 리소스인 DX 게이트웨이가 여러 리전의 TGW·VGW를 받습니다.',
     gcp:'VPC가 전역이고, 동적 라우팅 모드를 전역으로 두면 한 리전의 Cloud Router가 모든 리전을 대표합니다.',
     azure:'회선 하나를 여러 지역의 ER 게이트웨이에 연결합니다. 다른 지정학 지역이면 Premium이 필요합니다.',
     so:'GCP는 설정 하나, AWS는 연결 추가, Azure는 연결 추가 + 요금제 조건입니다.'},
    {t:'리전 간 통신이 전용선을 지나가는가',
     p:'사내를 거쳐 리전 간 트래픽이 흐르면 전용선이 막히고 요금도 이중으로 붙습니다.',
     aws:'DX 게이트웨이는 연결된 TGW 사이 트래픽을 전달하지 않습니다. TGW 피어링이 필요합니다.',
     gcp:'같은 VPC라 Google 백본으로 바로 갑니다.',
     azure:'허브 간 전역 VNet 피어링을 씁니다. 회선 경유 VNet 간 통신은 권장되지 않습니다.',
     so:'리전 간 경로는 전용선과 별개로 설계합니다.'},
    {t:'DR 리전의 사내 연결은 충분한가',
     p:'회선 하나로 두 리전에 닿는다는 것은 회선 장애가 두 리전에 동시에 영향을 준다는 뜻입니다.',
     aws:'DR 리전용 DX 위치나 VPN을 별도로 둡니다.',
     gcp:'도쿄에 연결을 추가하면 도쿄 VM이 자동으로 가까운 연결을 씁니다.',
     azure:'Japan East에 가까운 피어링 위치의 회선을 추가하거나 VPN을 둡니다.',
     so:'DR 시험 때 "서울 회선이 끊긴 상태"도 함께 시험합니다.'}
  ],

  iac: 'iac/scenario-25',
  checklist: [
    ['리전 간 트래픽이 사내를 거쳐 간다','전용선 대역폭과 요금을 리전 복제가 잡아먹습니다.'],
    ['AWS DXGW로 리전 간 통신이 될 거라 기대한다','TGW 피어링이 필요합니다.'],
    ['GCP 동적 라우팅 모드를 리전으로 둔다','다른 리전 서브넷이 사내에 광고되지 않고 경로도 받지 못합니다.'],
    ['Azure Standard 회선으로 다른 지정학 지역에 연결하려 한다','연결이 만들어지지 않습니다. Premium이 필요합니다.'],
    ['DR 리전이 주 리전 회선에만 의존한다','회선 장애 때 DR도 사내에서 닿지 않습니다.']
  ],
  refs: [
    ['AWS: Direct Connect 게이트웨이','https://docs.aws.amazon.com/directconnect/latest/UserGuide/direct-connect-gateways-intro.html'],
    ['Google Cloud: 동적 라우팅 모드','https://cloud.google.com/vpc/docs/vpc#routing_for_hybrid_networks'],
    ['Azure: ExpressRoute Premium','https://learn.microsoft.com/azure/expressroute/expressroute-faqs'],
    ['Azure: 전역 VNet 피어링','https://learn.microsoft.com/azure/virtual-network/virtual-network-peering-overview']
  ],
  next: '시나리오 26 · 전용선 구간 암호화'
};
