window.SCENARIO = {
  no: 19, level: 'network', title: '서비스 간 내부 통신',
  lede: '주문 서비스는 같은 네트워크의 재고 서비스를 부르고, 다른 팀이 운영하는 결제 서비스도 불러야 합니다. 결제팀은 자기 VPC 전체를 열어 주고 싶지 않고, 두 팀의 대역은 공교롭게 같은 10.20.0.0/16입니다. 같은 네트워크 안에서는 "누가 누구를 부를 수 있는가"를 방화벽 규칙의 출처·대상으로 표현하고, 다른 네트워크의 서비스는 네트워크를 잇지 않고 서비스 하나만 비공개로 내주는 방식(PrivateLink, Private Service Connect, Private Link 서비스)으로 엽니다.',
  region: {aws:'계정 2개: 주문팀 · 결제팀', gcp:'프로젝트 2개: orders · payments', azure:'구독 2개: 주문팀 · 결제팀'},
  req: [
    {k:'같은 네트워크', v:'주문 → 재고만 허용', s:'재고 → 주문, 그 밖의 호출은 금지'},
    {k:'다른 네트워크', v:'주문 → 결제 API', s:'결제 VPC 전체 연결은 금지'},
    {k:'대역', v:'두 팀 모두 10.20.0.0/16', s:'피어링·TGW로는 연결 불가'},
    {k:'방향', v:'결제 → 주문 호출 없음', s:'결제는 응답만'}
  ],
  intro: {
    arch: '<b>주문 → 결제 API</b>를 고르면 소비자 쪽 엔드포인트에서 생산자 쪽 서비스로 넘어가는 경로가 보입니다. <b>재고 → 주문</b>은 세 클라우드 모두 막히지만 Azure만 "기본 규칙이 허용하므로 명시적 거부가 필요하다"는 점이 다릅니다.'
  },

  diagram: {
    aws: { w: 700, h: 470, aria: 'AWS: 주문 VPC 안의 보안 그룹 참조, 인터페이스 엔드포인트와 결제 VPC의 엔드포인트 서비스·NLB',
      frames: [
        {id:'orders', kind:'net', x:14, y:14, w:400, h:440, label:'주문팀 · vpc-orders 10.20.0.0/16', cfg:'vpc'},
        {id:'pay', kind:'net', x:434, y:14, w:252, h:440, label:'결제팀 · vpc-payments 10.20.0.0/16', cfg:'vpc'}
      ],
      nodes: [
        {id:'order', x:30, y:60, w:180, h:44, icon:'k8s', t:'주문 서비스', s:'sg-order', cfg:'vmgroup'},
        {id:'sgorder', kind:'chip', x:220, y:72, t:'sg-order ← sg-alb만', cfg:'firewall'},
        {id:'inv', x:30, y:170, w:180, h:44, icon:'k8s', t:'재고 서비스', s:'sg-inventory', cfg:'vmgroup'},
        {id:'sginv', kind:'chip', x:220, y:182, t:'sg-inventory ← sg-order:8080', cfg:'firewall', why:'출처를 IP 대역이 아니라 보안 그룹으로 지정합니다. 주문 서비스 인스턴스가 늘거나 IP가 바뀌어도 규칙을 고칠 필요가 없습니다.'},
        {id:'vpce', x:30, y:390, w:180, h:46, icon:'privlink', t:'인터페이스 엔드포인트', s:'10.20.30.5 (주문 VPC 대역)', cfg:'privlink'},
        {id:'sgvpce', kind:'chip', x:220, y:402, t:'SG ← sg-order:443', cfg:'firewall'},
        {id:'dnsn', kind:'chip', x:30, y:350, t:'비공개 DNS: payments.internal → 10.20.30.5', cfg:'dns'},
        {id:'epsvc', x:448, y:390, w:226, h:46, icon:'privlink', t:'엔드포인트 서비스', s:'허용 주체: 주문팀 계정', kind:'reg', cfg:'privsvc'},
        {id:'nlb', x:448, y:280, w:226, h:44, icon:'lb', t:'NLB (내부)', s:'결제 API 앞', cfg:'privsvc'},
        {id:'sgpay', kind:'chip', x:448, y:236, t:'sg-pay ← NLB 대역:8443', cfg:'firewall'},
        {id:'paysvc', x:448, y:150, w:226, h:44, icon:'k8s', t:'결제 서비스', s:'10.20.5.x', cfg:'vmgroup'}
      ],
      edges: [{a:'vpce', b:'epsvc', dash:'both', label:'PrivateLink', ly:-6}]
    },

    gcp: { w: 700, h: 470, aria: 'GCP: 서비스 계정 기반 방화벽 규칙, 소비자 PSC 엔드포인트와 생산자 서비스 연결·PSC NAT 서브넷',
      frames: [
        {id:'orders', kind:'net', x:14, y:14, w:400, h:440, label:'orders · vpc-orders 10.20.0.0/16', cfg:'vpc'},
        {id:'pay', kind:'net', x:434, y:14, w:252, h:440, label:'payments · vpc-pay 10.20.0.0/16', cfg:'vpc'}
      ],
      nodes: [
        {id:'order', x:30, y:60, w:180, h:44, icon:'k8s', t:'주문 서비스', s:'sa-order', cfg:'vmgroup'},
        {id:'sgorder', kind:'chip', x:220, y:72, t:'FW: sa-order ← LB 대역만', cfg:'firewall'},
        {id:'inv', x:30, y:170, w:180, h:44, icon:'k8s', t:'재고 서비스', s:'sa-inventory', cfg:'vmgroup'},
        {id:'sginv', kind:'chip', x:220, y:182, t:'FW: sa-order → sa-inv:8080', cfg:'firewall', why:'VPC에 만드는 규칙이지만 출처와 대상을 서비스 계정으로 지정해 서비스 단위로 허용합니다.'},
        {id:'vpce', x:30, y:390, w:180, h:46, icon:'privlink', t:'PSC 엔드포인트', s:'10.20.30.5 · 전달 규칙', cfg:'privlink'},
        {id:'dnsn', kind:'chip', x:30, y:350, t:'Cloud DNS: payments.internal → 10.20.30.5', cfg:'dns'},
        {id:'epsvc', x:448, y:390, w:226, h:46, icon:'privlink', t:'서비스 연결', s:'승인 목록: orders', kind:'reg', cfg:'privsvc'},
        {id:'pscnat', kind:'chip', x:448, y:350, t:'PSC NAT 서브넷 10.99.0.0/24', cfg:'privsvc'},
        {id:'nlb', x:448, y:280, w:226, h:44, icon:'lb', t:'내부 패스스루 NLB', s:'결제 API 앞', cfg:'privsvc'},
        {id:'sgpay', kind:'chip', x:448, y:236, t:'FW ← 10.99.0.0/24:8443', cfg:'firewall', why:'생산자 백엔드는 소비자 IP가 아니라 PSC NAT 서브넷 대역을 출발지로 봅니다.'},
        {id:'paysvc', x:448, y:150, w:226, h:44, icon:'k8s', t:'결제 서비스', s:'sa-pay', cfg:'vmgroup'}
      ],
      edges: [{a:'vpce', b:'epsvc', dash:'both', label:'PSC', ly:-6}]
    },

    azure: { w: 700, h: 470, aria: 'Azure: 애플리케이션 보안 그룹 기반 NSG, 소비자 Private Endpoint와 생산자 Private Link 서비스·내부 Load Balancer',
      frames: [
        {id:'orders', kind:'net', x:14, y:14, w:400, h:440, label:'주문팀 · vnet-orders 10.20.0.0/16', cfg:'vpc'},
        {id:'pay', kind:'net', x:434, y:14, w:252, h:440, label:'결제팀 · vnet-pay 10.20.0.0/16', cfg:'vpc'}
      ],
      nodes: [
        {id:'order', x:30, y:60, w:180, h:44, icon:'k8s', t:'주문 서비스', s:'ASG asg-order', cfg:'vmgroup'},
        {id:'sgorder', kind:'chip', x:220, y:72, t:'NSG: asg-order ← AppGW만', cfg:'firewall'},
        {id:'inv', x:30, y:170, w:180, h:44, icon:'k8s', t:'재고 서비스', s:'ASG asg-inventory', cfg:'vmgroup'},
        {id:'sginv', kind:'chip', x:220, y:182, t:'NSG 100: asg-order → asg-inv:8080', cfg:'firewall', why:'애플리케이션 보안 그룹(ASG)은 NIC를 역할별로 묶는 이름표입니다. NSG 규칙의 출처·대상에 IP 대신 씁니다.'},
        {id:'denyvnet', kind:'chip', x:220, y:208, t:'NSG 4000: VirtualNetwork 거부', cfg:'firewall', why:'기본 규칙 AllowVnetInBound(65000)가 VNet 안의 모든 통신을 허용하므로, 허용 규칙 아래에 명시적 거부를 둬야 "허용한 것만"이 됩니다.'},
        {id:'vpce', x:30, y:390, w:180, h:46, icon:'privlink', t:'Private Endpoint', s:'10.20.30.5 · NIC', cfg:'privlink'},
        {id:'dnsn', kind:'chip', x:30, y:350, t:'비공개 DNS: payments.internal → 10.20.30.5', cfg:'dns'},
        {id:'epsvc', x:448, y:390, w:226, h:46, icon:'privlink', t:'Private Link 서비스', s:'자동 승인: 주문팀 구독', kind:'reg', cfg:'privsvc'},
        {id:'pscnat', kind:'chip', x:448, y:350, t:'NAT IP: snet-pls 10.20.40.10', cfg:'privsvc'},
        {id:'nlb', x:448, y:280, w:226, h:44, icon:'lb', t:'Standard 내부 LB', s:'결제 API 앞', cfg:'privsvc'},
        {id:'sgpay', kind:'chip', x:448, y:236, t:'NSG ← snet-pls:8443', cfg:'firewall'},
        {id:'paysvc', x:448, y:150, w:226, h:44, icon:'k8s', t:'결제 서비스', s:'VMSS', cfg:'vmgroup'}
      ],
      edges: [{a:'vpce', b:'epsvc', dash:'both', label:'Private Link', ly:-6}]
    }
  },

  flows: [
    {id:'inv', t:'주문 → 재고 (8080)',
     d:'주문 서비스가 같은 네트워크의 재고 서비스에 재고 차감을 요청합니다.',
     hops:{
      aws:[{n:'order', t:'주문 서비스', r:'sg-order 아웃바운드 허용', cfg:'firewall'},
           {n:'sginv', t:'sg-inventory', r:'8080 ← sg-order (보안 그룹 참조)', cfg:'firewall'},
           {n:'inv', t:'재고 서비스', r:'같은 VPC라 local 경로'}],
      gcp:[{n:'order', t:'주문 서비스 (sa-order)', r:'이그레스 허용', cfg:'firewall'},
           {n:'sginv', t:'VPC 방화벽', r:'인그레스: 출처 SA sa-order → 대상 SA sa-inventory, tcp:8080', cfg:'firewall'},
           {n:'inv', t:'재고 서비스', r:'같은 VPC 서브넷 경로'}],
      azure:[{n:'order', t:'주문 서비스 (asg-order)', r:'NSG 아웃바운드 허용', cfg:'firewall'},
           {n:'sginv', t:'NSG 규칙 100', r:'asg-order → asg-inventory:8080 허용', cfg:'firewall'},
           {n:'inv', t:'재고 서비스', r:'같은 VNet 시스템 경로'}]
     }},
    {id:'back', t:'재고 → 주문 (역방향 호출)',
     d:'재고 서비스가 뚫렸다고 가정하고, 공격자가 주문 서비스 관리 API를 부릅니다.',
     hops:{
      aws:[{n:'inv', t:'재고 서비스', r:'아웃바운드 허용', cfg:'firewall'},
           {n:'sgorder', t:'sg-order', r:'인바운드는 sg-alb에서만. sg-inventory 출처 규칙이 없음 → 거부', cfg:'firewall', ok:false},
           {n:'order', t:'주문 서비스', r:''}],
      gcp:[{n:'inv', t:'재고 서비스', r:'이그레스 허용', cfg:'firewall'},
           {n:'sgorder', t:'VPC 방화벽', r:'sa-order로 오는 허용 규칙은 LB 대역뿐 → 묵시적 인그레스 거부', cfg:'firewall', ok:false},
           {n:'order', t:'주문 서비스', r:''}],
      azure:[{n:'inv', t:'재고 서비스', r:'아웃바운드 허용', cfg:'firewall'},
           {n:'sgorder', t:'NSG 허용 규칙', r:'asg-order로 오는 허용은 AppGW뿐. 일치하는 허용 규칙 없음', cfg:'firewall'},
           {n:'denyvnet', t:'NSG 규칙 4000', r:'VirtualNetwork 거부에 걸림. 이 규칙이 없으면 기본 AllowVnetInBound(65000)가 허용함', cfg:'firewall', ok:false},
           {n:'order', t:'주문 서비스', r:''}]
     },
     note:'AWS 보안 그룹과 GCP 방화벽은 "허용하지 않으면 거부"가 기본이지만, Azure NSG는 같은 VNet 안을 기본으로 허용합니다. 마이크로서비스 간 최소 권한을 Azure에서 만들려면 거부 규칙을 직접 넣어야 합니다.'},
    {id:'pay', t:'주문 → 결제 API (다른 팀 네트워크)',
     d:'주문 서비스가 https://payments.internal 을 부릅니다. 두 VPC는 대역이 같아 직접 연결할 수 없습니다.',
     hops:{
      aws:[{n:'order', t:'주문 서비스', r:'payments.internal을 비공개 DNS로 풀어 10.20.30.5'},
           {n:'dnsn', t:'비공개 DNS', r:'엔드포인트 서비스의 비공개 DNS 이름 또는 비공개 호스팅 영역', cfg:'dns'},
           {n:'sgvpce', t:'엔드포인트 보안 그룹', r:'443 ← sg-order', cfg:'firewall'},
           {n:'vpce', t:'인터페이스 엔드포인트', r:'주문 VPC 안의 ENI. 여기서 AWS가 생산자 쪽으로 넘김', cfg:'privlink'},
           {n:'epsvc', t:'엔드포인트 서비스', r:'주문팀 계정이 허용 주체이고 연결이 수락됨', cfg:'privsvc'},
           {n:'nlb', t:'NLB', r:'대상 그룹으로 전달', cfg:'privsvc'},
           {n:'sgpay', t:'sg-pay', r:'8443 ← NLB 서브넷 대역', cfg:'firewall'},
           {n:'paysvc', t:'결제 서비스', r:'응답은 같은 연결로 돌아감'}],
      gcp:[{n:'order', t:'주문 서비스', r:'payments.internal → 10.20.30.5'},
           {n:'dnsn', t:'Cloud DNS 비공개 영역', r:'PSC 엔드포인트 IP를 가리키는 레코드', cfg:'dns'},
           {n:'vpce', t:'PSC 엔드포인트', r:'소비자 VPC의 내부 IP 전달 규칙', cfg:'privlink'},
           {n:'epsvc', t:'서비스 연결', r:'orders 프로젝트가 승인 목록에 있음', cfg:'privsvc'},
           {n:'pscnat', t:'PSC NAT 서브넷', r:'출발지를 10.99.0.x로 바꿈 (대역이 겹쳐도 충돌 없음)', cfg:'privsvc'},
           {n:'nlb', t:'내부 패스스루 NLB', r:'백엔드로 전달', cfg:'privsvc'},
           {n:'sgpay', t:'생산자 VPC 방화벽', r:'8443 ← 10.99.0.0/24', cfg:'firewall'},
           {n:'paysvc', t:'결제 서비스', r:''}],
      azure:[{n:'order', t:'주문 서비스', r:'payments.internal → 10.20.30.5'},
           {n:'dnsn', t:'비공개 DNS 영역', r:'Private Endpoint IP를 가리키는 레코드', cfg:'dns'},
           {n:'vpce', t:'Private Endpoint', r:'소비자 VNet의 NIC. 연결 상태 Approved', cfg:'privlink'},
           {n:'epsvc', t:'Private Link 서비스', r:'주문팀 구독 자동 승인', cfg:'privsvc'},
           {n:'pscnat', t:'NAT IP 구성', r:'출발지를 snet-pls의 10.20.40.10으로 바꿈', cfg:'privsvc'},
           {n:'nlb', t:'Standard 내부 LB', r:'백엔드 풀로 전달', cfg:'privsvc'},
           {n:'sgpay', t:'생산자 NSG', r:'8443 ← snet-pls', cfg:'firewall'},
           {n:'paysvc', t:'결제 서비스', r:''}]
     },
     note:'세 클라우드 모두 "네트워크를 잇지 않고 서비스 하나만" 소비자 네트워크 안의 사설 IP로 꽂아 줍니다. 대역이 겹쳐도 되고, 소비자는 결제 VPC의 다른 서버를 전혀 볼 수 없습니다.'},
    {id:'rev', t:'결제 → 주문 (생산자가 먼저 호출)',
     d:'결제 서비스 쪽에서 주문 VPC의 서버로 연결을 시작하려 합니다.',
     hops:{
      aws:[{n:'paysvc', t:'결제 서비스', r:'주문 VPC로 가는 경로가 없음 (대역도 겹침)'},
           {n:'epsvc', t:'엔드포인트 서비스', r:'PrivateLink는 소비자 → 생산자 방향의 연결만 받음', cfg:'privsvc', ok:false},
           {n:'vpce', t:'인터페이스 엔드포인트', r:''}],
      gcp:[{n:'paysvc', t:'결제 서비스', r:'소비자 VPC 경로 없음'},
           {n:'epsvc', t:'서비스 연결', r:'PSC는 소비자가 시작한 연결만 생산자로 전달', cfg:'privsvc', ok:false},
           {n:'vpce', t:'PSC 엔드포인트', r:''}],
      azure:[{n:'paysvc', t:'결제 서비스', r:'소비자 VNet 경로 없음'},
           {n:'epsvc', t:'Private Link 서비스', r:'소비자 → 생산자 방향만', cfg:'privsvc', ok:false},
           {n:'vpce', t:'Private Endpoint', r:''}]
     },
     note:'역방향 호출(콜백)이 필요하면 반대 방향으로 서비스를 하나 더 게시하거나, 메시지 큐를 사이에 둡니다.'}
  ],

  scope: ['firewall','privlink','privsvc','dns','peering'],
  build: {
    aws: [
      {t:'보안 그룹을 서비스마다', d:'sg-order, sg-inventory, 참조로 연결', cfg:'firewall', nodes:['sgorder','sginv']},
      {t:'[결제팀] 내부 NLB', d:'결제 서비스 앞', cfg:'privsvc', nodes:['nlb','sgpay']},
      {t:'[결제팀] 엔드포인트 서비스', d:'허용 주체: 주문팀 계정, 수락 필요', cfg:'privsvc', nodes:['epsvc']},
      {t:'[주문팀] 인터페이스 엔드포인트', d:'서비스 이름으로 생성, 서브넷 2개, sg', cfg:'privlink', nodes:['vpce','sgvpce']},
      {t:'[결제팀] 연결 수락', d:'', cfg:'privsvc', nodes:['epsvc']},
      {t:'[주문팀] DNS', d:'비공개 호스팅 영역 또는 서비스의 비공개 DNS 이름', cfg:'dns', nodes:['dnsn']}
    ],
    gcp: [
      {t:'서비스 계정을 서비스마다', d:'방화벽 출처·대상으로 사용', cfg:'firewall', nodes:['sgorder','sginv']},
      {t:'[결제팀] 내부 NLB', d:'', cfg:'privsvc', nodes:['nlb']},
      {t:'[결제팀] PSC NAT 서브넷', d:'purpose PRIVATE_SERVICE_CONNECT', cfg:'privsvc', nodes:['pscnat']},
      {t:'[결제팀] 서비스 연결 + 방화벽', d:'승인 목록, 8443 ← NAT 대역', cfg:'privsvc', nodes:['epsvc','sgpay']},
      {t:'[주문팀] PSC 엔드포인트', d:'내부 주소 예약 + 전달 규칙(대상 = 서비스 연결)', cfg:'privlink', nodes:['vpce']},
      {t:'[주문팀] Cloud DNS 레코드', d:'', cfg:'dns', nodes:['dnsn']}
    ],
    azure: [
      {t:'ASG + NSG', d:'허용 규칙 아래 VirtualNetwork 거부', cfg:'firewall', nodes:['sgorder','sginv','denyvnet']},
      {t:'[결제팀] Standard 내부 LB', d:'', cfg:'privsvc', nodes:['nlb']},
      {t:'[결제팀] snet-pls 네트워크 정책 끄기', d:'privateLinkServiceNetworkPolicies', cfg:'subnet', nodes:['pscnat']},
      {t:'[결제팀] Private Link 서비스', d:'NAT IP, 자동 승인 구독', cfg:'privsvc', nodes:['epsvc','sgpay']},
      {t:'[주문팀] Private Endpoint', d:'별칭 또는 리소스 ID로 연결 요청', cfg:'privlink', nodes:['vpce']},
      {t:'[주문팀] 비공개 DNS 레코드', d:'', cfg:'dns', nodes:['dnsn']}
    ]
  },

  map: ['firewall','private-endpoint','dns'],

  decisions: [
    {t:'같은 네트워크 안의 서비스를 무엇으로 구분하는가',
     p:'IP 대역으로 규칙을 쓰면 오토스케일과 재배포 때마다 깨집니다. 세 클라우드 모두 "역할 이름표"를 출처·대상으로 쓸 수 있습니다.',
     aws:'보안 그룹 자체가 이름표입니다. sg-inventory의 출처로 sg-order를 지정합니다. 같은 VPC(또는 피어링된 같은 리전 VPC)에서만 참조할 수 있습니다.',
     gcp:'서비스 계정을 방화벽 출처·대상으로 지정합니다. 네트워크 태그도 되지만 VM을 고칠 수 있는 사람이 붙일 수 있어 서비스 계정이 더 안전합니다.',
     azure:'애플리케이션 보안 그룹(ASG)을 NIC에 붙이고 NSG 규칙의 출처·대상으로 씁니다.',
     so:'쿠버네티스 위라면 노드 단위 규칙으로는 파드를 구분하지 못합니다. 네트워크 정책(Calico·Cilium·GKE Dataplane V2)이나 파드 보안 그룹을 함께 씁니다.'},
    {t:'다른 팀 서비스를 어떻게 여는가',
     p:'네트워크를 통째로 잇는 피어링·TGW와 서비스 하나만 내주는 비공개 서비스 게시는 성격이 다릅니다.',
     aws:'피어링·TGW는 대역이 겹치면 불가능하고 VPC 전체가 서로 보입니다. PrivateLink는 NLB 뒤 서비스 하나만, 소비자 VPC 안의 IP로 보입니다.',
     gcp:'VPC 피어링은 대역 겹침 불가, 서브넷 경로 전체 교환입니다. PSC는 서비스 연결 하나만 소비자 VPC의 IP로 보입니다.',
     azure:'VNet 피어링은 주소 공간 겹침 불가입니다. Private Link 서비스는 내부 LB 뒤 서비스 하나만 Private Endpoint로 보입니다.',
     so:'팀 경계를 넘는 호출은 기본을 비공개 서비스 게시로 두고, 양방향 대량 통신이 필요할 때만 네트워크 연결을 검토합니다.'},
    {t:'생산자는 누구를 출발지로 보는가',
     p:'결제팀이 로그와 방화벽에서 "누가 불렀는지"를 알아야 할 때가 있습니다.',
     aws:'NLB는 기본으로 소비자 엔드포인트의 IP를 출발지로 넘기지 않고 NLB 대역이 보입니다. 프록시 프로토콜 v2를 켜면 연결 정보를 받을 수 있습니다.',
     gcp:'PSC NAT 서브넷 대역이 보입니다. 서비스 연결에서 프록시 프로토콜을 켜면 소비자 정보를 받을 수 있습니다.',
     azure:'NAT IP 구성의 IP가 보입니다. TCP 프록시 v2를 켜면 원래 정보와 Private Endpoint 식별자를 받을 수 있습니다.',
     so:'호출자 식별은 IP보다 mTLS 인증서나 토큰으로 하는 것이 안정적입니다.'}
  ],

  iac: 'iac/scenario-19',
  checklist: [
    ['서비스 간 규칙을 서브넷 대역으로 쓴다','같은 서브넷의 모든 서버가 허용됩니다. 보안 그룹 참조·서비스 계정·ASG로 씁니다.'],
    ['Azure NSG에 허용 규칙만 넣는다','AllowVnetInBound 기본 규칙 때문에 나머지도 열려 있습니다.'],
    ['GCP 생산자 방화벽에 소비자 대역을 넣는다','생산자는 PSC NAT 대역만 봅니다.'],
    ['Azure Private Link 서비스 서브넷 정책을 끄지 않는다','NAT IP 구성이 만들어지지 않습니다.'],
    ['엔드포인트 DNS를 빠뜨린다','서비스 이름이 공인 주소나 다른 IP로 풀려 연결이 실패합니다.'],
    ['역방향 호출이 될 거라 기대한다','비공개 서비스 게시는 한 방향입니다. 콜백은 따로 설계합니다.']
  ],
  refs: [
    ['AWS: PrivateLink로 서비스 공유','https://docs.aws.amazon.com/vpc/latest/privatelink/privatelink-share-your-services.html'],
    ['Google Cloud: 게시된 서비스 (PSC)','https://cloud.google.com/vpc/docs/private-service-connect#published-services'],
    ['Google Cloud: 서비스 계정으로 방화벽 필터링','https://cloud.google.com/firewall/docs/firewalls#serviceaccounts'],
    ['Azure: Private Link 서비스','https://learn.microsoft.com/azure/private-link/private-link-service-overview'],
    ['Azure: 애플리케이션 보안 그룹','https://learn.microsoft.com/azure/virtual-network/application-security-groups']
  ],
  next: '시나리오 20 · 관리형 서비스로 가는 비공개 경로'
};
