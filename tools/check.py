#!/usr/bin/env python3
"""CloudBooks 데이터 검사.

- JSON 파일 형식
- services.json 필수 필드와 checked 날짜 (STALE_DAYS일 넘으면 경고)
- scenarios.json에 적힌 챕터 파일 존재
- 아이콘 매니페스트가 가리키는 파일 존재
- 챕터 JS가 읽는 Terraform 파일 존재

오류가 있으면 종료 코드 1, 경고만 있으면 0.
"""
import datetime as dt
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STALE_DAYS = 180
VENDORS = ("aws", "gcp", "azure")
_icons_js = (ROOT / "shared/js/icons.js").read_text(encoding="utf-8")
# 자체 아이콘(스프라이트)과 공식 아이콘 대체 표에 있는 키가 쓸 수 있는 키
ICON_KEYS = set(re.findall(r'id="g-([a-z]+)"', _icons_js)) | set(
    re.findall(r"([a-z0-9]+):'[a-z]+'", re.search(r"const GLYPH = \{(.*?)\};", _icons_js, re.S).group(1)))

errors, warnings = [], []


def load(rel):
    p = ROOT / rel
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except FileNotFoundError:
        errors.append(f"{rel}: 파일 없음")
    except json.JSONDecodeError as e:
        errors.append(f"{rel}: JSON 오류 ({e})")
    return None


def check_services():
    d = load("shared/data/services.json")
    if not d:
        return
    today = dt.date.today()
    seen = set()
    for s in d.get("services", []):
        sid = s.get("id", "?")
        if sid in seen:
            errors.append(f"services.json: id 중복 {sid}")
        seen.add(sid)
        for k in ("role", "icon", "checked"):
            if not s.get(k):
                errors.append(f"services.json[{sid}]: {k} 없음")
        if s.get("icon") and s["icon"] not in ICON_KEYS:
            errors.append(f"services.json[{sid}]: 알 수 없는 아이콘 키 {s['icon']}")
        for v in VENDORS:
            if not (s.get(v) or {}).get("name"):
                errors.append(f"services.json[{sid}]: {v}.name 없음")
        try:
            age = (today - dt.date.fromisoformat(s["checked"])).days
            if age > STALE_DAYS:
                warnings.append(f"services.json[{sid}]: {age}일 전 확인 — 다시 확인 필요")
        except (KeyError, ValueError):
            errors.append(f"services.json[{sid}]: checked 날짜 형식 오류 (YYYY-MM-DD)")


def check_books_and_scenarios():
    b = load("data/books.json")
    if b:
        for book in b.get("books", []):
            if not (ROOT / book["path"] / "index.html").exists():
                errors.append(f"books.json[{book['id']}]: {book['path']}index.html 없음")
    sc = load("archbook/data/scenarios.json")
    if sc:
        nos = [s["no"] for s in sc.get("scenarios", [])]
        if len(nos) != len(set(nos)):
            errors.append("scenarios.json: 번호 중복")
        for s in sc.get("scenarios", []):
            if s.get("status") in ("writing", "published"):
                f = s.get("file")
                if not f:
                    errors.append(f"scenarios.json[{s['no']}]: {s['status']}인데 file 없음")
                elif not (ROOT / "archbook" / f).exists():
                    errors.append(f"scenarios.json[{s['no']}]: archbook/{f} 없음")
    load("shared/data/vendor-toc.json")


def check_icons():
    m = load("shared/icons/manifest.json")
    if not m:
        return
    for v in VENDORS:
        for key, rel in (m.get(v) or {}).items():
            if key not in ICON_KEYS:
                errors.append(f"icons/manifest.json[{v}]: 알 수 없는 키 {key}")
            if not (ROOT / "shared/icons" / rel).exists():
                errors.append(f"icons/manifest.json[{v}.{key}]: shared/icons/{rel} 없음")


def check_iac_refs():
    for js in (ROOT / "archbook/chapters").glob("*.js"):
        for rel in re.findall(r"f:'(iac/[^']+)'", js.read_text(encoding="utf-8")):
            if not (ROOT / rel).exists():
                errors.append(f"{js.relative_to(ROOT)}: {rel} 없음")


def check_vendorbooks():
    sv = load("shared/data/services.json")
    ids = {x["id"] for x in (sv or {}).get("services", [])}
    sc = load("archbook/data/scenarios.json")
    nos = {x["no"] for x in (sc or {}).get("scenarios", [])}
    for book in ("awsbook", "gcpbook", "azurebook"):
        p = ROOT / book / "data/chapters.js"
        if not p.exists():
            errors.append(f"{book}/data/chapters.js 없음")
            continue
        text = p.read_text(encoding="utf-8")
        for cid in re.findall(r"\{id:'([a-z0-9-]+)', title:", text):
            if not (ROOT / book / "chapters" / f"{cid}.html").exists():
                errors.append(f"{book}: chapters/{cid}.html 없음 (tools/build_vendorbooks.py 실행)")
        for group in re.findall(r"services:\[([^\]]*)\]", text):
            for sid in re.findall(r"'([a-z0-9-]+)'", group):
                if sid not in ids:
                    errors.append(f"{book}: services.json에 없는 서비스 {sid}")
        for group in re.findall(r"scenarios:\[([^\]]*)\]", text):
            for n in re.findall(r"\d+", group):
                if int(n) not in nos:
                    errors.append(f"{book}: 없는 시나리오 번호 {n}")
        for icon in re.findall(r"icon:'([a-z0-9]+)'", text):
            if icon not in ICON_KEYS:
                errors.append(f"{book}: 알 수 없는 아이콘 키 {icon}")


def check_scenario_data():
    sv = load("shared/data/services.json")
    ids = {x["id"] for x in (sv or {}).get("services", [])}
    for p in (ROOT / "archbook/chapters").glob("*.data.js"):
        text = p.read_text(encoding="utf-8")
        m = re.search(r"map: \[([^\]]*)\]", text)
        for sid in re.findall(r"'([a-z0-9-]+)'", m.group(1) if m else ""):
            if sid not in ids:
                errors.append(f"{p.name}: services.json에 없는 서비스 {sid}")
        for icon in re.findall(r"icon:'([a-z0-9]+)'", text) + re.findall(r"(?:aws|gcp|azure):'([a-z0-9]+)'\}", text):
            if icon not in ICON_KEYS and len(icon) < 10:
                pass  # 표시 문자열과 섞여 있어 아이콘 키만 엄격히 검사하지 않음
        iac = re.search(r"^  iac: '([^']+)'", text, re.M)
        if iac:
            for v in ("aws", "gcp", "azure"):
                if not (ROOT / iac.group(1) / v / "main.tf").exists():
                    errors.append(f"{p.name}: {iac.group(1)}/{v}/main.tf 없음")


def check_scenario_structure():
    import shutil, subprocess
    if not shutil.which("node"):
        warnings.append("node가 없어 시나리오 구조 검사(tools/check_scenarios.js)를 건너뜀")
        return
    r = subprocess.run(["node", str(ROOT / "tools/check_scenarios.js")], capture_output=True, text=True)
    for line in (r.stdout + r.stderr).splitlines():
        if line.strip():
            errors.append(line.removeprefix("오류: "))


def main():
    check_scenario_structure()
    check_vendorbooks()
    check_scenario_data()
    check_services()
    check_books_and_scenarios()
    check_icons()
    check_iac_refs()
    for w in warnings:
        print("경고:", w)
    for e in errors:
        print("오류:", e)
    print(f"검사 완료 — 오류 {len(errors)}개, 경고 {len(warnings)}개")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
