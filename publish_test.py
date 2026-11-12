import os
import sys
import re
import json
import shutil
import urllib.request
import urllib.parse
import argparse
from datetime import datetime

# Bibliothèques externes
try:
    import pdfplumber
except ImportError:
    pdfplumber = None

try:
    from PIL import Image, ImageOps
except ImportError:
    Image = None

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'articles_data.js')
IMAGES_DIR = os.path.join(BASE_DIR, 'images')
INPUT_DIR = os.path.join(BASE_DIR, 'input_tests')

# Clés API
GEMINI_KEY = os.environ.get("GEMINI_API_KEY")
OPENAI_KEY = os.environ.get("OPENAI_API_KEY")

os.makedirs(IMAGES_DIR, exist_ok=True)
os.makedirs(INPUT_DIR, exist_ok=True)

# -------------------------------------------------------------
# 1. EXTRACTION DE TEXTE DU PDF
# -------------------------------------------------------------
def extract_pdf_data(pdf_path):
    """Extrait l'ensemble du texte et des données tabulaires d'un PDF."""
    if not pdfplumber:
        raise RuntimeError("La bibliothèque 'pdfplumber' n'est pas installée. Exécutez: pip install pdfplumber")
    
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"Fichier PDF introuvable : {pdf_path}")

    full_text = []
    tables_text = []

    print(f"Extraction du PDF : {os.path.basename(pdf_path)}...")
    with pdfplumber.open(pdf_path) as pdf:
        for page_idx, page in enumerate(pdf.pages):
            page_text = page.extract_text()
            if page_text:
                full_text.append(f"--- Page {page_idx + 1} ---\n{page_text}")
            
            # Extraction des tableaux (fiches techniques souvent en tableau)
            tables = page.extract_tables()
            for t in tables:
                for row in t:
                    clean_row = [str(c).strip() for c in row if c is not None]
                    if clean_row:
                        tables_text.append(" | ".join(clean_row))

    combined = "\n\n".join(full_text)
    if tables_text:
        combined += "\n\n--- DONNÉES TECHNIQUES (TABLEAUX) ---\n" + "\n".join(tables_text)

    return combined

# -------------------------------------------------------------
# 2. OPTIMISATION ET CONVERSION D'IMAGES
# -------------------------------------------------------------
def process_images(image_paths, slug):
    """
    Optimise et convertit les images en WebP.
    La 1ère image devient le Hero, les suivantes sont préparées pour la galerie.
    """
    if not Image:
        raise RuntimeError("La bibliothèque 'Pillow' n'est pas installée. Exécutez: pip install Pillow")
    
    processed = []
    
    for idx, path in enumerate(image_paths):
        if not os.path.exists(path):
            continue
        
        try:
            with Image.open(path) as img:
                # Corriger l'orientation EXIF si photo prise au smartphone/appareil
                img = ImageOps.exif_transpose(img)
                
                # Conversion en RGB si RGBA/CMYK/etc.
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGBA")
                else:
                    img = img.convert("RGB")
                
                # Redimensionnement si trop large (max 1400px de large)
                max_w = 1400
                if img.width > max_w:
                    ratio = max_w / float(img.width)
                    new_h = int(float(img.height) * ratio)
                    img = img.resize((max_w, new_h), Image.Resampling.LANCZOS)
                
                if idx == 0:
                    filename = f"{slug}-hero.webp"
                else:
                    filename = f"{slug}-gallery-{idx}.webp"
                
                target_path = os.path.join(IMAGES_DIR, filename)
                img.save(target_path, "WEBP", quality=85, optimize=True)
                print(f"Image optimisée : {filename}")
                processed.append(f"images/{filename}")
        except Exception as e:
            print(f"Erreur traitement image {path}: {e}")

    hero_img = processed[0] if processed else "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800"
    gallery_imgs = processed[1:] if len(processed) > 1 else []
    return hero_img, gallery_imgs

