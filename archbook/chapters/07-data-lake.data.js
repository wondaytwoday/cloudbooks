window.SCENARIO = {
  no: 7, level: 'intermediate', title: '데이터 레이크와 분석 파이프라인',
  lede: '주문 DB와 웹 로그를 한곳에 모아 분석가가 SQL로 질문할 수 있게 만드는 구성입니다. 저장과 계산을 나누는 방식, 열 단위 권한, 읽은 만큼 내는 쿼리 비용이 클라우드마다 달라 설계가 갈립니다.',
  region: {aws:'ap-northeast-2', gcp:'asia-northeast3', azure:'Korea Central'},
  req: [
    {k:'원천', v:'주문 DB + 웹 로그', s:'로그는 하루 200GB'},
    {k:'사용자', v:'분석가 10명, SQL', s:'대시보드는 매일 오전 8시 갱신'},
    {k:'보안', v:'개인정보 열 마스킹', s:'분석가는 전화번호·주소 원문 불가'},
    {k:'보관', v:'3년', s:'오래된 데이터는 싼 저장 계층으로'}
  ],
  intro: { arch: '원본은 손대지 않고 쌓아 두고(raw), 변환을 거친 테이블(curated)을 분석에 씁니다. <b>원본 스키마 변경</b>을 눌러 어디가 멈추는지 보세요.' },
  diagram: {
    w: 680, h: 420,
    frames: [
      {id:'src', kind:'plain', x:14, y:14, w:186, h:200, label:'원천'},
      {id:'lake', kind:'net', x:436, y:14, w:230, h:300, label:{aws:'레이크 · S3', gcp:'BigQuery + Cloud Storage', azure:'레이크 · ADLS Gen2'}}
    ],
    nodes: [
      {id:'db', x:24, y:40, w:166, h:48, icon:'db', t:'주문 DB', s:{aws:'Aurora MySQL', gcp:'Cloud SQL', azure:'MySQL Flexible Server'}},
      {id:'logs', x:24, y:140, w:166, h:48, icon:'stream', t:'웹 로그·클릭', s:{aws:'Kinesis Data Streams', gcp:'Pub/Sub', azure:'Event Hubs'}},
      {id:'cdc', x:222, y:40, w:190, h:48, icon:'etl', t:'변경 수집 (CDC)', s:{aws:'DMS', gcp:'Datastream', azure:'Data Factory CDC'}},
      {id:'fh', x:222, y:140, w:190, h:48, icon:'stream', t:'스트림 적재', s:{aws:'Data Firehose', gcp:'BigQuery 구독', azure:'Event Hubs Capture'}},
      {id:'raw', x:448, y:44, w:206, h:48, icon:'obj', t:'원본 영역 (raw)', s:{aws:'S3 · Parquet', gcp:'Cloud Storage · BigQuery 원본 테이블', azure:'ADLS Gen2 · Avro'}},
      {id:'etl', x:448, y:144, w:206, h:48, icon:'etl', t:'변환', s:{aws:'Glue 잡 (Spark)', gcp:'Dataform · BigQuery SQL', azure:'Data Factory · Spark'}, failS:'스키마 불일치로 실패'},
      {id:'cur', x:448, y:244, w:206, h:48, icon:{aws:'obj', gcp:'dwh', azure:'obj'}, t:'정제 영역 (curated)', s:{aws:'Iceberg 테이블', gcp:'파티션·클러스터 테이블', azure:'Delta 테이블'}},
      {id:'cat', x:222, y:244, w:190, h:48, icon:'lakegov', t:'카탈로그·열 권한', s:{aws:'Glue 카탈로그 + Lake Formation', gcp:'Dataplex · 정책 태그', azure:'Microsoft Purview'}},
      {id:'q', x:222, y:350, w:190, h:48, icon:'query', t:'분석 SQL', s:{aws:'Athena · Redshift Serverless', gcp:'BigQuery', azure:'Synapse 서버리스 SQL'}},
      {id:'bi', x:448, y:350, w:206, h:48, t:'대시보드', s:{aws:'QuickSight', gcp:'Looker Studio', azure:'Power BI'}, kind:'alt'},
      {id:'orch', x:24, y:300, w:166, h:48, icon:'workflow', t:'일정·의존성', s:{aws:'MWAA (Airflow)', gcp:'Cloud Composer', azure:'Data Factory 트리거'}, kind:'alt'}
    ],
    edges: [
      {a:'db', b:'cdc'}, {a:'logs', b:'fh'},
      {a:'cdc', b:'raw'}, {a:'fh', b:'raw'},
      {a:'raw', b:'etl'}, {a:'etl', b:'cur'},
      {a:'cur', b:'cat', dash:true, label:'등록'},
      {a:'cat', b:'q', dash:true, label:'열 마스킹 적용'},
      {a:'cur', b:'q'}, {a:'q', b:'bi'},
      {a:'orch', b:'etl', dash:true, label:'매일 06:00'}
    ]
  },
  fail: {
    button: '원본 스키마 변경', restore: '복구', title: '원본 DB에 열이 추가되고 형식이 바뀌었을 때',
    down: ['etl'],
    normal: {
      aws: ['주문 DB 변경은 DMS가, 웹 로그는 Firehose가 S3 원본 영역에 Parquet로 씁니다.', 'Glue 잡이 정제 영역의 Iceberg 테이블을 갱신하고, Lake Formation 권한에 따라 Athena가 열을 가려서 보여 줍니다.'],
      gcp: ['주문 DB 변경은 Datastream이 BigQuery로, 웹 로그는 Pub/Sub의 BigQuery 구독이 바로 테이블에 씁니다.', 'Dataform이 SQL로 정제 테이블을 만들고, 정책 태그가 붙은 열은 권한 없는 분석가에게 마스킹되어 보입니다.'],
      azure: ['주문 DB 변경은 Data Factory가, 웹 로그는 Event Hubs Capture가 ADLS Gen2 원본 영역에 씁니다.', 'Spark가 정제 영역의 Delta 테이블을 갱신하고, Synapse 서버리스 SQL이 그 위를 조회합니다.']
    },
    effects: {
      aws: [
        ['good','DMS와 Firehose는 원본 영역에 계속 씁니다. 원본 영역은 스키마를 강제하지 않아 데이터가 사라지지 않습니다.'],
        ['warn','Glue 잡이 실패하면 정제 테이블과 대시보드가 어제 데이터에 멈춥니다. 잡 상태 변경 이벤트를 EventBridge로 받아 경보합니다.'],
        ['good','Iceberg 테이블은 열 추가 같은 스키마 변경을 테이블을 다시 쓰지 않고 받아들입니다.']
      ],
      gcp: [
        ['warn','BigQuery 구독은 메시지가 테이블 스키마와 맞지 않으면 쓰지 못합니다. 데드 레터 토픽을 설정해 두어야 메시지가 남습니다.'],
        ['good','Datastream은 원본의 열 추가 같은 변경을 대상 BigQuery 테이블에 반영합니다.'],
        ['warn','정제 테이블을 만드는 Dataform 실행이 실패하면 대시보드가 멈춥니다. 실행 실패를 경보로 받습니다.']
      ],
      azure: [
        ['good','Event Hubs Capture는 받은 이벤트를 그대로 파일로 써서 원본은 남습니다.'],
        ['warn','Data Factory 파이프라인이 실패하면 정제 영역이 멈춥니다. 실패 실행을 Azure Monitor 경보로 받습니다.'],
        ['good','Delta 테이블은 스키마 병합 옵션으로 열 추가를 받아들일 수 있습니다.']
      ]
    }
  },
  map: ['cdc-replication','stream-ingest','data-lake-storage','etl-transform','data-catalog','sql-analytics','orchestration','bi'],
  decisions: [
    {t:'저장과 계산을 어떻게 나누는가',
     p:'데이터를 어디에 어떤 형식으로 두느냐가, 나중에 어떤 엔진으로 읽을 수 있는지를 정합니다.',
     aws:'S3에 Parquet·Iceberg 같은 열린 형식으로 두고 Athena, Redshift, EMR 등 여러 엔진이 같은 파일을 읽습니다.',
     gcp:'BigQuery가 저장과 엔진을 함께 관리하는 것이 기본입니다. Cloud Storage의 파일은 BigLake 테이블로 만들어 같은 권한 체계로 조회합니다.',
     azure:'ADLS Gen2에 Delta·Parquet로 두고 Synapse, Databricks, Fabric이 읽습니다. Fabric은 OneLake라는 단일 레이크를 씁니다.',
     so:'BigQuery는 관리할 것이 적은 대신 BigQuery 중심이 되고, 열린 테이블 형식은 엔진을 바꾸기 쉬운 대신 관리할 것이 늘어납니다.'},
    {t:'권한은 파일이 아니라 테이블·열 단위로',
     p:'버킷이나 폴더 권한만으로는 "이 열만 가린다"를 할 수 없습니다.',
     aws:'Lake Formation이 데이터베이스·테이블·열·행 권한을 관리하고, Athena와 Redshift Spectrum이 이를 따릅니다.',
     gcp:'BigQuery의 정책 태그로 열 수준 접근을 막거나 동적 데이터 마스킹을 걸고, 행 수준 정책으로 행을 거릅니다.',
     azure:'Synapse SQL의 열·행 수준 보안과 동적 데이터 마스킹을 쓰고, Microsoft Purview로 민감 정보를 분류합니다.',
     so:'분석가에게는 원본 버킷 권한을 주지 않고, 카탈로그를 거치는 경로로만 조회하게 합니다.'},
    {t:'운영 DB 변경을 레이크로 가져오는 법',
     p:'운영 DB에 분석 쿼리를 바로 날리면 주문 처리가 느려집니다. 변경분만 복제해 옵니다.',
     aws:'DMS가 전체 적재 후 변경 데이터 캡처(CDC)를 이어서 S3로 씁니다.',
     gcp:'Datastream이 MySQL·PostgreSQL·Oracle 등의 변경을 BigQuery나 Cloud Storage로 실시간에 가깝게 복제합니다.',
     azure:'Data Factory의 변경 데이터 캡처 리소스로 가져오거나, Fabric을 쓴다면 미러링으로 복제합니다.',
     so:'원본 DB의 이진 로그(binlog) 보관 기간을 넉넉히 잡아야 복제가 잠시 멈춰도 이어 받을 수 있습니다.'},
    {t:'읽은 만큼 내는 엔진에서 비용 줄이기',
     p:'서버리스 쿼리 엔진은 처리한 데이터 양으로 과금되는 경우가 많아, 테이블 설계가 곧 비용 설계입니다.',
     aws:'Athena는 스캔한 데이터량으로 과금됩니다. 파티션, Parquet, 작업 그룹별 쿼리당 스캔 한도를 함께 씁니다.',
     gcp:'BigQuery 온디맨드는 처리한 바이트로 과금됩니다. 파티션·클러스터링과 파티션 필터 필수 옵션을 쓰고, 사용량이 크면 용량(슬롯) 요금제를 검토합니다.',
     azure:'Synapse 서버리스 SQL 풀은 처리한 데이터량으로 과금됩니다. Parquet와 폴더 단위 파티션으로 읽는 범위를 줄입니다.',
     so:'아래 시뮬레이터로 파티션과 열 지향 형식이 읽는 양을 몇 분의 일로 줄이는지 확인해 보세요.'}
  ],
  sims: [{type:'scan'}],
  iac: 'iac/scenario-07',
  checklist: [
    ['운영 DB에 분석 쿼리를 바로 날린다','주문 처리가 느려집니다. 복제본이나 CDC로 레이크에 가져와 조회합니다.'],
    ['작은 파일 수백만 개를 쌓는다','쿼리 엔진이 파일을 여는 데 시간을 다 씁니다. 적재 버퍼를 늘리거나 주기적으로 합칩니다.'],
    ['파티션 없이 적재한다','"어제 주문" 하나를 보려고 3년치를 읽습니다.'],
    ['개인정보 열을 그대로 노출한다','열 단위 권한이나 마스킹을 먼저 걸고 분석가를 초대합니다.'],
    ['쿼리당 스캔 한도가 없다','실수 하나(SELECT *)가 한 달 예산을 씁니다. 작업 그룹·프로젝트 단위 한도를 둡니다.'],
    ['데이터 품질 검사가 없다','빈 값, 중복, 건수 급감을 변환 단계에서 검사하지 않으면 틀린 대시보드가 그대로 나갑니다.'],
    ['보관 정책이 없다','수명 주기 규칙으로 오래된 원본을 싼 저장 계층으로 옮기거나 지웁니다.'],
    ['스키마 변경을 알 길이 없다','원본 팀과 변경 알림 절차를 정하고, 변환 실패 경보를 둡니다.']
  ],
  refs: [
    ['AWS Lake Formation 권한', 'https://docs.aws.amazon.com/lake-formation/latest/dg/lake-formation-permissions.html'],
    ['BigQuery 열 수준 접근 제어', 'https://cloud.google.com/bigquery/docs/column-level-security-intro'],
    ['Azure Data Lake Storage 소개', 'https://learn.microsoft.com/azure/storage/blobs/data-lake-storage-introduction']
  ],
  next: '시나리오 08 · 멀티 리전 재해 복구'
};
