from email.utils import parsedate_to_datetime
import html
import json
import os
import re

TEMPLATE_FILE = "index.html"
DATA_FILE = "articles_data.js"
OUT_DIR = "pages"
SITE_URL = "https://runpassion.fr"


def normalize_iso_date(raw_date: str) -> str:
    s = (raw_date or "").strip()
    if re.match(r"^\d{4}-\d{2}-\d{2}", s):
        return s[:10]
    try:
        return parsedate_to_datetime(s).date().isoformat()
    except Exception:
        return "2026-11-14"


def clean_slug(slug: str) -> str:
    return re.sub(r"^test-", "", (slug or "").strip().strip("/"))


def strip_html(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", text or "")).strip()


def full_img_url(img: str) -> str:
    if not img:
        return f"{SITE_URL}/RUN.png"
    if img.startswith("http"):
        return img
    return f"{SITE_URL}/{img.lstrip('/')}"


def main():
    with open(TEMPLATE_FILE, "r", encoding="utf-8") as f:
        template = f.read()

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        raw = f.read()

    articles = json.loads(raw[raw.find("[") : raw.rfind("]") + 1])

    os.makedirs(OUT_DIR, exist_ok=True)

    generated = 0
    seen = set()

    for art in articles:
        slug = clean_slug(art.get("slug", ""))
        if not slug or slug in seen:
            continue
        seen.add(slug)

        title = strip_html(art.get("title", "RunPassion"))
        full_title = f"{title} | RunPassion"
        desc = strip_html(art.get("excerpt") or art.get("content", ""))[:160].strip()
        url = f"{SITE_URL}/{slug}"
        img_url = full_img_url(art.get("image", ""))
        date_pub = normalize_iso_date(art.get("date", ""))
        author = art.get("author") or "Vincent Buisson"
        category = strip_html(art.get("category") or "Articles")
        word_count = len(strip_html(art.get("content", "")).split())

        e_title = html.escape(full_title, quote=True)
        e_desc = html.escape(desc, quote=True)
        e_url = html.escape(url, quote=True)
        e_img = html.escape(img_url, quote=True)

        ld_json = json.dumps(
            {
                "@context": "https://schema.org",
                "@graph": [
                    {
                        "@type": "BlogPosting",
                        "headline": title,
                        "description": desc,
                        "image": img_url,
                        "datePublished": date_pub,
                        "articleSection": category,
                        "wordCount": word_count,
                        "author": {"@type": "Person", "name": author},
                        "publisher": {
                            "@type": "Organization",
                            "name": "RunPassion",
                            "url": f"{SITE_URL}/",
                        },
                        "mainEntityOfPage": {
                            "@type": "WebPage",
                            "@id": url,
                        },
                    },
                    {
                        "@type": "BreadcrumbList",
                        "itemListElement": [
                            {
                                "@type": "ListItem",
                                "position": 1,
                                "name": "Accueil",
                                "item": f"{SITE_URL}/",
                            },
                            {
                                "@type": "ListItem",
                                "position": 2,
                                "name": category,
                                "item": f"{SITE_URL}/#articles",
                            },
                            {
                                "@type": "ListItem",
                                "position": 3,
                                "name": title,
                                "item": url,
                            },
                        ],
                    },
                ],
            },
            ensure_ascii=False,
        ).replace("</", "<\\/")

        seo_block = f"""<base href="/">
    <title id="meta-title">{e_title}</title>
    <meta name="description" id="meta-desc" content="{e_desc}">
    <link rel="canonical" id="canonical-url" href="{e_url}">

    <!-- OPEN GRAPH & TWITTER -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="{e_url}">
    <meta property="og:title" content="{e_title}">
    <meta property="og:description" content="{e_desc}">
    <meta property="og:image" content="{e_img}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{e_title}">
    <meta name="twitter:description" content="{e_desc}">
    <meta name="twitter:image" content="{e_img}">
    <script type="application/ld+json" id="json-ld-schema">{ld_json}</script>"""

        # Replace the <title>...<meta og:image/twitter:*> block in template (lambda prevents \n unescaping)
        page_html = re.sub(
            r'<title id="meta-title">.*?</title>.*?<meta property="og:image"[^>]*>(?:\s*<meta name="twitter:[^>]*>)*',
            lambda _: seo_block,
            template,
            count=1,
            flags=re.DOTALL,
        )

        # Inject noscript SEO content right before </body> for crawlers that don't run JS
        noscript_seo = (
            f'<noscript><article style="max-width:800px;margin:2rem auto;padding:1rem;color:#fff;">'
            f'<h1>{html.escape(title)}</h1>'
            f'<p>{html.escape(desc)}</p>'
            f'{art.get("content", "")}'
            f'</article></noscript>\n</body>'
        )
        page_html = page_html.replace("</body>", noscript_seo, 1)

        out_path = os.path.join(OUT_DIR, f"{slug}.html")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(page_html)
        generated += 1

    print(f"Generated {generated} SEO HTML pages in {OUT_DIR}/")


if __name__ == "__main__":
    main()
