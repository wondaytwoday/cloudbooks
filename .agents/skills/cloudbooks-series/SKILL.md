---
name: cloudbooks-series
description: CloudBooks(ArchBook, AWSBook, GCPBook, AzureBook) 챕터를 쓰거나 고칠 때 따르는 시리즈 공통 규칙. 새 시나리오 챕터, 매핑 데이터, 시뮬레이터, Terraform 골격 작업에 사용.
---

# CloudBooks 집필 규칙

## 먼저 읽을 것
- `CONTRIBUTING.md`: 챕터 7절 순서와 새 시나리오 추가 절차
- `archbook/chapters/01-three-tier.*`: 기준 챕터. 새 챕터는 이 파일을 복사해서 시작
- `shared/data/services.json`: 리소스 이름과 범위의 유일한 원본

## 반드시 지킬 것
1. **한 곳에서만 고친다.** 리소스 이름·범위는 `services.json`, Terraform은 `iac/`에만 쓴다. 챕터 HTML·JS에 복사하지 않는다.
2. **바뀌는 사실에는 날짜와 근거.** `services.json` 항목을 바꾸면 `checked`를 오늘 날짜로 갱신하고, 근거 문서를 챕터 꼬리말에 링크한다.
3. **단정하지 않는다.** SKU·요금제·리전에 따라 다른 동작은 조건을 적는다. 확인하지 못한 동작은 쓰지 않는다.
4. **가격을 본문에 넣지 않는다.** 비용 계산은 확인 날짜가 있는 데이터 파일을 읽게 한다.
5. **세 클라우드를 대칭으로.** 설계 결정 카드는 항상 AWS·GCP·Azure 세 줄과 "그래서" 한 줄. 한 클라우드만 유리하게 쓰지 않는다.
6. **시뮬레이터는 질문으로 시작.** 예측 질문 → 조작 → 결과 → 계산식과 가정 순서. 교육용 근사임을 밝힌다.
7. **공식 아이콘을 그리지 않는다.** 도면은 `node(..., key)`의 자체 아이콘을 쓰고, 공식 아이콘은 저자가 `shared/icons/manifest.json`에 파일로 등록한다.

## 디자인 토큰
- 클라우드 색: `--aws`(노랑) `--gcp`(초록) `--az`(파랑). 페이지 강조색은 `body[data-vendor]`로 바뀌는 `--accent`.
- 면은 `--accent`, 글자·선은 `--accent-ink`. 라이트·다크 둘 다 확인.

## 끝내기 전에
- `python3 tools/check.py` 통과
- `python3 -m http.server`로 열어 세 클라우드 전환, 장애 버튼, 시뮬레이터, 400px 폭 확인
