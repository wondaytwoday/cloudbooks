# CloudBooks

같은 시스템을 AWS, GCP, Azure에 각각 세워 보며 배우는 인터랙티브 클라우드 설계 교과서 시리즈입니다.

| 책 | 역할 | 상태 |
| --- | --- | --- |
| **ArchBook** | 설계 사례집. 시나리오 26개(네트워크 설계 실전 6개, 전용선 하이브리드 실전 6개 포함)를 세 클라우드에 나란히 설계 | 출간 |
| **AWSBook** | AWS 레퍼런스 13장 | 출간 |
| **GCPBook** | Google Cloud 레퍼런스 13장 | 출간 |
| **AzureBook** | Azure 레퍼런스 13장 | 출간 |

## 실행

빌드 과정이 없는 정적 사이트입니다. 페이지가 `fetch`로 공유 데이터를 읽으므로 저장소 루트에서 서버로 띄웁니다.

```
python3 -m http.server 8000   # → http://localhost:8000
```

`main`에 푸시하면 `.github/workflows/pages.yml`이 저장소 전체를 GitHub Pages로 배포합니다. 저장소 Settings → Pages에서 Source를 **GitHub Actions**로 한 번 설정해 두세요.

## 구조

```
index.html                 책장 (data/books.json으로 그림)
data/books.json            시리즈의 책 목록과 상태

archbook/
  index.html               시나리오 목차 (archbook/data/scenarios.json)
  chapters/NN-<id>.data.js 챕터 데이터(window.SCENARIO: 도면, 장애, 구축 순서, 설계 결정, 점검표)
  chapters/NN-<id>.html    tools/build_chapters.py가 만드는 껍데기
awsbook/ gcpbook/ azurebook/
  index.html               벤더 책 (목차는 shared/data/vendor-toc.json)

shared/
  css/book.css             디자인 토큰과 챕터 스타일 (클라우드 색: AWS 노랑, GCP 초록, Azure 파랑)
  css/site.css             책장·목차 페이지 스타일
  js/icons.js              아이콘 스프라이트, 공식 아이콘 매니페스트 로더
  js/site.js               책장·목차 렌더링
  data/services.json       세 클라우드 리소스 매핑 (모든 책이 공유하는 원본)
  data/configs.js          리소스별 실제 설정 카탈로그: 설정 범위, 만드는 위치, 순서, 주요 값, Terraform 리소스
  js/scenario.js           ArchBook 챕터 엔진 (도면 클릭 → 설정 패널, 설정 범위표, 구축 순서 비교)
  data/vendor-toc.json     세 벤더 책의 공통 목차 뼈대
  icons/manifest.json      공식 아키텍처 아이콘 등록 (아래 참고)

iac/scenario-NN/<cloud>/   챕터가 보여 주는 Terraform 코드의 원본
tools/check.py             데이터·링크·확인 날짜 검사
.agents/skills/            AI로 집필할 때 쓰는 시리즈 규칙
```

## 데이터 원칙

- **한 곳에서만 고친다.** 서비스 이름과 범위는 `shared/data/services.json`, Terraform은 `iac/`가 원본입니다. 챕터 HTML에 같은 내용을 다시 적지 않습니다.
- **바뀌는 사실에는 날짜를 붙인다.** `services.json`의 각 항목에 `checked` 날짜를 남깁니다. `tools/check.py`는 180일이 지난 항목을 경고합니다.
- **가격은 본문에 고정하지 않는다.** 비용 시뮬레이터를 만들 때는 `shared/data/prices.json`(확인 날짜와 출처 포함)을 따로 두고 읽게 합니다.

## 도면에서 실제 설정 보기

도면의 노드·프레임에 `cfg: 'igw'`처럼 `shared/data/configs.js`의 키를 적으면 누를 수 있게 되고, 그 리소스의 클라우드별 설정 화면이 열립니다. `why`에는 이 장에서 그 설정을 왜 그렇게 했는지 적습니다.

- `kind: 'ghost'` — 클라우드가 자동으로 만들어 직접 만들 필요가 없는 리소스 (GCP 기본 인터넷 게이트웨이, Azure 시스템 경로)
- `kind: 'chip'` — 방화벽 규칙·라우팅 테이블처럼 다른 리소스에 붙는 설정. 붙는 위치에 꼬리표로 그려 설정 범위를 보여 줍니다
- `scope: [키]` — 설정 범위 비교표의 행
- `build: {aws:[{t, d, cfg, nodes}], gcp:[..], azure:[..]}` — 클라우드별 구축 순서. `auto: true`는 만들 것 없이 확인만 하는 단계
- `flows: [{id, t, d, hops:{aws:[{n, t, r, cfg, ok}], ..}, note}]` — 통신 경로 추적. 홉마다 거치는 곳(n: 노드 id)과 적용되는 설정(r)을 적고, `ok:false`인 홉에서 차단으로 표시합니다
- 도면이 클라우드마다 크게 다르면 `diagram: {aws:{..}, gcp:{..}, azure:{..}}`로 따로 그립니다 (1장 참고)

## 공식 아키텍처 아이콘 쓰기

도면은 기본으로 자체 선 아이콘을 씁니다. 각 사 공식 아이콘으로 바꾸려면:

1. 각 사의 아키텍처 아이콘 배포 페이지에서 SVG 세트를 내려받고 사용 조건을 확인합니다.
2. 필요한 파일을 `shared/icons/aws/`, `shared/icons/gcp/`, `shared/icons/azure/`에 넣습니다.
3. `shared/icons/manifest.json`에 키와 경로를 적습니다.

```json
{ "aws": { "vm": "aws/ec2.svg", "db": "aws/rds.svg" }, "gcp": {}, "azure": {} }
```

키: `users dns edge lb nat vm db obj cache secret mon net sub fw pin`. 등록하지 않은 키는 자체 아이콘이 그대로 나옵니다.

## 검사

```
python3 tools/check.py
```

JSON 형식, 시나리오 파일 존재, 아이콘 경로, Terraform 파일 존재, `checked` 날짜를 확인합니다. 푸시와 PR마다 `.github/workflows/check.yml`이 같은 검사와 `terraform fmt -check`를 돌립니다.

## 라이선스

코드는 MIT, 본문·도면·데이터는 CC BY 4.0을 기본으로 둡니다 (`LICENSE.md`). 공식 아키텍처 아이콘은 각 사의 조건을 따르며 이 라이선스에 포함되지 않습니다.
