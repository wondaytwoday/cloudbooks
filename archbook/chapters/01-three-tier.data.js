window.SCENARIO = {
  no: 1, level: 'basic', title: '3티어 웹서비스',
  lede: '웹 서버, 앱 서버, 데이터베이스. 가장 흔한 구조이고 세 클라우드의 도면도 거의 같아 보입니다. 하지만 실제로 만들어 보면 <b>인터넷 출입구를 직접 만드는지, 방화벽 규칙이 어디에 붙는지, 서브넷이 영역에 묶이는지</b>가 모두 다르고, 그래서 구축 단계 수와 순서도 다릅니다. 도면의 상자를 눌러 각 리소스의 실제 설정을 열어 보세요.',
  region: {aws:'ap-northeast-2 (서울)', gcp:'asia-northeast3 (서울)', azure:'Korea Central (서울)'},
  req: [
    {k:'트래픽', v:'피크 3,000 RPS', s:'평시 그 1/5 수준, 이벤트 때 급증'},
    {k:'가용성 목표', v:'월 99.9%', s:'한 달에 약 43분까지 중단 허용'},
    {k:'데이터', v:'MySQL 회원·주문', s:'상품 이미지는 오브젝트 스토리지'},
    {k:'제약', v:'서울 리전, 운영 인원 2명', s:'앱 서버는 인터넷에서 직접 닿지 않게'}
  ],
  intro: {
    arch: '두 개 이상의 영역에 앱 서버와 DB를 나눠 두는 기본형입니다. 클라우드를 바꿔 보면 서브넷 상자의 모양, 방화벽 꼬리표가 붙는 위치, 점선(자동) 상자가 달라집니다. <b>첫 번째 영역 장애</b>를 눌러 영역 하나가 사라질 때 무엇이 남는지도 확인해 보세요.',
    build: '같은 3티어를 세 클라우드에서 실제로 만드는 순서입니다. AWS는 인터넷 게이트웨이와 라우팅 테이블을 직접 만들고 서브넷에 연결해야 하지만, GCP와 Azure는 인터넷 경로가 처음부터 있습니다. 반대로 GCP 로드밸런서는 리소스 여러 개를 이어 붙여야 하고, Azure는 전용 서브넷과 위임 서브넷을 먼저 준비해야 합니다. 단계를 누르면 그 단계의 설정 항목이 열리고, <b>도면에서 위치 보기</b>로 해당 리소스를 도면에 표시할 수 있습니다.',
    iac: '도면의 리소스를 만드는 순서대로 적은 골격입니다. 클라우드마다 리소스 수가 어떻게 다른지 비교해 보세요. 이미지·인증서·계정처럼 환경마다 다른 값은 변수로 뺐고 일부 필수 인자는 생략했습니다.'
  },

  diagram: {
    aws: { w: 700, h: 670, aria: 'AWS 3티어 도면: VPC 안에 AZ 두 개, AZ마다 퍼블릭·앱·DB 서브넷, 인터넷 게이트웨이, AZ별 NAT 게이트웨이, 보안 그룹',
      frames: [
        {id:'region', kind:'region', x:14, y:112, w:672, h:546, label:'서울 리전 · ap-northeast-2'},
        {id:'vpc', kind:'net', x:26, y:146, w:648, h:428, label:'VPC 10.0.0.0/16 · 리전 범위', cfg:'vpc',
          why:'서브넷 6개(AZ 2개 × 3계층)가 모두 이 CIDR 안에서 나옵니다. 나중에 AZ를 하나 더 쓰거나 EKS를 올릴 여유를 생각해 /16으로 잡았습니다.'},
        {id:'z1', kind:'zone', x:38, y:232, w:308, h:330, label:'ap-northeast-2a'},
        {id:'z2', kind:'zone', x:354, y:232, w:308, h:330, label:'ap-northeast-2c'},
        {id:'pub1', kind:'plain', x:46, y:254, w:292, h:84, label:'퍼블릭 10.0.1.0/24', cfg:'subnet', why:'ALB와 NAT 게이트웨이가 들어가는 서브넷입니다. rt-public에 연결되어 있어서 "퍼블릭"입니다.'},
        {id:'pub2', kind:'plain', x:362, y:254, w:292, h:84, label:'퍼블릭 10.0.2.0/24', cfg:'subnet', why:'ALB는 AZ가 다른 서브넷 두 개 이상이 필요하므로 AZ c에도 퍼블릭 서브넷을 둡니다.'},
        {id:'app1', kind:'plain', x:46, y:348, w:292, h:100, label:'앱 10.0.11.0/24', cfg:'subnet', why:'인터넷 게이트웨이 경로가 없는 프라이빗 서브넷입니다. 바깥으로는 같은 AZ의 NAT로만 나갑니다.'},
        {id:'app2', kind:'plain', x:362, y:348, w:292, h:100, label:'앱 10.0.12.0/24', cfg:'subnet'},
        {id:'dbs1', kind:'plain', x:46, y:458, w:292, h:94, label:'DB 10.0.21.0/24', cfg:'subnet', why:'DB 서브넷 그룹에 넣을 서브넷입니다. 인터넷 경로가 전혀 필요 없으므로 기본 라우팅 테이블(local만)을 써도 됩니다.'},
        {id:'dbs2', kind:'plain', x:362, y:458, w:292, h:94, label:'DB 10.0.22.0/24', cfg:'subnet'}
      ],
      nodes: [
        {id:'users', x:290, y:6, w:120, h:32, icon:'users', t:'사용자'},
        {id:'dns', x:70, y:54, w:200, h:42, icon:'dns', t:'DNS', s:'Route 53 · 별칭 레코드', kind:'alt', cfg:'dns'},
        {id:'edge', x:410, y:54, w:220, h:42, icon:'cdn', t:'CloudFront + WAF', s:'선택: 정적 캐시·차단', kind:'alt', cfg:'cdn'},
        {id:'igw', x:430, y:128, w:200, h:36, icon:'igw', t:'인터넷 게이트웨이', s:'직접 만들어 VPC에 연결', kind:'reg', cfg:'igw',
          why:'이 게이트웨이와 rt-public의 0.0.0.0/0 경로가 없으면 ALB가 인터넷 요청을 받지 못하고, NAT 게이트웨이도 밖으로 나가지 못합니다.'},
        {id:'lb', x:250, y:180, w:200, h:42, icon:'lb', t:'Application LB', s:'퍼블릭 서브넷 a·c에 배치', kind:'reg', cfg:'lb'},
        {id:'sgalb', kind:'chip', x:458, y:192, t:'SG sg-alb ← 443 인터넷', cfg:'firewall', why:'보안 그룹은 ALB의 네트워크 인터페이스에 붙습니다. 인터넷에서 443만 받습니다.'},
        {id:'nat1', x:54, y:276, w:140, h:36, icon:'nat', t:'NAT 게이트웨이', s:'EIP · AZ a', cfg:'nat', failS:'AZ와 함께 중단'},
        {id:'rtpub1', kind:'chip', x:54, y:316, t:'rt-public: 0/0 → igw', cfg:'route'},
        {id:'nat2', x:506, y:276, w:140, h:36, icon:'nat', t:'NAT 게이트웨이', s:'EIP · AZ c', cfg:'nat'},
        {id:'rtpub2', kind:'chip', x:510, y:316, t:'rt-public: 0/0 → igw', cfg:'route'},
        {id:'vm1', x:204, y:378, w:126, h:42, icon:'vm', t:'EC2 × 2', s:'ASG · 템플릿', cfg:'vmgroup', why:'Auto Scaling 그룹 하나가 앱 서브넷 a·c를 함께 씁니다. AZ당 대수는 아래 시뮬레이터로 계산합니다.'},
        {id:'sgapp1', kind:'chip', x:54, y:372, t:'SG sg-app ← sg-alb:8080', cfg:'firewall', why:'출처를 IP가 아니라 sg-alb로 지정하므로 ALB에서 온 요청만 들어옵니다. 같은 서브넷의 다른 인스턴스라도 허용되지 않습니다.'},
        {id:'rtapp1', kind:'chip', x:54, y:398, t:'rt-app-a: 0/0 → nat-a', cfg:'route', why:'AZ a의 앱 서브넷은 AZ a의 NAT로 나갑니다. AZ c와 테이블을 나눠야 한쪽 AZ 장애가 다른 쪽 출구에 번지지 않습니다.'},
        {id:'vm2', x:370, y:378, w:126, h:42, icon:'vm', t:'EC2 × 2', s:'ASG · 템플릿', cfg:'vmgroup'},
        {id:'sgapp2', kind:'chip', x:504, y:372, t:'SG sg-app ← sg-alb:8080', cfg:'firewall'},
        {id:'rtapp2', kind:'chip', x:504, y:398, t:'rt-app-c: 0/0 → nat-c', cfg:'route'},
        {id:'db1', x:204, y:488, w:126, h:46, icon:'db', t:'RDS MySQL', s:'Primary · Multi-AZ', failS:'중단', cfg:'dbha'},
        {id:'sgdb1', kind:'chip', x:54, y:502, t:'SG sg-db ← sg-app:3306', cfg:'firewall'},
        {id:'db2', x:370, y:488, w:126, h:46, icon:'db', t:'RDS MySQL', s:'Standby', failS:'Primary로 승격', kind:'alt', cfg:'dbha'},
        {id:'sgdb2', kind:'chip', x:504, y:502, t:'SG sg-db ← sg-app:3306', cfg:'firewall'},
        {id:'obj', x:26, y:598, w:152, h:44, icon:'obj', t:'S3', s:'엔드포인트로 접근', kind:'alt', cfg:'bucket'},
        {id:'secret', x:192, y:598, w:152, h:44, icon:'secret', t:'Secrets Manager', s:'DB 암호 관리', kind:'alt'},
        {id:'mon', x:358, y:598, w:152, h:44, icon:'mon', t:'CloudWatch', s:'지표·로그·경보', kind:'alt'},
        {id:'admin', x:524, y:598, w:150, h:44, icon:'bastion', t:'Session Manager', s:'22번 포트 없이 접속', kind:'alt', cfg:'admin'}
      ],
      edges: [
        {a:'users', b:'dns'}, {a:'users', b:'edge'},
        {a:'edge', b:'igw', label:'HTTPS', lx:22},
        {a:'igw', b:'lb'},
        {a:'lb', b:'vm1'}, {a:'lb', b:'vm2', fail:'hide'}, {a:'lb', b:'vm2', fail:'show'},
        {a:'vm1', b:'db1'}, {a:'vm2', b:'db1', fail:'hide'}, {a:'vm2', b:'db2', fail:'show'},
        {a:'db1', b:'db2', dash:'both', label:'동기 복제', ly:34}
      ],
      notes: [
        {x:350, y:590, t:'앱 서브넷에는 인터넷 게이트웨이 경로가 없음 · 외부 API 호출은 같은 AZ의 NAT → IGW', anchor:'middle'}
      ]
    },

    gcp: { w: 700, h: 610, aria: 'GCP 3티어 도면: 전역 VPC, 리전 서브넷 하나가 세 영역에 걸침, VPC 단위 방화벽 규칙, 자동 생성된 기본 인터넷 게이트웨이, Cloud NAT, Google 관리 VPC의 Cloud SQL',
      frames: [
        {id:'vpc', kind:'net', x:14, y:120, w:672, h:408, label:'VPC 네트워크 vpc-shop · 전역 · 네트워크에는 IP 대역 없음', cfg:'vpc',
          why:'VPC 하나가 모든 리전에 걸칩니다. 나중에 다른 리전에 서브넷을 추가해도 같은 네트워크와 같은 방화벽 규칙을 씁니다.'},
        {id:'region', kind:'region', x:26, y:178, w:648, h:338, label:'asia-northeast3 리전'},
        {id:'sub', kind:'plain', x:38, y:208, w:624, h:170, label:'subnet-app 10.0.10.0/24 · 리전 전체 (모든 영역)', cfg:'subnet',
          why:'영역마다 서브넷을 만들지 않습니다. 서브넷 하나에 세 영역의 VM이 모두 들어가고, 퍼블릭·프라이빗 구분도 서브넷이 아니라 VM의 외부 IP 유무로 정합니다.'},
        {id:'z1', kind:'zone', x:50, y:232, w:196, h:136, label:'asia-northeast3-a'},
        {id:'z2', kind:'zone', x:252, y:232, w:196, h:136, label:'-b'},
        {id:'z3', kind:'zone', x:454, y:232, w:196, h:136, label:'-c'},
        {id:'mig', kind:'group', x:58, y:256, w:584, h:84, label:'mig-app · 리전 MIG (영역 자동 분산)', cfg:'vmgroup',
          why:'영역을 나열만 하면 GCP가 VM을 고르게 나눠 배치하고, 한 영역이 비정상이면 다른 영역에 다시 만듭니다.'},
        {id:'psa', kind:'onprem', x:306, y:390, w:356, h:114, label:'Google 관리 VPC · 비공개 서비스 액세스로 피어링', cfg:'dbha',
          why:'Cloud SQL은 우리 VPC가 아니라 Google이 관리하는 VPC에 만들어지고, 할당한 IP 대역을 통해 피어링으로 연결됩니다.'}
      ],
      nodes: [
        {id:'users', x:290, y:6, w:120, h:32, icon:'users', t:'사용자'},
        {id:'dns', x:40, y:54, w:180, h:42, icon:'dns', t:'DNS', s:'Cloud DNS · A 레코드', kind:'alt', cfg:'dns'},
        {id:'lb', x:240, y:50, w:300, h:48, icon:'lb', t:'전역 외부 Application LB', s:'VPC 밖 · Anycast IP · Cloud Armor', kind:'reg', cfg:'lb',
          why:'GCP의 외부 Application LB는 VPC 안에 들어가지 않는 전역 리소스입니다. 그래서 서브넷을 준비할 필요가 없지만, 헬스체크 대역을 방화벽에서 열어 줘야 합니다.'},
        {id:'igw', x:470, y:102, w:204, h:36, icon:'net', t:'기본 인터넷 게이트웨이', s:'0.0.0.0/0 경로 자동 생성', kind:'ghost', cfg:'igw',
          why:'VPC를 만들 때 기본 경로가 함께 생기므로 AWS처럼 게이트웨이를 만들고 연결하는 단계가 없습니다. 외부 IP 없는 VM은 Cloud NAT가 이 경로로 내보냅니다.'},
        {id:'fw1', kind:'chip', x:30, y:146, t:'방화벽 allow-lb-health → sa-app:8080', cfg:'firewall',
          why:'규칙은 VPC에 만들고 대상만 서비스 계정 sa-app으로 고릅니다. 출처는 LB 헬스체크 대역 35.191.0.0/16, 130.211.0.0/22. 이 규칙이 없으면 백엔드가 모두 비정상으로 잡힙니다.'},
        {id:'fw2', kind:'chip', x:270, y:146, t:'방화벽 allow-iap-ssh → sa-app:22', cfg:'firewall', why:'관리자 접속은 IAP 대역 35.235.240.0/20에서만 받습니다.'},
        {id:'fw3', kind:'chip', x:490, y:146, t:'묵시적: 인그레스 전부 거부', cfg:'firewall', why:'우선순위 65535의 묵시적 규칙입니다. 지울 수 없고, 허용 규칙을 더 높은 우선순위로 얹습니다.'},
        {id:'vm1', x:70, y:286, w:160, h:44, icon:'vm', t:'VM', s:'외부 IP 없음 · sa-app', cfg:'vmgroup'},
        {id:'vm2', x:272, y:286, w:160, h:44, icon:'vm', t:'VM', s:'외부 IP 없음 · sa-app', cfg:'vmgroup'},
        {id:'vm3', x:474, y:286, w:160, h:44, icon:'vm', t:'VM', s:'외부 IP 없음 · sa-app', cfg:'vmgroup'},
        {id:'pga', kind:'chip', x:476, y:346, t:'비공개 Google 액세스 켬', cfg:'privlink', why:'서브넷 설정 하나로 외부 IP 없는 VM이 Cloud Storage, Secret Manager 같은 Google API에 닿습니다.'},
        {id:'nat', x:38, y:396, w:250, h:44, icon:'nat', t:'Cloud NAT', s:'Cloud Router에 붙음 · 리전 범위', kind:'reg', cfg:'nat',
          why:'영역마다 둘 필요가 없는 리전 관리형 서비스입니다. 라우팅 테이블에 경로를 넣는 단계도 없습니다.'},
        {id:'natnote', kind:'chip', x:38, y:448, t:'경로 설정 없음 · 대상 서브넷만 지정', cfg:'route'},
        {id:'db1', x:318, y:420, w:160, h:44, icon:'db', t:'Cloud SQL Primary', s:'영역 a · 비공개 IP', failS:'중단', cfg:'dbha'},
        {id:'db2', x:490, y:420, w:160, h:44, icon:'db', t:'Cloud SQL Standby', s:'영역 b · HA', failS:'Primary로 승격', kind:'alt', cfg:'dbha'},
        {id:'peer', kind:'chip', x:318, y:476, t:'할당 대역 10.100.0.0/20 · 피어링', cfg:'dbha'},
        {id:'obj', x:26, y:548, w:152, h:44, icon:'obj', t:'Cloud Storage', s:'균일 액세스', kind:'alt', cfg:'bucket'},
        {id:'secret', x:192, y:548, w:152, h:44, icon:'secret', t:'Secret Manager', s:'DB 암호 관리', kind:'alt'},
        {id:'mon', x:358, y:548, w:152, h:44, icon:'mon', t:'Cloud Monitoring', s:'지표·로그·경보', kind:'alt'},
        {id:'admin', x:524, y:548, w:150, h:44, icon:'bastion', t:'IAP TCP 전달', s:'IAM으로 SSH 허용', kind:'alt', cfg:'admin'}
      ],
      edges: [
        {a:'users', b:'dns'}, {a:'users', b:'lb'},
        {a:'lb', b:'vm1', fail:'hide'}, {a:'lb', b:'vm2'}, {a:'lb', b:'vm3'},
        {a:'vm1', b:'db1', fail:'hide'}, {a:'vm2', b:'db1', fail:'hide'}, {a:'vm3', b:'db1', fail:'hide'}, {a:'vm2', b:'db2', fail:'show'}, {a:'vm3', b:'db2', fail:'show'},
        {a:'db1', b:'db2', dash:'both', label:'동기 복제', ly:34}
      ],
      notes: [
        {x:350, y:604, t:'프로젝트 단위 서비스 (VPC 밖) · 외부 IP 없는 VM은 비공개 Google 액세스로 접근', anchor:'middle'}
      ]
    },

    azure: { w: 700, h: 630, aria: 'Azure 3티어 도면: VNet 안에 영역 없는 서브넷 세 개, 서브넷마다 NSG, Application Gateway 전용 서브넷, 위임된 DB 서브넷, 서브넷에 연결된 NAT Gateway, 자동 시스템 경로',
      frames: [
        {id:'region', kind:'region', x:14, y:112, w:672, h:506, label:'Korea Central · 리소스 그룹 rg-shop'},
        {id:'vpc', kind:'net', x:26, y:146, w:648, h:378, label:'VNet 10.0.0.0/16 · 지역 범위', cfg:'vpc',
          why:'VNet은 리소스 그룹에 속합니다. 앱을 지우다가 네트워크까지 지우지 않도록 실무에서는 네트워크용 리소스 그룹을 따로 둡니다.'},
        {id:'agw', kind:'plain', x:38, y:176, w:624, h:62, label:'snet-agw 10.0.0.0/24 · AppGW 전용', cfg:'subnet',
          why:'Application Gateway v2는 다른 리소스와 함께 쓸 수 없는 전용 서브넷이 필요합니다. 자동 크기 조정으로 인스턴스가 늘어날 것을 고려해 /24로 잡습니다.'},
        {id:'app', kind:'plain', x:34, y:272, w:632, h:112, label:'snet-app 10.0.10.0/24 · 영역 구분 없음', cfg:'subnet',
          why:'서브넷에는 영역이 없습니다. 같은 서브넷 안의 VM이 Scale Set 설정에 따라 영역 1·2·3에 나뉘어 놓입니다.'},
        {id:'vmss', kind:'group', x:44, y:302, w:612, h:74, label:'vmss-app · 유연 오케스트레이션 · zones 1,2,3', cfg:'vmgroup'},
        {id:'dbs', kind:'plain', x:34, y:396, w:632, h:112, label:'snet-db 10.0.20.0/24 · 위임: MySQL Flexible Server', cfg:'subnet',
          why:'Microsoft.DBforMySQL/flexibleServers로 위임한 서브넷에는 다른 리소스를 둘 수 없습니다. 서버를 만든 뒤에는 네트워크 방식을 바꿀 수 없으므로 먼저 준비합니다.'},
        {id:'z1', kind:'zone', x:40, y:250, w:202, h:264, label:'영역 1'},
        {id:'z2', kind:'zone', x:248, y:250, w:202, h:264, label:'영역 2'},
        {id:'z3', kind:'zone', x:456, y:250, w:204, h:264, label:'영역 3'}
      ],
      nodes: [
        {id:'users', x:290, y:6, w:120, h:32, icon:'users', t:'사용자'},
        {id:'dns', x:70, y:54, w:200, h:42, icon:'dns', t:'DNS', s:'Azure DNS · 별칭 레코드', kind:'alt', cfg:'dns'},
        {id:'edge', x:410, y:54, w:220, h:42, icon:'cdn', t:'Front Door + WAF', s:'선택: 정적 캐시·차단', kind:'alt', cfg:'cdn'},
        {id:'igw', x:214, y:128, w:210, h:36, icon:'igw', t:'시스템 경로 → Internet', s:'모든 서브넷에 자동', kind:'ghost', cfg:'igw',
          why:'라우팅 테이블을 하나도 만들지 않아도 서브넷마다 0.0.0.0/0 → Internet 경로가 있습니다. 인바운드는 AppGW의 공인 IP로, 아웃바운드는 서브넷에 연결한 NAT Gateway로 명시합니다.'},
        {id:'lb', x:270, y:190, w:236, h:42, icon:'lb', t:'Application Gateway v2', s:'공인 IP · 영역 1·2·3 · WAF_v2', kind:'reg', cfg:'lb'},
        {id:'nsgagw', kind:'chip', x:514, y:203, t:'NSG nsg-agw (서브넷)', cfg:'firewall',
          why:'v2 서브넷의 NSG는 GatewayManager 서비스 태그의 65200-65535 인바운드를 허용해야 합니다. 빠뜨리면 게이트웨이가 정상 동작하지 않습니다.'},
        {id:'nsgapp', kind:'chip', x:338, y:280, t:'NSG nsg-app ← snet-agw:8080', cfg:'firewall',
          why:'NSG를 서브넷에 붙였으므로 이 서브넷의 모든 VM NIC에 같은 규칙이 적용됩니다. NIC에도 NSG를 붙이면 두 NSG를 모두 통과해야 합니다.'},
        {id:'natlink', kind:'chip', x:524, y:280, t:'NAT 연결: natgw-app', cfg:'nat'},
        {id:'vm1', x:54, y:326, w:176, h:42, icon:'vm', t:'VM', s:'영역 1 · 관리 ID', cfg:'vmgroup'},
        {id:'vm2', x:262, y:326, w:176, h:42, icon:'vm', t:'VM', s:'영역 2 · 관리 ID', cfg:'vmgroup'},
        {id:'vm3', x:470, y:326, w:176, h:42, icon:'vm', t:'VM', s:'영역 3 · 관리 ID', cfg:'vmgroup'},
        {id:'nsgdb', kind:'chip', x:470, y:404, t:'NSG nsg-db ← snet-app:3306', cfg:'firewall'},
        {id:'db1', x:54, y:440, w:176, h:46, icon:'db', t:'MySQL Flexible Server', s:'Primary · 영역 1', failS:'중단', cfg:'dbha'},
        {id:'db2', x:262, y:440, w:176, h:46, icon:'db', t:'MySQL Flexible Server', s:'Standby · 영역 2', failS:'Primary로 승격', kind:'alt', cfg:'dbha'},
        {id:'pdns', kind:'chip', x:470, y:456, t:'비공개 DNS 영역 · VNet 연결', cfg:'dbha'},
        {id:'nat', x:26, y:540, w:200, h:44, icon:'nat', t:'NAT Gateway', s:'공인 IP · snet-app에 연결', cfg:'nat',
          why:'NAT Gateway는 서브넷 안에 들어가는 리소스가 아니라 서브넷에 연결하는 리소스입니다. 연결하면 경로를 넣지 않아도 그 서브넷의 아웃바운드가 NAT로 나갑니다.', failS:'영역 설정 확인 필요'},
        {id:'obj', x:238, y:540, w:140, h:44, icon:'obj', t:'Blob Storage', s:'ZRS · 비공개', kind:'alt', cfg:'bucket'},
        {id:'secret', x:388, y:540, w:140, h:44, icon:'secret', t:'Key Vault', s:'DB 암호 관리', kind:'alt'},
        {id:'mon', x:538, y:540, w:136, h:44, icon:'mon', t:'Azure Monitor', s:'지표·로그·경보', kind:'alt'}
      ],
      edges: [
        {a:'users', b:'dns'}, {a:'users', b:'edge'},
        {a:'edge', b:'lb', label:'HTTPS', lx:24},
        {a:'lb', b:'vm1', fail:'hide'}, {a:'lb', b:'vm2'}, {a:'lb', b:'vm3'},
        {a:'vm1', b:'db1', fail:'hide'}, {a:'vm2', b:'db1', fail:'hide'}, {a:'vm2', b:'db2', fail:'show'}, {a:'vm3', b:'db2', fail:'show'},
        {a:'db1', b:'db2', dash:'both', label:'동기 복제', ly:34}
      ],
      notes: [
        {x:350, y:604, t:'NAT Gateway·공인 IP·Blob·Key Vault는 서브넷 밖 리소스 · 서브넷에 연결하거나 Private Endpoint로 들임', anchor:'middle'}
      ]
    }
  },

  fail: {
    button: '첫 번째 영역 장애', restore: '영역 복구', zoneLabel: '영역 장애',
    title: '첫 번째 영역이 통째로 사라질 때',
    zones: ['z1'], down: ['nat1','vm1','db1'], promote: ['db2'],
    normal: {
      aws: ['요청: 사용자 → Route 53 → (CloudFront) → 인터넷 게이트웨이 → ALB(sg-alb) → 앱 EC2(sg-app) → RDS Primary(sg-db)',
            '외부 API: 앱 EC2 → rt-app-a/c → 같은 AZ의 NAT 게이트웨이 → rt-public → 인터넷 게이트웨이',
            'DB는 다른 AZ의 Standby로 동기 복제됩니다. Standby는 읽기 요청을 받지 않습니다.'],
      gcp: ['요청: 사용자 → Cloud DNS → 전역 외부 Application LB → (방화벽 allow-lb-health 통과) → MIG의 VM → Cloud SQL Primary',
            '외부 API: VM(외부 IP 없음) → Cloud NAT → 기본 인터넷 게이트웨이. 라우팅 테이블 설정은 하지 않았습니다.',
            'Google API: VM → 비공개 Google 액세스 → Cloud Storage·Secret Manager'],
      azure: ['요청: 사용자 → Azure DNS → (Front Door) → AppGW 공인 IP → snet-agw(nsg-agw) → snet-app(nsg-app)의 VM → snet-db(nsg-db)의 MySQL Primary',
              '외부 API: VM → snet-app에 연결된 NAT Gateway → 인터넷. 라우팅 테이블은 만들지 않았습니다.',
              'DB 이름은 VNet에 연결한 비공개 DNS 영역이 사설 IP로 풀어 줍니다.']
    },
    effects: {
      aws: [
        ['good','ALB가 헬스체크로 AZ a의 대상을 빼고 AZ c로만 보냅니다. ALB 자체는 두 AZ 서브넷에 걸쳐 있어 계속 동작합니다.'],
        ['good','인터넷 게이트웨이는 AZ가 아니라 VPC에 붙은 리소스라 영향을 받지 않습니다.'],
        ['good','RDS Multi-AZ가 Standby를 승격합니다(보통 1~2분). 엔드포인트 DNS 이름이 그대로라 앱은 재연결만 하면 됩니다.'],
        ['warn','AZ a의 NAT 게이트웨이도 함께 사라집니다. rt-app-c가 nat-c를 가리키고 있으므로 AZ c의 외부 호출은 유지됩니다. 라우팅 테이블을 하나로 합쳐 nat-a만 보게 했다면 AZ c도 외부 호출이 끊깁니다.'],
        ['good','Auto Scaling 그룹이 모자란 인스턴스를 AZ c에 새로 띄웁니다. 뜨는 몇 분 동안은 남은 대수로 버텨야 합니다.']
      ],
      gcp: [
        ['good','리전 MIG가 영역 a의 VM을 비정상으로 판단하고 남은 영역 b·c에 다시 만듭니다.'],
        ['good','전역 LB는 정상 백엔드로만 요청을 보냅니다.'],
        ['good','Cloud SQL HA가 영역 b의 대기 인스턴스로 장애조치합니다. 비공개 IP가 유지됩니다.'],
        ['good','Cloud NAT와 기본 인터넷 게이트웨이는 특정 영역에 묶인 장비가 아니라 영향을 받지 않습니다. 서브넷도 리전 범위라 다시 만들 것이 없습니다.']
      ],
      azure: [
        ['good','영역 1·2·3에 배포한 Application Gateway v2는 남은 영역에서 계속 요청을 받습니다.'],
        ['good','VM Scale Set이 남은 영역의 인스턴스로 버티고, 자동 크기 조정 규칙에 따라 늘립니다.'],
        ['good','Flexible Server 영역 중복 HA가 영역 2의 대기 서버로 장애조치합니다. 서버 이름(FQDN)은 그대로입니다.'],
        ['warn','NAT Gateway를 영역 1에 고정했다면 snet-app의 아웃바운드가 끊길 수 있습니다. 사용하는 SKU의 영역 동작을 확인하고 배치를 정하세요.']
      ]
    }
  },

  scope: ['vpc','subnet','igw','route','firewall','nat','lb','vmgroup','dbha','admin'],

  build: {
    aws: [
      {t:'VPC 만들기', d:'10.0.0.0/16, DNS 확인·호스트 이름 켜기', cfg:'vpc', nodes:['vpc']},
      {t:'서브넷 6개', d:'AZ 2개 × 퍼블릭·앱·DB. AZ를 하나씩 지정', cfg:'subnet', nodes:['pub1','pub2','app1','app2','dbs1','dbs2']},
      {t:'인터넷 게이트웨이 생성·연결', d:'만든 뒤 VPC에 attach', cfg:'igw', nodes:['igw']},
      {t:'퍼블릭 라우팅 테이블', d:'0.0.0.0/0 → igw, 퍼블릭 서브넷 2개 연결', cfg:'route', nodes:['rtpub1','rtpub2']},
      {t:'EIP + NAT 게이트웨이 × 2', d:'AZ마다 퍼블릭 서브넷에 하나씩', cfg:'nat', nodes:['nat1','nat2']},
      {t:'앱 라우팅 테이블 AZ별', d:'rt-app-a → nat-a, rt-app-c → nat-c', cfg:'route', nodes:['rtapp1','rtapp2']},
      {t:'보안 그룹 3개', d:'sg-alb → sg-app → sg-db 순서로 참조', cfg:'firewall', nodes:['sgalb','sgapp1','sgapp2','sgdb1','sgdb2']},
      {t:'DB 서브넷 그룹 + RDS Multi-AZ', d:'퍼블릭 액세스 끔, 암호는 Secrets Manager', cfg:'dbha', nodes:['db1','db2','dbs1','dbs2']},
      {t:'시작 템플릿 + Auto Scaling 그룹', d:'인스턴스 프로파일, IMDSv2, 앱 서브넷 a·c', cfg:'vmgroup', nodes:['vm1','vm2']},
      {t:'ALB + 대상 그룹 + 리스너', d:'ACM 인증서, 헬스체크 /healthz', cfg:'lb', nodes:['lb','sgalb']},
      {t:'Route 53 별칭 레코드', d:'shop.example.com → ALB(또는 CloudFront)', cfg:'dns', nodes:['dns']},
      {t:'Session Manager 접속', d:'역할 정책 + 인터페이스 엔드포인트, 22번 포트 닫기', cfg:'admin', nodes:['admin']}
    ],
    gcp: [
      {t:'VPC 네트워크 (커스텀 모드)', d:'IP 대역 없이 생성', cfg:'vpc', nodes:['vpc']},
      {t:'인터넷 경로 확인', d:'기본 경로가 이미 있음. 만들 것 없음', cfg:'igw', nodes:['igw'], auto:true},
      {t:'서브넷 1개 (리전)', d:'10.0.10.0/24, 비공개 Google 액세스 켜기', cfg:'subnet', nodes:['sub','pga']},
      {t:'방화벽 규칙', d:'헬스체크·IAP 대역 허용. VPC에 만들고 대상은 서비스 계정', cfg:'firewall', nodes:['fw1','fw2','fw3']},
      {t:'Cloud Router + Cloud NAT', d:'리전에 하나. 라우팅 테이블 작업 없음', cfg:'nat', nodes:['nat','natnote']},
      {t:'비공개 서비스 액세스 + Cloud SQL HA', d:'대역 할당 → 피어링 → 리전 가용성, 비공개 IP만', cfg:'dbha', nodes:['psa','db1','db2','peer']},
      {t:'서비스 계정 + 템플릿 + 리전 MIG', d:'외부 IP 없음, 이름 있는 포트, 오토스케일러', cfg:'vmgroup', nodes:['mig','vm1','vm2','vm3']},
      {t:'전역 외부 Application LB', d:'헬스체크 → 백엔드 서비스 → URL 맵 → 인증서 → 프록시 → 전역 IP → 전달 규칙', cfg:'lb', nodes:['lb']},
      {t:'Cloud DNS A 레코드', d:'LB의 전역 IP', cfg:'dns', nodes:['dns']},
      {t:'IAP TCP 전달', d:'IAP 역할과 OS Login. 방화벽은 4단계에서 열어 둠', cfg:'admin', nodes:['admin','fw2']}
    ],
    azure: [
      {t:'리소스 그룹', d:'네트워크와 앱을 나눠 rg-shop-network, rg-shop-app', nodes:['region']},
      {t:'VNet 만들기', d:'주소 공간 10.0.0.0/16', cfg:'vpc', nodes:['vpc']},
      {t:'인터넷 경로 확인', d:'시스템 경로가 이미 있음. 라우팅 테이블 만들지 않음', cfg:'igw', nodes:['igw'], auto:true},
      {t:'서브넷 3개', d:'AppGW 전용, 앱, DB(위임). 영역은 고르지 않음', cfg:'subnet', nodes:['agw','app','dbs']},
      {t:'NSG 3개 + 서브넷 연결', d:'nsg-agw는 GatewayManager 65200-65535 허용', cfg:'firewall', nodes:['nsgagw','nsgapp','nsgdb']},
      {t:'공인 IP + NAT Gateway', d:'snet-app에 연결하면 끝', cfg:'nat', nodes:['nat','natlink']},
      {t:'비공개 DNS 영역 + MySQL Flexible Server', d:'VNet 통합(생성 후 변경 불가), 영역 중복 HA', cfg:'dbha', nodes:['db1','db2','pdns','dbs']},
      {t:'VM Scale Set (영역 1·2·3)', d:'유연 오케스트레이션, 관리 ID, 자동 크기 조정', cfg:'vmgroup', nodes:['vmss','vm1','vm2','vm3']},
      {t:'공인 IP + Application Gateway v2', d:'수신기·백엔드 풀·설정·규칙을 한 리소스에', cfg:'lb', nodes:['lb','agw']},
      {t:'Azure DNS 별칭 레코드', d:'AppGW 공인 IP(또는 Front Door)', cfg:'dns', nodes:['dns']},
      {t:'Azure Bastion', d:'AzureBastionSubnet /26 추가, VM NSG에 22 허용', cfg:'admin'}
    ]
  },

  map: ['seoul-region','network','subnet','internet-gateway','route-table','firewall','nat','dns','cdn','l7-lb','vm-autoscale','mysql-ha','object-storage','secrets','monitoring','admin-access'],

  decisions: [
    {t:'인터넷 출입구를 직접 만드는가',
     p:'세 클라우드 모두 VM이 인터넷과 통신하려면 경로가 있어야 합니다. 차이는 그 경로를 누가 만드느냐입니다.',
     aws:'인터넷 게이트웨이를 만들어 VPC에 연결하고, 라우팅 테이블에 0.0.0.0/0 → igw를 넣고, 그 테이블을 퍼블릭 서브넷에 연결하는 세 단계가 필요합니다. 하나라도 빠지면 퍼블릭 IP가 있어도 나가지 못합니다.',
     gcp:'VPC를 만들면 0.0.0.0/0 → default-internet-gateway 경로가 자동으로 생깁니다. 별도 리소스도 연결도 없습니다. 외부 IP 없는 VM은 Cloud NAT가 이 경로로 내보냅니다.',
     azure:'모든 서브넷에 0.0.0.0/0 → Internet 시스템 경로가 있습니다. 다만 인바운드는 공인 IP·LB로만, 아웃바운드는 NAT Gateway 같은 명시적 방법으로 설계하는 것이 원칙입니다.',
     so:'AWS 설계를 옮길 때 GCP·Azure에서 "인터넷 게이트웨이 만들기" 단계를 찾을 필요는 없습니다. 반대로 GCP·Azure에서 온 사람은 AWS에서 IGW와 라우팅 테이블 연결을 빠뜨리기 쉽습니다.'},
    {t:'방화벽 규칙은 어디에 붙는가',
     p:'같은 "앱 서버는 LB에서 온 8080만 받는다"는 규칙이라도 규칙을 만드는 위치와 적용 대상이 다릅니다.',
     aws:'보안 그룹을 만들어 ALB·EC2·RDS의 네트워크 인터페이스에 붙입니다. 출처로 다른 보안 그룹(sg-alb)을 지정할 수 있어 IP를 몰라도 됩니다. 서브넷 단위 차단이 필요하면 NACL을 추가합니다.',
     gcp:'규칙은 VPC 네트워크에 만듭니다. 어느 VM에 적용할지는 대상(네트워크 태그 또는 서비스 계정)으로 고릅니다. 서브넷이나 VM에 붙이는 단계가 없습니다.',
     azure:'NSG를 만들어 서브넷이나 NIC에 연결합니다. 보통 서브넷에 붙이고, 같은 역할의 VM끼리 묶을 때는 애플리케이션 보안 그룹(ASG)을 출처·대상으로 씁니다.',
     so:'AWS·Azure는 "규칙 묶음을 리소스(또는 서브넷)에 붙인다", GCP는 "네트워크에 규칙을 만들고 대상을 고른다"입니다. GCP에서는 LB 헬스체크 대역을, Azure AppGW v2에서는 GatewayManager 포트를 따로 열어야 한다는 점도 함께 챙깁니다.'},
    {t:'서브넷을 어디에 걸치는가',
     p:'영역 장애를 견디려면 앱 서버가 여러 영역에 있어야 합니다. 그 영역 분산을 네트워크에서 하느냐, 인스턴스 그룹에서 하느냐가 다릅니다.',
     aws:'서브넷 하나가 AZ 하나에 묶입니다. AZ 수 × 계층 수만큼 서브넷과 CIDR, 라우팅 테이블 연결을 계획해야 합니다.',
     gcp:'서브넷이 리전 전체에 걸칩니다. 영역 분산은 리전 MIG 설정에서 정하고, 퍼블릭·프라이빗 구분은 VM 외부 IP로 합니다.',
     azure:'서브넷에 영역 개념이 없습니다. 대신 AppGW 전용, DB 위임처럼 용도별 서브넷을 나눕니다. 영역 분산은 VM Scale Set의 zones 설정에서 정합니다.',
     so:'같은 3티어인데 AWS는 서브넷 6개, GCP는 1개, Azure는 3개입니다. AWS 설계를 그대로 옮기면 GCP·Azure에서는 불필요하게 서브넷이 늘어납니다.'},
    {t:'NAT의 고가용성은 누가 책임지나',
     p:'앱 서버는 인터넷에서 직접 닿지 않으므로 결제사 API 같은 외부 호출은 NAT를 거칩니다. NAT가 멈추면 사이트는 열려도 결제가 실패합니다.',
     aws:'NAT 게이트웨이는 AZ 리소스입니다. AZ마다 하나씩 두고, AZ별 앱 라우팅 테이블이 같은 AZ의 NAT를 가리키게 합니다.',
     gcp:'Cloud NAT는 Cloud Router에 붙는 리전 관리형 서비스라 영역 배치를 신경 쓰지 않아도 되고, 경로 설정도 없습니다.',
     azure:'NAT Gateway를 서브넷에 연결하면 끝이지만, SKU와 영역 설정에 따라 영역 장애 때 동작이 달라 배치를 확인해야 합니다.',
     so:'AWS에서 NAT 게이트웨이를 하나만 두면 비용은 아끼지만 그 AZ 장애 때 다른 AZ의 외부 호출까지 끊기고 AZ 간 전송 요금도 붙습니다.'},
    {t:'DB는 우리 네트워크 안에 있는가',
     p:'관리형 DB도 접속 경로는 사설 IP입니다. 하지만 DB가 놓이는 위치가 달라 접근 통제 방법이 다릅니다.',
     aws:'RDS가 우리 VPC의 DB 서브넷에 네트워크 인터페이스로 들어옵니다. 보안 그룹 sg-db로 통제합니다.',
     gcp:'Cloud SQL은 Google 관리 VPC에 있고 비공개 서비스 액세스(피어링)로 연결됩니다. 프로젝트·네트워크당 한 번 대역을 할당하고 피어링을 만들어 둬야 합니다.',
     azure:'Flexible Server가 위임된 서브넷 안에 들어오고, 비공개 DNS 영역이 이름을 풀어 줍니다. 서브넷의 NSG로 통제합니다.',
     so:'GCP에서는 DB 앞에 VPC 방화벽 규칙을 둘 수 없으므로 IAM 데이터베이스 인증이나 Cloud SQL 커넥터로 접근을 좁힙니다.'},
    {t:'로드밸런서는 리전인가 글로벌인가',
     p:'지금은 서울 리전 하나지만, 나중에 다른 리전을 추가할 가능성이 있다면 진입점의 범위가 중요해집니다.',
     aws:'ALB는 리전 리소스이고 퍼블릭 서브넷에 들어갑니다. 여러 리전을 묶으려면 CloudFront나 Global Accelerator, Route 53을 앞에 둡니다.',
     gcp:'외부 Application LB는 VPC 밖의 전역 리소스입니다. Anycast IP 하나로 여러 리전 백엔드를 받을 수 있습니다.',
     azure:'Application Gateway는 지역 리소스이고 전용 서브넷이 필요합니다. 글로벌 진입점은 Front Door가 맡습니다.',
     so:'GCP는 리전 확장 시 진입점을 바꿀 필요가 적지만 LB를 구성하는 리소스가 가장 많습니다. AWS·Azure는 처음부터 CDN 계층을 진입점으로 두면 나중이 편합니다.'}
  ],

  sims: [{type:'capacity'}, {type:'availability'}],
  iac: 'iac/scenario-01',

  checklist: [
    ['AWS: 퍼블릭 서브넷에 rt-public을 연결하지 않았다','인터넷 게이트웨이를 만들어도 서브넷이 기본 라우팅 테이블을 쓰면 ALB가 인터넷에서 닿지 않습니다.'],
    ['AWS: 앱 라우팅 테이블을 AZ마다 나누지 않았다','NAT 게이트웨이 하나에 모든 AZ가 의존해 그 AZ 장애 때 외부 호출이 모두 끊깁니다.'],
    ['GCP: LB 헬스체크 대역을 방화벽에서 열지 않았다','35.191.0.0/16, 130.211.0.0/22를 허용하지 않으면 묵시적 거부 규칙에 막혀 모든 백엔드가 비정상으로 잡힙니다.'],
    ['GCP: 방화벽 대상을 네트워크 태그로만 잡았다','VM을 수정할 수 있는 사람은 태그도 붙일 수 있습니다. 운영 규칙은 서비스 계정 대상으로 둡니다.'],
    ['Azure: AppGW 서브넷 NSG에서 GatewayManager 포트를 막았다','v2는 65200-65535 인바운드가 필요합니다. 막으면 게이트웨이 상태가 나빠집니다.'],
    ['Azure: DB 네트워크 방식을 나중에 바꾸려 한다','Flexible Server의 공용·비공개(VNet 통합) 선택은 생성 후 바꿀 수 없습니다. 위임 서브넷과 비공개 DNS 영역을 먼저 준비합니다.'],
    ['NAT를 영역 하나에만 둔다','그 영역이 죽으면 다른 영역의 외부 API 호출까지 끊깁니다.'],
    ['DB에 공인 IP나 퍼블릭 접근을 열어 둔다','관리 편의로 잠깐 열었다가 그대로 남는 경우가 가장 많습니다. 접근은 Session Manager·IAP·Bastion으로.'],
    ['헬스체크 경로가 DB까지 확인한다','DB 장애조치 몇 분 동안 모든 앱 서버가 비정상으로 빠져 사이트 전체가 내려갑니다. 헬스체크는 앱 자체 상태만 봅니다.'],
    ['오토스케일 최소값을 영역 수보다 작게 둔다','최소 1대면 그 1대가 있는 영역이 단일 장애점이 됩니다.'],
    ['DB 비밀번호를 코드나 환경 변수 파일에 넣는다','시크릿 관리 서비스에 두고, 인스턴스 권한(인스턴스 프로파일·서비스 계정·관리 ID)으로 읽게 합니다.'],
    ['장애조치를 한 번도 실제로 해 보지 않는다','세 클라우드 모두 수동 장애조치 기능이 있습니다. 운영 전에 한 번 돌려 보고 앱의 재연결 시간을 잽니다.']
  ],

  refs: [
    ['AWS: VPC 인터넷 게이트웨이','https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html'],
    ['AWS: 보안 그룹','https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html'],
    ['Google Cloud: VPC 경로','https://cloud.google.com/vpc/docs/routes'],
    ['Google Cloud: VPC 방화벽 규칙','https://cloud.google.com/firewall/docs/firewalls'],
    ['Azure: 가상 네트워크 트래픽 라우팅','https://learn.microsoft.com/azure/virtual-network/virtual-networks-udr-overview'],
    ['Azure: 네트워크 보안 그룹','https://learn.microsoft.com/azure/virtual-network/network-security-groups-overview']
  ],
  next: '시나리오 02 · 정적 사이트와 서버리스 API'
};
