import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import { normalizeTop4RunningLinksInHtml } from './affiliate'

const articlesDirectory = path.join(process.cwd(), 'content/articles')

const WP_UPLOAD_URL_RE =
  /https?:\/\/(?:i\d\.wp\.com\/)?(?:www\.)?runpassion\.fr\/wp-content\/uploads\/(?:\d{4}\/\d{2}\/)?([^"'\s?#)]+)/gi;

/**
 * Rewrites legacy WordPress upload URLs (`runpassion.fr/wp-content/uploads/...`)
 * to the flattened WebP assets hosted in `/images/<basename>.webp`.
 */
export function normalizeArticleImageUrl(url?: string | null): string {
  if (!url) return '';
  return url.replace(WP_UPLOAD_URL_RE, (_match, rawFilePath: string) => {
    const fileName = rawFilePath.split('/').pop() || rawFilePath;
    const baseName = fileName.replace(/(?:\.(?:jpe?g|png|webp|gif))+$/i, '');
    return `/images/${baseName}.webp`;
  });
}

function normalizeArticleImagesInHtml(htmlContent: string): string {
  if (!htmlContent) return htmlContent;
  return htmlContent.replace(WP_UPLOAD_URL_RE, (match) =>
    normalizeArticleImageUrl(match)
  );
}

export interface ArticleData {
  slug: string;
  title: string;
  date: string;
  category: string;
  image: string;
  excerpt: string;
  contentHtml?: string;
}

export function getSortedArticlesData(): ArticleData[] {
  if (!fs.existsSync(articlesDirectory)) return []
  const fileNames = fs.readdirSync(articlesDirectory)
  const allArticlesData = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.md$/, '')
    const fullPath = path.join(articlesDirectory, fileName)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const matterResult = matter(fileContents)

    const data = matterResult.data as { date: string; title: string; category: string; image: string; excerpt: string };
    return {
      slug,
      ...data,
      image: normalizeArticleImageUrl(data.image),
    }
  })

  return allArticlesData.sort((a, b) => {
    if (a.date < b.date) {
      return 1
    } else {
      return -1
    }
  })
}

export function getAllArticleSlugs() {
  if (!fs.existsSync(articlesDirectory)) return []
  const fileNames = fs.readdirSync(articlesDirectory)
  return fileNames.map((fileName) => {
    return {
      slug: fileName.replace(/\.md$/, ''),
    }
  })
}

export async function getArticleData(slug: string): Promise<ArticleData | null> {
  const fullPath = path.join(articlesDirectory, `${slug}.md`)
  if (!fs.existsSync(fullPath)) return null
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const matterResult = matter(fileContents)

  let parsedContent = matterResult.content;

  // 1. Transform Kadence icon lists to styled grid
  parsedContent = parsedContent.replace(/<div class="wp-block-kadence-iconlist[^>]*>([\s\S]*?)<\/div>/g, (match, innerHtml) => {
    const items: string[] = [];
    const liRegex = /<span class="kt-svg-icon-list-text">(.*?)<\/span>/g;
    let matchLi;
    while ((matchLi = liRegex.exec(innerHtml)) !== null) {
        items.push(matchLi[1]);
    }
    const renderedItems = items.map(item => `
        <li class="flex items-center gap-3 bg-brand-cardGray p-4 rounded-xl border border-white/5 shadow-md">
            <svg class="w-5 h-5 text-brand-yellow shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <span class="text-white font-medium">${item}</span>
        </li>
    `).join('');
    return `<ul class="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8">${renderedItems}</ul>`;
  });

  // 2. Strip WP comment nodes to get clean HTML
  parsedContent = parsedContent.replace(/<!-- wp:[^>]*-->/g, '').replace(/<!-- \/wp:[^>]*-->/g, '');

  // 3. Group consecutive image blocks into gallery grids
  parsedContent = groupConsecutiveImages(parsedContent);

  // 4. Normalize all Top4Running affiliate links (ensure HTTPS + a_box=sc3esau3)
  parsedContent = normalizeTop4RunningLinksInHtml(parsedContent);

  // 5. Rewrite legacy WordPress upload URLs to /images/<basename>.webp
  parsedContent = normalizeArticleImagesInHtml(parsedContent);

  const data = matterResult.data as { date: string; title: string; category: string; image: string; excerpt: string };

  return {
    slug,
    contentHtml: parsedContent,
    ...data,
    image: normalizeArticleImageUrl(data.image),
  }
}

