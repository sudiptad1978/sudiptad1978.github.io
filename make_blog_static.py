#!/usr/bin/env python3
"""Pre-render the blog fallback markup while keeping client-side enhancement."""
from __future__ import annotations

import html
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONTENT = ROOT / "content" / "blog"
ROUTES = ROOT / "blog"


def parse_frontmatter(source: str) -> tuple[dict, str]:
    match = re.match(r"^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$", source)
    if not match:
        return {}, source
    data = {}
    for line in match.group(1).splitlines():
        if ":" not in line:
            continue
        key, raw = line.split(":", 1)
        raw = raw.strip()
        if raw.startswith("["):
            try:
                data[key.strip()] = json.loads(raw.replace("'", '"'))
            except json.JSONDecodeError:
                data[key.strip()] = []
        else:
            data[key.strip()] = raw.strip("'\"")
    return data, match.group(2)


def esc(value: object) -> str:
    return html.escape(str(value), quote=True)


def inline_markdown(value: str) -> str:
    value = esc(value)
    value = re.sub(
        r"!\[([^\]]+)\]\((\/[^\s)]+|https?:\/\/[^\s)]+)\)",
        r'<figure class="post-figure"><img src="\2" alt="\1" loading="lazy"><figcaption>\1</figcaption></figure>',
        value,
    )
    value = re.sub(
        r"\[([^\]]+)\]\((#[^\s)]+)\)",
        r'<a href="\2">\1</a>',
        value,
    )
    value = re.sub(
        r"\[([^\]]+)\]\((\/[^\s)]+|https?:\/\/[^\s)]+)\)",
        r'<a href="\2" target="_blank" rel="noopener noreferrer">\1 ↗</a>',
        value,
    )
    value = re.sub(r"`([^`]+)`", r"<code>\1</code>", value)
    value = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", value)
    value = re.sub(r"__([^_]+)__", r"<strong>\1</strong>", value)
    value = re.sub(r"\*([^*]+)\*", r"<em>\1</em>", value)
    value = re.sub(r"_([^_]+)_", r"<em>\1</em>", value)
    return value


def split_table_row(line: str) -> list[str] | None:
    stripped = line.strip()
    if "|" not in stripped:
        return None
    if stripped.startswith("|"):
        stripped = stripped[1:]
    if stripped.endswith("|"):
        stripped = stripped[:-1]
    cells = [cell.strip() for cell in stripped.split("|")]
    return cells if len(cells) > 1 else None


def is_table_separator(line: str) -> bool:
    cells = split_table_row(line)
    return bool(cells and all(re.fullmatch(r":?-{3,}:?", cell) for cell in cells))


def slugify_heading(value: str) -> str:
    value = value.lower().strip().replace("`", "")
    value = re.sub(r"[^a-z0-9\s-]", "", value)
    return re.sub(r"\s+", "-", value)


def render_table(headers: list[str], rows: list[list[str]]) -> str:
    header_html = "".join(f'<th scope="col">{inline_markdown(cell)}</th>' for cell in headers)
    row_html = "".join(
        "<tr>" + "".join(
            f'<td>{inline_markdown(row[index] if index < len(row) else "")}</td>'
            for index in range(len(headers))
        ) + "</tr>"
        for row in rows
    )
    return f'<div class="post-table-wrap"><table><thead><tr>{header_html}</tr></thead><tbody>{row_html}</tbody></table></div>'


def render_markdown(source: str) -> str:
    lines = source.replace("\r\n", "\n").splitlines()
    output: list[str] = []
    paragraph: list[str] = []
    list_type: str | None = None
    list_items: list[str] = []
    in_code = False
    code_language = "text"
    code_lines: list[str] = []

    def flush_paragraph() -> None:
        if paragraph:
            output.append(f"<p>{inline_markdown(' '.join(paragraph))}</p>")
            paragraph.clear()

    def flush_list() -> None:
        nonlocal list_type
        if list_type:
            output.append(f"<{list_type}>{''.join(list_items)}</{list_type}>")
            list_type = None
            list_items.clear()

    def flush_code() -> None:
        nonlocal in_code, code_language
        if in_code:
            output.append(
                f'<pre><code class="language-{esc(code_language)}">{esc(chr(10).join(code_lines))}</code></pre>'
            )
            in_code = False
            code_language = "text"
            code_lines.clear()

    index = 0
    while index < len(lines):
        line = lines[index]
        if line.strip().startswith("```"):
            if in_code:
                flush_code()
            else:
                flush_paragraph()
                flush_list()
                in_code = True
                code_language = line.strip()[3:].strip() or "text"
            index += 1
            continue
        if in_code:
            code_lines.append(line)
            index += 1
            continue
        if not line.strip():
            flush_paragraph()
            flush_list()
            index += 1
            continue
        if line.strip() == "---":
            flush_paragraph()
            flush_list()
            output.append("<hr>")
            index += 1
            continue
        table_header = split_table_row(line)
        if table_header and index + 1 < len(lines) and is_table_separator(lines[index + 1]):
            flush_paragraph()
            flush_list()
            rows: list[list[str]] = []
            index += 2
            while index < len(lines):
                row = split_table_row(lines[index])
                if not row or not lines[index].strip():
                    break
                rows.append(row)
                index += 1
            output.append(render_table(table_header, rows))
            continue
        heading = re.match(r"^(#{2,4})\s+(.+)$", line)
        if heading:
            flush_paragraph()
            flush_list()
            level = min(len(heading.group(1)), 4)
            output.append(f'<h{level} id="{slugify_heading(heading.group(2))}">{inline_markdown(heading.group(2))}</h{level}>')
            index += 1
            continue
        quote = re.match(r"^>\s?(.*)$", line)
        if quote:
            flush_paragraph()
            flush_list()
            output.append(f"<blockquote>{inline_markdown(quote.group(1))}</blockquote>")
            index += 1
            continue
        unordered = re.match(r"^[-*]\s+(.+)$", line)
        ordered = re.match(r"^\d+\.\s+(.+)$", line)
        if unordered or ordered:
            flush_paragraph()
            current = "ul" if unordered else "ol"
            if list_type != current:
                flush_list()
                list_type = current
            match = unordered or ordered
            list_items.append(f"<li>{inline_markdown(match.group(1))}</li>")
            index += 1
            continue
        flush_list()
        paragraph.append(line.strip())
        index += 1

    flush_code()
    flush_paragraph()
    flush_list()
    return "\n".join(output)


