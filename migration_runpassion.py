import os
import requests
import xml.etree.ElementTree as ET
from urllib.parse import urlparse
import json

# --- CONFIGURATION ---
XML_FILE = 'runpassionfr-coachrunning.WordPress.2026-03-19.xml'
OUTPUT_IMAGES_DIR = 'images'
DATA_FILE = 'articles_data.js'

if not os.path.exists(OUTPUT_IMAGES_DIR):
    os.makedirs(OUTPUT_IMAGES_DIR)

# --- ANALYSE ---
print("🔍 Analyse de l'export WordPress...")
tree = ET.parse(XML_FILE)
root = tree.getroot()
ns = {
    'content': 'http://purl.org/rss/1.0/modules/content/',
    'wp': 'http://wordpress.org/export/1.2/',
    'dc': 'http://purl.org/dc/elements/1.1/'
}

attachments = {}
for item in root.findall('.//item'):
    post_type = item.find('wp:post_type', ns).text
    if post_type == 'attachment':
        post_id = item.find('wp:post_id', ns).text
        img_url = item.find('wp:attachment_url', ns).text
        attachments[post_id] = img_url

articles_list = []
print("📝 Traitement des articles...")

for item in root.findall('.//item'):
    post_type = item.find('wp:post_type', ns).text
    status = item.find('wp:status', ns).text
    
    if post_type == 'post' and status == 'publish':
        title = item.find('title').text
        slug = item.find('wp:post_name', ns).text
        author = item.find('dc:creator', ns).text
        date_raw = item.find('pubDate').text
        content = item.find('content:encoded', ns).text
        
        # Extraction de l'image à la une
        featured_img = "https://images.unsplash.com/photo-1514989940723-e8e51635b782?q=80&w=800"
        for meta in item.findall('wp:postmeta', ns):
            if meta.find('wp:meta_key', ns).text == '_thumbnail_id':
                thumb_id = meta.find('wp:meta_value', ns).text
                if thumb_id in attachments:
                    featured_img = attachments[thumb_id]

        # Nettoyage catégorie
        cats = [c.text for c in item.findall('category') if c.get('domain') == 'category']
        category = cats[0] if cats else "Running"

        # On prépare l'objet article
        articles_list.append({
            "id": len(articles_list) + 1,
            "title": title,
            "slug": slug,
            "category": category,
            "author": author,
            "date": date_raw,
            "image": featured_img,
            "excerpt": content[:200].replace('<p>', '').replace('</p>', '') + "...",
            "content": content
        })

# --- SAUVEGARDE ---
with open(DATA_FILE, 'w', encoding='utf-8') as f:
    f.write("const wordpressArticles = ")
    f.write(json.dumps(articles_list, ensure_ascii=False, indent=4))
    f.write(";")

print(f"✅ Terminé ! {len(articles_list)} articles exportés dans {DATA_FILE}")