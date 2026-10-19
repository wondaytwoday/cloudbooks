window.SCENARIO = {
  no: 26, level: 'hybrid', title: '전용선 구간 암호화',
  lede: '금융 규정 때문에 "전용선이라도 데이터는 암호화해서 보내야 한다"는 요구가 왔습니다. 전용선은 인터넷이 아닐 뿐, 그 자체로 암호화되지는 않습니다. 방법은 두 가지입니다. 사내 라우터와 클라우드 장비 사이의 링크를 MACsec으로 암호화하거나, 전용선 위에 IPsec 터널을 올리는 것입니다. 각 방법을 쓸 수 있는 회선 종류, 암호화되는 구간, 처리량 한도가 클라우드마다 다릅니다.',
  region: {aws:'Direct Connect 전용 연결 10G', gcp:'Dedicated Interconnect 10G', azure:'ExpressRoute Direct 10G'},
  req: [
    {k:'규정', v:'전송 구간 암호화', s:'사업자 회선·교차 연결 구간 포함'},
    {k:'회선', v:'전용 10Gbps', s:'사업자 호스팅 회선이면 선택지가 줄어듦'},
    {k:'처리량', v:'평시 3Gbps', s:'암호화로 대역이 줄면 안 됨'},
    {k:'사내 장비', v:'MACsec 지원 라우터', s:'교체 여부 검토'}
  ],
  intro: {
    arch: '세 가지 경로를 비교해 보세요. <b>MACsec</b>은 사내 라우터와 클라우드 쪽 첫 장비 사이 링크를, <b>전용선 위 IPsec</b>은 사내 장비부터 클라우드 VPN 게이트웨이까지를 암호화합니다.'
  },

  diagram: {
    aws: { w: 700, h: 520, aria: 'AWS: MACsec을 켠 Direct Connect 전용 연결, 전송 VIF, Transit Gateway의 사설 IP VPN 연결',
      frames: [
        {id:'corp', kind:'onprem', x:14, y:14, w:672, h:96, label:'사내 IDC'},
        {id:'loc', kind:'plain', x:14, y:126, w:672, h:92, label:'Direct Connect 위치 (교차 연결)'},
        {id:'cloud', kind:'region', x:14, y:236, w:672, h:270, label:'ap-northeast-2'}
      ],
      nodes: [
        {id:'srv', x:30, y:42, w:200, h:44, icon:'vm', t:'사내 계정계', s:'192.168.40.0/24'},
        {id:'cpe', x:470, y:42, w:200, h:44, icon:'router', t:'사내 라우터', s:'MACsec · IPsec 지원', cfg:'macsec'},
        {id:'mac', kind:'chip', x:30, y:160, t:'MACsec: 사내 라우터 ↔ AWS 장비 링크 (CKN/CAK)', cfg:'macsec', why:'전용 연결 포트에서 MACsec을 켜고 키를 연결에 붙입니다. 사업자 회선·교차 연결 구간을 회선 속도 그대로 암호화합니다.'},
        {id:'dx', x:470, y:152, w:200, h:44, icon:'dedicated', t:'전용 연결 10G', s:'MACsec 지원 포트', cfg:'dedicated'},
        {id:'vif', x:470, y:264, w:200, h:42, icon:'dedicated', t:'전송 VIF', s:'DX 게이트웨이', kind:'reg', cfg:'dedicated'},
        {id:'pvpn', x:240, y:330, w:210, h:44, icon:'vpn', t:'TGW 사설 IP VPN', s:'전용선 위 IPsec 터널', cfg:'macsec', why:'바깥 주소가 사설 IP인 Site-to-Site VPN을 TGW에 만들고, 전송 VIF 경로 위로 터널을 맺습니다. 종단 간 IPsec이지만 터널당 처리량 한도가 있습니다.'},
        {id:'tgw', x:470, y:330, w:200, h:44, icon:'router', t:'Transit Gateway', s:'DXGW 연결 + VPN 연결', kind:'reg', cfg:'hubnet'},
        {id:'ecmp', kind:'chip', x:240, y:388, t:'터널 여러 개 + ECMP로 처리량 확보', cfg:'vpn'},
        {id:'app', x:470, y:430, w:200, h:44, icon:'vm', t:'클라우드 계정계', s:'10.20.0.0/16', cfg:'vmgroup'}
      ],
      edges: [{a:'cpe', b:'dx'}, {a:'dx', b:'vif'}, {a:'vif', b:'tgw'}, {a:'tgw', b:'app'}, {a:'pvpn', b:'tgw', dash:'both'}]
    },

    gcp: { w: 700, h: 520, aria: 'GCP: MACsec을 켠 Dedicated Interconnect, IPsec 암호화 VLAN 연결 위의 HA VPN, Cloud Router',
      frames: [
        {id:'corp', kind:'onprem', x:14, y:14, w:672, h:96, label:'사내 IDC'},
        {id:'loc', kind:'plain', x:14, y:126, w:672, h:92, label:'코로케이션 시설 (교차 연결)'},
        {id:'cloud', kind:'net', x:14, y:236, w:672, h:270, label:'vpc-core', cfg:'vpc'}
      ],
      nodes: [
        {id:'srv', x:30, y:42, w:200, h:44, icon:'vm', t:'사내 계정계', s:'192.168.40.0/24'},
        {id:'cpe', x:470, y:42, w:200, h:44, icon:'router', t:'사내 라우터', s:'MACsec · IPsec 지원', cfg:'macsec'},
        {id:'mac', kind:'chip', x:30, y:160, t:'MACsec for Cloud Interconnect (사전 공유 키)', cfg:'macsec'},
        {id:'dx', x:470, y:152, w:200, h:44, icon:'dedicated', t:'Dedicated Interconnect', s:'MACsec 켬', cfg:'dedicated'},
        {id:'vif', x:470, y:264, w:200, h:42, icon:'dedicated', t:'VLAN 연결 (암호화: IPSEC)', s:'HA VPN 전용', kind:'reg', cfg:'macsec'},
        {id:'pvpn', x:240, y:330, w:210, h:44, icon:'vpn', t:'HA VPN over Interconnect', s:'VLAN 연결 위 IPsec', cfg:'macsec', why:'IPsec 암호화용으로 만든 VLAN 연결에 HA VPN 게이트웨이를 붙여, 인터넷이 아니라 Interconnect 위로 터널을 맺습니다.'},
        {id:'tgw', x:470, y:330, w:200, h:44, icon:'router', t:'Cloud Router', s:'VPN 터널 BGP', kind:'reg', cfg:'bgppref'},
        {id:'ecmp', kind:'chip', x:240, y:388, t:'터널 수만큼 처리량 분산', cfg:'vpn'},
        {id:'app', x:470, y:430, w:200, h:44, icon:'vm', t:'클라우드 계정계', s:'10.20.0.0/16', cfg:'vmgroup'}
      ],
      edges: [{a:'cpe', b:'dx'}, {a:'dx', b:'vif'}, {a:'vif', b:'tgw'}, {a:'tgw', b:'app'}, {a:'pvpn', b:'tgw', dash:'both'}]
    },

    azure: { w: 700, h: 520, aria: 'Azure: MACsec을 켠 ExpressRoute Direct 포트, 프라이빗 피어링 위 사설 IP VPN Gateway',
      frames: [
        {id:'corp', kind:'onprem', x:14, y:14, w:672, h:96, label:'사내 IDC'},
        {id:'loc', kind:'plain', x:14, y:126, w:672, h:92, label:'피어링 위치 (ExpressRoute Direct 포트)'},
        {id:'cloud', kind:'net', x:14, y:236, w:672, h:270, label:'vnet-hub · GatewaySubnet', cfg:'vpc'}
      ],
      nodes: [
        {id:'srv', x:30, y:42, w:200, h:44, icon:'vm', t:'사내 계정계', s:'192.168.40.0/24'},
        {id:'cpe', x:470, y:42, w:200, h:44, icon:'router', t:'사내 라우터', s:'MACsec · IPsec 지원', cfg:'macsec'},
        {id:'mac', kind:'chip', x:30, y:160, t:'MACsec: Direct 포트 (키는 Key Vault)', cfg:'macsec'},
        {id:'dx', x:470, y:152, w:200, h:44, icon:'dedicated', t:'ExpressRoute Direct 10G', s:'MACsec 켬', cfg:'dedicated'},
        {id:'vif', x:470, y:264, w:200, h:42, icon:'dedicated', t:'ER 게이트웨이', s:'프라이빗 피어링', kind:'reg', cfg:'dedicated'},
        {id:'pvpn', x:240, y:330, w:210, h:44, icon:'vpn', t:'VPN Gateway (사설 IP)', s:'ER 위 IPsec 터널', cfg:'macsec', why:'VPN Gateway에서 사설 IP를 켜면 ExpressRoute 프라이빗 피어링 경로 위로 IPsec 터널을 맺을 수 있습니다. 사내에서 VPN 쪽 경로를 우선하게 해야 터널로 흐릅니다.'},
        {id:'tgw', x:470, y:330, w:200, h:44, icon:'router', t:'허브 라우팅', s:'VPN 경로 우선', kind:'reg', cfg:'route'},
        {id:'ecmp', kind:'chip', x:240, y:388, t:'SKU별 처리량 한도', cfg:'vpn'},
        {id:'app', x:470, y:430, w:200, h:44, icon:'vm', t:'클라우드 계정계', s:'10.20.0.0/16', cfg:'vmgroup'}
      ],
      edges: [{a:'cpe', b:'dx'}, {a:'dx', b:'vif'}, {a:'vif', b:'tgw'}, {a:'tgw', b:'app'}, {a:'pvpn', b:'tgw', dash:'both'}]
    }
  },

  flows: [
    {id:'macsec', t:'MACsec: 링크 구간 암호화',
     d:'사내 라우터와 클라우드 쪽 첫 장비 사이를 회선 속도로 암호화합니다.',
     hops:{
      aws:[{n:'srv', t:'사내 계정계', r:''},{n:'cpe', t:'사내 라우터', r:'MACsec 키(CKN/CAK)로 프레임 암호화', cfg:'macsec'},{n:'mac', t:'MACsec 구간', r:'사업자 회선·교차 연결은 암호문', cfg:'macsec'},{n:'dx', t:'전용 연결 (MACsec 포트)', r:'AWS 장비에서 복호화', cfg:'dedicated'},{n:'vif', t:'전송 VIF', r:'이후는 AWS 백본', cfg:'dedicated'},{n:'tgw', t:'Transit Gateway', r:'', cfg:'hubnet'},{n:'app', t:'클라우드 계정계', r:''}],
      gcp:[{n:'srv', t:'사내 계정계', r:''},{n:'cpe', t:'사내 라우터', r:'MACsec 사전 공유 키', cfg:'macsec'},{n:'mac', t:'MACsec 구간', r:'', cfg:'macsec'},{n:'dx', t:'Dedicated Interconnect', r:'Google 엣지 장비에서 복호화', cfg:'dedicated'},{n:'tgw', t:'Cloud Router', r:'일반 VLAN 연결 경로', cfg:'bgppref'},{n:'app', t:'클라우드 계정계', r:''}],
      azure:[{n:'srv', t:'사내 계정계', r:''},{n:'cpe', t:'사내 라우터', r:'MACsec 키', cfg:'macsec'},{n:'mac', t:'MACsec 구간', r:'', cfg:'macsec'},{n:'dx', t:'ExpressRoute Direct', r:'Microsoft 엣지 라우터에서 복호화', cfg:'dedicated'},{n:'vif', t:'ER 게이트웨이', r:'', cfg:'dedicated'},{n:'app', t:'클라우드 계정계', r:''}]
     },
     note:'처리량 손실이 거의 없지만 전용 포트(10G·100G 등)와 MACsec 지원 장비가 필요하고, 암호화 구간은 첫 장비까지입니다. 사업자 호스팅 회선(Partner)은 대개 쓸 수 없습니다.'},
    {id:'ipsec', t:'전용선 위 IPsec: 종단 간 암호화',
     d:'사내 장비에서 클라우드 VPN 게이트웨이까지 IPsec 터널을 맺고, 그 터널이 전용선을 지나갑니다.',
     hops:{
      aws:[{n:'srv', t:'사내 계정계', r:''},{n:'cpe', t:'사내 라우터 (IPsec 종단)', r:'바깥 주소: TGW VPN의 사설 IP', cfg:'macsec'},{n:'dx', t:'전용 연결', r:'IPsec 패킷이 평문 회선을 지나도 내용은 암호문', cfg:'dedicated'},{n:'vif', t:'전송 VIF', r:'', cfg:'dedicated'},{n:'pvpn', t:'TGW 사설 IP VPN', r:'여기서 복호화', cfg:'macsec'},{n:'tgw', t:'Transit Gateway', r:'VPN 연결 경로가 우선하도록 사내 광고·정적 경로 조정', cfg:'hubnet'},{n:'app', t:'클라우드 계정계', r:''}],
      gcp:[{n:'srv', t:'사내 계정계', r:''},{n:'cpe', t:'사내 라우터 (IPsec 종단)', r:'', cfg:'macsec'},{n:'dx', t:'Interconnect', r:'', cfg:'dedicated'},{n:'vif', t:'VLAN 연결 (IPSEC 암호화용)', r:'이 연결에는 VPN 트래픽만', cfg:'macsec'},{n:'pvpn', t:'HA VPN over Interconnect', r:'여기서 복호화', cfg:'macsec'},{n:'tgw', t:'Cloud Router', r:'터널 BGP로 경로 교환', cfg:'bgppref'},{n:'app', t:'클라우드 계정계', r:''}],
      azure:[{n:'srv', t:'사내 계정계', r:''},{n:'cpe', t:'사내 라우터 (IPsec 종단)', r:'바깥 주소: VPN Gateway 사설 IP', cfg:'macsec'},{n:'dx', t:'ExpressRoute', r:'', cfg:'dedicated'},{n:'vif', t:'ER 게이트웨이', r:'', cfg:'dedicated'},{n:'pvpn', t:'VPN Gateway (사설 IP)', r:'여기서 복호화', cfg:'macsec'},{n:'tgw', t:'허브 라우팅', r:'같은 접두사면 ER이 우선하므로, 터널로 보낼 대역은 VPN으로만 광고하거나 더 구체적으로', cfg:'route'},{n:'app', t:'클라우드 계정계', r:''}]
     },
     note:'사업자 회선에서도 쓸 수 있고 종단 간이지만, 터널당 처리량 한도 때문에 터널을 여러 개 묶어야 하고 VPN 게이트웨이 비용이 더해집니다.'},
    {id:'plain', t:'전용선 그대로 (암호화 없음)',
     d:'아무것도 하지 않은 기본 상태입니다.',
     hops:{
      aws:[{n:'srv', t:'사내 계정계', r:''},{n:'cpe', t:'사내 라우터', r:'', cfg:'bgppref'},{n:'dx', t:'Direct Connect', r:'기본은 평문 전송. 교차 연결·사업자 구간에서 내용 노출 가능 → 규정 위반', cfg:'dedicated', ok:false},{n:'app', t:'클라우드 계정계', r:''}],
      gcp:[{n:'srv', t:'사내 계정계', r:''},{n:'cpe', t:'사내 라우터', r:'', cfg:'bgppref'},{n:'dx', t:'Interconnect', r:'기본은 평문 → 규정 위반', cfg:'dedicated', ok:false},{n:'app', t:'클라우드 계정계', r:''}],
      azure:[{n:'srv', t:'사내 계정계', r:''},{n:'cpe', t:'사내 라우터', r:'', cfg:'bgppref'},{n:'dx', t:'ExpressRoute', r:'기본은 평문 → 규정 위반', cfg:'dedicated', ok:false},{n:'app', t:'클라우드 계정계', r:''}]
     },
     note:'애플리케이션 계층 TLS(DB 연결 SSL, HTTPS)로 요구를 충족하는 경우도 많습니다. 규정 문구가 "전송 구간"인지 "네트워크 계층"인지 먼저 확인합니다.'}
  ],

  scope: ['macsec','dedicated','vpn','bgppref'],
  build: {
    aws: [
      {t:'MACsec 지원 위치·포트 확인', d:'전용 연결 10G 이상', cfg:'macsec', nodes:['dx']},
      {t:'MACsec 키 연결', d:'CKN/CAK, 암호화 모드 must_encrypt', cfg:'macsec', nodes:['mac','cpe']},
      {t:'(대안) TGW 사설 IP VPN', d:'전송 VIF 위, 바깥 주소 사설 IP', cfg:'macsec', nodes:['pvpn']},
      {t:'라우팅 우선순위', d:'암호화 경로가 선택되게', cfg:'bgppref', nodes:['tgw']}
    ],
    gcp: [
      {t:'Interconnect MACsec 켜기', d:'사전 공유 키, 사내 라우터 동일 키', cfg:'macsec', nodes:['dx','mac']},
      {t:'(대안) 암호화 VLAN 연결', d:'encryption = IPSEC', cfg:'macsec', nodes:['vif']},
      {t:'(대안) HA VPN over Interconnect', d:'VLAN 연결 지정, 터널 BGP', cfg:'macsec', nodes:['pvpn','tgw']}
    ],
    azure: [
      {t:'ExpressRoute Direct 포트 + MACsec', d:'Key Vault 키, 관리 ID 권한', cfg:'macsec', nodes:['dx','mac']},
      {t:'(대안) 사설 IP VPN Gateway', d:'ER 위 IPsec', cfg:'macsec', nodes:['pvpn']},
      {t:'경로 조정', d:'터널 대상 대역은 VPN으로 광고', cfg:'route', nodes:['tgw']}
    ]
  },

  map: ['dedicated-link','site-vpn'],

  decisions: [
    {t:'MACsec인가 IPsec인가',
     p:'둘 다 "전용선 암호화"지만 보호 구간과 비용 구조가 다릅니다.',
     aws:'MACsec은 지원 위치의 전용 연결(10G 이상)에서만. IPsec은 TGW 사설 IP VPN으로 어떤 회선에서도 가능하지만 터널당 처리량 한도가 있습니다.',
     gcp:'MACsec은 Dedicated Interconnect에서. IPsec은 HA VPN over Interconnect로 암호화 전용 VLAN 연결 위에 올립니다.',
     azure:'MACsec은 ExpressRoute Direct 포트에서만. IPsec은 사설 IP VPN Gateway를 ER 위로 연결합니다.',
     so:'대역이 크고 전용 포트를 쓴다면 MACsec, 사업자 회선이거나 종단 간 암호화가 필요하면 IPsec입니다.'},
    {t:'IPsec 터널로 트래픽을 어떻게 보내는가',
     p:'전용선 경로와 VPN 터널 경로가 동시에 존재하므로 어느 쪽이 쓰이는지 정해야 합니다.',
     aws:'TGW에서 같은 접두사면 DXGW 경로가 VPN보다 우선합니다. 암호화할 대역은 VPN으로만 광고하거나 더 구체적인 접두사를 씁니다.',
     gcp:'암호화용 VLAN 연결에는 VPN 트래픽만 흐르므로, 평문 VLAN 연결을 따로 두지 않으면 자연히 터널로 갑니다.',
     azure:'같은 접두사면 ER이 VPN보다 우선합니다. AWS와 같은 방식으로 광고를 조정합니다.',
     so:'GCP는 암호화 전용 연결로 구조적으로 분리되고, AWS·Azure는 경로 우선순위로 분리합니다.'},
    {t:'규정이 정말 요구하는 것은 무엇인가',
     p:'네트워크 암호화는 비용과 처리량을 씁니다.',
     aws:'애플리케이션 TLS로 충분하다면 전용선 암호화를 생략할 수 있습니다.',
     gcp:'같습니다. Cloud SQL·Cloud Storage는 전송 중 TLS가 기본입니다.',
     azure:'같습니다. 스토리지·DB는 최소 TLS 버전을 강제할 수 있습니다.',
     so:'규정 해석을 보안·법무와 먼저 맞추고, 필요한 계층만 암호화합니다.'}
  ],

  iac: 'iac/scenario-26',
  checklist: [
    ['전용선은 원래 암호화된다고 생각한다','기본은 평문입니다.'],
    ['사업자 호스팅 회선에서 MACsec을 계획한다','대개 쓸 수 없습니다. IPsec을 검토합니다.'],
    ['IPsec 터널 하나로 전용선 대역을 기대한다','터널당 한도가 있어 여러 터널을 묶어야 합니다.'],
    ['AWS·Azure에서 VPN 경로가 실제로 선택되는지 확인하지 않는다','같은 접두사면 전용선 경로가 이겨 평문으로 흐릅니다.'],
    ['MACsec 키 교체 절차가 없다','키 만료 때 링크가 끊길 수 있습니다. 키 롤오버를 연습합니다.']
  ],
  refs: [
    ['AWS: Direct Connect MACsec','https://docs.aws.amazon.com/directconnect/latest/UserGuide/MACsec.html'],
    ['AWS: 사설 IP VPN over Direct Connect','https://docs.aws.amazon.com/vpn/latest/s2svpn/private-ip-dx.html'],
    ['Google Cloud: MACsec for Cloud Interconnect','https://cloud.google.com/network-connectivity/docs/interconnect/concepts/macsec-overview'],
    ['Google Cloud: HA VPN over Cloud Interconnect','https://cloud.google.com/network-connectivity/docs/interconnect/concepts/ha-vpn-interconnect'],
    ['Azure: ExpressRoute Direct MACsec','https://learn.microsoft.com/azure/expressroute/expressroute-howto-macsec'],
    ['Azure: ExpressRoute 위 사설 IP VPN','https://learn.microsoft.com/azure/vpn-gateway/site-to-site-vpn-private-peering']
  ],
  next: '시나리오 01부터 다시 읽으며 각 장의 사내 연결을 이 파트의 방법으로 바꿔 보세요'
};