def load_posts() -> list[dict]:
    entries = json.loads((CONTENT / "index.json").read_text())
    posts = []
    for entry in entries:
        source = (ROOT / entry["file"].lstrip("/")).read_text()
        data, body = parse_frontmatter(source)
        posts.append({**entry, **data, "content": body})
    return sorted(posts, key=lambda post: post.get("date", ""), reverse=True)


def format_date(value: str) -> str:
    return date.fromisoformat(value).strftime("%d %b %Y")


def tags_html(post: dict, prefix: str) -> str:
    return "".join(
        f'<span data-automation-id="{prefix}-tag-{index}">{esc(tag)}</span>'
        for index, tag in enumerate(post.get("tags", []), 1)
    )


def card_html(post: dict, index: int) -> str:
    return f'''<a class="post-card {"featured-post" if index == 0 else ""}" data-automation-id="post-card-{index + 1}" href="/blog/{esc(post["slug"])}" aria-label="Read article: {esc(post["title"])}">
          <div class="post-card-meta" data-automation-id="post-card-meta-{index + 1}"><span>{esc(format_date(post["date"]))}</span><span>{esc(post.get("readTime", "Technical note"))}</span></div>
          <h2 data-automation-id="post-card-title-{index + 1}">{esc(post["title"])}</h2>
          <p data-automation-id="post-card-summary-{index + 1}">{esc(post.get("summary", ""))}</p>
          <div class="post-card-footer" data-automation-id="post-card-footer-{index + 1}"><span>{tags_html(post, f"post-card-{index + 1}")}</span><span class="post-arrow" aria-hidden="true">Read note ↗</span></div>
        </a>'''


def meta_html(post: dict) -> str:
    return f'''<div id="postMeta" class="post-meta" aria-live="polite" data-automation-id="element-postmeta-15" data-static-post="true">
          <div class="post-kicker" data-automation-id="post-kicker"><span class="eyebrow-line"></span> {esc(format_date(post["date"]))} · {esc(post.get("readTime", "Technical note"))}</div>
          <h1 data-automation-id="post-title">{esc(post["title"])}</h1>
          <p class="post-summary" data-automation-id="post-summary">{esc(post.get("summary", ""))}</p>
          <div class="post-tags" data-automation-id="post-tags">{tags_html(post, "post")}</div>
        </div>'''


def replace_between(source: str, start_marker: str, end_marker: str, replacement: str) -> str:
    start = source.index(start_marker)
    end = source.index(end_marker, start)
    return source[:start] + replacement + source[end:]


def render_index(posts: list[dict]) -> None:
    cards = "\n".join(card_html(post, index) for index, post in enumerate(posts))
    wrapper = f'''<div id="postList" class="post-list" aria-live="polite" data-automation-id="element-postlist-17" data-static-post-list="true">
        {cards}
      </div>'''
    for path in (ROUTES / "index.html", ROOT / "blog.html"):
        if not path.exists():
            continue
        source = path.read_text()
        source = replace_between(source, '<div id="postList"', "\n      </section>", wrapper + "\n")
        path.write_text(source)


def render_routes(posts: list[dict]) -> None:
    by_slug = {post["slug"]: post for post in posts}
    for slug, post in by_slug.items():
        path = ROUTES / slug / "index.html"
        if not path.exists():
            continue
        source = path.read_text()
        replacement = meta_html(post) + f'''\n        <article id="postContent" class="post-content" aria-live="polite" data-automation-id="element-postcontent-1" data-static-post-content="true">
          {render_markdown(post["content"])}
        </article>\n'''
        source = replace_between(source, '<div id="postMeta"', '\n        <div id="postError"', replacement)
        path.write_text(source)


def main() -> None:
    posts = load_posts()
    render_index(posts)
    render_routes(posts)
    print(f"Pre-rendered {len(posts)} blog posts.")


if __name__ == "__main__":
    main()
