window.SCENARIO = {
  no: 18, level: 'network', title: '파트너가 고정 IP를 요구할 때',
  lede: '결제 파트너가 두 가지를 요구합니다. 우리 서버가 파트너 API를 부를 때의 출발지 IP를 미리 알려 달라는 것(나가는 IP 고정), 그리고 파트너가 보내는 웹훅은 파트너 IP에서만 받으라는 것(들어오는 IP 제한)입니다. 서버는 오토스케일로 수시로 바뀌는데 IP는 고정해야 합니다. 출구를 NAT로 모으는 방법은 세 클라우드가 같지만, 공인 IP가 붙은 서버가 섞여 있을 때와 로드밸런서 앞에서 출처를 거르는 방법은 다릅니다.',
  region: {aws:'ap-northeast-2', gcp:'asia-northeast3', azure:'Korea Central'},
  req: [
    {k:'나가는 통신', v:'파트너 결제 API', s:'출발지 IP 허용 목록 (최대 2~4개)'},
    {k:'들어오는 통신', v:'파트너 웹훅', s:'203.0.113.0/28에서만'},
    {k:'서버', v:'API 서버 오토스케일 + 배치 서버 1대', s:'배치 서버는 예전부터 공인 IP를 갖고 있음'},
    {k:'변경', v:'IP 변경 시 파트너 재등록 2주', s:'한 번 정한 IP는 바꾸지 않아야 함'}
  ],
  intro: {
    arch: '<b>배치 서버 → 파트너 API</b>를 클라우드별로 비교해 보세요. 같은 "공인 IP가 붙은 서버"인데 AWS와 GCP에서는 NAT를 거치지 않아 파트너에게 거부되고, Azure에서는 NAT Gateway가 우선해 허용됩니다.'
  },

  diagram: {
    aws: { w: 700, h: 500, aria: 'AWS: AZ마다 EIP를 가진 NAT 게이트웨이, 퍼블릭 서브넷의 ALB와 보안 그룹, 공인 IP가 있는 배치 서버',
      frames: [
        {id:'partner', kind:'onprem', x:380, y:8, w:306, h:132, label:'결제 파트너'},
        {id:'vpc', kind:'net', x:14, y:160, w:672, h:326, label:'vpc-prod 10.20.0.0/16', cfg:'vpc'},
        {id:'pub', kind:'plain', x:26, y:194, w:648, h:126, label:'퍼블릭 서브넷 a·c', cfg:'subnet'},
        {id:'priv', kind:'plain', x:26, y:332, w:648, h:140, label:'앱 서브넷 a·c', cfg:'subnet'}
      ],
      nodes: [
        {id:'other', x:14, y:20, w:210, h:44, t:'그 밖의 인터넷', s:'스캐너 · 위조 웹훅', kind:'alt'},
        {id:'pgapi', x:394, y:34, w:280, h:40, icon:'apigw', t:'결제 승인 API', s:'허용: 3.38.1.1, 3.38.2.2'},
        {id:'pghook', x:394, y:86, w:280, h:40, icon:'eventbus', t:'웹훅 발송', s:'203.0.113.0/28'},
        {id:'igw', x:240, y:142, w:180, h:36, icon:'igw', t:'인터넷 게이트웨이', kind:'reg', cfg:'igw'},
        {id:'lb', x:40, y:220, w:190, h:44, icon:'lb', t:'ALB (인터넷)', s:'POST /webhook', kind:'reg', cfg:'lb'},
        {id:'sgalb', kind:'chip', x:40, y:276, t:'SG sg-alb ← 203.0.113.0/28:443', cfg:'firewall', why:'ALB는 클라이언트 IP를 그대로 보므로 보안 그룹으로 출처를 거를 수 있습니다. 파트너 대역만 넣습니다.'},
        {id:'natA', x:420, y:214, w:120, h:42, icon:'nat', t:'NAT a', s:'EIP 3.38.1.1', cfg:'nat'},
        {id:'natC', x:548, y:214, w:120, h:42, icon:'nat', t:'NAT c', s:'EIP 3.38.2.2', cfg:'nat', why:'AZ마다 NAT가 있으니 나가는 IP도 AZ 수만큼입니다. 파트너에게 두 개를 모두 등록합니다.'},
        {id:'batch', x:300, y:266, w:200, h:42, icon:'vm', t:'배치 서버', s:'공인 IP 3.36.9.9', cfg:'vmgroup'},
        {id:'rtpub', kind:'chip', x:508, y:278, t:'rt-public: 0/0 → igw', cfg:'route'},
        {id:'app', x:40, y:362, w:190, h:44, icon:'autoscale', t:'API 서버', s:'ASG · 사설 IP만', cfg:'vmgroup'},
        {id:'sgapp', kind:'chip', x:40, y:418, t:'SG ← sg-alb:8080', cfg:'firewall'},
        {id:'rtapp', kind:'chip', x:250, y:374, t:'rt-app-a: 0/0 → nat-a · rt-app-c: 0/0 → nat-c', cfg:'route'}
      ],
      edges: [
        {a:'igw', b:'lb', dash:true}, {a:'natA', b:'igw', dash:true}, {a:'natC', b:'igw', dash:true}
      ]
    },

    gcp: { w: 700, h: 500, aria: 'GCP: 수동 고정 IP를 쓰는 Cloud NAT, VPC 밖의 전역 외부 ALB와 Cloud Armor, 외부 IP가 있는 배치 VM',
      frames: [
        {id:'partner', kind:'onprem', x:380, y:8, w:306, h:132, label:'결제 파트너'},
        {id:'vpc', kind:'net', x:14, y:200, w:672, h:286, label:'vpc-prod · 전역', cfg:'vpc'},
        {id:'priv', kind:'plain', x:26, y:262, w:420, h:210, label:'subnet-app 10.20.10.0/24 · 리전', cfg:'subnet'}
      ],
      nodes: [
        {id:'other', x:14, y:20, w:210, h:44, t:'그 밖의 인터넷', s:'스캐너 · 위조 웹훅', kind:'alt'},
        {id:'pgapi', x:394, y:34, w:280, h:40, icon:'apigw', t:'결제 승인 API', s:'허용: 34.64.1.1, 34.64.2.2'},
        {id:'pghook', x:394, y:86, w:280, h:40, icon:'eventbus', t:'웹훅 발송', s:'203.0.113.0/28'},
        {id:'lb', x:14, y:94, w:220, h:44, icon:'lb', t:'전역 외부 Application LB', s:'VPC 밖 · Anycast IP', kind:'reg', cfg:'lb'},
        {id:'armor', kind:'chip', x:14, y:150, t:'Cloud Armor: 203.0.113.0/28만 허용', cfg:'waf', why:'LB가 연결을 끝내고 새로 맺으므로 백엔드 VM의 방화벽은 파트너 IP를 볼 수 없습니다. 출처 제한은 LB에 붙는 Cloud Armor 정책에서 합니다.'},
        {id:'igw', x:470, y:184, w:204, h:36, icon:'net', t:'기본 인터넷 게이트웨이', kind:'ghost', cfg:'igw'},
        {id:'fwlb', kind:'chip', x:40, y:290, t:'FW ← LB·헬스체크 대역:8080', cfg:'firewall', why:'백엔드가 보는 출발지는 35.191.0.0/16, 130.211.0.0/22입니다. 파트너 대역을 여기 넣어도 효과가 없습니다.'},
        {id:'app', x:40, y:320, w:190, h:44, icon:'autoscale', t:'API 서버', s:'리전 MIG · 외부 IP 없음', cfg:'vmgroup'},
        {id:'batch', x:240, y:320, w:196, h:44, icon:'vm', t:'배치 VM', s:'외부 IP 34.64.9.9', cfg:'vmgroup'},
        {id:'fwout', kind:'chip', x:40, y:384, t:'이그레스 묵시적 허용', cfg:'firewall'},
        {id:'nat', x:470, y:290, w:204, h:58, icon:'nat', t:'Cloud NAT', s:'수동 IP 34.64.1.1 · 34.64.2.2', kind:'reg', cfg:'nat', why:'자동 할당이면 IP가 늘거나 바뀔 수 있습니다. 예약한 고정 IP를 수동으로 지정해 파트너에 등록한 IP만 쓰게 합니다.'},
        {id:'natnote', kind:'chip', x:470, y:360, t:'외부 IP 있는 VM은 NAT 대상 아님', cfg:'nat'}
      ],
      edges: [
        {a:'nat', b:'igw', dash:true}, {a:'lb', b:'app', dash:true}
      ]
    },

    azure: { w: 700, h: 520, aria: 'Azure: 공인 IP 접두사를 가진 NAT Gateway를 앱 서브넷에 연결, Application Gateway 서브넷 NSG로 출처 제한, 공인 IP가 있는 배치 VM',
      frames: [
        {id:'partner', kind:'onprem', x:380, y:8, w:306, h:132, label:'결제 파트너'},
        {id:'vpc', kind:'net', x:14, y:180, w:672, h:326, label:'vnet-prod 10.20.0.0/16', cfg:'vpc'},
        {id:'agw', kind:'plain', x:26, y:212, w:420, h:96, label:'snet-agw', cfg:'subnet'},
        {id:'priv', kind:'plain', x:26, y:320, w:420, h:172, label:'snet-app · NAT Gateway 연결', cfg:'subnet'}
      ],
      nodes: [
        {id:'other', x:14, y:20, w:210, h:44, t:'그 밖의 인터넷', s:'스캐너 · 위조 웹훅', kind:'alt'},
        {id:'pgapi', x:394, y:34, w:280, h:40, icon:'apigw', t:'결제 승인 API', s:'허용: 20.41.0.10/31'},
        {id:'pghook', x:394, y:86, w:280, h:40, icon:'eventbus', t:'웹훅 발송', s:'203.0.113.0/28'},
        {id:'igw', x:240, y:150, w:200, h:36, icon:'igw', t:'시스템 경로 → Internet', kind:'ghost', cfg:'igw'},
        {id:'lb', x:40, y:238, w:200, h:44, icon:'lb', t:'Application Gateway', s:'공인 IP · /webhook', kind:'reg', cfg:'lb'},
        {id:'sgagw', kind:'chip', x:248, y:240, t:'NSG ← 203.0.113.0/28:443', cfg:'firewall', why:'Application Gateway v2 서브넷 NSG로 인터넷 출처를 좁힐 수 있습니다. GatewayManager 65200-65535와 AzureLoadBalancer 허용은 남겨 둡니다. WAF 사용자 지정 규칙(IP 일치)으로도 같은 일을 합니다.'},
        {id:'sggm', kind:'chip', x:248, y:266, t:'NSG ← GatewayManager (유지)', cfg:'firewall'},
        {id:'app', x:40, y:350, w:190, h:44, icon:'autoscale', t:'API 서버', s:'VMSS · 공인 IP 없음', cfg:'vmgroup'},
        {id:'batch', x:240, y:350, w:196, h:44, icon:'vm', t:'배치 VM', s:'공인 IP 20.200.9.9', cfg:'vmgroup'},
        {id:'natlink', kind:'chip', x:40, y:410, t:'NAT 연결: 서브넷 아웃바운드는 NAT가 우선', cfg:'nat', why:'NAT Gateway가 연결된 서브넷에서는 VM에 공인 IP가 있어도 아웃바운드는 NAT Gateway로 나갑니다. 그 공인 IP는 들어오는 연결에만 쓰입니다.'},
        {id:'nat', x:470, y:330, w:204, h:58, icon:'nat', t:'NAT Gateway', s:'공인 IP 접두사 20.41.0.10/31', cfg:'nat', why:'접두사를 쓰면 연속된 IP 두 개를 CIDR 하나(/31)로 파트너에 알려 줄 수 있습니다.'}
      ],
      edges: [
        {a:'nat', b:'igw', dash:true}, {a:'igw', b:'lb', dash:true}
      ]
    }
  },

  flows: [
    {id:'out', t:'API 서버 → 파트너 결제 API',
     d:'오토스케일로 새로 뜬 API 서버가 결제 승인을 요청합니다.',
     hops:{
      aws:[{n:'app', t:'API 서버 (AZ a, 사설 IP)', r:'보안 그룹 아웃바운드 443 허용', cfg:'firewall'},
           {n:'rtapp', t:'rt-app-a', r:'0/0 → 같은 AZ의 nat-a', cfg:'route'},
           {n:'natA', t:'NAT a', r:'출발지를 EIP 3.38.1.1로', cfg:'nat'},
           {n:'igw', t:'인터넷 게이트웨이', r:'', cfg:'igw'},
           {n:'pgapi', t:'파트너 API', r:'3.38.1.1은 허용 목록에 있음 → 승인'}],
      gcp:[{n:'app', t:'API 서버 (외부 IP 없음)', r:'이그레스 묵시적 허용', cfg:'firewall'},
           {n:'nat', t:'Cloud NAT', r:'수동 IP 두 개 중 하나로 SNAT (어느 쪽일지는 정해지지 않음)', cfg:'nat'},
           {n:'igw', t:'기본 인터넷 게이트웨이', r:'', cfg:'igw'},
           {n:'pgapi', t:'파트너 API', r:'34.64.1.1·34.64.2.2 모두 등록되어 있어 승인'}],
      azure:[{n:'app', t:'API 서버', r:'NSG 아웃바운드 허용', cfg:'firewall'},
           {n:'natlink', t:'snet-app의 NAT 연결', r:'서브넷 아웃바운드는 NAT Gateway', cfg:'nat'},
           {n:'nat', t:'NAT Gateway', r:'접두사 20.41.0.10/31의 두 IP 중 하나로', cfg:'nat'},
           {n:'igw', t:'시스템 경로 Internet', r:'', cfg:'igw'},
           {n:'pgapi', t:'파트너 API', r:'20.41.0.10/31이 등록되어 있어 승인'}]
     },
     note:'나가는 IP가 하나가 아니라는 점을 파트너에게 처음부터 알려야 합니다. AWS는 AZ 수만큼, GCP·Azure는 NAT에 붙인 IP 수만큼 등록합니다.'},
    {id:'batch', t:'배치 서버(공인 IP 있음) → 파트너 API',
     d:'오래전부터 공인 IP를 달고 있던 배치 서버가 같은 API를 부릅니다.',
     hops:{
      aws:[{n:'batch', t:'배치 서버 (퍼블릭 서브넷, 공인 IP 3.36.9.9)', r:'보안 그룹 아웃바운드 허용', cfg:'firewall'},
           {n:'rtpub', t:'rt-public', r:'0/0 → igw. NAT로 가는 경로가 아님', cfg:'route'},
           {n:'igw', t:'인터넷 게이트웨이', r:'인스턴스의 공인 IP 3.36.9.9로 나감', cfg:'igw'},
           {n:'pgapi', t:'파트너 API', r:'3.36.9.9는 허용 목록에 없음 → 403', ok:false}],
      gcp:[{n:'batch', t:'배치 VM (외부 IP 34.64.9.9)', r:'이그레스 허용', cfg:'firewall'},
           {n:'natnote', t:'Cloud NAT 대상 여부', r:'외부 IP가 있는 VM의 인터페이스는 Cloud NAT를 쓰지 않음', cfg:'nat'},
           {n:'igw', t:'기본 인터넷 게이트웨이', r:'VM의 외부 IP 34.64.9.9로 나감', cfg:'igw'},
           {n:'pgapi', t:'파트너 API', r:'34.64.9.9는 허용 목록에 없음 → 403', ok:false}],
      azure:[{n:'batch', t:'배치 VM (공인 IP 20.200.9.9)', r:'NSG 아웃바운드 허용', cfg:'firewall'},
           {n:'natlink', t:'snet-app의 NAT 연결', r:'NAT Gateway가 연결된 서브넷이면 VM 공인 IP보다 NAT가 아웃바운드에 우선', cfg:'nat'},
           {n:'nat', t:'NAT Gateway', r:'20.41.0.10/31 중 하나로 나감', cfg:'nat'},
           {n:'pgapi', t:'파트너 API', r:'등록된 IP → 승인'}]
     },
     note:{aws:'배치 서버를 앱 서브넷으로 옮기고 공인 IP를 떼야 합니다. 퍼블릭 서브넷에 있는 한 출구는 인스턴스 자기 IP입니다.', gcp:'배치 VM의 외부 IP를 떼면 Cloud NAT를 씁니다. "외부 IP 금지" 조직 정책을 두면 이런 서버가 다시 생기지 않습니다.', azure:'Azure는 NAT Gateway가 서브넷 아웃바운드를 맡으므로 결과가 다릅니다. 다만 이 VM의 공인 IP로는 여전히 들어오는 연결이 가능하니, 필요 없으면 떼어 냅니다.'}},
    {id:'hook', t:'파트너 웹훅 → 우리 서버',
     d:'파트너가 결제 완료를 POST /webhook 으로 알립니다.',
     hops:{
      aws:[{n:'pghook', t:'파트너 웹훅 (203.0.113.5)', r:''},
           {n:'igw', t:'인터넷 게이트웨이', r:'ALB의 공인 주소로', cfg:'igw'},
           {n:'sgalb', t:'sg-alb', r:'443 ← 203.0.113.0/28 허용', cfg:'firewall'},
           {n:'lb', t:'ALB', r:'/webhook → 대상 그룹', cfg:'lb'},
           {n:'sgapp', t:'sg-app', r:'8080 ← sg-alb', cfg:'firewall'},
           {n:'app', t:'API 서버', r:'서명 헤더도 함께 검증'}],
      gcp:[{n:'pghook', t:'파트너 웹훅 (203.0.113.5)', r:''},
           {n:'lb', t:'전역 외부 ALB', r:'Anycast IP로 받아 Google 엣지에서 종료', cfg:'lb'},
           {n:'armor', t:'Cloud Armor', r:'규칙 1000: inIpRange(203.0.113.0/28) → 허용', cfg:'waf'},
           {n:'fwlb', t:'VPC 방화벽', r:'8080 ← 35.191.0.0/16, 130.211.0.0/22 (LB가 새 연결을 맺음)', cfg:'firewall'},
           {n:'app', t:'API 서버', r:'X-Forwarded-For로 원래 IP 확인, 서명 검증'}],
      azure:[{n:'pghook', t:'파트너 웹훅 (203.0.113.5)', r:''},
           {n:'igw', t:'시스템 경로', r:'Application Gateway 공인 IP로', cfg:'igw'},
           {n:'sgagw', t:'nsg-agw', r:'443 ← 203.0.113.0/28 허용', cfg:'firewall'},
           {n:'lb', t:'Application Gateway', r:'/webhook → 백엔드 풀', cfg:'lb'},
           {n:'app', t:'API 서버', r:'NSG: 8080 ← snet-agw, 서명 검증'}]
     }},
    {id:'fake', t:'다른 인터넷 주소 → 웹훅 (위조)',
     d:'누군가 웹훅 주소를 알아내 가짜 결제 완료를 보냅니다.',
     hops:{
      aws:[{n:'other', t:'인터넷의 공격자', r:''},
           {n:'igw', t:'인터넷 게이트웨이', r:'', cfg:'igw'},
           {n:'sgalb', t:'sg-alb', r:'출처가 허용 목록에 없음 → 패킷을 버림 (연결 시간 초과)', cfg:'firewall', ok:false},
           {n:'lb', t:'ALB', r:''}],
      gcp:[{n:'other', t:'인터넷의 공격자', r:''},
           {n:'lb', t:'전역 외부 ALB', r:'LB 자체는 누구에게나 열려 있음', cfg:'lb'},
           {n:'armor', t:'Cloud Armor', r:'기본 규칙 deny(403) → 백엔드로 보내지 않음', cfg:'waf', ok:false},
           {n:'app', t:'API 서버', r:''}],
      azure:[{n:'other', t:'인터넷의 공격자', r:''},
           {n:'igw', t:'시스템 경로', r:'', cfg:'igw'},
           {n:'sgagw', t:'nsg-agw', r:'출처가 허용 목록에 없음 → 거부', cfg:'firewall', ok:false},
           {n:'lb', t:'Application Gateway', r:''}]
     },
     note:'IP 제한은 1차 방어입니다. 파트너 IP가 바뀌거나 공유 대역이면 무력해지므로, 웹훅 서명(HMAC) 검증을 앱에서 반드시 함께 합니다.'}
  ],

  scope: ['nat','lb','waf','firewall','route'],
  build: {
    aws: [
      {t:'EIP 2개 할당', d:'이 IP를 파트너에 등록. 삭제 방지', cfg:'nat', nodes:['natA','natC']},
      {t:'NAT 게이트웨이 AZ마다', d:'각 EIP를 연결', cfg:'nat', nodes:['natA','natC']},
      {t:'앱 라우팅 테이블 AZ별', d:'0/0 → 같은 AZ NAT', cfg:'route', nodes:['rtapp']},
      {t:'배치 서버 이전', d:'앱 서브넷으로, 공인 IP 제거', cfg:'vmgroup', nodes:['batch']},
      {t:'sg-alb', d:'443 ← 파트너 대역', cfg:'firewall', nodes:['sgalb']},
      {t:'ALB /webhook 규칙', d:'', cfg:'lb', nodes:['lb']}
    ],
    gcp: [
      {t:'고정 외부 IP 2개 예약', d:'리전 주소', cfg:'nat', nodes:['nat']},
      {t:'Cloud NAT 수동 IP 지정', d:'NAT_IP 수동, VM당 최소 포트 확인', cfg:'nat', nodes:['nat']},
      {t:'배치 VM 외부 IP 제거', d:'조직 정책으로 외부 IP 금지', cfg:'guardrail', nodes:['batch']},
      {t:'Cloud Armor 정책', d:'허용 규칙 + 기본 거부, LB 백엔드 서비스에 연결', cfg:'waf', nodes:['armor']},
      {t:'방화벽: LB·헬스체크 대역', d:'파트너 대역이 아님', cfg:'firewall', nodes:['fwlb']}
    ],
    azure: [
      {t:'공인 IP 접두사 /31', d:'연속 IP 2개', cfg:'nat', nodes:['nat']},
      {t:'NAT Gateway + 접두사 + 서브넷 연결', d:'', cfg:'nat', nodes:['nat','natlink']},
      {t:'배치 VM 확인', d:'NAT가 우선하므로 출구는 맞음. 불필요한 공인 IP 제거', cfg:'vmgroup', nodes:['batch'], auto:true},
      {t:'nsg-agw', d:'443 ← 파트너 대역, GatewayManager·AzureLoadBalancer 유지', cfg:'firewall', nodes:['sgagw','sggm']},
      {t:'Application Gateway /webhook 규칙', d:'', cfg:'lb', nodes:['lb']}
    ]
  },

  map: ['nat','l7-lb','waf','firewall'],

  decisions: [
    {t:'나가는 IP를 몇 개로 할 것인가',
     p:'IP가 적을수록 파트너 등록이 쉽지만, 하나의 IP로 낼 수 있는 동시 연결 수에는 한계가 있습니다.',
     aws:'NAT 게이트웨이마다 EIP가 하나 이상 필요하고, AZ마다 NAT를 두면 IP도 AZ 수만큼입니다. 한 NAT에 보조 EIP를 더 붙일 수도 있습니다.',
     gcp:'Cloud NAT에 수동 IP를 원하는 만큼 붙입니다. IP 하나는 약 64,000개 포트를 VM들에 나눠 주므로 "VM당 최소 포트 × VM 수"가 넘으면 IP를 늘려야 합니다.',
     azure:'NAT Gateway에 공인 IP나 접두사를 최대 16개까지 붙입니다. 접두사를 쓰면 파트너에게 CIDR 하나로 알려 줄 수 있습니다.',
     so:'파트너가 허용하는 개수 안에서, 동시 연결 수를 계산해 정합니다. 처음 등록할 때 여유 IP를 하나 더 등록해 두면 나중에 재등록 2주를 피할 수 있습니다.'},
    {t:'들어오는 출처를 어디서 거르는가',
     p:'L7 로드밸런서는 연결을 끝내고 새로 맺기 때문에, 출처 IP로 거를 수 있는 위치가 클라우드마다 다릅니다.',
     aws:'ALB에 붙은 보안 그룹이 클라이언트 IP를 봅니다. 여기서 거르거나 WAF IP 세트를 씁니다.',
     gcp:'전역 외부 ALB는 VPC 밖에 있어 VPC 방화벽이 클라이언트 IP를 보지 못합니다. Cloud Armor 정책으로 거릅니다.',
     azure:'Application Gateway 서브넷의 NSG가 클라이언트 IP를 봅니다. WAF 사용자 지정 규칙으로도 거를 수 있습니다.',
     so:'GCP에서 백엔드 방화벽에 파트너 IP를 넣는 실수가 흔합니다. 그 규칙은 아무것도 허용하지 못해 웹훅이 전부 실패합니다.'},
    {t:'공인 IP가 있는 서버는 어디로 나가는가',
     p:'NAT를 만들었다고 모든 서버가 NAT로 나가지는 않습니다.',
     aws:'출구는 서브넷의 라우팅 테이블이 정합니다. 퍼블릭 서브넷(0/0 → igw)의 서버는 자기 공인 IP로 나갑니다.',
     gcp:'외부 IP가 있는 VM 인터페이스는 Cloud NAT를 쓰지 않고 자기 외부 IP로 나갑니다.',
     azure:'NAT Gateway가 연결된 서브넷이면 VM에 공인 IP가 있어도 아웃바운드는 NAT Gateway가 맡습니다.',
     so:'같은 "공인 IP 붙은 VM"이 AWS·GCP에서는 허용 목록 밖으로, Azure에서는 안으로 나갑니다. 마이그레이션할 때 놓치기 쉬운 차이입니다.'}
  ],

  iac: 'iac/scenario-18',
  checklist: [
    ['NAT를 다시 만들면서 IP가 바뀐다','EIP·예약 IP·공인 IP를 NAT와 별도 리소스로 두고 삭제 방지를 겁니다.'],
    ['AZ 하나의 NAT IP만 등록한다','다른 AZ의 서버가 부를 때만 실패해 원인을 찾기 어렵습니다.'],
    ['GCP 백엔드 방화벽에 파트너 IP를 넣는다','백엔드는 LB 대역만 봅니다. Cloud Armor로 거릅니다.'],
    ['Azure NSG에서 GatewayManager를 지운다','출처를 좁히다가 v2 필수 규칙까지 지우면 게이트웨이가 비정상이 됩니다.'],
    ['공인 IP가 남은 오래된 서버를 잊는다','AWS·GCP에서는 NAT를 우회합니다. 공인 IP 목록을 정기 점검합니다.'],
    ['IP 제한만 믿는다','웹훅 서명 검증과 재전송 방지(타임스탬프)를 함께 둡니다.']
  ],
  refs: [
    ['AWS: NAT 게이트웨이 (보조 IP)','https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateway-working-with.html'],
    ['Google Cloud: Cloud NAT IP 주소와 포트','https://cloud.google.com/nat/docs/ports-and-addresses'],
    ['Google Cloud: Cloud Armor 보안 정책','https://cloud.google.com/armor/docs/security-policy-overview'],
    ['Azure: NAT Gateway 리소스','https://learn.microsoft.com/azure/nat-gateway/nat-gateway-resource'],
    ['Azure: Application Gateway 인프라 구성','https://learn.microsoft.com/azure/application-gateway/configuration-infrastructure']
  ],
  next: '시나리오 19 · 서비스 간 내부 통신'
};
