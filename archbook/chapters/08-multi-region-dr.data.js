window.SCENARIO = {
  no: 8, level: 'advanced', title: '멀티 리전 재해 복구',
  lede: '영역 장애는 시나리오 01에서 견뎠습니다. 이번에는 리전 전체가 멈추는 경우입니다. 두 번째 리전을 어디에 둘지, 데이터를 얼마나 늦게 복제해도 되는지, 전환을 누가 결정할지가 RPO와 RTO를 정합니다.',
  region: {aws:'서울 ↔ 도쿄', gcp:'서울 ↔ 도쿄', azure:'Korea Central ↔ Korea South'},
  req: [
    {k:'RPO', v:'5분', s:'잃어도 되는 최근 데이터'},
    {k:'RTO', v:'30분', s:'서비스가 멈춰도 되는 시간'},
    {k:'전략', v:'웜 스탠바이', s:'대기 리전에 작은 전체 스택'},
    {k:'규제', v:'데이터 국외 이전 확인', s:'개인정보가 포함된 DB'}
  ],
  intro: { arch: '평소에는 서울이 모든 요청을 받고, 대기 리전은 데이터를 복제받으며 작은 용량으로 떠 있습니다. <b>서울 리전 장애</b>를 눌러 무엇이 넘어가는지 보세요.' },
  diagram: {
    w: 680, h: 440,
    frames: [
      {id:'primary', kind:'region', x:20, y:96, w:310, h:330, label:{aws:'ap-northeast-2 서울 (주)', gcp:'asia-northeast3 서울 (주)', azure:'Korea Central (주)'}},
      {id:'secondary', kind:'region', x:350, y:96, w:310, h:330, label:{aws:'ap-northeast-1 도쿄 (대기)', gcp:'asia-northeast1 도쿄 (대기)', azure:'Korea South (대기)'}}
    ],
    nodes: [
      {id:'users', x:30, y:22, w:110, h:36, icon:'users', t:'사용자'},
      {id:'gslb', cfg:'gslb', x:230, y:16, w:220, h:50, icon:'gslb', t:'전역 트래픽 전환', s:{aws:'Route 53 장애조치 레코드', gcp:'전역 외부 Application LB', azure:'Front Door'}, kind:'reg'},
      {id:'papp', cfg:'vmgroup', x:35, y:134, w:280, h:50, icon:'autoscale', t:'앱 · 전체 용량', s:{aws:'EC2 Auto Scaling · 20대', gcp:'관리형 인스턴스 그룹 · 20대', azure:'VM Scale Set · 20대'}},
      {id:'pdb', cfg:'dbdr', x:35, y:234, w:280, h:50, icon:'db', t:'DB Primary', s:{aws:'Aurora Global Database (주)', gcp:'Cloud SQL 주 인스턴스', azure:'Azure SQL 장애 조치 그룹 (주)'}},
      {id:'pobj', cfg:'bucket', x:35, y:334, w:280, h:50, icon:'obj', t:'파일', s:{aws:'S3 · 교차 리전 복제', gcp:'이중·멀티 리전 버킷', azure:'Blob · GRS'}},
      {id:'sapp', cfg:'vmgroup', x:365, y:134, w:280, h:50, icon:'autoscale', t:'앱 · 최소 용량', s:'평시 2대', failS:'전체 용량으로 확장 중'},
      {id:'sdb', cfg:'dbdr', x:365, y:234, w:280, h:50, icon:'db', t:'DB 복제본', s:{aws:'보조 리전 클러스터 (읽기 전용)', gcp:'교차 리전 읽기 복제본', azure:'지역 복제 보조 DB'}, failS:'승격 → Primary', kind:'alt'},
      {id:'sobj', cfg:'bucket', x:365, y:334, w:280, h:50, icon:'obj', t:'복제된 파일', s:{aws:'S3 대상 버킷', gcp:'같은 버킷 (다른 위치)', azure:'보조 지역 사본'}, kind:'alt'}
    ],
    edges: [
      {a:'users', b:'gslb'},
      {a:'gslb', b:'papp', fail:'hide'},
      {a:'gslb', b:'sapp', dash:true, fail:'hide', label:'상태 확인'},
      {a:'gslb', b:'sapp', fail:'show', label:'전환'},
      {a:'papp', b:'pdb'}, {a:'sapp', b:'sdb'},
      {a:'pdb', b:'sdb', dash:'both', label:'비동기 복제'},
      {a:'pobj', b:'sobj', dash:'both', label:'비동기 복제'}
    ]
  },
  fail: {
    button: '서울 리전 장애', restore: '복구', title: '주 리전 전체가 멈췄을 때',
    zones: ['primary'], zoneLabel: '리전 장애', down: ['papp','pdb','pobj'], promote: ['sdb','sapp'],
    normal: {
      aws: ['Route 53이 상태 확인을 통과한 서울 엔드포인트를 돌려줍니다. 장애조치 레코드의 보조 대상은 도쿄입니다.', 'Aurora Global Database가 스토리지 계층에서 도쿄 클러스터로 복제합니다(보통 1초 미만 지연).', 'S3 교차 리전 복제가 새 객체를 도쿄 버킷으로 복사합니다.'],
      gcp: ['전역 외부 Application LB의 Anycast IP 하나가 서울 백엔드로 보냅니다. 도쿄 백엔드는 같은 백엔드 서비스에 들어 있지만 용량이 작습니다.', 'Cloud SQL 교차 리전 읽기 복제본이 비동기로 따라옵니다.', '버킷 위치 유형이 이중·멀티 리전이면 객체가 여러 위치에 저장됩니다.'],
      azure: ['Front Door가 우선순위 1인 Korea Central 원본으로 보냅니다.', 'Azure SQL 장애 조치 그룹이 Korea South 보조 DB로 비동기 복제합니다.', 'GRS 스토리지는 쌍 지역인 Korea South에 사본을 비동기로 둡니다.']
    },
    effects: {
      aws: [
        ['good','Route 53 상태 확인이 실패하면 장애조치 레코드가 도쿄 엔드포인트를 돌려줍니다. 사람이 결정하게 하려면 Application Recovery Controller의 라우팅 제어를 씁니다.'],
        ['good','Aurora Global Database의 보조 리전 클러스터를 승격합니다. 비계획 장애조치라면 복제 지연만큼의 최근 쓰기는 잃습니다.'],
        ['warn','DNS를 캐시한 클라이언트는 TTL이 지날 때까지 서울로 갑니다. TTL을 짧게 둡니다.'],
        ['warn','도쿄 앱을 전체 용량으로 늘리는 동안 처리량이 모자랍니다. 같은 시점에 다른 고객도 도쿄로 몰릴 수 있어 용량 예약을 검토합니다.']
      ],
      gcp: [
        ['good','전역 LB가 상태 확인에 실패한 서울 백엔드를 빼고 도쿄로 보냅니다. Anycast IP가 그대로라 DNS 전파를 기다리지 않습니다.'],
        ['good','Cloud SQL 복제본을 승격하거나, DR 복제본으로 지정해 두었다면 장애조치를 실행합니다. 승격 후 접속 주소가 바뀌는지 확인합니다.'],
        ['warn','버킷 복제는 비동기입니다. 이중 리전 버킷에 터보 복제를 켜면 15분 RPO를 목표로 합니다.'],
        ['warn','도쿄 인스턴스 그룹이 늘어나는 동안 처리량이 모자랍니다.']
      ],
      azure: [
        ['good','Front Door 상태 프로브가 Korea Central 원본을 비정상으로 보고 Korea South 원본으로 보냅니다.'],
        ['good','Azure SQL 장애 조치 그룹은 읽기·쓰기 수신기 이름이 그대로라 앱의 접속 문자열을 바꾸지 않아도 됩니다.'],
        ['warn','GRS 보조 지역의 데이터는 장애조치를 시작하기 전에는 쓸 수 없고, RA-GRS여야 읽을 수 있습니다.'],
        ['warn','Korea South의 VM Scale Set을 전체 용량으로 늘리는 동안 처리량이 모자랍니다.']
      ]
    }
  },
  scope: ['gslb','dbdr','bucket','vmgroup'],
  build: {
    aws: [
      {t:'DR 리전 네트워크', d:'CIDR 겹치지 않게, 같은 구조', cfg:'vpc', nodes:['secondary']},
      {t:'Aurora Global Database', d:'보조 리전 클러스터 추가', cfg:'dbdr', nodes:['pdb','sdb']},
      {t:'S3 교차 리전 복제', d:'버전 관리 필수, 복제 역할', cfg:'bucket', nodes:['pobj','sobj']},
      {t:'DR 리전 ASG (최소 2대) + ALB', d:'AMI 복사, 같은 시작 템플릿', cfg:'vmgroup', nodes:['sapp']},
      {t:'Route 53 상태 확인 + 장애 조치 레코드', cfg:'gslb', nodes:['gslb']},
      {t:'전환 런북', d:'DB 승격 → 확장 → DNS 전환 순서', cfg:'dbdr', nodes:['pdb','sdb','sapp','gslb']}
    ],
    gcp: [
      {t:'DR 리전 서브넷', d:'같은 VPC에 서브넷만 추가', cfg:'subnet', nodes:['secondary']},
      {t:'Cloud SQL 교차 리전 복제본', cfg:'dbdr', nodes:['pdb','sdb']},
      {t:'이중·멀티 리전 버킷', d:'버킷 하나, 복제 설정 없음', cfg:'bucket', nodes:['pobj','sobj']},
      {t:'DR 리전 MIG (최소 2대)', d:'같은 인스턴스 템플릿', cfg:'vmgroup', nodes:['sapp']},
      {t:'백엔드 서비스에 백엔드 추가', d:'전역 LB 하나가 두 리전으로', cfg:'gslb', nodes:['gslb']},
      {t:'전환 런북', d:'복제본 승격 → 앱 연결 대상 변경 → 확장', cfg:'dbdr', nodes:['pdb','sdb','sapp']}
    ],
    azure: [
      {t:'DR 지역 VNet + 피어링', cfg:'vpc', nodes:['secondary']},
      {t:'보조 논리 서버 + 장애 조치 그룹', d:'수신기 이름으로 접속', cfg:'dbdr', nodes:['pdb','sdb']},
      {t:'스토리지 GRS (또는 객체 복제)', d:'계정 중복성 설정', cfg:'bucket', nodes:['pobj','sobj']},
      {t:'DR 지역 VMSS + Application Gateway', cfg:'vmgroup', nodes:['sapp']},
      {t:'Front Door 원본 그룹 우선순위', cfg:'gslb', nodes:['gslb']},
      {t:'전환 런북', d:'장애 조치 그룹 전환 → 확장 → 원본 우선순위', cfg:'dbdr', nodes:['pdb','sdb','sapp','gslb']}
    ]
  },
  map: ['global-traffic','cross-region-db','object-replication','dr-service'],
  decisions: [
    {t:'두 번째 리전을 어디에 두는가',
     p:'가까울수록 복제 지연이 짧지만, 같은 재해(지진, 대규모 정전)를 함께 겪을 수 있습니다. 그리고 국내 리전 수가 클라우드마다 다릅니다.',
     aws:'국내 리전은 서울 하나라, 리전 단위 DR은 도쿄·오사카 같은 국외 리전에 둡니다.',
     gcp:'국내 리전은 서울 하나라, 리전 단위 DR은 도쿄·오사카 같은 국외 리전에 둡니다.',
     azure:'Korea Central과 Korea South가 쌍 지역이라 국내에서 리전 단위 DR을 구성할 수 있습니다. GRS 같은 기능이 쌍 지역을 기본 복제 대상으로 씁니다.',
     so:'개인정보와 규제 데이터의 국외 이전이 허용되는지 법무·보안팀과 먼저 확인합니다. 리전 수는 바뀔 수 있으니 설계 시점에 다시 봅니다.'},
    {t:'전환은 누가 결정하는가',
     p:'자동 전환은 빠르지만, 상태 확인 오탐으로 멀쩡한 주 리전을 버리고 데이터를 잃을 수 있습니다.',
     aws:'Route 53 상태 확인으로 트래픽을 자동 전환할 수 있고, Application Recovery Controller의 라우팅 제어로 사람이 스위치를 누르게 할 수도 있습니다.',
     gcp:'전역 LB는 상태 확인에 따라 트래픽을 자동으로 옮깁니다. Cloud SQL 승격은 명령으로 실행합니다.',
     azure:'Front Door는 자동으로 원본을 바꾸고, SQL 장애 조치 그룹은 고객이 직접 장애조치를 시작하도록 설정하는 것이 권장됩니다.',
     so:'흔한 절충은 "트래픽은 자동, DB 승격은 사람 판단"입니다. 판단 기준과 담당자를 런북에 적어 둡니다.'},
    {t:'DB 복제의 지연과 쓰기 위치',
     p:'비동기 복제는 빠르지만 지연만큼 데이터를 잃고, 동기 복제는 잃지 않지만 모든 쓰기가 느려집니다.',
     aws:'Aurora Global Database는 보조 리전이 읽기 전용이며 보통 1초 미만으로 따라옵니다. 쓰기 전달 기능으로 보조 리전 앱의 쓰기를 주 리전에 보낼 수 있습니다.',
     gcp:'Cloud SQL 교차 리전 복제본은 비동기입니다. RPO 0이 필요하면 멀티 리전 Spanner처럼 동기 복제 DB를 쓰고 쓰기 지연을 받아들입니다.',
     azure:'SQL 장애 조치 그룹은 비동기 지역 복제입니다. 여러 리전에서 쓰기가 필요하면 Cosmos DB 다중 리전 쓰기를 검토합니다.',
     so:'아래 시뮬레이터에서 복제 지연과 감지 시간이 RPO·RTO를 어떻게 바꾸는지 확인해 보세요.'},
    {t:'DR은 시험한 만큼만 동작한다',
     p:'한 번도 넘겨 보지 않은 DR은 대개 넘어가지 않습니다. 시크릿, 인증서, 할당량, 이미지 같은 작은 누락이 원인입니다.',
     aws:'Fault Injection Service로 장애를 흉내 내고, 정해진 날 실제로 도쿄로 전환해 봅니다.',
     gcp:'복제본 승격과 트래픽 전환을 리허설하고, 걸린 시간을 기록합니다.',
     azure:'Chaos Studio로 장애를 흉내 내고, 장애 조치 그룹과 Site Recovery의 테스트 장애조치를 실행합니다.',
     so:'분기마다 실제로 넘겨 RTO를 재고, 다시 서울로 돌아오는 복귀 절차까지 시험합니다.'}
  ],
  sims: [{type:'rpo', values:{tRpo:5, tRto:30, bk:24, restore:180, lag:2, detect:5, promote:5, scale:10, ttl:60}}],
  iac: 'iac/scenario-08',
  checklist: [
    ['대기 리전의 할당량을 확인하지 않았다','전환하려는 순간 인스턴스 한도에 막힙니다. 대기 리전 할당량을 주 리전과 같게 올려 둡니다.'],
    ['시크릿·인증서·이미지가 주 리전에만 있다','앱이 떠도 접속 정보와 이미지가 없어 시작하지 못합니다.'],
    ['DNS TTL이 길다','클라이언트가 몇 시간 동안 죽은 리전으로 갑니다.'],
    ['전환을 한 번도 해 보지 않았다','DR 계획은 시험 전까지 가설입니다.'],
    ['복귀 절차가 없다','주 리전이 살아나면 데이터를 다시 맞추고 돌아와야 합니다. 이 과정이 더 어렵습니다.'],
    ['운영 도구도 주 리전에만 있다','배포 파이프라인, 모니터링, 런북 저장소가 함께 멈추면 대응할 수 없습니다.'],
    ['인프라 코드가 대기 리전과 어긋났다','주 리전만 고치다 보면 대기 리전 설정이 낡습니다. 같은 IaC로 두 리전을 배포합니다.'],
    ['리전 간 전송 비용을 계산하지 않았다','복제 트래픽은 리전 간 데이터 전송으로 과금됩니다.']
  ],
  refs: [
    ['AWS 재해 복구 전략 (백서)', 'https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html'],
    ['Google Cloud 재해 복구 계획 가이드', 'https://cloud.google.com/architecture/dr-scenarios-planning-guide'],
    ['Azure 지역 간 복제(쌍 지역)', 'https://learn.microsoft.com/azure/reliability/cross-region-replication-azure']
  ],
  next: '시나리오 09 · 금융·공공 규제 환경'
};
