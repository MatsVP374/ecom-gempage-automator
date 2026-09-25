#!/usr/bin/env node
// Validate a product against the data contract in CLAUDE.md + brand rules.
// Usage: node scripts/validate.js <slug> | --all   [--json]
// Exit code 1 when any product has errors.
import { pathToFileURL } from 'node:url';
import { loadProduct, listSlugs, loadEnv, parseArgs } from './lib.js';

const SECTION_ORDER = ['hero', 'benefits', 'story', 'features', 'comparison', 'size_guide', 'reviews', 'faq', 'guarantee', 'cta'];
const AWARENESS = ['unaware', 'problem_aware', 'solution_aware', 'product_aware', 'most_aware'];
const HEBREW = /[֐-׿]/;
// Latin tokens that are fine inside Hebrew copy.
const LATIN_OK = new Set(['a', 'v', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', '2xl', '3xl', '4xl', 'xs', 'adina', 'cm', 'kg', 'ml', 'x', 'visa', 'bit', 'paypal', 'mastercard', 'apple', 'pay', 'google']);

const BANNED = [
  { re: /only \d+ left|נשאר(?:ו)? רק \d+|last \d+ (?:pieces|units)/i, msg: 'false scarcity ("only N left") — only allowed if true and stated in input.json' },
  { re: /lose weight|slimm(?:er|ing)|weight loss|לרזות|ירידה במשקל|מרזה/i, msg: 'weight-loss claim' },
  { re: /anti[- ]?aging|אנטי[- ]?אייג׳ינג|younger looking|נראית צעירה ב/i, msg: 'anti-aging claim' },
  { re: /\b\d[\d,.]*\+?\s*(?:happy|satisfied)?\s*customers|\d[\d,.]*\+?\s*לקוחות(?: מרוצות)?/i, msg: 'unverifiable customer count' },
  { re: /are you over \d+|at your age|over \d+\?|בגילך|בגיל \d+\??|את מעל \d+/i, msg: 'Meta Personal Attributes: addresses the reader’s age' },
  { re: /\bcures?\b|\bheals?\b|מרפא|ריפוי/i, msg: 'medical claim' },
];

function walkStrings(obj, pathStr, out) {
  if (typeof obj === 'string') out.push([pathStr, obj]);
  else if (Array.isArray(obj)) obj.forEach((v, i) => walkStrings(v, `${pathStr}[${i}]`, out));
  else if (obj && typeof obj === 'object') for (const [k, v] of Object.entries(obj)) walkStrings(v, pathStr ? `${pathStr}.${k}` : k, out);
  return out;
}

// Keys whose values are not customer-facing copy.
const NON_COPY_KEYS = /(^|\.)(lang|dir|type|currency|icon|image_hint|id|angle_id)$/;

export function validateProduct(slug) {
  loadEnv();
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);
  let p;
  try {
    p = loadProduct(slug);
  } catch (e) {
    return { slug, errors: [e.message], warnings, steps: [] };
  }
  p.parseErrors.forEach(err);

  // input.json
  if (!p.input) err('input.json missing — run node scripts/new-product.js');
  else if (p.input.slug !== slug) err(`input.json slug "${p.input.slug}" ≠ folder "${slug}"`);

  // product.json
  const prod = p.product;
  if (prod) {
    for (const k of ['name_he', 'name_en', 'full_title_he', 'full_title_en', 'positioning', 'pricing', 'specs', 'shopify'])
      if (prod[k] == null) err(`product.json: missing "${k}"`);
    if (prod.name_he && !HEBREW.test(prod.name_he)) err('product.json: name_he is not Hebrew');
    if (prod.full_title_he && !HEBREW.test(prod.full_title_he)) err('product.json: full_title_he is not Hebrew');
    const price = prod.pricing?.price;
    if (!Number.isFinite(price)) err('product.json: pricing.price must be a number');
    else {
      if (price % 10 !== 9) warn(`product.json: price ₪${price} does not end in 9 (brand/adina.md)`);
      if (prod.pricing.compare_at != null && prod.pricing.compare_at <= price) err('product.json: compare_at must be higher than price');
      const cost = p.input?.supplier_cost;
      if (cost?.amount) {
        const rate = cost.currency === 'ILS' ? 1 : Number(process.env.EUR_TO_ILS || 4.0);
        const mult = Number(process.env.MIN_MARGIN_MULTIPLIER || 3);
        const costIls = cost.amount * rate;
        if (price < costIls * mult) warn(`margin: price ₪${price} < ${mult}× cost (₪${costIls.toFixed(0)})`);
      }
    }
    if (p.input?.selling_price?.amount && price && p.input.selling_price.amount !== price)
      warn(`product.json price ₪${price} differs from input.json selling_price ₪${p.input.selling_price.amount}`);
    if (prod.shopify?.handle && !/^[a-z0-9-]+$/.test(prod.shopify.handle)) err('product.json: shopify.handle must be kebab-case');
    // duplicate model names across products
    for (const other of listSlugs()) {
      if (other === slug) continue;
      try {
        const o = loadProduct(other).product;
        if (o?.name_he && o.name_he === prod.name_he) err(`product name "${prod.name_he}" already used by ${other}`);
      } catch {}
    }
  }

  // pages
  for (const lang of ['en', 'he']) {
    const pg = p.page[lang];
    const f = `page.${lang}.json`;
    if (!pg) continue;
    if (pg.lang !== lang) err(`${f}: lang must be "${lang}"`);
    if (pg.dir !== (lang === 'he' ? 'rtl' : 'ltr')) err(`${f}: dir must be "${lang === 'he' ? 'rtl' : 'ltr'}"`);
    for (const k of ['title', 'subtitle', 'price', 'bullets', 'cta', 'sections', 'seo']) if (pg[k] == null) err(`${f}: missing "${k}"`);
    if (prod && pg.price?.current !== prod.pricing?.price) err(`${f}: price.current ${pg.price?.current} ≠ product.json ${prod.pricing?.price}`);
    if (prod && pg.price?.compare_at != null && pg.price.compare_at !== prod.pricing?.compare_at) err(`${f}: price.compare_at ≠ product.json`);
    if (lang === 'he' && prod && pg.title !== prod.full_title_he) warn(`${f}: title ≠ product.json full_title_he`);
    const bullets = pg.bullets ?? [];
    if (bullets.length < 3 || bullets.length > 5) warn(`${f}: ${bullets.length} bullets (rule: 4)`);
    bullets.forEach((b, i) => b.length > 50 && warn(`${f}: bullets[${i}] is ${b.length} chars (max ~45)`));
    if (pg.seo?.title?.length > 60) warn(`${f}: seo.title ${pg.seo.title.length} chars (max 60)`);
    if (pg.seo?.description?.length > 155) warn(`${f}: seo.description ${pg.seo.description.length} chars (max 155)`);
    const types = (pg.sections ?? []).map((s) => s.type);
    types.forEach((t, i) => !SECTION_ORDER.includes(t) && err(`${f}: sections[${i}] unknown type "${t}"`));
    const known = types.filter((t) => SECTION_ORDER.includes(t));
    const sorted = [...known].sort((a, b) => SECTION_ORDER.indexOf(a) - SECTION_ORDER.indexOf(b));
    if (known.join() !== sorted.join()) warn(`${f}: section order differs from brand/product-page-rules.md`);
    for (const t of SECTION_ORDER) if (!types.includes(t)) warn(`${f}: missing section "${t}"`);
    (pg.sections ?? []).forEach((s, i) => {
      if (s.type === 'reviews' && s.placeholder !== true) err(`${f}: reviews section must have placeholder: true until real reviews are added`);
      if (s.type === 'size_guide' && (s.rows ?? []).some((r) => r.length !== (s.headers ?? []).length))
        err(`${f}: sections[${i}] size_guide row length ≠ headers length`);
    });
    checkCopy(pg, f, lang, err, warn);
  }
  if (p.page.en && p.page.he) {
    const a = (p.page.en.sections ?? []).map((s) => s.type).join();
    const b = (p.page.he.sections ?? []).map((s) => s.type).join();
    if (a !== b) err('page.he.json sections do not match page.en.json structure');
  }

  // ads
  const ads = p.ads;
  if (ads) {
    const angles = ads.angles ?? [];
    if (angles.length < 3) warn(`ads.json: ${angles.length} angles (rule: 5)`);
    const ids = new Set();
    angles.forEach((a, i) => {
      if (!a.id) err(`ads.json: angles[${i}] missing id`);
      if (ids.has(a.id)) err(`ads.json: duplicate angle id "${a.id}"`);
      ids.add(a.id);
      if (!AWARENESS.includes(a.awareness)) err(`ads.json: angle "${a.id}" awareness "${a.awareness}" not in ${AWARENESS.join('|')}`);
    });
    for (const lang of ['he', 'en']) {
      const sets = ads.copy?.[lang] ?? [];
      if (angles.length && ads.copy && !sets.length) err(`ads.json: copy.${lang} missing`);
      const covered = new Set(sets.map((s) => s.angle_id));
      if (sets.length) for (const id of ids) if (!covered.has(id)) err(`ads.json: copy.${lang} has no copy for angle "${id}"`);
      sets.forEach((s) => {
        if (!ids.has(s.angle_id)) err(`ads.json: copy.${lang} references unknown angle "${s.angle_id}"`);
        const where = `ads.json copy.${lang}[${s.angle_id}]`;
        if (!s.primary_texts?.length) err(`${where}: no primary_texts`);
        if (!s.headlines?.length) err(`${where}: no headlines`);
        (s.headlines ?? []).forEach((h, i) => h.length > 40 && err(`${where}: headlines[${i}] ${h.length} chars (Meta max 40)`));
        (s.descriptions ?? []).forEach((d, i) => d.length > 30 && err(`${where}: descriptions[${i}] ${d.length} chars (max 30)`));
        (s.primary_texts ?? []).forEach((t, i) => t.length > 500 && warn(`${where}: primary_texts[${i}] ${t.length} chars (aim ≤ 400)`));
      });
      checkCopy(ads.copy?.[lang], `ads.json copy.${lang}`, lang, err, warn);
    }
  }

  return { slug, errors, warnings, steps: p.steps };
}

function checkCopy(obj, where, lang, err, warn) {
  if (!obj) return;
  for (const [k, s] of walkStrings(obj, '', [])) {
    if (NON_COPY_KEYS.test(k) || !s.trim()) continue;
    const at = `${where}${k.startsWith('[') ? '' : '.'}${k}`;
    for (const b of BANNED) if (b.re.test(s)) warn(`${at}: ${b.msg} → "${s.slice(0, 60)}"`);
    if (lang !== 'he') continue;
    const latinWords = (s.match(/[A-Za-z][A-Za-z0-9]*/g) ?? []).filter((w) => !LATIN_OK.has(w.toLowerCase()));
    if (!HEBREW.test(s) && latinWords.length) err(`${at}: untranslated (no Hebrew) → "${s.slice(0, 60)}"`);
    else if (latinWords.length) warn(`${at}: Latin words in Hebrew copy (${[...new Set(latinWords)].join(', ')})`);
    if (/^[A-Za-z]/.test(s.trim()) && HEBREW.test(s)) warn(`${at}: starts with a Latin word (bidi jump)`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = parseArgs(process.argv.slice(2));
  const slugs = a.all ? listSlugs() : a._;
  if (!slugs.length) {
    console.error('Usage: node scripts/validate.js <slug> | --all [--json]');
    process.exit(1);
  }
  const results = slugs.map(validateProduct);
  if (a.json) console.log(JSON.stringify(results, null, 2));
  else
    for (const r of results) {
      console.log(`\n${r.errors.length ? '✗' : '✓'} ${r.slug} — ${r.errors.length} errors · ${r.warnings.length} warnings`);
      console.log('  ' + r.steps.map((s) => `${s.done ? '■' : '□'} ${s.label}`).join('  '));
      r.errors.forEach((e) => console.log(`  ERROR  ${e}`));
      r.warnings.forEach((w) => console.log(`  warn   ${w}`));
    }
  process.exit(results.some((r) => r.errors.length) ? 1 : 0);
}