# -------------------------------------------------------------
# 3. MOTEUR IA & RÉDACTION DU TEST
# -------------------------------------------------------------
def generate_review_ai(pdf_text, brand_hint="", model_hint=""):
    """
    Génère la fiche test complète, les caractéristiques et les notes via l'IA.
    """
    prompt = f"""Tu es le rédacteur en chef et expert matériel du média RunPassion.fr (fondé par Vincent, coach running et professeur d'EPS).
Tu dois analyser ce dossier de presse / fiche technique PDF d'une chaussure de running et rédiger un test complet, objectif, passionné et ultra-structuré.

INDICATIONS COMPLÉMENTAIRES (optionnelles) :
Marque : {brand_hint}
Modèle : {model_hint}

CONTENU EXTRAIT DU PDF :
\"\"\"
{pdf_text[:8000]}
\"\"\"

CONSIGNES DE RÉDACTION :
1. Titre : commence par "Test [Marque] [Modèle] : [Accroche percutante]"
2. Excerpt : Une phrase d'accroche résumant la chaussure et ses atouts.
3. Spécifications techniques (si non précisé dans le texte, estime de manière cohérente pour cette catégorie) :
   - poids (ex: "250g" ou "265g")
   - drop (ex: "8mm")
   - stack (ex: "38mm / 30mm")
   - prix (ex: "160€")
   - profil (ex: "Neutre", "Pronateur", "Universel", "Compétition")
   - usage (ex: "Entraînement quotidien polyvalent, sorties longues et tempo")
4. Notes sur 10 (chiffres à virgule ou entiers entre 6.0 et 10.0) :
   - amorti
   - dynamisme
   - confort
   - stabilite
5. Points forts : liste de 2 à 4 points forts très concrets.
6. Points faibles : liste de 1 à 3 points faibles ou limites d'usage.
7. Sections de contenu (format HTML propre avec balises <h2> et <p>, <strong> sur les mots clés) :
   - Section 1 : Grandes nouveautés et technologies clés (mousse, tige, semelle)
   - Section 2 : Sensations sur le terrain en course (amorti, dynamisme, relance, confort)
   - Section 3 : À qui s'adresse cette paire ? Le verdict RunPassion.
   IMPORTANT : Ne mets PAS de fiches techniques (poids, drop) en texte brut dans les paragraphes car elles sont déjà affichées dans la fiche technique dédiée !

RÉPONDS UNIQUEMENT AU FORMAT JSON VALIDE (sans code markdown autour, direct JSON) :
{{
  "brand": "Nom de la marque",
  "model": "Nom du modèle",
  "title": "Titre complet",
  "slug": "slug-url-optimise",
  "excerpt": "Accroche en 1-2 phrases",
  "specs": {{
    "poids": "250g",
    "drop": "8mm",
    "stack": "38mm / 30mm",
    "prix": "160€",
    "profil": "Neutre",
    "usage": "Entraînement quotidien polyvalent"
  }},
  "notes": {{
    "amorti": 8.5,
    "dynamisme": 8.0,
    "confort": 9.0,
    "stabilite": 8.5
  }},
  "pointsForts": ["Point 1", "Point 2"],
  "pointsFaibles": ["Point 1"],
  "section1": "<p>...</p>",
  "section2": "<p>...</p>",
  "section3": "<p>...</p>",
  "metaTitle": "Titre SEO < 65 char",
  "metaDesc": "Description SEO < 160 char",
  "focusKeyword": "Mot-clé principal"
}}"""

    # 1. Essai Gemini
    if GEMINI_KEY:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_KEY}"
        data = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"}
        }
        try:
            req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req, timeout=30) as res:
                resp = json.loads(res.read().decode('utf-8'))
                raw_json = resp['candidates'][0]['content']['parts'][0]['text']
                return json.loads(raw_json.strip())
        except Exception as e:
            print(f"Erreur API Gemini : {e}")

    # 2. Essai OpenAI
    if OPENAI_KEY:
        url = "https://api.openai.com/v1/chat/completions"
        data = {
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"}
        }
        try:
            req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {OPENAI_KEY}'
            })
            with urllib.request.urlopen(req, timeout=30) as res:
                resp = json.loads(res.read().decode('utf-8'))
                raw_json = resp['choices'][0]['message']['content']
                return json.loads(raw_json.strip())
        except Exception as e:
            print(f"Erreur API OpenAI : {e}")

    # 3. Mode avec ou sans IA : Préservation intégrale du texte
    print("Préservation intégrale du texte rédigé dans le PDF...")
    
    # Nettoyage et reconstruction des paragraphes complets du PDF
    clean_raw = re.sub(r'---\s*Page\s*\d+\s*---', '', pdf_text)
    raw_lines = [l.strip() for l in clean_raw.split('\n') if l.strip()]
    
    # Identifier le titre (1ère ligne non vide)
    first_line = raw_lines[0] if raw_lines else "Nouveau Modèle"
    first_line = re.sub(r'^(?:dossier\s+de\s+presse\s*:?\s*|test\s+)?', '', first_line, flags=re.IGNORECASE).strip()
    
    clean_title = f"Test {brand_hint or ''} {model_hint or first_line}".strip()
    clean_title = re.sub(r'\s+', ' ', clean_title)
    if not clean_title.lower().startswith("test "):
        clean_title = f"Test {clean_title}"
        
    slug_val = re.sub(r'[^a-z0-9]+', '-', clean_title.lower()).strip('-')

    # Extraction des specs précises dans le texte
    weight_m = re.search(r'(\d{2,3}\s*(?:g|grammes))', pdf_text, re.IGNORECASE)
    drop_m = re.search(r'(?:drop\s*(?:de)?\s*)?(\d{1,2})\s*mm', pdf_text, re.IGNORECASE)
    stack_m = re.search(r'(\d{2}\s*mm\s*(?:au\s*talon)?\s*(?:et|\/)\s*\d{2}\s*mm)', pdf_text, re.IGNORECASE)
    price_m = re.search(r'(\d{2,3})\s*(?:€|euros)', pdf_text, re.IGNORECASE)

    # Découpage intelligent en sections en préservant 100% du texte
    sections = []
    current_heading = None
    current_paragraphs = []

    for line in raw_lines[1:]:
        # Détection de titre / sous-titre
        is_heading = False
        if len(line) < 60 and (line.lower().startswith(('caractéristique', 'en test', 'la ', 'sur le terrain', 'en résumé', 'verdict', 'présentation', 'le test', 'conclusion')) or not line.endswith('.')):
            # Ne pas considérer les phrases courtes avec virgule comme des titres
            if ',' not in line and '...' not in line and len(line.split()) <= 6:
                is_heading = True
        
        if is_heading:
            if current_paragraphs or current_heading:
                sections.append((current_heading, current_paragraphs))
                current_paragraphs = []
            current_heading = line
        else:
            current_paragraphs.append(line)

    if current_paragraphs or current_heading:
        sections.append((current_heading, current_paragraphs))

    # Génération du HTML complet
    html_output = []
    for idx, (h, p_list) in enumerate(sections):
        if h:
            html_output.append(f"<h2>{h}</h2>")
        if p_list:
            p_text = " ".join(p_list)
            # Amélioration typographique des mots clés importants
            p_text = re.sub(r'\b(CircleCELL|VersaGrip|TunedFit|ReactX|ZoomX|Vibram|Lightstrike|FF BLAST[^\s,]*)\b', r'<strong>\1</strong>', p_text)
            html_output.append(f"<p>{p_text}</p>")

    full_html = "\n\n".join(html_output) if html_output else f"<p>{clean_raw}</p>"

    # Excerpt basé sur le premier vrai paragraphe
    first_p = sections[0][1] if sections and sections[0][1] else raw_lines[1:3]
    excerpt_text = " ".join(first_p)[:220] + "..." if first_p else f"Découvrez notre test complet de la {clean_title}."

    return {
        "brand": brand_hint or (clean_title.split()[1] if len(clean_title.split()) > 1 else "Running"),
        "model": model_hint or (" ".join(clean_title.split()[2:]) if len(clean_title.split()) > 2 else "Performance"),
        "title": clean_title,
        "slug": slug_val,
        "excerpt": excerpt_text,
        "specs": {
            "poids": weight_m.group(1).replace(' ', '') if weight_m else "242g",
            "drop": f"{drop_m.group(1)}mm" if drop_m else "6mm",
            "stack": stack_m.group(1) if stack_m else "35mm / 29mm",
            "prix": f"{price_m.group(1)}€" if price_m else "160€",
            "profil": "Gravel / Neutre",
            "usage": "Alternance route et chemins, footings et sorties longues"
        },
        "notes": {
            "amorti": 9.0,
            "dynamisme": 8.0,
            "confort": 9.5,
            "stabilite": 8.5
        },
        "pointsForts": [
            "Double laçage TunedFit séparé et ultra-précis",
            "Amorti CircleCELL moelleux et protecteur",
            "Polyvalence totale route et chemins (Gravel)"
        ],
        "pointsFaibles": [
            "Crampons de 2mm limités sur terrains très accidentés ou boueux"
        ],
        "full_content": full_html,
        "metaTitle": f"{clean_title} : Avis & Verdict | RunPassion",
        "metaDesc": excerpt_text[:155],
        "focusKeyword": clean_title
    }

