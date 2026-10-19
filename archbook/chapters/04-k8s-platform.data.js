window.SCENARIO = {
  no: 4, level: 'intermediate', title: '쿠버네티스 마이크로서비스',
  lede: '서비스가 열 개를 넘고 팀이 여럿이면 컨테이너 플랫폼이 필요해집니다. 쿠버네티스 API는 세 클라우드가 같지만, 파드 IP를 받는 방식, 노드를 늘리는 주체, 파드에 클라우드 권한을 주는 방식은 모두 다릅니다.',
  region: {aws:'EKS · ap-northeast-2', gcp:'GKE 리전 클러스터 · asia-northeast3', azure:'AKS · Korea Central'},
  req: [
    {k:'서비스', v:'마이크로서비스 12개', s:'주문, 결제, 카탈로그, 검색 등'},
    {k:'팀·배포', v:'팀 4개, 하루 20회 배포', s:'팀별 네임스페이스'},
    {k:'규모', v:'노드 평시 20대, 피크 60대', s:'노드당 파드 30개 안팎'},
    {k:'보안', v:'파드별 최소 권한', s:'노드 권한 공유 금지, 이미지 검사'}
  ],
  intro: { arch: '컨트롤 플레인은 클라우드가 관리하고, 우리는 노드 풀과 그 위의 파드를 설계합니다. <b>영역 장애</b>를 눌러 파드와 볼륨이 어떻게 되는지 보세요.' },
  diagram: {
    w: 680, h: 520,
    frames: [
      {id:'region', kind:'region', x:20, y:126, w:640, h:380, label:{aws:'서울 리전 · ap-northeast-2', gcp:'서울 리전 · asia-northeast3', azure:'서울 리전 · Korea Central'}},
      {id:'z1', kind:'zone', x:232, y:150, w:205, h:230, label:{aws:'ap-northeast-2a', gcp:'asia-northeast3-a', azure:'영역 1'}},
      {id:'z2', kind:'zone', x:447, y:150, w:205, h:230, label:{aws:'ap-northeast-2c', gcp:'asia-northeast3-b', azure:'영역 2'}}
    ],
    nodes: [
      {id:'users', x:280, y:8, w:120, h:34, icon:'users', t:'사용자'},
      {id:'lb', cfg:'lb', x:230, y:62, w:220, h:46, icon:'lb', t:'L7 진입점', s:{aws:'ALB · Load Balancer Controller', gcp:'GKE Gateway · 외부 LB', azure:'App Gateway for Containers'}, kind:'reg'},
      {id:'cp', cfg:'k8s', x:30, y:150, w:190, h:48, icon:'k8s', t:'컨트롤 플레인', s:{aws:'EKS 관리형 · 여러 AZ', gcp:'GKE 리전 클러스터', azure:'AKS 관리형'}, kind:'reg'},
      {id:'reg', x:30, y:212, w:190, h:44, icon:'registry', t:'이미지 저장소', s:{aws:'ECR · 이미지 스캔', gcp:'Artifact Registry', azure:'ACR'}, kind:'alt'},
      {id:'idn', cfg:'podid', x:30, y:268, w:190, h:44, icon:'iam', t:'파드 권한', s:{aws:'EKS Pod Identity', gcp:'Workload Identity', azure:'Entra Workload ID'}, kind:'alt'},
      {id:'sec', cfg:'secret', x:30, y:324, w:190, h:44, icon:'secret', t:'시크릿', s:{aws:'Secrets Manager + CSI', gcp:'Secret Manager', azure:'Key Vault + CSI'}, kind:'alt'},
      {id:'n1', cfg:'k8s', x:242, y:240, w:185, h:44, icon:'vm', t:'앱 노드', s:{aws:'Karpenter 노드', gcp:'노드 풀 · 오토스케일', azure:'사용자 노드 풀'}},
      {id:'p1', x:242, y:180, w:185, h:44, icon:'k8s', t:'주문·결제 파드', s:'복제본 영역별 분산'},
      {id:'v1', x:242, y:300, w:185, h:44, icon:'files', t:'블록 볼륨', s:{aws:'EBS · AZ에 묶임', gcp:'영역 PD', azure:'Azure Disk LRS'}},
      {id:'n2', cfg:'k8s', x:457, y:240, w:185, h:44, icon:'vm', t:'앱 노드', s:{aws:'Karpenter 노드', gcp:'노드 풀 · 오토스케일', azure:'사용자 노드 풀'}},
      {id:'p2', x:457, y:180, w:185, h:44, icon:'k8s', t:'주문·결제 파드', s:'복제본 영역별 분산', failS:'파드 추가 생성'},
      {id:'v2', x:457, y:300, w:185, h:44, icon:'files', t:'블록 볼륨', s:{aws:'EBS · AZ에 묶임', gcp:'영역 PD', azure:'Azure Disk LRS'}},
      {id:'db', cfg:'dbha', x:242, y:410, w:185, h:44, icon:'db', t:'주문 DB', s:{aws:'Aurora MySQL', gcp:'Cloud SQL HA', azure:'MySQL Flexible Server'}},
      {id:'mon', x:457, y:410, w:185, h:44, icon:'mon', t:'관측', s:{aws:'Container Insights', gcp:'Managed Prometheus', azure:'Managed Prometheus'}, kind:'alt'}
    ],
    edges: [
      {a:'users', b:'lb'}, {a:'lb', b:'p1'}, {a:'lb', b:'p2'},
      {a:'p1', b:'db'}, {a:'p2', b:'db'},
      {a:'p1', b:'n1', dash:'both'}, {a:'p2', b:'n2', dash:'both'}, {a:'n1', b:'v1', dash:true}, {a:'n2', b:'v2', dash:true},
      {a:'idn', b:'sec', dash:true}
    ]
  },
  fail: {
    button: '영역 a 장애', restore: '복구', title: '영역 하나가 사라졌을 때',
    zones: ['z1'], zoneLabel: '영역 장애', down: ['n1','p1','v1'], promote: ['p2'],
    normal: {
      aws: ['사용자 → ALB(대상 유형 ip) → 파드로 바로 전달. AWS Load Balancer Controller가 Ingress·Service를 보고 ALB를 만듭니다.', '파드는 VPC CNI로 VPC 서브넷의 IP를 받습니다.', '파드가 AWS API를 부를 때는 서비스 계정에 연결된 IAM 역할(EKS Pod Identity)을 씁니다.'],
      gcp: ['사용자 → Gateway API로 만든 외부 Application LB → 파드(NEG)로 바로 전달.', '파드는 VPC 네이티브 클러스터의 보조 대역에서 IP를 받습니다.', '파드가 Google API를 부를 때는 Workload Identity로 쿠버네티스 서비스 계정이 IAM 주체가 됩니다.'],
      azure: ['사용자 → Application Gateway for Containers → 파드로 전달.', '파드는 Azure CNI Overlay의 오버레이 대역에서 IP를 받아 VNet 주소를 아낍니다.', '파드가 Azure API를 부를 때는 Entra Workload ID로 관리 ID와 페더레이션합니다.']
    },
    effects: {
      aws: [
        ['good','EKS 컨트롤 플레인은 여러 AZ에 걸친 관리형이라 영향이 없습니다.'],
        ['good','topologySpreadConstraints로 복제본을 AZ에 나누고 PodDisruptionBudget을 두었다면 남은 AZ의 파드가 요청을 받습니다.'],
        ['good','Karpenter가 대기 중인 파드를 보고 남은 AZ에 노드를 새로 띄웁니다.'],
        ['warn','EBS 볼륨은 AZ에 묶여 있어, 그 볼륨을 쓰던 StatefulSet 파드는 다른 AZ로 옮겨 가도 볼륨을 붙이지 못합니다. 상태는 관리형 DB나 EFS로 뺍니다.']
      ],
      gcp: [
        ['good','리전 클러스터는 컨트롤 플레인이 여러 영역에 복제되어 있습니다. 영역 클러스터였다면 컨트롤 플레인도 함께 멈춥니다.'],
        ['good','영역에 나눠 둔 복제본이 요청을 받고, 클러스터 오토스케일러가 남은 영역에 노드를 늘립니다.'],
        ['warn','영역 Persistent Disk는 그 영역에 묶입니다. 리전 Persistent Disk를 쓰면 다른 영역에서 다시 붙일 수 있습니다.'],
        ['good','Autopilot 클러스터라면 노드 배치와 확장을 GKE가 맡습니다.']
      ],
      azure: [
        ['good','AKS 컨트롤 플레인은 관리형이며, 가동 시간 SLA가 있는 Standard 계층을 권장합니다.'],
        ['warn','노드 풀을 만들 때 여러 가용성 영역을 지정했어야 남은 영역에서 노드가 늘어납니다. 기존 노드 풀의 영역 설정은 나중에 바꿀 수 없습니다.'],
        ['warn','LRS 관리 디스크는 영역에 묶입니다. ZRS 디스크를 쓰면 다른 영역의 노드에서 다시 붙일 수 있습니다.'],
        ['good','영역에 나눠 둔 복제본이 요청을 받습니다.']
      ]
    }
  },
  scope: ['k8s','podid','lb','secret','dbha'],
  build: {
    aws: [
      {t:'VPC · 서브넷 (파드 IP까지 고려)', d:'VPC CNI는 파드에 VPC IP를 씀 → 넉넉한 서브넷', cfg:'subnet'},
      {t:'클러스터 IAM 역할 + EKS 클러스터', d:'비공개 엔드포인트, 액세스 항목 인증', cfg:'k8s', nodes:['cp']},
      {t:'애드온', d:'vpc-cni, coredns, kube-proxy, pod-identity-agent, EBS CSI', cfg:'k8s', nodes:['cp','v1','v2']},
      {t:'Karpenter (또는 관리형 노드 그룹)', d:'NodePool에 AZ·인스턴스 유형 범위', cfg:'k8s', nodes:['n1','n2']},
      {t:'AWS Load Balancer Controller', d:'Ingress → ALB, 서브넷 태그 필요', cfg:'lb', nodes:['lb']},
      {t:'ECR 리포지토리', d:'푸시 시 스캔', nodes:['reg']},
      {t:'Pod Identity 연결', d:'네임스페이스·SA ↔ IAM 역할', cfg:'podid', nodes:['idn']},
      {t:'Secrets Store CSI + Secrets Manager', d:'파드에 시크릿 마운트', cfg:'secret', nodes:['sec']},
      {t:'Aurora MySQL', d:'파드 SG(또는 노드 SG)에서 3306 허용', cfg:'dbha', nodes:['db']}
    ],
    gcp: [
      {t:'서브넷 + 보조 대역', d:'pods /14, services /20', cfg:'subnet'},
      {t:'GKE 리전 클러스터', d:'VPC 네이티브, 비공개 노드, 릴리스 채널', cfg:'k8s', nodes:['cp']},
      {t:'노드 풀 (Standard) 또는 Autopilot', d:'Autopilot이면 이 단계 없음', cfg:'k8s', nodes:['n1','n2']},
      {t:'Artifact Registry', d:'리전 저장소', nodes:['reg']},
      {t:'Workload Identity 권한', d:'KSA 주체에 IAM 역할', cfg:'podid', nodes:['idn']},
      {t:'Secret Manager', d:'CSI 드라이버 애드온 또는 SDK', cfg:'secret', nodes:['sec']},
      {t:'Gateway API (gke-l7-global-external-managed)', d:'Gateway·HTTPRoute가 외부 LB를 만듦', cfg:'lb', nodes:['lb']},
      {t:'Cloud SQL HA + 비공개 서비스 액세스', d:'Cloud SQL Auth Proxy 사이드카', cfg:'dbha', nodes:['db']}
    ],
    azure: [
      {t:'VNet · 노드 서브넷', d:'CNI Overlay면 파드 대역은 VNet 밖', cfg:'subnet'},
      {t:'AKS 클러스터', d:'Standard 계층, CNI Overlay, 시스템 노드 풀 영역 1·2·3', cfg:'k8s', nodes:['cp']},
      {t:'사용자 노드 풀', d:'영역 1·2·3, 클러스터 오토스케일러', cfg:'k8s', nodes:['n1','n2']},
      {t:'ACR + AcrPull 연결', d:'kubelet ID에 권한', nodes:['reg']},
      {t:'OIDC 발급자 + Workload ID', d:'관리 ID, 페더레이션 자격 증명', cfg:'podid', nodes:['idn']},
      {t:'Key Vault + CSI 드라이버', d:'애드온 azure-keyvault-secrets-provider', cfg:'secret', nodes:['sec']},
      {t:'Application Gateway for Containers', d:'ALB 컨트롤러, 위임 서브넷', cfg:'lb', nodes:['lb']},
      {t:'MySQL Flexible Server', d:'위임 서브넷, 영역 중복 HA', cfg:'dbha', nodes:['db']}
    ]
  },
  map: ['k8s-managed','node-autoscale','k8s-ingress','container-registry','pod-identity','secrets','mysql-ha','monitoring'],
  decisions: [
    {t:'파드 IP를 어디서 받는가',
     p:'노드와 파드가 늘면 IP 주소가 먼저 바닥나는 경우가 많습니다. 아래 시뮬레이터로 확인해 보세요.',
     aws:'기본 VPC CNI는 파드마다 VPC 서브넷 IP를 하나씩 씁니다. 대규모라면 접두사 위임이나 보조 CIDR을 함께 계획합니다.',
     gcp:'VPC 네이티브 클러스터는 서브넷의 보조 대역에서 노드마다 블록을 잡아 파드에 줍니다. 파드도 VPC 안에서 바로 라우팅됩니다.',
     azure:'Azure CNI Overlay는 파드에 VNet 밖의 별도 대역을 줘 VNet 주소를 거의 쓰지 않습니다. 기존 Azure CNI는 파드마다 VNet IP를 씁니다.',
     so:'EKS는 서브넷을 넉넉하게, GKE는 보조 대역을 넉넉하게, AKS 오버레이는 파드 대역이 다른 네트워크와 겹치지 않게 잡습니다.'},
    {t:'노드는 누가 늘리는가',
     p:'파드가 자리를 못 잡고 대기하면 노드를 늘려야 합니다. 이 일을 누가 하느냐가 운영 인원을 정합니다.',
     aws:'Karpenter가 대기 파드의 요구에 맞는 인스턴스 유형을 골라 바로 띄웁니다. 노드 관리까지 맡기려면 EKS Auto Mode를 씁니다.',
     gcp:'클러스터 오토스케일러가 노드 풀 안에서 늘리고, 노드 자동 프로비저닝은 풀 자체를 만듭니다. Autopilot은 노드 관리를 GKE가 전부 맡습니다.',
     azure:'클러스터 오토스케일러가 노드 풀 안에서 늘립니다. 노드 자동 프로비저닝이나 AKS Automatic을 쓰면 노드 선택을 AKS에 맡길 수 있습니다.',
     so:'운영 인원이 적다면 노드를 클라우드가 관리하는 모드(EKS Auto Mode, GKE Autopilot, AKS Automatic)부터 검토합니다.'},
    {t:'파드에 클라우드 권한을 주는 방법',
     p:'노드의 권한에 기대면 같은 노드의 모든 파드가 같은 권한을 갖게 됩니다.',
     aws:'EKS Pod Identity(또는 IRSA)로 쿠버네티스 서비스 계정에 IAM 역할을 연결합니다.',
     gcp:'Workload Identity Federation for GKE로 쿠버네티스 서비스 계정을 IAM 주체로 쓰거나 Google 서비스 계정에 연결합니다.',
     azure:'Microsoft Entra Workload ID로 쿠버네티스 서비스 계정을 사용자 할당 관리 ID와 페더레이션합니다.',
     so:'셋 다 "서비스 계정 단위 권한"이라는 같은 결론입니다. 노드 역할에는 이미지 풀처럼 노드 자체에 필요한 권한만 둡니다.'},
    {t:'진입점: Ingress에서 Gateway API로',
     p:'쿠버네티스 표준 진입점이 Ingress에서 Gateway API로 옮겨 가고 있습니다. 각 클라우드의 컨트롤러가 이를 실제 로드밸런서로 바꿉니다.',
     aws:'AWS Load Balancer Controller가 Ingress를 ALB로, Service를 NLB로 만듭니다. Gateway API 지원 범위는 컨트롤러 버전별로 확인합니다.',
     gcp:'GKE Gateway 컨트롤러가 Gateway API 리소스를 관리형 Application LB로 만듭니다.',
     azure:'Application Gateway for Containers가 Gateway API와 Ingress를 받아 L7 부하분산을 합니다.',
     so:'파드로 바로 보내는 방식(대상 유형 ip, NEG)을 쓰면 노드를 한 번 더 거치지 않아 지연과 비용이 줄어듭니다.'}
  ],
  sims: [{type:'podip'}, {type:'capacity', title:'영역 하나가 죽어도 파드가 버티려면 노드가 몇 대 필요할까', values:{peak:12000, per:400, util:70, az:3}}],
  iac: 'iac/scenario-04',
  checklist: [
    ['requests·limits 없이 배포한다','스케줄러가 자리를 계산할 수 없고, 한 파드가 노드 자원을 다 써 이웃 파드를 쫓아냅니다.'],
    ['복제본을 한 영역에 몰아 둔다','topologySpreadConstraints로 영역에 나누고 PodDisruptionBudget으로 동시에 내려가는 수를 제한합니다.'],
    ['이미지를 latest 태그로 배포한다','어떤 버전이 떠 있는지 알 수 없고 되돌리기도 어렵습니다. 다이제스트나 고정 태그를 씁니다.'],
    ['노드 역할에 앱 권한을 준다','같은 노드의 모든 파드가 그 권한을 갖습니다. 서비스 계정 단위 권한을 씁니다.'],
    ['클러스터 업그레이드를 미룬다','쿠버네티스 마이너 버전은 지원 기간이 짧습니다. 표준 지원이 끝나면 연장 지원 비용이 붙거나 강제 업그레이드됩니다.'],
    ['상태 있는 앱을 블록 볼륨에 둔다','영역 장애 때 볼륨이 따라오지 못합니다. 관리형 DB나 영역 중복 스토리지를 씁니다.'],
    ['시크릿을 환경 변수 평문으로 넣는다','시크릿 저장소와 CSI 드라이버로 마운트하고, 쿠버네티스 Secret은 암호화를 켭니다.'],
    ['dev와 prod를 한 클러스터에 둔다','업그레이드, 장애, 권한 사고가 함께 번집니다. 최소한 prod 클러스터는 분리합니다.']
  ],
  refs: [
    ['Amazon EKS 모범 사례 가이드', 'https://docs.aws.amazon.com/eks/latest/best-practices/introduction.html'],
    ['GKE 클러스터 아키텍처', 'https://cloud.google.com/kubernetes-engine/docs/concepts/cluster-architecture'],
    ['AKS 기준 아키텍처', 'https://learn.microsoft.com/azure/architecture/reference-architectures/containers/aks/baseline-aks']
  ],
  next: '시나리오 05 · 이벤트 기반 주문 처리'
};
