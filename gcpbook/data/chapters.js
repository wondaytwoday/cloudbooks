window.VBOOK = {
  vendor: 'gcp', title: 'GCPBook',
  chapters: [
    {id:'account', title:'프로젝트·리전·할당량',
     lede:'Google Cloud에서는 프로젝트가 거의 모든 것의 단위입니다. API를 켜는 것도, 할당량도, 결제 연결도, 권한도 프로젝트에서 시작합니다. 그리고 리소스마다 범위가 전역·리전·영역으로 나뉩니다.',
     concepts:[
      {icon:'account', t:'프로젝트', d:'API 활성화, 할당량, 결제 계정 연결, IAM 정책의 기본 단위입니다. 프로젝트 ID는 전역에서 고유하고 만든 뒤 바꿀 수 없습니다.'},
      {icon:'pin', t:'리전과 영역', d:'서울은 asia-northeast3이고 영역 a·b·c가 있습니다. 대부분의 리소스는 리전 또는 영역 범위입니다.'},
      {icon:'net', t:'리소스 범위', d:'VPC 네트워크, 전역 LB, 이미지는 전역, 서브넷과 리전 MIG는 리전, VM과 영역 디스크는 영역 범위입니다. 범위가 장애 시 행동을 정합니다.'},
      {icon:'cost', t:'결제 계정', d:'프로젝트는 결제 계정에 연결되어야 유료 리소스를 쓸 수 있습니다. 결제 계정 하나에 여러 프로젝트를 연결합니다.'},
      {icon:'mon', t:'할당량', d:'리전별 CPU·GPU·IP 같은 할당량이 프로젝트마다 있습니다. 콘솔의 할당량 페이지에서 증설을 요청합니다.'}
     ],
     defaults:['환경·앱마다 프로젝트를 나누고 ID 규칙(팀-앱-환경)을 정합니다.','필요한 API만 켭니다.','조직 정책으로 기본 네트워크 자동 생성을 끕니다.','결제 예산과 알림을 프로젝트마다 둡니다.'],
     pitfalls:[['기본 네트워크를 그대로 쓴다','자동 생성되는 default 네트워크에는 SSH·RDP를 넓게 허용하는 방화벽 규칙이 들어 있습니다.'],['프로젝트 ID를 대충 짓는다','바꿀 수 없고, 지운 뒤에도 같은 ID를 다시 쓸 수 없습니다.'],['영역 리소스만으로 고가용성을 기대한다','영역 VM과 영역 디스크는 그 영역과 운명을 같이합니다.'],['GPU 할당량을 늦게 요청한다','기본 할당량이 매우 작은 경우가 많습니다.']],
     services:['account-unit','org-root','sso','guardrail'], scenarios:[1,3],
     refs:[['리소스 계층 구조','https://cloud.google.com/resource-manager/docs/cloud-platform-resource-hierarchy'],['지역 및 영역','https://cloud.google.com/compute/docs/regions-zones']]},

    {id:'iam', title:'IAM과 서비스 계정',
     lede:'Google Cloud IAM은 "누구에게 어떤 역할을 어느 리소스에서" 주는 허용 정책이 계층을 따라 상속되는 구조입니다. 위에서 준 권한은 아래에서 뺄 수 없다는 점이 설계의 핵심입니다.',
     concepts:[
      {icon:'iam', t:'주체', d:'Google 계정, Google 그룹, 서비스 계정, Workload Identity 풀의 외부 주체가 있습니다. 사람에게는 그룹으로 역할을 줍니다.'},
      {icon:'guard', t:'역할', d:'소유자·편집자·뷰어 같은 기본 역할, 서비스별 사전 정의 역할, 커스텀 역할이 있습니다. 기본 역할은 범위가 너무 넓어 운영에 쓰지 않습니다.'},
      {icon:'org', t:'상속', d:'조직→폴더→프로젝트→리소스로 허용 정책이 합쳐집니다. 상위에서 준 역할은 하위에서 제거할 수 없고, 막으려면 거부 정책을 씁니다.'},
      {icon:'secret', t:'서비스 계정과 키', d:'워크로드의 신원입니다. 서비스 계정 키(JSON) 대신 연결된 서비스 계정, Workload Identity Federation을 써서 장기 키를 없앱니다.'},
      {icon:'iam', t:'IAM 조건', d:'시간, 리소스 이름, 태그 같은 조건을 역할 부여에 붙여 범위를 좁힙니다.'}
     ],
     defaults:['사람은 그룹에, 그룹에는 사전 정의 역할을 줍니다.','조직 정책으로 서비스 계정 키 생성을 막습니다.','VM·Cloud Run에는 용도별 전용 서비스 계정을 붙입니다.','외부 시스템(GitHub Actions, AWS 등)은 Workload Identity Federation으로 접근합니다.'],
     pitfalls:[['편집자 역할을 준다','거의 모든 리소스를 바꿀 수 있습니다.'],['기본 Compute 서비스 계정을 그대로 쓴다','넓은 권한이 붙어 있던 계정을 여러 VM이 공유하게 됩니다.'],['폴더 수준에서 넓게 주고 프로젝트에서 빼려 한다','상속된 허용은 하위에서 뺄 수 없습니다.'],['서비스 계정 키를 저장소에 커밋한다','가장 흔한 유출 사고입니다.']],
     services:['sso','pod-identity','guardrail','data-perimeter'], scenarios:[3,4,9],
     refs:[['IAM 개요','https://cloud.google.com/iam/docs/overview'],['서비스 계정 권장사항','https://cloud.google.com/iam/docs/best-practices-service-accounts']]},

    {id:'network', title:'VPC 네트워크',
     lede:'Google Cloud의 VPC는 전역이고 서브넷은 리전 범위입니다. 하나의 VPC가 여러 리전에 걸치고, 서브넷 하나가 리전의 모든 영역을 덮는다는 점이 다른 클라우드와 가장 다릅니다.',
     concepts:[
      {icon:'net', t:'전역 VPC와 리전 서브넷', d:'VPC 하나에 서울·도쿄 서브넷을 함께 두고 내부 IP로 통신합니다. 서브넷은 리전의 모든 영역에서 쓸 수 있습니다.'},
      {icon:'fw', t:'방화벽 규칙과 정책', d:'VPC 방화벽 규칙은 상태 저장이며 네트워크 태그나 서비스 계정을 대상으로 지정합니다. 조직·폴더 단위로는 계층식 방화벽 정책을 겁니다.'},
      {icon:'nat', t:'Cloud NAT', d:'외부 IP 없는 VM이 인터넷으로 나가게 하는 리전 단위 관리형 서비스입니다. 영역마다 장비를 둘 필요가 없습니다.'},
      {icon:'privlink', t:'비공개 Google 액세스와 PSC', d:'외부 IP 없이 Google API에 닿게 하고, Private Service Connect로 서비스를 내부 IP 엔드포인트로 노출하거나 받습니다.'},
      {icon:'router', t:'Shared VPC와 연결', d:'호스트 프로젝트가 네트워크를 소유하고 서비스 프로젝트가 서브넷을 씁니다. VPC 피어링은 전이되지 않으며, 여러 VPC를 묶을 때는 Network Connectivity Center를 씁니다.'}
     ],
     defaults:['커스텀 모드 VPC를 만들고 대역을 직접 계획합니다.','VM에 외부 IP를 주지 않고 Cloud NAT로 나가게 합니다.','방화벽 대상은 네트워크 태그보다 서비스 계정을 씁니다.','서브넷 흐름 로그를 샘플링으로 켭니다.'],
     pitfalls:[['자동 모드 VPC를 운영에 쓴다','모든 리전에 같은 대역이 자동으로 잡혀 다른 네트워크와 연결할 때 겹칩니다.'],['네트워크 태그로만 방화벽을 건다','인스턴스를 수정할 수 있는 사람이 태그를 붙여 규칙을 우회할 수 있습니다.'],['VPC 피어링이 전이된다고 생각한다','A-B, B-C 피어링으로 A-C가 통하지 않습니다.'],['보조 대역을 작게 잡는다','GKE 파드 대역이 모자라 노드를 더 늘리지 못합니다.']],
     services:['network','subnet','firewall','nat','private-endpoint','network-hub'], scenarios:[1,3,6,9],
     refs:[['VPC 네트워크 개요','https://cloud.google.com/vpc/docs/vpc'],['Cloud NAT 개요','https://cloud.google.com/nat/docs/overview']]},

    {id:'compute', title:'Compute Engine과 MIG',
     lede:'Compute Engine은 VM을, 관리형 인스턴스 그룹(MIG)은 VM 묶음의 자동 복구와 확장을 맡습니다. 리전 MIG 하나로 영역 분산까지 해결하는 것이 기본형입니다.',
     concepts:[
      {icon:'vm', t:'머신 계열', d:'E2(비용 효율), N2·N4(범용), C3·C4(컴퓨팅), M(메모리), Arm 기반 계열 등이 있습니다. 맞춤 머신 유형으로 vCPU와 메모리를 따로 정할 수도 있습니다.'},
      {icon:'autoscale', t:'관리형 인스턴스 그룹', d:'인스턴스 템플릿으로 VM을 찍어 내고, 헬스체크로 자동 복구하며, 오토스케일러와 확장 일정으로 대수를 조정합니다. 리전 MIG는 영역에 고르게 나눕니다.'},
      {icon:'vm', t:'실시간 이전', d:'호스트 유지보수 때 VM을 멈추지 않고 다른 호스트로 옮기는 것이 기본 동작입니다. GPU VM 등 일부는 예외입니다.'},
      {icon:'files', t:'Persistent Disk와 Hyperdisk', d:'영역 디스크와 두 영역에 동기 복제되는 리전 디스크가 있습니다. Hyperdisk는 성능을 용량과 따로 지정합니다.'},
      {icon:'vm', t:'스팟 VM', d:'크게 할인되지만 언제든 회수될 수 있고, 회수 30초 전에 통지됩니다.'}
     ],
     defaults:['인스턴스 템플릿 + 리전 MIG + 헬스체크 자동 복구로 띄웁니다.','외부 IP 없이 띄우고 IAP로 접속합니다.','OS Login으로 IAM 계정을 VM 로그인에 연결합니다.','용도별 서비스 계정과 최소 범위를 씁니다.'],
     pitfalls:[['영역 MIG로 운영한다','영역 장애 때 새 VM을 띄울 곳이 없습니다.'],['기본 서비스 계정 + 모든 API 범위','VM의 모든 프로세스가 넓은 권한을 갖습니다.'],['상태를 VM 로컬 디스크에 둔다','자동 복구로 VM이 다시 만들어지면 사라집니다.'],['종료 스크립트를 쓰지 않는다','스팟 회수나 축소 때 작업을 정리할 기회를 놓칩니다.']],
     services:['vm-autoscale','spot','scheduled-scaling','admin-access','block-storage'], scenarios:[1,10,13],
     refs:[['관리형 인스턴스 그룹','https://cloud.google.com/compute/docs/instance-groups'],['머신 계열 가이드','https://cloud.google.com/compute/docs/machine-resource']]},

    {id:'storage', title:'Cloud Storage·디스크·Filestore',
     lede:'Cloud Storage는 버킷 위치 유형(리전·이중 리전·멀티 리전)과 스토리지 클래스 두 축으로 설계합니다. 위치는 나중에 바꾸기 어려워 가장 먼저 정합니다.',
     concepts:[
      {icon:'obj', t:'위치 유형', d:'리전 버킷은 한 리전, 이중 리전은 두 리전, 멀티 리전은 대륙 단위 여러 위치에 저장합니다. 이중 리전의 터보 복제는 15분 RPO를 목표로 합니다.'},
      {icon:'obj', t:'스토리지 클래스', d:'Standard, Nearline, Coldline, Archive가 있으며 뒤로 갈수록 최소 보관 기간(30·90·365일)과 검색 요금이 붙습니다.'},
      {icon:'guard', t:'균일 버킷 수준 액세스', d:'객체별 ACL을 끄고 IAM으로만 권한을 관리합니다. 공개 액세스 방지를 켜면 실수로 공개할 수 없습니다.'},
      {icon:'cost', t:'Autoclass', d:'객체마다 접근 패턴을 보고 클래스를 자동으로 옮깁니다. 접근 패턴을 모를 때 기본값으로 좋습니다.'},
      {icon:'audit', t:'버전 관리와 보존 정책', d:'객체 버전과 보존 정책으로 삭제를 막고, 보존 정책을 잠그면 기간을 줄이거나 지울 수 없습니다.'}
     ],
     defaults:['균일 버킷 수준 액세스와 공개 액세스 방지를 켭니다.','버킷 위치를 데이터 규제와 DR 요구에 맞춰 처음에 정합니다.','Autoclass나 수명 주기 규칙으로 계층을 관리합니다.','규제 데이터는 CMEK로 암호화합니다.'],
     pitfalls:[['위치를 나중에 바꾸려 한다','버킷 위치는 쉽게 바꿀 수 없어 새 버킷으로 옮겨야 합니다.'],['Archive 클래스에 자주 읽는 데이터를 둔다','검색 요금과 최소 보관 기간 요금이 붙습니다.'],['allUsers 권한을 붙인다','버킷 전체가 공개됩니다.'],['순차적인 객체 이름으로 대량 업로드','한 범위에 요청이 몰려 처리량이 떨어질 수 있습니다.']],
     services:['object-storage','storage-tiering','object-replication','immutable-log','block-storage','file-storage'], scenarios:[2,7,8,13],
     refs:[['버킷 위치','https://cloud.google.com/storage/docs/locations'],['스토리지 클래스','https://cloud.google.com/storage/docs/storage-classes']]},

    {id:'database', title:'Cloud SQL·AlloyDB·Spanner·Firestore',
     lede:'Google Cloud는 관계형부터 전역 분산 DB까지 선택지가 넓습니다. 규모와 일관성 요구, 지역 분산 필요성으로 고릅니다.',
     concepts:[
      {icon:'db', t:'Cloud SQL', d:'MySQL·PostgreSQL·SQL Server 관리형입니다. 고가용성 구성은 같은 리전 다른 영역에 대기 인스턴스를 두고, 교차 리전 복제본으로 DR을 구성합니다.'},
      {icon:'pg', t:'AlloyDB', d:'PostgreSQL 호환 고성능 DB로 분석 쿼리 가속과 빠른 장애조치를 제공합니다.'},
      {icon:'db', t:'Spanner', d:'수평 확장과 강한 일관성을 함께 제공하는 분산 관계형 DB입니다. 멀티 리전 구성은 동기 복제라 쓰기 지연이 늘어납니다.'},
      {icon:'nosql', t:'Firestore', d:'서버리스 문서 DB로 실시간 동기화와 트리거를 제공합니다. 한 문서에 지속적으로 몰리는 쓰기는 초당 1회 정도를 권장합니다.'},
      {icon:'cache', t:'Memorystore', d:'Redis·Valkey·Memcached 호환 관리형 캐시입니다.'}
     ],
     defaults:['Cloud SQL은 비공개 IP로 만들고 Cloud SQL 커넥터나 Auth Proxy로 접속합니다.','운영 인스턴스는 고가용성(리전) 구성과 시점 복원을 켭니다.','Spanner·Bigtable은 단조 증가하지 않는 키로 설계합니다.','Firestore는 쓰기가 몰리는 값을 분산 카운터로 나눕니다.'],
     pitfalls:[['공인 IP에 0.0.0.0/0 승인 네트워크','DB가 인터넷에 노출됩니다.'],['Spanner에 증가하는 기본 키','모든 쓰기가 한 분할에 몰립니다.'],['서버리스 앱의 커넥션 폭증','Cloud Run 최대 인스턴스와 커넥션 풀 크기를 함께 계산합니다.'],['교차 리전 복제본 승격 후 주소','승격하면 별도 인스턴스가 되므로 앱의 접속 대상을 바꿔야 합니다.']],
     services:['mysql-ha','nosql','cross-region-db','cache','change-feed'], scenarios:[1,5,8,10],
     refs:[['Cloud SQL 고가용성','https://cloud.google.com/sql/docs/mysql/high-availability'],['Spanner 스키마 설계 권장사항','https://cloud.google.com/spanner/docs/schema-design']]},

    {id:'container', title:'GKE와 Cloud Run',
     lede:'컨테이너는 쿠버네티스가 필요하면 GKE, 요청을 받아 처리하는 서비스라면 Cloud Run이 출발점입니다. GKE는 Autopilot으로 노드 운영까지 맡길 수 있습니다.',
     concepts:[
      {icon:'k8s', t:'GKE Standard와 Autopilot', d:'Standard는 노드 풀을 직접 관리하고, Autopilot은 파드 요청만 정의하면 노드 배치·확장·보안 설정을 GKE가 맡습니다.'},
      {icon:'k8s', t:'리전 클러스터와 릴리스 채널', d:'리전 클러스터는 컨트롤 플레인을 여러 영역에 복제합니다. 릴리스 채널로 업그레이드를 자동화하고 유지보수 기간을 정합니다.'},
      {icon:'net', t:'VPC 네이티브', d:'파드와 서비스가 서브넷 보조 대역의 IP를 받아 VPC 안에서 바로 라우팅됩니다.'},
      {icon:'iam', t:'Workload Identity', d:'쿠버네티스 서비스 계정을 IAM 주체로 써서 파드 단위로 Google API 권한을 줍니다.'},
      {icon:'run', t:'Cloud Run', d:'컨테이너를 올리면 요청 수에 따라 0부터 확장되는 서버리스 실행 환경입니다. 인스턴스 하나가 여러 요청을 동시에 받습니다.'}
     ],
     defaults:['쿠버네티스가 꼭 필요하지 않다면 Cloud Run부터 검토합니다.','GKE는 Autopilot 또는 리전 Standard 클러스터로 만듭니다.','비공개 노드와 Workload Identity를 켭니다.','릴리스 채널과 유지보수 기간을 정합니다.'],
     pitfalls:[['영역 클러스터로 운영한다','컨트롤 플레인이 영역 하나에 있습니다.'],['노드 서비스 계정을 파드가 그대로 쓴다','Workload Identity 없이 노드 권한을 공유하게 됩니다.'],['보조 대역이 작다','노드를 늘리려 할 때 파드 IP가 모자랍니다.'],['유지보수 기간이 없다','업무 시간에 노드 업그레이드가 진행될 수 있습니다.']],
     services:['k8s-managed','container-registry','pod-identity','k8s-ingress','node-autoscale','serverless-container'], scenarios:[4,14],
     refs:[['GKE 개요','https://cloud.google.com/kubernetes-engine/docs/concepts/kubernetes-engine-overview'],['Autopilot 개요','https://cloud.google.com/kubernetes-engine/docs/concepts/autopilot-overview']]},

    {id:'serverless', title:'Cloud Run과 서버리스',
     lede:'Google Cloud의 서버리스 중심은 Cloud Run입니다. 함수도 Cloud Run functions로 같은 기반 위에서 돌며, 동시성 모델이 비용과 확장을 좌우합니다.',
     concepts:[
      {icon:'run', t:'서비스와 작업', d:'HTTP 요청을 받는 서비스와, 끝까지 실행되고 종료되는 작업(Jobs)이 있습니다. 서비스 요청 제한 시간은 최대 60분입니다.'},
      {icon:'run', t:'동시성과 최소 인스턴스', d:'인스턴스당 동시 요청 수(기본 80)와 최소·최대 인스턴스로 비용·지연·하위 시스템 부하를 조절합니다.'},
      {icon:'func', t:'Cloud Run functions', d:'함수 단위 코드를 Cloud Run 위에서 실행하며, Eventarc 트리거로 Pub/Sub·Storage·감사 로그 이벤트를 받습니다.'},
      {icon:'iam', t:'인그레스와 인증', d:'인그레스로 내부·LB 경유 요청만 받게 하고, 서비스 간 호출은 IAM 호출자 역할로 인증합니다.'},
      {icon:'workflow', t:'Workflows와 Cloud Tasks', d:'여러 호출을 순서대로 엮을 때는 Workflows, 호출 속도를 제어하며 비동기로 넘길 때는 Cloud Tasks를 씁니다.'}
     ],
     defaults:['최대 인스턴스 수를 DB 커넥션 한도에 맞춰 둡니다.','지연에 민감한 서비스는 최소 인스턴스를 1 이상 둡니다.','공개 서비스가 아니면 인그레스를 내부·LB로 제한합니다.','전용 서비스 계정을 붙입니다.'],
     pitfalls:[['응답 뒤 백그라운드 작업','요청 기반 과금에서는 응답 후 CPU가 제한될 수 있습니다. 작업은 Cloud Tasks나 Jobs로 넘깁니다.'],['최대 인스턴스 무제한','트래픽 급증이 DB를 넘어뜨립니다.'],['allUsers에 호출 권한','의도치 않게 공개 API가 됩니다.'],['동시성 1로 둔다','인스턴스가 불필요하게 많아집니다.']],
     services:['serverless-compute','api-gateway','workflow','serverless-container'], scenarios:[2,5],
     refs:[['Cloud Run 개요','https://cloud.google.com/run/docs/overview/what-is-cloud-run'],['Cloud Run 동시성','https://cloud.google.com/run/docs/about-concurrency']]},

    {id:'messaging', title:'Pub/Sub·Eventarc·Cloud Tasks',
     lede:'Pub/Sub 하나가 큐와 토픽 역할을 함께 합니다. 구독이 곧 소비자별 큐이고, 여기에 순서·정확히 한 번·데드 레터 옵션을 붙입니다.',
     concepts:[
      {icon:'topic', t:'토픽과 구독', d:'토픽에 게시된 메시지는 구독마다 사본이 생깁니다. push 구독은 HTTP로 밀어 주고, pull 구독은 소비자가 가져갑니다.'},
      {icon:'queue', t:'전달 보장 옵션', d:'기본은 최소 한 번입니다. 순서 키로 키별 순서를, pull 구독에서는 정확히 한 번 전달을 켤 수 있습니다.'},
      {icon:'queue', t:'데드 레터와 재시도', d:'최대 전송 시도(5~100회)를 넘긴 메시지를 데드 레터 토픽으로 보내고, 재시도 정책으로 백오프를 정합니다.'},
      {icon:'eventbus', t:'Eventarc', d:'Google Cloud 서비스 이벤트와 감사 로그를 CloudEvents 형식으로 Cloud Run·Workflows에 전달합니다.'},
      {icon:'queue', t:'Cloud Tasks', d:'대상 HTTP 엔드포인트와 전달 속도·재시도를 지정하는 작업 큐입니다. 외부 API 호출 속도를 제한할 때 좋습니다.'}
     ],
     defaults:['소비자마다 구독을 따로 두고 데드 레터 토픽과 그 구독을 만듭니다.','확인 기한(ack deadline)을 처리 시간보다 넉넉하게 둡니다.','소비자는 멱등하게 만듭니다.','적재만 할 거라면 BigQuery·Cloud Storage 구독으로 코드를 없앱니다.'],
     pitfalls:[['데드 레터 토픽에 구독이 없다','옮겨진 메시지가 남지 않습니다.'],['Pub/Sub 서비스 계정 권한 누락','데드 레터 전달에는 서비스 에이전트의 게시·구독 권한이 필요합니다.'],['순서 키 하나에 몰린다','같은 키는 순서대로만 처리되어 처리량이 막힙니다.'],['메시지 크기 한도를 넘긴다','큰 데이터는 Cloud Storage에 두고 경로를 보냅니다.']],
     services:['message-queue','pubsub-topic','event-bus','stream-ingest','change-feed'], scenarios:[5,7,10],
     refs:[['Pub/Sub 개요','https://cloud.google.com/pubsub/docs/overview'],['Eventarc 개요','https://cloud.google.com/eventarc/docs/overview']]},

    {id:'observe', title:'Cloud Monitoring·Logging·Trace',
     lede:'Google Cloud의 로그는 로그 라우터를 거쳐 버킷이나 다른 대상으로 갑니다. 어떤 로그를 어디에 얼마나 남길지 라우터에서 정하는 것이 관측 설계의 중심입니다.',
     concepts:[
      {icon:'logs', t:'로그 라우터와 싱크', d:'모든 로그는 로그 라우터를 지나 싱크 규칙에 따라 로그 버킷, BigQuery, Cloud Storage, Pub/Sub로 갑니다. 제외 필터로 수집 자체를 줄입니다.'},
      {icon:'logs', t:'로그 버킷', d:'_Default 버킷은 기본 30일, _Required 버킷은 400일 보관하며 바꿀 수 없습니다. 사용자 정의 버킷은 보존 기간과 잠금을 정합니다.'},
      {icon:'audit', t:'감사 로그', d:'관리 활동 로그는 항상 켜져 있고, 데이터 액세스 로그는 대부분의 서비스에서 기본으로 꺼져 있어 필요한 것만 켭니다.'},
      {icon:'mon', t:'Cloud Monitoring', d:'지표, 알림 정책, 업타임 체크, 대시보드를 제공하고, Managed Service for Prometheus로 쿠버네티스 지표를 받습니다.'},
      {icon:'mon', t:'Cloud Trace와 Error Reporting', d:'요청 지연을 추적하고, 예외를 묶어 새 오류를 알려 줍니다.'}
     ],
     defaults:['조직 수준 집계 싱크로 감사 로그를 로그 프로젝트에 모읍니다.','디버그 로그와 헬스체크 로그는 제외 필터로 거릅니다.','사용자 경험 지표에 알림 정책을 겁니다.','데이터 액세스 로그는 민감 데이터가 있는 서비스만 켭니다.'],
     pitfalls:[['모든 로그를 기본 버킷에 받는다','수집량 요금이 그대로 쌓입니다.'],['데이터 액세스 로그를 모두 켠다','양이 매우 많아 비용이 급증합니다.'],['프로젝트마다 따로 로그를 본다','사고 때 흩어진 로그를 맞추기 어렵습니다.'],['알림 채널 담당이 없다','알림이 아무에게도 가지 않습니다.']],
     services:['monitoring','logs','apm','org-audit'], scenarios:[1,5,13],
     refs:[['로그 라우팅과 저장','https://cloud.google.com/logging/docs/routing/overview'],['Cloud 감사 로그','https://cloud.google.com/logging/docs/audit']]},

    {id:'security', title:'보안 서비스',
     lede:'Google Cloud의 보안은 신원(IAM), 경계(VPC 서비스 제어), 키(KMS), 현황(Security Command Center)이 축입니다. 특히 VPC 서비스 제어는 다른 클라우드에 같은 제품이 없는 강력한 도구입니다.',
     concepts:[
      {icon:'kms', t:'Cloud KMS·HSM·EKM', d:'CMEK로 서비스 데이터를 내 키로 암호화합니다. 하드웨어 보호가 필요하면 Cloud HSM, 키를 클라우드 밖에 두려면 Cloud EKM을 씁니다.'},
      {icon:'secret', t:'Secret Manager', d:'시크릿을 버전으로 저장하고 IAM으로 접근을 통제하며, 교체 일정을 알림으로 받을 수 있습니다.'},
      {icon:'guard', t:'VPC 서비스 제어', d:'프로젝트 묶음 둘레에 API 수준 경계를 쳐서, 유효한 자격 증명이 있어도 경계 밖으로 데이터를 옮기지 못하게 합니다.'},
      {icon:'sechub', t:'Security Command Center', d:'잘못된 설정, 취약점, 위협을 조직 단위로 모아 보여 줍니다.'},
      {icon:'waf', t:'Cloud Armor와 IAP', d:'Cloud Armor는 외부 LB 앞의 WAF·DDoS 방어이고, IAP는 VPN 없이 신원 기반으로 앱·VM 접근을 허용합니다.'}
     ],
     defaults:['Security Command Center를 조직 수준으로 켭니다.','민감 데이터 프로젝트는 VPC 서비스 제어 경계에 넣고, 시험 모드로 먼저 확인합니다.','관리자 접속은 IAP로만 엽니다.','규제 데이터는 CMEK를 씁니다.'],
     pitfalls:[['VPC 서비스 제어를 바로 적용한다','정상 호출까지 막힙니다. 시험 모드의 위반 로그를 먼저 봅니다.'],['CMEK 키 권한을 서비스 에이전트에 주지 않는다','서비스가 데이터를 읽지 못해 장애가 납니다.'],['시크릿을 환경 변수 평문으로 넣는다','Secret Manager 참조로 마운트합니다.'],['Cloud Armor 규칙을 미리보기 없이 켠다','오탐으로 정상 사용자가 차단됩니다.']],
     services:['kms','secrets','sec-posture','threat-detection','waf-bot','data-perimeter'], scenarios:[9],
     refs:[['VPC 서비스 제어 개요','https://cloud.google.com/vpc-service-controls/docs/overview'],['Cloud KMS 개요','https://cloud.google.com/kms/docs/key-management-service']]},

    {id:'cost', title:'결제와 비용',
     lede:'Google Cloud의 비용 분석은 결제 데이터를 BigQuery로 내보내는 것에서 시작합니다. 라벨과 SKU 단위로 직접 질의할 수 있어, 분석의 깊이를 스스로 정할 수 있습니다.',
     concepts:[
      {icon:'cost', t:'결제 데이터 내보내기', d:'표준·상세 사용량과 가격 데이터를 BigQuery로 내보내 SQL로 분석합니다. 켠 시점 이후부터 쌓이므로 처음에 켭니다.'},
      {icon:'cost', t:'라벨', d:'리소스에 붙인 라벨이 결제 데이터에 함께 나와 팀·환경별로 나눠 볼 수 있습니다.'},
      {icon:'mon', t:'예산과 알림', d:'예산은 알림을 보낼 뿐 지출을 멈추지 않습니다. 자동 조치가 필요하면 Pub/Sub 알림으로 함수를 실행합니다.'},
      {icon:'cost', t:'확약 사용 할인과 지속 사용 할인', d:'1·3년 확약 사용 할인은 리소스 기반과 지출 기반이 있고, 일부 머신 계열은 오래 켜 두면 지속 사용 할인이 자동으로 붙습니다.'},
      {icon:'net', t:'네트워크 등급', d:'프리미엄 등급은 Google 백본으로, 표준 등급은 일반 인터넷으로 송신하며 단가가 다릅니다.'}
     ],
     defaults:['결제 데이터 BigQuery 내보내기를 첫날 켭니다.','라벨 규칙을 정하고 조직 정책·IaC로 강제합니다.','예산 알림을 프로젝트마다 둡니다.','Recommender의 유휴 리소스·크기 조정 권장을 월 1회 검토합니다.'],
     pitfalls:[['예산이 지출을 막는다고 생각한다','알림만 갑니다.'],['내보내기를 늦게 켠다','과거 상세 데이터는 소급되지 않습니다.'],['확약을 너무 크게 산다','쓰지 않아도 약정 금액은 나갑니다.'],['Cloud NAT 처리량을 모른다','Google API 트래픽은 비공개 Google 액세스로 NAT를 피합니다.']],
     services:['cost-mgmt','rightsizing','commitment','spot','vm-schedule'], scenarios:[13],
     refs:[['결제 데이터를 BigQuery로 내보내기','https://cloud.google.com/billing/docs/how-to/export-data-bigquery'],['확약 사용 할인','https://cloud.google.com/docs/cuds']]},

    {id:'bigquery', title:'BigQuery와 데이터 분석',
     lede:'BigQuery는 저장과 계산이 분리된 서버리스 데이터 웨어하우스입니다. 서버를 관리하지 않는 대신, 테이블 설계와 요금 모델 선택이 성능과 비용을 정합니다.',
     concepts:[
      {icon:'dwh', t:'데이터 세트와 위치', d:'데이터 세트는 만들 때 위치(리전·멀티 리전)가 정해지고, 다른 위치의 데이터와 한 쿼리에서 조인할 수 없습니다.'},
      {icon:'query', t:'파티션과 클러스터링', d:'날짜 파티션으로 읽는 범위를 줄이고, 자주 거르는 열로 클러스터링합니다. 파티션 필터 필수 옵션으로 실수를 막습니다.'},
      {icon:'cost', t:'요금 모델', d:'온디맨드는 처리한 바이트로, 용량 요금은 슬롯(버전별)으로 과금됩니다. 사용량이 크고 꾸준하면 용량 요금이 유리합니다.'},
      {icon:'lakegov', t:'열·행 보안', d:'정책 태그로 열 수준 접근을 막거나 동적 마스킹을 걸고, 행 수준 정책으로 행을 거릅니다.'},
      {icon:'obj', t:'BigLake와 Omni', d:'Cloud Storage의 열린 형식 파일을 BigLake 테이블로 같은 권한 체계 아래 조회하고, BigQuery Omni로 다른 클라우드의 데이터를 옮기지 않고 질의합니다.'}
     ],
     defaults:['데이터 세트 위치를 원천 데이터와 규제에 맞춰 정합니다.','큰 테이블은 날짜 파티션 + 파티션 필터 필수로 만듭니다.','프로젝트·사용자별 쿼리 바이트 한도를 둡니다.','개인정보 열에는 정책 태그를 붙입니다.'],
     pitfalls:[['SELECT * 로 큰 테이블을 읽는다','열 지향이라 필요한 열만 고르면 읽는 양이 크게 줄어듭니다.'],['위치가 다른 데이터 세트를 조인하려 한다','같은 위치로 복사해야 합니다.'],['스트리밍으로 작은 행을 많이 넣고 바로 지운다','스트리밍 버퍼의 행은 바로 수정할 수 없습니다.'],['예약 쿼리 실패를 모른다','데이터 갱신이 멈춰도 대시보드는 계속 열립니다.']],
     services:['sql-analytics','data-catalog','data-lake-storage','stream-ingest','bi'], scenarios:[7,13],
     refs:[['BigQuery 개요','https://cloud.google.com/bigquery/docs/introduction'],['파티션을 나눈 테이블','https://cloud.google.com/bigquery/docs/partitioned-tables']]}
  ]
};
