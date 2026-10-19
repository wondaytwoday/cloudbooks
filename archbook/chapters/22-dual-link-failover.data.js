window.SCENARIO = {
  no: 22, level: 'hybrid', title: '전용선 이중화와 장애 전환',
  lede: '사내 IDC 두 곳에서 각각 전용선을 하나씩 넣고, 인터넷 VPN을 마지막 백업으로 둡니다. 회선을 여러 개 넣는 것보다 어려운 것은 "평소에 어느 회선을 타고, 하나가 죽으면 어디로 넘어가며, 갈 때와 올 때가 같은 길인가"를 BGP 속성으로 맞추는 일입니다. 사내 → 클라우드 방향은 사내 라우터가, 클라우드 → 사내 방향은 클라우드가 정하므로 두 방향을 따로 설정해야 합니다.',
  region: {aws:'Direct Connect 위치 2곳 + Site-to-Site VPN', gcp:'Interconnect 엣지 도메인 2개 + HA VPN', azure:'ExpressRoute 피어링 위치 2곳 + VPN Gateway'},
  req: [
    {k:'회선', v:'전용선 2 (IDC 1·2) + VPN', s:'서로 다른 위치·사업자'},
    {k:'평시', v:'전용선 1로 양방향', s:'전용선 2는 대기'},
    {k:'전환', v:'1분 안에 자동', s:'BGP 기본 타이머로는 부족'},
    {k:'사내 장비', v:'상태 저장 방화벽', s:'비대칭 경로면 연결이 끊김'}
  ],
  intro: {
    arch: '<b>비대칭 경로</b>를 골라 보세요. 사내에서는 전용선 1을 선호하게 했지만 클라우드 쪽 우선순위를 맞추지 않아 응답이 전용선 2로 돌아오고, 사내 방화벽이 그 응답을 버립니다.'
  },

  diagram: {
    aws: { w: 700, h: 540, aria: 'AWS: 사내 라우터 2대, Direct Connect 2개와 VPN, DX 게이트웨이와 Transit Gateway',
      frames: [
        {id:'corp', kind:'onprem', x:14, y:14, w:672, h:126, label:'사내 IDC 1 · IDC 2 (192.168.0.0/16)'},
        {id:'cloud', kind:'region', x:14, y:270, w:672, h:256, label:'ap-northeast-2'}
      ],
      nodes: [
        {id:'cpe1', x:30, y:40, w:190, h:44, icon:'router', t:'사내 라우터 A', s:'IDC 1', cfg:'bgppref'},
        {id:'erp', x:255, y:40, w:190, h:44, icon:'vm', t:'사내 ERP', s:'192.168.20.10'},
        {id:'cpe2', x:480, y:40, w:190, h:44, icon:'router', t:'사내 라우터 B', s:'IDC 2', cfg:'bgppref'},
        {id:'corpfw', kind:'chip', x:255, y:100, t:'사내 방화벽 (상태 저장)', cfg:'firewall'},
        {id:'dx1', x:30, y:168, w:190, h:44, icon:'dedicated', t:'전용선 1 (주)', s:'DX 위치 A · 10G', cfg:'dedicated'},
        {id:'vpn', x:255, y:168, w:190, h:44, icon:'vpn', t:'VPN (최종 백업)', s:'TGW VPN 연결', cfg:'vpn'},
        {id:'dx2', x:480, y:168, w:190, h:44, icon:'dedicated', t:'전용선 2 (예비)', s:'DX 위치 B · 10G', cfg:'dedicated'},
        {id:'pref1', kind:'chip', x:30, y:224, t:'local-pref 200 · 7224:7300', cfg:'bgppref', why:'사내 → AWS는 사내 라우터의 local-preference가, AWS → 사내는 사내가 광고에 붙인 로컬 선호 커뮤니티(7224:7300 높음)가 정합니다.'},
        {id:'vpref', kind:'chip', x:255, y:224, t:'같은 접두사면 DX가 VPN보다 우선', cfg:'bgppref'},
        {id:'pref2', kind:'chip', x:480, y:224, t:'local-pref 100 · 7224:7100', cfg:'bgppref'},
        {id:'gw', x:255, y:300, w:190, h:42, icon:'router', t:'DX 게이트웨이', s:'전역 · 두 VIF가 연결', kind:'reg', cfg:'dedicated'},
        {id:'bfd', kind:'chip', x:480, y:312, t:'BFD 켬: 1초 안에 감지', cfg:'bgppref'},
        {id:'tgw', x:255, y:372, w:190, h:42, icon:'router', t:'Transit Gateway', s:'DXGW · VPN 연결', kind:'reg', cfg:'hubnet'},
        {id:'tgwrt', kind:'chip', x:30, y:384, t:'tgw-rt: 192.168/16 → DXGW 우선', cfg:'hubnet'},
        {id:'app', x:255, y:450, w:190, h:44, icon:'vm', t:'클라우드 앱', s:'vpc-app 10.20.0.0/16', cfg:'vmgroup'}
      ],
      edges: [{a:'cpe1', b:'dx1'}, {a:'cpe2', b:'dx2'}, {a:'erp', b:'vpn', dash:true}, {a:'dx1', b:'gw'}, {a:'dx2', b:'gw'}, {a:'gw', b:'tgw'}, {a:'vpn', b:'tgw', dash:true}, {a:'tgw', b:'app'}]
    },

    gcp: { w: 700, h: 540, aria: 'GCP: 사내 라우터 2대, 엣지 도메인이 다른 Interconnect VLAN 연결 2개와 HA VPN, Cloud Router',
      frames: [
        {id:'corp', kind:'onprem', x:14, y:14, w:672, h:126, label:'사내 IDC 1 · IDC 2 (192.168.0.0/16)'},
        {id:'cloud', kind:'net', x:14, y:270, w:672, h:256, label:'vpc-app · 전역 동적 라우팅', cfg:'vpc'}
      ],
      nodes: [
        {id:'cpe1', x:30, y:40, w:190, h:44, icon:'router', t:'사내 라우터 A', s:'IDC 1', cfg:'bgppref'},
        {id:'erp', x:255, y:40, w:190, h:44, icon:'vm', t:'사내 ERP', s:'192.168.20.10'},
        {id:'cpe2', x:480, y:40, w:190, h:44, icon:'router', t:'사내 라우터 B', s:'IDC 2', cfg:'bgppref'},
        {id:'corpfw', kind:'chip', x:255, y:100, t:'사내 방화벽 (상태 저장)', cfg:'firewall'},
        {id:'dx1', x:30, y:168, w:190, h:44, icon:'dedicated', t:'Interconnect 1 (주)', s:'엣지 도메인 1', cfg:'dedicated'},
        {id:'vpn', x:255, y:168, w:190, h:44, icon:'vpn', t:'HA VPN (최종 백업)', s:'터널 2개', cfg:'vpn'},
        {id:'dx2', x:480, y:168, w:190, h:44, icon:'dedicated', t:'Interconnect 2 (예비)', s:'엣지 도메인 2', cfg:'dedicated'},
        {id:'pref1', kind:'chip', x:30, y:224, t:'광고 우선순위 100 · 받는 MED 100', cfg:'bgppref', why:'GCP → 사내 방향은 이 BGP 피어의 광고 경로 우선순위(MED)가, 사내 → GCP 방향은 사내가 보낸 MED가 VPC 동적 경로 우선순위가 됩니다.'},
        {id:'vpref', kind:'chip', x:255, y:224, t:'VPN 피어 우선순위 1000', cfg:'bgppref'},
        {id:'pref2', kind:'chip', x:480, y:224, t:'광고 우선순위 200 · 받는 MED 200', cfg:'bgppref'},
        {id:'gw', x:255, y:300, w:190, h:42, icon:'router', t:'Cloud Router', s:'VLAN 연결 2 + VPN 터널 2', kind:'reg', cfg:'bgppref'},
        {id:'bfd', kind:'chip', x:480, y:312, t:'BFD 켬', cfg:'bgppref'},
        {id:'tgw', x:255, y:372, w:190, h:42, icon:'net', t:'VPC 동적 경로', s:'우선순위 낮은 값이 선택', kind:'ghost', cfg:'route'},
        {id:'tgwrt', kind:'chip', x:30, y:384, t:'192.168/16: IC1(100) > IC2(200) > VPN', cfg:'route'},
        {id:'app', x:255, y:450, w:190, h:44, icon:'vm', t:'클라우드 앱', s:'subnet-app 10.20.10.0/24', cfg:'vmgroup'}
      ],
      edges: [{a:'cpe1', b:'dx1'}, {a:'cpe2', b:'dx2'}, {a:'erp', b:'vpn', dash:true}, {a:'dx1', b:'gw'}, {a:'dx2', b:'gw'}, {a:'vpn', b:'gw', dash:true}, {a:'gw', b:'tgw'}, {a:'tgw', b:'app'}]
    },

    azure: { w: 700, h: 540, aria: 'Azure: 사내 라우터 2대, ExpressRoute 회선 2개와 VPN, 같은 GatewaySubnet의 ExpressRoute·VPN 게이트웨이',
      frames: [
        {id:'corp', kind:'onprem', x:14, y:14, w:672, h:126, label:'사내 IDC 1 · IDC 2 (192.168.0.0/16)'},
        {id:'cloud', kind:'net', x:14, y:270, w:672, h:256, label:'vnet-hub 10.0.0.0/16 · GatewaySubnet', cfg:'vpc'}
      ],
      nodes: [
        {id:'cpe1', x:30, y:40, w:190, h:44, icon:'router', t:'사내 라우터 A', s:'IDC 1', cfg:'bgppref'},
        {id:'erp', x:255, y:40, w:190, h:44, icon:'vm', t:'사내 ERP', s:'192.168.20.10'},
        {id:'cpe2', x:480, y:40, w:190, h:44, icon:'router', t:'사내 라우터 B', s:'IDC 2', cfg:'bgppref'},
        {id:'corpfw', kind:'chip', x:255, y:100, t:'사내 방화벽 (상태 저장)', cfg:'firewall'},
        {id:'dx1', x:30, y:168, w:190, h:44, icon:'dedicated', t:'ExpressRoute 1 (주)', s:'Seoul · 주·보조 연결', cfg:'dedicated'},
        {id:'vpn', x:255, y:168, w:190, h:44, icon:'vpn', t:'VPN (최종 백업)', s:'액티브-액티브', cfg:'vpn'},
        {id:'dx2', x:480, y:168, w:190, h:44, icon:'dedicated', t:'ExpressRoute 2 (예비)', s:'Busan · 주·보조 연결', cfg:'dedicated'},
        {id:'pref1', kind:'chip', x:30, y:224, t:'연결 가중치 100 · local-pref 200', cfg:'bgppref', why:'Azure → 사내 방향은 게이트웨이 연결의 라우팅 가중치(높을수록 선호)로, 사내 → Azure 방향은 사내 라우터의 local-preference로 정합니다.'},
        {id:'vpref', kind:'chip', x:255, y:224, t:'같은 접두사면 ER이 VPN보다 우선', cfg:'bgppref'},
        {id:'pref2', kind:'chip', x:480, y:224, t:'연결 가중치 0 · local-pref 100', cfg:'bgppref'},
        {id:'gw', x:255, y:300, w:190, h:42, icon:'router', t:'ExpressRoute 게이트웨이', s:'ErGw2AZ · 회선 2개 연결', kind:'reg', cfg:'dedicated'},
        {id:'bfd', kind:'chip', x:480, y:312, t:'BFD: Microsoft 쪽 기본 사용', cfg:'bgppref'},
        {id:'tgw', x:255, y:372, w:190, h:42, icon:'vpn', t:'VPN Gateway', s:'같은 GatewaySubnet에 공존', kind:'reg', cfg:'vpn'},
        {id:'tgwrt', kind:'chip', x:30, y:384, t:'유효 경로: 192.168/16 → ER (가중치)', cfg:'route'},
        {id:'app', x:255, y:450, w:190, h:44, icon:'vm', t:'클라우드 앱', s:'스포크 VNet (원격 게이트웨이 사용)', cfg:'vmgroup'}
      ],
      edges: [{a:'cpe1', b:'dx1'}, {a:'cpe2', b:'dx2'}, {a:'erp', b:'vpn', dash:true}, {a:'dx1', b:'gw'}, {a:'dx2', b:'gw'}, {a:'vpn', b:'tgw', dash:true}, {a:'gw', b:'app'}, {a:'tgw', b:'app', dash:true}]
    }
  },

  flows: [
    {id:'normal', t:'평시: 사내 ERP ↔ 클라우드 앱',
     d:'두 방향 모두 전용선 1을 탑니다.',
     hops:{
      aws:[{n:'erp', t:'사내 ERP', r:'10.20.0.0/16으로'},
           {n:'cpe1', t:'사내 라우터 A', r:'전용선 1로 받은 경로의 local-pref 200 → 선택', cfg:'bgppref'},
           {n:'dx1', t:'전용선 1', r:'전송 VIF', cfg:'dedicated'},
           {n:'gw', t:'DX 게이트웨이', r:'', cfg:'dedicated'},
           {n:'tgw', t:'Transit Gateway', r:'', cfg:'hubnet'},
           {n:'app', t:'클라우드 앱', r:'응답: TGW → DXGW → 커뮤니티 7224:7300이 붙은 전용선 1 경로 선택 (대칭)'}],
      gcp:[{n:'erp', t:'사내 ERP', r:''},
           {n:'cpe1', t:'사내 라우터 A', r:'local-pref로 Interconnect 1 선택', cfg:'bgppref'},
           {n:'dx1', t:'Interconnect 1', r:'VLAN 연결', cfg:'dedicated'},
           {n:'gw', t:'Cloud Router', r:'', cfg:'bgppref'},
           {n:'app', t:'클라우드 앱', r:'응답: VPC 동적 경로 192.168/16 중 우선순위 100(사내가 MED 100으로 보낸 Interconnect 1) 선택 (대칭)'}],
      azure:[{n:'erp', t:'사내 ERP', r:''},
           {n:'cpe1', t:'사내 라우터 A', r:'local-pref로 ER 1 선택', cfg:'bgppref'},
           {n:'dx1', t:'ExpressRoute 1', r:'주·보조 연결 중 하나 (둘 다 활성)', cfg:'dedicated'},
           {n:'gw', t:'ExpressRoute 게이트웨이', r:'', cfg:'dedicated'},
           {n:'app', t:'클라우드 앱', r:'응답: 연결 가중치 100인 ER 1 경로 선택 (대칭)'}]
     }},
    {id:'fail1', t:'전용선 1 장애: 전용선 2로 전환',
     d:'IDC 1 쪽 회선이 끊겼습니다.',
     hops:{
      aws:[{n:'erp', t:'사내 ERP', r:''},
           {n:'cpe1', t:'사내 라우터 A', r:'BFD가 1초 안에 BGP 세션 다운 감지, 전용선 1 경로 철회', cfg:'bgppref'},
           {n:'cpe2', t:'사내 라우터 B', r:'iBGP로 받은 전용선 2 경로(local-pref 100)가 유일한 경로', cfg:'bgppref'},
           {n:'dx2', t:'전용선 2', r:'', cfg:'dedicated'},
           {n:'gw', t:'DX 게이트웨이', r:'', cfg:'dedicated'},
           {n:'tgw', t:'Transit Gateway', r:'', cfg:'hubnet'},
           {n:'app', t:'클라우드 앱', r:'응답: 전용선 1 경로가 사라져 7224:7100 전용선 2로 (대칭 유지)'}],
      gcp:[{n:'erp', t:'사내 ERP', r:''},
           {n:'cpe1', t:'사내 라우터 A', r:'BFD로 감지, 경로 철회', cfg:'bgppref'},
           {n:'cpe2', t:'사내 라우터 B', r:'Interconnect 2 경로 사용', cfg:'bgppref'},
           {n:'dx2', t:'Interconnect 2', r:'', cfg:'dedicated'},
           {n:'gw', t:'Cloud Router', r:'Interconnect 1 피어 다운 → 동적 경로 제거', cfg:'bgppref'},
           {n:'app', t:'클라우드 앱', r:'응답: 남은 우선순위 200 경로로'}],
      azure:[{n:'erp', t:'사내 ERP', r:''},
           {n:'cpe1', t:'사내 라우터 A', r:'ER 1 주·보조 연결이 모두 끊김', cfg:'bgppref'},
           {n:'cpe2', t:'사내 라우터 B', r:'ER 2 경로 사용', cfg:'bgppref'},
           {n:'dx2', t:'ExpressRoute 2', r:'', cfg:'dedicated'},
           {n:'gw', t:'ExpressRoute 게이트웨이', r:'가중치 0인 ER 2 연결이 남은 경로', cfg:'dedicated'},
           {n:'app', t:'클라우드 앱', r:''}]
     },
     note:'두 전용선이 같은 건물·같은 사업자 관로를 지나면 함께 끊깁니다. 위치와 사업자를 분리해야 이중화입니다.'},
    {id:'vpn', t:'전용선 둘 다 장애: VPN으로 전환',
     d:'두 IDC의 전용선이 모두 끊겼습니다. 인터넷 VPN이 남았습니다.',
     hops:{
      aws:[{n:'erp', t:'사내 ERP', r:''},
           {n:'vpn', t:'Site-to-Site VPN', r:'DX 경로가 모두 사라져 TGW VPN 연결의 BGP 경로가 선택됨', cfg:'vpn'},
           {n:'tgw', t:'Transit Gateway', r:'tgw-rt에서 VPN 연결 경로만 남음', cfg:'hubnet'},
           {n:'app', t:'클라우드 앱', r:'터널당 처리량 한도가 있어 ECMP로 터널 여러 개를 묶어도 전용선 용량을 대신하지 못함'}],
      gcp:[{n:'erp', t:'사내 ERP', r:''},
           {n:'vpn', t:'HA VPN', r:'우선순위 1000 경로가 유일하게 남음', cfg:'vpn'},
           {n:'gw', t:'Cloud Router', r:'', cfg:'bgppref'},
           {n:'app', t:'클라우드 앱', r:'터널당 처리량 한도 확인'}],
      azure:[{n:'erp', t:'사내 ERP', r:''},
           {n:'vpn', t:'VPN', r:'', cfg:'vpn'},
           {n:'tgw', t:'VPN Gateway', r:'ER 경로가 없어 VPN 경로가 선택됨', cfg:'vpn'},
           {n:'app', t:'클라우드 앱', r:'SKU별 처리량 한도 확인'}]
     },
     note:'VPN은 "끊기지 않게"까지만 책임집니다. 장애 시 우선할 업무 트래픽을 미리 정하고, 대용량 배치는 멈추는 런북을 둡니다.'},
    {id:'asym', t:'비대칭 경로 (설정 실수)',
     d:'사내에서는 전용선 1을 선호하게 했지만, 클라우드 → 사내 방향 우선순위를 맞추지 않았습니다.',
     hops:{
      aws:[{n:'erp', t:'사내 ERP → 클라우드', r:'요청 시작'},
           {n:'cpe1', t:'사내 라우터 A', r:'local-pref 200으로 전용선 1 선택. 사내 방화벽(IDC 1)이 세션을 기록', cfg:'bgppref'},
           {n:'dx1', t:'전용선 1', r:'요청은 정상 도착', cfg:'dedicated'},
           {n:'gw', t:'DX 게이트웨이', r:'', cfg:'dedicated'},
           {n:'app', t:'클라우드 앱 → 사내 (응답)', r:'커뮤니티를 붙이지 않아 두 경로의 조건이 같음 → AWS가 두 회선에 나눠 보내 일부 응답이 전용선 2로'},
           {n:'tgw', t:'Transit Gateway', r:'', cfg:'hubnet'},
           {n:'gw', t:'DX 게이트웨이', r:'', cfg:'dedicated'},
           {n:'dx2', t:'전용선 2', r:'', cfg:'dedicated'},
           {n:'cpe2', t:'사내 라우터 B', r:'', cfg:'bgppref'},
           {n:'corpfw', t:'사내 방화벽', r:'IDC 1 방화벽이 연 세션의 응답이 IDC 2로 들어옴 → 모르는 세션이라 버림', cfg:'firewall', ok:false}],
      gcp:[{n:'erp', t:'사내 ERP → 클라우드', r:'요청 시작'},
           {n:'cpe1', t:'사내 라우터 A', r:'local-pref로 Interconnect 1', cfg:'bgppref'},
           {n:'dx1', t:'Interconnect 1', r:'', cfg:'dedicated'},
           {n:'gw', t:'Cloud Router', r:'', cfg:'bgppref'},
           {n:'app', t:'클라우드 앱 → 사내 (응답)', r:'사내가 두 회선에 같은 MED를 보내 ECMP로 나뉨'},
           {n:'gw', t:'Cloud Router', r:'', cfg:'bgppref'},
           {n:'dx2', t:'Interconnect 2', r:'', cfg:'dedicated'},
           {n:'cpe2', t:'사내 라우터 B', r:'', cfg:'bgppref'},
           {n:'corpfw', t:'사내 방화벽', r:'일부 응답이 다른 IDC로 들어와 버려짐', cfg:'firewall', ok:false}],
      azure:[{n:'erp', t:'사내 ERP → Azure', r:'요청 시작'},
           {n:'cpe1', t:'사내 라우터 A', r:'local-pref로 ER 1', cfg:'bgppref'},
           {n:'dx1', t:'ExpressRoute 1', r:'', cfg:'dedicated'},
           {n:'gw', t:'ExpressRoute 게이트웨이', r:'', cfg:'dedicated'},
           {n:'app', t:'클라우드 앱 → 사내 (응답)', r:'두 연결의 가중치가 같아 ECMP로 나뉨'},
           {n:'gw', t:'ExpressRoute 게이트웨이', r:'', cfg:'dedicated'},
           {n:'dx2', t:'ExpressRoute 2', r:'', cfg:'dedicated'},
           {n:'cpe2', t:'사내 라우터 B', r:'', cfg:'bgppref'},
           {n:'corpfw', t:'사내 방화벽', r:'다른 IDC로 돌아온 응답을 버림', cfg:'firewall', ok:false}]
     },
     note:{aws:'사내 → AWS는 local-pref, AWS → 사내는 로컬 선호 커뮤니티. 두 방향을 같은 회선으로 맞춥니다.', gcp:'GCP → 사내는 Cloud Router 광고 우선순위가 아니라, 사내가 보낸 MED가 VPC 경로 우선순위를 정합니다. 사내 라우터에서 회선별로 다른 MED를 보내야 합니다.', azure:'Azure → 사내 방향은 연결 가중치로 고정합니다. 회선 내 주·보조 연결은 원래 둘 다 쓰이므로 같은 IDC의 라우터 두 대가 받도록 설계합니다.'}}
  ],

  scope: ['dedicated','vpn','bgppref','route'],
  build: {
    aws: [
      {t:'전용 연결 2개 (다른 위치)', d:'LOA-CFA로 교차 연결', cfg:'dedicated', nodes:['dx1','dx2']},
      {t:'DX 게이트웨이 + 전송 VIF 2개', d:'BFD 켜기', cfg:'dedicated', nodes:['gw','bfd']},
      {t:'DXGW ↔ TGW 연결', d:'허용 접두사 10.20.0.0/16', cfg:'hubnet', nodes:['tgw']},
      {t:'TGW VPN 연결', d:'고객 게이트웨이, 터널 2개', cfg:'vpn', nodes:['vpn']},
      {t:'사내 라우터 BGP 정책', d:'local-pref 200/100, 커뮤니티 7224:7300/7100', cfg:'bgppref', nodes:['cpe1','cpe2','pref1','pref2']},
      {t:'전환 시험', d:'VIF BGP를 내려 실제 전환 시간 측정', cfg:'bgppref', nodes:['dx1']}
    ],
    gcp: [
      {t:'Interconnect 2개 (엣지 도메인 1·2)', d:'99.99% 구성은 리전 2곳·연결 4개', cfg:'dedicated', nodes:['dx1','dx2']},
      {t:'Cloud Router + VLAN 연결 2개', d:'BGP 피어마다 광고 우선순위·BFD', cfg:'bgppref', nodes:['gw','pref1','pref2','bfd']},
      {t:'HA VPN + 터널 2개', d:'같은 Cloud Router에 피어 추가, 우선순위 1000', cfg:'vpn', nodes:['vpn','vpref']},
      {t:'사내 라우터 BGP 정책', d:'회선별 MED 100/200, local-pref', cfg:'bgppref', nodes:['cpe1','cpe2']},
      {t:'VPC 동적 경로 확인', d:'gcloud compute routers get-status', cfg:'route', nodes:['tgw','tgwrt'], auto:true}
    ],
    azure: [
      {t:'ExpressRoute 회선 2개 (다른 피어링 위치)', d:'', cfg:'dedicated', nodes:['dx1','dx2']},
      {t:'GatewaySubnet + ER 게이트웨이', d:'영역 중복 SKU', cfg:'dedicated', nodes:['gw']},
      {t:'연결 2개 + 라우팅 가중치', d:'ER 1: 100, ER 2: 0', cfg:'bgppref', nodes:['pref1','pref2']},
      {t:'VPN Gateway (같은 GatewaySubnet)', d:'액티브-액티브, BGP', cfg:'vpn', nodes:['tgw','vpn']},
      {t:'사내 라우터 BGP 정책', d:'local-pref, 주·보조 연결 모두 수신', cfg:'bgppref', nodes:['cpe1','cpe2']}
    ]
  },

  map: ['dedicated-link','site-vpn','network-hub'],

  decisions: [
    {t:'클라우드 → 사내 방향의 주 회선은 무엇으로 정하는가',
     p:'사내 → 클라우드 방향은 어디서나 사내 라우터의 local-preference입니다. 반대 방향이 클라우드마다 다릅니다.',
     aws:'사내가 광고하는 경로에 로컬 선호 BGP 커뮤니티(7224:7300·7200·7100)를 붙입니다. 그다음 AS 경로 길이가 비교됩니다.',
     gcp:'사내가 보내는 MED가 VPC 동적 경로 우선순위가 됩니다. Cloud Router의 광고 우선순위는 반대 방향(GCP → 사내 광고)의 MED입니다.',
     azure:'ExpressRoute 게이트웨이 연결의 라우팅 가중치로 정합니다. AS 경로 앞붙이기도 쓸 수 있습니다.',
     so:'세 클라우드 모두 "클라우드 쪽 설정 + 사내 라우터 설정"이 짝으로 맞아야 대칭이 됩니다.'},
    {t:'장애 감지를 무엇으로 빠르게 하는가',
     p:'BGP 기본 타이머로는 장애 감지에 수십 초~수 분이 걸립니다.',
     aws:'가상 인터페이스에서 비동기 BFD를 켜고, 사내 라우터도 BFD를 설정합니다.',
     gcp:'Cloud Router BGP 피어에서 BFD를 켭니다.',
     azure:'ExpressRoute는 Microsoft 쪽에서 BFD를 지원하므로 사내 라우터에서 BFD를 켭니다.',
     so:'전환 시간은 문서 값이 아니라 실제 회선을 내려 보고 잽니다.'},
    {t:'VPN은 같은 게이트웨이에 붙이는가',
     p:'전용선과 VPN이 같은 대역을 광고할 때 어느 쪽이 우선하는지, 어디에 붙는지가 다릅니다.',
     aws:'TGW에 DXGW 연결과 VPN 연결을 함께 둡니다. 같은 접두사면 DX 쪽 경로가 VPN보다 우선합니다.',
     gcp:'같은 Cloud Router에 VLAN 연결 피어와 VPN 피어를 두고 우선순위로 정합니다.',
     azure:'같은 GatewaySubnet에 ER 게이트웨이와 VPN 게이트웨이를 함께 둡니다. 같은 접두사면 ER이 우선합니다.',
     so:'VPN에서 더 구체적인 접두사를 광고하면 전용선보다 VPN이 선택됩니다. 광고 접두사를 맞춥니다.'}
  ],

  iac: 'iac/scenario-22',
  checklist: [
    ['두 회선이 같은 건물·관로를 지난다','위치·사업자를 분리하지 않으면 한 번에 끊깁니다.'],
    ['클라우드 → 사내 방향 우선순위를 안 맞춘다','비대칭 경로로 상태 저장 방화벽이 응답을 버립니다.'],
    ['BFD를 켜지 않는다','장애 감지에 수십 초 이상 걸립니다.'],
    ['VPN에서 더 구체적인 경로를 광고한다','평시에도 VPN으로 흐릅니다.'],
    ['전환 시험을 하지 않는다','실제 전환 시간과 영향받는 세션을 모른 채 운영합니다.'],
    ['VPN 대역폭을 계산하지 않는다','전용선 장애 때 VPN이 포화되어 사실상 장애가 됩니다.']
  ],
  refs: [
    ['AWS: Direct Connect 라우팅 정책과 BGP 커뮤니티','https://docs.aws.amazon.com/directconnect/latest/UserGuide/routing-and-bgp.html'],
    ['AWS: Direct Connect 복원력 권장 사항','https://aws.amazon.com/directconnect/resiliency-recommendation/'],
    ['Google Cloud: Cloud Router 경로 우선순위','https://cloud.google.com/network-connectivity/docs/router/concepts/overview'],
    ['Google Cloud: Interconnect 99.99% 토폴로지','https://cloud.google.com/network-connectivity/docs/interconnect/tutorials/dedicated-creating-9999-availability'],
    ['Azure: ExpressRoute 라우팅 최적화','https://learn.microsoft.com/azure/expressroute/expressroute-optimize-routing'],
    ['Azure: ExpressRoute와 VPN 공존','https://learn.microsoft.com/azure/expressroute/expressroute-howto-coexist-resource-manager']
  ],
  next: '시나리오 23 · 사내 서버가 전용선으로 관리형 서비스 쓰기'
};