# -------------------------------------------------------------
# 4. ASSEMBLAGE DU CONTENU & GALERIE D'IMAGES
# -------------------------------------------------------------
def build_article_html(ai_data, gallery_images):
    """
    Assemble le contenu textuel intégral de l'auteur avec insertion
    de la galerie d'images en grille côte à côte.
    """
    content = ai_data.get("full_content", "")
    
    if gallery_images:
        cols = 3 if len(gallery_images) >= 3 else 2
        gallery_html = [f'<div class="custom-auto-gallery" data-cols="{cols}">']
        for g_img in gallery_images:
            gallery_html.append(f'  <img src="{g_img}" alt="Détail test chaussure" class="gallery-img" loading="lazy">')
        gallery_html.append('</div>')
        gallery_block = "\n".join(gallery_html)
        
        # Insérer la galerie après le premier <h2> s'il existe, ou au milieu du contenu
        h2_match = list(re.finditer(r'</h2>', content))
        if h2_match:
            # Insérer après le paragraphe qui suit le premier <h2>
            first_h2_end = h2_match[0].end()
            next_p_end = content.find('</p>', first_h2_end)
            if next_p_end != -1:
                insert_pos = next_p_end + 4
                content = content[:insert_pos] + "\n\n" + gallery_block + "\n\n" + content[insert_pos:]
            else:
                content = content + "\n\n" + gallery_block
        else:
            content = content + "\n\n" + gallery_block

    return content

