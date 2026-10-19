window.SCENARIO = {
  no: 23, level: 'hybrid', title: '사내 서버가 전용선으로 관리형 서비스 쓰기',
  lede: '사내 배치 서버가 매일 밤 클라우드 오브젝트 스토리지에 백업을 올리고, 클라우드 관리형 DB에서 데이터를 읽습니다. 인터넷이 아니라 전용선으로 가야 합니다. VM끼리라면 경로만 맞으면 되지만, 관리형 서비스는 "그 서비스의 사설 입구가 어디 있는지"와 "사내 DNS가 그 입구를 가리키는지"가 맞아야 합니다. VPC 안에서는 잘 되던 방법이 사내에서는 통하지 않는 경우가 많습니다.',
  region: {aws:'Direct Connect → TGW → vpc-shared', gcp:'Interconnect → Cloud Router → vpc-shared', azure:'ExpressRoute → 허브 VNet'},
  req: [
    {k:'사내 서버', v:'배치·백업 서버', s:'192.168.30.0/24'},
    {k:'대상', v:'오브젝트 스토리지 · 관리형 PostgreSQL', s:'모두 클라우드 리전'},
    {k:'경로', v:'전용선만', s:'인터넷 경유 금지'},
    {k:'DNS', v:'서비스 기본 이름 그대로', s:'앱 설정을 바꾸지 않고'}
  ],
  intro: {
    arch: '<b>흔한 실수</b>를 먼저 골라 보세요. VPC 안에서 쓰던 방법(AWS 게이트웨이 엔드포인트, GCP 비공개 Google 액세스, Azure privatelink 영역)을 사내에 그대로 적용하면 어디서 막히는지 보입니다.'
  },

  diagram: {
    aws: { w: 700, h: 560, aria: 'AWS: 사내 서버와 사내 DNS, Direct Connect와 TGW, Resolver 인바운드 엔드포인트, S3·Secrets Manager 인터페이스 엔드포인트, RDS',
      frames: [
        {id:'corp', kind:'onprem', x:14, y:14, w:672, h:110, label:'사내 IDC 192.168.0.0/16'},
        {id:'vpc', kind:'net', x:14, y:220, w:440, h:326, label:'vpc-shared 10.0.0.0/16', cfg:'vpc'},
        {id:'svc', kind:'plain', x:468, y:310, w:218, h:236, label:'리전 서비스'}
      ],
      nodes: [
        {id:'srv', x:30, y:46, w:190, h:44, icon:'vm', t:'사내 백업 서버', s:'192.168.30.5'},
        {id:'corpdns', x:255, y:46, w:190, h:44, icon:'dns', t:'사내 DNS', s:'조건부 전달', cfg:'dnshybrid'},
        {id:'cpe', x:480, y:46, w:190, h:44, icon:'router', t:'사내 라우터', s:'BGP', cfg:'bgppref'},
        {id:'dx', x:480, y:150, w:190, h:44, icon:'dedicated', t:'Direct Connect', s:'전송 VIF', cfg:'dedicated'},
        {id:'cr', x:480, y:240, w:190, h:44, icon:'router', t:'Transit Gateway', s:'광고: 10.0.0.0/16', kind:'reg', cfg:'hubnet'},
        {id:'resolver', x:30, y:256, w:200, h:44, icon:'dns', t:'Resolver 인바운드', s:'10.0.0.10 · 10.0.1.10', cfg:'dnshybrid'},
        {id:'s3if', x:30, y:330, w:200, h:44, icon:'privlink', t:'S3 인터페이스 엔드포인트', s:'ENI 10.0.0.50 · 비공개 DNS', cfg:'privlink', why:'게이트웨이 엔드포인트와 달리 VPC 안에 사설 IP를 가진 ENI가 생겨 전용선 너머 사내에서도 닿을 수 있습니다. 요금은 시간·처리량 기준입니다.'},
        {id:'s3gw', x:240, y:404, w:200, h:44, icon:'privlink', t:'S3 게이트웨이 엔드포인트', s:'VPC 라우팅 전용 · 사내 사용 불가', kind:'ghost', cfg:'privlink'},
        {id:'smif', x:30, y:404, w:200, h:44, icon:'privlink', t:'secretsmanager 엔드포인트', s:'ENI · 비공개 DNS', cfg:'privlink'},
        {id:'rds', x:240, y:470, w:200, h:44, icon:'pg', t:'RDS PostgreSQL', s:'10.0.20.x', cfg:'dbha'},
        {id:'sgdb', kind:'chip', x:30, y:482, t:'SG ← 192.168.30.0/24:5432', cfg:'firewall'},
        {id:'s3', x:480, y:340, w:194, h:44, icon:'obj', t:'S3 버킷', s:'aws:SourceVpce 조건', kind:'alt', cfg:'bucket'},
        {id:'sm', x:480, y:414, w:194, h:44, icon:'secret', t:'Secrets Manager', kind:'alt', cfg:'secret'}
      ],
      edges: [{a:'cpe', b:'dx'}, {a:'dx', b:'cr'}, {a:'s3if', b:'s3', dash:true}, {a:'smif', b:'sm', dash:true}]
    },

    gcp: { w: 700, h: 560, aria: 'GCP: 사내 서버와 사내 DNS, Interconnect와 Cloud Router 맞춤 광고, private.googleapis.com VIP, 비공개 서비스 액세스의 Cloud SQL',
      frames: [
        {id:'corp', kind:'onprem', x:14, y:14, w:672, h:110, label:'사내 IDC 192.168.0.0/16'},
        {id:'vpc', kind:'net', x:14, y:220, w:440, h:326, label:'vpc-shared · 전역', cfg:'vpc'},
        {id:'svc', kind:'plain', x:468, y:310, w:218, h:236, label:'Google API · 관리형 서비스'}
      ],
      nodes: [
        {id:'srv', x:30, y:46, w:190, h:44, icon:'vm', t:'사내 백업 서버', s:'192.168.30.5'},
        {id:'corpdns', x:255, y:46, w:190, h:44, icon:'dns', t:'사내 DNS', s:'googleapis.com 영역', cfg:'dnshybrid', why:'사내 DNS에 *.googleapis.com → private.googleapis.com CNAME과 199.36.153.8/30 A 레코드를 둡니다. Cloud DNS로 전달하지 않아도 됩니다.'},
        {id:'cpe', x:480, y:46, w:190, h:44, icon:'router', t:'사내 라우터', s:'BGP', cfg:'bgppref'},
        {id:'dx', x:480, y:150, w:190, h:44, icon:'dedicated', t:'Interconnect', s:'VLAN 연결', cfg:'dedicated'},
        {id:'cr', x:480, y:240, w:190, h:44, icon:'router', t:'Cloud Router', s:'맞춤 광고 모드', kind:'reg', cfg:'dedicated', why:'기본 광고는 VPC 서브넷만입니다. 맞춤 광고에 199.36.153.8/30(private.googleapis.com)과 Cloud SQL 할당 대역을 추가해야 사내가 그 경로를 압니다.'},
        {id:'resolver', kind:'chip', x:30, y:268, t:'광고 추가: 199.36.153.8/30 · 10.100.0.0/20', cfg:'dedicated'},
        {id:'s3if', x:30, y:330, w:200, h:44, icon:'privlink', t:'private.googleapis.com', s:'199.36.153.8/30 VIP', cfg:'privlink'},
        {id:'s3gw', x:240, y:404, w:200, h:44, icon:'privlink', t:'비공개 Google 액세스', s:'서브넷 설정 · VM 전용', kind:'ghost', cfg:'privlink'},
        {id:'smif', kind:'chip', x:30, y:448, t:'PSA 피어링: 커스텀 경로 내보내기·가져오기', cfg:'peering', why:'Cloud SQL이 있는 Google 관리 VPC가 사내 경로를 알아야 응답할 수 있습니다. 피어링에서 커스텀 경로 가져오기·내보내기를 켭니다.'},
        {id:'rds', x:240, y:470, w:200, h:44, icon:'pg', t:'Cloud SQL PostgreSQL', s:'비공개 IP 10.100.0.5', cfg:'dbha'},
        {id:'sgdb', kind:'chip', x:30, y:482, t:'승인: IAM DB 인증 · SSL', cfg:'dbha'},
        {id:'s3', x:480, y:340, w:194, h:44, icon:'obj', t:'Cloud Storage', s:'VPC SC 경계', kind:'alt', cfg:'bucket'},
        {id:'sm', x:480, y:414, w:194, h:44, icon:'secret', t:'Secret Manager', kind:'alt', cfg:'secret'}
      ],
      edges: [{a:'cpe', b:'dx'}, {a:'dx', b:'cr'}, {a:'s3if', b:'s3', dash:true}, {a:'s3if', b:'sm', dash:true}]
    },

    azure: { w: 700, h: 560, aria: 'Azure: 사내 서버와 사내 DNS, ExpressRoute 게이트웨이, DNS Private Resolver 인바운드, 스토리지·Key Vault Private Endpoint, PostgreSQL Flexible',
      frames: [
        {id:'corp', kind:'onprem', x:14, y:14, w:672, h:110, label:'사내 IDC 192.168.0.0/16'},
        {id:'vpc', kind:'net', x:14, y:220, w:440, h:326, label:'vnet-hub 10.0.0.0/16', cfg:'vpc'},
        {id:'svc', kind:'plain', x:468, y:310, w:218, h:236, label:'리소스 (공용 접근 끔)'}
      ],
      nodes: [
        {id:'srv', x:30, y:46, w:190, h:44, icon:'vm', t:'사내 백업 서버', s:'192.168.30.5'},
        {id:'corpdns', x:255, y:46, w:190, h:44, icon:'dns', t:'사내 DNS', s:'조건부 전달', cfg:'dnshybrid', why:'privatelink.* 영역이 아니라 서비스의 공용 영역(blob.core.windows.net 등)을 Resolver 인바운드로 전달합니다. 그래야 Azure가 CNAME을 따라 privatelink 레코드를 찾아 줍니다.'},
        {id:'cpe', x:480, y:46, w:190, h:44, icon:'router', t:'사내 라우터', s:'BGP', cfg:'bgppref'},
        {id:'dx', x:480, y:150, w:190, h:44, icon:'dedicated', t:'ExpressRoute', s:'프라이빗 피어링', cfg:'dedicated'},
        {id:'cr', x:480, y:240, w:190, h:44, icon:'router', t:'ExpressRoute 게이트웨이', s:'VNet 대역 광고', kind:'reg', cfg:'dedicated'},
        {id:'resolver', x:30, y:256, w:200, h:44, icon:'dns', t:'DNS Private Resolver', s:'인바운드 10.0.30.4', cfg:'dnshybrid'},
        {id:'s3if', x:30, y:330, w:200, h:44, icon:'privlink', t:'PE: 스토리지 (blob)', s:'10.0.40.4', cfg:'privlink'},
        {id:'s3gw', x:240, y:404, w:200, h:44, icon:'dns', t:'privatelink 영역 (VNet 연결)', s:'사내에서 직접 보이지 않음', kind:'ghost', cfg:'dns'},
        {id:'smif', x:30, y:404, w:200, h:44, icon:'privlink', t:'PE: Key Vault', s:'10.0.40.5', cfg:'privlink'},
        {id:'rds', x:240, y:470, w:200, h:44, icon:'pg', t:'PostgreSQL Flexible', s:'위임 서브넷 10.0.20.x', cfg:'dbha'},
        {id:'sgdb', kind:'chip', x:30, y:482, t:'NSG ← 192.168.30.0/24:5432', cfg:'firewall'},
        {id:'s3', x:480, y:340, w:194, h:44, icon:'obj', t:'스토리지 계정', s:'공용 접근 끔', kind:'alt', cfg:'bucket'},
        {id:'sm', x:480, y:414, w:194, h:44, icon:'secret', t:'Key Vault', kind:'alt', cfg:'secret'}
      ],
      edges: [{a:'cpe', b:'dx'}, {a:'dx', b:'cr'}, {a:'s3if', b:'s3', dash:true}, {a:'smif', b:'sm', dash:true}]
    }
  },

  flows: [
    {id:'obj', t:'사내 서버 → 오브젝트 스토리지 (백업 업로드)',
     d:'백업 서버가 서비스 기본 이름으로 업로드합니다.',
     hops:{
      aws:[{n:'srv', t:'사내 백업 서버', r:'s3.ap-northeast-2.amazonaws.com 질의'},
           {n:'corpdns', t:'사내 DNS', r:'amazonaws.com 하위 S3 이름을 Resolver 인바운드로 조건부 전달', cfg:'dnshybrid'},
           {n:'resolver', t:'Resolver 인바운드', r:'S3 인터페이스 엔드포인트의 비공개 DNS(인바운드 Resolver 전용 옵션)로 ENI IP 응답', cfg:'dnshybrid'},
           {n:'cpe', t:'사내 라우터', r:'10.0.0.0/16 → 전용선', cfg:'bgppref'},
           {n:'dx', t:'Direct Connect', r:'', cfg:'dedicated'},
           {n:'cr', t:'Transit Gateway', r:'vpc-shared 연결로', cfg:'hubnet'},
           {n:'s3if', t:'S3 인터페이스 엔드포인트', r:'보안 그룹 443 ← 192.168.30.0/24', cfg:'privlink'},
           {n:'s3', t:'S3 버킷', r:'버킷 정책 aws:SourceVpce', cfg:'bucket'}],
      gcp:[{n:'srv', t:'사내 백업 서버', r:'storage.googleapis.com 질의'},
           {n:'corpdns', t:'사내 DNS', r:'CNAME → private.googleapis.com → 199.36.153.8', cfg:'dnshybrid'},
           {n:'cpe', t:'사내 라우터', r:'Cloud Router가 광고한 199.36.153.8/30 경로로', cfg:'bgppref'},
           {n:'dx', t:'Interconnect', r:'', cfg:'dedicated'},
           {n:'cr', t:'Cloud Router', r:'맞춤 광고에 VIP 대역 포함', cfg:'dedicated'},
           {n:'s3if', t:'private.googleapis.com', r:'Google API 입구 (VPC에 VIP용 경로 필요 없음: 기본 경로가 처리)', cfg:'privlink'},
           {n:'s3', t:'Cloud Storage', r:'IAM 확인', cfg:'bucket'}],
      azure:[{n:'srv', t:'사내 백업 서버', r:'stbackup.blob.core.windows.net 질의'},
           {n:'corpdns', t:'사내 DNS', r:'blob.core.windows.net을 Resolver 인바운드 10.0.30.4로 조건부 전달', cfg:'dnshybrid'},
           {n:'resolver', t:'DNS Private Resolver', r:'CNAME stbackup.privatelink.blob.core.windows.net → VNet에 연결된 privatelink 영역에서 10.0.40.4', cfg:'dnshybrid'},
           {n:'cpe', t:'사내 라우터', r:'10.0.0.0/16 → 전용선', cfg:'bgppref'},
           {n:'dx', t:'ExpressRoute', r:'', cfg:'dedicated'},
           {n:'cr', t:'ExpressRoute 게이트웨이', r:'', cfg:'dedicated'},
           {n:'s3if', t:'PE: 스토리지', r:'', cfg:'privlink'},
           {n:'s3', t:'스토리지 계정', r:'공용 접근 꺼도 PE 경유라 허용', cfg:'bucket'}]
     }},
    {id:'db', t:'사내 서버 → 관리형 DB (5432)',
     d:'백업 서버가 클라우드 DB에서 정산 데이터를 읽습니다.',
     hops:{
      aws:[{n:'srv', t:'사내 백업 서버', r:'RDS 엔드포인트 이름 → Resolver로 사설 IP'},
           {n:'cpe', t:'사내 라우터', r:'', cfg:'bgppref'},
           {n:'dx', t:'Direct Connect', r:'', cfg:'dedicated'},
           {n:'cr', t:'Transit Gateway', r:'', cfg:'hubnet'},
           {n:'sgdb', t:'RDS 보안 그룹', r:'5432 ← 192.168.30.0/24', cfg:'firewall'},
           {n:'rds', t:'RDS PostgreSQL', r:'VPC 안의 ENI라 경로만 맞으면 닿음', cfg:'dbha'}],
      gcp:[{n:'srv', t:'사내 백업 서버', r:'10.100.0.5:5432'},
           {n:'cpe', t:'사내 라우터', r:'10.100.0.0/20 경로가 있어야 함', cfg:'bgppref'},
           {n:'dx', t:'Interconnect', r:'', cfg:'dedicated'},
           {n:'cr', t:'Cloud Router', r:'맞춤 광고에 Cloud SQL 할당 대역 포함', cfg:'dedicated'},
           {n:'smif', t:'비공개 서비스 액세스 피어링', r:'커스텀 경로 내보내기로 사내 경로를 Google 관리 VPC에 전달 (응답 경로)', cfg:'peering'},
           {n:'rds', t:'Cloud SQL', r:'승인된 연결 · IAM DB 인증', cfg:'dbha'}],
      azure:[{n:'srv', t:'사내 백업 서버', r:'서버 이름 → Resolver로 사설 IP'},
           {n:'cpe', t:'사내 라우터', r:'', cfg:'bgppref'},
           {n:'dx', t:'ExpressRoute', r:'', cfg:'dedicated'},
           {n:'cr', t:'ExpressRoute 게이트웨이', r:'', cfg:'dedicated'},
           {n:'sgdb', t:'DB 서브넷 NSG', r:'5432 ← 192.168.30.0/24', cfg:'firewall'},
           {n:'rds', t:'PostgreSQL Flexible', r:'위임 서브넷 안이라 경로만 맞으면 닿음', cfg:'dbha'}]
     },
     note:{aws:'RDS는 VPC 안에 있어 가장 단순합니다. DNS만 Resolver로 풀리게 하면 됩니다.', gcp:'Cloud SQL은 다른 VPC(Google 관리)에 있어 광고와 피어링 경로 교환 두 가지를 다 해야 합니다. 하나만 하면 요청은 가는데 응답이 돌아오지 않거나, 요청 경로부터 없습니다.', azure:'VNet 통합 서버는 VNet 안에 있어 단순합니다. Private Endpoint 방식 서버라면 위의 스토리지와 같은 DNS 작업이 필요합니다.'}},
    {id:'mistake', t:'흔한 실수: VPC 안의 방법을 사내에 그대로',
     d:'VPC 안의 서버에서 잘 되던 방법을 사내 서버에 기대합니다.',
     hops:{
      aws:[{n:'srv', t:'사내 백업 서버', r:'S3 공용 이름 → 공인 IP'},
           {n:'cpe', t:'사내 라우터', r:'공인 IP는 인터넷 경로로 나가거나, 사내가 전용선으로 보내더라도', cfg:'bgppref'},
           {n:'s3gw', t:'S3 게이트웨이 엔드포인트', r:'게이트웨이 엔드포인트는 VPC 라우팅 테이블에서만 동작. 전용선·TGW로 들어온 트래픽은 쓸 수 없음', cfg:'privlink', ok:false},
           {n:'s3', t:'S3', r:''}],
      gcp:[{n:'srv', t:'사내 백업 서버', r:'storage.googleapis.com'},
           {n:'corpdns', t:'사내 DNS', r:'CNAME은 설정했으나', cfg:'dnshybrid'},
           {n:'cpe', t:'사내 라우터', r:'199.36.153.8/30 경로를 받지 못함 (Cloud Router 기본 광고는 서브넷만)', cfg:'bgppref', ok:false},
           {n:'s3gw', t:'비공개 Google 액세스', r:'서브넷 설정은 VM에만 적용되고 사내에는 영향 없음', cfg:'privlink'}],
      azure:[{n:'srv', t:'사내 백업 서버', r:'stbackup.blob.core.windows.net'},
           {n:'corpdns', t:'사내 DNS', r:'privatelink.blob.core.windows.net 영역을 사내 DNS에 따로 만들었지만 기본 이름은 공용 DNS로 풀림 → 공인 IP → 공용 접근이 꺼져 있어 거부', cfg:'dnshybrid', ok:false},
           {n:'s3gw', t:'privatelink 영역', r:'Azure에 연결된 영역은 사내에서 직접 보이지 않음. 공용 영역을 Resolver로 전달해야 함', cfg:'dns'}]
     },
     note:{aws:'사내에서는 S3 인터페이스 엔드포인트(PrivateLink)를 씁니다. VPC 안에서는 무료인 게이트웨이를, 사내용으로는 인터페이스를 함께 두는 구성이 흔합니다.', gcp:'사내용은 "DNS CNAME + Cloud Router 맞춤 광고" 두 가지가 짝입니다. VPC 서비스 제어를 쓰면 restricted.googleapis.com(199.36.153.4/30)으로 같은 작업을 합니다.', azure:'사내 DNS에는 공용 영역(blob.core.windows.net)의 조건부 전달만 두고, privatelink 레코드는 Azure 쪽에서 Private Endpoint가 자동 관리하게 둡니다.'}}
  ],

  scope: ['privlink','dnshybrid','dedicated','dbha','peering'],
  build: {
    aws: [
      {t:'Resolver 인바운드 엔드포인트', d:'서브넷 2개, 53 ← 사내', cfg:'dnshybrid', nodes:['resolver']},
      {t:'S3 인터페이스 엔드포인트', d:'비공개 DNS + 인바운드 Resolver 전용 옵션', cfg:'privlink', nodes:['s3if']},
      {t:'secretsmanager 인터페이스 엔드포인트', d:'', cfg:'privlink', nodes:['smif']},
      {t:'엔드포인트·RDS 보안 그룹', d:'443·5432 ← 사내 서버 대역', cfg:'firewall', nodes:['sgdb']},
      {t:'사내 DNS 조건부 전달', d:'S3·Secrets Manager·RDS 이름 → Resolver 인바운드', cfg:'dnshybrid', nodes:['corpdns']},
      {t:'DXGW 허용 접두사', d:'10.0.0.0/16을 사내에 광고', cfg:'hubnet', nodes:['cr']}
    ],
    gcp: [
      {t:'Cloud Router 맞춤 광고', d:'서브넷 + 199.36.153.8/30 + Cloud SQL 할당 대역', cfg:'dedicated', nodes:['cr','resolver']},
      {t:'PSA 피어링 커스텀 경로 교환', d:'export_custom_routes, import_custom_routes', cfg:'peering', nodes:['smif']},
      {t:'사내 DNS 영역', d:'*.googleapis.com CNAME, private A 레코드 4개', cfg:'dnshybrid', nodes:['corpdns']},
      {t:'Cloud SQL 인증', d:'IAM DB 인증·SSL', cfg:'dbha', nodes:['sgdb','rds']},
      {t:'비공개 Google 액세스', d:'VM용, 사내에는 영향 없음', cfg:'privlink', nodes:['s3gw'], auto:true}
    ],
    azure: [
      {t:'DNS Private Resolver 인바운드', d:'위임 서브넷', cfg:'dnshybrid', nodes:['resolver']},
      {t:'Private Endpoint + privatelink 영역', d:'스토리지·Key Vault, 영역은 허브 VNet에 연결', cfg:'privlink', nodes:['s3if','smif','s3gw']},
      {t:'사내 DNS 조건부 전달', d:'blob.core.windows.net, vault.azure.net, postgres.database.azure.com', cfg:'dnshybrid', nodes:['corpdns']},
      {t:'DB 서브넷 NSG', d:'5432 ← 사내 서버 대역', cfg:'firewall', nodes:['sgdb']},
      {t:'리소스 공용 접근 끄기', d:'', cfg:'bucket', nodes:['s3','sm']}
    ]
  },

  map: ['private-endpoint','hybrid-dns','dedicated-link','object-storage'],

  decisions: [
    {t:'사내에서 쓸 수 있는 관리형 서비스 입구는 무엇인가',
     p:'VPC 안의 서버용 입구와 사내용 입구가 다른 경우가 있습니다.',
     aws:'인터페이스 엔드포인트(ENI)는 사내에서 쓸 수 있고, 게이트웨이 엔드포인트는 쓸 수 없습니다. S3·DynamoDB는 사내용으로 인터페이스 엔드포인트를 따로 둡니다.',
     gcp:'private.googleapis.com·restricted.googleapis.com VIP를 사내에 광고하면 Google API 전체를 씁니다. PSC 엔드포인트로 고정 사설 IP를 만들어 광고할 수도 있습니다.',
     azure:'Private Endpoint는 VNet 안의 NIC라 전용선 너머에서 그대로 닿습니다. DNS만 맞추면 됩니다.',
     so:'AWS는 "엔드포인트 종류", GCP는 "광고할 대역", Azure는 "DNS 전달 영역"이 사내 연결의 핵심입니다.'},
    {t:'사내 DNS는 무엇을 하는가',
     p:'앱이 서비스 기본 이름을 그대로 쓰게 하려면 사내 DNS가 그 이름을 사설 IP로 풀어야 합니다.',
     aws:'서비스 이름을 Route 53 Resolver 인바운드로 조건부 전달합니다. 엔드포인트 비공개 DNS가 사설 IP를 응답합니다.',
     gcp:'사내 DNS에 googleapis.com 영역을 직접 만들어 CNAME으로 VIP를 가리킵니다. Cloud DNS로 전달할 필요가 없습니다.',
     azure:'서비스의 공용 영역을 DNS Private Resolver로 조건부 전달합니다. privatelink 영역을 사내에 복제하지 않습니다.',
     so:'GCP는 사내 DNS 안에서 끝나고, AWS·Azure는 클라우드 DNS로 넘겨 응답을 받습니다.'},
    {t:'관리형 DB는 어디에 있는가',
     p:'DB가 우리 네트워크 안에 있으면 경로만, 다른 네트워크에 있으면 경로 교환까지 필요합니다.',
     aws:'RDS는 우리 VPC 서브넷 안에 ENI로 있습니다. TGW 경로와 보안 그룹만 맞으면 됩니다.',
     gcp:'Cloud SQL(비공개 서비스 액세스)은 Google 관리 VPC에 있습니다. Cloud Router 광고와 피어링 커스텀 경로 교환이 함께 필요합니다.',
     azure:'Flexible Server(VNet 통합)는 위임 서브넷 안에 있습니다. 경로와 NSG만 맞으면 됩니다.',
     so:'GCP에서 사내 → Cloud SQL이 안 될 때는 "광고"와 "피어링 경로 교환" 두 곳을 모두 봅니다.'}
  ],

  iac: 'iac/scenario-23',
  checklist: [
    ['AWS 사내에서 S3 게이트웨이 엔드포인트를 쓰려 한다','동작하지 않습니다. 인터페이스 엔드포인트를 둡니다.'],
    ['GCP Cloud Router 기본 광고만 쓴다','VIP와 Cloud SQL 대역이 사내에 알려지지 않습니다.'],
    ['GCP PSA 피어링 커스텀 경로 내보내기를 끈다','Cloud SQL이 사내로 응답하지 못합니다.'],
    ['Azure privatelink 영역을 사내 DNS에 복제한다','레코드 동기화가 끊기면 공인 IP로 풀립니다.'],
    ['엔드포인트 보안 그룹에 사내 대역을 빠뜨린다','DNS는 풀리는데 연결이 시간 초과됩니다.'],
    ['전용선 용량을 백업 시간대에 맞추지 않는다','야간 백업이 다른 업무 트래픽을 밀어냅니다.']
  ],
  refs: [
    ['AWS: S3 인터페이스 엔드포인트','https://docs.aws.amazon.com/AmazonS3/latest/userguide/privatelink-interface-endpoints.html'],
    ['Google Cloud: 사내 호스트의 비공개 Google 액세스','https://cloud.google.com/vpc/docs/configure-private-google-access-hybrid'],
    ['Google Cloud: 비공개 서비스 액세스와 사내 연결','https://cloud.google.com/sql/docs/postgres/private-ip'],
    ['Azure: Private Endpoint DNS와 온-프레미스','https://learn.microsoft.com/azure/private-link/private-endpoint-dns-integration']
  ],
  next: '시나리오 24 · 클라우드 대역이 사내와 겹칠 때'
};
