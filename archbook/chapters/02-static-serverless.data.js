window.SCENARIO = {
  no: 2, level: 'basic', title: '정적 사이트와 서버리스 API',
  lede: '서버를 한 대도 띄우지 않고 웹 화면과 API를 운영하는 구성입니다. 요청이 없으면 비용이 거의 들지 않지만, 동시성 한도와 콜드 스타트, 같은 도메인 아래 경로를 나누는 방식이 클라우드마다 다릅니다.',
  region: {aws:'글로벌 엣지 + ap-northeast-2', gcp:'글로벌 LB + asia-northeast3', azure:'Front Door 글로벌 + Korea Central'},
  req: [
    {k:'트래픽', v:'월 50만 방문', s:'API 평균 50 RPS, 이벤트 때 500 RPS'},
    {k:'화면', v:'SPA (React 등)', s:'빌드 결과는 정적 파일'},
    {k:'기능', v:'회원 로그인 + 주문 조회', s:'사용자별 데이터는 NoSQL'},
    {k:'제약', v:'운영 1명, 고정비 최소', s:'서버 패치·용량 관리 없이'}
  ],
  intro: {
    arch: '정적 파일은 CDN이, API는 서버리스 함수가 맡습니다. <b>백엔드 API 장애</b>를 눌러 API가 멈춰도 사이트가 열리는지 확인해 보세요.'
  },
  diagram: {
    w: 680, h: 470,
    frames: [
      {id:'region', kind:'region', x:20, y:140, w:640, h:316, label:{aws:'서울 리전 · ap-northeast-2', gcp:'서울 리전 · asia-northeast3', azure:'서울 리전 · Korea Central'}},
      {id:'edgeband', kind:'band', x:20, y:62, w:640, h:60, label:{aws:'글로벌 엣지', gcp:'글로벌 진입점', azure:'글로벌 엣지'}}
    ],
    nodes: [
      {id:'users', x:280, y:8, w:120, h:34, icon:'users', t:'사용자'},
      {id:'dns', cfg:'dns', x:50, y:72, w:180, h:44, icon:'dns', t:'DNS', s:{aws:'Route 53', gcp:'Cloud DNS', azure:'Azure DNS'}, kind:'alt'},
      {id:'edge', cfg:{aws:'cdn', gcp:'lb', azure:'cdn'}, x:290, y:72, w:250, h:44, icon:'cdn', t:{aws:'CloudFront + WAF', gcp:'외부 Application LB', azure:'Front Door + WAF'}, s:{aws:'경로별 오리진 라우팅', gcp:'Cloud CDN · Cloud Armor', azure:'경로별 원본 그룹'}, kind:'reg'},
      {id:'static', cfg:'bucket', x:40, y:178, w:200, h:48, icon:'obj', t:'정적 파일', s:{aws:'S3 · OAC로 비공개', gcp:'Cloud Storage 백엔드 버킷', azure:'Storage 정적 웹사이트'}},
      {id:'api', cfg:{aws:'apigw', gcp:'lb', azure:'apigw'}, x:255, y:178, w:200, h:48, icon:{aws:'apigw', gcp:'lb', azure:'apigw'}, t:{aws:'API Gateway', gcp:'URL 맵 /api/*', azure:'API Management'}, s:{aws:'HTTP API · JWT 검증', gcp:'서버리스 NEG로 전달', azure:'Consumption · JWT 검증'}},
      {id:'secret', cfg:'secret', x:470, y:178, w:170, h:48, icon:'secret', t:'시크릿', s:{aws:'Secrets Manager', gcp:'Secret Manager', azure:'Key Vault'}, kind:'alt'},
      {id:'auth', x:40, y:290, w:200, h:48, icon:'auth', t:'회원 로그인', s:{aws:'Cognito 사용자 풀', gcp:'Identity Platform', azure:'Entra External ID'}},
      {id:'fn', cfg:'func', x:255, y:290, w:200, h:48, icon:{aws:'func', gcp:'run', azure:'func'}, t:{aws:'Lambda', gcp:'Cloud Run', azure:'Functions'}, s:{aws:'요청마다 실행 환경 1개', gcp:'인스턴스당 동시 80', azure:'Flex Consumption'}, failS:'배포 오류로 5xx'},
      {id:'nosql', cfg:'nosql', x:470, y:290, w:170, h:48, icon:'nosql', t:'주문 데이터', s:{aws:'DynamoDB', gcp:'Firestore', azure:'Cosmos DB'}},
      {id:'mon', x:255, y:392, w:200, h:44, icon:'mon', t:'로그·추적', s:{aws:'CloudWatch + X-Ray', gcp:'Cloud Logging · Trace', azure:'Application Insights'}, kind:'alt'}
    ],
    edges: [
      {a:'users', b:'dns'}, {a:'users', b:'edge'},
      {a:'edge', b:'static', label:'/*', lx:-6},
      {a:'edge', b:'api', label:'/api/*', lx:22},
      {a:'api', b:'fn'}, {a:'fn', b:'nosql'}, {a:'fn', b:'secret', dash:true},
      {a:'auth', b:'api', dash:true, label:'토큰 발급자', ly:-2},
      {a:'fn', b:'mon', dash:true}
    ]
  },
  fail: {
    button: '백엔드 API 장애', restore: '복구', title: 'API 함수가 오류를 낼 때 일어나는 일',
    down: ['fn'],
    normal: {
      aws: ['화면: 사용자 → CloudFront → S3 (캐시되어 대부분 엣지에서 응답)', 'API: 사용자 → CloudFront /api/* → API Gateway(JWT 검증) → Lambda → DynamoDB'],
      gcp: ['화면: 사용자 → 외부 Application LB → Cloud CDN → 백엔드 버킷', 'API: 사용자 → LB /api/* → 서버리스 NEG → Cloud Run → Firestore'],
      azure: ['화면: 사용자 → Front Door → Storage 정적 웹사이트', 'API: 사용자 → Front Door /api/* → API Management(JWT 검증) → Functions → Cosmos DB']
    },
    effects: {
      aws: [
        ['good','CloudFront 캐시와 S3 원본으로 화면은 그대로 열립니다.'],
        ['warn','API 호출은 5xx로 실패합니다. 프런트엔드가 오류 안내와 재시도를 보여 주도록 만들어 둬야 합니다.'],
        ['good','Lambda 별칭이 가리키는 버전을 이전 버전으로 돌리면 다시 배포하지 않고 바로 되돌릴 수 있습니다.'],
        ['warn','/api/* 동작에 캐시가 켜져 있으면 오류 응답이 캐시될 수 있습니다. API 경로는 캐시를 끕니다.']
      ],
      gcp: [
        ['good','Cloud CDN 캐시와 백엔드 버킷으로 화면은 그대로 열립니다.'],
        ['warn','/api/* 경로는 Cloud Run의 오류를 그대로 돌려줍니다.'],
        ['good','Cloud Run은 리비전별로 트래픽을 나누므로, 직전 리비전에 트래픽 100%를 주면 즉시 되돌아갑니다.'],
        ['good','API 백엔드 서비스의 CDN을 꺼 두었다면 오류 응답이 캐시되지 않습니다.']
      ],
      azure: [
        ['good','Front Door 캐시와 정적 웹사이트 원본으로 화면은 그대로 열립니다.'],
        ['warn','/api/* 요청은 오류가 납니다. 원본 그룹에 다른 원본이 없으면 Front Door가 넘길 곳이 없습니다.'],
        ['good','이전 배포 패키지를 다시 올리거나, 다른 리전의 대기 Function App을 같은 원본 그룹에 넣어 두면 넘어갈 수 있습니다.'],
        ['good','/api/* 경로 규칙에 캐시를 켜지 않았다면 오류 응답이 캐시되지 않습니다.']
      ]
    }
  },
  scope: ['cdn','bucket','apigw','func','nosql','secret','waf'],
  build: {
    aws: [
      {t:'S3 버킷 (비공개)', d:'퍼블릭 액세스 차단 유지, 빌드 결과 업로드', cfg:'bucket', nodes:['static']},
      {t:'DynamoDB 테이블', d:'PK·SK 설계, 온디맨드, PITR', cfg:'nosql', nodes:['nosql']},
      {t:'Secrets Manager 시크릿', d:'외부 API 키', cfg:'secret', nodes:['secret']},
      {t:'Lambda 함수 + 실행 역할', d:'테이블·시크릿 ARN으로 권한 한정', cfg:'func', nodes:['fn']},
      {t:'Cognito 사용자 풀', d:'앱 클라이언트, 발급자 URL 확인', nodes:['auth']},
      {t:'API Gateway HTTP API', d:'JWT 권한 부여자 → Lambda 통합', cfg:'apigw', nodes:['api']},
      {t:'ACM 인증서 (us-east-1)', d:'CloudFront용은 버지니아 북부에서 발급', cfg:'cdn'},
      {t:'CloudFront 배포', d:'S3(OAC) 기본 동작 + /api/* → API Gateway, API는 캐시 끔', cfg:'cdn', nodes:['edge']},
      {t:'WAF 웹 ACL (CLOUDFRONT 범위)', d:'관리형 규칙 + 속도 제한', cfg:'waf', nodes:['edge']},
      {t:'S3 버킷 정책', d:'이 배포의 OAC만 GetObject 허용', cfg:'bucket', nodes:['static']},
      {t:'Route 53 별칭 레코드', d:'도메인 → CloudFront', cfg:'dns', nodes:['dns']}
    ],
    gcp: [
      {t:'Cloud Storage 버킷', d:'균일 액세스, 공개 액세스 방지', cfg:'bucket', nodes:['static']},
      {t:'Firestore 데이터베이스', d:'네이티브 모드, 위치 고정', cfg:'nosql', nodes:['nosql']},
      {t:'Secret Manager 시크릿', d:'복제 위치 지정', cfg:'secret', nodes:['secret']},
      {t:'Cloud Run 서비스 + 서비스 계정', d:'인그레스: 내부 + Cloud Load Balancing', cfg:'func', nodes:['fn']},
      {t:'Identity Platform', d:'로그인 공급자 설정, 토큰은 앱에서 검증', nodes:['auth']},
      {t:'서버리스 NEG', d:'Cloud Run 서비스를 LB 백엔드로', cfg:'lb', nodes:['api']},
      {t:'백엔드 버킷 (Cloud CDN 켬) + 백엔드 서비스 (CDN 끔)', d:'정적은 캐시, API는 캐시 없음', cfg:'cdn', nodes:['static','api']},
      {t:'URL 맵 → 인증서 → 프록시 → 전역 IP → 전달 규칙', d:'/* 버킷, /api/* 서버리스 NEG', cfg:'lb', nodes:['edge','api']},
      {t:'Cloud Armor 정책', d:'API 백엔드 서비스에 연결', cfg:'waf', nodes:['edge']},
      {t:'Cloud DNS A 레코드', d:'LB 전역 IP', cfg:'dns', nodes:['dns']}
    ],
    azure: [
      {t:'스토리지 계정 + 정적 웹사이트', d:'$web 컨테이너에 빌드 결과', cfg:'bucket', nodes:['static']},
      {t:'Cosmos DB 계정 + 컨테이너', d:'파티션 키, 서버리스 또는 자동 크기 조정', cfg:'nosql', nodes:['nosql']},
      {t:'Key Vault', d:'외부 API 키, RBAC 권한 모델', cfg:'secret', nodes:['secret']},
      {t:'Function App (Flex Consumption)', d:'관리 ID로 Cosmos DB·Key Vault 접근', cfg:'func', nodes:['fn']},
      {t:'Entra External ID 테넌트', d:'앱 등록, 발급자 확인', nodes:['auth']},
      {t:'API Management (Consumption)', d:'validate-jwt 정책, 백엔드 = Function App', cfg:'apigw', nodes:['api']},
      {t:'Front Door 프로필 + 엔드포인트', d:'원본 그룹 2개: 정적 웹사이트, APIM', cfg:'cdn', nodes:['edge']},
      {t:'경로 2개', d:'/* 캐시 켬, /api/* 캐시 없음', cfg:'cdn', nodes:['edge','static','api']},
      {t:'WAF 정책 + 보안 정책', d:'Front Door에 연결', cfg:'waf', nodes:['edge']},
      {t:'Azure DNS 레코드', d:'사용자 지정 도메인 검증 후 연결', cfg:'dns', nodes:['dns']}
    ]
  },
  map: ['dns','cdn','waf','object-storage','api-gateway','serverless-compute','nosql','user-auth','secrets','monitoring'],
  decisions: [
    {t:'정적 파일과 API를 한 도메인에 묶는 방법',
     p:'CORS 설정과 쿠키 범위 문제를 피하려면 같은 도메인 아래에서 경로로 나누는 것이 편합니다.',
     aws:'CloudFront 배포 하나에 S3 오리진(기본 동작)과 API Gateway 오리진(/api/*)을 함께 둡니다. S3는 원본 액세스 제어(OAC)로 CloudFront만 읽게 합니다.',
     gcp:'외부 Application LB의 URL 맵에서 /*는 백엔드 버킷, /api/*는 Cloud Run 서버리스 NEG로 보냅니다. Cloud CDN은 백엔드마다 켜고 끕니다.',
     azure:'Front Door 경로 규칙으로 /*는 Storage 정적 웹사이트, /api/*는 API Management(또는 Function App) 원본 그룹으로 보냅니다.',
     so:'GCP에서는 CDN이 로드밸런서의 기능이라 LB가 반드시 필요하고, AWS·Azure에서는 CDN 서비스가 경로 라우팅까지 맡습니다. 어느 쪽이든 API 경로의 캐시는 꺼 둡니다.'},
    {t:'실행 환경 하나가 요청을 몇 개 받는가',
     p:'같은 트래픽이라도 이 차이 때문에 필요한 실행 환경 수와 DB 커넥션 수가 열 배 넘게 달라집니다.',
     aws:'Lambda 실행 환경 하나는 한 번에 요청 하나만 처리합니다. 동시 요청 수만큼 실행 환경이 늘고, 계정의 리전별 동시성 할당량에 묶입니다.',
     gcp:'Cloud Run 인스턴스 하나는 여러 요청을 동시에 받습니다(기본 80). I/O 대기가 많은 API라면 인스턴스가 훨씬 적게 필요합니다.',
     azure:'Flex Consumption 플랜은 인스턴스당 HTTP 동시 처리 수를 정할 수 있어, 인스턴스 하나가 여러 요청을 받습니다.',
     so:'Lambda에서 관계형 DB를 쓴다면 실행 환경 수만큼 커넥션이 생기므로 RDS Proxy 같은 커넥션 풀을 둡니다. 이 장이 NoSQL을 고른 이유이기도 합니다.'},
    {t:'콜드 스타트를 줄이는 방법',
     p:'요청이 뜸하면 실행 환경이 내려가고, 다음 요청은 새 환경이 시작될 때까지 기다립니다.',
     aws:'프로비저닝된 동시성으로 실행 환경을 미리 띄워 둡니다(상시 비용 발생). 패키지와 초기화 코드를 줄이는 것도 효과가 큽니다.',
     gcp:'최소 인스턴스 수를 1 이상으로 두면 항상 하나는 떠 있습니다.',
     azure:'Flex Consumption의 항상 준비(always ready) 인스턴스 수를 정하면 그만큼은 내려가지 않습니다.',
     so:'어느 방법이든 고정비가 생기므로 로그인·결제처럼 지연에 민감한 경로에만 씁니다.'},
    {t:'로그인 토큰을 어디서 검증하는가',
     p:'잘못된 요청을 함수까지 보내지 않고 앞에서 거르면 실행 비용과 공격 면이 함께 줄어듭니다.',
     aws:'API Gateway HTTP API의 JWT 권한 부여자가 Cognito 토큰을 검증해, 함수가 실행되기 전에 거절합니다.',
     gcp:'Identity Platform이 발급한 ID 토큰을 Cloud Run 코드에서 검증하거나 앞에 API Gateway를 둡니다. Cloud Run 자체의 IAM 인증은 서비스 간 호출용이라 최종 사용자 로그인과는 다릅니다.',
     azure:'API Management의 JWT 검증 정책으로 Entra External ID 토큰을 확인합니다. Functions의 기본 제공 인증은 플랜별 지원 여부를 확인하세요.',
     so:'게이트웨이에서 검증하면 함수 코드는 이미 검증된 사용자 정보만 다루면 됩니다.'}
  ],
  sims: [{type:'concurrency'}],
  iac: 'iac/scenario-02',
  checklist: [
    ['원본 버킷을 누구나 읽게 열어 둔다','CDN만 읽도록 원본 접근을 제한합니다. 공개 읽기가 필요한 구성이라면 그 버킷에는 공개해도 되는 빌드 결과만 둡니다.'],
    ['API 경로까지 캐시한다','로그인 사용자별 응답이 다른 사람에게 보일 수 있습니다. /api/* 는 캐시를 끕니다.'],
    ['SPA 경로 새로고침을 처리하지 않는다','/orders/12 를 새로고침하면 원본에 그런 파일이 없어 404가 납니다. index.html로 돌려주는 규칙을 둡니다.'],
    ['함수에서 관계형 DB에 직접 연결한다','동시 실행이 늘면 커넥션도 같이 늘어 DB가 먼저 한계에 닿습니다.'],
    ['함수 제한 시간을 게이트웨이보다 길게 둔다','클라이언트는 이미 끊겼는데 함수는 계속 돌며 비용과 부작용을 남깁니다.'],
    ['예산 경보와 속도 제한이 없다','봇 트래픽이나 무한 재시도로 요청형 과금이 급증할 수 있습니다. WAF 속도 제한과 예산 경보를 둡니다.'],
    ['배포할 때마다 전체 캐시를 무효화한다','파일 이름에 해시를 넣고 index.html만 짧게 캐시하면 무효화가 거의 필요 없습니다.']
  ],
  refs: [
    ['CloudFront에서 S3 원본 접근 제한', 'https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html'],
    ['Cloud Run 동시성', 'https://cloud.google.com/run/docs/about-concurrency'],
    ['Azure Functions Flex Consumption 플랜', 'https://learn.microsoft.com/azure/azure-functions/flex-consumption-plan']
  ],
  next: '시나리오 03 · dev·stg·prod 계정 구조'
};