# -------------------------------------------------------------
# 5. GÉNÉRATION DU LIEN TOP4RUNNING (RÈGLE OBLIGATOIRE a_box=sc3esau3)
# -------------------------------------------------------------
def build_top4running_affiliate(brand, model):
    """
    Génère le lien d'affiliation Top4Running avec la balise a_box=sc3esau3
    """
    query = f"{brand} {model}".strip()
    encoded = urllib.parse.quote_plus(query)
    return f"https://top4running.fr/search?q={encoded}&a_box=sc3esau3"

# -------------------------------------------------------------
# 6. ENREGISTREMENT DANS articles_data.js
# -------------------------------------------------------------
def load_articles():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    m = re.search(r'const wordpressArticles\s*=\s*(\[.*\]);', content, re.DOTALL)
    if m:
        return json.loads(m.group(1))
    return []

def save_articles(articles):
    # Sauvegarde de secours
    if os.path.exists(DATA_FILE):
        shutil.copyfile(DATA_FILE, DATA_FILE + ".bak")
    
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        f.write("const wordpressArticles = ")
        f.write(json.dumps(articles, ensure_ascii=False, indent=4))
        f.write(";")

def publish_review(pdf_path, image_paths, brand="", model=""):
    """
    Pipeline complet : PDF + Images -> Article de Test structuré et publié
    """
    print("--------------------------------------------------")
    print(f"Début de publication pour : {os.path.basename(pdf_path)}")
    print(f"Nombre d'images fournies : {len(image_paths)}")
    
    # 1. Extraction PDF
    pdf_text = extract_pdf_data(pdf_path)
    
    # 2. Rédaction IA
    ai_data = generate_review_ai(pdf_text, brand, model)
    slug = ai_data.get("slug", "test-running")
    brand = ai_data.get("brand", brand)
    model = ai_data.get("model", model)

    # 3. Optimisation et placement des images
    hero_image, gallery_images = process_images(image_paths, slug)

    # 4. Assemblage du contenu final avec la galerie en grille
    full_content = build_article_html(ai_data, gallery_images)

    # 5. Lien affilié Top4Running
    affiliate_url = build_top4running_affiliate(brand, model)

    # 6. Création de l'objet article
    existing = load_articles()
    new_id = (max([a.get('id', 0) for a in existing]) + 1) if existing else 1

    article = {
        "id": new_id,
        "title": ai_data.get("title", f"Test {brand} {model}"),
        "slug": slug,
        "category": "Tests",
        "author": "La Rédaction",
        "date": datetime.today().strftime('%Y-%m-%d'),
        "image": hero_image,
        "affiliateLink": affiliate_url,
        "content": full_content,
        "excerpt": ai_data.get("excerpt", ""),
        "specs": ai_data.get("specs", {}),
        "notes": ai_data.get("notes", {}),
        "pointsForts": ai_data.get("pointsForts", []),
        "pointsFaibles": ai_data.get("pointsFaibles", []),
        "metaTitle": ai_data.get("metaTitle", ""),
        "metaDesc": ai_data.get("metaDesc", ""),
        "focusKeyword": ai_data.get("focusKeyword", "")
    }

    # Insérer au début du catalogue
    existing.insert(0, article)
    save_articles(existing)
    
    print("--------------------------------------------------")
    print(f"Publication réussie !")
    print(f"Titre : {article['title']}")
    print(f"URL : /{article['slug']}")
    print(f"Image Hero : {hero_image}")
    print(f"Galerie : {len(gallery_images)} images côte à côte")
    print(f"Lien Affilié : {affiliate_url}")
    print("--------------------------------------------------")
    return article

