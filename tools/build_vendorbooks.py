#!/usr/bin/env python3
"""벤더 책(awsbook, gcpbook, azurebook)의 챕터 HTML 껍데기를 data/chapters.js에서 생성한다.

본문은 각 책의 data/chapters.js(window.VBOOK)에 쓰고, 이 스크립트는 챕터마다 HTML만 만든다.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BOOKS = {"awsbook": ("aws", "AWS"), "gcpbook": ("gcp", "GCP"), "azurebook": ("azure", "Azure")}
TEMPLATE = """<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title} · {book}</title>
<link rel="icon" href="../../favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+KR:wght@400;500;600&family=Noto+Serif+KR:wght@600;700&display=swap">
<link rel="stylesheet" href="../../shared/css/book.css">
<link rel="stylesheet" href="../../shared/css/site.css">
</head>
<body data-vendor="{vendor}" data-root="../../" data-chapter="{id}">
<script src="../../shared/js/icons.js"></script>
<div class="bar"><div class="wrap"><span class="vtag">{label}</span><a class="lbl" href="../">{book}</a><a class="lbl" href="../../">CloudBooks</a></div></div>
<main class="wrap" id="chapter"></main>
<script src="../data/chapters.js"></script>
<script src="../../shared/js/vendorbook.js"></script>
</body>
</html>
"""

def main():
    for book, (vendor, label) in BOOKS.items():
        data = (ROOT / book / "data/chapters.js").read_text(encoding="utf-8")
        chapters = re.findall(r"\{id:'([a-z0-9-]+)', title:'([^']+)'", data)
        out = ROOT / book / "chapters"
        out.mkdir(exist_ok=True)
        for cid, title in chapters:
            (out / f"{cid}.html").write_text(TEMPLATE.format(title=title, book=book.replace("book", "Book").replace("aws", "AWS").replace("gcp", "GCP").replace("azure", "Azure"), vendor=vendor, id=cid, label=label), encoding="utf-8")
        print(f"{book}: {len(chapters)}개 챕터")

if __name__ == "__main__":
    main()
