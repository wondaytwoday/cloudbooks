window.VBOOK = {
  vendor: 'azure', title: 'AzureBook',
  chapters: [
    {id:'account', title:'구독·리소스 그룹·지역',
     lede:'Azure의 리소스는 테넌트 아래 관리 그룹, 구독, 리소스 그룹이라는 네 층에 놓입니다. 구독은 과금과 할당량의 경계, 리소스 그룹은 함께 만들고 지우는 단위입니다.',
     concepts:[
      {icon:'iam', t:'테넌트', d:'Entra ID 디렉터리 하나가 테넌트입니다. 사용자·그룹·앱 신원이 여기 있고, 그 아래 모든 구독이 이 디렉터리를 신뢰합니다.'},
      {icon:'account', t:'구독', d:'과금, 할당량, Azure RBAC의 큰 경계입니다. 리소스 공급자를 구독마다 등록해야 해당 서비스를 쓸 수 있습니다.'},
      {icon:'org', t:'리소스 그룹', d:'함께 만들고 지우는 리소스 묶음입니다. 리소스 그룹에도 지역이 있지만 메타데이터 저장 위치일 뿐, 안의 리소스는 다른 지역에 둘 수 있습니다.'},
      {icon:'pin', t:'지역과 쌍 지역', d:'서울은 Korea Central이고, 쌍 지역은 Korea South입니다. GRS 같은 기능이 쌍 지역을 기본 복제 대상으로 씁니다.'},
      {icon:'net', t:'가용성 영역', d:'영역을 지원하는 지역에서는 VM, 디스크, 일부 PaaS를 영역에 고정하거나 영역 중복으로 배포합니다.'}
     ],
     defaults:['환경·워크로드마다 구독을 나누고 관리 그룹으로 묶습니다.','리소스 그룹은 수명 주기가 같은 리소스끼리 묶습니다.','필수 태그(팀·환경·비용 센터)를 Azure Policy로 강제합니다.','운영에 필요한 vCPU 할당량을 미리 요청합니다.'],
     pitfalls:[['서로 다른 수명 주기를 한 리소스 그룹에','앱을 지우려다 공유 네트워크까지 함께 지웁니다.'],['리소스 그룹 지역이 리소스 위치라고 생각한다','데이터 위치는 각 리소스의 지역으로 확인합니다.'],['중요 리소스에 잠금이 없다','삭제 잠금으로 실수를 막습니다.'],['리소스 공급자 미등록','배포가 이해하기 어려운 오류로 실패합니다.']],
     services:['account-unit','org-root','sso','guardrail'], scenarios:[1,3],
     refs:[['Azure 리소스 관리자 개요','https://learn.microsoft.com/azure/azure-resource-manager/management/overview'],['Azure 지역 쌍','https://learn.microsoft.com/azure/reliability/cross-region-replication-azure']]},

    {id:'iam', title:'Entra ID와 Azure RBAC',
     lede:'Azure의 권한은 두 체계가 겹칩니다. 디렉터리를 관리하는 Entra 역할과, 리소스를 관리하는 Azure RBAC 역할입니다. 둘을 혼동하는 것이 가장 흔한 권한 사고의 시작입니다.',
     concepts:[
      {icon:'iam', t:'Entra ID 주체', d:'사용자, 그룹, 앱 등록과 서비스 주체, 관리 ID가 있습니다. 워크로드는 비밀을 저장하지 않아도 되는 관리 ID를 우선 씁니다.'},
      {icon:'guard', t:'Azure RBAC', d:'역할 정의를 범위(관리 그룹·구독·리소스 그룹·리소스)에 할당하며, 아래로 상속됩니다. 거부 할당은 사용자가 직접 만들 수 없습니다.'},
      {icon:'org', t:'Entra 역할과 Azure 역할', d:'전역 관리자는 디렉터리 관리자이지 구독 Owner가 아닙니다. 다만 액세스 권한 상승으로 루트 관리 그룹의 사용자 액세스 관리자가 될 수 있어 매우 강력합니다.'},
      {icon:'secret', t:'Privileged Identity Management', d:'Owner 같은 강한 역할을 상시가 아니라 필요할 때 승인을 받아 일정 시간만 활성화하게 합니다.'},
      {icon:'iam', t:'조건부 액세스', d:'로그인 위치, 기기 상태, 위험도에 따라 MFA 요구나 차단을 정합니다.'}
     ],
     defaults:['워크로드는 관리 ID로 인증합니다.','사람에게는 그룹으로, 가능한 한 좁은 범위로 역할을 줍니다.','Owner·사용자 액세스 관리자는 PIM으로 적격 할당만 둡니다.','관리자 계정에 조건부 액세스로 MFA를 강제합니다.'],
     pitfalls:[['앱 등록의 클라이언트 시크릿이 만료된다','어느 날 갑자기 연동이 끊깁니다. 관리 ID나 페더레이션 자격 증명을 씁니다.'],['구독 Owner를 넓게 준다','Owner는 권한 부여와 정책 예외까지 할 수 있습니다.'],['Entra 역할과 Azure 역할을 혼동한다','디렉터리 권한만 있는데 리소스 권한이 있다고 착각합니다.'],['개인 계정에 역할을 직접 할당한다','퇴사·이동 때 정리가 누락됩니다.']],
     services:['sso','pod-identity','guardrail','data-perimeter'], scenarios:[3,4,9],
     refs:[['Azure RBAC 개요','https://learn.microsoft.com/azure/role-based-access-control/overview'],['관리 ID 개요','https://learn.microsoft.com/entra/identity/managed-identities-azure-resources/overview']]},

    {id:'network', title:'VNet과 네트워크',
     lede:'Azure VNet은 지역 범위이고 서브넷에는 영역 구분이 없습니다. 기본 라우팅이 많은 것을 자동으로 처리해 주지만, 그만큼 명시적인 출구와 경로를 정해야 할 지점을 놓치기 쉽습니다.',
     concepts:[
      {icon:'net', t:'VNet과 서브넷', d:'VNet은 지역 하나에 속하고, 서브넷은 영역과 무관하게 지역 전체에서 쓰입니다. 서브넷마다 Azure가 주소 5개를 예약합니다.'},
      {icon:'fw', t:'NSG와 ASG', d:'NSG는 서브넷이나 NIC에 붙는 상태 저장 규칙 집합이며 우선순위 숫자로 평가됩니다. ASG로 IP 대신 역할 이름을 규칙에 씁니다.'},
      {icon:'router', t:'허브-스포크와 Virtual WAN', d:'스포크 VNet이 허브 VNet과 피어링하고, 허브에 방화벽·게이트웨이를 둡니다. 피어링은 전이되지 않아 스포크 간 통신은 허브를 거치게 경로를 정합니다.'},
      {icon:'nat', t:'명시적 아웃바운드', d:'NAT Gateway, 방화벽, 로드밸런서 아웃바운드 규칙으로 출구를 정합니다. 기본 아웃바운드 액세스에 기대지 않는 것이 권장 방향입니다.'},
      {icon:'privlink', t:'Private Endpoint와 서비스 엔드포인트', d:'Private Endpoint는 PaaS를 VNet 안 사설 IP로 가져오고, 서비스 엔드포인트는 서브넷에서 PaaS로 가는 경로를 최적화하고 서브넷 단위 허용을 가능하게 합니다.'}
     ],
     defaults:['허브-스포크로 시작하고 대역을 사내망과 겹치지 않게 계획합니다.','서브넷에는 NSG를, 출구에는 NAT Gateway나 Azure Firewall을 둡니다.','PaaS는 Private Endpoint와 비공개 DNS 영역으로 연결합니다.','VNet 흐름 로그를 켭니다.'],
     pitfalls:[['Private Endpoint의 DNS를 빠뜨린다','사설 IP가 있어도 이름이 공인 IP로 풀려 연결되지 않습니다.'],['피어링이 전이된다고 생각한다','스포크 간 통신에는 허브의 라우팅이 필요합니다.'],['서브넷을 작게 잡는다','Private Endpoint, AKS 노드, 게이트웨이 서브넷이 생각보다 많은 주소를 씁니다.'],['NSG 규칙 우선순위를 섞는다','낮은 숫자가 먼저 적용됩니다. 번호 체계를 정합니다.']],
     services:['network','subnet','firewall','nat','private-endpoint','network-hub'], scenarios:[1,3,6,9],
     refs:[['Azure Virtual Network 개요','https://learn.microsoft.com/azure/virtual-network/virtual-networks-overview'],['허브-스포크 토폴로지','https://learn.microsoft.com/azure/architecture/networking/architecture/hub-spoke']]},

    {id:'compute', title:'VM과 VM Scale Sets',
     lede:'Azure VM은 시리즈와 크기로 고르고, 고가용성은 가용성 영역에 나눠 두는 것으로 확보합니다. 여러 대는 VM Scale Set의 유연한 오케스트레이션으로 묶는 것이 기본입니다.',
     concepts:[
      {icon:'vm', t:'VM 시리즈', d:'D(범용), E(메모리), F(컴퓨팅), B(버스터블), N(GPU) 계열과 버전 번호, ARM 기반 크기 등이 있습니다.'},
      {icon:'autoscale', t:'VM Scale Sets', d:'여러 영역에 VM을 나눠 두고 자동 확장합니다. 새 배포에는 유연한 오케스트레이션 모드가 권장됩니다.'},
      {icon:'net', t:'영역과 가용성 집합', d:'가용성 영역은 데이터센터 단위, 가용성 집합은 같은 데이터센터 안 장애·업데이트 도메인 단위로 나눕니다. 영역을 쓸 수 있으면 영역을 씁니다.'},
      {icon:'files', t:'관리 디스크', d:'LRS 디스크는 영역에 묶이고, ZRS 디스크는 영역 장애 때 다른 영역의 VM에 붙일 수 있습니다.'},
      {icon:'cost', t:'Azure Hybrid Benefit와 스팟', d:'기존 Windows·SQL 라이선스를 활용해 비용을 줄이고, 중단돼도 되는 작업은 스팟 VM으로 돌립니다.'}
     ],
     defaults:['VM Scale Set(유연)으로 여러 영역에 배포합니다.','관리 ID를 붙이고 접속은 Bastion으로만 합니다.','디스크 종류는 성능 요구에 맞춰 고르고, 영역 장애 대비가 필요하면 ZRS를 씁니다.','업데이트 관리자로 패치를 자동화합니다.'],
     pitfalls:[['영역을 지정하지 않은 VM','같은 데이터센터에 몰려 있을 수 있습니다.'],['공인 IP와 RDP·SSH 포트','Bastion이나 Just-in-time 접근으로 바꿉니다.'],['임시 디스크에 데이터를 둔다','재배포·크기 변경 때 지워집니다.'],['이전 버전 크기를 계속 쓴다','같은 비용에 더 나은 버전이 나와 있는 경우가 많습니다.']],
     services:['vm-autoscale','spot','scheduled-scaling','admin-access','block-storage'], scenarios:[1,10,13],
     refs:[['Virtual Machine Scale Sets 개요','https://learn.microsoft.com/azure/virtual-machine-scale-sets/overview'],['Azure VM 크기','https://learn.microsoft.com/azure/virtual-machines/sizes/overview']]},

    {id:'storage', title:'Storage 계정·Blob·Files',
     lede:'Azure 스토리지는 스토리지 계정이라는 상자 안에 Blob, Files, Queue, Table이 들어 있는 구조입니다. 중복성과 네트워크 접근 설정이 계정 단위라 계정을 어떻게 나누느냐가 설계입니다.',
     concepts:[
      {icon:'obj', t:'스토리지 계정과 중복성', d:'LRS(데이터센터 하나), ZRS(영역 셋), GRS·GZRS(쌍 지역에 비동기 사본)를 고릅니다. 보조 지역 읽기는 RA- 옵션이 필요합니다.'},
      {icon:'obj', t:'Blob 접근 계층', d:'핫, 쿨, 콜드, 아카이브가 있으며 쿨 30일, 콜드 90일, 아카이브 180일의 조기 삭제 기간이 있습니다. 아카이브는 읽기 전에 재수화가 필요합니다.'},
      {icon:'files', t:'ADLS Gen2와 Azure Files', d:'계층형 네임스페이스를 켜면 디렉터리 단위 권한이 있는 데이터 레이크가 되고, Azure Files는 SMB·NFS 파일 공유입니다.'},
      {icon:'guard', t:'네트워크와 인증', d:'공용 네트워크 접근을 끄고 Private Endpoint로만 받으며, 공유 키를 끄고 Entra ID 인증만 허용할 수 있습니다.'},
      {icon:'audit', t:'변경 불가 정책', d:'시간 기반 보존이나 법적 보존으로 Blob을 지우거나 덮어쓰지 못하게 합니다.'}
     ],
     defaults:['운영 데이터는 ZRS 이상으로 만듭니다.','공유 키를 끄고 Entra ID 인증과 RBAC를 씁니다.','공용 네트워크 접근을 끄고 Private Endpoint를 씁니다.','수명 주기 관리 정책으로 계층을 옮깁니다.'],
     pitfalls:[['SAS 토큰을 오래 유효하게 발급한다','유출되면 막을 방법이 키 교체뿐입니다. 사용자 위임 SAS와 짧은 만료를 씁니다.'],['GRS면 보조 지역에서 바로 읽을 수 있다고 생각한다','RA-GRS가 아니면 장애조치 전에는 읽을 수 없습니다.'],['아카이브 데이터를 급히 읽어야 한다','재수화에 몇 시간이 걸릴 수 있습니다.'],['스토리지 계정 하나에 모든 것을 넣는다','네트워크·중복성·키 설정을 데이터마다 다르게 줄 수 없습니다.']],
     services:['object-storage','storage-tiering','object-replication','immutable-log','block-storage','file-storage'], scenarios:[2,7,8,13],
     refs:[['스토리지 계정 개요','https://learn.microsoft.com/azure/storage/common/storage-account-overview'],['Blob 접근 계층','https://learn.microsoft.com/azure/storage/blobs/access-tiers-overview']]},

    {id:'database', title:'Azure SQL·PostgreSQL·Cosmos DB',
     lede:'Azure의 데이터베이스는 SQL Server 계열(Azure SQL), 오픈소스 관리형(Flexible Server), 전역 분산 NoSQL(Cosmos DB)로 나뉩니다. 고가용성과 지역 복제 방식이 각각 다릅니다.',
     concepts:[
      {icon:'db', t:'Azure SQL Database', d:'서비스 계층별로 영역 중복을 켤 수 있고, 장애 조치 그룹으로 다른 지역에 복제하면서 수신기 이름을 유지합니다.'},
      {icon:'pg', t:'PostgreSQL·MySQL Flexible Server', d:'영역 중복 고가용성으로 다른 영역에 대기 서버를 두고, 읽기 복제본으로 읽기를 분산하거나 다른 지역에 둡니다.'},
      {icon:'nosql', t:'Cosmos DB', d:'파티션 키로 데이터를 나누고 처리량을 RU/s로 정합니다. 강함부터 최종까지 다섯 단계 일관성 수준과 다중 지역 쓰기를 제공합니다.'},
      {icon:'cache', t:'Azure Managed Redis', d:'관리형 Redis 캐시입니다. 영역 중복과 클러스터링으로 가용성과 처리량을 확보합니다.'},
      {icon:'db', t:'SQL Managed Instance', d:'SQL Server와 호환성이 높은 관리형 인스턴스로, 기존 SQL Server를 옮길 때 씁니다.'}
     ],
     defaults:['운영 DB는 영역 중복 HA를 켭니다.','Entra ID 인증을 켜고 SQL 인증은 최소화합니다.','공용 접근을 끄고 Private Endpoint나 VNet 통합을 씁니다.','Cosmos DB는 접근 패턴을 보고 파티션 키를 정합니다.'],
     pitfalls:[['Cosmos DB 파티션 키를 잘못 고른다','핫 파티션이 생기고, 바꾸려면 컨테이너를 새로 만들어야 합니다.'],['교차 파티션 쿼리를 남발한다','RU 소비가 크게 늘어납니다.'],['장애 조치 그룹 없이 지역 복제만 둔다','장애조치 후 접속 문자열을 바꿔야 합니다.'],['방화벽에 모든 Azure 서비스 허용','다른 테넌트의 Azure 리소스까지 허용하는 설정이 될 수 있습니다.']],
     services:['mysql-ha','nosql','cross-region-db','cache','change-feed'], scenarios:[1,5,8,10],
     refs:[['Azure Database for PostgreSQL 고가용성','https://learn.microsoft.com/azure/postgresql/flexible-server/concepts-high-availability'],['Cosmos DB 파티셔닝','https://learn.microsoft.com/azure/cosmos-db/partitioning-overview']]},

    {id:'container', title:'AKS와 Container Apps',
     lede:'쿠버네티스가 필요하면 AKS, 쿠버네티스 없이 컨테이너를 서버리스로 돌리려면 Container Apps가 출발점입니다. AKS는 Automatic으로 운영 결정 상당수를 맡길 수 있습니다.',
     concepts:[
      {icon:'k8s', t:'AKS 계층과 노드 풀', d:'Free·Standard·Premium 계층이 있고, Standard 이상에 컨트롤 플레인 가동 시간 SLA가 있습니다. 시스템 노드 풀과 사용자 노드 풀을 나눕니다.'},
      {icon:'net', t:'네트워크 플러그인', d:'Azure CNI Overlay는 파드에 VNet 밖 대역을 줘 주소를 아끼고, 기존 Azure CNI는 파드마다 VNet IP를 씁니다.'},
      {icon:'iam', t:'Workload ID', d:'OIDC 발급자를 켜고 쿠버네티스 서비스 계정을 관리 ID와 페더레이션해 파드 단위 권한을 줍니다.'},
      {icon:'run', t:'Container Apps', d:'KEDA 기반 이벤트 확장과 0까지 축소를 제공하는 서버리스 컨테이너입니다. 리비전과 트래픽 분할로 배포합니다.'},
      {icon:'registry', t:'ACR', d:'컨테이너 레지스트리입니다. AKS에 AcrPull 권한으로 연결하고, Premium은 지역 복제를 제공합니다.'}
     ],
     defaults:['쿠버네티스가 꼭 필요하지 않다면 Container Apps부터 검토합니다.','AKS는 Standard 계층, 여러 영역 노드 풀, Azure CNI Overlay로 만듭니다.','Workload ID를 켜고 노드 ID 권한을 최소화합니다.','자동 업그레이드 채널과 계획된 유지보수 기간을 정합니다.'],
     pitfalls:[['노드 풀 영역을 나중에 바꾸려 한다','영역 설정은 만든 뒤 바꿀 수 없어 새 노드 풀이 필요합니다.'],['시스템 노드 풀에 앱 파드를 올린다','시스템 구성 요소가 자원을 뺏깁니다.'],['Azure CNI로 서브넷을 작게 잡는다','파드마다 VNet IP를 써서 금방 모자랍니다.'],['업그레이드 채널 없음','지원이 끝난 버전에 머뭅니다.']],
     services:['k8s-managed','container-registry','pod-identity','k8s-ingress','node-autoscale','serverless-container'], scenarios:[4,14],
     refs:[['AKS 개요','https://learn.microsoft.com/azure/aks/what-is-aks'],['Azure Container Apps 개요','https://learn.microsoft.com/azure/container-apps/overview']]},

    {id:'serverless', title:'Functions·Logic Apps',
     lede:'Azure Functions는 호스팅 플랜에 따라 확장 방식과 네트워크 기능이 크게 달라집니다. 함수 코드를 쓰기 전에 플랜부터 고르는 것이 첫 결정입니다.',
     concepts:[
      {icon:'func', t:'호스팅 플랜', d:'Flex Consumption은 빠른 확장과 VNet 통합, 항상 준비 인스턴스를 제공하고, Premium은 미리 데운 인스턴스를, Dedicated는 App Service 플랜 위에서 돕니다.'},
      {icon:'eventbus', t:'트리거와 바인딩', d:'HTTP, 타이머, Service Bus, Event Grid, Cosmos DB 변경 피드 같은 트리거로 실행되고, 바인딩으로 입출력 코드를 줄입니다.'},
      {icon:'workflow', t:'Durable Functions', d:'오케스트레이터 함수로 여러 단계, 대기, 보상 로직을 코드로 씁니다.'},
      {icon:'workflow', t:'Logic Apps', d:'수백 개 커넥터로 SaaS·온프레미스 시스템을 잇는 워크플로를 시각적으로 만듭니다.'},
      {icon:'apigw', t:'API Management', d:'API 앞에서 인증, 속도 제한, 변환, 개발자 포털을 제공합니다.'}
     ],
     defaults:['새 앱은 Flex Consumption부터 검토합니다.','관리 ID로 스토리지·Key Vault에 접근합니다.','Application Insights를 연결합니다.','지연에 민감한 함수는 항상 준비 인스턴스를 둡니다.'],
     pitfalls:[['플랜을 나중에 바꾸려 한다','플랜마다 기능 차이가 커서 마이그레이션이 필요할 수 있습니다.'],['저장소 연결 문자열을 평문으로 둔다','관리 ID 기반 연결로 바꿉니다.'],['오래 걸리는 작업을 HTTP 함수로','HTTP 요청 제한 시간에 걸립니다. Durable Functions로 비동기 패턴을 씁니다.'],['재시도 정책 없이 외부 호출','일시적 오류가 그대로 실패로 남습니다.']],
     services:['serverless-compute','api-gateway','workflow','serverless-container'], scenarios:[2,5],
     refs:[['Azure Functions 호스팅 옵션','https://learn.microsoft.com/azure/azure-functions/functions-scale'],['Durable Functions 개요','https://learn.microsoft.com/azure/azure-functions/durable/durable-functions-overview']]},

    {id:'messaging', title:'Service Bus·Event Grid·Event Hubs',
     lede:'Azure의 메시징은 명령(Service Bus), 이벤트 알림(Event Grid), 대량 스트림(Event Hubs)으로 역할이 나뉩니다. 무엇을 보내는지에 따라 고르면 헷갈리지 않습니다.',
     concepts:[
      {icon:'queue', t:'Service Bus', d:'큐와 토픽·구독을 제공하는 엔터프라이즈 브로커입니다. 세션으로 순서를, 중복 감지로 중복을, 데드 레터 하위 큐로 실패 메시지를 다룹니다.'},
      {icon:'eventbus', t:'Event Grid', d:'Azure 리소스 이벤트와 사용자 이벤트를 구독자에게 푸시하는 라우터입니다. 시스템 토픽으로 스토리지·구독 이벤트를 받습니다.'},
      {icon:'stream', t:'Event Hubs', d:'파티션 기반 대량 스트림 수집입니다. Kafka 프로토콜을 지원하고, Capture로 스토리지에 자동 적재합니다.'},
      {icon:'queue', t:'Storage Queue', d:'단순하고 싼 큐입니다. 순서·세션·토픽이 필요 없을 때 씁니다.'},
      {icon:'mon', t:'계층', d:'Service Bus Premium은 전용 자원과 VNet 통합, 큰 메시지를 제공합니다.'}
     ],
     defaults:['업무 명령은 Service Bus, 상태 변화 알림은 Event Grid, 로그·텔레메트리는 Event Hubs로 나눕니다.','최대 전송 횟수와 데드 레터에 경보를 겁니다.','소비자는 멱등하게 만듭니다.','관리 ID로 인증하고 공유 액세스 키를 끕니다.'],
     pitfalls:[['잠금 시간보다 처리가 길다','잠금이 풀려 다른 소비자가 같은 메시지를 받습니다. 잠금 갱신이나 시간 조정이 필요합니다.'],['Event Grid로 순서를 기대한다','순서 보장이 없습니다.'],['Event Hubs 파티션 수를 작게 잡는다','소비자 병렬 처리 상한이 파티션 수로 정해집니다.'],['데드 레터를 아무도 안 본다','실패가 조용히 쌓입니다.']],
     services:['message-queue','pubsub-topic','event-bus','stream-ingest','change-feed'], scenarios:[5,7,10],
     refs:[['Azure 메시징 서비스 비교','https://learn.microsoft.com/azure/service-bus-messaging/compare-messaging-services'],['Service Bus 개요','https://learn.microsoft.com/azure/service-bus-messaging/service-bus-messaging-overview']]},

    {id:'observe', title:'Azure Monitor',
     lede:'Azure Monitor의 핵심은 Log Analytics 작업 영역과 진단 설정입니다. 리소스 로그는 진단 설정을 만들어야 비로소 남는다는 점을 놓치면, 장애 후에 볼 로그가 없습니다.',
     concepts:[
      {icon:'logs', t:'Log Analytics 작업 영역', d:'로그를 모으고 KQL로 질의하는 저장소입니다. 테이블마다 보존 기간과 요금 계획을 정할 수 있습니다.'},
      {icon:'logs', t:'진단 설정', d:'리소스 로그와 플랫폼 지표를 작업 영역, 스토리지, Event Hubs로 보냅니다. 설정이 없으면 리소스 로그는 남지 않습니다.'},
      {icon:'audit', t:'활동 로그', d:'구독 수준의 관리 작업 기록으로 기본 90일 보관됩니다. 장기 보관은 진단 설정으로 내보냅니다.'},
      {icon:'mon', t:'Application Insights', d:'앱의 요청, 의존성, 예외, 추적을 수집하는 APM입니다. 작업 영역 기반으로 만듭니다.'},
      {icon:'mon', t:'경보와 작업 그룹', d:'지표·로그 경보가 작업 그룹으로 알림·자동화를 실행합니다.'}
     ],
     defaults:['플랫폼 작업 영역을 정하고 Azure Policy로 진단 설정을 자동 배포합니다.','활동 로그를 중앙 작업 영역으로 보냅니다.','테이블별 보존 기간을 정하고, 자주 보지 않는 로그는 낮은 요금 계획으로 둡니다.','사용자 경험 지표에 경보를 겁니다.'],
     pitfalls:[['진단 설정을 만들지 않았다','장애 후 볼 로그가 없습니다.'],['모든 로그를 분석 계층으로 받는다','수집량 요금이 크게 나옵니다.'],['작업 영역이 구독마다 흩어져 있다','교차 질의와 권한 관리가 복잡해집니다.'],['활동 로그 90일만 믿는다','감사 요구는 대개 그보다 깁니다.']],
     services:['monitoring','logs','apm','org-audit'], scenarios:[1,5,13],
     refs:[['Azure Monitor 개요','https://learn.microsoft.com/azure/azure-monitor/fundamentals/overview'],['진단 설정','https://learn.microsoft.com/azure/azure-monitor/essentials/diagnostic-settings']]},

    {id:'security', title:'보안 서비스',
     lede:'Azure의 보안은 신원(Entra ID), 정책(Azure Policy), 현황과 보호(Defender for Cloud), 탐지와 대응(Sentinel)이 축입니다. 많은 기능이 Entra ID와 연결되어 있어 신원 설계가 보안 설계의 절반입니다.',
     concepts:[
      {icon:'kms', t:'Key Vault와 Managed HSM', d:'키·시크릿·인증서를 저장합니다. 일시 삭제와 제거 보호를 켜고, RBAC 권한 모델을 씁니다.'},
      {icon:'sechub', t:'Defender for Cloud', d:'보안 점수와 권장 사항으로 설정을 점검하고(CSPM), 서버·컨테이너·스토리지 같은 워크로드 보호 플랜을 켭니다.'},
      {icon:'guard', t:'Azure Policy', d:'거부, 감사, 수정, 배포 효과로 규칙을 강제하고, 이니셔티브로 묶어 규정 준수를 봅니다.'},
      {icon:'sechub', t:'Microsoft Sentinel', d:'Log Analytics 위의 SIEM으로 여러 출처의 보안 이벤트를 상관 분석하고 대응을 자동화합니다.'},
      {icon:'waf', t:'네트워크 보호', d:'Azure Firewall, Application Gateway·Front Door WAF, DDoS Protection으로 경계를 지킵니다.'}
     ],
     defaults:['Defender for Cloud CSPM을 모든 구독에 켭니다.','Key Vault는 제거 보호와 RBAC 모델, 공용 접근 차단으로 만듭니다.','Azure Policy로 공용 IP·공개 스토리지 생성을 막습니다.','관리자 계정에 조건부 액세스와 PIM을 적용합니다.'],
     pitfalls:[['Key Vault 제거 보호가 없다','삭제된 키를 영구 삭제당하면 그 키로 암호화한 데이터를 잃습니다.'],['정책을 감사 모드로만 둔다','위반이 계속 늘어납니다. 새 리소스부터 거부로 바꿉니다.'],['권장 사항을 처리할 담당이 없다','보안 점수만 보고 끝납니다.'],['Sentinel에 모든 로그를 넣는다','수집량 비용이 커집니다. 탐지에 쓰는 로그부터 넣습니다.']],
     services:['kms','secrets','sec-posture','threat-detection','waf-bot','data-perimeter'], scenarios:[9],
     refs:[['Microsoft Defender for Cloud 개요','https://learn.microsoft.com/azure/defender-for-cloud/defender-for-cloud-introduction'],['Key Vault 일시 삭제','https://learn.microsoft.com/azure/key-vault/general/soft-delete-overview']]},

    {id:'cost', title:'Cost Management',
     lede:'Azure의 비용은 Cost Management에서 구독·리소스 그룹·태그별로 나눠 봅니다. 태그 상속, 예약·절감 플랜, Hybrid Benefit처럼 Azure에만 있는 절감 수단을 함께 알아 둡니다.',
     concepts:[
      {icon:'cost', t:'비용 분석과 내보내기', d:'기간·서비스·태그별로 비용을 보고, 정기 내보내기로 스토리지에 받아 분석합니다.'},
      {icon:'cost', t:'태그와 태그 상속', d:'구독·리소스 그룹 태그를 비용 데이터에서 아래 리소스로 상속시키는 설정이 있어, 리소스마다 태그를 다 붙이지 않아도 됩니다.'},
      {icon:'mon', t:'예산과 이상 경보', d:'예산 초과·예측 알림과 비용 이상 경보를 받습니다. 예산은 지출을 멈추지 않습니다.'},
      {icon:'cost', t:'예약과 Azure 절감 플랜', d:'특정 리소스에 거는 예약과, 컴퓨트 전반에 시간당 금액을 약정하는 절감 플랜이 있습니다.'},
      {icon:'cost', t:'Hybrid Benefit와 개발·테스트 가격', d:'기존 라이선스로 Windows·SQL 비용을 줄이고, 개발·테스트 구독에 할인 가격을 적용합니다.'}
     ],
     defaults:['태그 정책과 태그 상속을 켭니다.','구독마다 예산과 이상 경보를 둡니다.','월 1회 Advisor 비용 권장 사항을 검토합니다.','개발 VM에 자동 종료를 겁니다.'],
     pitfalls:[['예산이 지출을 막는다고 생각한다','알림만 보냅니다.'],['예약을 크기 조정 전에 산다','큰 VM을 오래 할인받는 셈입니다.'],['Log Analytics 수집량을 모른다','진단 설정으로 모든 로그를 보내면 큰 비용이 됩니다.'],['쓰지 않는 공인 IP·디스크·스냅샷','주인 없이 계속 과금됩니다.']],
     services:['cost-mgmt','rightsizing','commitment','spot','vm-schedule'], scenarios:[13],
     refs:[['Cost Management 개요','https://learn.microsoft.com/azure/cost-management-billing/costs/overview-cost-management'],['Azure 절감 플랜','https://learn.microsoft.com/azure/cost-management-billing/savings-plan/savings-plan-compute-overview']]},

    {id:'entra-hybrid', title:'Entra ID와 하이브리드',
     lede:'많은 기업이 이미 온프레미스 Active Directory를 쓰고 있어, Azure 도입은 신원 동기화에서 시작하는 경우가 많습니다. 그리고 Azure Arc로 Azure 밖의 서버와 쿠버네티스도 같은 방식으로 관리합니다.',
     concepts:[
      {icon:'iam', t:'Entra Connect와 Cloud Sync', d:'온프레미스 AD의 사용자·그룹을 Entra ID로 동기화합니다. Cloud Sync는 가벼운 에이전트 방식입니다.'},
      {icon:'secret', t:'인증 방식', d:'암호 해시 동기화, 통과 인증, 페더레이션 중에서 고릅니다. 온프레미스 장애에도 로그인이 되도록 암호 해시 동기화를 기본 또는 백업으로 둡니다.'},
      {icon:'onprem', t:'Azure Arc', d:'다른 클라우드나 데이터센터의 서버·쿠버네티스·SQL Server를 Azure 리소스로 등록해 Policy, Defender, Monitor, 업데이트를 적용합니다.'},
      {icon:'dedicated', t:'하이브리드 네트워크', d:'ExpressRoute와 VPN Gateway로 사내망과 연결하고, DNS Private Resolver로 이름 해석을 잇습니다.'},
      {icon:'vm', t:'Azure Local', d:'Azure에서 관리하는 하이퍼컨버지드 인프라를 자체 데이터센터에 두고 VM과 AKS를 돌립니다.'}
     ],
     defaults:['동기화 범위를 필요한 OU로 좁힙니다.','암호 해시 동기화를 켜 둡니다.','클라우드 전용 비상 관리자 계정을 둡니다.','온프레미스 서버는 Arc로 등록해 정책과 패치를 한곳에서 관리합니다.'],
     pitfalls:[['모든 온프레미스 객체를 동기화한다','서비스 계정과 오래된 계정까지 클라우드에 노출됩니다.'],['페더레이션만 쓰고 백업 인증이 없다','온프레미스 페더레이션 서버가 멈추면 클라우드 로그인도 멈춥니다.'],['동기화 서버를 일반 서버처럼 관리한다','신원 전체를 쥔 서버라 도메인 컨트롤러 수준으로 보호합니다.'],['Arc 에이전트를 넓은 권한으로 등록한다','등록용 서비스 주체 권한을 최소로 둡니다.']],
     services:['sso','hybrid-dns','dedicated-link','multicloud-mgmt'], scenarios:[6,14],
     refs:[['Microsoft Entra Connect','https://learn.microsoft.com/entra/identity/hybrid/connect/whatis-azure-ad-connect'],['Azure Arc 개요','https://learn.microsoft.com/azure/azure-arc/overview']]}
  ]
};
