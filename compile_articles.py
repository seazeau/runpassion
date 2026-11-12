import os
import re
import json

# --- CONFIGURATION ---
DATA_FILE = 'articles_data.js'
CONTENT_DIR = 'content/shoes'

def parse_markdown(file_path):
    """Parse le frontmatter YAML et le corps Markdown d'un fichier."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extraction du frontmatter
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', content, re.DOTALL)
    if not match:
        return None
    
    yaml_text = match.group(1)
    body_text = match.group(2)
    
    metadata = {}
    for line in yaml_text.split('\n'):
        if ':' in line:
            key, val = line.split(':', 1)
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if val.lower() == 'true':
                val = True
            elif val.lower() == 'false':
                val = False
            metadata[key] = val
            
    return metadata, body_text

def md_to_html(md):
    """Convertit du Markdown simple en HTML pour le blog."""
    html = md.strip()
    
    # Conversion des sauts de ligne en paragraphes
    paragraphs = html.split('\n\n')
    formatted_p = []
    
    for p in paragraphs:
        p = p.strip()
        if not p:
            continue
            
        # Headers ## ou h2
        if p.startswith('## '):
            formatted_p.append(f"<h2>{p[3:]}</h2>")
        elif p.startswith('### '):
            formatted_p.append(f"<h3>{p[4:]}</h3>")
        # Listes
        elif p.startswith('- ') or p.startswith('* '):
            lines = p.split('\n')
            list_items = []
            for line in lines:
                line = line.strip()
                if line.startswith('- ') or line.startswith('* '):
                    list_items.append(f"<li>{line[2:]}</li>")
            formatted_p.append(f"<ul>{''.join(list_items)}</ul>")
        # Paragraphes normaux
        else:
            # Remplacement des sauts de ligne simples par des br
            p_html = p.replace('\n', '<br>')
            formatted_p.append(f"<p>{p_html}</p>")
            
    html = ''.join(formatted_p)
    
    # Remplacement du gras **texte** ou __texte__
    html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'__(.*?)__', r'<strong>\1</strong>', html)
    
    # Remplacement des liens [texte](url)
    html = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2" target="_blank">\1</a>', html)
    
    return html

def load_legacy_articles():
    """Charge la liste des articles d'origine de articles_data.js"""
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
        json_match = re.search(r'const wordpressArticles\s*=\s*(\[.*\]);', content, re.DOTALL)
        if json_match:
            # Filtrer pour ne garder que les articles non générés par le CMS (les ID numériques d'origine)
            articles = json.loads(json_match.group(1))
            # On conserve les articles existants
            return articles
    except Exception as e:
        print(f"Error loading legacy articles: {e}")
    return []

def main():
    if not os.path.exists(CONTENT_DIR):
        os.makedirs(CONTENT_DIR)
        # Création d'un article d'exemple
        sample_md = """---
title: "Test de la Asics Metaspeed Sky Paris 2026"
category: "Matériel"
date: "2026-06-03"
author: "Vincent"
featured: true
image: "image_046882.jpg"
excerpt: "Notre test complet en conditions réelles de la toute nouvelle Metaspeed Sky Paris. Légèreté, mousse FF Turbo+ et dynamisme fou."
---
Après plusieurs semaines d'essai sur piste et sur route, la Asics Metaspeed Sky Paris confirme son statut de reine de la vitesse.

## Une mousse FF Turbo+ révolutionnaire
La grande force de ce modèle réside dans sa nouvelle mousse PEBA ultra-légère. Le rebond est immédiat et l'économie musculaire est flagrante après le 30ème kilomètre.

## Points forts & Points faibles
- **Ultra-légère** (seulement 185g en 42)
- Dynamisme foudroyant
- **Prix élevé** (250€)
"""
        with open(os.path.join(CONTENT_DIR, 'test-asics-metaspeed-sky-paris.md'), 'w', encoding='utf-8') as f:
            f.write(sample_md)
        print("Dossier content/shoes cree avec un exemple.")

    legacy_articles = load_legacy_articles()
    
    # Dictionnaire pour indexer les articles d'origine et éviter les doublons de CMS
    legacy_by_slug = {a['slug']: a for a in legacy_articles}
    
    cms_articles = []
    for filename in os.listdir(CONTENT_DIR):
        if filename.endswith('.md'):
            file_path = os.path.join(CONTENT_DIR, filename)
            slug = filename[:-3] # retire le '.md'
            
            parsed = parse_markdown(file_path)
            if not parsed:
                continue
                
            meta, body = parsed
            html_content = md_to_html(body)
            
            cms_article = {
                "id": meta.get("id", len(legacy_articles) + len(cms_articles) + 1),
                "title": meta.get("title", "Sans titre"),
                "slug": slug,
                "category": meta.get("category", "Matériel"),
                "author": meta.get("author", "Vincent"),
                "date": meta.get("date", "2026-06-03"),
                "image": meta.get("image", "https://images.unsplash.com/photo-1514989940723-e8e51635b782?q=80&w=800"),
                "featured": meta.get("featured", False),
                "excerpt": meta.get("excerpt", ""),
                "content": html_content
            }
            cms_articles.append(cms_article)

    # Fusion : on garde les articles CMS en priorité (pour écraser si modifications)
    # Et on complète avec le reste des articles legacy
    final_articles = []
    
    # On met les articles CMS en premier (les plus récents)
    # Triés par date décroissante
    cms_articles.sort(key=lambda x: x['date'], reverse=True)
    
    # Supprimer des legacy tout article ayant le même slug qu'un article CMS
    cms_slugs = {a['slug'] for a in cms_articles}
    filtered_legacy = [a for a in legacy_articles if a['slug'] not in cms_slugs]
    
    # Fusion finale
    final_articles = cms_articles + filtered_legacy
    
    # Réattribution propre des IDs pour garder l'ordre
    for idx, art in enumerate(reversed(final_articles)):
        art['id'] = idx + 1
        
    # Sauvegarde dans articles_data.js
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        f.write("const wordpressArticles = ")
        f.write(json.dumps(final_articles, ensure_ascii=False, indent=4))
        f.write(";")
        
    print(f"Compilation reussie! {len(cms_articles)} articles CMS compiles et fusionnes avec {len(filtered_legacy)} articles legacy.")

if __name__ == '__main__':
    main()
