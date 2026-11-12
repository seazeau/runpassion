import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { getSpecsForArticle, ShoeSpecs } from './specsData';
import { ensureTop4RunningAffiliateUrl } from './affiliate';

export interface ShoeBoxTheme {
  bg: string;
  spineBg: string;
  text: string;
  muted: string;
  accent: string;
  border: string;
}

export interface ShoeArchiveItem {
  id: string;
  serial: string;
  slug: string;
  brand: string;
  model: string;
  fullTitle: string;
  year: string;
  date: string;
  image: string;
  excerpt: string;
  discipline: 'Carbone & Élite' | 'Daily & Tempo' | 'Trail';
  specs: ShoeSpecs['specs'];
  notes: ShoeSpecs['notes'];
  pForts: string[];
  pFaibles: string[];
  score: number;
  affiliateUrl: string;
  theme: ShoeBoxTheme;
}

const EXCLUDED_SLUG_PATTERNS = [
  '20km-',
  'bons-plans',
  'championnat',
  'coach-',
  'corrida-',
  'coupure-',
  'endurance-',
  'grand-raid',
  'histoire-',
  'kelvin-',
  'kilian-',
  'marathon-',
  'marseille-',
  'mehdi-',
  'meilleures-chaussures',
  'ontracknight',
  'progresser-',
  'rochebrin-',
  'semi-marathon',
  'sensus-',
  'suunto-',
  'vetements-',
  'vincent-bouillard',
  'asics-metaspeed-ray', // duplicate preview of asics-metaspeed-ray-2
];

const BRAND_RULES: Array<{ match: RegExp; brand: string }> = [
  { match: /\b361/i, brand: '361°' },
  { match: /\badidas\b/i, brand: 'Adidas' },
  { match: /\basics\b/i, brand: 'Asics' },
  { match: /\bbrooks\b/i, brand: 'Brooks' },
  { match: /\bhoka\b/i, brand: 'Hoka' },
  { match: /\bkiprun\b/i, brand: 'Kiprun' },
  { match: /la[\s-]sportiva/i, brand: 'La Sportiva' },
  { match: /\bmizuno\b/i, brand: 'Mizuno' },
  { match: /new[\s-]balance/i, brand: 'New Balance' },
  { match: /\bnike\b/i, brand: 'Nike' },
  { match: /\bnnormal\b/i, brand: 'NNormal' },
  { match: /^(test[\s:-]*)?on[\s-]|^on-/i, brand: 'On' },
  { match: /\bpuma\b/i, brand: 'Puma' },
  { match: /\bsalomon\b/i, brand: 'Salomon' },
  { match: /\bsaucony\b/i, brand: 'Saucony' },
];

// Curated collector box palettes inspired by archival VHS / Sneaker collector sleeves
const COLLECTOR_THEMES: ShoeBoxTheme[] = [
  // Deep Obsidian & Acid Yellow (RunPassion Signature)
  { bg: '#121316', spineBg: '#16181d', text: '#f8fafc', muted: '#94a3b8', accent: '#ffb600', border: 'rgba(255,182,0,0.32)' },
  // Archival Crimson / Terracotta
  { bg: '#5c1916', spineBg: '#6b1d1a', text: '#fff5f2', muted: '#fca5a5', accent: '#ffb600', border: 'rgba(255,220,210,0.25)' },
  // Cobalt Studio Blue
  { bg: '#153462', spineBg: '#193d73', text: '#f0f7ff', muted: '#93c5fd', accent: '#60a5fa', border: 'rgba(147,197,253,0.28)' },
  // Warm Editorial Sand / Ivory
  { bg: '#dfd8c8', spineBg: '#d5cdbb', text: '#141413', muted: '#57534e', accent: '#b91c1c', border: 'rgba(20,20,19,0.2)' },
  // Racing Forest Green
  { bg: '#163329', spineBg: '#1b3e32', text: '#ecfdf5', muted: '#86efac', accent: '#34d399', border: 'rgba(134,239,172,0.25)' },
  // Burnt Amber / Ochre
  { bg: '#6e3814', spineBg: '#7d4017', text: '#fffbeb', muted: '#fcd34d', accent: '#fbbf24', border: 'rgba(252,211,77,0.28)' },
  // Gunmetal Slate
  { bg: '#22272e', spineBg: '#282e37', text: '#f1f5f9', muted: '#94a3b8', accent: '#38bdf8', border: 'rgba(148,163,184,0.25)' },
  // Deep Plum / Carbon Violet
  { bg: '#2d1b3d', spineBg: '#362049', text: '#faf5ff', muted: '#d8b4fe', accent: '#c084fc', border: 'rgba(216,180,254,0.25)' },
];

