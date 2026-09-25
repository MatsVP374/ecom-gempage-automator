import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setProductsDir, loadConfig } from '../scripts/lib.js';
import { validateProduct } from '../scripts/validate.js';
import { exportProduct } from '../scripts/export.js';
import { normaliseInput, saveInput } from '../scripts/new-product.js';
import { buildShopifyPayload } from '../scripts/shopify-push.js';
import { loadProduct } from '../scripts/lib.js';
import { writeDemo } from './fixture.js';

let dir;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adina-'));
  setProductsDir(dir);
});
const errs = (slug, opts) => validateProduct(slug, opts).errors;
const has = (list, re) => list.some((e) => re.test(e));

test('complete demo product validates with 0 errors and exports a ready launch package', () => {
  const slug = writeDemo(dir);
  assert.deepEqual(errs(slug), []);
  const files = exportProduct(slug);
  for (const f of ['gempage.he.html', 'gempage-copy.md', 'image-prompts.md', 'meta-ads.md', 'meta-ads.csv', 'creative-plan.md', 'launch-package.md'])
    assert.ok(files.includes(f), `missing ${f}`);
  const pkg = fs.readFileSync(path.join(dir, slug, 'output', 'launch-package.md'), 'utf8');
  assert.match(pkg, /READY FOR:/);
  assert.equal(validateProduct(slug).ready, true);
});

test('launch without generated images is not ready and the .gempages shows placeholders', () => {
  const slug = writeDemo(dir, (d) => d.plan.images.forEach((i) => delete i.url));
  exportProduct(slug);
  const v = validateProduct(slug);
  assert.equal(v.ready, false);
  assert.equal(v.steps.find((s) => s.id === 'images').done, false);
  const pkg = fs.readFileSync(path.join(dir, slug, 'output', 'launch-package.md'), 'utf8');
  assert.match(pkg, /missing: IMG-01/);
});

test('meta-ads.md uses the exact Meta output format', () => {
  const slug = writeDemo(dir);
  exportProduct(slug);
  const md = fs.readFileSync(path.join(dir, slug, 'output', 'meta-ads.md'), 'utf8');
  assert.match(md, /^AD 1 — Test discovery\n\nPRIMARY TEXT:\n/);
  assert.match(md, /\nHEADLINE:\n/);
  assert.match(md, /\nDESCRIPTION:\n/);
  assert.match(md, /\n\n\nAD 2 — Test routine\n/);
});

test('input gate flags every missing required field and never fills it in', () => {
  const slug = 'empty-product';
  saveInput(slug, { product_name: 'X' }, { create: true });
  const r = validateProduct(slug, { stage: 'input' });
  for (const f of ['hebrew_product_name', 'regular_price', 'sale_price', 'colors', 'sizes', 'features', 'existing_product_page', 'existing_product_images', 'sale_reason'])
    assert.ok(has(r.errors, new RegExp(`MISSING INPUT: ${f}`)), f);
  assert.ok(has(r.flags, /NO TESTIMONIALS/));
  const saved = JSON.parse(fs.readFileSync(path.join(dir, slug, 'input.json'), 'utf8'));
  assert.equal(saved.regular_price, null);
  assert.deepEqual(saved.colors, []);
});

test('no testimonials → ads must be blocked with a flag, never invented', () => {
  const slug = writeDemo(dir, (d) => {
    d.input.testimonials = [];
    d.facts.testimonials = [];
    d.ads = { status: 'blocked', flags: ['TESTIMONIAL DATA INSUFFICIENT — no testimonials supplied'], ads: [] };
  });
  const r = validateProduct(slug);
  assert.deepEqual(r.errors, []);
  assert.ok(has(r.flags, /TESTIMONIAL DATA INSUFFICIENT/));
  assert.equal(r.ready, false);
});

test('an ad without a real testimonial source is an error', () => {
  const slug = writeDemo(dir, (d) => {
    d.ads.ads[0].testimonial_id = 't9';
    d.ads.ads[0].trace = [{ claim: 'I ordered it', source: 'testimonial:t9' }];
  });
  const e = errs(slug);
  assert.ok(has(e, /not a supplied testimonial/));
  assert.ok(has(e, /trace source "testimonial:t9" does not resolve/));
});

test('blocked status without the flag is an error', () => {
  const slug = writeDemo(dir, (d) => (d.ads = { status: 'blocked', flags: [], ads: [] }));
  assert.ok(has(errs(slug), /TESTIMONIAL DATA INSUFFICIENT/));
});

test('ready requires exactly 2 ads: one discovery and one routine', () => {
  const slug = writeDemo(dir, (d) => (d.ads.ads[1].type = 'discovery'));
  assert.ok(has(errs(slug), /one "discovery" and one "routine"/));
  const slug2 = 'three-ads';
  writeDemo(dir, (d) => {
    d.input.slug = slug2;
    d.ads.ads.push({ ...d.ads.ads[0], id: 'ad3' });
  });
  assert.ok(has(errs(slug2), /requires exactly 2 ads/));
});

