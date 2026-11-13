import html as htmllib
import json
import re
import urllib.request

INDEX_FILE = "index.html"
ABOX = "a_box=sc3esau3"
HEADERS = {"User-Agent": "Mozilla/5.0"}

CANDIDATE_URLS = [
    "https://top4running.fr/c/running-chaussures-de-running",
    "https://top4running.fr/c/soldes-top4running-fr",
]

KNOWN_BRANDS = [
    "Asics",
    "Adidas",
    "Nike",
    "Saucony",
    "Hoka",
    "New Balance",
    "Brooks",
    "Salomon",
    "On Running",
    "Puma",
    "Mizuno",
]


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers=HEADERS)
    return urllib.request.urlopen(req, timeout=10).read().decode("utf-8", "ignore")


def parse_euro(val: str) -> float:
    return float(val.replace("€", "").replace("\xa0", "").replace(" ", "").replace(",", ".").strip())


def format_euro(val: float) -> str:
    return f"{val:.2f}".replace(".", ",") + "€"


def extract_brand_model(title: str):
    t = re.sub(r"\s*[-|].*$", "", title).strip()
    for b in KNOWN_BRANDS:
        if t.lower().startswith(b.lower()):
            model = t[len(b):].strip(" -")
            return b, model[:28]
    parts = t.split(" ", 1)
    return parts[0], (parts[1] if len(parts) > 1 else t)[:28]


def inspect_product(slug_path: str):
    url = f"https://top4running.fr{slug_path}"
    h = fetch(url)
    title_m = re.search(r"<h1[^>]*>(.*?)</h1>", h, re.S)
    img_m = re.search(r'<meta property="og:image" content="([^"]+)"', h)
    if not title_m or not img_m:
        return None

    title = htmllib.unescape(re.sub(r"<[^>]+>", "", title_m.group(1))).strip()
    img = img_m.group(1).strip()

    # Extract euro prices from page, ignoring the 75€ free-shipping banner
    euros = re.findall(r"€\s*[0-9]+,[0-9]{2}|[0-9]+,[0-9]{2}\s*€", h)
    vals = []
    for e in euros:
        try:
            v = parse_euro(e)
            if 76.0 <= v <= 400.0 and v not in vals:
                vals.append(v)
        except ValueError:
            pass

    if len(vals) < 2:
        return None

    old_p = max(vals[:2])
    new_p = min(vals[:2])
    disc = round((1 - new_p / old_p) * 100)
    if disc < 10 or disc > 75:
        return None

    brand, model = extract_brand_model(title)
    return {
        "brand": brand,
        "model": model,
        "image": img,
        "oldPrice": format_euro(old_p),
        "newPrice": format_euro(new_p),
        "discount": f"-{disc}%",
        "link": f"{url}?{ABOX}",
    }


def main():
    seen_slugs = set()
    candidates = []
    for u in CANDIDATE_URLS:
        try:
            h = fetch(u)
            for p in re.findall(r'/p/[a-z0-9\-]+', h):
                if p not in seen_slugs and ("shoe" in p or "superblast" in p or "adios" in p or "cloudboom" in p or "azura" in p or "vomero" in p or "pegasus" in p or "metaspeed" in p):
                    seen_slugs.add(p)
                    candidates.append(p)
        except Exception:
            pass

    deals = []
    used_models = set()
    for p in candidates[:25]:
        try:
            item = inspect_product(p)
            if not item:
                continue
            key = (item["brand"].lower(), item["model"].split(" ")[0].lower())
            if key in used_models:
                continue
            used_models.add(key)
            deals.append(item)
            if len(deals) >= 5:
                break
        except Exception:
            continue

    if len(deals) < 3:
        print("Pas assez de promos recuperees, index.html inchange.")
        return

    with open(INDEX_FILE, "r", encoding="utf-8") as f:
        html_txt = f.read()

    js_lines = ["const bonsPlansData = ["]
    for i, d in enumerate(deals):
        comma = "," if i < len(deals) - 1 else ""
        js_lines.append(f"            {json.dumps(d, ensure_ascii=False)}{comma}")
    js_lines.append("        ];")
    new_block = "\n".join(js_lines)

    updated = re.sub(
        r"const bonsPlansData = \[.*?\];",
        new_block,
        html_txt,
        count=1,
        flags=re.DOTALL,
    )

    if updated != html_txt:
        with open(INDEX_FILE, "w", encoding="utf-8") as f:
            f.write(updated)
        print(f"Bons Plans Flash mis a jour avec {len(deals)} promos Top4Running !")
    else:
        print("Aucun changement dans bonsPlansData.")


if __name__ == "__main__":
    main()
