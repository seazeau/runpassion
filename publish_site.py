import argparse
import datetime
import json
import os
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

from PIL import Image

DATA_JS = "articles_data.js"
DATA_JSON = "articles_data.json"
SITEMAP_FILE = "sitemap.xml"
INDEX_FILE = "index.html"
CONTENT_DIR = os.path.join("content", "shoes")
IMAGES_DIR = "images"
SITE_URL = "https://runpassion.fr"
ABOX_PARAM = "a_box=sc3esau3"


def ensure_abox(url: str) -> str:
    url = (url or "").strip()
    if not url or "top4running" not in url or ABOX_PARAM in url:
        return url
    sep = "&" if "?" in url else "?"
    return f"{url}{sep}{ABOX_PARAM}"


def parse_markdown(file_path: str):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", content, re.DOTALL)
    if not match:
        return None

    yaml_text, body_text = match.group(1), match.group(2)
    metadata = {}
    for line in yaml_text.split("\n"):
        if ":" in line:
            key, val = line.split(":", 1)
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if val.lower() == "true":
                val = True
            elif val.lower() == "false":
                val = False
            metadata[key] = val
    return metadata, body_text


def md_to_html(md: str) -> str:
    paragraphs = md.strip().split("\n\n")
    formatted = []
    for p in paragraphs:
        p = p.strip()
        if not p:
            continue
        if p.startswith("## "):
            formatted.append(f"<h2>{p[3:]}</h2>")
        elif p.startswith("### "):
            formatted.append(f"<h3>{p[4:]}</h3>")
        elif p.startswith("- ") or p.startswith("* "):
            items = [
                f"<li>{ln.strip()[2:]}</li>"
                for ln in p.split("\n")
                if ln.strip().startswith(("- ", "* "))
            ]
            formatted.append(f"<ul>{''.join(items)}</ul>")
        else:
            formatted.append(f"<p>{p.replace(chr(10), '<br>')}</p>")

    html_out = "".join(formatted)
    html_out = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", html_out)
    html_out = re.sub(r"__(.*?)__", r"<strong>\1</strong>", html_out)
    html_out = re.sub(r"\[(.*?)\]\((.*?)\)", r'<a href="\2" target="_blank" rel="noopener noreferrer">\1</a>', html_out)
    return html_out


def load_articles():
    if not os.path.exists(DATA_JS):
        return []
    with open(DATA_JS, "r", encoding="utf-8") as f:
        raw = f.read()
    return json.loads(raw[raw.find("[") : raw.rfind("]") + 1])


def compile_markdown_articles(articles):
    if not os.path.isdir(CONTENT_DIR):
        return articles, 0

    md_files = [fn for fn in os.listdir(CONTENT_DIR) if fn.endswith(".md")]
    if not md_files:
        return articles, 0

    cms_articles = []
    max_id = max((int(a.get("id", 0)) for a in articles if str(a.get("id", "")).isdigit()), default=0)

    for fn in md_files:
        slug = fn[:-3]
        parsed = parse_markdown(os.path.join(CONTENT_DIR, fn))
        if not parsed:
            continue
        meta, body = parsed
        max_id += 1
        art = {
            "id": meta.get("id", max_id),
            "title": meta.get("title", slug),
            "slug": slug,
            "category": meta.get("category", "Tests"),
            "author": meta.get("author", "Vincent"),
            "date": meta.get("date", datetime.date.today().isoformat()),
            "image": meta.get("image", "images/marathon.webp"),
            "featured": bool(meta.get("featured", False)),
            "excerpt": meta.get("excerpt", ""),
            "content": md_to_html(body),
        }
        if meta.get("affiliateLink"):
            art["affiliateLink"] = ensure_abox(str(meta["affiliateLink"]))
        cms_articles.append(art)

    cms_slugs = {a["slug"] for a in cms_articles}
    merged = cms_articles + [a for a in articles if a.get("slug") not in cms_slugs]
    return merged, len(cms_articles)


def optimize_new_images(max_w=1400, quality=82):
    if not os.path.isdir(IMAGES_DIR):
        return 0, 0
    optimized = 0
    saved_bytes = 0
    for fn in os.listdir(IMAGES_DIR):
        p = os.path.join(IMAGES_DIR, fn)
        if not os.path.isfile(p) or os.path.getsize(p) <= 300 * 1024:
            continue
        old_sz = os.path.getsize(p)
        ext = os.path.splitext(p)[1].lower()
        tmp = p + ".tmp"
        try:
            with Image.open(p) as im:
                w, h = im.size
                if w > max_w:
                    im = im.resize((max_w, int(h * max_w / w)), Image.Resampling.LANCZOS)
                if ext == ".webp":
                    im.save(tmp, "WEBP", quality=quality, method=6)
                elif ext in (".jpg", ".jpeg"):
                    if im.mode in ("RGBA", "P"):
                        im = im.convert("RGB")
                    im.save(tmp, "JPEG", quality=quality, optimize=True)
                elif ext == ".png":
                    im.save(tmp, "PNG", optimize=True)
                else:
                    continue
            new_sz = os.path.getsize(tmp)
            if new_sz < old_sz * 0.95:
                os.replace(tmp, p)
                optimized += 1
                saved_bytes += old_sz - new_sz
            else:
                os.remove(tmp)
        except Exception:
            if os.path.exists(tmp):
                os.remove(tmp)
    return optimized, saved_bytes


