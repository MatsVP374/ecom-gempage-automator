// Shared helpers for scripts/ and app/. Zero dependencies.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PRODUCTS_DIR = path.join(ROOT, 'products');

// Pipeline steps in order; `file` is what marks the step as done.
export const STEPS = [
  { id: 'input', label: 'Input', file: 'input.json' },
  { id: 'research', label: 'Research product', file: 'research.md' },
  { id: 'positioning', label: 'Positioning + name', file: 'product.json' },
  { id: 'page_en', label: 'English PDP', file: 'page.en.json' },
  { id: 'page_he', label: 'Hebrew PDP', file: 'page.he.json' },
  { id: 'angles', label: 'Ad angles', file: 'ads.json', check: (p) => p.ads?.angles?.length > 0 },
  { id: 'copy', label: 'Ad copy', file: 'ads.json', check: (p) => (p.ads?.copy?.he?.length ?? 0) > 0 },
  { id: 'creatives', label: 'Creative briefs', file: 'creatives.md' },
  { id: 'qa', label: 'QA', file: 'qa.md' },
  { id: 'export', label: 'Export', file: 'output/gempages.html' },
];

export function loadEnv() {
  const file = path.join(ROOT, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

export function isValidSlug(slug) {
  return typeof slug === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/.test(slug);
}

export function productDir(slug) {
  if (!isValidSlug(slug)) throw new Error(`Invalid slug "${slug}" (use lowercase a-z, 0-9, -)`);
  return path.join(PRODUCTS_DIR, slug);
}

export function listSlugs() {
  if (!fs.existsSync(PRODUCTS_DIR)) return [];
  return fs
    .readdirSync(PRODUCTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && isValidSlug(d.name))
    .map((d) => d.name)
    .sort();
}

export function readJSON(file) {
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    const err = new Error(`${path.relative(ROOT, file)}: invalid JSON (${e.message})`);
    err.code = 'BAD_JSON';
    throw err;
  }
}

export function readText(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

export function writeJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

// Load everything we know about a product. JSON parse errors are collected, not thrown.
export function loadProduct(slug) {
  const dir = productDir(slug);
  const errors = [];
  const json = (name) => {
    try {
      return readJSON(path.join(dir, name));
    } catch (e) {
      errors.push(e.message);
      return null;
    }
  };
  const p = {
    slug,
    dir,
    input: json('input.json'),
    product: json('product.json'),
    page: { en: json('page.en.json'), he: json('page.he.json') },
    ads: json('ads.json'),
    research: readText(path.join(dir, 'research.md')),
    creatives: readText(path.join(dir, 'creatives.md')),
    qa: readText(path.join(dir, 'qa.md')),
    parseErrors: errors,
  };
  p.steps = STEPS.map((s) => ({
    id: s.id,
    label: s.label,
    done: fs.existsSync(path.join(dir, s.file)) && (!s.check || !!s.check(p)),
  }));
  return p;
}

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function formatPrice(amount, currency = 'ILS') {
  if (amount == null) return '';
  const sym = { ILS: '₪', EUR: '€', USD: '$' }[currency] ?? '';
  return `${sym}${Math.round(amount)}`;
}

const HE_LABELS = { size_guide_fallback: 'טבלת מידות', add: 'הוסיפי לסל', placeholder: 'ביקורות לדוגמה – יוחלפו בביקורות אמיתיות' };
const EN_LABELS = { size_guide_fallback: 'Size guide', add: 'Add to cart', placeholder: 'Example reviews – replace with real reviews' };

function renderSection(s, L) {
  const t = s.title ? `<h2>${esc(s.title)}</h2>` : '';
  switch (s.type) {
    case 'hero':
      return `<section class="ad-hero"><h1>${esc(s.headline)}</h1><p>${esc(s.subheadline)}</p>${hint(s.image_hint)}</section>`;
    case 'benefits':
      return `<section class="ad-benefits">${t}<div class="ad-grid">${(s.items ?? [])
        .map((i) => `<div class="ad-card"><div class="ad-icon">${esc(i.icon)}</div><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p></div>`)
        .join('')}</div></section>`;
    case 'story':
      return `<section class="ad-story">${t}<p>${esc(s.text)}</p>${hint(s.image_hint)}</section>`;
    case 'features':
      return `<section class="ad-features">${t}<ul>${(s.items ?? []).map((i) => `<li>${esc(i)}</li>`).join('')}</ul></section>`;
    case 'comparison':
      return `<section class="ad-comparison">${t}<table><thead><tr><th></th><th>${esc(s.us_label)}</th><th>${esc(s.them_label)}</th></tr></thead><tbody>${(s.rows ?? [])
        .map((r) => `<tr><td>${esc(r.label)}</td><td>${r.us ? '✓' : '✗'}</td><td>${r.them ? '✓' : '✗'}</td></tr>`)
        .join('')}</tbody></table></section>`;
    case 'size_guide':
      return `<section class="ad-size">${s.title ? t : `<h2>${L.size_guide_fallback}</h2>`}<table><thead><tr>${(s.headers ?? [])
        .map((h) => `<th>${esc(h)}</th>`)
        .join('')}</tr></thead><tbody>${(s.rows ?? []).map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>${
        s.note ? `<p class="ad-note">${esc(s.note)}</p>` : ''
      }</section>`;
    case 'reviews':
      return `<section class="ad-reviews">${t}${s.placeholder ? `<p class="ad-placeholder">${L.placeholder}</p>` : ''}<div class="ad-grid">${(s.items ?? [])
        .map((r) => `<div class="ad-card"><div class="ad-stars">${'★'.repeat(r.rating ?? 5)}</div><p>${esc(r.text)}</p><small>${esc(r.name)}${r.city ? ', ' + esc(r.city) : ''}</small></div>`)
        .join('')}</div></section>`;
    case 'faq':
      return `<section class="ad-faq">${t}${(s.items ?? []).map((i) => `<details><summary>${esc(i.q)}</summary><p>${esc(i.a)}</p></details>`).join('')}</section>`;
    case 'guarantee':
      return `<section class="ad-guarantee">${t}<p>${esc(s.text)}</p></section>`;
    case 'cta':
      return `<section class="ad-cta"><h2>${esc(s.headline)}</h2><button type="button">${esc(s.button)}</button><p>${esc(s.subtext)}</p></section>`;
    default:
      return `<!-- unknown section type: ${esc(s.type)} -->`;
  }
}

function hint(h) {
  return h ? `<div class="ad-image-hint">📷 ${esc(h)}</div>` : '';
}

export const PAGE_CSS = `
.adina-pdp{--ink:#2b2522;--muted:#7a6f69;--accent:#8a5a44;--bg:#fbf8f5;--card:#fff;--line:#eadfd6;
  font-family:"Assistant","Heebo",system-ui,sans-serif;color:var(--ink);background:var(--bg);max-width:720px;margin:0 auto;padding:16px;line-height:1.6}
.adina-pdp h1{font-size:1.7rem;margin:.2em 0}.adina-pdp h2{font-size:1.3rem;margin:1.6em 0 .6em}
.adina-pdp .ad-top h1{font-size:1.5rem}.adina-pdp .ad-sub{color:var(--muted);margin:0 0 .6em}
.adina-pdp .ad-price{font-size:1.5rem;font-weight:700;display:flex;gap:.5em;align-items:baseline}.adina-pdp .ad-price s{color:var(--muted);font-weight:400;font-size:1rem}
.adina-pdp .ad-badge{display:inline-block;background:var(--accent);color:#fff;border-radius:99px;padding:2px 12px;font-size:.85rem;margin:.4em 0}
.adina-pdp .ad-bullets{list-style:none;padding:0}.adina-pdp .ad-bullets li::before{content:"✓ ";color:var(--accent);font-weight:700}
.adina-pdp button{background:var(--ink);color:#fff;border:0;border-radius:10px;padding:14px;font-size:1.05rem;width:100%;cursor:pointer;font-family:inherit}
.adina-pdp .ad-trust{text-align:center;color:var(--muted);font-size:.85rem}
.adina-pdp section{border-top:1px solid var(--line);padding-top:4px}.adina-pdp .ad-hero{text-align:center;border:0}
.adina-pdp .ad-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
.adina-pdp .ad-card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px}.adina-pdp .ad-card h3{margin:.2em 0;font-size:1rem}.adina-pdp .ad-card p{margin:0}
.adina-pdp .ad-icon{font-size:1.5rem}.adina-pdp .ad-stars{color:#c9973b}
.adina-pdp table{width:100%;border-collapse:collapse;background:var(--card)}.adina-pdp td,.adina-pdp th{border:1px solid var(--line);padding:6px;text-align:center}
.adina-pdp details{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px;margin:6px 0}.adina-pdp summary{font-weight:600;cursor:pointer}
.adina-pdp .ad-image-hint{border:2px dashed var(--line);border-radius:12px;padding:18px;color:var(--muted);font-size:.85rem;margin:8px 0}
.adina-pdp .ad-placeholder{background:#fff4d6;border-radius:8px;padding:6px 10px;font-size:.85rem}
.adina-pdp .ad-note{color:var(--muted);font-size:.9rem}.adina-pdp .ad-cta{text-align:center}
`;

// Renders a page.{lang}.json into a self-contained HTML fragment (no <html>).
export function renderPageFragment(page) {
  const L = page.lang === 'he' ? HE_LABELS : EN_LABELS;
  const price = page.price ?? {};
  return `<div class="adina-pdp" dir="${esc(page.dir ?? (page.lang === 'he' ? 'rtl' : 'ltr'))}" lang="${esc(page.lang)}">
<div class="ad-top">
<h1>${esc(page.title)}</h1>
<p class="ad-sub">${esc(page.subtitle)}</p>
<div class="ad-price"><span>${formatPrice(price.current, price.currency)}</span>${price.compare_at ? `<s>${formatPrice(price.compare_at, price.currency)}</s>` : ''}</div>
${page.badge ? `<span class="ad-badge">${esc(page.badge)}</span>` : ''}
<ul class="ad-bullets">${(page.bullets ?? []).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
<button type="button">${esc(page.cta ?? L.add)}</button>
<p class="ad-trust">${esc(page.trust_line)}</p>
</div>
${(page.sections ?? []).map((s) => renderSection(s, L)).join('\n')}
</div>`;
}

export function renderPageDocument(page) {
  return `<!doctype html>
<html lang="${esc(page.lang)}" dir="${esc(page.dir)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(page.seo?.title ?? page.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap" rel="stylesheet">
<style>body{margin:0;background:#fbf8f5}${PAGE_CSS}</style></head>
<body>${renderPageFragment(page)}</body></html>`;
}

// Parse "--key value" / "--flag" style args.
export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) args[key] = true;
      else args[key] = argv[++i];
    } else args._.push(a);
  }
  return args;
}
