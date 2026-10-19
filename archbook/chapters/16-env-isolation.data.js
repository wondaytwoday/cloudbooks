window.SCENARIO = {
  no: 16, level: 'network', title: '개발·운영 분리와 공용 서비스',
  lede: '개발(dev)과 운영(prod) 서버가 서로를 볼 수 없어야 합니다. 그런데 둘 다 같은 CI 러너와 아티팩트 저장소는 써야 하고, CI는 운영에 배포까지 해야 합니다. "서로는 막고 공용은 열기"를 AWS는 Transit Gateway 라우팅 테이블로, GCP는 피어링이 전이되지 않는 성질로, Azure는 허브 방화벽으로 만듭니다. 같은 요구를 서로 다른 지점에서 막는다는 점을 경로 추적으로 확인하세요.',
  region: {aws:'계정 3개: dev · prod · shared', gcp:'프로젝트 3개: dev · prod · shared', azure:'구독 3개: dev · prod · 연결(허브)'},
  req: [
    {k:'환경', v:'dev · prod', s:'계정(프로젝트·구독)부터 분리'},
    {k:'차단', v:'dev ↔ prod 모든 통신', s:'실수로 dev가 운영 DB에 붙는 사고 방지'},
    {k:'공용', v:'CI 러너, 아티팩트 저장소', s:'두 환경이 함께 사용'},
    {k:'배포', v:'CI → prod 앱', s:'22·443만'},
    {k:'대역', v:'shared 10.0/16 · dev 10.10/16 · prod 10.20/16', s:'처음부터 겹치지 않게'}
  ],
  intro: {
    arch: '세 개의 네트워크가 가운데 연결 장치를 통해 이어져 있습니다. <b>dev 앱 → prod DB</b>를 골라 각 클라우드가 어디에서 이 통신을 끊는지 비교해 보세요. AWS는 라우팅 테이블에 경로가 없어서, GCP는 피어링이 없어서, Azure는 방화벽 규칙이 없어서 막힙니다.'
  },

  diagram: {
    aws: { w: 700, h: 560, aria: 'AWS: dev·prod·shared VPC가 Transit Gateway에 연결, 연결마다 다른 TGW 라우팅 테이블',
      frames: [
        {id:'dev', kind:'net', x:14, y:60, w:326, h:200, label:'dev 계정 · vpc-dev 10.10.0.0/16', cfg:'vpc'},
        {id:'prod', kind:'net', x:360, y:60, w:326, h:200, label:'prod 계정 · vpc-prod 10.20.0.0/16', cfg:'vpc'},
        {id:'shared', kind:'net', x:14, y:388, w:672, h:156, label:'shared 계정 · vpc-shared 10.0.0.0/16', cfg:'vpc'}
      ],
      nodes: [
        {id:'devapp', x:28, y:92, w:176, h:42, icon:'vm', t:'dev 앱', s:'10.10.10.0/24', cfg:'vmgroup'},
        {id:'devsg', kind:'chip', x:212, y:104, t:'SG: 아웃바운드 전체', cfg:'firewall'},
        {id:'devdb', x:28, y:160, w:176, h:42, icon:'db', t:'dev DB', s:'10.10.20.0/24'},
        {id:'devrt', kind:'chip', x:28, y:226, t:'rt-dev: 10.0.0.0/8 → tgw', cfg:'route', why:'사내 대역 전체를 TGW로 보냅니다. 어디까지 갈 수 있는지는 VPC가 아니라 TGW 라우팅 테이블이 정합니다.'},
        {id:'prodapp', x:374, y:92, w:176, h:42, icon:'vm', t:'prod 앱', s:'10.20.10.0/24', cfg:'vmgroup'},
        {id:'prodsg', kind:'chip', x:558, y:104, t:'SG ← CI 22·443', cfg:'firewall', why:'운영 앱은 shared의 CI 서브넷(10.0.1.0/24)에서 오는 22·443만 받습니다.'},
        {id:'proddb', x:374, y:160, w:176, h:42, icon:'db', t:'prod DB', s:'10.20.20.0/24'},
        {id:'proddbsg', kind:'chip', x:558, y:172, t:'SG ← prod 앱', cfg:'firewall'},
        {id:'prodrt', kind:'chip', x:374, y:226, t:'rt-prod: 10.0.0.0/8 → tgw', cfg:'route'},
        {id:'tgw', x:250, y:290, w:200, h:46, icon:'router', t:'Transit Gateway', s:'shared 계정 · RAM 공유', kind:'reg', cfg:'hubnet', why:'기본 연결·전파를 끄고, 연결마다 라우팅 테이블을 따로 줍니다. 이 테이블 구성이 곧 환경 분리 정책입니다.'},
        {id:'tgwdev', kind:'chip', x:22, y:302, t:'tgw-rt-dev: 10.0/16만', cfg:'hubnet', why:'dev 연결이 조회하는 테이블입니다. shared 연결만 전파되어 있고 prod 대역은 없습니다.'},
        {id:'tgwprod', kind:'chip', x:510, y:302, t:'tgw-rt-prod: 10.0/16만', cfg:'hubnet'},
        {id:'tgwsh', kind:'chip', x:250, y:350, t:'tgw-rt-shared: 10.10 · 10.20', cfg:'hubnet', why:'shared 연결은 dev와 prod 모두로 갈 수 있습니다. CI가 양쪽에 배포할 수 있는 이유입니다.'},
        {id:'ci', x:30, y:440, w:190, h:44, icon:'workflow', t:'CI 러너', s:'10.0.1.0/24', cfg:'vmgroup'},
        {id:'art', x:270, y:446, w:200, h:44, icon:'registry', t:'아티팩트 저장소', s:'Nexus · 10.0.2.10'},
        {id:'artsg', kind:'chip', x:270, y:412, t:'SG ← 10.10/16 · 10.20/16 :443', cfg:'firewall'},
        {id:'shrt', kind:'chip', x:30, y:508, t:'rt-shared: 10.10 · 10.20 → tgw', cfg:'route', why:'돌아가는 경로도 있어야 합니다. shared VPC의 라우팅 테이블에도 dev·prod 대역을 TGW로 넣습니다.'}
      ],
      edges: [
        {a:'devrt', b:'tgw', dash:'both'}, {a:'prodrt', b:'tgw', dash:'both'}, {a:'tgwsh', b:'art', dash:'both'}
      ]
    },

    gcp: { w: 700, h: 560, aria: 'GCP: vpc-dev와 vpc-prod가 각각 vpc-shared와 피어링, dev와 prod 사이에는 피어링 없음',
      frames: [
        {id:'dev', kind:'net', x:14, y:60, w:326, h:200, label:'dev 프로젝트 · vpc-dev 10.10.0.0/16', cfg:'vpc'},
        {id:'prod', kind:'net', x:360, y:60, w:326, h:200, label:'prod 프로젝트 · vpc-prod 10.20.0.0/16', cfg:'vpc'},
        {id:'shared', kind:'net', x:14, y:388, w:672, h:156, label:'shared 프로젝트 · vpc-shared 10.0.0.0/16', cfg:'vpc'}
      ],
      nodes: [
        {id:'devapp', x:28, y:92, w:176, h:42, icon:'vm', t:'dev 앱', s:'sa-dev-app', cfg:'vmgroup'},
        {id:'devfw', kind:'chip', x:212, y:104, t:'이그레스 묵시적 허용', cfg:'firewall'},
        {id:'devdb', x:28, y:160, w:176, h:42, icon:'db', t:'dev DB', s:'10.10.20.0/24'},
        {id:'devroutes', kind:'chip', x:28, y:226, t:'vpc-dev 경로: 10.10 · 10.0 (피어링)', cfg:'route', why:'피어링으로 받은 shared 서브넷 경로만 있습니다. prod 대역 경로는 어디에서도 받지 않았습니다.'},
        {id:'prodapp', x:374, y:92, w:176, h:42, icon:'vm', t:'prod 앱', s:'sa-prod-app', cfg:'vmgroup'},
        {id:'prodfw', kind:'chip', x:558, y:104, t:'FW ← CI 22·443', cfg:'firewall', why:'vpc-prod 방화벽: 출처 10.0.1.0/24(CI), 대상 서비스 계정 sa-prod-app.'},
        {id:'proddb', x:374, y:160, w:176, h:42, icon:'db', t:'prod DB', s:'10.20.20.0/24'},
        {id:'proddbfw', kind:'chip', x:558, y:172, t:'FW ← sa-prod-app', cfg:'firewall'},
        {id:'prodroutes', kind:'chip', x:374, y:226, t:'vpc-prod 경로: 10.20 · 10.0 (피어링)', cfg:'route'},
        {id:'peerdev', kind:'chip', x:60, y:310, t:'피어링 vpc-dev ↔ vpc-shared', cfg:'peering'},
        {id:'nopeer', x:262, y:296, w:176, h:46, t:'dev ↔ prod 피어링 없음', s:'피어링은 전이되지 않음', kind:'ghost', cfg:'peering'},
        {id:'peerprod', kind:'chip', x:460, y:310, t:'피어링 vpc-prod ↔ vpc-shared', cfg:'peering'},
        {id:'ci', x:30, y:440, w:190, h:44, icon:'workflow', t:'CI 러너', s:'10.0.1.0/24 · sa-ci', cfg:'vmgroup'},
        {id:'art', x:270, y:446, w:200, h:44, icon:'registry', t:'아티팩트 저장소', s:'10.0.2.10 · sa-artifact'},
        {id:'artfw', kind:'chip', x:270, y:412, t:'FW ← 10.10/16 · 10.20/16 :443', cfg:'firewall', why:'vpc-shared 방화벽 규칙입니다. 피어링으로 들어오는 트래픽도 받는 쪽 VPC의 방화벽을 통과해야 합니다.'},
        {id:'shroutes', kind:'chip', x:30, y:508, t:'경로: 10.10·10.20 (피어링)', cfg:'route'}
      ],
      edges: [
        {a:'peerdev', b:'ci', dash:'both'}, {a:'peerprod', b:'shroutes', dash:'both'}
      ]
    },

    azure: { w: 700, h: 560, aria: 'Azure: dev·prod 스포크 VNet이 허브 VNet과 피어링, 스포크의 UDR이 허브의 Azure Firewall로 보냄',
      frames: [
        {id:'dev', kind:'net', x:14, y:60, w:326, h:200, label:'dev 구독 · vnet-dev 10.10.0.0/16', cfg:'vpc'},
        {id:'prod', kind:'net', x:360, y:60, w:326, h:200, label:'prod 구독 · vnet-prod 10.20.0.0/16', cfg:'vpc'},
        {id:'shared', kind:'net', x:14, y:340, w:672, h:204, label:'연결 구독 · vnet-hub 10.0.0.0/16', cfg:'hubnet'}
      ],
      nodes: [
        {id:'devapp', x:28, y:92, w:176, h:42, icon:'vm', t:'dev 앱', s:'snet-app 10.10.10.0/24', cfg:'vmgroup'},
        {id:'devnsg', kind:'chip', x:212, y:104, t:'NSG: 아웃바운드 기본', cfg:'firewall'},
        {id:'devdb', x:28, y:160, w:176, h:42, icon:'db', t:'dev DB', s:'10.10.20.0/24'},
        {id:'devudr', kind:'chip', x:28, y:226, t:'rt-dev(UDR): 0/0 · 10/8 → 10.0.0.4', cfg:'route', why:'인터넷(0/0)과 사설 대역(10.0.0.0/8)을 허브 방화벽으로 보냅니다. 10.0.0.0/8 UDR은 Azure가 기본으로 넣어 두는 "10.0.0.0/8 → 다음 홉 없음" 시스템 경로를 덮어씁니다. 허브 대역 10.0.0.0/16은 피어링 시스템 경로가 더 구체적이라 방화벽을 거치지 않습니다.'},
        {id:'prodapp', x:374, y:92, w:176, h:42, icon:'vm', t:'prod 앱', s:'snet-app 10.20.10.0/24', cfg:'vmgroup'},
        {id:'prodnsg', kind:'chip', x:558, y:104, t:'NSG ← CI 22·443', cfg:'firewall', why:'nsg-prod-app: 출처 10.0.1.0/24(CI 서브넷).'},
        {id:'proddb', x:374, y:160, w:176, h:42, icon:'db', t:'prod DB', s:'10.20.20.0/24'},
        {id:'proddbnsg', kind:'chip', x:558, y:172, t:'NSG ← prod 앱', cfg:'firewall'},
        {id:'produdr', kind:'chip', x:374, y:226, t:'rt-prod(UDR): 0/0 · 10/8 → 10.0.0.4', cfg:'route'},
        {id:'peerdev', kind:'chip', x:60, y:290, t:'피어링 dev ↔ hub', cfg:'peering'},
        {id:'peerprod', kind:'chip', x:500, y:290, t:'피어링 prod ↔ hub', cfg:'peering'},
        {id:'fw', x:440, y:380, w:230, h:46, icon:'fw', t:'Azure Firewall', s:'10.0.0.4 · 기본 거부', kind:'reg', cfg:'egressfw', why:'스포크끼리는 피어링이 없으므로, UDR로 보낸 트래픽을 방화벽이 규칙에 따라 넘기거나 버립니다. dev ↔ prod 허용 규칙은 만들지 않습니다.'},
        {id:'fwrule', kind:'chip', x:440, y:434, t:'규칙: dev·prod → 인터넷 443만', cfg:'egressfw'},
        {id:'ci', x:30, y:418, w:190, h:44, icon:'workflow', t:'CI 러너', s:'snet-ci 10.0.1.0/24', cfg:'vmgroup'},
        {id:'art', x:236, y:418, w:190, h:44, icon:'registry', t:'아티팩트 저장소', s:'snet-art 10.0.2.10'},
        {id:'artnsg', kind:'chip', x:236, y:386, t:'NSG ← 10.10 · 10.20 :443', cfg:'firewall'},
        {id:'hubroute', kind:'chip', x:30, y:500, t:'허브 시스템 경로: 10.10 · 10.20 (피어링)', cfg:'peering'}
      ],
      edges: [
        {a:'peerdev', b:'ci', dash:'both'}, {a:'peerprod', b:'fw', dash:'both'}
      ]
    }
  },

  flows: [
    {id:'devprod', t:'dev 앱 → prod DB (3306)',
     d:'개발자가 dev 앱 설정에 운영 DB 주소를 잘못 넣었습니다.',
     hops:{
      aws:[{n:'devapp', t:'dev 앱 10.10.10.5', r:'보안 그룹 아웃바운드 전체 허용', cfg:'firewall'},
           {n:'devrt', t:'rt-dev', r:'10.20.20.10은 10.0.0.0/8에 해당 → TGW로', cfg:'route'},
           {n:'tgw', t:'Transit Gateway', r:'dev VPC 연결은 tgw-rt-dev 테이블로 다음 홉을 찾음', cfg:'hubnet'},
           {n:'tgwdev', t:'tgw-rt-dev', r:'10.20.0.0/16 경로 없음 → 패킷 버림 (prod 연결이 이 테이블에 전파되지 않음)', cfg:'hubnet', ok:false},
           {n:'proddbsg', t:'prod DB 보안 그룹', r:'설령 닿아도 prod 앱 보안 그룹만 허용', cfg:'firewall'}],
      gcp:[{n:'devapp', t:'dev 앱', r:'이그레스 묵시적 허용', cfg:'firewall'},
           {n:'devroutes', t:'vpc-dev 경로 테이블', r:'10.20.0.0/16 경로가 없음. vpc-shared가 prod 경로를 알지만 피어링은 전이되지 않음', cfg:'route', ok:false},
           {n:'nopeer', t:'dev ↔ prod 피어링', r:'만들지 않았음', cfg:'peering'},
           {n:'proddbfw', t:'vpc-prod 방화벽', r:'설령 닿아도 sa-prod-app만 허용', cfg:'firewall'}],
      azure:[{n:'devapp', t:'dev 앱', r:'NSG 아웃바운드 기본 허용', cfg:'firewall'},
           {n:'devudr', t:'rt-dev (UDR)', r:'10.20.20.10에 맞는 가장 구체적인 경로는 UDR 10.0.0.0/8 → 방화벽 10.0.0.4 (prod와는 피어링이 없음)', cfg:'route'},
           {n:'peerdev', t:'피어링 dev ↔ hub', r:'전달된 트래픽 허용으로 방화벽까지 도달', cfg:'peering'},
           {n:'fw', t:'Azure Firewall', r:'10.10.0.0/16 → 10.20.0.0/16 허용 규칙 없음 → 기본 거부, 로그 기록', cfg:'egressfw', ok:false},
           {n:'proddbnsg', t:'prod DB NSG', r:'설령 닿아도 prod 앱만 허용', cfg:'firewall'}]
     },
     note:{aws:'차단 지점은 TGW 라우팅 테이블입니다. 보안 그룹은 두 번째 방어선입니다. TGW에서 "기본 라우팅 테이블 전파"를 켜 두면 이 분리가 한 번에 무너집니다.', gcp:'차단 지점은 경로가 아예 없다는 사실입니다. 언젠가 누가 dev ↔ prod 피어링을 만들면 방화벽만 남으므로, 조직 정책이나 IAM으로 피어링 생성 권한을 묶어 둡니다.', azure:'차단 지점은 방화벽 규칙입니다. 방화벽 로그에 거부 기록이 남아 사고를 바로 알 수 있습니다. UDR을 빠뜨린 서브넷이 있으면 트래픽은 10.0.0.0/8 시스템 경로(다음 홉 없음)에서 버려져 결과는 같지만, 기록이 남지 않습니다.'}},
    {id:'art', t:'dev 앱 → 아티팩트 저장소 (443)',
     d:'dev 앱이 빌드 의존성을 내려받습니다.',
     hops:{
      aws:[{n:'devapp', t:'dev 앱', r:'아웃바운드 허용', cfg:'firewall'},
           {n:'devrt', t:'rt-dev', r:'10.0.2.10 → 10.0.0.0/8 → TGW', cfg:'route'},
           {n:'tgwdev', t:'tgw-rt-dev', r:'10.0.0.0/16 → shared VPC 연결 (전파됨)', cfg:'hubnet'},
           {n:'tgw', t:'Transit Gateway', r:'shared VPC 연결로 전달', cfg:'hubnet'},
           {n:'artsg', t:'아티팩트 저장소 보안 그룹', r:'443 ← 10.10.0.0/16 허용 (다른 VPC라 보안 그룹 참조 대신 CIDR)', cfg:'firewall'},
           {n:'art', t:'아티팩트 저장소', r:'응답: rt-shared의 10.10.0.0/16 → tgw, tgw-rt-shared → dev 연결'}],
      gcp:[{n:'devapp', t:'dev 앱', r:'이그레스 허용', cfg:'firewall'},
           {n:'devroutes', t:'vpc-dev 경로', r:'10.0.0.0/16 → 피어링 (서브넷 경로 자동 교환)', cfg:'route'},
           {n:'peerdev', t:'피어링 vpc-dev ↔ vpc-shared', r:'양쪽에서 만들어 활성 상태', cfg:'peering'},
           {n:'artfw', t:'vpc-shared 방화벽', r:'인그레스 443 ← 10.10.0.0/16, 10.20.0.0/16, 대상 sa-artifact', cfg:'firewall'},
           {n:'art', t:'아티팩트 저장소', r:'응답은 상태 저장으로 허용'}],
      azure:[{n:'devapp', t:'dev 앱', r:'NSG 아웃바운드 허용', cfg:'firewall'},
           {n:'devudr', t:'rt-dev', r:'10.0.0.0/16 피어링 시스템 경로가 10.0.0.0/8 UDR보다 구체적 → 방화벽을 거치지 않고 직접', cfg:'route'},
           {n:'peerdev', t:'피어링 dev ↔ hub', r:'가상 네트워크 접근 허용', cfg:'peering'},
           {n:'artnsg', t:'nsg-art', r:'443 ← 10.10.0.0/16, 10.20.0.0/16', cfg:'firewall'},
           {n:'art', t:'아티팩트 저장소', r:'응답은 피어링 경로로 직접 돌아감'}]
     },
     note:{aws:'TGW를 지나므로 처리량 요금이 붙습니다. 대용량 아티팩트는 S3에 두고 각 VPC의 게이트웨이 엔드포인트로 받는 편이 쌉니다.', gcp:'VPC 사이에 경로 작업은 없지만, 받는 쪽 방화벽을 열지 않으면 연결이 시간 초과됩니다.', azure:'허브 대역은 방화벽을 우회합니다. 허브 서비스까지 방화벽 검사를 하려면 UDR에 같은 길이의 10.0.0.0/16 → 방화벽을 추가하고(같은 접두사면 UDR이 시스템 경로보다 우선), 허브 서브넷에도 돌아오는 UDR을 넣어 경로를 대칭으로 맞춰야 합니다.'}},
    {id:'deploy', t:'CI 러너 → prod 앱 배포 (22·443)',
     d:'shared의 CI 러너가 운영 앱에 새 버전을 배포합니다.',
     hops:{
      aws:[{n:'ci', t:'CI 러너 10.0.1.20', r:'보안 그룹 아웃바운드 허용', cfg:'firewall'},
           {n:'shrt', t:'rt-shared', r:'10.20.0.0/16 → tgw', cfg:'route'},
           {n:'tgwsh', t:'tgw-rt-shared', r:'10.20.0.0/16 → prod VPC 연결 (전파됨)', cfg:'hubnet'},
           {n:'tgw', t:'Transit Gateway', r:'prod VPC 연결로 전달', cfg:'hubnet'},
           {n:'prodsg', t:'prod 앱 보안 그룹', r:'22·443 ← 10.0.1.0/24(CI 서브넷)', cfg:'firewall'},
           {n:'prodapp', t:'prod 앱', r:'응답은 rt-prod의 10.0.0.0/8 → tgw → tgw-rt-prod → shared'}],
      gcp:[{n:'ci', t:'CI 러너', r:'이그레스 허용', cfg:'firewall'},
           {n:'shroutes', t:'vpc-shared 경로', r:'10.20.0.0/16 → 피어링 vpc-prod', cfg:'route'},
           {n:'peerprod', t:'피어링 vpc-prod ↔ vpc-shared', r:'활성', cfg:'peering'},
           {n:'prodfw', t:'vpc-prod 방화벽', r:'22·443 ← 10.0.1.0/24, 대상 sa-prod-app', cfg:'firewall'},
           {n:'prodapp', t:'prod 앱', r:'응답은 상태 저장으로 허용'}],
      azure:[{n:'ci', t:'CI 러너', r:'NSG 아웃바운드 허용', cfg:'firewall'},
           {n:'hubroute', t:'허브 시스템 경로', r:'10.20.0.0/16 → 피어링 prod (허브 서브넷에는 UDR 없음)', cfg:'peering'},
           {n:'peerprod', t:'피어링 prod ↔ hub', r:'가상 네트워크 접근 허용', cfg:'peering'},
           {n:'prodnsg', t:'nsg-prod-app', r:'22·443 ← 10.0.1.0/24', cfg:'firewall'},
           {n:'prodapp', t:'prod 앱', r:'응답: prod의 10.0.0.0/16 피어링 경로가 10.0.0.0/8 UDR보다 구체적이라 직접 돌아감'}]
     },
     note:'CI가 운영에 닿을 수 있다는 것은 CI가 뚫리면 운영도 뚫린다는 뜻입니다. 운영 배포 러너를 따로 두거나, 배포를 끌어오기(pull) 방식(GitOps, Systems Manager·OS Config 등)으로 바꾸면 이 경로 자체를 없앨 수 있습니다.'}
  ],

  scope: ['account','hubnet','peering','route','firewall','egressfw'],
  build: {
    aws: [
      {t:'계정 3개 · 겹치지 않는 CIDR', d:'shared 10.0/16, dev 10.10/16, prod 10.20/16', cfg:'account', nodes:['dev','prod','shared']},
      {t:'Transit Gateway', d:'기본 연결·기본 전파 끄기', cfg:'hubnet', nodes:['tgw']},
      {t:'RAM으로 dev·prod 계정에 공유', d:'', cfg:'hubnet', nodes:['tgw']},
      {t:'VPC 연결 3개', d:'각 VPC의 AZ별 서브넷 지정', cfg:'hubnet', nodes:['tgw','devrt','prodrt','shrt']},
      {t:'TGW 라우팅 테이블 3개', d:'dev·prod 테이블에는 shared만 전파, shared 테이블에는 dev·prod 전파', cfg:'hubnet', nodes:['tgwdev','tgwprod','tgwsh']},
      {t:'각 VPC 라우팅 테이블', d:'dev·prod: 10.0.0.0/8 → tgw, shared: 10.10·10.20 → tgw', cfg:'route', nodes:['devrt','prodrt','shrt']},
      {t:'보안 그룹', d:'다른 VPC는 CIDR로 지정', cfg:'firewall', nodes:['artsg','prodsg','proddbsg']}
    ],
    gcp: [
      {t:'프로젝트 3개 · VPC 3개', d:'겹치지 않는 대역', cfg:'account', nodes:['dev','prod','shared']},
      {t:'피어링 vpc-dev ↔ vpc-shared', d:'양쪽에서 각각 생성', cfg:'peering', nodes:['peerdev']},
      {t:'피어링 vpc-prod ↔ vpc-shared', d:'양쪽에서 각각 생성', cfg:'peering', nodes:['peerprod']},
      {t:'경로 확인', d:'서브넷 경로 자동 교환, dev ↔ prod는 전이되지 않음', cfg:'route', nodes:['devroutes','prodroutes','shroutes','nopeer'], auto:true},
      {t:'vpc-shared 방화벽', d:'443 ← dev·prod 대역, 대상 sa-artifact', cfg:'firewall', nodes:['artfw']},
      {t:'vpc-prod 방화벽', d:'22·443 ← CI 서브넷, 대상 sa-prod-app', cfg:'firewall', nodes:['prodfw','proddbfw']},
      {t:'피어링 생성 권한 통제', d:'네트워크 관리자 역할을 소수에게만', cfg:'guardrail'}
    ],
    azure: [
      {t:'구독 3개 · VNet 3개', d:'허브는 연결 구독', cfg:'account', nodes:['dev','prod','shared']},
      {t:'허브: AzureFirewallSubnet + Azure Firewall', d:'방화벽 정책', cfg:'egressfw', nodes:['fw']},
      {t:'피어링 허브 ↔ dev, 허브 ↔ prod', d:'전달된 트래픽 허용', cfg:'peering', nodes:['peerdev','peerprod']},
      {t:'스포크 UDR', d:'0/0과 10.0.0.0/8 → 방화벽 사설 IP, 각 스포크 서브넷에 연결', cfg:'route', nodes:['devudr','produdr']},
      {t:'방화벽 규칙', d:'dev·prod → 인터넷 443만. 스포크 간 규칙은 만들지 않음', cfg:'egressfw', nodes:['fwrule']},
      {t:'NSG', d:'아티팩트·prod 앱·prod DB', cfg:'firewall', nodes:['artnsg','prodnsg','proddbnsg']}
    ]
  },

  map: ['account-unit','network-hub','network','route-table','firewall','egress-filter'],

  decisions: [
    {t:'dev ↔ prod를 어디에서 끊는가',
     p:'같은 결과라도 끊는 지점에 따라 실수에 대한 내성과 기록이 달라집니다.',
     aws:'TGW 라우팅 테이블에서 끊습니다. 경로가 없으니 보안 그룹을 아무리 열어도 닿지 않습니다. 대신 TGW 테이블 설정 실수 하나가 전체 분리를 무너뜨립니다.',
     gcp:'피어링을 만들지 않는 것으로 끊습니다. 피어링은 전이되지 않으므로 shared를 사이에 둬도 dev와 prod는 서로를 모릅니다.',
     azure:'허브 방화벽에서 끊습니다. 스포크 간 트래픽이 모두 방화벽을 지나 로그가 남고, 필요한 예외를 규칙으로 정밀하게 열 수 있습니다. 방화벽 비용이 듭니다.',
     so:'경로 차단(AWS·GCP)은 단순하고 싸며, 방화벽 차단(Azure)은 보이고 세밀합니다. AWS도 TGW 앞에 Network Firewall을 두면 Azure와 같은 구조가 됩니다.'},
    {t:'환경을 계정으로 나눌까, 네트워크로 나눌까',
     p:'같은 VPC 안에 dev 서브넷과 prod 서브넷을 두고 보안 그룹·방화벽으로만 나눌 수도 있습니다.',
     aws:'같은 VPC 안의 서브넷끼리는 local 경로로 항상 통신 가능합니다. 막을 수 있는 것은 보안 그룹과 NACL뿐입니다.',
     gcp:'같은 VPC 안이면 경로가 있으므로 방화벽 규칙(대상 서비스 계정)으로만 막습니다.',
     azure:'같은 VNet 안의 서브넷끼리는 시스템 경로로 통신 가능하며, NSG 기본 규칙 AllowVnetInBound가 허용합니다. NSG에서 명시적으로 거부해야 합니다.',
     so:'환경 분리는 계정(프로젝트·구독)부터 나누는 것이 원칙입니다. 권한, 비용, 할당량, 네트워크가 한꺼번에 분리됩니다.'},
    {t:'shared가 dev·prod를 모두 볼 수 있어도 되는가',
     p:'공용 서비스는 두 환경의 교차점이라, 여기가 뚫리면 분리가 의미를 잃습니다.',
     aws:'tgw-rt-shared에 dev·prod를 모두 전파하면 shared의 모든 서버가 양쪽에 닿습니다. 보안 그룹으로 CI 서브넷만 허용합니다.',
     gcp:'피어링은 서브넷 경로를 통째로 교환합니다. 방화벽 대상을 서비스 계정으로 좁혀 CI만 운영에 닿게 합니다.',
     azure:'허브 서브넷에서 스포크로 가는 트래픽은 피어링 경로로 바로 갑니다. 운영 쪽 NSG에서 CI 서브넷만 허용합니다.',
     so:'운영 배포는 별도 러너로 분리하거나, 운영이 저장소에서 끌어오는(pull) 방식으로 바꾸면 shared → prod 경로를 아예 없앨 수 있습니다.'}
  ],

  iac: 'iac/scenario-16',
  checklist: [
    ['처음부터 CIDR이 겹친다','dev와 prod를 같은 10.0.0.0/16으로 만들면 나중에 공용 서비스에 둘 다 연결할 수 없습니다. 환경마다 대역을 미리 나눠 둡니다.'],
    ['AWS TGW 기본 라우팅 테이블 전파를 켜 둔다','모든 VPC가 서로의 경로를 알게 되어 분리가 무너집니다.'],
    ['돌아오는 경로를 빠뜨린다','AWS는 shared 쪽 라우팅 테이블, Azure는 허브 서브넷의 경로가 없으면 요청은 가는데 응답이 돌아오지 않습니다.'],
    ['Azure 스포크 UDR에 0/0만 넣는다','사설 대역은 10.0.0.0/8 같은 시스템 경로(다음 홉 없음)가 0/0보다 구체적이라 방화벽까지 가지도 않고 버려집니다. 사설 대역 UDR도 넣습니다.'],
    ['Azure 허브 대역이 방화벽을 우회하는 것을 모른다','10.0.0.0/8 UDR보다 피어링 경로 10.0.0.0/16이 구체적입니다. 검사가 필요하면 같은 길이의 UDR을 넣습니다.'],
    ['GCP 피어링이 서로 연결된 줄 안다','A-B, B-C 피어링이 있어도 A와 C는 통신하지 못합니다. 전이가 필요하면 NCC나 VPN·라우터 장비를 씁니다.'],
    ['같은 VPC 안에서 보안 그룹만으로 환경을 나눈다','규칙 하나 실수로 전체가 열립니다. 계정 분리가 먼저입니다.']
  ],
  refs: [
    ['AWS: Transit Gateway 라우팅 테이블','https://docs.aws.amazon.com/vpc/latest/tgw/tgw-route-tables.html'],
    ['Google Cloud: VPC 네트워크 피어링','https://cloud.google.com/vpc/docs/vpc-peering'],
    ['Azure: 허브-스포크 네트워크 토폴로지','https://learn.microsoft.com/azure/architecture/networking/architecture/hub-spoke'],
    ['Azure: 가상 네트워크 트래픽 라우팅','https://learn.microsoft.com/azure/virtual-network/virtual-networks-udr-overview']
  ],
  next: '시나리오 17 · 사내 전용 관리자 페이지'
};