/**
 * Parses HTML, finds consecutive <figure> or <p><img> blocks, and
 * wraps groups of 2+ in a responsive flex gallery row.
 */
function groupConsecutiveImages(html: string): string {
  // Match <figure>...</figure> or <p> containing only an <img>
  const IMAGE_BLOCK_RE = /(<figure\b[^>]*>[\s\S]*?<\/figure>|<p[^>]*>\s*<img\b[^>]*\/?>\s*<\/p>)/gi;
  
  const parts: Array<{ type: 'text' | 'image'; content: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  
  IMAGE_BLOCK_RE.lastIndex = 0;
  while ((match = IMAGE_BLOCK_RE.exec(html)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: html.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'image', content: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < html.length) {
    parts.push({ type: 'text', content: html.slice(lastIndex) });
  }

  let result = '';
  let i = 0;
  
  while (i < parts.length) {
    if (parts[i].type === 'text') {
      // If this text is ONLY whitespace, don't output it yet — it might be between images
      // We'll output it once we know what comes after
      const isWhitespaceOnly = /^\s*$/.test(parts[i].content);
      if (!isWhitespaceOnly) {
        result += parts[i].content;
      }
      i++;
    } else {
      // We're at an image — collect all consecutive images, treating whitespace-only text as transparent
      const group: string[] = [];
      const skippedWhitespace: string[] = []; // whitespace parts between images (to discard if they end up as "gap")
      
      while (i < parts.length) {
        if (parts[i].type === 'image') {
          group.push(parts[i].content);
          skippedWhitespace.length = 0; // reset: we consumed these whitespace nodes into the group
          i++;
        } else if (/^\s*$/.test(parts[i].content)) {
          // Whitespace-only text — might be a gap between images; peek ahead
          skippedWhitespace.push(parts[i].content);
          i++;
        } else {
          // Real text content — this breaks the image group
          break;
        }
      }
      
      // If there are leftover whitespace nodes after the last image, emit them
      // (they weren't consumed between images)
      const trailingWhitespace = skippedWhitespace.join('');
      
      if (group.length === 1) {
        // Single image — display full-width, clean
        result += renderSingleImage(group[0]);
        result += trailingWhitespace;
      } else {
        // Multiple consecutive images — gallery grid
        const cols = group.length >= 3 ? 3 : 2;
        const gridStyle = `display:grid;grid-template-columns:repeat(${cols},1fr);gap:12px;margin:2rem 0;`;
        const items = group.map(block => {
          const imgMatch = block.match(/<img\b[^>]*\/?>/i);
          const captionMatch = block.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
          const imgTag = imgMatch 
            ? imgMatch[0]
                .replace(/style="[^"]*"/i, '') // remove inline width/height constraints
                .replace(/<img\b/i, '<img style="width:100%;height:100%;object-fit:cover;aspect-ratio:4/3;border-radius:12px;" ')
            : '';
          const caption = captionMatch ? `<p style="text-align:center;font-size:0.75rem;color:#6b7280;margin-top:0.5rem;font-style:italic;">${captionMatch[1]}</p>` : '';
          return `<div style="overflow:hidden;border-radius:12px;">${imgTag}${caption}</div>`;
        }).join('');
        
        result += `<div class="auto-gallery" style="${gridStyle}">${items}</div>`;
        result += trailingWhitespace;
      }
    }
  }

  return result;
}

function renderSingleImage(block: string): string {
  const imgMatch = block.match(/<img\b[^>]*\/?>/i);
  const captionMatch = block.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
  const imgTag = imgMatch
    ? imgMatch[0]
        .replace(/style="[^"]*"/i, '')
        .replace(/<img\b/i, '<img style="display:block;width:100%;height:auto;border-radius:16px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.5);margin:0 auto;" ')
    : '';
  const caption = captionMatch ? `<p style="text-align:center;font-size:0.8rem;color:#6b7280;margin-top:0.5rem;font-style:italic;">${captionMatch[1]}</p>` : '';
  return `<figure style="margin:2rem auto;display:block;">${imgTag}${caption}</figure>`;
}


