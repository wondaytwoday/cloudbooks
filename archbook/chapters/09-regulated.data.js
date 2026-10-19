window.SCENARIO = {
  no: 9, level: 'advanced', title: '금융·공공 규제 환경',
  lede: '금융권과 공공기관의 시스템은 인터넷과의 경계, 암호화 키 관리, 관리자 접속 기록, 감사 로그 보관을 증명할 수 있어야 합니다. 같은 요구를 세 클라우드가 어떤 도구로 풀어내는지, 특히 자격 증명이 털렸을 때도 데이터가 밖으로 나가지 않게 하는 방법이 다릅니다.',
  region: {aws:'ap-northeast-2 · 인터넷 비노출', gcp:'asia-northeast3 · 인터넷 비노출', azure:'Korea Central · 인터넷 비노출'},
  req: [
    {k:'네트워크', v:'인터넷 직접 노출 금지', s:'외부로는 허용 목록 도메인만'},
    {k:'암호화', v:'고객 관리 키', s:'키 사용·삭제 이력 추적'},
    {k:'관리자', v:'기록되는 경로로만 접속', s:'공유 계정·SSH 포트 금지'},
    {k:'감사', v:'로그 5년, 변경 불가', s:'감독기관 제출 대비'}
  ],
  intro: {
    arch: '사용자와 관리자 모두 정해진 경로로만 들어오고, 앱은 클라우드 서비스에도 비공개 경로로 접근합니다. <b>데이터 반출 시도</b>를 눌러 털린 자격 증명으로 외부에 복사하려 할 때 무엇이 막는지 보세요.',
    chk: '감사 대응 전에 스스로 점검할 항목입니다. 국내 규정(전자금융감독규정, 클라우드 보안인증 등)의 세부 요건은 기관별로 확인하세요.'
  },
  diagram: {
    w: 680, h: 460,
    frames: [
      {id:'region', kind:'region', x:206, y:10, w:464, h:440, label:{aws:'서울 리전 · 비공개 서브넷만', gcp:'서울 리전 · 외부 IP 없음', azure:'Korea Central · 공용 IP 없음'}, labelRight:true},
      {id:'perim', kind:'group', x:438, y:184, w:226, h:258, label:{aws:'엔드포인트 정책 + 리소스 정책', gcp:'VPC 서비스 제어 경계', azure:'공용 네트워크 접근 차단'}}
    ],
    nodes: [
      {id:'onprem', x:14, y:30, w:178, h:48, icon:'onprem', t:'영업점·사내망', s:'전용선으로만 접속'},
      {id:'admin', x:14, y:206, w:178, h:48, icon:'users', t:'운영자', s:'MFA · 작업 승인'},
      {id:'ext', x:14, y:116, w:178, h:48, icon:'obj', t:'외부 저장소', s:'공격자 소유 계정', fail:'show'},
      {id:'ilb', x:222, y:30, w:200, h:48, icon:'lb', t:'내부 로드밸런서', s:{aws:'내부 ALB', gcp:'내부 Application LB', azure:'내부 Application Gateway'}},
      {id:'bastion', x:222, y:206, w:200, h:48, icon:'bastion', t:'관리 접속 · 세션 기록', s:{aws:'Systems Manager Session Manager', gcp:'IAP TCP 전달 · OS Login', azure:'Azure Bastion'}},
      {id:'app', x:222, y:116, w:200, h:48, icon:'vm', t:'업무 앱', s:'비공개 서브넷', failS:'자격 증명 탈취됨'},
      {id:'egress', x:450, y:116, w:200, h:48, icon:'fw', t:'인터넷 출구 허용 목록', s:{aws:'Network Firewall 도메인 목록', gcp:'Secure Web Proxy · Cloud NGFW', azure:'Azure Firewall 애플리케이션 규칙'}},
      {id:'audit', x:222, y:300, w:200, h:48, icon:'audit', t:'변경 불가 감사 로그', s:{aws:'CloudTrail → S3 객체 잠금', gcp:'감사 로그 → 잠근 로그 버킷', azure:'활동 로그 → 변경 불가 Blob'}, kind:'alt'},
      {id:'pe', x:450, y:212, w:204, h:48, icon:'privlink', t:'서비스 비공개 연결', s:{aws:'VPC 엔드포인트', gcp:'Private Service Connect', azure:'Private Endpoint'}},
      {id:'store', x:450, y:296, w:204, h:48, icon:'obj', t:'업무 데이터', s:{aws:'S3 · SSE-KMS', gcp:'Cloud Storage · CMEK', azure:'Blob · 고객 관리 키'}},
      {id:'kms', x:450, y:380, w:204, h:48, icon:'kms', t:'고객 관리 키', s:{aws:'KMS · CloudHSM', gcp:'Cloud KMS · Cloud HSM', azure:'Key Vault Managed HSM'}}
    ],
    edges: [
      {a:'onprem', b:'ilb', label:'전용선'}, {a:'ilb', b:'app'},
      {a:'admin', b:'bastion'}, {a:'bastion', b:'app', dash:true, label:'세션 기록'},
      {a:'app', b:'pe'}, {a:'pe', b:'store'}, {a:'store', b:'kms', dash:true, label:'암호화'},
      {a:'app', b:'egress', dash:true, label:'허용 도메인만'},
      {a:'app', b:'ext', fail:'show', dash:true, label:'복사 시도 ✕', ly:-16}
    ]
  },
  fail: {
    button: '데이터 반출 시도', restore: '원래대로', title: '탈취한 자격 증명으로 외부 저장소에 복사하려 할 때',
    down: [],
    normal: {
      aws: ['영업점은 전용선으로 내부 ALB에 들어오고, 운영자는 Session Manager로만 서버에 접속합니다. 세션 내용은 S3와 CloudWatch Logs에 남습니다.', '앱은 VPC 엔드포인트로 S3와 KMS를 부릅니다. 인터넷으로 나가는 요청은 Network Firewall의 허용 도메인 목록을 거칩니다.'],
      gcp: ['영업점은 전용선으로 내부 LB에 들어오고, 운영자는 IAP TCP 전달로 외부 IP 없는 VM에 접속합니다.', '앱은 Private Service Connect로 Google API를 부르고, 프로젝트들은 VPC 서비스 제어 경계 안에 묶여 있습니다.'],
      azure: ['영업점은 ExpressRoute로 내부 Application Gateway에 들어오고, 운영자는 Azure Bastion으로만 VM에 접속합니다.', '스토리지와 Key Vault는 공용 네트워크 접근을 끄고 Private Endpoint로만 받습니다. 인터넷 출구는 Azure Firewall입니다.']
    },
    effects: {
      aws: [
        ['good','VPC 엔드포인트 정책에 aws:ResourceOrgID 조건을 걸어 두면, 엔드포인트를 지나는 요청은 우리 조직 계정의 버킷에만 닿습니다. 외부 계정 버킷으로의 복사는 거부됩니다.'],
        ['good','버킷 정책에서 aws:SourceVpce가 우리 엔드포인트가 아닌 요청을 거부하면, 털린 키를 회사 밖에서 써도 데이터를 읽을 수 없습니다.'],
        ['good','인터넷으로 직접 보내려는 시도는 Network Firewall 허용 목록에 없는 도메인이라 차단됩니다.'],
        ['warn','이 경계들은 정책을 하나씩 엮어 만드는 것이라 빠진 서비스가 생기기 쉽습니다. SCP로 조직 전체에 같은 조건을 거는 데이터 경계 설계를 함께 씁니다.']
      ],
      gcp: [
        ['good','VPC 서비스 제어 경계 밖 프로젝트의 버킷으로 복사하는 요청은 자격 증명이 유효해도 경계 위반으로 거부됩니다.'],
        ['good','경계 밖에서 탈취한 자격 증명으로 경계 안 API를 부르는 것도 액세스 수준 조건(IP·기기)에 맞지 않으면 거부됩니다.'],
        ['good','위반 시도는 감사 로그에 남아 경보로 받을 수 있습니다. 먼저 시험 실행 모드로 켜 두고 영향을 확인한 뒤 적용합니다.'],
        ['good','인터넷 직접 전송은 외부 IP가 없고 출구 정책에 없는 도메인이라 막힙니다.']
      ],
      azure: [
        ['good','스토리지 계정의 공용 네트워크 접근을 끄면, 털린 키를 회사 밖에서 써도 이 계정에는 접근할 수 없습니다.'],
        ['warn','앱 서버에서 외부 스토리지 계정으로 보내는 것은 스토리지 쪽 설정으로 막을 수 없습니다. Azure Firewall 애플리케이션 규칙으로 허용한 FQDN 외에는 막아야 합니다.'],
        ['good','PaaS 리소스를 하나의 경계로 묶는 네트워크 보안 경계 기능도 있으니 지원 서비스와 지역을 확인해 함께 씁니다.'],
        ['good','모든 시도는 방화벽 로그와 스토리지 진단 로그에 남습니다.']
      ]
    }
  },
  map: ['private-endpoint','data-perimeter','egress-filter','kms','admin-access','immutable-log','compliance'],
  decisions: [
    {t:'데이터 반출을 막는 경계',
     p:'자격 증명은 언젠가 털린다고 가정합니다. 그때도 "어디서, 어디로" 호출하는지로 막을 수 있어야 합니다.',
     aws:'VPC 엔드포인트 정책, 버킷·키 정책, SCP에 aws:SourceVpce, aws:ResourceOrgID, aws:PrincipalOrgID 같은 조건 키를 엮어 데이터 경계를 만듭니다.',
     gcp:'VPC 서비스 제어가 프로젝트 묶음 둘레에 API 수준 경계를 칩니다. 경계를 넘는 복사는 IAM 권한과 상관없이 거부됩니다.',
     azure:'Private Endpoint와 공용 네트워크 접근 차단, 방화벽 출구 규칙을 조합합니다. PaaS 리소스 묶음에는 네트워크 보안 경계 기능을 검토합니다.',
     so:'GCP는 경계가 제품 하나로 제공되고, AWS·Azure는 여러 정책을 엮어야 합니다. 어느 쪽이든 시험 모드로 먼저 켜 영향을 확인합니다.'},
    {t:'키를 누가 쥐는가',
     p:'고객 관리 키를 쓰면 키 사용 이력이 남고, 키를 끄는 것만으로 데이터 접근을 막을 수 있습니다. 대신 키 사고가 곧 데이터 사고가 됩니다.',
     aws:'KMS 고객 관리형 키로 시작하고, 전용 하드웨어가 필요하면 CloudHSM이나 외부 키 저장소(XKS)를 씁니다. 키 삭제에는 7~30일 대기 기간이 있습니다.',
     gcp:'Cloud KMS로 CMEK를 걸고, 하드웨어 보호가 필요하면 Cloud HSM, 키를 클라우드 밖에 두려면 Cloud EKM을 씁니다. 키 버전 폐기는 예약 기간을 둡니다.',
     azure:'Key Vault에 고객 관리 키를 두고, 단일 테넌트 HSM이 필요하면 Managed HSM을 씁니다. 일시 삭제와 제거 보호를 반드시 켭니다.',
     so:'키 관리자와 데이터 관리자를 다른 사람으로 나누고, 키 비활성화·삭제에 경보를 겁니다.'},
    {t:'관리자 접속 경로',
     p:'SSH·RDP 포트를 열지 않고, 누가 언제 무엇을 했는지 남는 경로로만 들어오게 합니다.',
     aws:'Systems Manager Session Manager로 포트 없이 접속하고, 세션 기록을 S3와 CloudWatch Logs에 남깁니다.',
     gcp:'IAP TCP 전달로 외부 IP 없이 접속하고, OS Login으로 IAM 계정을 VM 사용자에 연결합니다.',
     azure:'Azure Bastion으로 브라우저나 네이티브 클라이언트에서 접속합니다. 세션 녹화는 Premium SKU 기능입니다.',
     so:'접속 경로를 하나로 좁히면 "접속 기록이 없는 접속은 없다"를 증명할 수 있습니다.'},
    {t:'규정 준수를 상시 점검하는 법',
     p:'감사 직전에 한꺼번에 확인하는 대신, 설정이 어긋나는 순간 알 수 있어야 합니다.',
     aws:'AWS Config 규칙과 적합성 팩으로 설정을 상시 평가하고, Audit Manager로 증적을 모읍니다.',
     gcp:'조직 정책으로 금지할 것을 막고, Security Command Center로 잘못된 설정을 찾습니다.',
     azure:'Azure Policy 이니셔티브로 평가·거부하고, Defender for Cloud의 규정 준수 대시보드로 현황을 봅니다.',
     so:'세 클라우드 모두 국제 표준 기준은 기본 제공하지만, 국내 규정에 맞춘 항목 대응표는 직접 만들어야 하는 경우가 많습니다.'}
  ],
  sims: [{type:'logvol', values:{eps:500, bytes:800, hot:90, years:5, comp:8}}],
  iac: 'iac/scenario-09',
  checklist: [
    ['공용 엔드포인트가 하나라도 남아 있다','관리 콘솔용으로 잠깐 연 공인 IP, 공개 버킷 하나가 경계를 무너뜨립니다. 조직 정책으로 생성 자체를 막습니다.'],
    ['키 삭제 보호가 없다','실수나 악의로 키가 지워지면 데이터는 복구할 수 없습니다.'],
    ['출구 허용 목록에 와일드카드가 많다','*.amazonaws.com 같은 넓은 허용은 공격자 계정의 리소스까지 열어 줍니다.'],
    ['관리자가 공유 계정을 쓴다','누가 했는지 증명할 수 없습니다. 개인 계정과 SSO, 작업 승인 기록을 씁니다.'],
    ['로그 보존 잠금을 걸지 않았다','보존 정책만 있고 잠그지 않으면 관리자가 정책을 바꿔 지울 수 있습니다.'],
    ['패치 경로를 생각하지 않았다','인터넷이 막힌 서버는 OS·패키지 업데이트를 받을 내부 저장소나 관리형 패치 서비스가 필요합니다.'],
    ['운영 데이터를 개발 환경으로 복사한다','마스킹 없이 복사하면 개발 환경이 규제 범위 안으로 들어옵니다.'],
    ['경계를 시험 모드 없이 바로 적용한다','정상 업무 호출까지 막혀 장애가 납니다. 위반 로그를 먼저 보고 적용합니다.']
  ],
  refs: [
    ['AWS 데이터 경계 구축', 'https://docs.aws.amazon.com/whitepapers/latest/building-a-data-perimeter-on-aws/building-a-data-perimeter-on-aws.html'],
    ['VPC 서비스 제어 개요', 'https://cloud.google.com/vpc-service-controls/docs/overview'],
    ['Azure Private Endpoint', 'https://learn.microsoft.com/azure/private-link/private-endpoint-overview']
  ],
  next: '시나리오 10 · 트래픽 급증 대응'
};
