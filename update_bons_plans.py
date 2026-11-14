from datetime import date
import html as htmllib
import io
import json
import os
import re
import urllib.request
from PIL import Image

INDEX_FILE = "index.html"
IMAGES_DIR = "images"
ABOX = "a_box=sc3esau3"
HEADERS = {"User-Agent": "Mozilla/5.0"}

LISTING_URLS = [
    *[f"https://top4running.fr/c/running-chaussures-de-running?page={p}" for p in range(1, 5)],
    *[f"https://top4running.fr/c/soldes-top4running-fr?page={p}" for p in range(1, 4)],
]

KNOWN_BRANDS = {
    "asics": "Asics",
    "adidas": "Adidas",
    "nike": "Nike",
    "hoka": "Hoka",
    "on running": "On Running",
    "saucony": "Saucony",
    "new balance": "New Balance",
    "brooks": "Brooks",
    "salomon": "Salomon",
    "puma": "Puma",
    "mizuno": "Mizuno",
    "altra": "Altra",
}

MIN_OLD_PRICE = 175.0
TARGET_DEALS = 5
CARD_PATTERN = re.compile(
    r'<a href="(/p/[^"]+)" class="product-box-item-small[^"]*"([^>]*)>([\s\S]*?)</a>'
)


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers=HEADERS)
    return urllib.request.urlopen(req, timeout=15).read().decode("utf-8", "ignore")


def parse_euro(val: str) -> float:
    return float(
        val.replace("€", "").replace("\xa0", "").replace(" ", "").replace(",", ".").strip()
    )


def format_euro(val: float) -> str:
    return f"{val:.2f}".replace(".", ",") + "€"


def clean_model_name(name: str, brand: str) -> str:
    # Remove redundant brand prefix if present and strip Wide/Waterproof noise if overly long
    n = re.sub(rf"^{re.escape(brand)}\s+", "", name.strip(), flags=re.IGNORECASE)
    n = re.sub(r"\s+", " ", n).strip()
    words = []
    for w in n.split(" "):
        if w.isupper() and len(w) > 3:
            words.append(w.capitalize())
        elif w.upper() in ("GEL-NIMBUS", "GEL-KAYANO", "GEL-CUMULUS"):
            words.append("Gel-" + w.split("-", 1)[1].capitalize())
        else:
            words.append(w)
    res = " ".join(words)
    return res[:32].rstrip()


def is_eligible_shoe(cat: str, name: str) -> bool:
    c_low = cat.lower()
    n_low = name.lower()
    if "chaussures" not in c_low:
        return False
    excluded_cat = ("enfant", "junior", "pointe", "athlétisme", "track")
    excluded_name = (" jr", " kids", " gs", "wide", "2e", "4e")
    if any(x in c_low for x in excluded_cat):
        return False
    if any(x in n_low for x in excluded_name):
        return False
    return True


