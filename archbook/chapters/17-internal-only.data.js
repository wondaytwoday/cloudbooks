window.SCENARIO = {
  no: 17, level: 'network', title: '사내 전용 관리자 페이지',
  lede: '운영팀이 쓰는 백오피스 웹(admin.corp.example.com)을 클라우드에 올립니다. 사내망에서 VPN으로만 접속하고, 인터넷에는 이름조차 보이면 안 됩니다. 이 요구는 세 가지 설정이 함께 맞아야 이뤄집니다. 사설 IP만 가진 내부 로드밸런서, 사내 DNS가 클라우드의 비공개 영역을 풀 수 있게 하는 DNS 연결, 그리고 VPN으로 들어온 사내 대역을 어디까지 허용할지 정하는 방화벽입니다.',
  region: {aws:'ap-northeast-2 · prod 계정', gcp:'asia-northeast3 · prod 프로젝트', azure:'Korea Central · prod 구독'},
  req: [
    {k:'사용자', v:'운영팀 30명', s:'사내망(192.168.0.0/16)에서만'},
    {k:'노출', v:'인터넷 비노출', s:'공개 DNS에도 레코드 없음'},
    {k:'연결', v:'Site-to-Site VPN', s:'전용선 전 단계'},
    {k:'이름', v:'admin.corp.example.com', s:'사내 DNS에서 풀려야 함'},
    {k:'데이터', v:'운영 DB 조회·수정', s:'사내 PC에서 DB 직접 접속은 금지'}
  ],
  intro: {
    arch: '사내 PC에서 관리자 페이지를 여는 일은 <b>이름 풀기(DNS)</b>와 <b>HTTPS 연결</b> 두 통신으로 나뉩니다. 둘을 차례로 골라 보세요. <b>직원 PC → 운영 DB 직접 접속</b>은 세 클라우드가 서로 다른 곳에서 막힙니다.'
  },

  diagram: {
    aws: { w: 700, h: 560, aria: 'AWS: 사내망과 Site-to-Site VPN, Transit Gateway, 내부 ALB, Route 53 비공개 호스팅 영역과 Resolver 인바운드 엔드포인트',
      frames: [
        {id:'corp', kind:'onprem', x:14, y:10, w:262, h:120, label:'사내망 192.168.0.0/16'},
        {id:'vpc', kind:'net', x:14, y:156, w:672, h:390, label:'vpc-prod 10.20.0.0/16', cfg:'vpc'},
        {id:'app', kind:'plain', x:26, y:190, w:370, h:344, label:'프라이빗 서브넷 (AZ a·c)', cfg:'subnet'}
      ],
      nodes: [
        {id:'pc', x:28, y:40, w:180, h:40, icon:'users', t:'직원 PC', s:'192.168.10.0/24'},
        {id:'corpdns', kind:'chip', x:28, y:96, t:'사내 DNS: corp.example.com → 10.20.0.10', cfg:'dnshybrid', why:'사내 DNS 서버에 조건부 전달을 둡니다. corp.example.com 질의는 VPC의 Resolver 인바운드 엔드포인트로 보냅니다.'},
        {id:'inet', x:476, y:20, w:206, h:44, t:'인터넷', s:'공개 DNS · 외부 사용자', kind:'alt'},
        {id:'vpn', x:300, y:76, w:170, h:44, icon:'vpn', t:'Site-to-Site VPN', s:'터널 2개 · BGP', cfg:'vpn'},
        {id:'tgw', x:300, y:140, w:170, h:34, icon:'router', t:'Transit Gateway', s:'VPN·VPC 연결', kind:'reg', cfg:'hubnet'},
        {id:'lb', x:40, y:216, w:200, h:46, icon:'lb', t:'내부 ALB', s:'scheme: internal · 사설 IP', kind:'reg', cfg:'lb', why:'scheme을 internal로 만들면 노드에 사설 IP만 붙습니다. 인터넷 게이트웨이가 있는 VPC여도 인터넷에서 닿을 주소가 없습니다.'},
        {id:'sgalb', kind:'chip', x:248, y:228, t:'SG ← 192.168/16:443', cfg:'firewall', why:'사내 대역에서 오는 443만 받습니다. VPN을 지나 오는 트래픽은 출발지가 사내 PC의 사설 IP 그대로입니다.'},
        {id:'admin', x:40, y:300, w:200, h:44, icon:'vm', t:'admin 앱', s:'ECS 태스크 · 10.20.10.x', cfg:'vmgroup'},
        {id:'sgadm', kind:'chip', x:248, y:312, t:'SG ← sg-alb:8080', cfg:'firewall'},
        {id:'db', x:40, y:384, w:200, h:44, icon:'db', t:'운영 DB', s:'RDS · 10.20.20.x', cfg:'dbha'},
        {id:'sgdb', kind:'chip', x:248, y:396, t:'SG ← sg-admin:3306', cfg:'firewall', why:'DB는 앱 보안 그룹에서만 받습니다. 사내 대역을 여기에 넣지 않는 것이 "사내 PC에서 DB 직접 접속 금지"입니다.'},
        {id:'rtapp', kind:'chip', x:40, y:470, t:'rt-app: 192.168/16 → tgw (전파)', cfg:'route', why:'응답이 사내망으로 돌아가는 경로입니다. TGW 라우팅 테이블에는 VPN에서 BGP로 받은 경로가 전파됩니다.'},
        {id:'resolver', x:420, y:216, w:252, h:46, icon:'dns', t:'Resolver 인바운드 엔드포인트', s:'10.20.0.10 · 10.20.1.10', cfg:'dnshybrid'},
        {id:'phz', x:420, y:300, w:252, h:46, icon:'dns', t:'비공개 호스팅 영역', s:'corp.example.com · VPC 연결', cfg:'dns', why:'admin.corp.example.com → 내부 ALB 별칭 레코드. 공개 영역에는 같은 이름을 만들지 않습니다.'},
        {id:'nopub', kind:'chip', x:420, y:384, t:'공개 영역: admin 레코드 없음', cfg:'dns'}
      ],
      edges: [
        {a:'pc', b:'vpn', dash:true}, {a:'vpn', b:'tgw'}, {a:'resolver', b:'phz', dash:true}
      ]
    },

    gcp: { w: 700, h: 560, aria: 'GCP: 사내망과 HA VPN·Cloud Router, 리전 내부 Application LB와 프록시 전용 서브넷, Cloud DNS 비공개 영역과 인바운드 서버 정책',
      frames: [
        {id:'corp', kind:'onprem', x:14, y:10, w:262, h:120, label:'사내망 192.168.0.0/16'},
        {id:'vpc', kind:'net', x:14, y:156, w:672, h:390, label:'vpc-prod · 전역', cfg:'vpc'},
        {id:'app', kind:'plain', x:26, y:190, w:370, h:230, label:'subnet-app 10.20.10.0/24', cfg:'subnet'},
        {id:'proxy', kind:'plain', x:26, y:432, w:370, h:44, label:'프록시 전용 서브넷 10.20.250.0/23', cfg:'subnet', why:'리전 내부 Application LB는 이 서브넷의 Envoy 프록시가 요청을 받아 백엔드로 넘깁니다. 백엔드가 보는 출발지는 사내 PC가 아니라 이 대역입니다.'},
        {id:'psa', kind:'onprem', x:410, y:432, w:266, h:104, label:'Google 관리 VPC (피어링)', cfg:'dbha'}
      ],
      nodes: [
        {id:'pc', x:28, y:40, w:180, h:40, icon:'users', t:'직원 PC', s:'192.168.10.0/24'},
        {id:'corpdns', kind:'chip', x:28, y:96, t:'사내 DNS: corp.example.com → 인바운드 IP', cfg:'dnshybrid'},
        {id:'inet', x:476, y:20, w:206, h:44, t:'인터넷', s:'공개 DNS · 외부 사용자', kind:'alt'},
        {id:'vpn', x:300, y:76, w:170, h:44, icon:'vpn', t:'HA VPN', s:'터널 2개', cfg:'vpn'},
        {id:'tgw', x:300, y:140, w:170, h:34, icon:'router', t:'Cloud Router', s:'광고: 서브넷만(기본)', kind:'reg', cfg:'dedicated', why:'기본 광고 모드는 VPC의 서브넷 대역만 사내로 알립니다. 피어링으로 연결된 Cloud SQL 대역은 맞춤 광고에 넣어야 사내에서 보입니다.'},
        {id:'lb', x:40, y:216, w:200, h:46, icon:'lb', t:'리전 내부 Application LB', s:'사설 IP 10.20.10.100', kind:'reg', cfg:'lb'},
        {id:'nofw', kind:'chip', x:248, y:228, t:'앞단 출처는 경로가 정함', cfg:'firewall', why:'프록시 기반 LB는 앞단 출처를 백엔드처럼 VPC 방화벽 규칙으로 거르지 않습니다. 누가 닿을 수 있는지는 경로(VPN으로 광고된 대역)와 전역 액세스 설정이 먼저 정합니다.'},
        {id:'admin', x:40, y:300, w:200, h:44, icon:'vm', t:'admin 앱', s:'MIG · sa-admin', cfg:'vmgroup'},
        {id:'fwproxy', kind:'chip', x:248, y:312, t:'FW ← 프록시 대역:8080', cfg:'firewall', why:'백엔드 방화벽은 사내 대역이 아니라 프록시 전용 서브넷(10.20.250.0/23)과 헬스체크 대역을 허용해야 합니다. 가장 흔히 빠뜨리는 규칙입니다.'},
        {id:'fwhc', kind:'chip', x:248, y:338, t:'FW ← 헬스체크 대역', cfg:'firewall'},
        {id:'proxyn', kind:'chip', x:40, y:454, t:'Envoy 프록시 (관리형)', cfg:'lb'},
        {id:'db', x:424, y:458, w:240, h:44, icon:'db', t:'Cloud SQL', s:'비공개 IP 10.100.0.5', cfg:'dbha'},
        {id:'resolver', x:420, y:216, w:252, h:46, icon:'dns', t:'인바운드 서버 정책', s:'서브넷마다 진입 IP', cfg:'dnshybrid'},
        {id:'phz', x:420, y:300, w:252, h:46, icon:'dns', t:'Cloud DNS 비공개 영역', s:'corp.example.com · vpc-prod', cfg:'dns'},
        {id:'nopub', kind:'chip', x:420, y:384, t:'공개 영역: admin 레코드 없음', cfg:'dns'}
      ],
      edges: [
        {a:'pc', b:'vpn', dash:true}, {a:'vpn', b:'tgw'}, {a:'resolver', b:'phz', dash:true}
      ]
    },

    azure: { w: 700, h: 560, aria: 'Azure: 사내망과 VPN Gateway, 사설 프런트엔드만 가진 Application Gateway, 비공개 DNS 영역과 DNS Private Resolver',
      frames: [
        {id:'corp', kind:'onprem', x:14, y:10, w:262, h:120, label:'사내망 192.168.0.0/16'},
        {id:'vpc', kind:'net', x:14, y:156, w:672, h:390, label:'vnet-prod 10.20.0.0/16', cfg:'vpc'},
        {id:'agw', kind:'plain', x:26, y:190, w:370, h:80, label:'snet-agw 10.20.0.0/24', cfg:'subnet'},
        {id:'app', kind:'plain', x:26, y:280, w:370, h:80, label:'snet-app 10.20.10.0/24', cfg:'subnet'},
        {id:'dbs', kind:'plain', x:26, y:370, w:370, h:80, label:'snet-db 10.20.20.0/24 · 위임', cfg:'subnet'},
        {id:'dnsin', kind:'plain', x:410, y:190, w:266, h:80, label:'snet-dns-in · 위임', cfg:'subnet'}
      ],
      nodes: [
        {id:'pc', x:28, y:40, w:180, h:40, icon:'users', t:'직원 PC', s:'192.168.10.0/24'},
        {id:'corpdns', kind:'chip', x:28, y:96, t:'사내 DNS: corp.example.com → 10.20.30.4', cfg:'dnshybrid'},
        {id:'inet', x:476, y:20, w:206, h:44, t:'인터넷', s:'공개 DNS · 외부 사용자', kind:'alt'},
        {id:'vpn', x:300, y:76, w:170, h:44, icon:'vpn', t:'VPN Gateway', s:'GatewaySubnet · BGP', cfg:'vpn'},
        {id:'tgw', x:300, y:140, w:170, h:34, icon:'router', t:'게이트웨이 경로 전파', s:'192.168/16 → VPN', kind:'reg', cfg:'route', why:'VPN Gateway가 BGP로 받은 사내 경로가 서브넷 유효 경로에 자동으로 들어갑니다. UDR에서 전파를 끄지 않는 한 별도 설정이 없습니다.'},
        {id:'lb', x:40, y:212, w:200, h:46, icon:'lb', t:'Application Gateway v2', s:'사설 프런트엔드 IP만', kind:'reg', cfg:'lb', why:'공인 IP 없이 사설 프런트엔드만 두는 배포입니다. 인터넷에서 닿을 주소가 없습니다.'},
        {id:'sgalb', kind:'chip', x:248, y:224, t:'NSG ← 192.168/16:443', cfg:'firewall'},
        {id:'admin', x:40, y:302, w:200, h:44, icon:'vm', t:'admin 앱', s:'VMSS · 관리 ID', cfg:'vmgroup'},
        {id:'sgadm', kind:'chip', x:248, y:314, t:'NSG ← snet-agw:8080', cfg:'firewall'},
        {id:'db', x:40, y:392, w:200, h:44, icon:'db', t:'MySQL Flexible', s:'VNet 통합', cfg:'dbha'},
        {id:'sgdb', kind:'chip', x:248, y:404, t:'NSG ← snet-app:3306', cfg:'firewall', why:'DB 서브넷 NSG는 앱 서브넷만 허용합니다. VPN으로 사내 경로는 있지만 여기서 막힙니다.'},
        {id:'resolver', x:424, y:212, w:240, h:46, icon:'dns', t:'DNS Private Resolver', s:'인바운드 10.20.30.4', cfg:'dnshybrid'},
        {id:'phz', x:424, y:300, w:240, h:46, icon:'dns', t:'비공개 DNS 영역', s:'corp.example.com · VNet 연결', cfg:'dns'},
        {id:'nopub', kind:'chip', x:424, y:384, t:'공개 영역: admin 레코드 없음', cfg:'dns'}
      ],
      edges: [
        {a:'pc', b:'vpn', dash:true}, {a:'vpn', b:'tgw'}, {a:'resolver', b:'phz', dash:true}
      ]
    }
  },

  flows: [
    {id:'dns', t:'직원 PC → 이름 풀기 (DNS)',
     d:'admin.corp.example.com 을 사설 IP로 풉니다. 사내 DNS → 클라우드 DNS 입구 → 비공개 영역.',
     hops:{
      aws:[{n:'pc', t:'직원 PC', r:'사내 DNS에 admin.corp.example.com 질의'},
           {n:'corpdns', t:'사내 DNS', r:'조건부 전달: corp.example.com → 10.20.0.10, 10.20.1.10', cfg:'dnshybrid'},
           {n:'resolver', t:'Resolver 인바운드 엔드포인트', r:'보안 그룹에서 53 ← 192.168.0.0/16 허용, VPC의 Route 53 Resolver로 넘김', cfg:'dnshybrid'},
           {n:'phz', t:'비공개 호스팅 영역', r:'admin → 내부 ALB의 사설 IP 응답', cfg:'dns'}],
      gcp:[{n:'pc', t:'직원 PC', r:'사내 DNS에 질의'},
           {n:'corpdns', t:'사내 DNS', r:'조건부 전달: corp.example.com → 인바운드 서버 정책 진입 IP', cfg:'dnshybrid'},
           {n:'resolver', t:'인바운드 서버 정책', r:'VPN 리전 서브넷의 진입 IP로 받아 Cloud DNS가 처리', cfg:'dnshybrid'},
           {n:'phz', t:'Cloud DNS 비공개 영역', r:'admin → 10.20.10.100', cfg:'dns'}],
      azure:[{n:'pc', t:'직원 PC', r:'사내 DNS에 질의'},
           {n:'corpdns', t:'사내 DNS', r:'조건부 전달: corp.example.com → 10.20.30.4', cfg:'dnshybrid'},
           {n:'resolver', t:'DNS Private Resolver 인바운드', r:'위임 서브넷의 인바운드 엔드포인트가 받아 Azure DNS로', cfg:'dnshybrid'},
           {n:'phz', t:'비공개 DNS 영역', r:'VNet에 연결된 영역에서 admin → AppGW 사설 프런트엔드 IP', cfg:'dns'}]
     },
     note:'비공개 영역은 클라우드 네트워크 안에서만 보입니다. 사내 DNS에서 클라우드 DNS 입구로 조건부 전달을 두지 않으면 이 단계에서 이름이 풀리지 않습니다.'},
    {id:'ok', t:'직원 PC → 관리자 페이지 (HTTPS)',
     d:'풀어 낸 사설 IP로 VPN을 지나 HTTPS 연결을 맺습니다.',
     hops:{
      aws:[{n:'pc', t:'직원 PC', r:'풀어 낸 사설 IP로 443 연결'},
           {n:'vpn', t:'VPN 터널', r:'사내 라우터가 BGP로 10.20.0.0/16을 받아 터널로 보냄', cfg:'vpn'},
           {n:'tgw', t:'Transit Gateway', r:'VPN 연결 → vpc-prod 연결', cfg:'hubnet'},
           {n:'sgalb', t:'내부 ALB 보안 그룹', r:'443 ← 192.168.0.0/16 허용', cfg:'firewall'},
           {n:'lb', t:'내부 ALB', r:'리스너 443 → 대상 그룹', cfg:'lb'},
           {n:'sgadm', t:'admin 앱 보안 그룹', r:'8080 ← sg-alb', cfg:'firewall'},
           {n:'admin', t:'admin 앱', r:'응답은 rt-app의 192.168.0.0/16 → tgw 경로로'}],
      gcp:[{n:'pc', t:'직원 PC', r:'풀어 낸 사설 IP로 443 연결'},
           {n:'vpn', t:'HA VPN', r:'사내 라우터가 Cloud Router에서 10.20.0.0/16을 받음', cfg:'vpn'},
           {n:'tgw', t:'Cloud Router', r:'사내 대역 192.168.0.0/16을 동적 경로로 VPC에 넣음', cfg:'dedicated'},
           {n:'lb', t:'리전 내부 Application LB', r:'전달 규칙 사설 IP. 사내 PC가 VPN과 같은 리전에서 들어오므로 전역 액세스 없이도 닿음', cfg:'lb'},
           {n:'proxyn', t:'Envoy 프록시', r:'요청을 끝내고 프록시 전용 서브넷 IP로 백엔드에 새 연결', cfg:'lb'},
           {n:'fwproxy', t:'VPC 방화벽', r:'8080 ← 10.20.250.0/23(프록시 대역), 대상 sa-admin', cfg:'firewall'},
           {n:'admin', t:'admin 앱', r:'X-Forwarded-For 헤더로 원래 사내 IP를 확인'}],
      azure:[{n:'pc', t:'직원 PC', r:'풀어 낸 사설 IP로 443 연결'},
           {n:'vpn', t:'VPN Gateway', r:'BGP로 사내 192.168.0.0/16 경로를 VNet에 전파', cfg:'vpn'},
           {n:'tgw', t:'서브넷 유효 경로', r:'게이트웨이 전파 경로로 응답이 VPN으로 돌아갈 수 있음', cfg:'route'},
           {n:'sgalb', t:'nsg-agw', r:'443 ← 192.168.0.0/16', cfg:'firewall'},
           {n:'lb', t:'Application Gateway', r:'사설 수신기 443 → 백엔드 풀', cfg:'lb'},
           {n:'sgadm', t:'nsg-app', r:'8080 ← 10.20.0.0/24(snet-agw)', cfg:'firewall'},
           {n:'admin', t:'admin 앱', r:'X-Forwarded-For 헤더로 원래 사내 IP를 확인'}]
     }},
    {id:'inet', t:'인터넷 → 관리자 페이지',
     d:'외부의 누군가가 admin.corp.example.com 에 접속을 시도합니다.',
     hops:{
      aws:[{n:'inet', t:'인터넷 사용자', r:'공개 DNS에 admin 레코드가 없어 이름이 풀리지 않음'},
           {n:'nopub', t:'공개 호스팅 영역', r:'비공개 영역의 레코드는 VPC와 Resolver를 통한 질의에만 응답', cfg:'dns'},
           {n:'lb', t:'내부 ALB', r:'IP를 안다 해도 사설 IP뿐이라 인터넷에서 닿을 경로가 없음', cfg:'lb', ok:false}],
      gcp:[{n:'inet', t:'인터넷 사용자', r:'공개 DNS에 레코드 없음'},
           {n:'nopub', t:'공개 영역', r:'비공개 영역은 지정한 VPC에서만 보임', cfg:'dns'},
           {n:'lb', t:'리전 내부 Application LB', r:'사설 IP 전달 규칙이라 인터넷에서 닿을 경로가 없음', cfg:'lb', ok:false}],
      azure:[{n:'inet', t:'인터넷 사용자', r:'공개 DNS에 레코드 없음'},
           {n:'nopub', t:'공개 영역', r:'비공개 DNS 영역은 연결된 VNet에서만 보임', cfg:'dns'},
           {n:'lb', t:'Application Gateway', r:'공인 프런트엔드가 없어 인터넷에서 닿을 주소가 없음', cfg:'lb', ok:false}]
     },
     note:'이름을 숨기는 것(DNS)과 주소를 없애는 것(내부 LB)은 별개입니다. 이름만 숨기고 공인 LB를 쓰면 IP 스캔으로 찾아집니다.'},
    {id:'db', t:'직원 PC → 운영 DB 직접 (3306)',
     d:'운영팀원이 사내 PC의 DB 클라이언트로 운영 DB에 바로 붙으려 합니다.',
     hops:{
      aws:[{n:'pc', t:'직원 PC', r:'10.20.20.x:3306으로 연결 시도'},
           {n:'vpn', t:'VPN 터널', r:'10.20.0.0/16 전체가 광고되어 있어 경로는 있음', cfg:'vpn'},
           {n:'tgw', t:'Transit Gateway', r:'vpc-prod로 전달', cfg:'hubnet'},
           {n:'sgdb', t:'DB 보안 그룹', r:'3306은 sg-admin에서만. 출발지 192.168.10.x는 해당 없음 → 거부', cfg:'firewall', ok:false},
           {n:'db', t:'운영 DB', r:''}],
      gcp:[{n:'pc', t:'직원 PC', r:'10.100.0.5:3306으로 연결 시도'},
           {n:'vpn', t:'HA VPN', r:'사내 라우터의 경로 테이블에 10.100.0.0/20이 없음', cfg:'vpn'},
           {n:'tgw', t:'Cloud Router', r:'기본 광고는 VPC 서브넷만. 피어링된 Cloud SQL 대역은 광고하지 않음 → 사내에서 갈 경로 없음', cfg:'dedicated', ok:false},
           {n:'db', t:'Cloud SQL', r:'광고하더라도 VPC 방화벽은 Cloud SQL 앞에 걸리지 않으므로 IAM DB 인증·승인된 연결로 막아야 함', cfg:'dbha'}],
      azure:[{n:'pc', t:'직원 PC', r:'10.20.20.x:3306으로 연결 시도'},
           {n:'vpn', t:'VPN Gateway', r:'VNet 주소 공간 전체가 사내로 광고되어 경로는 있음', cfg:'vpn'},
           {n:'sgdb', t:'nsg-db', r:'3306은 snet-app에서만. 192.168.0.0/16은 기본 규칙 AllowVnetInBound에 포함되므로 명시적 거부 규칙이 필요', cfg:'firewall', ok:false},
           {n:'db', t:'MySQL Flexible', r:''}]
     },
     note:{aws:'VPN으로 들어온 사내 트래픽은 보안 그룹 입장에서 그냥 사설 IP입니다. 사내 대역을 DB 보안 그룹에 넣지 않으면 막힙니다.', gcp:'막힌 이유가 "경로가 없어서"입니다. 나중에 누군가 Cloud Router 맞춤 광고에 Cloud SQL 대역을 추가하면 바로 열리므로, DB 쪽 인증 통제를 함께 둡니다.', azure:'Azure NSG의 VirtualNetwork 서비스 태그에는 VPN으로 연결된 사내 대역도 포함됩니다. 기본 규칙 AllowVnetInBound가 사내 트래픽을 허용하므로, 더 높은 우선순위로 거부 규칙을 넣어야 합니다.'}},
    {id:'appdb', t:'admin 앱 → 운영 DB',
     d:'관리자 페이지가 DB를 조회합니다.',
     hops:{
      aws:[{n:'admin', t:'admin 앱', r:'보안 그룹 아웃바운드 허용', cfg:'firewall'},
           {n:'sgdb', t:'DB 보안 그룹', r:'3306 ← sg-admin', cfg:'firewall'},
           {n:'db', t:'운영 DB', r:'같은 VPC라 local 경로', cfg:'dbha'}],
      gcp:[{n:'admin', t:'admin 앱', r:'이그레스 허용', cfg:'firewall'},
           {n:'db', t:'Cloud SQL', r:'비공개 서비스 액세스 피어링 경로, Cloud SQL 커넥터·IAM 인증', cfg:'dbha'}],
      azure:[{n:'admin', t:'admin 앱', r:'NSG 아웃바운드 허용', cfg:'firewall'},
           {n:'sgdb', t:'nsg-db', r:'3306 ← 10.20.10.0/24', cfg:'firewall'},
           {n:'db', t:'MySQL Flexible', r:'비공개 DNS 영역으로 서버 이름을 사설 IP로 풀고 접속', cfg:'dbha'}]
     }}
  ],

  scope: ['vpn','dnshybrid','dns','lb','firewall','route'],
  build: {
    aws: [
      {t:'고객 게이트웨이 + VPN 연결', d:'TGW에 연결, BGP', cfg:'vpn', nodes:['vpn','tgw']},
      {t:'TGW 라우팅 전파', d:'VPN 경로를 vpc-prod 테이블로, vpc-prod 경로를 VPN 테이블로', cfg:'hubnet', nodes:['tgw']},
      {t:'VPC 라우팅', d:'192.168.0.0/16 → tgw', cfg:'route', nodes:['rtapp']},
      {t:'내부 ALB + 보안 그룹', d:'scheme internal, 443 ← 사내 대역', cfg:'lb', nodes:['lb','sgalb']},
      {t:'admin 앱 · DB 보안 그룹', d:'sg-alb → sg-admin → sg-db 체인', cfg:'firewall', nodes:['sgadm','sgdb']},
      {t:'비공개 호스팅 영역', d:'corp.example.com, vpc-prod 연결, 별칭 → 내부 ALB', cfg:'dns', nodes:['phz']},
      {t:'Resolver 인바운드 엔드포인트', d:'서브넷 2개, 53 ← 사내 대역', cfg:'dnshybrid', nodes:['resolver']},
      {t:'사내 DNS 조건부 전달', d:'사내 DNS 서버 작업', cfg:'dnshybrid', nodes:['corpdns']}
    ],
    gcp: [
      {t:'HA VPN + Cloud Router', d:'터널마다 BGP 세션', cfg:'vpn', nodes:['vpn','tgw']},
      {t:'프록시 전용 서브넷', d:'REGIONAL_MANAGED_PROXY, 리전마다 하나', cfg:'subnet', nodes:['proxy']},
      {t:'백엔드 방화벽', d:'프록시 대역·헬스체크 대역 → 8080', cfg:'firewall', nodes:['fwproxy','fwhc']},
      {t:'리전 내부 Application LB', d:'백엔드 서비스·URL 맵·대상 프록시·사설 전달 규칙', cfg:'lb', nodes:['lb','proxyn']},
      {t:'Cloud DNS 비공개 영역', d:'corp.example.com, vpc-prod', cfg:'dns', nodes:['phz']},
      {t:'인바운드 서버 정책', d:'진입 IP 확인 후 사내 DNS 전달 대상으로', cfg:'dnshybrid', nodes:['resolver','corpdns']},
      {t:'Cloud Router 광고 확인', d:'Cloud SQL 대역은 광고하지 않음 (사내 직접 접속 차단)', cfg:'dedicated', nodes:['tgw'], auto:true}
    ],
    azure: [
      {t:'GatewaySubnet + VPN Gateway', d:'로컬 네트워크 게이트웨이, 연결, BGP', cfg:'vpn', nodes:['vpn']},
      {t:'경로 전파 확인', d:'서브넷 유효 경로에 192.168/16 → VPN', cfg:'route', nodes:['tgw'], auto:true},
      {t:'Application Gateway (사설 프런트엔드)', d:'전용 서브넷, 공인 IP 없음', cfg:'lb', nodes:['lb','agw']},
      {t:'NSG 3개', d:'agw ← 사내 443, app ← agw 8080, db ← app 3306 + 그 외 VNet 거부', cfg:'firewall', nodes:['sgalb','sgadm','sgdb']},
      {t:'비공개 DNS 영역 + VNet 연결', d:'admin → AppGW 사설 IP', cfg:'dns', nodes:['phz']},
      {t:'DNS Private Resolver 인바운드', d:'위임 서브넷', cfg:'dnshybrid', nodes:['resolver','dnsin']},
      {t:'사내 DNS 조건부 전달', d:'', cfg:'dnshybrid', nodes:['corpdns']}
    ]
  },

  map: ['site-vpn','hybrid-dns','dns','l7-lb','firewall','route-table'],

  decisions: [
    {t:'사내 PC는 무엇으로 이름을 푸는가',
     p:'클라우드의 비공개 DNS 영역은 클라우드 네트워크 안에서만 보입니다. 사내 DNS가 이 영역에 질의를 넘길 입구가 필요합니다.',
     aws:'Route 53 Resolver 인바운드 엔드포인트를 서브넷 두 개에 만들고, 사내 DNS에서 그 IP로 조건부 전달합니다.',
     gcp:'인바운드 서버 정책을 켜면 서브넷마다 진입 IP가 생깁니다. 사내 DNS에서 VPN이 있는 리전의 진입 IP로 전달합니다.',
     azure:'DNS Private Resolver의 인바운드 엔드포인트(위임 서브넷)로 전달합니다. 예전에는 DNS 전달용 VM을 두기도 했습니다.',
     so:'세 클라우드 모두 "사내 → 클라우드" DNS 입구를 따로 만들어야 합니다. 반대 방향(클라우드 → 사내 이름)은 아웃바운드 규칙이 따로 필요합니다(시나리오 06).'},
    {t:'내부 로드밸런서 뒤의 앱은 누구를 출발지로 보는가',
     p:'방화벽 규칙의 출처를 정하려면 백엔드가 보는 출발지 IP를 알아야 합니다.',
     aws:'ALB가 자기 사설 IP로 백엔드에 새 연결을 맺습니다. 그래서 백엔드 보안 그룹은 출처를 sg-alb로 지정합니다.',
     gcp:'프록시 전용 서브넷의 Envoy가 연결을 맺습니다. 백엔드 방화벽 출처는 사내 대역이 아니라 프록시 전용 서브넷 대역입니다.',
     azure:'Application Gateway 인스턴스가 snet-agw의 IP로 연결합니다. 백엔드 NSG 출처는 snet-agw 대역입니다.',
     so:'세 클라우드 모두 L7 LB는 연결을 새로 맺으므로, 백엔드는 사용자 IP가 아닌 LB 대역을 허용합니다. 원래 IP는 X-Forwarded-For로 봅니다.'},
    {t:'VPN으로 들어온 사내 트래픽이 어디까지 닿는가',
     p:'VPN을 연결하는 순간 사내망과 클라우드는 하나의 사설 네트워크가 됩니다. 기본값이 열려 있는지 닫혀 있는지가 다릅니다.',
     aws:'보안 그룹은 기본이 닫힘이라 허용하지 않은 곳에는 닿지 않습니다. 경로는 VPC 전체에 생깁니다.',
     gcp:'Cloud Router 기본 광고는 서브넷만이라 피어링된 관리형 서비스 대역은 사내에서 보이지 않습니다. VPC 방화벽은 묵시적 인그레스 거부입니다.',
     azure:'NSG 기본 규칙 AllowVnetInBound가 VPN으로 연결된 사내 대역까지 VirtualNetwork로 취급해 허용합니다. 민감한 서브넷에는 명시적 거부가 필요합니다.',
     so:'Azure에서 NSG를 "기본값 + 몇 개 허용"으로만 쓰면 사내 전체가 VNet 안의 모든 서버에 닿습니다. 운영 서브넷은 마지막에 VirtualNetwork 거부 규칙을 둡니다.'}
  ],

  iac: 'iac/scenario-17',
  checklist: [
    ['공인 LB에 IP 제한만 걸어 둔다','보안 그룹·WAF 설정 실수 하나로 인터넷에 노출됩니다. 사내 전용이면 내부 LB를 씁니다.'],
    ['공개 DNS에 사내 서비스 이름을 만든다','사설 IP라도 내부 구조가 드러납니다. 비공개 영역에만 둡니다.'],
    ['GCP 백엔드 방화벽에 사내 대역을 넣는다','백엔드가 보는 출발지는 프록시 전용 서브넷입니다. 사내 대역 규칙은 아무 효과가 없고 연결은 실패합니다.'],
    ['Azure NSG가 VPN 대역을 막는다고 믿는다','VirtualNetwork 태그에 사내 대역이 들어 있어 기본 규칙이 허용합니다.'],
    ['Resolver 인바운드 보안 그룹에서 53을 막는다','사내 DNS의 조건부 전달이 시간 초과로 실패합니다. TCP·UDP 53을 모두 엽니다.'],
    ['VPN 터널 하나만 설정한다','클라우드는 터널 두 개를 제공합니다. 사내 장비에 둘 다 설정해야 유지보수 때 끊기지 않습니다.']
  ],
  refs: [
    ['AWS: Route 53 Resolver 인바운드 엔드포인트','https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver-forwarding-inbound-queries.html'],
    ['Google Cloud: 프록시 전용 서브넷','https://cloud.google.com/load-balancing/docs/proxy-only-subnets'],
    ['Google Cloud: Cloud Router 맞춤 경로 광고','https://cloud.google.com/network-connectivity/docs/router/how-to/advertising-custom-ip'],
    ['Azure: DNS Private Resolver','https://learn.microsoft.com/azure/dns/dns-private-resolver-overview'],
    ['Azure: 네트워크 보안 그룹 기본 규칙','https://learn.microsoft.com/azure/virtual-network/network-security-groups-overview']
  ],
  next: '시나리오 18 · 파트너가 고정 IP를 요구할 때'
};
