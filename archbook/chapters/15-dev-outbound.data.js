window.SCENARIO = {
  no: 15, level: 'network', title: '개발 서버: 나가는 통신만 열기',
  lede: '개발 서버 몇 대가 패키지를 설치하고 GitHub와 외부 API를 불러야 합니다. 하지만 인터넷에서 이 서버로 들어오는 연결은 하나도 없어야 합니다. "나가는 건 되고 들어오는 건 안 되는" 이 흔한 요구를 세 클라우드가 각각 어떤 설정의 조합으로 만드는지, 패킷 경로를 따라가며 확인합니다.',
  region: {aws:'ap-northeast-2 · 개발 계정', gcp:'asia-northeast3 · dev 프로젝트', azure:'Korea Central · dev 구독'},
  req: [
    {k:'서버', v:'개발 VM 2~5대', s:'팀원이 수시로 만들고 지움'},
    {k:'나가는 통신', v:'apt·pip·npm, GitHub, 외부 API', s:'HTTPS 위주'},
    {k:'들어오는 통신', v:'없음', s:'인터넷에서 시작하는 연결 전부 차단'},
    {k:'관리 접속', v:'SSH 셸', s:'22번 포트를 인터넷에 열지 않고'},
    {k:'비용', v:'최소', s:'개발 환경이라 고가용성보다 비용 우선'}
  ],
  intro: {
    arch: '위의 <b>통신 경로 추적</b>에서 통신을 하나 골라 보세요. 패킷이 지나는 곳이 도면에 표시되고, 아래 표에 각 지점에서 어떤 설정이 그 통신을 통과시키거나 막는지 나옵니다. 클라우드를 바꾸면 같은 통신이 다른 설정 조합으로 처리되는 것을 볼 수 있습니다.'
  },

  diagram: {
    aws: { w: 700, h: 520, aria: 'AWS 개발 VPC: 퍼블릭 서브넷의 NAT 게이트웨이와 인터넷 게이트웨이, 공인 IP 없는 개발 서버, S3 게이트웨이 엔드포인트',
      frames: [
        {id:'region', kind:'region', x:14, y:84, w:672, h:424, label:'ap-northeast-2 · 개발 계정'},
        {id:'vpc', kind:'net', x:26, y:116, w:648, h:304, label:'VPC vpc-dev 10.10.0.0/16', cfg:'vpc'},
        {id:'pub', kind:'plain', x:38, y:150, w:624, h:82, label:'퍼블릭 서브넷 10.10.0.0/24 · AZ a', cfg:'subnet', why:'NAT 게이트웨이만 들어가는 서브넷입니다. 개발 서버는 여기에 두지 않습니다.'},
        {id:'priv', kind:'plain', x:38, y:244, w:624, h:164, label:'개발 서브넷 10.10.10.0/24 · AZ a', labelRight:true, cfg:'subnet', why:'인터넷 게이트웨이 경로가 없는 프라이빗 서브넷입니다. 개발 환경이라 AZ 하나만 씁니다.'}
      ],
      nodes: [
        {id:'inet', x:466, y:8, w:220, h:44, t:'인터넷', s:'패키지 저장소 · GitHub · 외부 API', kind:'alt'},
        {id:'devpc', x:14, y:8, w:200, h:44, icon:'users', t:'개발자 노트북', s:'사무실·재택'},
        {id:'igw', x:440, y:100, w:200, h:36, icon:'igw', t:'인터넷 게이트웨이', s:'VPC에 연결', kind:'reg', cfg:'igw'},
        {id:'nat', x:56, y:176, w:180, h:42, icon:'nat', t:'NAT 게이트웨이', s:'EIP 3.38.x.x', cfg:'nat', why:'개발 환경이라 AZ 하나에만 둡니다. 이 AZ가 멈추면 개발 서버의 외부 통신도 멈추지만, 운영이 아니므로 비용을 택했습니다.'},
        {id:'rtpub', kind:'chip', x:250, y:188, t:'rt-public: 0/0 → igw', cfg:'route'},
        {id:'vm1', x:56, y:286, w:150, h:44, icon:'vm', t:'dev-01', s:'사설 IP만 · 10.10.10.11', cfg:'vmgroup'},
        {id:'vm2', x:216, y:286, w:150, h:44, icon:'vm', t:'dev-02', s:'사설 IP만 · 10.10.10.12', cfg:'vmgroup'},
        {id:'sgdev', kind:'chip', x:56, y:344, t:'SG sg-dev: 인바운드 규칙 없음 · 아웃바운드 443·80', cfg:'firewall', why:'보안 그룹은 상태 저장이라 나간 요청의 응답은 인바운드 규칙 없이도 들어옵니다. 그래서 인바운드 규칙을 하나도 두지 않는 것이 "들어오는 건 막기"입니다.'},
        {id:'rtdev', kind:'chip', x:56, y:254, t:'rt-dev: 0/0 → nat · S3 접두사 목록 → vpce', cfg:'route', why:'0.0.0.0/0은 NAT로, S3 접두사 목록은 게이트웨이 엔드포인트로 갑니다. 더 구체적인 경로가 이깁니다.'},
        {id:'s3ep', x:420, y:286, w:224, h:44, icon:'privlink', t:'S3 게이트웨이 엔드포인트', s:'라우팅 테이블에 경로 추가 · 무료', cfg:'privlink'},
        {id:'ssm', x:236, y:8, w:210, h:44, icon:'bastion', t:'Session Manager', s:'IAM 인증 · 세션 기록', kind:'alt', cfg:'admin'},
        {id:'s3', x:240, y:448, w:220, h:44, icon:'obj', t:'S3 아티팩트 버킷', s:'버킷 정책: 엔드포인트만', kind:'alt', cfg:'bucket'}
      ],
      edges: [
        {a:'igw', b:'inet', dash:'both'},
        {a:'nat', b:'igw', dash:true},
        {a:'vm1', b:'nat', dash:true}, {a:'vm2', b:'nat', dash:true},
        {a:'s3ep', b:'s3', dash:true}
      ],
      notes: [{x:350, y:436, t:'VPC 밖의 리전 서비스', anchor:'middle'}]
    },

    gcp: { w: 700, h: 520, aria: 'GCP 개발 VPC: 자동 생성된 기본 인터넷 게이트웨이, VPC 단위 방화벽 규칙, 외부 IP 없는 개발 VM, Cloud NAT, 비공개 Google 액세스',
      frames: [
        {id:'vpc', kind:'net', x:14, y:84, w:672, h:330, label:'VPC vpc-dev · 전역', cfg:'vpc'},
        {id:'region', kind:'region', x:26, y:178, w:648, h:224, label:'asia-northeast3'},
        {id:'priv', kind:'plain', x:38, y:206, w:420, h:184, label:'subnet-dev 10.10.10.0/24 · 리전', cfg:'subnet', why:'GCP에는 퍼블릭 서브넷이 따로 없습니다. VM에 외부 IP를 주지 않는 것으로 "프라이빗"이 됩니다.'}
      ],
      nodes: [
        {id:'inet', x:466, y:8, w:220, h:44, t:'인터넷', s:'패키지 저장소 · GitHub · 외부 API', kind:'alt'},
        {id:'devpc', x:14, y:8, w:200, h:44, icon:'users', t:'개발자 노트북', s:'gcloud · IAM 로그인'},
        {id:'igw', x:440, y:68, w:220, h:36, icon:'net', t:'기본 인터넷 게이트웨이', s:'0/0 경로 자동 생성', kind:'ghost', cfg:'igw'},
        {id:'fwin', kind:'chip', x:30, y:112, t:'묵시적: 인그레스 전부 거부', cfg:'firewall'},
        {id:'fwout', kind:'chip', x:210, y:112, t:'묵시적: 이그레스 전부 허용', cfg:'firewall'},
        {id:'fwiap', kind:'chip', x:30, y:140, t:'allow-iap-ssh: 35.235.240.0/20 → tcp:22 (대상 sa-dev)', cfg:'firewall', why:'IAP가 VM에 접속할 때 쓰는 대역만 22번을 엽니다. 인터넷 전체에 22번을 여는 것과 다릅니다.'},
        {id:'vm1', x:56, y:240, w:180, h:44, icon:'vm', t:'dev-01', s:'외부 IP 없음 · sa-dev', cfg:'vmgroup'},
        {id:'vm2', x:256, y:240, w:180, h:44, icon:'vm', t:'dev-02', s:'외부 IP 없음 · sa-dev', cfg:'vmgroup'},
        {id:'pga', kind:'chip', x:56, y:300, t:'비공개 Google 액세스 켬', cfg:'privlink', why:'외부 IP 없는 VM이 Cloud Storage 같은 Google API에 닿게 해 주는 서브넷 설정입니다.'},
        {id:'noroute', kind:'chip', x:56, y:326, t:'라우팅 테이블 설정 없음', cfg:'route'},
        {id:'nat', x:476, y:230, w:184, h:48, icon:'nat', t:'Cloud NAT', s:'Cloud Router · 리전', kind:'reg', cfg:'nat', why:'외부 IP 없는 VM의 인터넷 트래픽만 처리합니다. 경로를 따로 넣지 않습니다.'},
        {id:'iap', x:236, y:8, w:210, h:44, icon:'bastion', t:'IAP TCP 전달', s:'IAM 권한으로 터널', kind:'alt', cfg:'admin'},
        {id:'gcs', x:240, y:448, w:220, h:44, icon:'obj', t:'Cloud Storage 버킷', s:'서비스 계정 IAM', kind:'alt', cfg:'bucket'}
      ],
      edges: [
        {a:'igw', b:'inet', dash:'both'},
        {a:'nat', b:'igw', dash:true},
        {a:'vm2', b:'nat', dash:true}
      ],
      notes: [{x:350, y:436, t:'프로젝트 단위 서비스 (VPC 밖)', anchor:'middle'}]
    },

    azure: { w: 700, h: 540, aria: 'Azure 개발 VNet: 자동 시스템 경로, 서브넷에 연결한 NSG와 NAT Gateway, Azure Bastion, 서비스 엔드포인트',
      frames: [
        {id:'region', kind:'region', x:14, y:84, w:672, h:444, label:'Korea Central · rg-dev-network'},
        {id:'vpc', kind:'net', x:26, y:116, w:648, h:312, label:'VNet vnet-dev 10.10.0.0/16', cfg:'vpc'},
        {id:'priv', kind:'plain', x:38, y:150, w:624, h:150, label:'snet-dev 10.10.10.0/24', cfg:'subnet', why:'서브넷에 NSG와 NAT Gateway를 연결합니다. 기본 아웃바운드 액세스는 끄고 NAT로 출구를 명시합니다.'},
        {id:'bas', kind:'plain', x:38, y:312, w:624, h:104, label:'AzureBastionSubnet 10.10.250.0/26', cfg:'subnet', why:'Bastion은 이 이름의 전용 서브넷이 필요합니다.'}
      ],
      nodes: [
        {id:'inet', x:466, y:8, w:220, h:44, t:'인터넷', s:'패키지 저장소 · GitHub · 외부 API', kind:'alt'},
        {id:'devpc', x:14, y:8, w:200, h:44, icon:'users', t:'개발자 노트북', s:'Entra ID 로그인'},
        {id:'igw', x:440, y:98, w:220, h:36, icon:'igw', t:'시스템 경로 → Internet', s:'자동', kind:'ghost', cfg:'igw'},
        {id:'nsg', kind:'chip', x:250, y:158, t:'NSG nsg-dev (서브넷): 기본 규칙 + 22 ← Bastion', cfg:'firewall', why:'기본 규칙 DenyAllInBound(65500)가 인터넷 인바운드를 막고, AllowInternetOutBound(65001)가 아웃바운드를 허용합니다. 여기에 Bastion 서브넷에서 오는 22번만 추가합니다.'},
        {id:'natlink', kind:'chip', x:250, y:184, t:'NAT 연결: natgw-dev · 기본 아웃바운드 끔', cfg:'nat'},
        {id:'sep', kind:'chip', x:250, y:210, t:'서비스 엔드포인트: Microsoft.Storage', cfg:'privlink', why:'서브넷에 켜면 스토리지로 가는 트래픽이 Azure 백본으로 가고, 스토리지 방화벽에서 이 서브넷을 허용할 수 있습니다.'},
        {id:'vm1', x:56, y:188, w:180, h:44, icon:'vm', t:'dev-01', s:'공인 IP 없음 · 10.10.10.4', cfg:'vmgroup'},
        {id:'vm2', x:56, y:242, w:180, h:44, icon:'vm', t:'dev-02', s:'공인 IP 없음 · 10.10.10.5', cfg:'vmgroup'},
        {id:'bastion', x:56, y:346, w:220, h:46, icon:'bastion', t:'Azure Bastion', s:'Standard · 네이티브 클라이언트', cfg:'admin'},
        {id:'nat', x:440, y:440, w:220, h:46, icon:'nat', t:'NAT Gateway', s:'공인 IP 20.x.x.x', cfg:'nat', why:'NAT Gateway는 서브넷 안에 들어가지 않고 서브넷에 연결합니다. 연결만 하면 경로 없이 그 서브넷의 아웃바운드를 맡습니다.'},
        {id:'blob', x:40, y:440, w:220, h:46, icon:'obj', t:'스토리지 계정', s:'방화벽: snet-dev만 허용', kind:'alt', cfg:'bucket'}
      ],
      edges: [
        {a:'igw', b:'inet', dash:'both'},
        {a:'nat', b:'igw', dash:true}
      ],
      notes: [{x:350, y:516, t:'NAT Gateway·스토리지는 서브넷 밖 리소스 · 서브넷에 연결하거나 엔드포인트로 들임', anchor:'middle'}]
    }
  },

  flows: [
    {id:'out', t:'개발 VM → 인터넷 (apt·pip)',
     d:{aws:'dev-01이 deb.debian.org에 HTTPS로 접속합니다.', gcp:'dev-01이 deb.debian.org에 HTTPS로 접속합니다.', azure:'dev-01이 deb.debian.org에 HTTPS로 접속합니다.'},
     hops:{
      aws:[{n:'vm1', t:'dev-01 (사설 IP 10.10.10.11)', r:'보안 그룹 sg-dev 아웃바운드: TCP 443·80 → 0.0.0.0/0 허용', cfg:'firewall'},
           {n:'rtdev', t:'라우팅 테이블 rt-dev', r:'목적지가 공인 IP → 0.0.0.0/0 → nat 경로 선택', cfg:'route'},
           {n:'nat', t:'NAT 게이트웨이', r:'출발지 주소를 EIP로 바꾸고 연결을 기억', cfg:'nat'},
           {n:'rtpub', t:'라우팅 테이블 rt-public', r:'NAT가 있는 퍼블릭 서브넷의 0.0.0.0/0 → igw', cfg:'route'},
           {n:'igw', t:'인터넷 게이트웨이', r:'VPC에 연결되어 있어야 나갈 수 있음', cfg:'igw'},
           {n:'inet', t:'deb.debian.org', r:'응답은 NAT가 기억한 연결로 돌아오고, 보안 그룹은 상태 저장이라 그대로 통과'}],
      gcp:[{n:'vm1', t:'dev-01 (외부 IP 없음)', r:'VPC 방화벽: 묵시적 이그레스 허용(우선순위 65535)', cfg:'firewall'},
           {n:'fwout', t:'방화벽 규칙 평가', r:'더 높은 우선순위의 이그레스 거부 규칙이 없으므로 허용', cfg:'firewall'},
           {n:'nat', t:'Cloud NAT', r:'외부 IP 없는 VM이므로 NAT 대상. 출발지를 NAT IP로', cfg:'nat'},
           {n:'igw', t:'기본 인터넷 게이트웨이', r:'자동 생성된 0.0.0.0/0 경로의 다음 홉', cfg:'igw'},
           {n:'inet', t:'deb.debian.org', r:'응답은 Cloud NAT 매핑을 따라 돌아옴. 방화벽은 상태 저장'}],
      azure:[{n:'vm1', t:'dev-01 (공인 IP 없음)', r:'NIC에는 NSG 없음 (서브넷 NSG로 통일)'},
           {n:'nsg', t:'NSG nsg-dev 아웃바운드', r:'기본 규칙 AllowInternetOutBound(65001)로 허용', cfg:'firewall'},
           {n:'natlink', t:'snet-dev의 NAT 연결', r:'서브넷에 NAT Gateway가 연결되어 있으면 아웃바운드는 NAT가 맡음', cfg:'nat'},
           {n:'nat', t:'NAT Gateway', r:'출발지를 NAT 공인 IP로', cfg:'nat'},
           {n:'igw', t:'시스템 경로 0/0 → Internet', r:'라우팅 테이블을 만들지 않아도 있는 경로', cfg:'igw'},
           {n:'inet', t:'deb.debian.org', r:'응답은 NAT Gateway를 거쳐 돌아옴. NSG는 상태 저장'}]
     }},
    {id:'in', t:'인터넷 → 개발 VM의 22번 포트',
     d:{aws:'인터넷의 스캐너가 dev-01에 SSH 접속을 시도합니다.', gcp:'인터넷의 스캐너가 dev-01에 SSH 접속을 시도합니다.', azure:'인터넷의 스캐너가 dev-01에 SSH 접속을 시도합니다.'},
     hops:{
      aws:[{n:'inet', t:'인터넷의 스캐너', r:'dev-01을 가리키는 공인 주소가 필요'},
           {n:'igw', t:'인터넷 게이트웨이', r:'공인 IP·EIP가 매핑된 ENI로만 들여보냄. dev-01에는 공인 IP가 없음', cfg:'igw', ok:false},
           {n:'nat', t:'NAT 게이트웨이', r:'안에서 시작한 연결의 응답만 돌려보내고, 밖에서 시작한 연결은 받지 않음', cfg:'nat'},
           {n:'sgdev', t:'보안 그룹 sg-dev', r:'설령 닿아도 인바운드 규칙이 없어 거부', cfg:'firewall'}],
      gcp:[{n:'inet', t:'인터넷의 스캐너', r:'dev-01을 가리키는 외부 IP가 필요'},
           {n:'igw', t:'기본 인터넷 게이트웨이', r:'외부 IP가 없는 VM으로 들어오는 경로가 없음', cfg:'igw', ok:false},
           {n:'fwin', t:'VPC 방화벽', r:'설령 닿아도 묵시적 인그레스 거부, 22번은 IAP 대역에만 허용', cfg:'firewall'}],
      azure:[{n:'inet', t:'인터넷의 스캐너', r:'dev-01을 가리키는 공인 IP가 필요'},
           {n:'igw', t:'시스템 경로 Internet', r:'공인 IP가 없는 NIC로 들어오는 경로가 없음. NAT Gateway도 인바운드를 받지 않음', cfg:'igw', ok:false},
           {n:'nsg', t:'NSG nsg-dev 인바운드', r:'설령 닿아도 DenyAllInBound(65500), 22번은 Bastion 서브넷에만 허용', cfg:'firewall'}]
     },
     note:'세 클라우드 모두 첫 번째 방어선은 "공인 IP를 주지 않는 것"이고, 두 번째가 방화벽 규칙입니다. NAT는 들어오는 연결을 받지 않으므로 NAT를 둔다고 서버가 노출되지 않습니다.'},
    {id:'shell', t:'개발자 → 개발 VM 셸 접속',
     d:{aws:'22번 포트를 열지 않고 Session Manager로 접속합니다.', gcp:'IAP TCP 전달로 접속합니다. 22번은 IAP 대역에만 열려 있습니다.', azure:'Azure Bastion으로 접속합니다. 22번은 Bastion 서브넷에만 열려 있습니다.'},
     hops:{
      aws:[{n:'devpc', t:'개발자 노트북', r:'aws ssm start-session --target i-xxxx (Identity Center 로그인)'},
           {n:'ssm', t:'Session Manager', r:'IAM 정책 ssm:StartSession을 해당 인스턴스 태그로 한정, 세션 로그 기록', cfg:'admin'},
           {n:'nat', t:'NAT 게이트웨이 (에이전트 쪽)', r:'VM의 SSM 에이전트가 미리 밖으로 열어 둔 연결을 씀. 인바운드 규칙 불필요', cfg:'nat'},
           {n:'vm1', t:'dev-01', r:'인스턴스 역할에 AmazonSSMManagedInstanceCore', cfg:'admin'}],
      gcp:[{n:'devpc', t:'개발자 노트북', r:'gcloud compute ssh dev-01 --tunnel-through-iap'},
           {n:'iap', t:'IAP', r:'IAM: IAP 보안 터널 사용자 역할, OS Login 역할', cfg:'admin'},
           {n:'fwiap', t:'방화벽 allow-iap-ssh', r:'출처 35.235.240.0/20, tcp:22, 대상 서비스 계정 sa-dev', cfg:'firewall'},
           {n:'vm1', t:'dev-01', r:'OS Login으로 IAM 계정이 리눅스 사용자가 됨', cfg:'admin'}],
      azure:[{n:'devpc', t:'개발자 노트북', r:'az network bastion ssh (Entra ID 로그인)'},
           {n:'bastion', t:'Azure Bastion', r:'VM·Bastion에 대한 Reader 권한 + VM 로그인 역할', cfg:'admin'},
           {n:'nsg', t:'NSG nsg-dev 인바운드', r:'22 ← 10.10.250.0/26(AzureBastionSubnet) 허용 규칙', cfg:'firewall'},
           {n:'vm1', t:'dev-01', r:'Entra ID 로그인 확장 또는 SSH 키', cfg:'admin'}]
     },
     note:{aws:'NAT가 없는 서브넷이라면 ssm, ssmmessages, ec2messages 인터페이스 엔드포인트가 있어야 에이전트가 연결됩니다.', gcp:'IAP는 VM에 외부 IP가 없어도 동작합니다. 방화벽에 IAP 대역을 빠뜨리는 것이 가장 흔한 실패 원인입니다.', azure:'Bastion은 VNet마다 시간 요금이 붙습니다. 여러 VNet이면 허브에 하나 두고 피어링으로 함께 씁니다.'}},
    {id:'obj', t:'개발 VM → 오브젝트 스토리지 (아티팩트)',
     d:{aws:'빌드 결과물을 S3 버킷에 올립니다.', gcp:'빌드 결과물을 Cloud Storage 버킷에 올립니다.', azure:'빌드 결과물을 Blob 컨테이너에 올립니다.'},
     hops:{
      aws:[{n:'vm1', t:'dev-01', r:'보안 그룹 아웃바운드 443 허용', cfg:'firewall'},
           {n:'rtdev', t:'라우팅 테이블 rt-dev', r:'S3 접두사 목록(pl-xxxx) → vpce-s3. 0.0.0.0/0보다 구체적이라 NAT보다 먼저 선택', cfg:'route'},
           {n:'s3ep', t:'S3 게이트웨이 엔드포인트', r:'엔드포인트 정책으로 허용 버킷 한정', cfg:'privlink'},
           {n:'s3', t:'S3 버킷', r:'버킷 정책 aws:SourceVpce 조건 + 인스턴스 역할 권한', cfg:'bucket'}],
      gcp:[{n:'vm1', t:'dev-01 (외부 IP 없음)', r:'묵시적 이그레스 허용', cfg:'firewall'},
           {n:'pga', t:'비공개 Google 액세스', r:'서브넷 설정. Google API 트래픽은 Cloud NAT를 거치지 않음', cfg:'privlink'},
           {n:'gcs', t:'Cloud Storage 버킷', r:'서비스 계정 sa-dev에 버킷 단위 IAM', cfg:'bucket'}],
      azure:[{n:'vm1', t:'dev-01', r:'NSG 아웃바운드 허용', cfg:'firewall'},
           {n:'sep', t:'서비스 엔드포인트 Microsoft.Storage', r:'스토리지 트래픽을 NAT Gateway가 아닌 Azure 백본으로', cfg:'privlink'},
           {n:'blob', t:'스토리지 계정', r:'네트워크 규칙: snet-dev만 허용 + 관리 ID에 Storage Blob Data Contributor', cfg:'bucket'}]
     },
     note:'세 경우 모두 NAT를 거치지 않으므로 NAT 처리 요금이 붙지 않고, 스토리지 쪽에서 "이 네트워크에서 온 요청만" 허용할 수 있습니다.'}
  ],

  scope: ['igw','nat','firewall','route','privlink','admin'],
  build: {
    aws: [
      {t:'VPC + 서브넷 2개', d:'퍼블릭 1, 개발 1 (AZ 하나)', cfg:'vpc', nodes:['vpc','pub','priv']},
      {t:'인터넷 게이트웨이 생성·연결', d:'', cfg:'igw', nodes:['igw']},
      {t:'rt-public', d:'0/0 → igw, 퍼블릭 서브넷 연결', cfg:'route', nodes:['rtpub']},
      {t:'EIP + NAT 게이트웨이', d:'퍼블릭 서브넷에 하나', cfg:'nat', nodes:['nat']},
      {t:'rt-dev', d:'0/0 → nat, 개발 서브넷 연결', cfg:'route', nodes:['rtdev']},
      {t:'S3 게이트웨이 엔드포인트', d:'rt-dev에 연결 → 접두사 목록 경로 자동 추가', cfg:'privlink', nodes:['s3ep','rtdev']},
      {t:'보안 그룹 sg-dev', d:'인바운드 없음, 아웃바운드 443·80', cfg:'firewall', nodes:['sgdev']},
      {t:'인스턴스 역할 + 개발 VM', d:'SSM 관리형 정책, 공인 IP 자동 할당 끔', cfg:'admin', nodes:['vm1','vm2']},
      {t:'Session Manager 권한', d:'IAM 정책, 세션 로그', cfg:'admin', nodes:['ssm']}
    ],
    gcp: [
      {t:'VPC 네트워크 (커스텀)', d:'', cfg:'vpc', nodes:['vpc']},
      {t:'인터넷 경로 확인', d:'기본 경로가 이미 있음', cfg:'igw', nodes:['igw'], auto:true},
      {t:'서브넷 + 비공개 Google 액세스', d:'', cfg:'subnet', nodes:['priv','pga']},
      {t:'방화벽 allow-iap-ssh', d:'인그레스 거부·이그레스 허용은 묵시적 규칙', cfg:'firewall', nodes:['fwiap','fwin','fwout']},
      {t:'Cloud Router + Cloud NAT', d:'', cfg:'nat', nodes:['nat']},
      {t:'서비스 계정 + 개발 VM', d:'외부 IP 없이, OS Login 켜기', cfg:'vmgroup', nodes:['vm1','vm2']},
      {t:'IAP 권한', d:'IAP 보안 터널 사용자', cfg:'admin', nodes:['iap']}
    ],
    azure: [
      {t:'VNet + snet-dev + AzureBastionSubnet', d:'', cfg:'subnet', nodes:['vpc','priv','bas']},
      {t:'인터넷 경로 확인', d:'시스템 경로가 이미 있음', cfg:'igw', nodes:['igw'], auto:true},
      {t:'NSG + 서브넷 연결', d:'22 ← Bastion 서브넷 규칙만 추가', cfg:'firewall', nodes:['nsg']},
      {t:'공인 IP + NAT Gateway + 서브넷 연결', d:'기본 아웃바운드 액세스 끔', cfg:'nat', nodes:['nat','natlink']},
      {t:'서비스 엔드포인트 + 스토리지 네트워크 규칙', d:'', cfg:'privlink', nodes:['sep','blob']},
      {t:'개발 VM', d:'공인 IP 없이, 관리 ID', cfg:'vmgroup', nodes:['vm1','vm2']},
      {t:'Azure Bastion', d:'Standard, 네이티브 클라이언트 지원', cfg:'admin', nodes:['bastion']}
    ]
  },

  map: ['network','subnet','internet-gateway','route-table','firewall','nat','private-endpoint','admin-access','object-storage'],

  decisions: [
    {t:'"들어오는 건 막기"를 무엇으로 하는가',
     p:'방화벽 규칙만 믿는 것보다, 애초에 밖에서 가리킬 주소가 없게 만드는 것이 확실합니다.',
     aws:'공인 IP 자동 할당을 끈 프라이빗 서브넷에 두고, 보안 그룹에는 인바운드 규칙을 하나도 두지 않습니다. 보안 그룹은 상태 저장이라 응답 트래픽은 따로 허용하지 않아도 들어옵니다.',
     gcp:'VM에 외부 IP를 주지 않습니다. 방화벽은 묵시적 인그레스 거부가 기본이라, 허용 규칙을 만들지 않으면 막혀 있습니다. 조직 정책으로 외부 IP 부여 자체를 금지할 수 있습니다.',
     azure:'NIC에 공인 IP를 붙이지 않습니다. NSG 기본 규칙 DenyAllInBound가 인터넷 인바운드를 막습니다. Azure Policy로 공인 IP 생성을 막을 수 있습니다.',
     so:'세 클라우드 모두 같은 원리지만, 막는 설정이 걸리는 곳(ENI의 보안 그룹, VPC의 규칙, 서브넷의 NSG)이 다릅니다.'},
    {t:'NAT를 둘 것인가, 공인 IP를 줄 것인가',
     p:'공인 IP가 있고 인바운드 규칙이 없으면 들어오는 연결은 막히고 나가는 연결은 됩니다. NAT 없이도 요구를 만족하는 셈입니다.',
     aws:'NAT 게이트웨이는 시간 요금과 처리량 요금이 붙습니다. 공인 IPv4 주소에도 시간 요금이 붙으므로, VM이 2~3대면 공인 IP 쪽이 쌀 수 있습니다.',
     gcp:'Cloud NAT는 게이트웨이 시간 요금과 처리량 요금이 붙고, 외부 IP에도 요금이 붙습니다. 조직 정책이 외부 IP를 막고 있다면 Cloud NAT밖에 없습니다.',
     azure:'NAT Gateway는 시간·처리량 요금이 붙습니다. 공인 IP를 VM마다 주는 방식은 관리할 주소가 늘어납니다.',
     so:'규모가 작아도 NAT를 권합니다. 공인 IP를 주면 방화벽 규칙 실수 하나가 곧 노출이 되고, 나가는 IP도 서버마다 달라져 나중에 외부 허용 목록을 만들기 어렵습니다.'},
    {t:'NAT를 하나만 둘 것인가',
     p:'운영 환경에서는 영역마다 출구를 두는 것이 원칙이지만 개발 환경은 다릅니다.',
     aws:'NAT 게이트웨이는 AZ 리소스입니다. 개발은 AZ 하나에 하나로 충분합니다. 다른 AZ의 서버가 쓰면 AZ 간 전송 요금이 붙습니다.',
     gcp:'Cloud NAT는 리전 관리형이라 하나로 모든 영역을 받습니다. 고민할 것이 없습니다.',
     azure:'NAT Gateway 하나를 서브넷에 연결합니다. 영역 배치는 운영 환경에서 다시 검토합니다.',
     so:'개발 환경의 비용 절감은 "NAT 개수"보다 "밤·주말에 VM 끄기"가 훨씬 큽니다(시나리오 13).'},
    {t:'나가는 통신도 좁혀야 하는가',
     p:'개발 서버는 아무 곳이나 접속할 수 있는 경우가 많습니다. 소스 코드와 자격 증명이 있는 서버라면 출구도 통제 대상입니다.',
     aws:'보안 그룹 아웃바운드를 443·80으로 좁힐 수 있지만 도메인 단위 통제는 안 됩니다. 도메인 허용 목록은 Network Firewall이 필요합니다.',
     gcp:'우선순위 높은 이그레스 거부 규칙 + 443 허용으로 좁힙니다. 도메인 단위는 Cloud NGFW의 FQDN 객체나 Secure Web Proxy를 씁니다.',
     azure:'NSG 아웃바운드 규칙으로 포트를 좁힙니다. 도메인 단위는 Azure Firewall 애플리케이션 규칙이 필요합니다.',
     so:'포트 제한은 무료로 바로 할 수 있고, 도메인 제한은 별도 방화벽 비용이 듭니다. 규제 환경이라면 시나리오 09의 구조로 갑니다.'}
  ],

  iac: 'iac/scenario-15',

  checklist: [
    ['퍼블릭 서브넷에 개발 서버를 둔다','공인 IP 자동 할당이 켜져 있으면 보안 그룹 규칙 하나로 서버가 노출됩니다.'],
    ['22번을 0.0.0.0/0에 연다','"잠깐만"이 가장 흔한 사고 원인입니다. Session Manager·IAP·Bastion을 씁니다.'],
    ['GCP 방화벽에 IAP 대역을 빠뜨린다','35.235.240.0/20을 허용하지 않으면 IAP 접속이 시간 초과로 실패합니다.'],
    ['Azure에서 기본 아웃바운드에 기대고 있다','NAT 없이도 나가던 기본 아웃바운드 액세스는 사라지는 방향입니다. 출구를 NAT Gateway로 명시합니다.'],
    ['S3·GCS·Blob 트래픽이 NAT를 지난다','게이트웨이 엔드포인트, 비공개 Google 액세스, 서비스 엔드포인트로 NAT 요금과 노출을 함께 줄입니다.'],
    ['AWS에서 NAT가 없는데 SSM이 안 된다','에이전트가 바깥 SSM 서비스에 닿아야 합니다. NAT나 인터페이스 엔드포인트 중 하나가 필요합니다.']
  ],
  refs: [
    ['AWS: NAT 게이트웨이','https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html'],
    ['Google Cloud: Cloud NAT 개요','https://cloud.google.com/nat/docs/overview'],
    ['Google Cloud: IAP TCP 전달','https://cloud.google.com/iap/docs/using-tcp-forwarding'],
    ['Azure: NAT Gateway','https://learn.microsoft.com/azure/nat-gateway/nat-overview'],
    ['Azure: 기본 아웃바운드 액세스','https://learn.microsoft.com/azure/virtual-network/ip-services/default-outbound-access']
  ],
  next: '시나리오 16 · 개발·운영 분리와 공용 서비스'
};
