window.SCENARIO = {
  no: 5, level: 'intermediate', title: '이벤트 기반 주문 처리',
  lede: '주문 하나에 재고, 결제, 알림, 포인트 같은 후속 처리가 줄줄이 붙습니다. 이걸 한 API 안에서 순서대로 부르면 하나만 느려져도 주문 전체가 멈춥니다. 큐와 이벤트로 끊어 두면 주문 접수는 빠르게 끝나고, 후속 처리는 각자 속도로 따라옵니다.',
  region: {aws:'ap-northeast-2', gcp:'asia-northeast3', azure:'Korea Central'},
  req: [
    {k:'피크', v:'초당 주문 600건', s:'세일 시작 직후 15분'},
    {k:'응답', v:'주문 접수 300ms 이내', s:'후속 처리는 기다리지 않음'},
    {k:'후속 처리', v:'재고, 결제, 알림', s:'서로 독립적으로 실패·재시도'},
    {k:'정확성', v:'중복 처리 금지', s:'실패 메시지는 버리지 않고 보관'}
  ],
  intro: { arch: '주문 API는 저장만 하고 바로 응답합니다. 저장된 변경이 이벤트가 되어 소비자별 큐로 나뉩니다. <b>결제 처리 장애</b>를 눌러 다른 흐름이 영향을 받는지 보세요.' },
  diagram: {
    w: 680, h: 450,
    frames: [
      {id:'region', kind:'region', x:20, y:72, w:640, h:368, label:{aws:'서울 리전 · ap-northeast-2', gcp:'서울 리전 · asia-northeast3', azure:'서울 리전 · Korea Central'}}
    ],
    nodes: [
      {id:'users', x:30, y:16, w:110, h:36, icon:'users', t:'고객'},
      {id:'api', x:180, y:12, w:200, h:46, icon:{aws:'func', gcp:'run', azure:'func'}, t:'주문 접수 API', s:{aws:'Lambda', gcp:'Cloud Run', azure:'Functions'}},
      {id:'db', x:420, y:12, w:220, h:46, icon:'nosql', t:'주문 저장', s:{aws:'DynamoDB', gcp:'Firestore', azure:'Cosmos DB'}},
      {id:'bus', x:180, y:104, w:460, h:46, icon:{aws:'eventbus', gcp:'topic', azure:'topic'}, t:'주문 이벤트', s:{aws:'DynamoDB Streams → EventBridge Pipes → 이벤트 버스', gcp:'Firestore 변경 → Eventarc → Pub/Sub 토픽', azure:'Cosmos DB 변경 피드 → Functions → Service Bus 토픽'}, kind:'reg'},
      {id:'q1', x:40, y:194, w:190, h:44, icon:'queue', t:'재고 큐', s:{aws:'SQS 큐', gcp:'Pub/Sub 구독', azure:'Service Bus 구독'}},
      {id:'q2', x:245, y:194, w:190, h:44, icon:'queue', t:'결제 큐', s:{aws:'SQS 큐', gcp:'Pub/Sub 구독', azure:'Service Bus 구독'}, failS:'메시지 적체 중'},
      {id:'q3', x:450, y:194, w:190, h:44, icon:'queue', t:'알림 큐', s:{aws:'SQS 큐', gcp:'Pub/Sub 구독', azure:'Service Bus 구독'}},
      {id:'c1', x:40, y:282, w:190, h:44, icon:{aws:'func', gcp:'run', azure:'func'}, t:'재고 차감', s:'주문 ID로 멱등 처리'},
      {id:'c2', x:245, y:282, w:190, h:44, icon:'workflow', t:'결제 사가', s:{aws:'Step Functions', gcp:'Workflows', azure:'Durable Functions'}},
      {id:'c3', x:450, y:282, w:190, h:44, icon:{aws:'func', gcp:'run', azure:'func'}, t:'알림 발송', s:'외부 메시지 API 호출'},
      {id:'dlq', x:245, y:376, w:190, h:44, icon:'queue', t:'실패 보관 (DLQ)', s:{aws:'SQS DLQ', gcp:'데드 레터 토픽', azure:'구독별 DLQ (내장)'}, kind:'alt'},
      {id:'mon', x:450, y:376, w:190, h:44, icon:'mon', t:'큐 깊이 경보', s:{aws:'CloudWatch 경보', gcp:'Cloud Monitoring', azure:'Azure Monitor'}, kind:'alt'}
    ],
    edges: [
      {a:'users', b:'api'}, {a:'api', b:'db', label:'저장'},
      {a:'db', b:'bus', label:'변경 = 이벤트', lx:52, ly:4},
      {a:'bus', b:'q1'}, {a:'bus', b:'q2'}, {a:'bus', b:'q3'},
      {a:'q1', b:'c1'}, {a:'q2', b:'c2'}, {a:'q3', b:'c3'},
      {a:'c2', b:'dlq', dash:true, label:'재시도 초과'},
      {a:'q2', b:'mon', dash:true, fail:'show'}
    ]
  },
  fail: {
    button: '결제 처리 장애', restore: '복구', title: '결제 소비자가 멈췄을 때',
    down: ['c2'],
    normal: {
      aws: ['주문 API는 DynamoDB에 쓰고 바로 응답합니다.', 'DynamoDB Streams의 변경이 EventBridge Pipes를 거쳐 이벤트 버스로 가고, 규칙이 소비자별 SQS 큐로 나눕니다.', '소비자는 큐에서 꺼내 처리하고, 성공하면 메시지를 지웁니다.'],
      gcp: ['주문 API는 Firestore에 쓰고 바로 응답합니다.', 'Firestore 문서 변경을 Eventarc 트리거가 받아 Pub/Sub 토픽에 발행하고, 소비자마다 구독을 하나씩 둡니다.', '소비자는 메시지를 처리한 뒤 확인(ack)합니다.'],
      azure: ['주문 API는 Cosmos DB에 쓰고 바로 응답합니다.', 'Cosmos DB 변경 피드를 Functions 트리거가 읽어 Service Bus 토픽에 보내고, 소비자마다 구독을 하나씩 둡니다.', '소비자는 메시지를 잠금 상태로 받아 처리한 뒤 완료합니다.']
    },
    effects: {
      aws: [
        ['good','주문 접수와 재고·알림 흐름은 그대로입니다. 결제 큐에만 메시지가 쌓입니다.'],
        ['good','SQS 보존 기간(기본 4일, 최대 14일) 안에 복구하면 쌓인 메시지를 이어서 처리합니다.'],
        ['warn','처리를 시도하다 실패한 메시지는 maxReceiveCount를 넘으면 DLQ로 갑니다. 복구 후 DLQ 재드라이브로 원래 큐에 되돌립니다.'],
        ['warn','큐에서 가장 오래된 메시지 나이(ApproximateAgeOfOldestMessage)에 경보를 걸어 두지 않으면 장애를 늦게 압니다.']
      ],
      gcp: [
        ['good','주문 접수와 다른 구독은 영향이 없습니다. 결제 구독에만 확인되지 않은 메시지가 쌓입니다.'],
        ['good','구독의 메시지 보존 기간(기본 7일) 안에 복구하면 이어서 처리합니다.'],
        ['warn','최대 전송 시도 횟수를 넘긴 메시지는 데드 레터 토픽으로 갑니다. 데드 레터 토픽에도 구독을 만들어 둬야 메시지가 남습니다.'],
        ['warn','가장 오래된 미확인 메시지 나이 지표에 경보를 겁니다.']
      ],
      azure: [
        ['good','주문 접수와 다른 구독은 영향이 없습니다. 결제 구독에만 메시지가 쌓입니다.'],
        ['good','메시지 TTL 안에 복구하면 이어서 처리합니다.'],
        ['warn','최대 전송 횟수(기본 10)를 넘긴 메시지는 그 구독의 데드 레터 하위 큐로 자동으로 옮겨집니다.'],
        ['warn','활성 메시지 수와 데드 레터 메시지 수 지표에 경보를 겁니다.']
      ]
    }
  },
  map: ['change-feed','event-bus','pubsub-topic','message-queue','workflow','serverless-compute','nosql','monitoring'],
  decisions: [
    {t:'DB 저장과 이벤트 발행을 함께 성공시키는 법',
     p:'코드에서 DB에 쓰고 이어서 이벤트를 발행하면, 둘 중 하나만 성공하는 순간이 반드시 생깁니다.',
     aws:'DynamoDB Streams가 변경을 순서대로 내보내고, EventBridge Pipes가 이를 이벤트 버스나 큐로 옮깁니다. 발행 코드가 따로 없습니다.',
     gcp:'Firestore 문서 변경을 Eventarc 트리거로 받습니다. Cloud SQL이라면 같은 트랜잭션으로 아웃박스 테이블에 쓰고 별도 발행기가 Pub/Sub로 옮깁니다.',
     azure:'Cosmos DB 변경 피드를 Functions 트리거가 읽어 Service Bus로 보냅니다. 처리 위치는 임대(lease) 컨테이너에 기록됩니다.',
     so:'세 클라우드 모두 "DB 변경을 이벤트의 원천으로 삼는다"는 같은 결론입니다. 관계형 DB에서는 아웃박스 패턴을 씁니다.'},
    {t:'중복 메시지는 반드시 온다',
     p:'대부분의 메시징은 최소 한 번 전달입니다. 같은 메시지를 두 번 받아도 결과가 같아야 합니다.',
     aws:'SQS 표준 큐는 최소 한 번 전달입니다. FIFO 큐는 5분 중복 제거 구간과 그룹 내 순서를 보장하지만 처리량 한도가 있습니다.',
     gcp:'Pub/Sub는 기본이 최소 한 번입니다. pull 구독에서는 정확히 한 번 전달 옵션을 켤 수 있습니다.',
     azure:'Service Bus는 큐·토픽에 중복 감지 기간을 설정할 수 있고, 세션으로 같은 키의 순서를 보장합니다.',
     so:'어떤 옵션을 켜든 소비자에서 주문 ID 같은 멱등 키로 "이미 처리했는지"를 확인합니다. 브로커 보장은 그 위의 보험입니다.'},
    {t:'실패한 메시지를 모으는 곳',
     p:'계속 실패하는 메시지를 무한히 재시도하면 소비자가 그 메시지에 묶여 다른 메시지를 처리하지 못합니다.',
     aws:'원본 큐의 재드라이브 정책에 maxReceiveCount를 정하면 넘긴 메시지가 DLQ로 갑니다. 고친 뒤 DLQ 재드라이브로 되돌립니다.',
     gcp:'구독에 데드 레터 토픽과 최대 전송 시도(5~100회)를 정합니다. Pub/Sub 서비스 계정에 게시·구독 권한을 줘야 동작합니다.',
     azure:'모든 큐·구독에 데드 레터 하위 큐가 기본으로 있습니다. 최대 전송 횟수를 넘기거나 TTL이 지나면 옮겨집니다.',
     so:'DLQ는 만드는 것보다 들여다보는 것이 중요합니다. DLQ 메시지 수가 0이 아니면 경보가 울려야 합니다.'},
    {t:'여러 단계 흐름: 이벤트로 이을까, 지휘자를 둘까',
     p:'결제처럼 중간에 실패하면 앞 단계를 취소(보상)해야 하는 흐름은 이벤트만으로 추적하기 어렵습니다.',
     aws:'Step Functions 상태 머신으로 단계, 재시도, 보상 단계를 정의합니다.',
     gcp:'Workflows로 단계와 재시도를 YAML로 정의하고, 각 단계에서 Cloud Run이나 API를 호출합니다.',
     azure:'Durable Functions로 코드 안에서 오케스트레이션을 쓰거나, Logic Apps로 시각적으로 구성합니다.',
     so:'재고·알림처럼 독립적인 후속 처리는 이벤트로, 결제처럼 순서와 보상이 필요한 흐름만 오케스트레이션으로 묶습니다.'}
  ],
  sims: [{type:'queue', values:{base:100, mult:6, dur:15, n:8, mu:20}, q:'초당 600건 세일이 15분 이어지면 결제 큐는 언제 다 비워질까요?'}],
  iac: 'iac/scenario-05',
  checklist: [
    ['소비자가 멱등하지 않다','중복 메시지가 오면 재고가 두 번 빠지고 결제가 두 번 됩니다.'],
    ['처리 시간보다 짧은 잠금·가시성 시간','처리가 끝나기 전에 메시지가 다시 보여 다른 소비자가 또 처리합니다. 처리 시간보다 넉넉하게 잡습니다.'],
    ['DLQ에 경보가 없다','실패가 조용히 쌓입니다. DLQ 메시지 수와 가장 오래된 메시지 나이에 경보를 겁니다.'],
    ['보존 기간을 기본값으로 둔다','긴 연휴에 소비자가 멈추면 메시지가 만료돼 사라질 수 있습니다.'],
    ['메시지에 큰 데이터를 담는다','브로커마다 메시지 크기 한도가 있습니다. 큰 데이터는 오브젝트 스토리지에 두고 경로만 보냅니다.'],
    ['전체 순서를 가정한다','순서 보장은 대개 같은 키(그룹·세션·순서 키) 안에서만입니다.'],
    ['이벤트 스키마에 버전이 없다','소비자가 여럿이라 형식을 바꾸면 누군가 깨집니다. 버전 필드를 두고 하위 호환을 지킵니다.'],
    ['재시도 간격이 일정하다','외부 API 장애 때 재시도가 몰려 회복을 막습니다. 지수 백오프와 지터를 씁니다.']
  ],
  refs: [
    ['Amazon SQS 데드 레터 큐', 'https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html'],
    ['Pub/Sub 데드 레터 토픽', 'https://cloud.google.com/pubsub/docs/handling-failures'],
    ['Service Bus 데드 레터 큐', 'https://learn.microsoft.com/azure/service-bus-messaging/service-bus-dead-letter-queues']
  ],
  next: '시나리오 06 · 온프레미스 하이브리드 연결'
};
