export const TOP4RUNNING_AFFILIATE_PARAM = 'a_box=sc3esau3';

/**
 * Strips review prefixes ("Test", "Preview", etc.) so a shoe title becomes
 * a clean search query for Top4Running.
 */
export function buildShoeSearchQuery(title: string): string {
  return title
    .replace(/^(test|preview|avis)\s*[:\-–]?\s*/i, '')
    .split(/\s*[:–—]\s*/)[0]
    .trim();
}

/**
 * Guarantees a Top4Running URL uses HTTPS, fixes leaked query params inside
 * hash fragments (e.g. `#p0?a_box=...`), and carries `a_box=sc3esau3`.
 */
export function ensureTop4RunningAffiliateUrl(
  rawUrl?: string | null,
  fallbackQuery?: string
): string {
  if (!rawUrl || !rawUrl.trim()) {
    const q = (fallbackQuery || '').trim();
    return q
      ? `https://top4running.fr/?q=${encodeURIComponent(q)}&${TOP4RUNNING_AFFILIATE_PARAM}`
      : `https://top4running.fr/?${TOP4RUNNING_AFFILIATE_PARAM}`;
  }

  let url = rawUrl
    .replace(/&amp;/g, '&')
    .replace(/^http:\/\//i, 'https://')
    .trim();

  // Separate hash fragment if any (e.g. #p0?a_box=sc3esau3)
  let hash = '';
  const hashIdx = url.indexOf('#');
  if (hashIdx !== -1) {
    const rawHash = url.slice(hashIdx);
    url = url.slice(0, hashIdx);
    const qInHash = rawHash.indexOf('?');
    if (qInHash !== -1) {
      hash = rawHash.slice(0, qInHash);
      const leakedQuery = rawHash.slice(qInHash + 1);
      url += (url.includes('?') ? '&' : '?') + leakedQuery;
    } else {
      hash = rawHash;
    }
  }

  // Replace any existing/empty a_box param or append our affiliate param
  if (/([?&])a_box=[^&]*/i.test(url)) {
    url = url.replace(/([?&])a_box=[^&]*/i, `$1${TOP4RUNNING_AFFILIATE_PARAM}`);
  } else {
    url += (url.includes('?') ? '&' : '?') + TOP4RUNNING_AFFILIATE_PARAM;
  }

  return url + hash;
}

/**
 * Rewrites every Top4Running href inside article HTML so all inline links
 * carry `a_box=sc3esau3` cleanly.
 */
export function normalizeTop4RunningLinksInHtml(html: string): string {
  if (!html) return html;
  return html.replace(
    /href=(["'])(https?:\/\/(?:www\.)?top4running\.[^"']+)\1/gi,
    (_match, quote: string, url: string) => {
      const normalized = ensureTop4RunningAffiliateUrl(url);
      return `href=${quote}${normalized}${quote}`;
    }
  );
}

/**
 * Extracts the best Top4Running product link from article HTML, or falls back
 * to a targeted Top4Running search for the reviewed shoe model.
 */
export function extractBestTop4RunningLink(
  html: string | undefined,
  shoeTitle: string
): string {
  if (html) {
    const productMatch = html.match(
      /href=["'](https?:\/\/(?:www\.)?top4running\.[^"']*\/p\/[^"']+)["']/i
    );
    if (productMatch) {
      return ensureTop4RunningAffiliateUrl(productMatch[1]);
    }
    const anyMatch = html.match(
      /href=["'](https?:\/\/(?:www\.)?top4running\.[^"']+)["']/i
    );
    if (anyMatch) {
      return ensureTop4RunningAffiliateUrl(anyMatch[1], buildShoeSearchQuery(shoeTitle));
    }
  }
  return ensureTop4RunningAffiliateUrl(null, buildShoeSearchQuery(shoeTitle));
}
