import datetime
import http.server
import io
import json
import mimetypes
import os
import re
import socketserver
import threading
import urllib.parse
import webbrowser

from PIL import Image
import publish_site

PORT = 8765
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

CMS_HTML = r"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RunPassion CMS</title>
  <link href="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css" rel="stylesheet" />
  <style>
    :root {
      --bg: #07070a;
      --panel: #101117;
      --panel2: #161821;
      --border: #252836;
      --yellow: #fcb900;
      --yellow-h: #e0a600;
      --text: #f3f4f6;
      --muted: #9ca3af;
      --danger: #ef4444;
      --ok: #22c55e;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; font-family: Inter, system-ui, -apple-system, sans-serif;
      background: var(--bg); color: var(--text); height: 100vh; display: flex; flex-direction: column;
    }
    header {
      height: 60px; background: var(--panel); border-bottom: 1px solid var(--border);
      padding: 0 20px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
    }
    .brand { font-weight: 900; font-style: italic; font-size: 1.25rem; letter-spacing: -0.03em; }
    .brand span { color: var(--yellow); }
    .top-actions { display: flex; gap: 10px; align-items: center; }
    button, .btn {
      border: 0; border-radius: 10px; padding: 9px 15px; font-weight: 700; cursor: pointer;
      font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px; text-decoration: none;
    }
    .btn-ghost { background: var(--panel2); color: var(--text); border: 1px solid var(--border); }
    .btn-ghost:hover { border-color: var(--yellow); }
    .btn-yellow { background: var(--yellow); color: #000; }
    .btn-yellow:hover { background: var(--yellow-h); }
    .btn-green { background: var(--ok); color: #000; }
    .btn-danger { background: rgba(239,68,68,.15); color: #fca5a5; border: 1px solid rgba(239,68,68,.35); }
    .main { flex: 1; display: flex; overflow: hidden; }
    aside {
      width: 340px; background: var(--panel); border-right: 1px solid var(--border);
      display: flex; flex-direction: column; flex-shrink: 0;
    }
    .sidebar-top { padding: 14px; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 8px; }
    input, select, textarea {
      width: 100%; background: var(--bg); color: var(--text); border: 1px solid var(--border);
      border-radius: 9px; padding: 9px 12px; font-size: 0.9rem; font-family: inherit;
    }
    input:focus, select:focus, textarea:focus { outline: none; border-color: var(--yellow); }
    .list { flex: 1; overflow-y: auto; padding: 8px; }
    .item {
      padding: 10px 12px; border-radius: 10px; cursor: pointer; margin-bottom: 4px;
      border: 1px solid transparent; transition: .15s;
    }
    .item:hover { background: var(--panel2); }
    .item.active { background: var(--panel2); border-color: var(--yellow); }
    .item-title { font-weight: 700; font-size: 0.88rem; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-meta { font-size: 0.75rem; color: var(--muted); display: flex; justify-content: space-between; }
    .editor-wrap { flex: 1; overflow-y: auto; padding: 24px 32px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .full { grid-column: 1 / -1; }
    label { display: block; font-size: 0.78rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; margin-bottom: 6px; }
    .card { background: var(--panel); border: 1px solid var(--border); border-radius: 14px; padding: 18px; margin-bottom: 16px; }
    .img-row { display: flex; gap: 12px; align-items: center; }
    .preview-img { width: 96px; height: 64px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border); background: #000; }
    .ql-toolbar.ql-snow { background: #1a1c26; border-color: var(--border); border-radius: 10px 10px 0 0; }
    .ql-toolbar .ql-stroke { stroke: #d1d5db; }
    .ql-toolbar .ql-fill { fill: #d1d5db; }
    .ql-toolbar .ql-picker-label { color: #d1d5db; }
    .ql-container.ql-snow { border-color: var(--border); border-radius: 0 0 10px 10px; background: var(--bg); min-height: 320px; font-size: 1rem; }
    .ql-editor { min-height: 320px; color: var(--text); line-height: 1.7; }
    .toast {
      position: fixed; bottom: 20px; right: 20px; background: #111827; border: 1px solid var(--yellow);
      color: #fff; padding: 12px 18px; border-radius: 12px; font-weight: 700; display: none; z-index: 999;
      box-shadow: 0 10px 30px rgba(0,0,0,.5); max-width: 420px;
    }
    .check-row { display: flex; align-items: center; gap: 8px; padding-top: 24px; }
    .check-row input { width: auto; }
    details summary { cursor: pointer; font-weight: 700; color: var(--yellow); font-size: 0.9rem; }
  </style>
</head>
<body>
  <header>
    <div class="brand">RUN<span>PASSION</span> CMS</div>
    <div class="top-actions">
      <button class="btn-ghost" onclick="newArticle()">+ Nouvel article</button>
      <a class="btn btn-ghost" href="/preview/" target="_blank">Prévisualiser le site</a>
      <button class="btn-yellow" onclick="saveArticle(false)">Enregistrer</button>
      <button class="btn-green" id="pubBtn" onclick="saveArticle(true)">Publier sur RunPassion.fr</button>
    </div>
  </header>

  <div class="main">
    <aside>
      <div class="sidebar-top">
        <input id="search" placeholder="Rechercher un article..." oninput="renderList()" />
        <select id="catFilter" onchange="renderList()">
          <option value="">Toutes les catégories</option>
          <option value="Tests">Tests</option>
          <option value="Actualités">Actualités</option>
          <option value="Conseils">Conseils</option>
          <option value="Guides">Guides</option>
          <option value="Matériel">Matériel</option>
        </select>
      </div>
      <div class="list" id="articleList"></div>
    </aside>

    <div class="editor-wrap">
      <div class="card grid">
        <div class="full">
          <label>Titre de l'article</label>
          <input id="title" placeholder="Ex: Test Saucony Endorphin Azura" oninput="autoSlug()" />
        </div>
        <div>
          <label>Slug (URL : runpassion.fr/slug)</label>
          <input id="slug" placeholder="saucony-endorphin-azura" />
        </div>
        <div>
          <label>Catégorie</label>
          <select id="category">
            <option value="Tests">Tests</option>
            <option value="Actualités">Actualités</option>
            <option value="Conseils">Conseils</option>
            <option value="Guides">Guides</option>
            <option value="Matériel">Matériel</option>
          </select>
        </div>
        <div>
          <label>Date de publication</label>
          <input id="date" type="date" />
        </div>
        <div>
          <label>Auteur</label>
          <input id="author" value="Vincent" />
        </div>
        <div class="full">
          <label>Lien produit Top4Running (a_box=sc3esau3 ajouté automatiquement)</label>
          <input id="affiliateLink" placeholder="https://top4running.fr/p/..." />
        </div>
        <div class="full">
          <label>Image de couverture</label>
          <div class="img-row">
            <img id="heroPreview" class="preview-img" src="/preview/images/marathon.webp" />
            <input id="image" placeholder="images/mon-test-hero.webp" oninput="updatePreview()" />
            <input type="file" id="heroFile" accept="image/*" style="display:none" onchange="uploadImage(this, true)" />
            <button class="btn-ghost" type="button" onclick="document.getElementById('heroFile').click()">Importer &amp; WebP</button>
          </div>
        </div>
        <div class="full">
          <label>Extrait SEO (1 à 2 phrases pour Google &amp; réseaux sociaux)</label>
          <textarea id="excerpt" rows="2" placeholder="Résumé court..."></textarea>
        </div>
        <div class="check-row">
          <input id="featured" type="checkbox" />
          <label for="featured" style="margin:0; cursor:pointer;">Mettre en avant (À la une)</label>
        </div>
        <div style="text-align:right; padding-top:18px;">
          <button class="btn-danger" id="delBtn" onclick="deleteArticle()" style="display:none">Supprimer cet article</button>
        </div>
      </div>

      <div class="card">
        <details>
          <summary>Fiche technique chaussure (optionnel : poids, drop, stack, prix...)</summary>
          <div class="grid" style="margin-top:14px;">
            <div><label>Poids</label><input id="spec_poids" placeholder="242g (en 42.5)" /></div>
            <div><label>Drop</label><input id="spec_drop" placeholder="6mm" /></div>
            <div><label>Stack</label><input id="spec_stack" placeholder="35mm / 29mm" /></div>
            <div><label>Prix</label><input id="spec_prix" placeholder="160€" /></div>
            <div><label>Profil</label><input id="spec_profil" placeholder="Neutre / Route & Chemins" /></div>
            <div><label>Usage</label><input id="spec_usage" placeholder="Footing, tempo, marathon" /></div>
          </div>
        </details>
      </div>

      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <label style="margin:0;">Contenu de l'article</label>
          <div>
            <input type="file" id="bodyImgFile" accept="image/*" style="display:none" onchange="uploadImage(this, false)" />
            <button class="btn-ghost" type="button" onclick="document.getElementById('bodyImgFile').click()">+ Insérer une photo (WebP auto)</button>
          </div>
        </div>
        <div id="editor"></div>
      </div>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script src="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.js"></script>
  <script>
    let articles = [];
    let currentId = null;
    const quill = new Quill('#editor', {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ header: [2, 3, false] }],
          ['bold', 'italic', 'underline'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'clean']
        ]
      }
    });

    function toast(msg, isErr = false) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.style.borderColor = isErr ? '#ef4444' : '#fcb900';
      t.style.display = 'block';
      clearTimeout(window._tt);
      window._tt = setTimeout(() => t.style.display = 'none', 4500);
    }

    async function loadArticles() {
      const r = await fetch('/api/articles');
      articles = await r.json();
      renderList();
      if (!currentId && articles.length) selectArticle(articles[0].id);
    }

    function renderList() {
      const q = document.getElementById('search').value.toLowerCase();
      const cat = document.getElementById('catFilter').value;
      const filtered = articles.filter(a => {
        const okQ = !q || (a.title || '').toLowerCase().includes(q) || (a.slug || '').toLowerCase().includes(q);
        const okC = !cat || (a.category || '') === cat;
        return okQ && okC;
      });
      document.getElementById('articleList').innerHTML = filtered.map(a => `
        <div class="item ${a.id === currentId ? 'active' : ''}" onclick="selectArticle(${a.id})">
          <div class="item-title">${a.title || '(Sans titre)'}</div>
          <div class="item-meta"><span>${a.category || ''}</span><span>${a.date || ''}</span></div>
        </div>
      `).join('');
    }

    function selectArticle(id) {
      const a = articles.find(x => x.id === id);
      if (!a) return;
      currentId = a.id;
      document.getElementById('title').value = a.title || '';
      document.getElementById('slug').value = a.slug || '';
      document.getElementById('category').value = a.category || 'Tests';
      document.getElementById('date').value = (a.date || '').slice(0, 10);
      document.getElementById('author').value = a.author || 'Vincent';
      document.getElementById('affiliateLink').value = a.affiliateLink || '';
      document.getElementById('image').value = a.image || '';
      document.getElementById('excerpt').value = a.excerpt || '';
      document.getElementById('featured').checked = !!a.featured;
      const sp = a.specs || {};
      ['poids','drop','stack','prix','profil','usage'].forEach(k => {
        document.getElementById('spec_' + k).value = sp[k] || '';
      });
      quill.clipboard.dangerouslyPasteHTML(a.content || '');
      document.getElementById('delBtn').style.display = 'inline-flex';
      updatePreview();
      renderList();
    }

    function newArticle() {
      currentId = null;
      document.getElementById('title').value = '';
      document.getElementById('slug').value = '';
      document.getElementById('category').value = 'Tests';
      document.getElementById('date').value = new Date().toISOString().slice(0, 10);
      document.getElementById('author').value = 'Vincent';
      document.getElementById('affiliateLink').value = '';
      document.getElementById('image').value = '';
      document.getElementById('excerpt').value = '';
      document.getElementById('featured').checked = false;
      ['poids','drop','stack','prix','profil','usage'].forEach(k => document.getElementById('spec_' + k).value = '');
      quill.setText('');
      document.getElementById('delBtn').style.display = 'none';
      updatePreview();
      renderList();
    }

    function autoSlug() {
      if (currentId !== null) return;
      const t = document.getElementById('title').value;
      const s = t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').replace(/^test-/, '');
      document.getElementById('slug').value = s;
    }

    function updatePreview() {
      const img = document.getElementById('image').value.trim();
      const el = document.getElementById('heroPreview');
      el.src = img ? (img.startsWith('http') ? img : '/preview/' + img.replace(/^\/+/, '')) : '/preview/images/marathon.webp';
    }

    async function uploadImage(input, isHero) {
      const file = input.files[0];
      if (!file) return;
      const buf = await file.arrayBuffer();
      const slugHint = document.getElementById('slug').value || 'img';
      toast('Conversion et compression WebP...');
      const r = await fetch('/api/upload?name=' + encodeURIComponent(slugHint + '-' + file.name), {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: buf
      });
      const res = await r.json();
      if (!res.ok) return toast(res.error || 'Erreur upload', true);
      if (isHero) {
        document.getElementById('image').value = res.path;
        updatePreview();
      } else {
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', res.path);
      }
      toast('Image optimisée : ' + res.path);
      input.value = '';
    }

    async function saveArticle(push) {
      const title = document.getElementById('title').value.trim();
      if (!title) return toast('Le titre est obligatoire', true);
      const specs = {};
      ['poids','drop','stack','prix','profil','usage'].forEach(k => {
        const v = document.getElementById('spec_' + k).value.trim();
        if (v) specs[k] = v;
      });
      const payload = {
        id: currentId,
        title,
        slug: document.getElementById('slug').value.trim(),
        category: document.getElementById('category').value,
        date: document.getElementById('date').value || new Date().toISOString().slice(0, 10),
        author: document.getElementById('author').value.trim() || 'Vincent',
        affiliateLink: document.getElementById('affiliateLink').value.trim(),
        image: document.getElementById('image').value.trim() || 'images/marathon.webp',
        excerpt: document.getElementById('excerpt').value.trim(),
        featured: document.getElementById('featured').checked,
        specs: Object.keys(specs).length ? specs : undefined,
        content: quill.root.innerHTML,
        push
      };
      if (push) toast('Publication en cours vers GitHub & Hostinger...');
      const r = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const res = await r.json();
      if (!res.ok) return toast(res.error || 'Erreur sauvegarde', true);
      currentId = res.id;
      await loadArticles();
      selectArticle(currentId);
      toast(push ? 'Publié ! En ligne sur runpassion.fr d\'ici 1-2 min.' : 'Enregistré en local !');
    }

    async function deleteArticle() {
      if (!currentId || !confirm('Supprimer définitivement cet article ?')) return;
      const r = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentId })
      });
      const res = await r.json();
      if (!res.ok) return toast(res.error || 'Erreur', true);
      currentId = null;
      await loadArticles();
      toast('Article supprimé (pense à Publier pour mettre en ligne).');
    }

    loadArticles();
  </script>