test('ad invents an age the testimonial does not supply', () => {
  const slug = writeDemo(dir, (d) => (d.ads.ads[0].primary_text = 'אני בת 58 ' + d.ads.ads[0].primary_text));
  assert.ok(has(errs(slug), /mentions an age/));
});

test('old offer logic is rejected everywhere', () => {
  const slug = writeDemo(dir, (d) => {
    d.gempageHe.blocks.find((b) => b.type === 'sale').paragraphs.push('20% הנחה על הפריט השני');
    d.ads.ads[1].primary_text += ' משלוח 7–14 ימי עסקים';
  });
  const e = errs(slug);
  assert.ok(has(e, /old "2nd item" offer/));
  assert.ok(has(e, /old shipping terms/));
});

test('bundle must be exactly 10/15/20/25 from config', () => {
  const cfg = loadConfig();
  assert.deepEqual(cfg.bundle_discount.map((t) => t.extra_discount_pct), [10, 15, 20, 25]);
  const slug = writeDemo(dir, (d) => (d.gempageHe.blocks.find((b) => b.type === 'bundle').tiers[0].extra_discount_pct = 20));
  assert.ok(has(errs(slug), /bundle tiers must be exactly 2=10% · 3=15% · 4=20% · 5\+=25%/));
});

test('wrong or invented prices are rejected', () => {
  const slug = writeDemo(dir, (d) => {
    d.gempageHe.blocks.find((b) => b.type === 'offer_box').sale_price = 149;
    d.ads.ads[0].description = 'רק ב־₪99';
  });
  const e = errs(slug);
  assert.ok(has(e, /offer_box.sale_price 149 ≠ input 150/));
  assert.ok(has(e, /price ₪99 is not the regular or sale price/));
});

test('invented colors are rejected in facts, image plan, prompts and creatives', () => {
  const slug = writeDemo(dir, (d) => {
    d.facts.colors.push({ name: 'Green', he: 'ירוק' });
    d.plan.images[1].product_color = 'Green';
    d.prompts.prompts[2].fields.exact_color = 'Green';
    d.creatives.creatives[0].product_color = 'Green';
  });
  const e = errs(slug);
  assert.ok(has(e, /01-product-facts: color "Green"/));
  assert.ok(has(e, /04-gempage-image-plan IMG-02: product_color "Green"/));
  assert.ok(has(e, /05-image-prompts IMG-03: exact_color "Green"/));
  assert.ok(has(e, /07-creative-plan A: product_color "Green"/));
});

test('benefits must trace to supplied features', () => {
  const slug = writeDemo(dir, (d) => (d.angle.benefits[0].feature_ids = ['f99']));
  assert.ok(has(errs(slug), /benefit 1 → unknown feature "f99"/));
});

test('GemPage must follow the blueprint: order, fixed Hebrew texts, problem-first headline', () => {
  const slug = writeDemo(dir, (d) => {
    const b = d.gempageHe.blocks;
    [b[5], b[6]] = [b[6], b[5]];
    b.find((x) => x.type === 'founder_header').byline = 'מכתב';
    b.find((x) => x.type === 'headline').headline = '50% הנחה על הקרדיגן';
  });
  const e = errs(slug);
  assert.ok(has(e, /blocks must be exactly the blueprint order/));
  assert.ok(has(e, /founder_header.byline must be exactly/));
  assert.ok(has(e, /must be problem-first/));
});

test('every generate image needs a prompt with all 13 fields', () => {
  const slug = writeDemo(dir, (d) => {
    d.prompts.prompts.pop();
    delete d.prompts.prompts[0].fields.must_not_change;
  });
  const e = errs(slug);
  assert.ok(has(e, /no prompt for IMG-07/));
  assert.ok(has(e, /IMG-01: field "must_not_change" is empty/));
});

test('UGC requested in input must be delivered', () => {
  const slug = writeDemo(dir, (d) => (d.input.ugc_needed = true));
  assert.ok(has(errs(slug), /input asks for UGC/));
});

test('normaliseInput keeps unknowns empty and splits lists', () => {
  const i = normaliseInput('x', { colors: 'Blue, Black', features: 'a\nb;c', regular_price: '319', testimonials: [{ text: 'hi' }, { text: '' }] });
  assert.deepEqual(i.colors, ['Blue', 'Black']);
  assert.deepEqual(i.features, ['a', 'b', 'c']);
  assert.equal(i.regular_price, 319);
  assert.equal(i.sale_price, null);
  assert.equal(i.testimonials.length, 1);
  assert.equal(i.testimonials[0].name, null);
  assert.equal(i.testimonials[0].age, null);
});

test('shopify payload: DRAFT, sale/compare prices, no variants from a size range', () => {
  const slug = writeDemo(dir);
  const pl = buildShopifyPayload(loadProduct(slug));
  assert.equal(pl.product.status, 'DRAFT');
  assert.equal(pl.price.price, '150');
  assert.equal(pl.price.compareAtPrice, '300');
  assert.equal(pl.product.productOptions.length, 1);
  assert.equal(pl.product.productOptions[0].name, 'צבע');
  assert.ok(pl.warnings.some((w) => /range/.test(w)));
});
