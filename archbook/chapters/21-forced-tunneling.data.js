window.SCENARIO = {
  no: 21, level: 'hybrid', title: '사내 방화벽으로 인터넷 출구 통합',
  lede: '보안팀이 "클라우드 서버도 인터넷에 나갈 때는 사내 방화벽과 프록시를 거쳐야 한다"고 정했습니다. 사내 라우터가 전용선으로 0.0.0.0/0을 광고하고, 클라우드는 그 경로를 따라 모든 인터넷 트래픽을 사내로 보냅니다(강제 터널링). 경로 하나를 받는 일이지만 세 클라우드에서 기본 인터넷 경로와의 우선순위, 관리형 서비스로 가는 트래픽, 예외가 필요한 서브넷이 모두 다르게 처리됩니다.',
  region: {aws:'서울 리전 · Direct Connect', gcp:'서울 리전 · Dedicated Interconnect', azure:'Korea Central · ExpressRoute'},
  req: [
    {k:'정책', v:'인터넷 출구는 사내 방화벽 하나', s:'로그·DLP·URL 필터링 일원화'},
    {k:'연결', v:'전용선 + VPN 백업', s:'둘 다 0.0.0.0/0 광고'},
    {k:'예외', v:'클라우드 관리형 서비스', s:'사내를 돌아가지 않고 클라우드 안에서'},
    {k:'공개 서비스', v:'일부 웹은 인터넷에서 직접 받음', s:'응답이 사내로 새지 않게'}
  ],
  intro: {
    arch: '<b>앱 서버 → 인터넷</b>을 고르면 패킷이 전용선을 타고 사내 방화벽까지 갔다가 나가는 것이 보입니다. <b>앱 서버 → 오브젝트 스토리지</b>는 경로 하나를 빠뜨리면 이것까지 사내로 끌려갑니다.'
  },

  diagram: {
    aws: { w: 700, h: 560, aria: 'AWS: 사내 라우터가 Direct Connect로 0.0.0.0/0을 광고, TGW와 VPC 라우팅이 그 경로로 인터넷 트래픽을 보냄, S3 게이트웨이 엔드포인트 예외',
      frames: [
        {id:'corp', kind:'onprem', x:220, y:14, w:466, h:110, label:'사내 IDC 192.168.0.0/16'},
        {id:'cloud', kind:'region', x:14, y:220, w:672, h:326, label:'ap-northeast-2'},
        {id:'vpc', kind:'net', x:26, y:310, w:420, h:224, label:'vpc-app 10.20.0.0/16 · IGW·NAT 없음', cfg:'vpc'}
      ],
      nodes: [
        {id:'inet', x:14, y:40, w:190, h:44, t:'인터넷', s:'SaaS · 패키지 저장소', kind:'alt'},
        {id:'corpfw', x:236, y:46, w:200, h:44, icon:'fw', t:'사내 방화벽·프록시', s:'SNAT: 사내 공인 IP', kind:'reg'},
        {id:'cpe', x:470, y:46, w:200, h:44, icon:'router', t:'사내 라우터', s:'BGP로 0.0.0.0/0 광고', cfg:'bgppref'},
        {id:'adv', kind:'chip', x:236, y:156, t:'광고: 0.0.0.0/0 (전용선·VPN 모두)', cfg:'bgppref'},
        {id:'dx', x:470, y:144, w:200, h:42, icon:'dedicated', t:'Direct Connect', s:'전송 VIF · DXGW', cfg:'dedicated'},
        {id:'tgw', x:470, y:250, w:200, h:42, icon:'router', t:'Transit Gateway', s:'DXGW 연결', kind:'reg', cfg:'hubnet'},
        {id:'tgwrt', kind:'chip', x:236, y:262, t:'tgw-rt: 0.0.0.0/0 → DXGW (전파)', cfg:'hubnet', why:'사내가 광고한 0.0.0.0/0이 DXGW 연결을 통해 TGW 라우팅 테이블로 전파됩니다.'},
        {id:'vm', x:40, y:346, w:190, h:44, icon:'vm', t:'앱 서버', s:'10.20.10.x', cfg:'vmgroup'},
        {id:'rt', kind:'chip', x:240, y:358, t:'rt-app: 0/0 → tgw', cfg:'route', why:'VPC 라우팅 테이블에는 BGP 경로가 자동으로 들어오지 않습니다. 0.0.0.0/0 → TGW를 직접 넣습니다.'},
        {id:'s3rt', kind:'chip', x:240, y:384, t:'S3 접두사 → vpce (더 구체적)', cfg:'route'},
        {id:'s3ep', x:40, y:440, w:190, h:44, icon:'privlink', t:'S3 게이트웨이 엔드포인트', s:'사내를 거치지 않음', cfg:'privlink'},
        {id:'ifep', kind:'chip', x:40, y:500, t:'인터페이스 엔드포인트: ssm · logs', cfg:'privlink', why:'AWS API도 공인 주소라 0/0을 따라 사내로 갑니다. 자주 쓰는 서비스는 인터페이스 엔드포인트로 클라우드 안에서 처리합니다.'},
        {id:'s3', x:470, y:440, w:200, h:44, icon:'obj', t:'S3', s:'리전 서비스', kind:'alt', cfg:'bucket'}
      ],
      edges: [{a:'cpe', b:'dx'}, {a:'dx', b:'tgw'}, {a:'corpfw', b:'inet'}, {a:'s3ep', b:'s3', dash:true}]
    },

    gcp: { w: 700, h: 560, aria: 'GCP: Cloud Router가 사내에서 0.0.0.0/0을 배우고 기본 인터넷 경로를 지운 VPC, Google API 전용 정적 경로',
      frames: [
        {id:'corp', kind:'onprem', x:220, y:14, w:466, h:110, label:'사내 IDC 192.168.0.0/16'},
        {id:'cloud', kind:'net', x:14, y:220, w:672, h:326, label:'vpc-app · 전역', cfg:'vpc'},
        {id:'vpc', kind:'plain', x:26, y:310, w:420, h:224, label:'subnet-app 10.20.10.0/24 · 비공개 Google 액세스', cfg:'subnet'}
      ],
      nodes: [
        {id:'inet', x:14, y:40, w:190, h:44, t:'인터넷', s:'SaaS · 패키지 저장소', kind:'alt'},
        {id:'corpfw', x:236, y:46, w:200, h:44, icon:'fw', t:'사내 방화벽·프록시', s:'SNAT: 사내 공인 IP', kind:'reg'},
        {id:'cpe', x:470, y:46, w:200, h:44, icon:'router', t:'사내 라우터', s:'BGP로 0.0.0.0/0 광고', cfg:'bgppref'},
        {id:'adv', kind:'chip', x:236, y:156, t:'광고: 0.0.0.0/0 (MED 100)', cfg:'bgppref'},
        {id:'dx', x:470, y:144, w:200, h:42, icon:'dedicated', t:'Dedicated Interconnect', s:'VLAN 연결 × 2', cfg:'dedicated'},
        {id:'tgw', x:470, y:250, w:200, h:42, icon:'router', t:'Cloud Router', s:'0/0 동적 경로 학습', kind:'reg', cfg:'bgppref'},
        {id:'tgwrt', kind:'chip', x:236, y:262, t:'기본 인터넷 경로(0/0) 삭제', cfg:'route', why:'VPC를 만들 때 생긴 0.0.0.0/0 → default-internet-gateway 경로가 남아 있으면 사내에서 받은 0/0과 경쟁합니다. 지우거나 동적 경로보다 낮은 우선순위로 바꿉니다.'},
        {id:'vm', x:40, y:346, w:190, h:44, icon:'vm', t:'앱 서버', s:'외부 IP 없음', cfg:'vmgroup'},
        {id:'rt', kind:'chip', x:240, y:358, t:'동적 경로 0/0 → Interconnect', cfg:'route'},
        {id:'s3rt', kind:'chip', x:240, y:384, t:'정적 199.36.153.8/30 → 기본 게이트웨이', cfg:'route', why:'private.googleapis.com 대역만 기본 인터넷 게이트웨이로 보내는 정적 경로입니다. 기본 경로를 지웠으므로 이 경로가 없으면 Google API도 사내로 끌려갑니다.'},
        {id:'s3ep', x:40, y:440, w:190, h:44, icon:'privlink', t:'비공개 Google 액세스', s:'private.googleapis.com', cfg:'privlink'},
        {id:'ifep', kind:'chip', x:240, y:410, t:'DNS: *.googleapis.com → private', cfg:'dns', why:'googleapis.com 비공개 영역에서 모든 API 이름을 private.googleapis.com(199.36.153.8/30)으로 풀어야 위의 정적 경로를 탑니다.'},
        {id:'s3', x:470, y:440, w:200, h:44, icon:'obj', t:'Cloud Storage', s:'Google API', kind:'alt', cfg:'bucket'}
      ],
      edges: [{a:'cpe', b:'dx'}, {a:'dx', b:'tgw'}, {a:'corpfw', b:'inet'}, {a:'s3ep', b:'s3', dash:true}]
    },

    azure: { w: 700, h: 560, aria: 'Azure: ExpressRoute로 0.0.0.0/0을 받아 모든 서브넷에 전파, Application Gateway 서브넷은 UDR로 예외, 스토리지는 Private Endpoint',
      frames: [
        {id:'corp', kind:'onprem', x:220, y:14, w:466, h:110, label:'사내 IDC 192.168.0.0/16'},
        {id:'cloud', kind:'net', x:14, y:220, w:672, h:326, label:'vnet-app 10.20.0.0/16', cfg:'vpc'},
        {id:'vpc', kind:'plain', x:26, y:310, w:420, h:110, label:'snet-app · 게이트웨이 경로 전파 켬', cfg:'subnet'},
        {id:'agws', kind:'plain', x:26, y:428, w:420, h:106, label:'snet-agw · 게이트웨이 경로 전파 끔', cfg:'subnet'}
      ],
      nodes: [
        {id:'inet', x:14, y:40, w:190, h:44, t:'인터넷', s:'SaaS · 패키지 · 웹 사용자', kind:'alt'},
        {id:'corpfw', x:236, y:46, w:200, h:44, icon:'fw', t:'사내 방화벽·프록시', s:'SNAT: 사내 공인 IP', kind:'reg'},
        {id:'cpe', x:470, y:46, w:200, h:44, icon:'router', t:'사내 라우터', s:'BGP로 0.0.0.0/0 광고', cfg:'bgppref'},
        {id:'adv', kind:'chip', x:236, y:156, t:'광고: 0.0.0.0/0 (ER·VPN 모두)', cfg:'bgppref'},
        {id:'dx', x:470, y:144, w:200, h:42, icon:'dedicated', t:'ExpressRoute', s:'프라이빗 피어링', cfg:'dedicated'},
        {id:'tgw', x:470, y:250, w:200, h:42, icon:'router', t:'ExpressRoute 게이트웨이', s:'BGP 경로를 서브넷에 전파', kind:'reg', cfg:'dedicated'},
        {id:'tgwrt', kind:'chip', x:236, y:262, t:'유효 경로: 0/0 → 가상 네트워크 게이트웨이', cfg:'route', why:'BGP로 받은 0.0.0.0/0이 시스템 경로 0/0 → Internet을 대체합니다. 라우팅 테이블을 만들지 않아도 모든 서브넷에 적용됩니다.'},
        {id:'vm', x:40, y:340, w:190, h:44, icon:'vm', t:'앱 서버', s:'10.20.10.x', cfg:'vmgroup'},
        {id:'rt', kind:'chip', x:240, y:352, t:'PE /32 경로: 스토리지는 VNet 안', cfg:'privlink'},
        {id:'s3ep', x:240, y:380, w:190, h:32, icon:'privlink', t:'PE: 스토리지', cfg:'privlink'},
        {id:'agw', x:40, y:456, w:190, h:44, icon:'lb', t:'Application Gateway', s:'공인 IP · 공개 웹', kind:'reg', cfg:'lb'},
        {id:'rtagw', kind:'chip', x:240, y:468, t:'UDR: 0/0 → Internet (예외)', cfg:'route', why:'공개 웹의 응답과 게이트웨이 관리 트래픽이 사내로 끌려가면 비대칭 경로로 끊깁니다. 이 서브넷만 게이트웨이 경로 전파를 끄고 0/0 → Internet UDR을 둡니다.'},
        {id:'s3', x:470, y:380, w:200, h:44, icon:'obj', t:'스토리지 계정', s:'공용 접근 끔', kind:'alt', cfg:'bucket'}
      ],
      edges: [{a:'cpe', b:'dx'}, {a:'dx', b:'tgw'}, {a:'corpfw', b:'inet'}, {a:'s3ep', b:'s3', dash:true}]
    }
  },

  flows: [
    {id:'out', t:'앱 서버 → 인터넷 (SaaS API)',
     d:'앱 서버가 외부 SaaS API를 부릅니다. 사내 방화벽을 거쳐 나가야 합니다.',
     hops:{
      aws:[{n:'vm', t:'앱 서버', r:'보안 그룹 아웃바운드 허용', cfg:'firewall'},
           {n:'rt', t:'rt-app', r:'0.0.0.0/0 → TGW', cfg:'route'},
           {n:'tgwrt', t:'TGW 라우팅 테이블', r:'0.0.0.0/0 → DXGW 연결 (사내에서 BGP로 받음)', cfg:'hubnet'},
           {n:'dx', t:'Direct Connect', r:'전송 VIF', cfg:'dedicated'},
           {n:'cpe', t:'사내 라우터', r:'방화벽으로 전달', cfg:'bgppref'},
           {n:'corpfw', t:'사내 방화벽·프록시', r:'URL 정책 검사, 사내 공인 IP로 SNAT'},
           {n:'inet', t:'SaaS API', r:'응답은 같은 경로로 되돌아옴'}],
      gcp:[{n:'vm', t:'앱 서버', r:'이그레스 허용', cfg:'firewall'},
           {n:'rt', t:'VPC 경로', r:'0.0.0.0/0 동적 경로 (기본 인터넷 경로는 삭제됨)', cfg:'route'},
           {n:'tgw', t:'Cloud Router', r:'Interconnect VLAN 연결로', cfg:'bgppref'},
           {n:'dx', t:'Interconnect', r:'', cfg:'dedicated'},
           {n:'cpe', t:'사내 라우터', r:'', cfg:'bgppref'},
           {n:'corpfw', t:'사내 방화벽·프록시', r:'SNAT 후 인터넷으로'},
           {n:'inet', t:'SaaS API', r:''}],
      azure:[{n:'vm', t:'앱 서버', r:'NSG 아웃바운드 허용', cfg:'firewall'},
           {n:'tgwrt', t:'유효 경로', r:'0.0.0.0/0 → 가상 네트워크 게이트웨이 (BGP)', cfg:'route'},
           {n:'tgw', t:'ExpressRoute 게이트웨이', r:'', cfg:'dedicated'},
           {n:'dx', t:'ExpressRoute', r:'프라이빗 피어링', cfg:'dedicated'},
           {n:'cpe', t:'사내 라우터', r:'', cfg:'bgppref'},
           {n:'corpfw', t:'사내 방화벽·프록시', r:'SNAT 후 인터넷으로'},
           {n:'inet', t:'SaaS API', r:''}]
     },
     note:'클라우드의 인터넷 트래픽이 전용선 대역폭을 씁니다. 전용선 용량 계획에 이 트래픽을 넣고, 클라우드 → 사내 방향 전송 요금도 계산합니다.'},
    {id:'obj', t:'앱 서버 → 오브젝트 스토리지',
     d:'같은 리전의 스토리지에 백업을 씁니다. 사내를 돌아가면 느리고 전용선이 막힙니다.',
     hops:{
      aws:[{n:'vm', t:'앱 서버', r:'s3.ap-northeast-2.amazonaws.com'},
           {n:'s3rt', t:'rt-app', r:'S3 접두사 목록(/18 등)이 0.0.0.0/0보다 구체적 → 게이트웨이 엔드포인트', cfg:'route'},
           {n:'s3ep', t:'S3 게이트웨이 엔드포인트', r:'사내를 거치지 않음', cfg:'privlink'},
           {n:'s3', t:'S3', r:'', cfg:'bucket'}],
      gcp:[{n:'vm', t:'앱 서버', r:'storage.googleapis.com 질의'},
           {n:'ifep', t:'Cloud DNS 비공개 영역', r:'*.googleapis.com → private.googleapis.com (199.36.153.8/30)', cfg:'dns'},
           {n:'s3rt', t:'정적 경로', r:'199.36.153.8/30 → default-internet-gateway. 0/0 동적 경로보다 구체적', cfg:'route'},
           {n:'s3ep', t:'비공개 Google 액세스', r:'', cfg:'privlink'},
           {n:'s3', t:'Cloud Storage', r:'', cfg:'bucket'}],
      azure:[{n:'vm', t:'앱 서버', r:'privatelink DNS로 PE IP를 받음'},
           {n:'rt', t:'유효 경로', r:'Private Endpoint IP의 /32 경로가 0/0보다 구체적', cfg:'privlink'},
           {n:'s3ep', t:'PE: 스토리지', r:'', cfg:'privlink'},
           {n:'s3', t:'스토리지 계정', r:'', cfg:'bucket'}]
     },
     note:{aws:'인터페이스 엔드포인트가 없는 AWS 서비스(공인 엔드포인트)는 모두 사내로 갑니다. 사내 프록시가 AWS 도메인을 허용해야 합니다.', gcp:'정적 경로나 DNS 중 하나라도 빠지면 Google API 호출이 사내로 갑니다. 사내 방화벽이 막으면 GKE 노드 등록, 이미지 다운로드가 줄줄이 실패합니다.', azure:'Private Endpoint가 없는 PaaS를 공용 이름으로 부르면 사내로 갑니다. 서비스 엔드포인트도 0/0 강제 터널과 무관하게 Azure 백본으로 보내 줍니다.'}},
    {id:'web', t:'인터넷 사용자 → 공개 웹 (응답 경로)', only:['azure'],
     d:'Application Gateway가 받은 요청의 응답이 어디로 나가는지 봅니다.',
     hops:{
      azure:[{n:'inet', t:'인터넷 사용자', r:'AppGW 공인 IP로 요청'},
           {n:'agw', t:'Application Gateway', r:'', cfg:'lb'},
           {n:'rtagw', t:'snet-agw 라우팅', r:'게이트웨이 전파 끔 + 0/0 → Internet UDR. 응답이 같은 길로 나감', cfg:'route'},
           {n:'inet', t:'인터넷 사용자', r:'대칭 경로'}]
     },
     note:'이 예외가 없으면 응답이 사내 방화벽으로 가서 비대칭으로 버려지고, 게이트웨이 관리 트래픽도 끊깁니다. Bastion·Application Gateway 같은 서비스 서브넷은 강제 터널링 예외를 먼저 정리합니다.'},
    {id:'web2', t:'공개 웹은 어떻게 하나', only:['aws','gcp'],
     d:'인터넷에서 직접 받는 웹을 같은 네트워크에 둘 때입니다.',
     hops:{
      aws:[{n:'inet', t:'인터넷 사용자', r:''},
           {n:'vpc', t:'vpc-app', r:'IGW가 없으므로 공개 ALB를 둘 수 없음. 공개 웹은 IGW가 있는 별도 VPC(엣지 VPC)에 두고 TGW로 앱에 연결', cfg:'vpc', ok:false}],
      gcp:[{n:'inet', t:'인터넷 사용자', r:''},
           {t:'전역 외부 Application LB (VPC 밖)', r:'전역 LB는 VPC 밖 Google 엣지에서 응답하므로 VPC의 0/0 경로와 무관하게 동작. 헬스체크 대역용 경로는 특수 경로로 처리됨', cfg:'lb'},
           {n:'vm', t:'앱 서버 (백엔드)', r:'LB가 맺은 연결의 응답은 LB로 돌아감'}]
     },
     note:{aws:'0/0을 TGW로 보낸 VPC에서 공개 서비스를 섞으면 응답 경로가 꼬입니다. 엣지 VPC를 분리하는 것이 일반적입니다.', gcp:'프록시 기반 외부 LB는 강제 터널링과 함께 써도 응답이 사내로 새지 않습니다. 단, VM 외부 IP로 직접 받는 서비스는 응답이 0/0을 따라가므로 쓰지 않습니다.'}},
    {id:'down', t:'전용선·VPN 모두 장애 시 앱 서버 → 인터넷',
     d:'사내 쪽 연결이 모두 끊겼습니다.',
     hops:{
      aws:[{n:'vm', t:'앱 서버', r:''},
           {n:'rt', t:'rt-app', r:'0/0 → TGW는 정적이라 남아 있음', cfg:'route'},
           {n:'tgwrt', t:'TGW 라우팅 테이블', r:'BGP 세션이 끊겨 0/0 경로가 사라짐 → 블랙홀', cfg:'hubnet', ok:false},
           {n:'inet', t:'인터넷', r:''}],
      gcp:[{n:'vm', t:'앱 서버', r:''},
           {n:'rt', t:'VPC 경로', r:'동적 0/0이 사라지고 기본 인터넷 경로도 지웠으므로 갈 곳 없음', cfg:'route', ok:false},
           {n:'inet', t:'인터넷', r:''}],
      azure:[{n:'vm', t:'앱 서버', r:''},
           {n:'tgwrt', t:'유효 경로', r:'BGP 0/0이 사라지면 시스템 경로 0/0 → Internet이 다시 활성화됨', cfg:'route'},
           {n:'inet', t:'인터넷 (사내 방화벽 우회)', r:'NAT·공인 IP가 없으면 나가지 못하고, 있으면 정책 없이 직접 나감', ok:false}]
     },
     note:{aws:'정책상 "사내가 끊기면 인터넷도 끊긴다"가 의도인지 확인합니다. 대체 출구가 필요하면 클라우드에 방화벽을 둔 백업 경로를 설계합니다.', gcp:'의도한 차단이라면 그대로 두고, 아니라면 기본 경로를 지우는 대신 우선순위를 낮춰 백업으로 남깁니다(그러면 장애 시 정책 없이 나간다는 점을 감수).', azure:'Azure는 장애 시 조용히 시스템 경로로 돌아갑니다. 같은 접두사면 UDR이 BGP 경로보다 우선하므로 0/0 UDR을 그냥 넣으면 터널링 자체가 깨집니다. 닫힘을 원하면 사내에서 0.0.0.0/1과 128.0.0.0/1로 나눠 광고하고 앱 서브넷에 0/0 → None UDR을 둡니다. 연결이 살아 있으면 더 구체적인 BGP 경로가, 끊기면 UDR이 적용됩니다.'}}
  ],

  scope: ['bgppref','route','dedicated','privlink','dns'],
  build: {
    aws: [
      {t:'사내 라우터: 0/0 광고', d:'DX와 VPN 모두', cfg:'bgppref', nodes:['cpe','adv']},
      {t:'DXGW ↔ TGW 연결, 전파', d:'TGW 테이블에 0/0 전파 확인', cfg:'hubnet', nodes:['dx','tgw','tgwrt']},
      {t:'VPC에서 IGW·NAT 제거', d:'', cfg:'igw', nodes:['vpc']},
      {t:'rt-app: 0/0 → tgw', d:'BGP 경로는 VPC 라우팅 테이블로 자동 전파되지 않음', cfg:'route', nodes:['rt']},
      {t:'게이트웨이·인터페이스 엔드포인트', d:'S3, ssm, logs, ecr 등', cfg:'privlink', nodes:['s3ep','s3rt','ifep']},
      {t:'사내 프록시 허용 목록', d:'엔드포인트가 없는 AWS 서비스 도메인', cfg:'egressfw', nodes:['corpfw']}
    ],
    gcp: [
      {t:'사내 라우터: 0/0 광고', d:'MED로 주·예비 정하기', cfg:'bgppref', nodes:['cpe','adv']},
      {t:'기본 인터넷 경로 삭제', d:'또는 우선순위를 동적 경로보다 낮게', cfg:'route', nodes:['tgwrt']},
      {t:'정적 경로 199.36.153.8/30', d:'다음 홉 default-internet-gateway', cfg:'route', nodes:['s3rt']},
      {t:'googleapis.com 비공개 DNS 영역', d:'*.googleapis.com → private.googleapis.com', cfg:'dns', nodes:['ifep']},
      {t:'서브넷 비공개 Google 액세스', d:'', cfg:'privlink', nodes:['s3ep']}
    ],
    azure: [
      {t:'사내 라우터: 0/0 광고', d:'ER과 VPN 모두', cfg:'bgppref', nodes:['cpe','adv']},
      {t:'유효 경로 확인', d:'0/0 → 가상 네트워크 게이트웨이', cfg:'route', nodes:['tgwrt'], auto:true},
      {t:'예외 서브넷 UDR', d:'snet-agw·Bastion: 전파 끔 + 0/0 → Internet', cfg:'route', nodes:['rtagw','agws']},
      {t:'PaaS Private Endpoint', d:'스토리지·Key Vault 등', cfg:'privlink', nodes:['s3ep','rt']},
      {t:'장애 시 동작 정하기', d:'닫힘이 필요하면 /1 두 개로 광고 + 0/0 → None UDR', cfg:'route', nodes:['vpc']}
    ]
  },

  map: ['dedicated-link','route-table','private-endpoint','hybrid-dns'],

  decisions: [
    {t:'사내에서 받은 0/0이 기본 인터넷 경로를 이기는가',
     p:'같은 0.0.0.0/0이 두 개 생깁니다. 어느 쪽이 쓰이는지가 클라우드마다 다릅니다.',
     aws:'VPC에는 기본 인터넷 경로가 없습니다. 라우팅 테이블에 0/0 → TGW를 직접 넣어야 하고, TGW는 BGP로 받은 0/0을 씁니다.',
     gcp:'VPC에 기본 경로(0/0 → default-internet-gateway, 우선순위 1000)가 이미 있습니다. 지우거나 우선순위를 바꿔야 동적 경로가 확실히 쓰입니다.',
     azure:'BGP로 받은 0/0이 시스템 경로를 대체해 모든 서브넷에 자동 적용됩니다. 설정이 가장 짧지만 예외 서브넷을 따로 챙겨야 합니다.',
     so:'AWS는 "직접 넣어야 적용", GCP는 "기존 경로와 경쟁", Azure는 "자동 적용, 예외는 직접"입니다.'},
    {t:'클라우드 관리형 서비스는 어떻게 빼는가',
     p:'0/0을 사내로 보내면 클라우드 API 호출까지 사내로 갑니다.',
     aws:'S3·DynamoDB는 게이트웨이 엔드포인트(더 구체적인 접두사 경로), 나머지는 인터페이스 엔드포인트로 뺍니다.',
     gcp:'private.googleapis.com 정적 경로와 DNS로 Google API 전체를 한 번에 뺍니다.',
     azure:'Private Endpoint(/32 경로)나 서비스 엔드포인트로 뺍니다.',
     so:'빼지 않은 서비스 목록을 사내 프록시 허용 목록과 맞춰 둡니다.'},
    {t:'연결이 모두 끊기면 어떻게 되는가',
     p:'강제 터널링의 장애 동작은 정책 문제입니다.',
     aws:'TGW에서 경로가 사라져 인터넷이 끊깁니다(닫힘).',
     gcp:'기본 경로를 지웠다면 끊기고(닫힘), 우선순위만 낮췄다면 직접 나갑니다(열림).',
     azure:'시스템 경로로 돌아갑니다. NAT나 공인 IP가 있으면 정책 없이 나갑니다(열림).',
     so:'보안팀과 "끊기면 닫힘"인지 "끊기면 열림"인지 정하고, 그에 맞게 기본 경로를 남기거나 지웁니다.'}
  ],

  iac: 'iac/scenario-21',
  checklist: [
    ['VPN 백업에서 0/0을 광고하지 않는다','전용선 장애 때 인터넷 출구가 사라집니다.'],
    ['GCP 기본 인터넷 경로를 남겨 둔다','동적 0/0과 경쟁해 일부 트래픽이 사내를 우회합니다.'],
    ['GCP private.googleapis.com 경로·DNS를 빠뜨린다','Google API까지 사내로 갑니다.'],
    ['Azure 서비스 서브넷 예외를 빠뜨린다','Application Gateway·Bastion이 비정상이 됩니다.'],
    ['전용선 용량에 인터넷 트래픽을 넣지 않는다','패치·이미지 다운로드가 몰리면 업무 트래픽이 밀립니다.'],
    ['장애 시 동작을 정하지 않는다','Azure는 조용히 열림으로 바뀝니다.']
  ],
  refs: [
    ['AWS: Transit Gateway와 Direct Connect 게이트웨이','https://docs.aws.amazon.com/directconnect/latest/UserGuide/direct-connect-transit-gateways.html'],
    ['Google Cloud: 기본 경로와 비공개 Google 액세스 구성','https://cloud.google.com/vpc/docs/configure-private-google-access'],
    ['Azure: ExpressRoute 강제 터널링','https://learn.microsoft.com/azure/expressroute/expressroute-routing'],
    ['Azure: Application Gateway 인프라 구성','https://learn.microsoft.com/azure/application-gateway/configuration-infrastructure']
  ],
  next: '시나리오 22 · 전용선 이중화와 장애 전환'
};
