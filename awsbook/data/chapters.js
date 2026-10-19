window.VBOOK = {
  vendor: 'aws', title: 'AWSBook',
  chapters: [
    {id:'account', title:'계정·리전·할당량',
     lede:'AWS의 모든 리소스는 계정 하나와 리전 하나에 속합니다. 계정은 권한·과금·할당량의 경계이고, 리전과 가용 영역은 장애의 경계입니다. 이 두 경계를 먼저 이해해야 나머지 설계가 맞물립니다.',
     concepts:[
      {icon:'account', t:'계정', d:'루트 사용자와 IAM 주체, 리소스, 청구서, 서비스 할당량이 모두 계정마다 따로입니다. 다른 계정의 리소스는 명시적으로 허용하지 않으면 볼 수 없습니다.'},
      {icon:'pin', t:'리전', d:'서로 독립된 지리적 위치입니다. 대부분의 서비스는 리전 단위로 동작하며, 서울은 ap-northeast-2입니다. 2019년 이후 추가된 리전은 기본 비활성(옵트인)입니다.'},
      {icon:'net', t:'가용 영역(AZ)', d:'리전 안에서 전원·네트워크가 분리된 데이터센터 묶음입니다. 계정마다 AZ 이름(ap-northeast-2a)이 실제 위치에 다르게 매핑될 수 있어, 계정 간에는 AZ ID(apne2-az1)로 맞춥니다.'},
      {icon:'dns', t:'글로벌 서비스', d:'IAM, Route 53, CloudFront처럼 리전에 묶이지 않는 서비스가 있습니다. 일부는 제어 평면이 버지니아 북부(us-east-1)에 있어, 예를 들어 CloudFront용 인증서와 WAF는 그 리전에 만듭니다.'},
      {icon:'cost', t:'서비스 할당량', d:'계정·리전마다 vCPU 수, 탄력적 IP 수 같은 한도가 있습니다. Service Quotas에서 현재값을 보고 증설을 요청합니다.'}
     ],
     defaults:['루트 사용자에 MFA를 걸고 일상 작업에는 쓰지 않습니다. 루트 액세스 키는 만들지 않습니다.','보안·결제·운영 대체 연락처를 등록해 AWS의 경고가 담당자에게 가게 합니다.','쓰지 않는 리전은 SCP로 막아 모르는 곳에 리소스가 생기지 않게 합니다.','워크로드와 환경마다 계정을 나눕니다(13장 Organizations).','출시 전에 vCPU 같은 핵심 할당량을 피크 기준으로 올려 둡니다.'],
     pitfalls:[['루트 사용자로 일상 작업','루트는 SCP로도 제한되지 않는 관리 계정의 경우 특히 위험합니다.'],['AZ 이름을 계정 간 같다고 가정','다른 계정의 2a는 다른 건물일 수 있습니다. 지연·장애 분석에는 AZ ID를 씁니다.'],['할당량을 출시 직전에 요청','증설 승인에 시간이 걸리고, 큰 폭은 사유 설명이 필요할 수 있습니다.'],['결제 경보가 없다','설정 실수 하나가 한 달 예산을 넘기는 것을 청구서로 알게 됩니다.']],
     services:['account-unit','org-root','sso','guardrail'], scenarios:[1,3],
     refs:[['AWS 글로벌 인프라','https://aws.amazon.com/about-aws/global-infrastructure/'],['AZ ID','https://docs.aws.amazon.com/ram/latest/userguide/working-with-az-ids.html'],['Service Quotas','https://docs.aws.amazon.com/servicequotas/latest/userguide/intro.html']]},

    {id:'iam', title:'IAM과 권한',
     lede:'AWS의 권한은 여러 종류의 정책이 겹쳐서 결정됩니다. 어떤 정책이 허용하고 어떤 정책이 상한을 정하는지, 명시적 거부가 언제 이기는지를 알아야 "왜 안 되지?"와 "왜 되지?"에 답할 수 있습니다.',
     concepts:[
      {icon:'iam', t:'주체', d:'IAM 사용자, IAM 역할, 그리고 Identity Center나 외부 IdP로 페더레이션한 사람이 주체입니다. 사람과 워크로드 모두 역할을 맡아 임시 자격 증명을 받는 것이 기본입니다.'},
      {icon:'guard', t:'정책의 종류', d:'자격 증명 기반 정책과 리소스 기반 정책이 권한을 주고, 권한 경계·SCP·RCP·세션 정책은 그 위의 상한을 정합니다. 상한 정책만으로는 아무 권한도 생기지 않습니다.'},
      {icon:'secret', t:'평가 순서', d:'기본은 거부입니다. 어디서든 명시적 거부가 있으면 거부, 허용이 있어도 상한 정책 밖이면 거부입니다. 다른 계정의 리소스는 내 쪽 허용과 상대 쪽 리소스 정책 허용이 둘 다 필요합니다.'},
      {icon:'iam', t:'역할과 신뢰 정책', d:'역할에는 "누가 이 역할을 맡을 수 있나"를 정하는 신뢰 정책이 있습니다. 외부 계정에 역할을 열 때는 ExternalId 조건으로 혼동된 대리인 문제를 막습니다.'},
      {icon:'sechub', t:'IAM Access Analyzer', d:'외부에 공유된 리소스, 쓰지 않는 권한을 찾아 주고, 실제 사용 기록으로 최소 권한 정책을 만들어 줍니다.'}
     ],
     defaults:['사람은 IAM Identity Center로 로그인해 권한 세트를 받습니다. IAM 사용자는 만들지 않습니다.','EC2·Lambda·컨테이너는 역할로 권한을 받고, 액세스 키를 코드에 넣지 않습니다.','관리형 정책으로 시작하되 Access Analyzer로 쓰지 않는 권한을 정기적으로 걷어 냅니다.','aws:PrincipalOrgID, aws:SourceVpce 같은 조건 키로 "우리 조직에서, 우리 네트워크로만"을 정책에 넣습니다.'],
     pitfalls:[['Action·Resource를 *로 둔다','편하지만 사고 범위가 계정 전체가 됩니다.'],['신뢰 정책을 넓게 연다','Principal을 계정 전체로 두면 그 계정의 누구나 역할을 맡을 수 있습니다.'],['교차 계정 접근에서 한쪽만 허용','내 정책과 상대 리소스 정책이 모두 허용해야 합니다. 한쪽만 고치고 원인을 못 찾는 경우가 흔합니다.'],['인라인 정책이 흩어져 있다','어떤 권한이 어디서 왔는지 추적하기 어렵습니다. 관리형 정책으로 모읍니다.']],
     services:['sso','pod-identity','guardrail','data-perimeter'], scenarios:[3,4,9],
     refs:[['정책 평가 논리','https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html'],['IAM Access Analyzer','https://docs.aws.amazon.com/IAM/latest/UserGuide/what-is-access-analyzer.html']]},

    {id:'network', title:'VPC와 네트워크',
     lede:'AWS의 VPC는 리전 범위이고 서브넷은 AZ 하나에 묶입니다. 이 한 줄이 NAT, 로드밸런서, 데이터베이스 배치까지 모든 네트워크 설계의 출발점입니다.',
     concepts:[
      {icon:'net', t:'VPC와 서브넷', d:'VPC는 리전 하나에 걸치고, 서브넷은 AZ 하나에 속합니다. 퍼블릭·프라이빗의 구분은 서브넷 속성이 아니라 라우팅 테이블에 인터넷 게이트웨이 경로가 있느냐로 정해집니다.'},
      {icon:'fw', t:'보안 그룹과 NACL', d:'보안 그룹은 ENI 단위, 상태 저장, 허용 규칙만 있습니다. 다른 보안 그룹을 출처로 지정할 수 있어 IP 대신 역할로 규칙을 씁니다. NACL은 서브넷 단위, 상태 비저장, 허용·거부가 모두 있습니다.'},
      {icon:'nat', t:'NAT 게이트웨이', d:'AZ 리소스입니다. AZ마다 하나씩 두고 각 AZ의 프라이빗 라우팅 테이블이 같은 AZ의 NAT를 가리키게 해야 AZ 장애에 견딥니다. 처리한 데이터량으로 과금됩니다.'},
      {icon:'privlink', t:'VPC 엔드포인트', d:'S3·DynamoDB는 게이트웨이 엔드포인트(추가 요금 없음), 그 밖의 서비스는 인터페이스 엔드포인트(PrivateLink)로 인터넷 없이 부릅니다. 엔드포인트 정책으로 접근 범위를 좁힐 수 있습니다.'},
      {icon:'router', t:'Transit Gateway', d:'여러 VPC와 VPN·Direct Connect를 허브 하나로 잇습니다. 라우팅 테이블을 여러 개 두어 환경 간 통신을 나눕니다. VPC 피어링은 전이되지 않습니다.'}
     ],
     defaults:['사내망·다른 VPC와 겹치지 않는 넉넉한 CIDR을 VPC IPAM으로 배정합니다.','AZ마다 퍼블릭·앱·DB 서브넷을 같은 모양으로 둡니다.','NAT 게이트웨이를 AZ마다 두거나, 비용이 중요하면 엔드포인트로 NAT 트래픽부터 줄입니다.','보안 그룹은 IP 대역보다 보안 그룹 참조로 씁니다.','VPC 흐름 로그를 켜 두고 보존 기간을 정합니다.'],
     pitfalls:[['NAT 게이트웨이를 하나만 둔다','그 AZ가 멈추면 다른 AZ의 외부 호출까지 끊기고, AZ 간 전송 요금도 붙습니다.'],['기본 VPC를 운영에 쓴다','모든 서브넷이 퍼블릭이고 대역이 계정마다 같아 연결이 어렵습니다.'],['22번 포트를 0.0.0.0/0에 연다','Session Manager로 대체합니다.'],['CIDR이 겹친다','피어링·Transit Gateway·VPN 어느 것도 겹치는 대역은 라우팅하지 못합니다.']],
     services:['network','subnet','internet-gateway','route-table','firewall','nat','private-endpoint','network-hub'], scenarios:[1,3,6,9],
     refs:[['Amazon VPC 사용 설명서','https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html'],['AWS Transit Gateway','https://docs.aws.amazon.com/vpc/latest/tgw/what-is-transit-gateway.html']]},

    {id:'compute', title:'EC2와 오토스케일',
     lede:'EC2는 가장 오래되고 가장 많이 쓰이는 컴퓨트입니다. 인스턴스 유형 고르기, 구매 방식, Auto Scaling 그룹을 여러 AZ에 걸치는 것까지가 기본기입니다.',
     concepts:[
      {icon:'vm', t:'인스턴스 유형', d:'M(범용), C(컴퓨팅), R(메모리) 같은 계열과 세대 숫자, Graviton(ARM) 여부를 나타내는 g 같은 접미사로 이뤄집니다. 같은 사양이면 최신 세대가 대체로 싸고 빠릅니다.'},
      {icon:'autoscale', t:'Auto Scaling 그룹', d:'여러 AZ에 인스턴스를 나눠 두고, 헬스체크 실패 시 교체하며, 대상 추적·예약 작업으로 대수를 조정합니다. 웜 풀로 부팅 시간을 줄일 수 있습니다.'},
      {icon:'vm', t:'시작 템플릿', d:'AMI, 유형, 보안 그룹, 사용자 데이터, IMDS 설정을 버전으로 관리합니다. 오토스케일 그룹은 시작 템플릿을 참조합니다.'},
      {icon:'secret', t:'IMDSv2', d:'인스턴스 메타데이터에 세션 토큰을 요구하는 방식입니다. IMDSv1을 허용하면 SSRF 취약점으로 인스턴스 역할 자격 증명이 털릴 수 있습니다.'},
      {icon:'files', t:'EBS 볼륨', d:'AZ 하나에 묶인 블록 스토리지입니다. 기본은 gp3이며, 스냅샷은 리전 범위라 다른 AZ에서 복원할 수 있습니다.'}
     ],
     defaults:['시작 템플릿 + 여러 AZ의 Auto Scaling 그룹으로 띄웁니다.','IMDSv2를 필수로 설정합니다.','볼륨은 gp3, 운영 서버는 Graviton 계열도 비교합니다.','접속은 SSH 대신 Systems Manager Session Manager로 합니다.','하루 내내 필요한 기준 용량만 Savings Plans로 약정합니다.'],
     pitfalls:[['오토스케일 그룹을 AZ 하나에 둔다','AZ 장애 때 새 인스턴스를 띄울 곳이 없습니다.'],['인스턴스에 세션·파일을 저장한다','교체되는 순간 사라집니다.'],['IMDSv1을 열어 둔다','웹 앱 취약점 하나로 역할 자격 증명이 유출됩니다.'],['이전 세대 유형을 계속 쓴다','같은 비용으로 더 나은 세대를 쓸 수 있습니다.']],
     services:['vm-autoscale','spot','scheduled-scaling','admin-access','block-storage'], scenarios:[1,10,13],
     refs:[['EC2 Auto Scaling','https://docs.aws.amazon.com/autoscaling/ec2/userguide/what-is-amazon-ec2-auto-scaling.html'],['IMDSv2 사용','https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html']]},

    {id:'storage', title:'S3·EBS·EFS',
     lede:'S3는 리전 범위의 오브젝트 스토리지, EBS는 AZ에 묶인 블록 스토리지, EFS는 여러 AZ에서 붙이는 파일 스토리지입니다. 범위가 다르니 장애 시 행동도 다릅니다.',
     concepts:[
      {icon:'obj', t:'S3 버킷과 객체', d:'버킷은 리전에 만들고 이름은 전역에서 고유해야 합니다. 쓰기 직후 읽기까지 강한 일관성을 제공합니다.'},
      {icon:'obj', t:'스토리지 클래스', d:'Standard, Intelligent-Tiering, Standard-IA, Glacier 계열이 있습니다. IA·Glacier는 최소 보관 기간과 검색 요금이 있어 접근 패턴을 모르면 Intelligent-Tiering이 안전합니다.'},
      {icon:'guard', t:'퍼블릭 액세스 차단', d:'계정·버킷 수준에서 공개 설정을 막습니다. 새 버킷은 기본으로 차단되고, ACL은 비활성(버킷 소유자 강제)이 기본입니다.'},
      {icon:'audit', t:'버전 관리와 객체 잠금', d:'버전 관리로 덮어쓰기·삭제를 되돌리고, 객체 잠금으로 정해진 기간 동안 삭제를 막습니다. 규정 준수 모드는 루트도 기간 내 삭제할 수 없습니다.'},
      {icon:'files', t:'EBS와 EFS', d:'EBS는 인스턴스 하나에 붙는 AZ 범위 볼륨, EFS는 여러 AZ의 인스턴스가 함께 마운트하는 리전 범위 NFS입니다.'}
     ],
     defaults:['계정 수준 퍼블릭 액세스 차단을 켭니다.','기본 암호화는 SSE-S3이며, 규제 데이터는 SSE-KMS와 S3 버킷 키를 씁니다.','버전 관리와 함께 이전 버전을 지우는 수명 주기 규칙을 둡니다.','중요 데이터는 교차 리전 복제를 검토합니다.'],
     pitfalls:[['ACL로 권한을 관리한다','버킷 정책과 IAM으로 일원화합니다.'],['작은 객체를 IA 클래스로 옮긴다','최소 과금 크기와 최소 보관 기간 때문에 오히려 비쌀 수 있습니다.'],['버전 관리만 켜고 정리를 안 한다','이전 버전이 쌓여 용량이 계속 늘어납니다.'],['한 접두사에 요청이 몰린다','접두사마다 초당 요청 처리량에 한도가 있어 키 설계로 분산합니다.']],
     services:['object-storage','storage-tiering','object-replication','immutable-log','block-storage','file-storage'], scenarios:[2,7,8,13],
     refs:[['Amazon S3 사용 설명서','https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html'],['S3 스토리지 클래스','https://aws.amazon.com/s3/storage-classes/']]},

    {id:'database', title:'RDS·Aurora·DynamoDB',
     lede:'관계형은 RDS와 Aurora, 키-값·문서는 DynamoDB가 기본입니다. 고가용성 방식과 커넥션 관리, 키 설계가 서비스마다 다릅니다.',
     concepts:[
      {icon:'db', t:'RDS Multi-AZ', d:'다른 AZ에 동기 대기 인스턴스를 두고 장애 시 승격합니다. 읽기 가능한 대기 두 개를 두는 Multi-AZ DB 클러스터 배포도 있습니다.'},
      {icon:'pg', t:'Aurora', d:'스토리지 계층이 세 AZ에 데이터 사본 여섯 개를 둡니다. 읽기 복제본은 같은 스토리지를 읽어 지연이 짧고, Global Database로 다른 리전에 복제합니다.'},
      {icon:'db', t:'RDS Proxy', d:'커넥션 풀을 관리형으로 제공해 Lambda처럼 짧은 연결이 많은 워크로드에서 DB 커넥션 폭증을 막고, 장애조치 시간을 줄입니다.'},
      {icon:'nosql', t:'DynamoDB', d:'파티션 키로 데이터를 나누는 서버리스 키-값·문서 DB입니다. 온디맨드·프로비저닝 용량, 글로벌 테이블, Streams를 제공합니다. 키 설계가 곧 성능입니다.'},
      {icon:'cache', t:'ElastiCache', d:'Valkey·Redis OSS·Memcached 호환 인메모리 캐시입니다. 클러스터 모드와 여러 AZ 복제본으로 확장과 가용성을 확보합니다.'}
     ],
     defaults:['운영 DB는 Multi-AZ로 만들고 삭제 보호를 켭니다.','마스터 암호는 Secrets Manager 관리형으로 맡깁니다.','자동 백업 보존 기간과 시점 복원을 확인하고, 복원 연습을 합니다.','DynamoDB는 접근 패턴부터 정하고 키를 설계합니다.'],
     pitfalls:[['운영 DB가 단일 AZ다','AZ 장애나 유지보수 때 그대로 멈춥니다.'],['Lambda에서 RDS로 직접 연결한다','동시 실행만큼 커넥션이 늘어납니다. RDS Proxy를 둡니다.'],['DynamoDB 핫 파티션','특정 키에 요청이 몰리면 처리량이 막힙니다.'],['스냅샷 복원이 제자리 복구라고 생각한다','새 인스턴스로 복원되어 엔드포인트가 바뀝니다.']],
     services:['mysql-ha','nosql','cross-region-db','cache','change-feed'], scenarios:[1,5,8,10],
     refs:[['Amazon RDS Multi-AZ','https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html'],['DynamoDB 파티션 키 설계','https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-design.html']]},

    {id:'container', title:'ECS·EKS·Fargate',
     lede:'AWS의 컨테이너는 오케스트레이터(ECS 또는 EKS)와 실행 방식(EC2, Fargate, Auto Mode)의 조합입니다. 쿠버네티스가 꼭 필요한지부터 묻는 것이 첫 설계입니다.',
     concepts:[
      {icon:'k8s', t:'ECS', d:'AWS 고유 오케스트레이터입니다. 태스크 정의와 서비스로 단순하게 운영하며, IAM·ALB·CloudWatch와 깊게 통합됩니다.'},
      {icon:'k8s', t:'EKS', d:'관리형 쿠버네티스입니다. 컨트롤 플레인은 여러 AZ에 걸친 관리형이며, 노드는 관리형 노드 그룹, Karpenter, Fargate, Auto Mode로 운영합니다.'},
      {icon:'run', t:'Fargate', d:'노드 없이 태스크·파드 단위로 컴퓨트를 받는 실행 방식입니다. 노드 관리가 없는 대신 GPU·데몬셋 같은 일부 기능이 제한됩니다.'},
      {icon:'registry', t:'ECR', d:'컨테이너 이미지 저장소입니다. 푸시 시 스캔, 태그 불변성, 수명 주기 정책, 교차 리전 복제를 제공합니다.'},
      {icon:'iam', t:'파드·태스크 권한', d:'ECS는 태스크 역할, EKS는 Pod Identity(또는 IRSA)로 워크로드 단위 권한을 줍니다.'}
     ],
     defaults:['쿠버네티스 생태계가 필요 없다면 ECS + Fargate로 시작합니다.','EKS라면 Karpenter 또는 Auto Mode로 노드 운영을 줄입니다.','이미지는 불변 태그와 푸시 시 스캔을 켭니다.','클러스터 업그레이드 일정을 분기마다 잡습니다.'],
     pitfalls:[['EKS 업그레이드를 미룬다','표준 지원이 끝난 버전에는 연장 지원 요금이 붙습니다.'],['노드 역할에 앱 권한을 준다','같은 노드의 모든 파드가 그 권한을 갖습니다.'],['파드 IP 소비를 계산하지 않는다','VPC CNI는 파드마다 서브넷 IP를 씁니다.'],['latest 태그로 배포한다','되돌리기와 추적이 어려워집니다.']],
     services:['k8s-managed','container-registry','pod-identity','k8s-ingress','node-autoscale','serverless-container'], scenarios:[4,14],
     refs:[['Amazon EKS 사용 설명서','https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html'],['Amazon ECS 개발자 안내서','https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html']]},

    {id:'serverless', title:'Lambda와 서버리스',
     lede:'Lambda는 요청마다 실행 환경을 하나씩 쓰는 모델입니다. 이 모델이 동시성 한도, 콜드 스타트, DB 커넥션 문제를 모두 설명합니다.',
     concepts:[
      {icon:'func', t:'실행 모델', d:'실행 환경 하나가 한 번에 요청 하나를 처리합니다. 동시 요청 수만큼 환경이 늘고, 계정의 리전별 동시성 할당량을 함수들이 나눠 씁니다. 최대 실행 시간은 15분입니다.'},
      {icon:'func', t:'콜드 스타트 대응', d:'프로비저닝된 동시성으로 환경을 미리 띄우거나, SnapStart(Java·Python·.NET)로 초기화 스냅샷을 재사용합니다.'},
      {icon:'eventbus', t:'호출 방식', d:'API Gateway처럼 동기 호출, S3·SNS 같은 비동기 호출, SQS·Kinesis를 Lambda가 가져가는 폴링 방식이 있고, 재시도 동작이 각각 다릅니다.'},
      {icon:'apigw', t:'API Gateway', d:'가볍고 싼 HTTP API와 기능이 많은 REST API가 있습니다. JWT 권한 부여, 사용량 계획, 캐싱 지원 범위가 다릅니다.'},
      {icon:'workflow', t:'Step Functions', d:'여러 함수와 서비스 호출을 상태 머신으로 묶고 재시도·보상 단계를 정의합니다.'}
     ],
     defaults:['중요 함수에는 예약 동시성을 걸어 다른 함수가 할당량을 다 쓰지 못하게 합니다.','비동기 호출에는 실패 대상(DLQ)을 지정합니다.','제한 시간은 실제 처리 시간보다 조금 길게, 호출자의 제한 시간보다는 짧게 둡니다.','관계형 DB를 쓴다면 RDS Proxy를 둡니다.'],
     pitfalls:[['S3 → Lambda → 같은 버킷에 쓰기','재귀 호출로 비용이 폭증합니다. 다른 버킷이나 접두사로 나눕니다.'],['VPC에 연결하고 인터넷이 안 된다','VPC 안 Lambda는 NAT나 엔드포인트가 있어야 외부·AWS API에 닿습니다.'],['15분 넘는 작업을 Lambda로','Step Functions로 쪼개거나 Fargate 작업으로 옮깁니다.'],['동시성 한도를 모른다','트래픽 급증 때 스로틀이 납니다.']],
     services:['serverless-compute','api-gateway','workflow','serverless-container'], scenarios:[2,5],
     refs:[['Lambda 동시성','https://docs.aws.amazon.com/lambda/latest/dg/lambda-concurrency.html'],['API Gateway HTTP API와 REST API 비교','https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-vs-rest.html']]},

    {id:'messaging', title:'SQS·SNS·EventBridge·Kinesis',
     lede:'큐, 토픽, 이벤트 버스, 스트림은 비슷해 보이지만 보장하는 것이 다릅니다. 순서, 재생, 팬아웃, 라우팅 중 무엇이 필요한지로 고릅니다.',
     concepts:[
      {icon:'queue', t:'SQS', d:'표준 큐는 최소 한 번 전달과 거의 무제한 처리량, FIFO 큐는 그룹 내 순서와 중복 제거를 제공합니다. 가시성 제한 시간, DLQ, 최대 14일 보존이 핵심 설정입니다.'},
      {icon:'topic', t:'SNS', d:'게시된 메시지를 여러 구독자(SQS, Lambda, HTTP 등)에 복사하는 팬아웃입니다. 구독 필터 정책으로 받을 메시지를 고릅니다.'},
      {icon:'eventbus', t:'EventBridge', d:'이벤트 버스와 규칙으로 내용 기반 라우팅을 하고, Scheduler로 예약 실행을, Pipes로 소스와 대상을 코드 없이 잇습니다.'},
      {icon:'stream', t:'Kinesis Data Streams', d:'순서가 있는 레코드 스트림을 여러 소비자가 각자 읽고 일정 기간 재생할 수 있습니다. 파티션 키 분포가 처리량을 정합니다.'},
      {icon:'stream', t:'Amazon MSK', d:'관리형 Apache Kafka입니다. Kafka 생태계와 도구가 필요할 때 씁니다.'}
     ],
     defaults:['한 이벤트를 여러 곳이 받아야 하면 SNS→SQS 팬아웃이나 EventBridge 규칙→SQS로 나눕니다.','모든 큐에 DLQ와 경보를 둡니다.','소비자는 멱등하게 만듭니다.','큰 데이터는 S3에 두고 메시지에는 경로만 넣습니다.'],
     pitfalls:[['가시성 제한 시간이 처리 시간보다 짧다','같은 메시지가 두 번 처리됩니다.'],['FIFO 큐 처리량을 고려하지 않는다','순서가 정말 필요한 범위만 FIFO로 둡니다.'],['Kinesis 파티션 키가 한쪽으로 쏠린다','샤드 하나에 몰려 처리가 밀립니다.'],['EventBridge 규칙 대상 실패를 모른다','대상별 DLQ와 재시도 정책을 설정합니다.']],
     services:['message-queue','pubsub-topic','event-bus','stream-ingest','change-feed'], scenarios:[5,7,10],
     refs:[['Amazon SQS 개발자 안내서','https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html'],['Amazon EventBridge 사용 설명서','https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-what-is.html']]},

    {id:'observe', title:'CloudWatch와 관측성',
     lede:'지표, 로그, 추적, 감사 기록을 어디에 모으고 얼마나 보관할지가 관측 설계입니다. 기본값으로 두면 로그는 영원히 쌓이고 비용도 함께 쌓입니다.',
     concepts:[
      {icon:'mon', t:'CloudWatch 지표와 경보', d:'서비스가 지표를 자동으로 보내고, 사용자 지정 지표도 올릴 수 있습니다. 여러 경보를 묶은 복합 경보로 알림 소음을 줄입니다.'},
      {icon:'logs', t:'CloudWatch Logs', d:'로그 그룹 단위로 저장하며 기본 보존 기간은 무기한입니다. Logs Insights로 질의하고, 수집량에 따라 과금됩니다.'},
      {icon:'mon', t:'추적과 애플리케이션 신호', d:'X-Ray와 CloudWatch Application Signals로 요청 경로와 서비스 수준 목표를 봅니다. OpenTelemetry로 계측할 수 있습니다.'},
      {icon:'audit', t:'CloudTrail', d:'API 호출 기록입니다. 관리 이벤트는 기본으로 90일 조회되고, S3 객체 접근 같은 데이터 이벤트는 따로 켜야 하며 추가 과금됩니다.'},
      {icon:'mon', t:'관리형 Prometheus·Grafana', d:'쿠버네티스 지표는 Amazon Managed Service for Prometheus와 Managed Grafana로 운영할 수 있습니다.'}
     ],
     defaults:['로그 그룹마다 보존 기간을 정합니다.','사용자 경험 지표(오류율, 지연)에 경보를 걸고, 원인 지표는 대시보드로 봅니다.','CloudTrail 조직 추적을 로그 계정에 보관합니다.','데이터 이벤트는 필요한 버킷·테이블만 켭니다.'],
     pitfalls:[['로그 보존 기간이 무기한','몇 년 치 디버그 로그에 계속 요금이 나갑니다.'],['고유값이 많은 차원으로 지표를 만든다','사용자 ID 같은 차원은 지표 수를 폭증시켜 비용이 커집니다.'],['경보 없이 대시보드만 있다','아무도 보지 않을 때 장애가 납니다.'],['CloudTrail 90일 기록만 믿는다','장기 보관과 조직 전체 수집은 추적을 만들어야 합니다.']],
     services:['monitoring','logs','apm','org-audit'], scenarios:[1,5,13],
     refs:[['Amazon CloudWatch 사용 설명서','https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html'],['AWS CloudTrail 사용 설명서','https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html']]},

    {id:'security', title:'보안 서비스',
     lede:'AWS의 보안 서비스는 키 관리, 시크릿, 위협 탐지, 설정 점검, 경계 방어로 나뉩니다. 조직 전체에 위임 관리자 계정을 두고 한곳에서 보는 것이 출발점입니다.',
     concepts:[
      {icon:'kms', t:'KMS', d:'고객 관리형 키로 데이터 키를 감싸는 봉투 암호화를 합니다. 키 정책이 접근의 출발점이라, 키 정책이 계정을 허용하지 않으면 IAM 정책만으로는 키를 쓸 수 없습니다.'},
      {icon:'secret', t:'Secrets Manager', d:'DB 암호 같은 시크릿을 저장하고 자동 교체합니다. RDS 관리형 마스터 암호와 연동됩니다.'},
      {icon:'sechub', t:'GuardDuty와 Security Hub', d:'GuardDuty는 로그와 런타임 신호로 위협을 탐지하고, Security Hub는 보안 표준 점검 결과와 여러 서비스의 발견 사항을 모읍니다.'},
      {icon:'waf', t:'WAF와 Shield', d:'WAF는 CloudFront·ALB·API Gateway 앞에서 L7 규칙을 적용합니다. Shield Standard는 기본 제공, Shield Advanced는 유료로 대응 지원과 비용 보호를 더합니다.'},
      {icon:'sechub', t:'Inspector와 Macie', d:'Inspector는 EC2·컨테이너 이미지·Lambda의 취약점을, Macie는 S3의 민감 데이터를 찾습니다.'}
     ],
     defaults:['GuardDuty·Security Hub를 조직 단위로 켜고 보안 계정을 위임 관리자로 지정합니다.','KMS 키 정책은 키 관리자와 키 사용자를 나눕니다.','시크릿은 Secrets Manager에 두고 교체를 켭니다.','인터넷에 노출된 진입점에는 WAF 관리형 규칙을 붙입니다.'],
     pitfalls:[['키 정책으로 스스로를 잠근다','키 정책이 관리자를 허용하지 않으면 키를 관리할 수 없게 됩니다. 변경 전에 검토합니다.'],['발견 사항을 처리할 담당이 없다','경보가 쌓이기만 하고 아무도 보지 않습니다.'],['시크릿을 환경 변수 평문으로 둔다','콘솔·로그에 노출됩니다.'],['WAF를 바로 차단 모드로 켠다','카운트 모드로 오탐을 먼저 확인합니다.']],
     services:['kms','secrets','sec-posture','threat-detection','waf-bot','data-perimeter'], scenarios:[9],
     refs:[['AWS KMS 키 정책','https://docs.aws.amazon.com/kms/latest/developerguide/key-policies.html'],['AWS Security Hub','https://docs.aws.amazon.com/securityhub/latest/userguide/what-is-securityhub.html']]},

    {id:'cost', title:'비용 관리',
     lede:'AWS 비용은 서비스 요금 외에 데이터 전송과 요청 요금이 섞여 있어 청구서만 봐서는 원인을 찾기 어렵습니다. 태그와 내보내기 데이터로 나눠 보는 것이 시작입니다.',
     concepts:[
      {icon:'cost', t:'Cost Explorer와 데이터 내보내기', d:'서비스·계정·태그별로 비용을 보고, 상세 사용 내역은 데이터 내보내기(CUR 2.0)로 S3에 받아 Athena로 분석합니다.'},
      {icon:'cost', t:'비용 할당 태그', d:'태그를 결제 콘솔에서 비용 할당 태그로 활성화해야 비용 보고서에 나타납니다. 활성화 이전 기간에는 소급되지 않습니다.'},
      {icon:'mon', t:'Budgets와 이상 탐지', d:'예산을 넘거나 넘을 것으로 예측되면 알림을 보내고, 이상 탐지는 평소와 다른 지출 증가를 찾아냅니다.'},
      {icon:'cost', t:'Savings Plans와 예약', d:'Compute Savings Plans는 인스턴스 패밀리·리전·Fargate·Lambda에 걸쳐 적용되고, EC2 Instance Savings Plans와 예약 인스턴스는 범위가 좁은 대신 할인이 큽니다.'},
      {icon:'net', t:'데이터 전송 요금', d:'인터넷 송신, AZ 간 전송, 리전 간 전송, NAT 게이트웨이 처리량이 각각 과금됩니다.'}
     ],
     defaults:['팀·서비스·환경 태그를 정하고 비용 할당 태그로 활성화합니다.','계정마다 예산 경보와 이상 탐지를 켭니다.','월 1회 Compute Optimizer와 Savings Plans 권장 사항을 검토합니다.','S3·DynamoDB 트래픽은 게이트웨이 엔드포인트로 NAT를 피합니다.'],
     pitfalls:[['태그를 활성화하지 않았다','태그를 붙여도 보고서에 안 나옵니다.'],['약정을 크기 조정 전에 산다','큰 인스턴스를 오래 할인받는 셈입니다.'],['NAT 처리 요금을 모른다','컨테이너 이미지 풀, S3 백업 트래픽이 NAT를 지나며 과금됩니다.'],['개발 계정이 24시간 켜져 있다','업무 시간에만 켜도 크게 줄어듭니다.']],
     services:['cost-mgmt','rightsizing','commitment','spot','vm-schedule'], scenarios:[13],
     refs:[['AWS 비용 관리','https://docs.aws.amazon.com/cost-management/latest/userguide/what-is-costmanagement.html'],['Savings Plans','https://docs.aws.amazon.com/savingsplans/latest/userguide/what-is-savings-plans.html']]},

    {id:'organizations', title:'Organizations와 Control Tower',
     lede:'AWS에서 멀티 계정은 선택이 아니라 기본입니다. Organizations로 계정을 묶고 정책을 상속시키며, Control Tower로 그 뼈대를 자동으로 세웁니다.',
     concepts:[
      {icon:'org', t:'관리 계정과 멤버 계정', d:'조직을 만든 관리 계정이 결제를 통합하고 정책을 관리합니다. 관리 계정에는 SCP가 적용되지 않으므로 워크로드를 두지 않습니다.'},
      {icon:'guard', t:'SCP와 RCP', d:'SCP는 멤버 계정의 주체가 할 수 있는 최대 권한을, RCP는 멤버 계정의 리소스에 허용될 수 있는 최대 권한을 정합니다. 둘 다 권한을 주지는 않습니다.'},
      {icon:'sechub', t:'위임 관리자', d:'GuardDuty, Security Hub, Config 같은 서비스의 조직 관리를 보안 계정에 위임해 관리 계정 사용을 줄입니다.'},
      {icon:'guard', t:'Control Tower', d:'로그 보관 계정과 감사 계정을 포함한 랜딩 존을 만들고, 예방·탐지·사전 통제를 OU 단위로 적용합니다.'},
      {icon:'account', t:'Account Factory', d:'표준 설정(네트워크, 로그, 역할)이 들어간 계정을 찍어 냅니다. Terraform으로 쓰려면 AFT를 씁니다.'}
     ],
     defaults:['관리 계정은 결제·조직 관리만, 보안 서비스는 보안 계정에 위임합니다.','보안·인프라·워크로드·샌드박스 OU로 시작합니다.','SCP로 감사 추적 보호, 리전 제한, 조직 탈퇴 금지를 겁니다.','계정 생성은 Account Factory로 자동화합니다.'],
     pitfalls:[['SCP로 서비스 연결 역할까지 막는다','AWS 서비스가 대신 수행하는 작업이 실패합니다. 예외를 확인합니다.'],['루트 OU에 실험적 SCP를 붙인다','모든 계정이 한 번에 영향을 받습니다. 테스트 OU에서 먼저 씁니다.'],['Control Tower가 만든 리소스를 손으로 고친다','드리프트가 생겨 업데이트가 실패합니다.'],['관리 계정에서 워크로드를 돌린다','가드레일 밖에서 사고가 납니다.']],
     services:['org-root','grouping','guardrail','org-audit','sso'], scenarios:[3,9],
     refs:[['AWS Organizations 사용 설명서','https://docs.aws.amazon.com/organizations/latest/userguide/orgs_introduction.html'],['AWS Control Tower 사용 설명서','https://docs.aws.amazon.com/controltower/latest/userguide/what-is-control-tower.html']]}
  ]
};
