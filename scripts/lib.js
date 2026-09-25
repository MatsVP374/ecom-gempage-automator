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
  {
    id: 'images',
    n: '5b',
    label: 'Images (OpenAI → Shopify)',
    file: FILES.plan,
    check: (p) => (p.plan?.images ?? []).length > 0 && p.plan.images.every((i) => i.url || (i.source === 'existing' && /^https?:/.test(i.existing_image ?? ''))),
  },
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
  p.steps = STEPS.map((s) => ({ id: s.id, n: s.n, label: s.label, done: fs.existsSync(path.join(dir, s.file)) && (!s.check || !!s.check(p)) }));
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