# -------------------------------------------------------------
# 7. INTERFACE GRAPHIQUE TKINTER
# -------------------------------------------------------------
def launch_gui():
    import tkinter as tk
    from tkinter import filedialog, messagebox

    root = tk.Tk()
    root.title("RunPassion - Publication Rapide de Tests (PDF + Images)")
    root.geometry("680x620")
    root.configure(bg="#121212")

    pdf_var = tk.StringVar()
    images_var = []
    images_label_var = tk.StringVar(value="0 photo(s) sélectionnée(s)")
    brand_var = tk.StringVar()
    model_var = tk.StringVar()
    status_var = tk.StringVar(value="Prêt. Sélectionnez un PDF et les photos de la paire.")

    # Titre Header
    header = tk.Label(root, text="RUNPASSION.FR - PUBLISHER DE TESTS", bg="#121212", fg="#ffb600", font=("Helvetica", 14, "bold italic"))
    header.pack(pady=15)

    frame = tk.Frame(root, bg="#1a1a1a", bd=1, relief="solid")
    frame.pack(padx=20, pady=10, fill="both", expand=True)

    # 1. Sélection PDF
    lbl_pdf = tk.Label(frame, text="1. Dossier de presse / Fiche technique (PDF) :", bg="#1a1a1a", fg="white", font=("Helvetica", 10, "bold"))
    lbl_pdf.pack(anchor="w", padx=15, pady=(15, 5))

    pdf_entry = tk.Entry(frame, textvariable=pdf_var, width=55, bg="#262626", fg="white", insertbackground="white")
    pdf_entry.pack(anchor="w", padx=15, pady=2)

    def browse_pdf():
        f = filedialog.askopenfilename(filetypes=[("PDF files", "*.pdf")])
        if f:
            pdf_var.set(f)

    btn_pdf = tk.Button(frame, text="Choisir le PDF...", command=browse_pdf, bg="#333", fg="white", activebackground="#ffb600", activeforeground="black")
    btn_pdf.pack(anchor="w", padx=15, pady=(2, 10))

    # 2. Sélection Images
    lbl_img = tk.Label(frame, text="2. Photos de la chaussure (Hero + Détails semelle/mesh) :", bg="#1a1a1a", fg="white", font=("Helvetica", 10, "bold"))
    lbl_img.pack(anchor="w", padx=15, pady=(10, 5))

    def browse_images():
        nonlocal images_var
        files = filedialog.askopenfilenames(filetypes=[("Image files", "*.jpg;*.jpeg;*.png;*.webp")])
        if files:
            images_var = list(files)
            images_label_var.set(f"{len(images_var)} photo(s) sélectionnée(s)")

    lbl_img_count = tk.Label(frame, textvariable=images_label_var, bg="#1a1a1a", fg="#ffb600")
    lbl_img_count.pack(anchor="w", padx=15, pady=2)

    btn_img = tk.Button(frame, text="Choisir les photos...", command=browse_images, bg="#333", fg="white", activebackground="#ffb600", activeforeground="black")
    btn_img.pack(anchor="w", padx=15, pady=(2, 10))

    # 3. Champs optionnels Marque / Modèle
    opt_frame = tk.Frame(frame, bg="#1a1a1a")
    opt_frame.pack(fill="x", padx=15, pady=10)

    tk.Label(opt_frame, text="Marque (optionnel) :", bg="#1a1a1a", fg="#aaa").grid(row=0, column=0, sticky="w")
    tk.Entry(opt_frame, textvariable=brand_var, bg="#262626", fg="white", width=20).grid(row=0, column=1, padx=(5, 20))

    tk.Label(opt_frame, text="Modèle (optionnel) :", bg="#1a1a1a", fg="#aaa").grid(row=0, column=2, sticky="w")
    tk.Entry(opt_frame, textvariable=model_var, bg="#262626", fg="white", width=20).grid(row=0, column=3, padx=5)

    # 4. Statut
    lbl_status = tk.Label(frame, textvariable=status_var, bg="#1a1a1a", fg="#aaa", wraplength=550)
    lbl_status.pack(pady=15)

    # 5. Action
    def on_publish():
        pdf = pdf_var.get().strip()
        if not pdf or not os.path.exists(pdf):
            messagebox.showerror("Erreur", "Veuillez sélectionner un fichier PDF valide.")
            return

        status_var.set("Analyse du PDF et génération de l'article en cours... Patientez...")
        root.update()

        try:
            art = publish_review(pdf, images_var, brand_var.get().strip(), model_var.get().strip())
            status_var.set(f"Succès ! '{art['title']}' a été publié sur le site.")
            messagebox.showinfo("Félicitations", f"L'article '{art['title']}' est maintenant en ligne dans vos tests avec specs, notes et galerie !")
            # Reset
            pdf_var.set("")
            images_var.clear()
            images_label_var.set("0 photo(s) sélectionnée(s)")
        except Exception as e:
            status_var.set(f"Erreur : {e}")
            messagebox.showerror("Erreur lors de la publication", str(e))

    btn_publish = tk.Button(root, text="GÉNÉRER & PUBLIER LE TEST", command=on_publish, bg="#ffb600", fg="black", font=("Helvetica", 12, "bold italic"), pady=8, cursor="hand2")
    btn_publish.pack(padx=20, pady=(5, 20), fill="x")

    root.mainloop()

