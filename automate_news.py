import os
import re
import json
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime

# --- CONFIGURATION ---
DATA_FILE = 'articles_data.js'
RSS_FEEDS = [
    'https://www.widermag.com/rss/news.xml',
    'https://www.marathons.fr/spip.php?page=backend',
    'https://www.runpack.fr/feed'
]

# API Keys (priorise GEMINI_API_KEY puis OPENAI_API_KEY)
GEMINI_KEY = os.environ.get("GEMINI_API_KEY")
OPENAI_KEY = os.environ.get("OPENAI_API_KEY")

def load_existing_articles():
    """Charge les articles existants depuis articles_data.js"""
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
        # Extrait le JSON de "const wordpressArticles = [...];"
        json_match = re.search(r'const wordpressArticles\s*=\s*(\[.*\]);', content, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(1))
    except Exception as e:
        print(f"⚠️ Erreur lors du chargement de {DATA_FILE}: {e}")
    return []

def save_articles(articles):
    """Sauvegarde les articles dans articles_data.js"""
    try:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            f.write("const wordpressArticles = ")
            f.write(json.dumps(articles, ensure_ascii=False, indent=4))
            f.write(";")
        print(f"Success: {DATA_FILE} updated. Total articles: {len(articles)}")
    except Exception as e:
        print(f"Error saving to {DATA_FILE}: {e}")

def fetch_rss_items(feed_url):
    """Télécharge et parse un flux RSS"""
    print(f"Fetch: {feed_url}...")
    try:
        req = urllib.request.Request(feed_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
        root = ET.fromstring(xml_data)
        
        items = []
        for item in root.findall('.//item'):
            title = item.find('title')
            link = item.find('link')
            pub_date = item.find('pubDate')
            description = item.find('description')
            
            title_text = title.text if title is not None else ""
            link_text = link.text if link is not None else ""
            desc_text = description.text if description is not None else ""
            
            # Nettoyer HTML des descriptions RSS
            desc_text = re.sub('<[^<]+?>', '', desc_text).strip()
            
            items.append({
                'title': title_text,
                'link': link_text,
                'description': desc_text,
                'pubDate': pub_date.text if pub_date is not None else ""
            })
        return items
    except Exception as e:
        print(f"Error: {feed_url}: {e}")
        return []

def clean_slug(title):
    """Génère un slug propre à partir d'un titre"""
    slug = title.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s-]+', '-', slug)
    return slug.strip('-')

def rewrite_with_llm(title, desc):
    """Appelle l'API d'IA pour réécrire l'actualité en article unique et accrocheur"""
    prompt = f"""Rédige un court article d'actualité running/trail en français basé sur les informations suivantes :
Titre : {title}
Description : {desc}

Règles de rédaction :
- Style journalistique de running, passionné et pro.
- Fais entre 2 et 3 paragraphes courts.
- Utilise des balises HTML propres : H2 pour le titre principal intérieur si nécessaire, P pour les paragraphes, STRONG pour mettre en valeur les mots importants.
- Ne mentionne PAS de caractéristiques techniques de chaussure (poids, drop, stack).
- Si une chaussure de running est mentionnée, intègre un lien naturel sous le format <a href="/slug-de-la-chaussure">Nom de la chaussure</a>.
- Termine par un résumé en une seule phrase courte pour l'extrait (excerpt).

Format de réponse attendu (uniquement du JSON valide au format brut, sans balises de code ```json) :
{{
  "title": "Titre optimisé accrocheur pour le site",
  "excerpt": "Extrait court de l'article",
  "content": "Le contenu de l'article avec balises HTML P et STRONG"
}}"""

    if GEMINI_KEY:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_KEY}"
        data = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"}
        }
        try:
            req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req) as res:
                response_data = json.loads(res.read().decode('utf-8'))
                text = response_data['candidates'][0]['content']['parts'][0]['text']
                return json.loads(text.strip())
        except Exception as e:
            print(f"Error API Gemini: {e}")
            
    elif OPENAI_KEY:
        url = "https://api.openai.com/v1/chat/completions"
        data = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"}
        }
        try:
            req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {OPENAI_KEY}'
            })
            with urllib.request.urlopen(req) as res:
                response_data = json.loads(res.read().decode('utf-8'))
                text = response_data['choices'][0]['message']['content']
                return json.loads(text.strip())
        except Exception as e:
            print(f"Error API OpenAI: {e}")

    # Fallback si pas de clé API ou erreur
    return {
        "title": f"[Actu] {title}",
        "excerpt": desc[:150] + "...",
        "content": f"<p><strong>{title}</strong></p><p>{desc}</p>"
    }

def main():
    existing_articles = load_existing_articles()
    existing_slugs = {a.get('slug') for a in existing_articles}
    
    new_items = []
    for feed in RSS_FEEDS:
        items = fetch_rss_items(feed)
        for item in items:
            slug = clean_slug(item['title'])
            if slug not in existing_slugs:
                new_items.append((slug, item))
                
    if not new_items:
        print("Aucune nouvelle actualité trouvée !")
        return
        
    print(f"{len(new_items)} nouvelles actualités trouvées. Traitement...")
    
    # Limiter le nombre de générations par run pour éviter de saturer l'API
    max_generations = 3
    added_count = 0
    
    for slug, item in new_items[:max_generations]:
        print(f"Re-writing: {item['title']}...")
        result = rewrite_with_llm(item['title'], item['description'])
        
        # Ajout à la liste
        new_article = {
            "id": len(existing_articles) + 1,
            "title": result.get("title", item['title']),
            "slug": slug,
            "category": "Actualités",
            "author": "La Rédaction",
            "date": datetime.today().strftime('%Y-%m-%d'),
            "image": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800", # Image running par défaut
            "excerpt": result.get("excerpt", item['description'][:150]),
            "content": result.get("content", f"<p>{item['description']}</p>")
        }
        
        existing_articles.insert(0, new_article) # Ajoute au début du fil d'actu
        existing_slugs.add(slug)
        added_count += 1
        
    if added_count > 0:
        # Réassigner les ID séquentiels proprement
        for idx, art in enumerate(reversed(existing_articles)):
            art['id'] = idx + 1
        save_articles(existing_articles)
    else:
        print("Aucun article n'a pu être généré.")

if __name__ == '__main__':
    main()
