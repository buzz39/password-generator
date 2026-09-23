#!/usr/bin/env python3
"""Refresh <lastmod> in sitemap.xml from each page's real last commit date.

Run from the repo root after any content change:  python3 gen_sitemap.py

Idempotent: only the lastmod lines are rewritten, everything else is untouched.
Dates come from git history, so they cannot drift the way `new Date()` does.
"""
import datetime
import pathlib
import re
import subprocess
import sys
import urllib.parse
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parent
SITEMAP = ROOT / "sitemap.xml"
NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}


def target_file(url: str) -> pathlib.Path:
    path = urllib.parse.urlparse(url).path
    return ROOT / ("index.html" if path in ("", "/") else path.lstrip("/"))


def last_commit_date(path: pathlib.Path) -> str:
    out = subprocess.run(
        ["git", "log", "-1", "--format=%cs", "--", path.name],
        cwd=ROOT, capture_output=True, text=True,
    ).stdout.strip()
    if not out:
        sys.exit(f"ERROR: {path.name} is not tracked by git - cannot date it")
    return out


def main() -> None:
    xml = SITEMAP.read_text(encoding="utf-8")
    urls = [e.text for e in ET.fromstring(xml).findall(".//s:loc", NS) if e.text]
    assert urls, "no <loc> entries in sitemap.xml"

    today = datetime.date.today().isoformat()
    for url in urls:
        page = target_file(url)
        if not page.exists():
            sys.exit(f"ERROR: {url} -> {page.name} does not exist")
        date = last_commit_date(page)
        assert re.fullmatch(r"\d{4}-\d{2}-\d{2}", date), f"bad date {date!r}"
        assert date <= today, f"{page.name}: lastmod {date} is in the future"
        block = re.compile(r"(<loc>" + re.escape(url) + r"</loc>\n)(\s*<lastmod>[^<]*</lastmod>\n)?")
        xml, n = block.subn(lambda m: f"{m.group(1)}    <lastmod>{date}</lastmod>\n", xml)
        assert n == 1, f"{url}: matched {n} <loc> blocks, expected 1"
        print(f"  {date}  {url}")

    # every <url> must now carry a lastmod, in schema order
    root = ET.fromstring(xml)
    for u in root.findall("s:url", NS):
        kids = [c.tag.split("}")[1] for c in u]
        assert kids[0] == "loc" and kids[1] == "lastmod", f"bad child order: {kids}"
        stamp_el = u.find("s:lastmod", NS)
        assert stamp_el is not None and len(stamp_el.text or "") == 10, "malformed lastmod"

    SITEMAP.write_text(xml, encoding="utf-8")
    print(f"sitemap.xml: {len(urls)} urls dated from git history")


if __name__ == "__main__":
    main()
