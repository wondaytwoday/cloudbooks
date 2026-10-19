window.SCENARIO = {
  no: 24, level: 'hybrid', title: '클라우드 대역이 사내와 겹칠 때',
  lede: '인수한 회사의 클라우드 네트워크가 10.10.0.0/16을 쓰고 있는데, 사내 지사도 같은 10.10.0.0/16을 씁니다. 다시 번호를 매기기(re-IP)는 몇 달이 걸립니다. 그 사이에도 클라우드 앱은 사내 ERP(172.16.20.10)를 불러야 하고, 사내 사용자는 클라우드 앱을 써야 합니다. 겹치는 대역은 사내에 광고하지 않고, 겹치지 않는 작은 대역 하나를 "출입문"으로 만들어 나갈 때는 사설 NAT로, 들어올 때는 그 대역의 로드밸런서·엔드포인트로 받습니다.',
  region: {aws:'vpc-acq (10.10.0.0/16 + 보조 100.64.10.0/24)', gcp:'vpc-acq (10.10.0.0/16 + 100.64.20.0/23)', azure:'스포크 vnet-acq (10.10.0.0/16) + 허브 vnet-hub (100.64.30.0/24)'},
  req: [
    {k:'겹침', v:'10.10.0.0/16', s:'사내 지사와 인수 회사 VPC가 같음'},
    {k:'나가는 통신', v:'클라우드 앱 → 사내 ERP', s:'172.16.20.10 (겹치지 않음)'},
    {k:'들어오는 통신', v:'사내 사용자 → 클라우드 앱', s:'172.16.50.0/24에서'},
    {k:'출입문 대역', v:'100.64.x.x', s:'사내 어디와도 겹치지 않는 대역'}
  ],
  intro: {
    arch: '<b>클라우드 앱 → 사내 지사(10.10.x)</b>를 골라 보세요. 사설 NAT를 두어도 겹치는 대역 자체로는 갈 수 없습니다. 목적지가 VPC 자기 대역 안에 있으면 그 패킷은 VPC를 떠나지 않기 때문입니다.'
  },

  diagram: {
    aws: { w: 700, h: 560, aria: 'AWS: 겹치는 대역의 워크로드 서브넷, 라우팅 가능한 보조 CIDR 서브넷의 사설 NAT 게이트웨이와 NLB, TGW·Direct Connect로 사내 연결',
      frames: [
        {id:'corp', kind:'onprem', x:14, y:14, w:672, h:110, label:'사내 (172.16.0.0/12 · 지사 10.10.0.0/16)'},
        {id:'vpc', kind:'net', x:14, y:220, w:672, h:326, label:'vpc-acq 10.10.0.0/16 + 보조 100.64.10.0/24', cfg:'vpc'},
        {id:'nr', kind:'plain', x:26, y:280, w:310, h:254, label:'워크로드 10.10.5.0/24 · 사내에 광고 안 함', cfg:'subnet'},
        {id:'rt', kind:'plain', x:350, y:280, w:324, h:254, label:'출입문 100.64.10.0/24 · 라우팅 가능', cfg:'subnet'}
      ],
      nodes: [
        {id:'users', x:30, y:46, w:150, h:44, icon:'users', t:'사내 사용자', s:'172.16.50.0/24'},
        {id:'erp', x:350, y:46, w:150, h:44, icon:'vm', t:'사내 ERP', s:'172.16.20.10'},
        {id:'branch', x:190, y:46, w:150, h:44, icon:'onprem', t:'지사 서버', s:'10.10.3.7 (겹침)', kind:'alt'},
        {id:'cpe', x:510, y:46, w:160, h:44, icon:'router', t:'사내 라우터', s:'BGP', cfg:'bgppref'},
        {id:'adv', kind:'chip', x:200, y:162, t:'DXGW 허용 접두사: 100.64.10.0/24만', cfg:'dedicated', why:'DX 게이트웨이 연결의 허용 접두사로 사내에 광고할 대역을 출입문 대역 하나로 제한합니다. 10.10.0.0/16은 광고하지 않습니다.'},
        {id:'dx', x:510, y:150, w:160, h:44, icon:'dedicated', t:'Direct Connect', s:'전송 VIF', cfg:'dedicated'},
        {id:'tgw', x:510, y:236, w:160, h:40, icon:'router', t:'Transit Gateway', s:'출입문 서브넷에 연결', kind:'reg', cfg:'hubnet'},
        {id:'app', x:40, y:316, w:200, h:44, icon:'vm', t:'클라우드 앱', s:'10.10.5.20', cfg:'vmgroup'},
        {id:'rtapp', kind:'chip', x:40, y:376, t:'rt-work: 172.16/12 → nat-private', cfg:'route'},
        {id:'local', kind:'chip', x:40, y:402, t:'local: 10.10.0.0/16 (항상 VPC 안)', cfg:'route'},
        {id:'privnat', x:364, y:316, w:200, h:44, icon:'nat', t:'NAT 게이트웨이 (사설)', s:'100.64.10.5 · EIP 없음', kind:'reg', cfg:'privnat'},
        {id:'rtnat', kind:'chip', x:364, y:376, t:'rt-door: 172.16/12 → tgw', cfg:'route'},
        {id:'nlb', x:364, y:440, w:200, h:44, icon:'lb', t:'NLB (내부)', s:'100.64.10.20 → 10.10.5.20', cfg:'lb', why:'사설 NAT는 안에서 시작한 연결만 바꿉니다. 사내에서 들어오는 연결은 출입문 대역에 둔 NLB가 받아 겹치는 대역의 앱으로 넘깁니다.'}
      ],
      edges: [{a:'cpe', b:'dx'}, {a:'dx', b:'tgw'}]
    },

    gcp: { w: 700, h: 560, aria: 'GCP: 겹치는 대역 서브넷, PRIVATE_NAT 서브넷과 Private NAT, 라우팅 가능한 서브넷의 내부 LB, Cloud Router 맞춤 광고',
      frames: [
        {id:'corp', kind:'onprem', x:14, y:14, w:672, h:110, label:'사내 (172.16.0.0/12 · 지사 10.10.0.0/16)'},
        {id:'vpc', kind:'net', x:14, y:220, w:672, h:326, label:'vpc-acq · 전역', cfg:'vpc'},
        {id:'nr', kind:'plain', x:26, y:280, w:310, h:254, label:'subnet-work 10.10.5.0/24 · 광고 안 함', cfg:'subnet'},
        {id:'rt', kind:'plain', x:350, y:280, w:324, h:254, label:'100.64.20.0/24 (PRIVATE_NAT) · 100.64.21.0/24', cfg:'subnet'}
      ],
      nodes: [
        {id:'users', x:30, y:46, w:150, h:44, icon:'users', t:'사내 사용자', s:'172.16.50.0/24'},
        {id:'erp', x:350, y:46, w:150, h:44, icon:'vm', t:'사내 ERP', s:'172.16.20.10'},
        {id:'branch', x:190, y:46, w:150, h:44, icon:'onprem', t:'지사 서버', s:'10.10.3.7 (겹침)', kind:'alt'},
        {id:'cpe', x:510, y:46, w:160, h:44, icon:'router', t:'사내 라우터', s:'BGP', cfg:'bgppref'},
        {id:'adv', kind:'chip', x:200, y:162, t:'맞춤 광고: 100.64.20.0/23만', cfg:'dedicated', why:'Cloud Router를 맞춤 광고 모드로 두고 서브넷 전체 광고를 빼야 10.10.0.0/16이 사내로 나가지 않습니다.'},
        {id:'dx', x:510, y:150, w:160, h:44, icon:'dedicated', t:'Interconnect', s:'VLAN 연결', cfg:'dedicated'},
        {id:'tgw', x:510, y:236, w:160, h:40, icon:'router', t:'Cloud Router', s:'Private NAT도 여기에', kind:'reg', cfg:'dedicated'},
        {id:'app', x:40, y:316, w:200, h:44, icon:'vm', t:'클라우드 앱', s:'10.10.5.20', cfg:'vmgroup'},
        {id:'rtapp', kind:'chip', x:40, y:376, t:'동적 경로 172.16/12 → Interconnect', cfg:'route'},
        {id:'local', kind:'chip', x:40, y:402, t:'서브넷 경로 10.10.5.0/24 (항상 VPC 안)', cfg:'route'},
        {id:'privnat', x:364, y:316, w:200, h:44, icon:'nat', t:'Private NAT (하이브리드)', s:'NAT IP 100.64.20.x', kind:'reg', cfg:'privnat'},
        {id:'rtnat', kind:'chip', x:364, y:376, t:'대상: 하이브리드 연결 경로', cfg:'privnat'},
        {id:'nlb', x:364, y:440, w:200, h:44, icon:'lb', t:'내부 패스스루 NLB', s:'100.64.21.20 → 10.10.5.20', cfg:'lb'}
      ],
      edges: [{a:'cpe', b:'dx'}, {a:'dx', b:'tgw'}]
    },

    azure: { w: 700, h: 560, aria: 'Azure: 겹치는 대역의 스포크 VNet을 게이트웨이 전송 없이 허브와 피어링, 허브의 Azure Firewall SNAT와 Private Endpoint',
      frames: [
        {id:'corp', kind:'onprem', x:14, y:14, w:672, h:110, label:'사내 (172.16.0.0/12 · 지사 10.10.0.0/16)'},
        {id:'vpc', kind:'net', x:14, y:220, w:672, h:326, label:'인수 회사 네트워크', cfg:'vpc'},
        {id:'nr', kind:'plain', x:26, y:280, w:310, h:254, label:'스포크 vnet-acq 10.10.0.0/16 · 원격 게이트웨이 사용 끔', cfg:'peering'},
        {id:'rt', kind:'plain', x:350, y:280, w:324, h:254, label:'허브 vnet-hub 100.64.30.0/24', cfg:'hubnet'}
      ],
      nodes: [
        {id:'users', x:30, y:46, w:150, h:44, icon:'users', t:'사내 사용자', s:'172.16.50.0/24'},
        {id:'erp', x:350, y:46, w:150, h:44, icon:'vm', t:'사내 ERP', s:'172.16.20.10'},
        {id:'branch', x:190, y:46, w:150, h:44, icon:'onprem', t:'지사 서버', s:'10.10.3.7 (겹침)', kind:'alt'},
        {id:'cpe', x:510, y:46, w:160, h:44, icon:'router', t:'사내 라우터', s:'BGP', cfg:'bgppref'},
        {id:'adv', kind:'chip', x:200, y:162, t:'광고: 허브 100.64.30.0/24만 (스포크는 전송 안 함)', cfg:'dedicated', why:'ER 게이트웨이는 연결된 VNet 주소 공간을 광고합니다. 겹치는 스포크가 "원격 게이트웨이 사용"을 끄고 피어링하면 그 대역은 사내로 광고되지 않습니다.'},
        {id:'dx', x:510, y:150, w:160, h:44, icon:'dedicated', t:'ExpressRoute', s:'프라이빗 피어링', cfg:'dedicated'},
        {id:'tgw', x:510, y:236, w:160, h:40, icon:'router', t:'ER 게이트웨이', s:'허브', kind:'reg', cfg:'dedicated'},
        {id:'app', x:40, y:316, w:200, h:44, icon:'vm', t:'클라우드 앱', s:'10.10.5.20', cfg:'vmgroup'},
        {id:'rtapp', kind:'chip', x:40, y:376, t:'UDR: 172.16/12 → 방화벽 100.64.30.4', cfg:'route'},
        {id:'local', kind:'chip', x:40, y:402, t:'VNet 경로 10.10.0.0/16 (항상 VNet 안)', cfg:'route'},
        {id:'pls', x:40, y:460, w:200, h:44, icon:'privlink', t:'Private Link 서비스', s:'내부 LB 앞', cfg:'privsvc'},
        {id:'privnat', x:364, y:316, w:200, h:44, icon:'fw', t:'Azure Firewall', s:'SNAT → 100.64.30.4', kind:'reg', cfg:'privnat', why:'ExpressRoute에는 관리형 NAT가 없어 허브 방화벽이 SNAT합니다. 기본 설정은 사설 대역으로 가는 트래픽을 SNAT하지 않으므로, 방화벽 정책의 SNAT 사설 대역 설정을 바꿔 항상 SNAT하게 합니다.'},
        {id:'rtnat', kind:'chip', x:364, y:376, t:'SNAT 사설 대역: 항상 변환', cfg:'privnat'},
        {id:'nlb', x:364, y:440, w:200, h:44, icon:'privlink', t:'Private Endpoint', s:'100.64.30.20', cfg:'privlink'}
      ],
      edges: [{a:'cpe', b:'dx'}, {a:'dx', b:'tgw'}, {a:'nlb', b:'pls', dash:'both'}]
    }
  },

  flows: [
    {id:'out', t:'클라우드 앱 → 사내 ERP (172.16.20.10)',
     d:'겹치는 대역의 앱이 겹치지 않는 사내 서버를 부릅니다.',
     hops:{
      aws:[{n:'app', t:'클라우드 앱 10.10.5.20', r:''},
           {n:'rtapp', t:'rt-work', r:'172.16.0.0/12 → 사설 NAT', cfg:'route'},
           {n:'privnat', t:'사설 NAT 게이트웨이', r:'출발지 10.10.5.20 → 100.64.10.5', cfg:'privnat'},
           {n:'rtnat', t:'rt-door', r:'172.16.0.0/12 → TGW', cfg:'route'},
           {n:'tgw', t:'Transit Gateway', r:'', cfg:'hubnet'},
           {n:'dx', t:'Direct Connect', r:'', cfg:'dedicated'},
           {n:'cpe', t:'사내 라우터', r:'응답 목적지 100.64.10.5는 BGP로 알고 있음', cfg:'bgppref'},
           {n:'erp', t:'사내 ERP', r:'출발지를 100.64.10.5로 봄 → ERP 방화벽에 이 IP를 허용'}],
      gcp:[{n:'app', t:'클라우드 앱 10.10.5.20', r:''},
           {n:'rtapp', t:'VPC 경로', r:'172.16.0.0/12 동적 경로 → Interconnect', cfg:'route'},
           {n:'privnat', t:'Private NAT', r:'하이브리드 대상 규칙에 맞아 출발지를 100.64.20.x로', cfg:'privnat'},
           {n:'tgw', t:'Cloud Router', r:'', cfg:'dedicated'},
           {n:'dx', t:'Interconnect', r:'', cfg:'dedicated'},
           {n:'cpe', t:'사내 라우터', r:'100.64.20.0/23은 맞춤 광고로 알고 있음', cfg:'bgppref'},
           {n:'erp', t:'사내 ERP', r:'출발지 100.64.20.x'}],
      azure:[{n:'app', t:'클라우드 앱 10.10.5.20', r:''},
           {n:'rtapp', t:'스포크 UDR', r:'172.16.0.0/12 → 허브 방화벽 (피어링)', cfg:'route'},
           {n:'privnat', t:'Azure Firewall', r:'네트워크 규칙 허용 + SNAT → 100.64.30.4', cfg:'privnat'},
           {n:'tgw', t:'ER 게이트웨이', r:'', cfg:'dedicated'},
           {n:'dx', t:'ExpressRoute', r:'', cfg:'dedicated'},
           {n:'cpe', t:'사내 라우터', r:'100.64.30.0/24만 알고 있음', cfg:'bgppref'},
           {n:'erp', t:'사내 ERP', r:'출발지 100.64.30.4'}]
     }},
    {id:'in', t:'사내 사용자 → 클라우드 앱',
     d:'사내 사용자가 출입문 대역의 주소로 클라우드 앱을 엽니다.',
     hops:{
      aws:[{n:'users', t:'사내 사용자', r:'app.acq.internal → 100.64.10.20'},
           {n:'cpe', t:'사내 라우터', r:'', cfg:'bgppref'},
           {n:'dx', t:'Direct Connect', r:'', cfg:'dedicated'},
           {n:'tgw', t:'Transit Gateway', r:'출입문 서브넷 연결로', cfg:'hubnet'},
           {n:'nlb', t:'NLB (내부)', r:'대상 10.10.5.20 (IP 대상, 같은 VPC)', cfg:'lb'},
           {n:'app', t:'클라우드 앱', r:'NLB가 응답을 돌려보냄'}],
      gcp:[{n:'users', t:'사내 사용자', r:'100.64.21.20'},
           {n:'cpe', t:'사내 라우터', r:'', cfg:'bgppref'},
           {n:'dx', t:'Interconnect', r:'', cfg:'dedicated'},
           {n:'tgw', t:'Cloud Router', r:'', cfg:'dedicated'},
           {n:'nlb', t:'내부 패스스루 NLB', r:'라우팅 가능 서브넷의 전달 규칙, 백엔드는 겹치는 서브넷의 VM', cfg:'lb'},
           {n:'app', t:'클라우드 앱', r:'패스스루라 응답이 사내 IP로 직접 → 172.16/12 경로가 있어야 함'}],
      azure:[{n:'users', t:'사내 사용자', r:'100.64.30.20'},
           {n:'cpe', t:'사내 라우터', r:'', cfg:'bgppref'},
           {n:'dx', t:'ExpressRoute', r:'', cfg:'dedicated'},
           {n:'tgw', t:'ER 게이트웨이', r:'', cfg:'dedicated'},
           {n:'nlb', t:'Private Endpoint (허브)', r:'', cfg:'privlink'},
           {n:'pls', t:'Private Link 서비스 (스포크)', r:'NAT IP로 변환해 내부 LB → 앱. 겹치는 대역이어도 됨', cfg:'privsvc'},
           {n:'app', t:'클라우드 앱', r:''}]
     }},
    {id:'branch', t:'클라우드 앱 → 사내 지사 (10.10.3.7, 겹치는 대역)',
     d:'앱이 겹치는 대역에 있는 지사 서버를 부르려 합니다.',
     hops:{
      aws:[{n:'app', t:'클라우드 앱', r:'10.10.3.7'},
           {n:'local', t:'local 경로', r:'목적지가 VPC 자기 대역 → VPC 안에서 찾음. 사설 NAT로 가는 경로를 탈 수 없음', cfg:'route', ok:false},
           {n:'branch', t:'지사 서버', r:''}],
      gcp:[{n:'app', t:'클라우드 앱', r:'10.10.3.7'},
           {n:'local', t:'서브넷 경로', r:'서브넷 경로가 동적 경로보다 우선 → VPC 안에서 찾음', cfg:'route', ok:false},
           {n:'branch', t:'지사 서버', r:''}],
      azure:[{n:'app', t:'클라우드 앱', r:'10.10.3.7'},
           {n:'local', t:'VNet 시스템 경로', r:'VNet 주소 공간 안 → 밖으로 나가지 않음', cfg:'route', ok:false},
           {n:'branch', t:'지사 서버', r:''}]
     },
     note:'겹치는 대역끼리는 NAT로도 직접 통신할 수 없습니다. 지사 서버도 출입문처럼 겹치지 않는 주소(사내 쪽 NAT, DNS 이름)로 노출해야 합니다. 근본 해결은 re-IP입니다.'}
  ],

  scope: ['privnat','dedicated','route','lb','privsvc'],
  build: {
    aws: [
      {t:'보조 CIDR 100.64.10.0/24 추가', d:'출입문 서브넷 AZ 2개', cfg:'privnat', nodes:['rt']},
      {t:'TGW 연결을 출입문 서브넷에', d:'VPC 연결은 모든 CIDR을 전파하므로 전파 대신 정적 경로 100.64.10.0/24만', cfg:'hubnet', nodes:['tgw']},
      {t:'DXGW 허용 접두사', d:'100.64.10.0/24만', cfg:'dedicated', nodes:['adv']},
      {t:'사설 NAT 게이트웨이', d:'연결 유형 private', cfg:'privnat', nodes:['privnat']},
      {t:'라우팅', d:'워크로드: 172.16/12 → NAT, 출입문: 172.16/12 → TGW', cfg:'route', nodes:['rtapp','rtnat']},
      {t:'내부 NLB (IP 대상)', d:'사내 → 앱 입구', cfg:'lb', nodes:['nlb']}
    ],
    gcp: [
      {t:'라우팅 가능 서브넷 2개', d:'PRIVATE_NAT 100.64.20.0/24, 일반 100.64.21.0/24', cfg:'privnat', nodes:['rt']},
      {t:'Cloud Router 맞춤 광고', d:'ALL_SUBNETS 빼고 100.64.20.0/23만', cfg:'dedicated', nodes:['adv','tgw']},
      {t:'Private NAT 게이트웨이 + 규칙', d:'소스: subnet-work, 대상: 하이브리드 경로', cfg:'privnat', nodes:['privnat','rtnat']},
      {t:'내부 패스스루 NLB', d:'100.64.21.0/24에 전달 규칙', cfg:'lb', nodes:['nlb']},
      {t:'방화벽', d:'백엔드 ← 사내 대역 (패스스루는 원래 출발지 유지)', cfg:'firewall', nodes:['app']}
    ],
    azure: [
      {t:'허브 VNet 100.64.30.0/24 + ER 게이트웨이', d:'', cfg:'hubnet', nodes:['rt','tgw']},
      {t:'스포크 피어링 (원격 게이트웨이 사용 끔)', d:'겹치는 대역이 광고되지 않음', cfg:'peering', nodes:['nr','adv']},
      {t:'Azure Firewall + SNAT 사설 대역 설정', d:'사설 목적지도 항상 SNAT', cfg:'privnat', nodes:['privnat','rtnat']},
      {t:'스포크 UDR', d:'172.16/12 → 방화벽', cfg:'route', nodes:['rtapp']},
      {t:'Private Link 서비스 + 허브 Private Endpoint', d:'사내 → 앱 입구', cfg:'privsvc', nodes:['pls','nlb']}
    ]
  },

  map: ['dedicated-link','route-table','private-endpoint'],

  decisions: [
    {t:'나가는 통신의 주소를 어디서 바꾸는가',
     p:'겹치는 대역이 사내로 나가지 않도록 출발지를 바꿔야 합니다.',
     aws:'사설 NAT 게이트웨이가 관리형으로 제공됩니다. 보조 CIDR 서브넷에 두고 라우팅만 잡으면 됩니다.',
     gcp:'Cloud Router에 붙는 Private NAT(하이브리드 NAT)로 Interconnect·VPN 너머 대상의 출발지를 바꿉니다. 기능 범위는 문서로 확인합니다.',
     azure:'ExpressRoute에는 관리형 NAT가 없습니다. 허브의 Azure Firewall이나 NVA가 SNAT합니다. VPN이라면 VPN Gateway NAT 규칙을 쓸 수 있습니다.',
     so:'Azure는 방화벽 비용과 SNAT 사설 대역 설정이 추가로 필요합니다.'},
    {t:'겹치는 대역이 사내로 광고되지 않게 하는 방법',
     p:'한 번이라도 광고되면 사내 라우터가 지사 대역과 혼동해 지사 통신까지 끊길 수 있습니다.',
     aws:'DX 게이트웨이 연결의 허용 접두사를 출입문 대역으로 제한하고, TGW에는 VPC 연결 전파(모든 CIDR이 전파됨) 대신 출입문 대역 정적 경로를 둡니다.',
     gcp:'Cloud Router 맞춤 광고에서 서브넷 전체 광고를 빼고 출입문 대역만 넣습니다.',
     azure:'ER 게이트웨이는 VNet 주소 공간을 그대로 광고하므로 겹치는 대역은 별도 스포크로 두고 게이트웨이 전송을 쓰지 않습니다.',
     so:'사내 라우터에도 받는 접두사 필터를 두어 이중으로 막습니다.'},
    {t:'들어오는 통신은 무엇으로 받는가',
     p:'NAT는 안에서 시작한 연결만 처리합니다.',
     aws:'출입문 대역의 내부 NLB(IP 대상)나 ALB가 받아 겹치는 대역의 앱으로 넘깁니다.',
     gcp:'출입문 서브넷의 내부 LB나 PSC 엔드포인트로 받습니다.',
     azure:'허브의 Private Endpoint → 스포크의 Private Link 서비스로 받습니다.',
     so:'세 클라우드 모두 "겹치지 않는 주소를 가진 입구"를 둡니다. 대상이 많아지면 re-IP 일정을 당기는 것이 운영상 이득입니다.'}
  ],

  iac: 'iac/scenario-24',
  checklist: [
    ['겹치는 대역을 한 번이라도 광고한다','사내 지사 경로와 충돌해 지사 통신이 끊길 수 있습니다.'],
    ['사설 NAT로 겹치는 목적지에 닿을 거라 기대한다','목적지가 VPC 자기 대역이면 VPC를 떠나지 않습니다.'],
    ['Azure Firewall 기본 SNAT 설정을 그대로 둔다','사설 대역 목적지는 SNAT되지 않아 겹치는 출발지가 그대로 나갑니다.'],
    ['사내 ERP 방화벽에 NAT 주소를 등록하지 않는다','출발지가 출입문 대역으로 바뀌었다는 것을 사내 팀과 공유합니다.'],
    ['re-IP 계획 없이 NAT를 늘린다','임시 구조가 영구 구조가 됩니다.']
  ],
  refs: [
    ['AWS: 사설 NAT 게이트웨이로 겹치는 네트워크 연결','https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateway-scenarios.html'],
    ['Google Cloud: Private NAT','https://cloud.google.com/nat/docs/private-nat'],
    ['Azure: Azure Firewall SNAT 사설 IP 범위','https://learn.microsoft.com/azure/firewall/snat-private-range'],
    ['Azure: VPN Gateway NAT','https://learn.microsoft.com/azure/vpn-gateway/nat-overview']
  ],
  next: '시나리오 25 · 전용선 하나로 여러 리전·여러 VPC 연결'
};
