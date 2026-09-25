#!/usr/bin/env node
// Create products/<slug>/input.json following the product input blueprint (templates/product-input.md).
// Usage: node scripts/new-product.js <slug> [--from input.json] [--name Mila] [--he-name "…"] [--type "…"]
//        [--regular 319] [--sale 159] [--promotion "…"] [--sale-reason "…"] [--colors "Blue,Black"]
//        [--sizes "S–5XL"] [--features "soft knit;relaxed fit"] [--page-url https://…] [--images "url1,url2"]
//        [--force]
// Unknown values stay empty: nothing is filled in on your behalf.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { productDir, writeJSON, readJSON, parseArgs, isValidSlug, missingInput } from './lib.js';

const list = (v, sep = ',') => (typeof v === 'string' ? v.split(sep).map((s) => s.trim()).filter(Boolean) : Array.isArray(v) ? v : []);
const num = (v) => {
  if (v === undefined || v === null || v === '' || v === true) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`"${v}" is not a number`);
  return n;
};
const str = (v) => (typeof v === 'string' ? v.trim() : '');

export function emptyInput(slug) {
  return {
    slug,
    product_name: '',
    hebrew_product_name: '',
    product_type: '',
    regular_price: null,
    sale_price: null,
    promotion: '',
    sale_reason: '',
    colors: [],
    sizes: [],
    features: [],
    existing_product_page: { url: '', content: '' },
    existing_product_images: [],
    testimonials: [],
    known_customer_problems: '',
    central_problem_hint: '',
    competitor_reference: '',
    extra_info: '',
    ugc_needed: false,
    launch_month: new Date().toISOString().slice(0, 7),
    created_at: new Date().toISOString().slice(0, 10),
  };
}

// Normalise user-supplied data (from the UI form or a JSON file) onto the blueprint shape.
export function normaliseInput(slug, data = {}) {
  const base = emptyInput(slug);
  const page = data.existing_product_page ?? {};
  const testimonials = (data.testimonials ?? [])
    .map((t, i) => ({
      id: str(t.id) || `t${i + 1}`,
      name: str(t.name) || null,
      age: t.age === '' || t.age == null ? null : Number.isFinite(Number(t.age)) ? Number(t.age) : str(String(t.age)),
      source: str(t.source),
      text: str(t.text),
      details: str(t.details),
    }))
    .filter((t) => t.text || t.details);
  return {
    ...base,
    product_name: str(data.product_name),
    hebrew_product_name: str(data.hebrew_product_name),
    product_type: str(data.product_type),
    regular_price: num(data.regular_price),
    sale_price: num(data.sale_price),
    promotion: str(data.promotion),
    sale_reason: str(data.sale_reason),
    colors: list(data.colors),
    sizes: list(data.sizes),
    features: list(data.features, /\n|;/),
    existing_product_page: { url: str(typeof page === 'string' ? page : page.url), content: str(page.content) },
    existing_product_images: list(data.existing_product_images, /\n|,/),
    testimonials,
    known_customer_problems: str(data.known_customer_problems),
    central_problem_hint: str(data.central_problem_hint),
    competitor_reference: str(data.competitor_reference),
    extra_info: str(data.extra_info),
    ugc_needed: data.ugc_needed === true || data.ugc_needed === 'true' || data.ugc_needed === 'on',
    launch_month: str(data.launch_month) || base.launch_month,
    created_at: data.created_at || base.created_at,
  };
}

export function saveInput(slug, data, { create = false, force = false } = {}) {
  if (!isValidSlug(slug)) throw new Error(`Invalid slug "${slug}" (use lowercase a-z, 0-9, -)`);
  const dir = productDir(slug);
  const file = path.join(dir, 'input.json');
  if (create && fs.existsSync(file) && !force) throw new Error(`${slug} already exists (use --force to overwrite input.json)`);
  const input = normaliseInput(slug, data);
  fs.mkdirSync(path.join(dir, 'source'), { recursive: true });
  writeJSON(file, input);
  return input;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = parseArgs(process.argv.slice(2));
  const slug = a._[0];
  if (!slug) {
    console.error('Usage: node scripts/new-product.js <slug> [--from file.json] [--name …] [--regular N] [--sale N] … (see file header)');
    process.exit(1);
  }
  try {
    const from = a.from ? readJSON(path.resolve(a.from)) : {};
    const data = {
      ...from,
      ...(a.name && { product_name: a.name }),
      ...(a['he-name'] && { hebrew_product_name: a['he-name'] }),
      ...(a.type && { product_type: a.type }),
      ...(a.regular && { regular_price: a.regular }),
      ...(a.sale && { sale_price: a.sale }),
      ...(a.promotion && { promotion: a.promotion }),
      ...(a['sale-reason'] && { sale_reason: a['sale-reason'] }),
      ...(a.colors && { colors: a.colors }),
      ...(a.sizes && { sizes: a.sizes }),
      ...(a.features && { features: a.features }),
      ...(a['page-url'] && { existing_product_page: { url: a['page-url'], content: from.existing_product_page?.content ?? '' } }),
      ...(a.images && { existing_product_images: a.images }),
    };
    const input = saveInput(slug, data, { create: true, force: !!a.force });
    console.log(`✓ products/${slug}/input.json created. Put existing product images in products/${slug}/source/`);
    const missing = missingInput(input);
    if (missing.length) {
      console.log(`\nStill missing (required):`);
      missing.forEach((m) => console.log(`  MISSING INPUT: ${m.field} — needed for ${m.needed_for}`));
    }
    if (!input.testimonials.length) console.log(`\nNo testimonials yet → the Meta ads step will be BLOCKED until real testimonials are added.`);
    console.log(`\nNext: fill input.json (or use the UI), then in Claude Code:  /launch-product ${slug}`);
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  }
}
