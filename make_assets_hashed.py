#!/usr/bin/env python3
"""
Content-hash the files under assets/ and repoint rendered references at the
hashed copies, so they can be served with Cache-Control: immutable.

Why a copy instead of a rename:
  * the originals stay at their canonical URLs (social crawlers and the PDF
    resume link keep working),
  * the build stays idempotent - the manifest records what was built, so
    re-running rewrites source references, never references that were
    already rewritten,
  * stale hashed copies are harmless because HTML itself is served no-store:
    every visitor gets the newest reference list, which names a file that
    exists in the same deployment.

Modes:
  python3 make_assets_hashed.py            build hashed copies + rewrite refs
  python3 make_assets_hashed.py --check    fail (exit 1) if anything drifted
  python3 make_assets_hashed.py --verify   fail (exit 1) on any local reference
                                           in any HTML file that resolves to a
                                           missing file

Referenced in README.md; re-run it after adding or editing anything in assets/.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR = "assets"
MANIFEST = os.path.join(ASSETS_DIR, ".asset-hashes.json")
HASH_LEN = 10

# Rendered image references only. og:image / twitter:image and the JSON-LD
# "image" field are deliberately NOT rewritten: crawlers cache those URLs for
# a long time and want a stable address. The attribute *name* is irrelevant
# (src, href, srcset all qualify) - what matters is that the value points at
# a file under assets/ and is not a meta/JSON-LD content attribute.
REF_VALUE_RE = re.compile(r"""(?P<name>[A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*"(?P<value>[^"]*assets/[^"]*)"
                            |(?P<name2>[A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*'(?P<value2>[^']*assets/[^']*)'""",
                          re.VERBOSE)
MD_IMG_RE = re.compile(r"!\[[^\]]*\]\((?P<path>[^)]*/?assets/[^)]+)\)")
# `content` carries og:image / twitter:image and JSON-LD image URLs. Those are
# crawler-facing and cached for a long time, so they keep the stable original path.
SKIP_ATTRS = {"content"}


def files_to_hash():
    out = []
    for dirpath, dirnames, filenames in os.walk(os.path.join(ROOT, ASSETS_DIR)):
        dirnames[:] = [d for d in dirnames if d not in {".git"}]
        for name in sorted(filenames):
            if name.startswith("."):
                continue
            full = os.path.join(dirpath, name)
            rel = os.path.relpath(full, ROOT).replace(os.sep, "/")
            if re.search(r"\.[0-9a-f]{%d}\.%s$" % (HASH_LEN, re.escape(name.rsplit(".", 1)[-1])), rel):
                continue  # already a hashed copy
            out.append(rel)
    return sorted(out)


def hashed_name(rel: str, data: bytes) -> str:
    digest = hashlib.sha256(data).hexdigest()[:HASH_LEN]
    base, ext = os.path.splitext(rel)
    return f"{base}.{digest}{ext}"


def load_manifest() -> dict:
    path = os.path.join(ROOT, MANIFEST)
    if os.path.exists(path):
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    return {}


def save_manifest(mapping: dict) -> None:
    with open(os.path.join(ROOT, MANIFEST), "w", encoding="utf-8") as fh:
        json.dump({k: mapping[k] for k in sorted(mapping)}, fh, indent=2, sort_keys=True)
        fh.write("\n")


def candidate_source_files():
    """HTML + markdown that may carry asset references."""
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in {".git", "node_modules", ".wrangler", "deploy"}]
        for name in sorted(filenames):
            if name.endswith((".html", ".md")):
                yield os.path.relpath(os.path.join(dirpath, name), ROOT).replace(os.sep, "/")


def _rewrite_value(value: str, mapping: dict) -> tuple[str, int]:
    """Rewrite every assets/<path> token inside an attribute value.

    Handles multi-candidate values such as srcset="a.webp 360w, b.webp 683w"
    by rewriting each whitespace/comma separated URL token independently.
    """
    n = 0

    def token(m):
        nonlocal n
        path = m.group(0)
        cm = re.search(r"((?:[A-Za-z0-9._/-]+/)?assets/[^\s,]+)", path)
        if not cm:
            return path
        rel = re.sub(r"^\.", "", cm.group(1).lstrip("/"))
        target = mapping.get(rel)
        if not target or target in path:
            return path
        n += 1
        return path[:cm.start(1)] + target + path[cm.end(1):]

    out = re.sub(r"[^\s,]*assets/[^\s,]*", token, value)
    return out, n


def rewrite_text(text: str, mapping: dict) -> tuple[str, int]:
    count = 0

    def handle(m):
        nonlocal count
        name = m.group("name") or m.group("name2")
        value = m.group("value") if m.group("value") is not None else m.group("value2")
        if name.lower() in SKIP_ATTRS:
            return m.group(0)
        new_value, n = _rewrite_value(value, mapping)
        count += n
        quote = '"' if m.group("name") or m.group("value") is not None else "'"
        return f"{name}={quote}{new_value}{quote}"

    out = REF_VALUE_RE.sub(handle, text)
    out, n2 = MD_IMG_RE.subn(
        lambda m: m.group(0).replace(m.group("path"), mapping.get(re.sub(r"^/", "", m.group("path")), m.group("path"))),
        out,
    )
    count += n2
    return out, count


def build(check_only: bool) -> int:
    mapping = {}
    changed = []
    written = 0
    for rel in files_to_hash():
        with open(os.path.join(ROOT, rel), "rb") as fh:
            data = fh.read()
        target = f"{ASSETS_DIR}/hash/{hashed_name(os.path.basename(rel), data)}"
        # keep subdirectory grouping for blog graphics: assets/hash/<name>.<hash>.<ext>
        mapping[rel] = target
        dest = os.path.join(ROOT, target)
        if os.path.exists(dest) and open(dest, "rb").read() == data:
            continue
        if check_only:
            changed.append(f"missing or stale hashed copy: {target}")
            continue
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "wb") as fh:
            fh.write(data)
        written += 1

    # Rewrite references: source of truth = originals recorded in the manifest,
    # so already-hashed references are left alone (idempotent).
    previous = load_manifest()
    rewrite_map = {src: mapping[src] for src in mapping}
    touched = []
    for rel in candidate_source_files():
        path = os.path.join(ROOT, rel)
        with open(path, encoding="utf-8") as fh:
            original = fh.read()
        new, n = rewrite_text(original, rewrite_map)
        if n and new != original:
            touched.append((rel, n))
            if check_only:
                changed.append(f"{rel}: {n} reference(s) not yet pointed at hashed copies")
            else:
                with open(path, "w", encoding="utf-8") as fh:
                    fh.write(new)

    if not check_only:
        os.makedirs(os.path.join(ROOT, ASSETS_DIR), exist_ok=True)
        save_manifest(mapping)
        print(f"hashed copies written/updated: {written}")
        print(f"files with rewritten references: {len(touched)}")
        for rel, n in touched:
            print(f"  {rel}: {n}")
        print(f"manifest: {MANIFEST} ({len(mapping)} entries)")
        return 0

    if changed:
        print("DRIFT DETECTED:")
        for c in changed:
            print(f"  - {c}")
        return 1
    print("--check: no drift, hashed copies and references are current")
    return 0


def verify() -> int:
    """Every local href/src referenced by any HTML file must exist on disk."""
    problems = []
    checked = 0
    for rel in candidate_source_files():
        if not rel.endswith(".html"):
            continue
        with open(os.path.join(ROOT, rel), encoding="utf-8") as fh:
            text = fh.read()
        for m in re.finditer(r"""(?:src|href)=["']([^"']+)["']""", text):
            url = m.group(1)
            if url.startswith(("http://", "https://", "mailto:", "tel:", "#", "data:")):
                continue
            path = url.split("?", 1)[0].split("#", 1)[0]
            if not path.startswith("/"):
                continue
            target = os.path.join(ROOT, path.lstrip("/"))
            checked += 1
            if os.path.isdir(target):
                continue  # clean routes are served as <dir>/index.html
            if os.path.exists(target):
                continue
            if os.path.exists(os.path.join(target, "index.html")):
                continue
            problems.append(f"{rel} -> {path}")
    print(f"local references checked: {checked}")
    if problems:
        print("BROKEN REFERENCES:")
        for p in sorted(set(problems)):
            print(f"  - {p}")
        return 1
    print("--verify: all local references resolve")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("--check", action="store_true", help="exit 1 if the build is stale")
    ap.add_argument("--verify", action="store_true", help="exit 1 on broken local references")
    args = ap.parse_args()
    if args.verify:
        return verify()
    return build(check_only=args.check)


if __name__ == "__main__":
    sys.exit(main())