def sync_data_and_sitemap(articles):
    articles.sort(key=lambda x: str(x.get("date", "")), reverse=True)

    with open(DATA_JS, "w", encoding="utf-8") as f:
        f.write("const wordpressArticles = ")
        f.write(json.dumps(articles, ensure_ascii=False, indent=4))
        f.write(";\n")

    with open(DATA_JSON, "w", encoding="utf-8") as f:
        json.dump(articles, f, ensure_ascii=False, indent=4)

    today = datetime.date.today().isoformat()
    urls = [
        f"   <url>\n      <loc>{SITE_URL}/</loc>\n      <lastmod>{today}</lastmod>\n      <changefreq>daily</changefreq>\n      <priority>1.0</priority>\n   </url>"
    ]
    seen = set()
    for a in articles:
        slug = re.sub(r"^test-", "", (a.get("slug") or "").strip().strip("/"))
        if not slug or slug in seen:
            continue
        seen.add(slug)
        dt = (a.get("date") or today)[:10]
        urls.append(
            f"   <url>\n      <loc>{SITE_URL}/{slug}</loc>\n      <lastmod>{dt}</lastmod>\n      <changefreq>monthly</changefreq>\n      <priority>0.8</priority>\n   </url>"
        )

    with open(SITEMAP_FILE, "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        f.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        f.write("\n".join(urls))
        f.write("\n</urlset>\n")

    return len(urls)


def bump_cache_buster():
    if not os.path.exists(INDEX_FILE):
        return
    stamp = datetime.datetime.now().strftime("%Y%m%d_%H%M")
    with open(INDEX_FILE, "r", encoding="utf-8") as f:
        html_txt = f.read()
    updated = re.sub(
        r'articles_data\.js(\?v=[^"\']*)?',
        f"articles_data.js?v={stamp}",
        html_txt,
        count=1,
    )
    if updated != html_txt:
        with open(INDEX_FILE, "w", encoding="utf-8") as f:
            f.write(updated)


def verify(articles):
    missing_hero = [
        a["image"]
        for a in articles
        if a.get("image") and not a["image"].startswith("http") and not os.path.exists(a["image"].lstrip("/"))
    ]
    ET.parse(SITEMAP_FILE)
    if missing_hero:
        print(f"ATTENTION: {len(missing_hero)} images hero manquantes:", missing_hero[:5])


def git_publish(message: str):
    subprocess.run(["git", "add", "-A"], check=True)
    status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True, check=True)
    if not status.stdout.strip():
        print("Aucun changement a pousser.")
        return
    subprocess.run(["git", "commit", "-m", message], check=True)
    subprocess.run(["git", "push", "origin", "main"], check=True)
    print("Push GitHub reussi ! GitHub Actions deploie sur Hostinger.")


def main():
    parser = argparse.ArgumentParser(description="Publication tout-en-un RunPassion")
    parser.add_argument("--push", action="store_true", help="Commit et push sur GitHub main")
    parser.add_argument("-m", "--message", default="Publication mise a jour RunPassion", help="Message de commit")
    parser.add_argument("--bons-plans", action="store_true", help="Mettre a jour les Bons Plans Flash depuis Top4Running")
    args = parser.parse_args()

    print("1/5 Compilation Markdown (content/shoes)...")
    articles = load_articles()
    articles, cms_count = compile_markdown_articles(articles)
    print(f"    {len(articles)} articles au total ({cms_count} depuis content/shoes).")

    print("2/5 Optimisation des nouvelles images (> 300 Ko)...")
    opt_count, saved = optimize_new_images()
    print(f"    {opt_count} images compressees ({saved / 1024 / 1024:.2f} Mo economises).")

    print("3/5 Synchronisation articles_data.js, articles_data.json et sitemap.xml...")
    url_count = sync_data_and_sitemap(articles)
    print(f"    {url_count} URLs dans sitemap.xml.")

    print("4/5 Mise a jour du cache-buster dans index.html...")
    bump_cache_buster()

    if getattr(args, "bons_plans", False):
        print("    Mise a jour des Bons Plans Flash Top4Running...")
        try:
            import update_bons_plans
            update_bons_plans.main()
        except Exception as e:
            print(f"    (Bons plans ignores: {e})")

    print("5/5 Verification...")
    verify(articles)
    print("    OK !")

    if args.push:
        git_publish(args.message)


if __name__ == "__main__":
    main()
