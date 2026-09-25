#!/usr/bin/env node
// Create products/<slug>/input.json.
// Usage: node scripts/new-product.js <slug> --url <supplier-url> [--price 179] [--compare 359]
//        [--cost 12.5] [--cost-currency EUR] [--category blouse] [--target "women 45-65"] [--notes "..."]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { productDir, writeJSON, parseArgs, isValidSlug } from './lib.js';

const num = (v) => (v === undefined || v === true || v === '' ? null : Number(v));

export function createProduct(slug, opts = {}) {
  if (!isValidSlug(slug)) throw new Error(`Invalid slug "${slug}" (use lowercase a-z, 0-9, -)`);
  const dir = productDir(slug);
  const file = path.join(dir, 'input.json');
  if (fs.existsSync(file) && !opts.force) throw new Error(`${slug} already exists (use --force to overwrite input.json)`);
  for (const [k, v] of Object.entries({ price: opts.price, compare: opts.compare, cost: opts.cost })) {
    if (v != null && !Number.isFinite(v)) throw new Error(`--${k} must be a number`);
  }
  const input = {
    slug,
    supplier_url: opts.url || null,
    supplier_cost: opts.cost != null ? { amount: opts.cost, currency: opts.costCurrency || 'EUR' } : null,
    selling_price: opts.price != null ? { amount: opts.price, currency: 'ILS' } : null,
    compare_at_price: opts.compare != null ? { amount: opts.compare, currency: 'ILS' } : null,
    category: opts.category || null,
    target: opts.target || 'women 45-65',
    notes: opts.notes || '',
    images: opts.images ?? [],
    created_at: new Date().toISOString().slice(0, 10),
  };
  fs.mkdirSync(path.join(dir, 'source'), { recursive: true });
  writeJSON(file, input);
  return input;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = parseArgs(process.argv.slice(2));
  const slug = a._[0];
  if (!slug) {
    console.error('Usage: node scripts/new-product.js <slug> --url <url> [--price N] [--compare N] [--cost N] [--category X] [--notes "..."]');
    process.exit(1);
  }
  try {
    createProduct(slug, {
      url: a.url, price: num(a.price), compare: num(a.compare), cost: num(a.cost), costCurrency: a['cost-currency'],
      category: a.category, target: a.target, notes: a.notes, force: !!a.force,
    });
    console.log(`✓ products/${slug}/input.json created. Put supplier images in products/${slug}/source/`);
    console.log(`  Next: in Claude Code run  /launch-product ${slug}`);
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  }
}
