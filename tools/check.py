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
ICON_KEYS = {"users", "dns", "edge", "lb", "nat", "vm", "db", "obj", "cache", "secret", "mon", "net", "sub", "fw", "pin"}

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


def main():
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