function stripHtml(raw: string): string {
  return (raw || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#8217;|&rsquo;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function detectBrand(slug: string, title: string): string | null {
  const combined = `${slug} ${title}`;
  for (const rule of BRAND_RULES) {
    if (rule.match.test(combined) || rule.match.test(slug)) {
      return rule.brand;
    }
  }
  return null;
}

function cleanModelName(title: string, brand: string): string {
  let clean = title
    .replace(/^(test|preview)\s*[:\-–]?\s*/i, '')
    .trim();

  // Strip brand prefix
  const brandEscaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('°', '°?');
  const brandPrefixRe = new RegExp(`^${brandEscaped}(\\s+running)?\\s*`, 'i');
  clean = clean.replace(brandPrefixRe, '').trim();

  // Strip trailing commentary after ":" or "–"
  clean = clean.split(/\s*[:–—]\s*/)[0].trim();

  // Normalize casing if all caps
  if (clean === clean.toUpperCase() && clean.length > 5) {
    clean = clean
      .split(' ')
      .map((w) => (w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
      .join(' ');
  }

  return clean || title;
}

function detectDiscipline(slug: string, title: string, profil: string, usage: string): ShoeArchiveItem['discipline'] {
  const hay = `${slug} ${title} ${profil} ${usage}`.toLowerCase();
  if (
    hay.includes('trail') ||
    hay.includes('speedgoat') ||
    hay.includes('tecton') ||
    hay.includes('mafate') ||
    hay.includes('zegama') ||
    hay.includes('ultrafly') ||
    hay.includes('hierro') ||
    hay.includes('prodigio') ||
    hay.includes('agravic') ||
    hay.includes('rift') ||
    hay.includes('ultra glide') ||
    hay.includes('kboix')
  ) {
    return 'Trail';
  }
  if (
    profil.toLowerCase().includes('elite') ||
    profil.toLowerCase().includes('compétition') ||
    hay.includes('adios pro') ||
    hay.includes('alphafly') ||
    hay.includes('vaporfly') ||
    hay.includes('metaspeed') ||
    hay.includes('endorphin pro') ||
    hay.includes('cielo x1') ||
    hay.includes('phantasm') ||
    hay.includes('cloudboom') ||
    hay.includes('fast-r') ||
    hay.includes('deviate nitro elite') ||
    hay.includes('rebellion pro') ||
    hay.includes('supercomp elite') ||
    hay.includes('takumi sen') ||
    hay.includes('kd900x') ||
    hay.includes('kipstorm elite') ||
    hay.includes('kipstorm lab') ||
    hay.includes('spectur')
  ) {
    return 'Carbone & Élite';
  }
  return 'Daily & Tempo';
}

export function getShoeArchiveItems(): ShoeArchiveItem[] {
  const articlesDirectory = path.join(process.cwd(), 'content/articles');
  if (!fs.existsSync(articlesDirectory)) return [];

  const fileNames = fs.readdirSync(articlesDirectory).filter((f) => f.endsWith('.md'));
  const rawShoes: Omit<ShoeArchiveItem, 'serial' | 'theme'>[] = [];

  for (const fileName of fileNames) {
    const slug = fileName.replace(/\.md$/, '');
    if (EXCLUDED_SLUG_PATTERNS.some((pat) => slug === pat || (pat.endsWith('-') && slug.startsWith(pat)) || (!pat.endsWith('-') && slug.includes(pat) && pat !== 'asics-metaspeed-ray'))) {
      continue;
    }
    if (slug === 'asics-metaspeed-ray') continue;

    const fullPath = path.join(articlesDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    const title = (data.title as string) || slug;
    const brand = detectBrand(slug, title);
    if (!brand) continue;

    const model = cleanModelName(title, brand);
    const { specs, notes, pForts, pFaibles } = getSpecsForArticle(title);
    const score = Number(
      ((notes.amorti + notes.dynamisme + notes.confort + notes.stabilite) / 4).toFixed(1)
    );

    const rawT4r = (content.match(/https?:\/\/top4running\.fr\/[^\s"'<>]+/i) || [])[0] || null;
    const affiliateUrl = ensureTop4RunningAffiliateUrl(rawT4r, `${brand} ${model}`);

    const dateStr = (data.date as string) || '2025-01-01';
    const year = dateStr.slice(0, 4) || '2025';
    const cleanExcerpt = stripHtml((data.excerpt as string) || content.slice(0, 320));
    const discipline = detectDiscipline(slug, title, specs.profil, specs.usage);

    rawShoes.push({
      id: slug,
      slug,
      brand,
      model,
      fullTitle: title,
      year,
      date: dateStr,
      image: (data.image as string) || '/RUN.png',
      excerpt: cleanExcerpt.length > 210 ? cleanExcerpt.slice(0, 207) + '…' : cleanExcerpt,
      discipline,
      specs,
      notes,
      pForts,
      pFaibles,
      score,
      affiliateUrl,
    });
  }

  // Sort by Brand A->Z, and within each Brand by model name DESCENDING (latest versions first: v5 > v4, Pro 4 > Pro 3)
  rawShoes.sort((a, b) => {
    const brandCmp = a.brand.localeCompare(b.brand, 'fr');
    if (brandCmp !== 0) return brandCmp;
    return b.model.localeCompare(a.model, 'fr', { numeric: true, sensitivity: 'base' });
  });

  // Assign deterministic varied collector box palettes (avoiding two adjacent identical colors!)
  return rawShoes.map((shoe, idx) => {
    const theme = COLLECTOR_THEMES[(idx * 3 + shoe.brand.length) % COLLECTOR_THEMES.length];
    return {
      ...shoe,
      serial: String(idx + 1).padStart(3, '0'),
      theme,
    };
  });
}