def collect_candidates() -> list[dict]:
    best_by_model: dict[tuple[str, str], dict] = {}
    seen_slugs: set[str] = set()

    for url in LISTING_URLS:
        try:
            page_html = fetch(url)
        except Exception as exc:
            print(f"Warn: impossible de lire {url} ({exc})")
            continue

        for slug_path, attrs, body in CARD_PATTERN.findall(page_html):
            if slug_path in seen_slugs:
                continue
            seen_slugs.add(slug_path)

            cat_m = re.search(r'data-category="([^"]*)"', attrs)
            cat = htmllib.unescape(cat_m.group(1)) if cat_m else ""

            brand_m = re.search(r'data-brand="([^"]*)"', attrs)
            name_m = re.search(r'data-name="([^"]*)"', attrs)
            price_m = re.search(r'data-price="([^"]*)"', attrs)
            del_m = re.search(r"<del[^>]*>([^<]+)</del>", body)
            img_m = re.search(
                r'<source[^>]+srcset="(https://i1\.t4s\.cz/products/[^"]+?\.png)"',
                body,
            )
            if not (brand_m and name_m and price_m and del_m and img_m):
                continue

            raw_brand = htmllib.unescape(brand_m.group(1)).strip().lower()
            if raw_brand not in KNOWN_BRANDS:
                continue
            brand = KNOWN_BRANDS[raw_brand]

            raw_name = htmllib.unescape(name_m.group(1)).strip()
            if not is_eligible_shoe(cat, raw_name):
                continue

            try:
                new_p = float(price_m.group(1))
                old_p = parse_euro(del_m.group(1))
            except ValueError:
                continue

            if old_p < MIN_OLD_PRICE or new_p <= 0 or new_p >= old_p:
                continue

            disc = round((1.0 - new_p / old_p) * 100)
            if disc < 15 or disc > 70:
                continue

            model = clean_model_name(raw_name, brand)
            dedup_key = (brand.lower(), model.lower())
            candidate = {
                "brand": brand,
                "model": model,
                "image_url": img_m.group(1).strip(),
                "old_val": old_p,
                "new_val": new_p,
                "disc_val": disc,
                "oldPrice": format_euro(old_p),
                "newPrice": format_euro(new_p),
                "discount": f"-{disc}%",
                "link": f"https://top4running.fr{slug_path}?{ABOX}",
            }

            prev = best_by_model.get(dedup_key)
            if prev is None or disc > prev["disc_val"] or (
                disc == prev["disc_val"] and old_p > prev["old_val"]
            ):
                best_by_model[dedup_key] = candidate

    return list(best_by_model.values())


def pick_sorted_candidates(candidates: list[dict]) -> list[dict]:
    # Sort descending by model name so newer versions naturally come before older ones
    ordered = sorted(
        candidates,
        key=lambda x: (x["disc_val"] >= 24, x["disc_val"] >= 20, x["model"].lower()),
        reverse=True,
    )
    selected: list[dict] = []
    brand_counts: dict[str, int] = {}

    for pass_max_per_brand in (1, 2):
        for item in ordered:
            if item in selected:
                continue
            b = item["brand"].lower()
            if brand_counts.get(b, 0) >= pass_max_per_brand:
                continue
            selected.append(item)
            brand_counts[b] = brand_counts.get(b, 0) + 1
            if len(selected) >= 12:
                return selected
    return selected


def download_deal_webp(img_url: str, out_path: str) -> bool:
    try:
        req = urllib.request.Request(img_url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            if resp.status != 200:
                return False
            data = resp.read()
        im = Image.open(io.BytesIO(data)).convert("RGBA")
        bbox = im.getbbox()
        if bbox:
            im = im.crop(bbox)
        im.thumbnail((700, 700), Image.Resampling.LANCZOS)
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        im.save(out_path, "WEBP", quality=85, method=6)
        return True
    except Exception as exc:
        print(f"Warn: image KO pour {img_url} ({exc})")
        return False


def main():
    raw_candidates = collect_candidates()
    print(f"Candidats >= {MIN_OLD_PRICE:.0f}€ trouves : {len(raw_candidates)}")
    if len(raw_candidates) < 3:
        print("Pas assez de promos haut de gamme recuperees, index.html inchange.")
        return

    ranked = pick_sorted_candidates(raw_candidates)
    version_tag = date.today().strftime("%Y%m%d")

    deals = []
    for item in ranked:
        slot = len(deals) + 1
        rel_img = f"{IMAGES_DIR}/deal-{slot}.webp"
        if not download_deal_webp(item["image_url"], rel_img):
            continue
        deals.append(
            {
                "brand": item["brand"],
                "model": item["model"],
                "image": f"{rel_img}?v={version_tag}",
                "oldPrice": item["oldPrice"],
                "newPrice": item["newPrice"],
                "discount": item["discount"],
                "link": item["link"],
            }
        )
        print(
            f"  #{slot}: {item['brand']} {item['model']} "
            f"({item['oldPrice']} -> {item['newPrice']}, {item['discount']}) -> {rel_img}"
        )
        if len(deals) >= TARGET_DEALS:
            break

    if len(deals) < 3:
        print("Pas assez d'images valides telechargees, index.html inchange.")
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
        lambda _: new_block,
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
