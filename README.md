# CloudBooks

같은 시스템을 AWS, GCP, Azure에 각각 세워 보며 배우는 인터랙티브 클라우드 설계 교과서 시리즈입니다.

| 책 | 역할 | 상태 |
| --- | --- | --- |
| **ArchBook** | 설계 사례집. 시나리오 하나를 세 클라우드에 나란히 설계 | 집필 중 |
| **AWSBook** | AWS 레퍼런스. 사례집에서 넘어와 깊이 읽는 책 | 집필 예정 |
| **GCPBook** | Google Cloud 레퍼런스 | 집필 예정 |
| **AzureBook** | Azure 레퍼런스 | 집필 예정 |

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
  chapters/NN-<id>.html    챕터 본문
  chapters/NN-<id>.js      챕터 고유 데이터(도면 라벨, 설계 결정, 점검표)와 시뮬레이터
awsbook/ gcpbook/ azurebook/
  index.html               벤더 책 (목차는 shared/data/vendor-toc.json)

shared/
  css/book.css             디자인 토큰과 챕터 스타일 (클라우드 색: AWS 노랑, GCP 초록, Azure 파랑)
  css/site.css             책장·목차 페이지 스타일
  js/icons.js              아이콘 스프라이트, 공식 아이콘 매니페스트 로더
  js/site.js               책장·목차 렌더링
  data/services.json       세 클라우드 리소스 매핑 (모든 책이 공유하는 원본)
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
