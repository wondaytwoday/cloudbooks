#!/usr/bin/env python3
"""archbook/data/scenarios.json에 file이 있는 시나리오마다 챕터 HTML 껍데기를 만든다.

챕터 본문은 같은 이름의 .data.js(window.SCENARIO)에 쓰고, 이 스크립트는 HTML만 생성한다.
01-three-tier처럼 손으로 만든 챕터는 data.js가 없으므로 건드리지 않는다.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = """<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title} · ArchBook</title>
<meta name="description" content="{question} AWS·GCP·Azure 설계를 도면과 시뮬레이터로 비교합니다.">
<link rel="icon" href="../../favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+KR:wght@400;500;600&family=Noto+Serif+KR:wght@600;700&display=swap">
<link rel="stylesheet" href="../../shared/css/book.css">
</head>
<body data-vendor="aws" data-root="../../">
<script src="../../shared/js/icons.js"></script>
<div class="bar" role="region" aria-label="클라우드 선택">
  <div class="wrap">
    <a class="lbl" href="../">ArchBook</a><span class="lbl">이 장을 읽을 클라우드</span>
    <div class="seg" id="vendorSeg">
      <button type="button" class="v-aws" data-v="aws" aria-pressed="true">AWS</button>
      <button type="button" class="v-gcp" data-v="gcp" aria-pressed="false">GCP</button>
      <button type="button" class="v-azure" data-v="azure" aria-pressed="false">Azure</button>
    </div>
  </div>
</div>
<main class="wrap" id="chapter"></main>
<script src="{stem}.data.js"></script>
<script src="../../shared/js/sims.js"></script>
<script src="../../shared/js/scenario.js"></script>
</body>
</html>
"""

def main():
    sc = json.loads((ROOT / "archbook/data/scenarios.json").read_text(encoding="utf-8"))
    for s in sc["scenarios"]:
        f = s.get("file")
        if not f:
            continue
        html = ROOT / "archbook" / f
        data = html.with_name(html.stem + ".data.js")
        if not data.exists():
            continue
        html.write_text(TEMPLATE.format(title=s["title"], question=s["question"], stem=html.stem), encoding="utf-8")
        print("생성:", html.relative_to(ROOT))

if __name__ == "__main__":
    main()
