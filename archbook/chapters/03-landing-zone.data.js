window.SCENARIO = {
  no: 3, level: 'basic', title: 'dev·stg·prod 계정 구조',
  lede: '팀과 환경이 늘어나기 전에 정해야 하는 뼈대입니다. 권한, 네트워크, 비용, 사고 범위를 어디서 끊을지 정하는 일이고, 나중에 바꾸려면 리소스를 통째로 옮겨야 해서 처음 설계가 가장 중요합니다.',
  region: {aws:'AWS Organizations', gcp:'Google Cloud 조직', azure:'Entra 테넌트 · 관리 그룹'},
  req: [
    {k:'조직', v:'팀 3개 × 환경 3개', s:'커머스, 데이터, 플랫폼 · dev, stg, prod'},
    {k:'보안', v:'모든 API 활동 기록 1년', s:'워크로드 팀이 지울 수 없어야 함'},
    {k:'네트워크', v:'인터넷 출구 한 곳', s:'환경 간 통신은 기본 차단'},
    {k:'비용', v:'팀·환경별 청구', s:'샌드박스는 예산 상한'}
  ],
  intro: {
    arch: '맨 위 루트 아래에 묶음(OU·폴더·관리 그룹)을 두고, 그 안에 실제 리소스가 사는 단위(계정·프로젝트·구독)를 둡니다. <b>개발 계정 자격 증명 유출</b>을 눌러 피해가 어디서 멈추는지 보세요.',
    map: '이름은 달라도 역할은 대응합니다. 다만 각 단위가 무엇의 경계인지(권한, 과금, 할당량, 네트워크)는 조금씩 다릅니다.'
  },
  diagram: {
    w: 680, h: 520,
    frames: [
      {id:'ou-sec', kind:'group', x:20, y:92, w:150, h:300, label:{aws:'OU · 보안', gcp:'폴더 · 보안', azure:'관리 그룹 · 보안'}},
      {id:'ou-infra', kind:'group', x:180, y:92, w:150, h:300, label:{aws:'OU · 인프라', gcp:'폴더 · 공유', azure:'관리 그룹 · 플랫폼'}},
      {id:'ou-wl', kind:'group', x:340, y:92, w:180, h:300, label:{aws:'OU · 워크로드', gcp:'폴더 · 워크로드', azure:'관리 그룹 · 랜딩 존'}},
      {id:'ou-sbx', kind:'group', x:530, y:92, w:130, h:300, label:{aws:'OU · 샌드박스', gcp:'폴더 · 샌드박스', azure:'관리 그룹 · 샌드박스'}}
    ],
    nodes: [
      {id:'idp', cfg:'sso', x:20, y:12, w:190, h:44, icon:'iam', t:'사람 로그인 (SSO)', s:{aws:'IAM Identity Center', gcp:'Cloud Identity · 그룹', azure:'Entra ID'}, kind:'alt'},
      {id:'root', x:240, y:12, w:200, h:44, icon:'org', t:{aws:'조직 루트', gcp:'조직 노드', azure:'루트 관리 그룹'}, s:{aws:'관리 계정은 결제·조직 관리만', gcp:'도메인에 연결된 조직', azure:'테넌트 루트 아래'}, kind:'reg'},
      {id:'guard', cfg:'guardrail', x:470, y:12, w:190, h:44, icon:'guard', t:'가드레일', s:{aws:'SCP · Control Tower', gcp:'조직 정책', azure:'Azure Policy'}, kind:'alt'},
      {id:'log', cfg:'audit', x:30, y:124, w:130, h:52, icon:'audit', t:{aws:'로그 보관 계정', gcp:'로그 프로젝트', azure:'로그 구독'}, s:{aws:'조직 CloudTrail', gcp:'집계 싱크', azure:'Log Analytics'}},
      {id:'sec', x:30, y:196, w:130, h:52, icon:'sechub', t:'보안 도구', s:{aws:'Security Hub 위임', gcp:'Security Command Center', azure:'Defender for Cloud'}},
      {id:'hub', cfg:'hubnet', x:190, y:124, w:130, h:52, icon:'router', t:'네트워크 허브', s:{aws:'Transit Gateway', gcp:'Shared VPC 호스트', azure:'허브 VNet'}},
      {id:'egress', cfg:{aws:'egressfw', gcp:'nat', azure:'egressfw'}, x:190, y:196, w:130, h:52, icon:'fw', t:'공용 출구', s:{aws:'Network Firewall', gcp:'Cloud NAT · 방화벽 정책', azure:'Azure Firewall'}},
      {id:'prod', cfg:'account', x:352, y:124, w:156, h:46, icon:'account', t:'커머스 prod', s:{aws:'계정', gcp:'서비스 프로젝트', azure:'구독'}},
      {id:'stg', cfg:'account', x:352, y:184, w:156, h:46, icon:'account', t:'커머스 stg', s:{aws:'계정', gcp:'서비스 프로젝트', azure:'구독'}},
      {id:'dev', cfg:'account', x:352, y:244, w:156, h:46, icon:'account', t:'커머스 dev', s:{aws:'계정', gcp:'서비스 프로젝트', azure:'구독'}, failS:'자격 증명 유출'},
      {id:'data', cfg:'account', x:352, y:316, w:156, h:46, icon:'account', t:'데이터 prod', s:'팀이 다르면 단위도 분리'},
      {id:'sbx', cfg:'account', x:540, y:124, w:110, h:52, icon:'account', t:'개인 실험', s:'예산 상한'},
      {id:'cost', x:240, y:440, w:200, h:44, icon:'cost', t:'팀·환경별 비용', s:{aws:'Cost Explorer · 비용 할당 태그', gcp:'결제 내보내기 · 라벨', azure:'Cost Management · 태그'}, kind:'alt'}
    ],
    edges: [
      {a:'idp', b:'root', dash:true},
      {a:'guard', b:'root', dash:true},
      {a:'prod', b:'hub'}, {a:'stg', b:'hub'}, {a:'dev', b:'hub'},
      {a:'hub', b:'egress'},
      {a:'dev', b:'log', dash:true}
    ],
    notes: [
      {x:340, y:412, t:'루트 → 묶음 → 계정 순서로 가드레일과 역할이 상속됩니다', anchor:'middle'},
      {x:340, y:428, t:'점선: 로그는 각 계정에서 로그 보관 단위로 복제', anchor:'middle'}
    ]
  },
  fail: {
    button: '개발 계정 자격 증명 유출', restore: '복구', title: '개발 계정 관리자 권한이 유출됐을 때',
    down: ['dev'],
    normal: {
      aws: ['사람은 IAM Identity Center로 로그인해 계정별 권한 세트를 받습니다. 장기 액세스 키는 없습니다.', '모든 계정의 API 활동은 조직 CloudTrail 추적으로 로그 보관 계정의 S3에 모입니다.', '워크로드 VPC는 Transit Gateway로 허브에 붙고, 인터넷 출구는 허브의 방화벽 한 곳입니다.'],
      gcp: ['사람은 Cloud Identity 계정과 그룹 단위로 폴더·프로젝트 역할을 받습니다.', '조직 수준 집계 싱크가 모든 프로젝트의 감사 로그를 로그 프로젝트로 보냅니다.', '네트워크는 Shared VPC 호스트 프로젝트가 소유하고, 서비스 프로젝트는 허락된 서브넷만 씁니다.'],
      azure: ['사람은 Entra ID로 로그인하고 관리 그룹·구독 범위로 Azure RBAC 역할을 받습니다.', '각 구독의 활동 로그는 진단 설정으로 로그 구독의 Log Analytics에 모입니다.', '스포크 VNet은 허브 VNet과 피어링하고, 인터넷 출구는 허브의 Azure Firewall입니다.']
    },
    effects: {
      aws: [
        ['good','유출된 권한은 dev 계정 안에서만 유효합니다. 계정이 권한·과금·사고의 경계입니다.'],
        ['good','SCP로 CloudTrail 중지, 조직 탈퇴, 허용하지 않은 리전 사용을 막아 두었다면 그 계정의 관리자, 루트 사용자라도 거부됩니다.'],
        ['good','로그는 로그 보관 계정의 버킷에 쌓이므로 dev에서 지울 수 없습니다. S3 객체 잠금까지 걸면 로그 계정 관리자도 기간 내 삭제할 수 없습니다.'],
        ['warn','Transit Gateway 라우팅 테이블을 환경별로 나누지 않았다면 dev에서 prod 네트워크로 갈 수 있습니다.']
      ],
      gcp: [
        ['good','권한이 dev 프로젝트(또는 dev 폴더) 범위에 묶여 다른 프로젝트는 건드릴 수 없습니다.'],
        ['good','조직 정책은 조직 정책 관리자 역할이 있어야 바꿀 수 있고, 프로젝트 소유자 역할에는 이 권한이 없습니다.'],
        ['good','감사 로그는 조직 집계 싱크로 로그 프로젝트에 모이므로 dev에서 지워도 사본이 남습니다. 로그 버킷 보존 기간을 잠그면 삭제할 수 없습니다.'],
        ['warn','Shared VPC에서 dev와 prod가 같은 서브넷을 쓰면 네트워크 경계가 없습니다. 환경별 서브넷이나 호스트 프로젝트를 나눕니다.']
      ],
      azure: [
        ['good','역할 할당이 dev 구독 범위라면 다른 구독은 건드릴 수 없습니다.'],
        ['warn','관리 그룹에 할당한 정책이라도 구독 Owner는 그 구독에 정책 예외를 만들 수 있습니다. 워크로드 팀에는 Owner 대신 Contributor와 필요한 역할만 줍니다.'],
        ['good','활동 로그는 로그 구독의 Log Analytics에 모이므로 dev 구독에서 지울 수 없습니다.'],
        ['warn','허브의 Azure Firewall 규칙이 스포크 간 통신을 허용하면 dev에서 prod로 갈 수 있습니다.']
      ]
    }
  },
  scope: ['sso','guardrail','audit','account','hubnet','egressfw'],
  build: {
    aws: [
      {t:'조직 생성 · 관리 계정', d:'관리 계정은 결제·조직 관리만', nodes:['root']},
      {t:'Control Tower 랜딩 존', d:'로그 보관·감사 계정 자동 생성, 기본 가드레일', cfg:'guardrail', nodes:['root','log','guard']},
      {t:'OU 구조', d:'Security · Infrastructure · Workloads · Sandbox', nodes:['ou-sec','ou-infra','ou-wl','ou-sbx']},
      {t:'IAM Identity Center + 외부 IdP', d:'SCIM 동기화, 권한 세트', cfg:'sso', nodes:['idp']},
      {t:'SCP 추가', d:'리전 제한, 감사 설정 변경 금지', cfg:'guardrail', nodes:['guard']},
      {t:'조직 CloudTrail · Config', d:'로그 보관 계정 버킷(객체 잠금)으로', cfg:'audit', nodes:['log']},
      {t:'Security Hub · GuardDuty 위임 관리자', d:'보안 도구 계정으로 위임', nodes:['sec']},
      {t:'네트워크 계정: Transit Gateway', d:'RAM으로 공유, 라우팅 테이블 분리', cfg:'hubnet', nodes:['hub']},
      {t:'공용 출구 VPC: Network Firewall', d:'도메인 허용 목록', cfg:'egressfw', nodes:['egress']},
      {t:'Account Factory로 워크로드 계정', d:'prod·stg·dev·data, 기본 VPC 삭제', cfg:'account', nodes:['prod','stg','dev','data']},
      {t:'예산·비용 할당 태그', d:'샌드박스 예산 상한', nodes:['cost','sbx']}
    ],
    gcp: [
      {t:'Cloud Identity · 조직 노드', d:'도메인 확인 후 조직 생성', cfg:'sso', nodes:['root','idp']},
      {t:'관리 그룹 · 슈퍼 관리자 분리', d:'조직 관리자·결제 관리자 그룹', cfg:'sso', nodes:['idp']},
      {t:'폴더 구조', d:'common · prod · nonprod · sandbox', nodes:['ou-sec','ou-infra','ou-wl','ou-sbx']},
      {t:'조직 정책', d:'리소스 위치 제한, 외부 IP 금지, 서비스 계정 키 생성 금지', cfg:'guardrail', nodes:['guard']},
      {t:'로그 프로젝트 + 조직 집계 싱크', d:'보존 기간 잠금', cfg:'audit', nodes:['log']},
      {t:'Security Command Center', d:'조직 수준 활성화', nodes:['sec']},
      {t:'Shared VPC 호스트 프로젝트', d:'서브넷·방화벽 정책·Cloud NAT를 한 곳에서', cfg:'hubnet', nodes:['hub','egress']},
      {t:'서비스 프로젝트 생성 · 연결', d:'서브넷 단위 networkUser 부여', cfg:'account', nodes:['prod','stg','dev','data']},
      {t:'결제 내보내기 · 예산', d:'BigQuery로 내보내기, 라벨', nodes:['cost','sbx']}
    ],
    azure: [
      {t:'Entra ID 테넌트 · 관리 그룹 계층', d:'테넌트 루트 아래 플랫폼·랜딩 존·샌드박스', nodes:['root','ou-sec','ou-infra','ou-wl','ou-sbx']},
      {t:'그룹 · PIM', d:'Owner는 PIM 활성화로만', cfg:'sso', nodes:['idp']},
      {t:'Azure Policy 이니셔티브 할당', d:'허용 위치, 진단 설정 자동 배포', cfg:'guardrail', nodes:['guard']},
      {t:'관리 구독: Log Analytics', d:'활동 로그를 모든 구독에서 모음', cfg:'audit', nodes:['log']},
      {t:'Defender for Cloud', d:'관리 그룹 단위 정책으로 켜기', nodes:['sec']},
      {t:'연결 구독: 허브 VNet', d:'게이트웨이·방화벽 서브넷', cfg:'hubnet', nodes:['hub']},
      {t:'Azure Firewall + 방화벽 정책', d:'애플리케이션 규칙으로 도메인 허용', cfg:'egressfw', nodes:['egress']},
      {t:'워크로드 구독 생성 · 관리 그룹 배치', d:'스포크 VNet 피어링, UDR', cfg:'account', nodes:['prod','stg','dev','data']},
      {t:'예산 · 태그 정책', d:'샌드박스 예산 경보', nodes:['cost','sbx']}
    ]
  },
  map: ['org-root','grouping','account-unit','guardrail','sso','org-audit','network-hub','sec-posture','cost-mgmt'],
  decisions: [
    {t:'무엇을 경계의 단위로 삼는가',
     p:'계정·프로젝트·구독은 모두 "리소스가 사는 상자"지만, 그 상자가 끊어 주는 것이 조금씩 다릅니다.',
     aws:'계정이 권한, 네트워크, 과금, 서비스 할당량의 경계입니다. 계정 생성은 Organizations API나 Control Tower Account Factory로 자동화합니다.',
     gcp:'프로젝트가 API 활성화, 할당량, 과금 연결, IAM의 경계입니다. 가볍게 많이 만드는 단위라 앱·환경마다 하나씩 두는 것이 보통입니다.',
     azure:'구독이 과금, 할당량, RBAC의 큰 경계이고, 그 안의 리소스 그룹이 함께 만들고 지우는 수명 주기 단위입니다.',
     so:'팀 × 환경 단위로 나누는 것이 출발점입니다. 너무 잘게 나누면 네트워크 연결과 권한 관리가 늘고, 너무 크게 묶으면 사고 범위와 비용 배분이 흐려집니다.'},
    {t:'가드레일을 누가 끌 수 있는가',
     p:'정책을 거는 것보다, 그 정책을 우회하거나 끌 수 있는 권한을 누가 가졌는지가 더 중요합니다.',
     aws:'SCP는 멤버 계정의 루트 사용자까지 제한하지만 관리 계정에는 적용되지 않습니다. 그래서 관리 계정에는 워크로드를 두지 않습니다.',
     gcp:'조직 정책은 조직 정책 관리자 역할이 있어야 바꿀 수 있습니다. 이 역할은 조직 수준에서 소수에게만 줍니다.',
     azure:'관리 그룹에서 상속된 정책이라도 구독 Owner는 정책 예외를 만들 수 있습니다. Owner 역할을 워크로드 팀에 주지 않는 것이 핵심입니다.',
     so:'세 클라우드 모두 "최상위 관리자"가 가드레일 밖에 있습니다. 그 계정은 MFA, 사용 경보, 비상용 절차로만 씁니다.'},
    {t:'네트워크는 누가 소유하는가',
     p:'IP 대역과 방화벽을 중앙 팀이 쥘지, 각 팀이 갖고 허브로 연결할지에 따라 운영 방식이 달라집니다.',
     aws:'계정마다 VPC를 두고 Transit Gateway 허브로 연결합니다. 서브넷을 RAM으로 공유해 중앙에서 VPC를 소유하는 방식도 가능합니다.',
     gcp:'Shared VPC가 기본입니다. 호스트 프로젝트가 네트워크·방화벽을 소유하고, 서비스 프로젝트는 허락받은 서브넷에 리소스만 띄웁니다.',
     azure:'허브-스포크가 기본입니다. 각 구독의 스포크 VNet이 허브 VNet과 피어링하고, 허브에 방화벽과 게이트웨이를 둡니다.',
     so:'어느 방식이든 환경별 대역이 겹치면 나중에 연결할 수 없습니다. 아래 시뮬레이터로 대역부터 나눠 보세요.'},
    {t:'감사 로그를 지울 수 없게 만드는 법',
     p:'로그를 만드는 쪽과 보관하는 쪽이 같으면, 사고를 낸 권한으로 흔적도 지울 수 있습니다.',
     aws:'조직 CloudTrail 추적을 로그 보관 계정의 S3로 보내고, 버킷에 객체 잠금(규정 준수 모드)을 겁니다.',
     gcp:'조직 수준 집계 싱크로 로그 프로젝트의 로그 버킷에 모으고, 보존 기간을 잠급니다.',
     azure:'활동 로그를 진단 설정으로 로그 구독에 보내고, 장기 보관은 변경 불가 정책을 건 스토리지 계정에 둡니다.',
     so:'로그 보관 단위에는 워크로드 팀의 권한을 아예 주지 않습니다.'}
  ],
  sims: [{type:'cidr', values:{vpc:20, az:3, tiers:3, sub:24, envs:9}, q:'팀 3개 × 환경 3개가 겹치지 않으려면 주소가 얼마나 필요할까요?'}],
  iac: 'iac/scenario-03',
  checklist: [
    ['관리 계정(최상위 단위)에서 워크로드를 돌린다','최상위 단위는 가드레일 밖에 있는 경우가 많습니다. 결제와 조직 관리만 합니다.'],
    ['사람에게 장기 액세스 키를 준다','SSO로 로그인해 임시 자격 증명을 받게 합니다. 장기 키는 유출 사고의 가장 흔한 원인입니다.'],
    ['환경별 IP 대역을 겹치게 잡는다','나중에 허브로 연결하거나 사내망과 이을 때 대역을 바꾸려면 리소스를 다시 만들어야 합니다.'],
    ['로그를 만든 계정에 로그를 둔다','사고를 낸 권한으로 흔적도 지울 수 있습니다. 별도 단위에 모으고 잠급니다.'],
    ['태그·라벨 규칙 없이 시작한다','팀·환경·서비스 태그가 없으면 비용을 나눌 수 없습니다. 정책으로 필수 태그를 강제합니다.'],
    ['샌드박스에 예산 상한이 없다','실험으로 띄운 GPU 하나가 한 달 예산을 넘깁니다. 예산 경보와 자동 정리를 둡니다.'],
    ['계정·프로젝트·구독을 손으로 만든다','기본 네트워크, 로그, 정책이 빠진 단위가 생깁니다. 생성부터 코드로 자동화합니다.'],
    ['비상 접근 경로가 없다','SSO가 멈추면 아무도 못 들어갑니다. MFA를 건 비상 계정을 두고, 쓰이면 경보가 울리게 합니다.']
  ],
  refs: [
    ['AWS Organizations 서비스 제어 정책', 'https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html'],
    ['Google Cloud 리소스 계층 구조', 'https://cloud.google.com/resource-manager/docs/cloud-platform-resource-hierarchy'],
    ['Azure 랜딩 존', 'https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/']
  ],
  next: '시나리오 04 · 쿠버네티스 마이크로서비스'
};
