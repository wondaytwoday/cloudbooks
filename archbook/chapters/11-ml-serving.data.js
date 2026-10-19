window.SCENARIO = {
  no: 11, level: 'advanced', title: 'ML 학습과 추론 서빙',
  lede: '추천 모델을 매주 다시 학습시키고, 매 요청마다 수십 밀리초 안에 예측을 돌려줘야 합니다. 비싼 GPU를 학습에는 짧게 몰아서, 추론에는 꾸준히 쓰는 두 패턴을 함께 설계하고, 새 모델이 나빠졌을 때 바로 되돌리는 방법까지 다룹니다.',
  region: {aws:'SageMaker · ap-northeast-2', gcp:'Vertex AI · asia-northeast3', azure:'Azure Machine Learning · Korea Central'},
  req: [
    {k:'학습', v:'주 1회, GPU 8장 × 6시간', s:'데이터 2TB'},
    {k:'추론', v:'피크 3,000 RPS', s:'p95 응답 50ms 이내'},
    {k:'배포', v:'새 모델은 일부 트래픽부터', s:'지표가 나빠지면 자동 롤백'},
    {k:'비용', v:'학습 GPU는 스팟 우선', s:'중단돼도 이어서 학습'}
  ],
  intro: { arch: '학습은 파이프라인이 GPU를 잠깐 빌려 쓰고 끝나면 반납합니다. 추론은 엔드포인트가 모델 버전 둘에 트래픽을 나눠 보냅니다. <b>새 모델 성능 하락</b>을 눌러 롤백이 어떻게 일어나는지 보세요.' },
  diagram: {
    w: 680, h: 400,
    frames: [
      {id:'region', kind:'region', x:8, y:6, w:664, h:388, label:{aws:'서울 리전 · ap-northeast-2', gcp:'서울 리전 · asia-northeast3', azure:'서울 리전 · Korea Central'}, labelRight:true}
    ],
    nodes: [
      {id:'lake', x:20, y:34, w:180, h:48, icon:'obj', t:'학습 데이터', s:{aws:'S3', gcp:'Cloud Storage · BigQuery', azure:'ADLS Gen2'}},
      {id:'feat', x:20, y:134, w:180, h:48, icon:'nosql', t:'피처 저장소', s:{aws:'SageMaker Feature Store', gcp:'Vertex AI Feature Store', azure:'Azure ML 피처 저장소'}},
      {id:'pipe', x:228, y:34, w:204, h:48, icon:'workflow', t:'학습 파이프라인', s:{aws:'SageMaker Pipelines', gcp:'Vertex AI Pipelines', azure:'Azure ML 파이프라인'}},
      {id:'train', x:228, y:134, w:204, h:52, icon:'gpu', t:'분산 학습 · GPU 8장', s:{aws:'학습 작업 · 관리형 스팟', gcp:'맞춤 학습 · 스팟 VM', azure:'컴퓨팅 클러스터 · 저우선순위'}},
      {id:'ckpt', x:228, y:236, w:204, h:44, icon:'obj', t:'체크포인트', s:{aws:'S3', gcp:'Cloud Storage', azure:'Blob Storage'}, kind:'alt'},
      {id:'reg', x:460, y:34, w:200, h:48, icon:'ml', t:'모델 레지스트리', s:{aws:'SageMaker Model Registry', gcp:'Vertex AI Model Registry', azure:'Azure ML 레지스트리'}},
      {id:'ep', x:460, y:134, w:200, h:52, icon:'ml', t:'추론 엔드포인트', s:{aws:'SageMaker 실시간 엔드포인트', gcp:'Vertex AI 온라인 엔드포인트', azure:'관리형 온라인 엔드포인트'}, kind:'reg'},
      {id:'v1', x:460, y:236, w:96, h:44, icon:'gpu', t:'v12', s:'90%', failS:'100%'},
      {id:'v2', x:564, y:236, w:96, h:44, icon:'gpu', t:'v13', s:'10%', failS:'롤백 → 0%'},
      {id:'app', x:228, y:330, w:204, h:44, icon:{aws:'apigw', gcp:'run', azure:'apigw'}, t:'추천 API', s:{aws:'API Gateway', gcp:'Cloud Run', azure:'API Management'}},
      {id:'mon', x:460, y:330, w:200, h:44, icon:'mon', t:'모델 모니터링', s:{aws:'Model Monitor · CloudWatch', gcp:'Vertex AI Model Monitoring', azure:'Azure ML 모델 모니터링'}, kind:'alt'}
    ],
    edges: [
      {a:'lake', b:'pipe'}, {a:'pipe', b:'train'},
      {a:'feat', b:'train', dash:true, label:'오프라인 피처'},
      {a:'train', b:'ckpt', dash:true, label:'주기 저장'},
      {a:'train', b:'reg', label:'평가 통과 시 등록', ly:-6},
      {a:'reg', b:'ep', label:'배포'},
      {a:'ep', b:'v1'}, {a:'ep', b:'v2'},
      {a:'app', b:'ep', label:'예측 요청'},
      {a:'v2', b:'mon', dash:true}
    ]
  },
  fail: {
    button: '새 모델 성능 하락', restore: '복구', title: '새 모델 v13의 오류율이 오를 때',
    down: ['v2'], promote: ['v1'],
    normal: {
      aws: ['SageMaker Pipelines가 주 1회 관리형 스팟 학습 작업을 띄우고, 끝나면 GPU를 반납합니다.', '평가를 통과한 모델은 Model Registry에 등록되고, 엔드포인트의 블루/그린 배포가 새 버전에 일부 트래픽부터 보냅니다.'],
      gcp: ['Vertex AI Pipelines가 맞춤 학습 작업을 스팟 VM으로 띄우고, 끝나면 반납합니다.', '평가를 통과한 모델은 Model Registry에 버전으로 올라가고, 엔드포인트에 두 모델을 배포해 트래픽을 90:10으로 나눕니다.'],
      azure: ['Azure ML 파이프라인이 저우선순위 VM 컴퓨팅 클러스터에서 학습하고, 클러스터는 0대까지 줄어듭니다.', '관리형 온라인 엔드포인트에 블루·그린 두 배포를 두고 트래픽을 90:10으로 나눕니다.']
    },
    effects: {
      aws: [
        ['good','배포 가드레일의 카나리 단계에서 CloudWatch 경보가 울리면 SageMaker가 자동으로 이전 버전으로 되돌립니다.'],
        ['good','되돌리는 동안에도 이전 버전 인스턴스가 떠 있어 요청은 끊기지 않습니다.'],
        ['warn','경보 지표가 지연·오류율 같은 시스템 지표뿐이면 "응답은 빠른데 추천이 엉망"인 경우를 못 잡습니다. 클릭률 같은 비즈니스 지표를 함께 봅니다.']
      ],
      gcp: [
        ['good','엔드포인트의 트래픽 분할을 v12 100%로 바꾸면 즉시 되돌아갑니다. 두 모델이 이미 배포돼 있어 새로 띄울 필요가 없습니다.'],
        ['warn','자동 롤백은 기본 제공이 아니므로, 모니터링 경보에서 트래픽 분할을 바꾸는 자동화를 직접 연결합니다.'],
        ['good','Model Monitoring이 입력 피처 분포 변화(드리프트)를 감지해 재학습 시점을 알려 줍니다.']
      ],
      azure: [
        ['good','엔드포인트 트래픽을 블루 배포 100%로 바꾸면 즉시 되돌아갑니다.'],
        ['good','새 배포에 실제 트래픽을 복제(미러링)해 응답은 버리고 지표만 보는 방식으로 먼저 검증할 수도 있습니다.'],
        ['warn','자동 롤백은 Azure Monitor 경보와 자동화 작업으로 직접 연결합니다.']
      ]
    }
  },
  map: ['ml-platform','ml-training','model-registry','ml-endpoint','feature-store','gpu-capacity'],
  decisions: [
    {t:'학습 GPU를 싸게 쓰는 법',
     p:'학습은 몇 시간 몰아서 쓰고 끝나는 작업이라 스팟(선점형) GPU와 잘 맞습니다. 대신 중간에 회수될 수 있습니다.',
     aws:'SageMaker 관리형 스팟 학습을 켜고 체크포인트 경로를 S3로 지정하면, 회수된 뒤 새 인스턴스에서 체크포인트부터 이어서 학습합니다.',
     gcp:'맞춤 학습 작업을 스팟 VM으로 실행하고 체크포인트를 Cloud Storage에 저장합니다. GPU 확보가 어렵다면 Dynamic Workload Scheduler의 플렉스 시작을 씁니다.',
     azure:'컴퓨팅 클러스터를 저우선순위 VM으로 만들고 최소 0대로 둡니다. 학습 코드가 체크포인트에서 재개하도록 작성합니다.',
     so:'체크포인트 주기가 길면 회수될 때마다 그만큼 다시 학습합니다. 30분 안팎이 보통의 출발점입니다.'},
    {t:'GPU를 제때 확보하는 법',
     p:'인기 있는 GPU는 온디맨드로 요청해도 바로 받지 못할 수 있습니다. 학습 일정이 정해져 있다면 미리 잡습니다.',
     aws:'EC2 용량 블록이나 SageMaker 학습 계획으로 정해진 기간의 GPU를 예약합니다.',
     gcp:'예약(Reservation)으로 용량을 잡거나, Dynamic Workload Scheduler로 기간 단위 GPU를 요청합니다.',
     azure:'용량 예약과 GPU 계열 할당량 증설을 미리 요청합니다.',
     so:'GPU 할당량은 기본값이 매우 작은 경우가 많습니다. 프로젝트 첫 주에 증설을 요청합니다.'},
    {t:'추론: 관리형 엔드포인트인가, 쿠버네티스인가',
     p:'모델 한두 개를 꾸준히 서빙한다면 관리형이 편하고, 모델이 많아 GPU를 나눠 써야 한다면 쿠버네티스가 유리합니다.',
     aws:'SageMaker 실시간 엔드포인트가 오토스케일과 배포를 맡습니다. 직접 운영한다면 EKS에 GPU 노드와 서빙 엔진(Triton, vLLM 등)을 올립니다.',
     gcp:'Vertex AI 온라인 엔드포인트가 오토스케일과 트래픽 분할을 맡습니다. 직접 운영한다면 GKE의 GPU 노드 풀을 씁니다.',
     azure:'관리형 온라인 엔드포인트가 블루·그린 배포와 오토스케일을 맡습니다. 직접 운영한다면 AKS의 GPU 노드 풀을 씁니다.',
     so:'관리형은 시간당 단가가 조금 높지만 운영 인력이 줄어듭니다. 아래 시뮬레이터로 모델에 필요한 GPU 메모리부터 계산해 보세요.'},
    {t:'새 모델을 안전하게 내보내기',
     p:'모델은 코드와 달리 "정상 동작하지만 결과가 나빠지는" 실패가 흔합니다.',
     aws:'배포 가드레일의 블루/그린 배포(카나리·선형)와 CloudWatch 경보를 연결해 자동 롤백합니다.',
     gcp:'엔드포인트에 두 모델을 배포하고 트래픽 분할 비율을 단계적으로 바꿉니다.',
     azure:'엔드포인트에 블루·그린 배포를 두고 트래픽 비율을 바꾸거나, 미러 트래픽으로 먼저 검증합니다.',
     so:'세 클라우드 모두 "두 버전을 같이 띄우고 비율을 바꾼다"가 핵심입니다. 롤백 판단 지표에는 비즈니스 지표를 꼭 넣습니다.'}
  ],
  sims: [{type:'gpu'}],
  iac: 'iac/scenario-11',
  checklist: [
    ['노트북·개발용 GPU를 켜 둔다','학습은 끝났는데 개발용 GPU 인스턴스가 주말 내내 돌고 있는 경우가 가장 흔한 낭비입니다. 유휴 자동 종료를 켭니다.'],
    ['체크포인트 없이 스팟으로 학습한다','회수될 때마다 처음부터 다시 합니다.'],
    ['학습과 서빙의 피처 계산이 다르다','같은 피처를 두 군데서 따로 계산하면 서빙 때 값이 달라집니다. 피처 저장소나 공통 코드를 씁니다.'],
    ['모델과 데이터 버전을 함께 기록하지 않는다','어떤 데이터로 학습한 모델인지 모르면 문제를 재현할 수 없습니다.'],
    ['추론 최소 인스턴스를 0으로 둔다','첫 요청에서 큰 모델을 올리느라 수십 초가 걸립니다. 지연 요구가 있으면 최소 1대 이상 둡니다.'],
    ['모델 파일이 커서 시작이 느리다','오토스케일로 늘린 인스턴스가 모델을 내려받는 동안 쓸모가 없습니다. 이미지에 포함하거나 빠른 저장소를 씁니다.'],
    ['GPU 할당량을 늦게 요청한다','증설 승인에 며칠이 걸릴 수 있습니다.'],
    ['드리프트를 보지 않는다','입력 분포가 바뀌면 정확도가 조용히 떨어집니다. 분포 감시와 재학습 기준을 둡니다.']
  ],
  refs: [
    ['SageMaker 관리형 스팟 학습', 'https://docs.aws.amazon.com/sagemaker/latest/dg/model-managed-spot-training.html'],
    ['Vertex AI 엔드포인트에 모델 배포', 'https://cloud.google.com/vertex-ai/docs/general/deployment'],
    ['Azure ML 온라인 엔드포인트 안전 배포', 'https://learn.microsoft.com/azure/machine-learning/how-to-safely-rollout-online-endpoints']
  ],
  next: '시나리오 12 · LLM·RAG 애플리케이션'
};
