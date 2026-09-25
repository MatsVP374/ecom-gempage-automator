// Shared helpers for scripts/ and app/. Zero dependencies.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export let PRODUCTS_DIR = process.env.ADINA_PRODUCTS_DIR ? path.resolve(process.env.ADINA_PRODUCTS_DIR) : path.join(ROOT, 'products');
export const CONFIG_FILE = path.join(ROOT, 'config', 'adina.json');

// Output files per product, named as in the final launch package.
export const FILES = {
  input: 'input.json',
  facts: '01-product-facts.json',
  angle: '02-central-angle.json',
  gempageEn: '03-gempage-copy.en.json',
  plan: '04-gempage-image-plan.json',
  prompts: '05-image-prompts.json',
  gempageHe: '03-gempage-copy.he.json',
  ads: '06-meta-ads.json',
  creatives: '07-creative-plan.json',
  ugc: '08-ugc.json',
  qa: '09-qa-report.md',
};

// Pipeline steps in order; `file` marks the step as done.
export const STEPS = [
  { id: 'input', n: 0, label: 'Product input', file: FILES.input },
  { id: 'facts', n: 1, label: 'Product facts', file: FILES.facts },
  { id: 'angle', n: 2, label: 'Central angle', file: FILES.angle },
  { id: 'gempage', n: 3, label: 'GemPage copy (EN master)', file: FILES.gempageEn },
  { id: 'image-plan', n: 4, label: 'GemPage image plan', file: FILES.plan },
  { id: 'image-prompts', n: 5, label: 'Image prompts', file: FILES.prompts },
  { id: 'gempage-he', n: 6, label: 'GemPage build (HE)', file: FILES.gempageHe },
  { id: 'qc', n: 7, label: 'Quality control', file: FILES.qa },
  { id: 'meta-ads', n: 8, label: '2 Meta ads', file: FILES.ads },
  { id: 'creatives', n: 9, label: 'Creative plan + UGC', file: FILES.creatives },
  { id: 'package', n: 10, label: 'Launch package', file: 'output/launch-package.md' },
];

export function setProductsDir(dir) {
  PRODUCTS_DIR = path.resolve(dir);
}