</body>
</html>
"""


class CMSHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def _send_json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/" or path == "/index.html":
            body = CMS_HTML.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if path == "/api/articles":
            articles = publish_site.load_articles()
            articles.sort(key=lambda x: str(x.get("date", "")), reverse=True)
            self._send_json(articles)
            return

        if path.startswith("/preview") or path.startswith("/images/"):
            rel = path[len("/preview"):] if path.startswith("/preview") else path
            rel = urllib.parse.unquote(rel).lstrip("/")
            if not rel:
                rel = "index.html"
            full = os.path.abspath(os.path.join(BASE_DIR, rel))
            if not full.startswith(BASE_DIR) or not os.path.isfile(full):
                full = os.path.join(BASE_DIR, "index.html")
            ctype, _ = mimetypes.guess_type(full)
            with open(full, "rb") as f:
                data = f.read()
            self.send_response(200)
            self.send_header("Content-Type", ctype or "application/octet-stream")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        self.send_error(404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length)

        if parsed.path == "/api/upload":
            qs = urllib.parse.parse_qs(parsed.query)
            raw_name = qs.get("name", ["image"])[0]
            stem = os.path.splitext(raw_name)[0].lower()
            stem = re.sub(r"[^a-z0-9\-]+", "-", stem).strip("-") or "img"
            os.makedirs(os.path.join(BASE_DIR, "images"), exist_ok=True)
            out_name = f"{stem}.webp"
            out_path = os.path.join(BASE_DIR, "images", out_name)
            idx = 1
            while os.path.exists(out_path):
                out_name = f"{stem}-{idx}.webp"
                out_path = os.path.join(BASE_DIR, "images", out_name)
                idx += 1
            try:
                with Image.open(io.BytesIO(raw)) as im:
                    if im.width > 1400:
                        im = im.resize((1400, int(im.height * 1400 / im.width)), Image.Resampling.LANCZOS)
                    im.save(out_path, "WEBP", quality=82, method=6)
                self._send_json({"ok": True, "path": f"images/{out_name}"})
            except Exception as e:
                self._send_json({"ok": False, "error": str(e)}, 400)
            return

        if parsed.path == "/api/save":
            try:
                payload = json.loads(raw.decode("utf-8"))
                articles = publish_site.load_articles()
                art_id = payload.get("id")
                slug = (payload.get("slug") or "").strip().strip("/")
                if not slug:
                    slug = re.sub(r"[^a-z0-9]+", "-", payload["title"].lower()).strip("-")

                aff = publish_site.ensure_abox(payload.get("affiliateLink", ""))
                new_obj = {
                    "id": art_id,
                    "title": payload["title"],
                    "slug": slug,
                    "category": payload.get("category", "Tests"),
                    "author": payload.get("author", "Vincent"),
                    "date": payload.get("date", datetime.date.today().isoformat()),
                    "image": payload.get("image", "images/marathon.webp"),
                    "featured": bool(payload.get("featured", False)),
                    "excerpt": payload.get("excerpt", ""),
                    "content": payload.get("content", ""),
                }
                if aff:
                    new_obj["affiliateLink"] = aff
                if payload.get("specs"):
                    new_obj["specs"] = payload["specs"]

                if art_id is not None:
                    articles = [new_obj if a.get("id") == art_id else a for a in articles]
                else:
                    max_id = max((int(a.get("id", 0)) for a in articles if str(a.get("id", "")).isdigit()), default=0)
                    new_obj["id"] = max_id + 1
                    articles.insert(0, new_obj)

                publish_site.sync_data_and_sitemap(articles)
                publish_site.bump_cache_buster()

                if payload.get("push"):
                    publish_site.git_publish(f"CMS: {new_obj['title']}")

                self._send_json({"ok": True, "id": new_obj["id"]})
            except Exception as e:
                self._send_json({"ok": False, "error": str(e)}, 500)
            return

        if parsed.path == "/api/delete":
            try:
                payload = json.loads(raw.decode("utf-8"))
                art_id = payload.get("id")
                articles = [a for a in publish_site.load_articles() if a.get("id") != art_id]
                publish_site.sync_data_and_sitemap(articles)
                publish_site.bump_cache_buster()
                self._send_json({"ok": True})
            except Exception as e:
                self._send_json({"ok": False, "error": str(e)}, 500)
            return

        self.send_error(404)


def main():
    os.chdir(BASE_DIR)
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("127.0.0.1", PORT), CMSHandler) as httpd:
        url = f"http://127.0.0.1:{PORT}/"
        print(f"RunPassion CMS ouvert sur {url}")
        print("Ferme cette fenetre pour arreter le CMS.")
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()
        httpd.serve_forever()


if __name__ == "__main__":
    main()