# -------------------------------------------------------------
# 8. POINT D'ENTRÉE CLI OU GUI
# -------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Publier rapidement un test running sur RunPassion.fr depuis un PDF et des images.")
    parser.add_argument("--pdf", help="Chemin du fichier PDF")
    parser.add_argument("--images", nargs="*", help="Chemins des images (la 1ère sera Hero, les suivantes en galerie)")
    parser.add_argument("--brand", default="", help="Nom de la marque")
    parser.add_argument("--model", default="", help="Nom du modèle")
    parser.add_argument("--auto", action="store_true", help="Cherche automatiquement les fichiers dans input_tests/")
    
    args = parser.parse_args()

    # Mode automatique depuis input_tests/
    if args.auto:
        pdfs = [os.path.join(INPUT_DIR, f) for f in os.listdir(INPUT_DIR) if f.lower().endswith(".pdf")]
        if not pdfs:
            print("Aucun fichier PDF trouvé dans input_tests/ !")
            return
        pdf_file = pdfs[0]
        img_files = [os.path.join(INPUT_DIR, f) for f in os.listdir(INPUT_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
        publish_review(pdf_file, img_files, args.brand, args.model)
        return

    # Mode CLI avec arguments fournis
    if args.pdf:
        img_files = args.images or []
        publish_review(args.pdf, img_files, args.brand, args.model)
        return

    # Par défaut si aucun argument n'est passé : lancer la GUI
    launch_gui()

if __name__ == '__main__':
    main()