export function loadEnv() {
  const file = path.join(ROOT, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

export function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
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
    .filter((d) => d.isDirectory() && isValidSlug(d.name) && fs.existsSync(path.join(PRODUCTS_DIR, d.name, FILES.input)))
    .map((d) => d.name)
    .sort();
}

export function readJSON(file) {
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    const err = new Error(`${path.basename(file)}: invalid JSON (${e.message})`);
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
  const parseErrors = [];
  const json = (name) => {
    try {
      return readJSON(path.join(dir, name));
    } catch (e) {
      parseErrors.push(e.message);
      return null;
    }
  };
  const p = {
    slug,
    dir,
    input: json(FILES.input),
    facts: json(FILES.facts),
    angle: json(FILES.angle),
    gempage: { en: json(FILES.gempageEn), he: json(FILES.gempageHe) },
    plan: json(FILES.plan),
    prompts: json(FILES.prompts),
    ads: json(FILES.ads),
    creatives: json(FILES.creatives),
    ugc: json(FILES.ugc),
    qa: readText(path.join(dir, FILES.qa)),
    parseErrors,
  };
  p.steps = STEPS.map((s) => ({ id: s.id, n: s.n, label: s.label, done: fs.existsSync(path.join(dir, s.file)) }));
  return p;
}

// Which input fields are required, and whether they are filled.
export const REQUIRED_INPUT = [
  ['product_name', 'identify the product everywhere'],
  ['hebrew_product_name', 'offer box, ads, sticky CTA'],
  ['product_type', 'fact sheet and image prompts'],
  ['regular_price', 'sale section, offer box, ads'],
  ['sale_price', 'sale section, offer box, ads, sticky CTA'],
  ['promotion', 'sale section and ad descriptions'],
  ['sale_reason', 'sale section ("why it is on sale now")'],
  ['colors', 'offer box, image prompts, creatives'],
  ['sizes', 'offer box and ads'],
  ['features', 'benefits (every benefit must trace to a feature)'],
  ['existing_product_page', 'fact sheet (url or pasted content)'],
  ['existing_product_images', 'reference images for image prompts'],
];

export function isFilled(v) {
  if (v == null) return false;
  if (typeof v === 'string') return v.trim() !== '';
  if (typeof v === 'number') return Number.isFinite(v) && v > 0;
  if (Array.isArray(v)) return v.some(isFilled);
  if (typeof v === 'object') return Object.values(v).some(isFilled);
  return !!v;
}

export function missingInput(input) {
  if (!input) return REQUIRED_INPUT.map(([field, why]) => ({ field, needed_for: why }));
  return REQUIRED_INPUT.filter(([field]) => !isFilled(input[field])).map(([field, why]) => ({ field, needed_for: why }));
}

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const shekel = (n) => (n == null || n === '' ? '' : `₪${n}`);

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

// ---------- Founder-letter renderer (preview + GemPages paste) ----------

export const LETTER_CSS = `
.adina-letter{--ink:#2b2522;--muted:#6f655f;--green:#2f6b4f;--green-soft:#e6f0ea;--accent:#8a5a44;--bg:#fbf8f5;--card:#fff;--line:#eadfd6;
  font-family:"Assistant","Heebo",system-ui,sans-serif;color:var(--ink);background:var(--bg);max-width:720px;margin:0 auto;padding:16px 16px 96px;line-height:1.75;font-size:17px}
.adina-letter h1{font-size:1.9rem;line-height:1.25;margin:.3em 0}.adina-letter h2{font-size:1.35rem;margin:1.6em 0 .5em;line-height:1.3}
.adina-letter p{margin:.6em 0}.adina-letter .muted{color:var(--muted)}
.adina-letter .al-byline{font-weight:700}.adina-letter .al-date{color:var(--muted);font-size:.9rem}
.adina-letter .al-note{background:var(--green-soft);color:var(--green);border-radius:10px;padding:10px 14px;margin:12px 0;font-weight:600}
.adina-letter .al-badge{display:inline-block;border:1px solid var(--green);color:var(--green);border-radius:99px;padding:2px 12px;font-size:.85rem}
.adina-letter .al-subtitle{font-size:1.15rem;color:var(--muted)}
.adina-letter .al-img{border:2px dashed var(--line);border-radius:14px;padding:22px 14px;color:var(--muted);font-size:.85rem;margin:14px 0;text-align:center;background:#fff}
.adina-letter .al-img b{color:var(--ink)}.adina-letter img.al-photo{width:100%;border-radius:14px;margin:14px 0}
.adina-letter .al-benefit{margin:26px 0}.adina-letter .al-num{display:inline-flex;width:34px;height:34px;border-radius:50%;background:var(--ink);color:#fff;align-items:center;justify-content:center;font-weight:700;margin-inline-end:8px}
.adina-letter table{width:100%;border-collapse:collapse;background:var(--card);font-size:.95rem}.adina-letter td,.adina-letter th{border:1px solid var(--line);padding:8px;text-align:center}
.adina-letter .al-hl{background:var(--green-soft);font-weight:700}
.adina-letter blockquote{margin:24px 0;padding:14px 18px;border-inline-start:4px solid var(--accent);background:var(--card);font-size:1.2rem;font-style:italic}
.adina-letter .al-prices{font-size:1.6rem;font-weight:700;display:flex;gap:.6em;align-items:baseline}.adina-letter .al-prices s{font-size:1.05rem;color:var(--muted);font-weight:400}
.adina-letter .al-trust{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center;margin:18px 0}
.adina-letter .al-trust div{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px 4px}.adina-letter .al-trust b{display:block;font-size:1.2rem}
.adina-letter .al-trust span{font-size:.8rem;color:var(--muted)}
.adina-letter .al-stars{color:#c9973b;font-size:1.3rem}
.adina-letter .al-offer{background:var(--card);border:2px solid var(--ink);border-radius:16px;padding:18px;margin:24px 0}
.adina-letter .al-offer ul{list-style:none;padding:0}.adina-letter .al-offer li::before{content:"✓ ";color:var(--green);font-weight:700}
.adina-letter .al-bundle div{display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding:6px 0}
.adina-letter button{background:var(--ink);color:#fff;border:0;border-radius:12px;padding:15px;font-size:1.05rem;width:100%;cursor:pointer;font-family:inherit;margin:10px 0}
.adina-letter .al-sticky{position:fixed;bottom:0;inset-inline:0;background:var(--ink);color:#fff;text-align:center;padding:14px;font-weight:600}
.adina-letter .al-signoff{font-weight:700;font-size:1.1rem}
@media (max-width:480px){.adina-letter .al-trust{grid-template-columns:repeat(2,1fr)}}
`;

// Escape + keep "15+" / "2,550+" / "4.7/5" left-to-right inside RTL text (otherwise they render as "+15").
const bidi = (s) => esc(s).replace(/(\d[\d.,/]*\+|\d+(?:\.\d+)?\/\d+)/g, '<bdi dir="ltr">$1</bdi>');

function imageSlot(id, planById, input) {
  if (!id) return '';
  const img = planById[id];
  const existing = img?.source === 'existing' ? img.existing_image : null;
  if (existing && /^https?:\/\//.test(existing)) return `<img class="al-photo" src="${esc(existing)}" alt="${esc(img.purpose)}">`;
  const label = img ? `${img.role} · ${img.source === 'existing' ? `existing: ${img.existing_image}` : `generate · ${img.product_color ?? ''}`}` : 'not in image plan';
  return `<div class="al-img">📷 <b>${esc(id)}</b> — ${esc(label)}${img?.purpose ? `<br>${esc(img.purpose)}` : ''}</div>`;
}

function block(b, ctx) {
  const img = (id) => imageSlot(id, ctx.planById, ctx.input);
  switch (b.type) {
    case 'founder_header':
      return `<header><div class="al-byline">${bidi(b.byline)}</div><div class="al-date">${bidi(b.place_date)}</div>
<div class="al-note">${bidi(b.note)}</div><span class="al-badge">${bidi(b.badge)}</span></header>`;
    case 'headline':
      return `<h1>${bidi(b.headline)}</h1><p class="al-subtitle">${bidi(b.subtitle)}</p>`;
    case 'hero':
      return img(b.image);
    case 'founder_story':
      return `<section><p><b>${bidi(b.greeting)}</b></p>${(b.parts ?? []).map((p) => `<p data-role="${bidi(p.role)}">${bidi(p.text)}</p>`).join('')}</section>`;
    case 'benefits':
      return `<section>${b.title ? `<h2>${bidi(b.title)}</h2>` : ''}${(b.items ?? [])
        .map((i) => `<div class="al-benefit"><h2><span class="al-num">${bidi(i.n)}</span>${bidi(i.headline)}</h2><p>${bidi(i.text)}</p>${img(i.image)}</div>`)
        .join('')}</section>`;
    case 'comparison': {
      const c = b.columns ?? {};
      return `<section><h2>${bidi(b.title)}</h2><table><thead><tr><th></th><th>${bidi(c.a)}</th><th>${bidi(c.b)}</th><th class="al-hl">${bidi(c.product)}</th></tr></thead><tbody>${(b.rows ?? [])
        .map((r) => `<tr><td>${bidi(r.label)}</td><td>${bidi(r.a)}</td><td>${bidi(r.b)}</td><td class="al-hl">${bidi(r.product)}</td></tr>`)
        .join('')}</tbody></table></section>`;
    }
    case 'founder_quote':
      return `<blockquote>"${bidi(b.quote)}"<br><small>— ${bidi(b.author)}</small></blockquote>`;
    case 'sale':
      return `<section><h2>${bidi(b.title)}</h2>${(b.paragraphs ?? []).map((p) => `<p>${bidi(p)}</p>`).join('')}
<div class="al-prices"><span>${shekel(b.sale_price)}</span><s>${shekel(b.regular_price)}</s></div>${b.availability_note ? `<p class="muted">${bidi(b.availability_note)}</p>` : ''}</section>`;
    case 'trust_bar':
      return `<div class="al-trust">${(b.items ?? []).map((i) => `<div><b>${bidi(i.value)}</b><span>${bidi(i.label)}</span></div>`).join('')}</div>`;
    case 'packing':
      return `<section>${img(b.image)}<p class="muted">${bidi(b.caption)}</p></section>`;
    case 'founder_observation':
      return `<section><p>${bidi(b.text)}</p></section>`;
    case 'social_proof':
      return `<section><div class="al-stars">★★★★★</div><p><b>${bidi(b.rating)}/5</b> · ${bidi(b.reviews_label)}</p><p>${bidi(b.text)}</p>${(b.quotes ?? [])
        .map((q) => `<blockquote>${bidi(q.text)}</blockquote>`)
        .join('')}</section>`;
    case 'offer_box':
      return `<div class="al-offer"><h2>${bidi(b.product_name)}</h2><div class="al-stars">${bidi(b.rating_line)}</div>
<div class="al-prices"><span>${shekel(b.sale_price)}</span><s>${shekel(b.regular_price)}</s></div><ul>${(b.bullets ?? []).map((x) => `<li>${bidi(x)}</li>`).join('')}</ul></div>`;
    case 'bundle':
      return `<section class="al-bundle"><h2>${bidi(b.title)}</h2>${(b.tiers ?? []).map((t) => `<div><span>${bidi(t.label)}</span></div>`).join('')}</section>`;
    case 'cta':
      return `<button type="button">${bidi(b.button)}</button>${b.subtext ? `<p class="muted" style="text-align:center">${bidi(b.subtext)}</p>` : ''}`;
    case 'about':
      return `<section><h2>${bidi(b.title)}</h2><p>${bidi(b.text)}</p><p class="al-signoff">${bidi(b.signoff)}</p></section>`;
    case 'sticky_cta':
      return `<div class="al-sticky">${bidi(b.text)}</div>`;
    default:
      return `<!-- unknown block type: ${bidi(b.type)} -->`;
  }
}

// Renders a 03-gempage-copy.*.json into a self-contained HTML fragment.
export function renderLetterFragment(page, { plan = null, input = null } = {}) {
  const planById = Object.fromEntries((plan?.images ?? []).map((i) => [i.id, i]));
  const ctx = { planById, input };
  return `<div class="adina-letter" dir="${esc(page.dir ?? (page.lang === 'he' ? 'rtl' : 'ltr'))}" lang="${esc(page.lang)}">
${(page.blocks ?? []).map((b) => block(b, ctx)).join('\n')}
</div>`;
}

export function renderLetterDocument(page, opts = {}) {
  const title = page.blocks?.find((b) => b.type === 'headline')?.headline ?? 'Adina Fashion';
  return `<!doctype html>
<html lang="${esc(page.lang)}" dir="${esc(page.dir)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap" rel="stylesheet">
<style>body{margin:0;background:#fbf8f5}${LETTER_CSS}</style></head>
<body>${renderLetterFragment(page, opts)}</body></html>`;
}
