#!/usr/bin/env node
// Validate a product against the data contract in CLAUDE.md, config/adina.json and the Adina rules.
// Usage: node scripts/validate.js <slug> | --all   [--stage input|upload|publish]   [--json]
//        --stage upload: also requires a fresh Hebrew naturalness pass (step 6c) — the gate before step 11.
//        --stage publish: the gate before gempages_publish_page — also fails on mockup reviews.
// Exit code 1 when any product has errors.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadProduct, loadConfig, listSlugs, parseArgs, missingInput, isFilled, FILES } from './lib.js';
import { spellcheckProduct } from './spellcheck.js';
import { productRoutes, renderGpHtml, LTR_RUN } from './gempages.js';

export const BLOCK_ORDER = [
  'founder_header', 'headline', 'hero', 'founder_story', 'benefits', 'comparison', 'founder_quote', 'sale',
  'trust_bar', 'packing', 'founder_observation', 'social_proof', 'offer_box', 'bundle', 'cta', 'about', 'sticky_cta',
];
const REQUIRED_FIELDS = {
  founder_header: ['byline', 'place_date', 'note', 'badge'],
  headline: ['headline', 'subtitle'],
  hero: ['image'],
  founder_story: ['greeting', 'parts'],
  benefits: ['items'],
  comparison: ['title', 'columns', 'rows'],
  founder_quote: ['quote', 'author'],
  sale: ['title', 'paragraphs', 'regular_price', 'sale_price'],
  trust_bar: ['items'],
  packing: ['image', 'caption'],
  founder_observation: ['text'],
  social_proof: ['rating', 'reviews_label', 'text'],
  offer_box: ['product_name', 'rating_line', 'regular_price', 'sale_price'],
  bundle: ['title', 'tiers'],
  cta: ['button'],
  about: ['title', 'text', 'signoff'],
  sticky_cta: ['text'],
};
const STORY_ROLES = ['intro', 'observation', 'problem', 'alternatives', 'search', 'discovery'];
const IMAGE_ROLES = ['hero', 'benefit_detail', 'functional_detail', 'functional_detail_2', 'real_life_use', 'variation', 'packing'];
const PROMPT_FIELDS = ['subject', 'age', 'product', 'exact_color', 'styling', 'action', 'environment', 'framing', 'light', 'mood', 'must_be_visible', 'realism', 'must_not_change'];
const HEBREW = /[֐-׿]/;
const LATIN_OK_BASE = ['adina', 'fashion', 'cm', 'kg', 'x', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', 'a', 'v', 'bit', 'visa', 'paypal', 'mastercard', 'apple', 'google', 'pay', 'ugc'];

// Old offer logic that must never come back, and claims we never make.
const FORBIDDEN = [
  { re: /הפריט השני|second item|2nd item/i, msg: 'old "2nd item" offer — bundle is 2=10% · 3=15% · 4=20% · 5+=25%' },
  { re: /7\s*[–-]\s*14|ימי עסקים|business days/i, msg: 'old shipping terms — shipping is "free with Israel Post" (config)' },
  { re: /only \d+ left|נשאר(?:ו)? רק \d+|last \d+ (?:pieces|units)/i, msg: 'stock/scarcity claim not supplied in input' },
  { re: /\bcures?\b|\bheals?\b|מרפא|ריפוי/i, msg: 'medical claim' },
];
function walkStrings(obj, pathStr, out) {
  if (typeof obj === 'string') out.push([pathStr, obj]);
  else if (Array.isArray(obj)) obj.forEach((v, i) => walkStrings(v, `${pathStr}[${i}]`, out));
  else if (obj && typeof obj === 'object') for (const [k, v] of Object.entries(obj)) walkStrings(v, pathStr ? `${pathStr}.${k}` : k, out);
  return out;
}
// Keys whose values are identifiers, not customer-facing copy.
const NON_COPY = /(^|\.)(lang|dir|type|id|image|role|feature_ids|testimonial_id|angle|source|review_en|trace|claim)(\[\d+\])?$|\.trace\[/;

const shekels = (text) => [...String(text ?? '').matchAll(/₪\s?([\d,]+)|([\d,]+)\s?₪/g)].map((m) => Number((m[1] ?? m[2]).replace(/,/g, '')));
const words = (s) => new Set(String(s ?? '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((w) => w.length > 2));
const jaccard = (a, b) => {
  const A = words(a), B = words(b);
  const inter = [...A].filter((w) => B.has(w)).length;
  return inter / (A.size + B.size - inter || 1);
};
const emojiCount = (s) => (String(s ?? '').match(/\p{Extended_Pictographic}/gu) ?? []).length;

export function validateProduct(slug, { stage } = {}) {
  const errors = [];
  const warnings = [];
  const flags = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);
  const flag = (m) => !flags.includes(m) && flags.push(m);
  let p;
  try {
    p = loadProduct(slug);
  } catch (e) {
    return { slug, errors: [e.message], warnings, flags, steps: [], missing: [], ready: false };
  }
  const cfg = loadConfig();
  p.parseErrors.forEach(err);
  const input = p.input;

  // ---------- input ----------
  const missing = missingInput(input);
  if (!input) err('input.json missing — run /new-launch or node scripts/new-product.js');
  else {
    if (input.slug !== slug) err(`input.json slug "${input.slug}" ≠ folder "${slug}"`);
    missing.forEach((m) => err(`MISSING INPUT: ${m.field} — needed for ${m.needed_for}`));
    if (isFilled(input.regular_price) && isFilled(input.sale_price) && input.sale_price >= input.regular_price)
      err('input: sale_price must be lower than regular_price');
    const pct = String(input.promotion ?? '').match(/(\d{1,2})\s?%/);
    if (pct && input.regular_price && input.sale_price) {
      const real = (1 - input.sale_price / input.regular_price) * 100;
      if (Math.abs(real - Number(pct[1])) > 2)
        warn(`input: promotion says ${pct[1]}% but ₪${input.regular_price} → ₪${input.sale_price} is ${real.toFixed(1)}%`);
    }
    const ids = (input.testimonials ?? []).map((t) => t.id);
    if (new Set(ids).size !== ids.length) err('input: duplicate testimonial ids');
    (input.testimonials ?? []).forEach((t) => !isFilled(t.text) && err(`input: testimonial ${t.id} has no text`));
    if (!ids.length) flag('NO TESTIMONIALS SUPPLIED — the GemPage gets no customer review under its photos until real reviews are added to input.json');
    // Supplied reviews (Activepieces): `benefit` maps a review to one benefit photo; `mockup` marks generated content.
    const mapped = (input.testimonials ?? []).filter((t) => t.benefit != null);
    const benefitNs = mapped.map((t) => t.benefit);
    if (new Set(benefitNs).size !== benefitNs.length) err(`input: two testimonials map to the same benefit (${benefitNs.join(', ')}) — one review per photo`);
    const mockups = (input.testimonials ?? []).filter((t) => t.mockup === true);
    if (mockups.length && input.mockup_reviews_allowed !== true)
      err(`input: ${mockups.length} mockup testimonial(s) without mockup_reviews_allowed — mockups are only for a draft that is not published`);
    if (mockups.length && stage === 'publish')
      err(`MOCKUP REVIEWS — ${mockups.length} mockup testimonial(s) on this page; it must never be published (generated reviews may not appear as customer testimonials)`);
    if (input.mockup_reviews_allowed === true && stage === 'publish') err('input: mockup_reviews_allowed is set — this page is a mockup draft and may not be published');
    if (mockups.length) flag(`MOCKUP REVIEWS ON DRAFT — ${mockups.length} generated review(s) rendered like the final page (marked only internally, data-review="mockup"); this draft must not be published`);
    for (const img of input.existing_product_images ?? [])
      if (!/^https?:\/\//.test(img) && !fs.existsSync(path.join(p.dir, img))) err(`input: existing image "${img}" not found in products/${slug}/`);
  }
  if (stage === 'input') return summary();

  const colors = (input?.colors ?? []).map((c) => String(c).trim());
  const colorOk = (c) => colors.some((x) => x.toLowerCase() === String(c ?? '').trim().toLowerCase());
  const tIds = new Set((input?.testimonials ?? []).map((t) => t.id));
  const mockupIds = new Set((input?.testimonials ?? []).filter((t) => t.mockup === true).map((t) => t.id));
  // Supplied reviews with `benefit` are placed by the GemPage itself (verbatim), not chosen in the copy.
  const suppliedFor = new Map((input?.testimonials ?? []).filter((t) => t.benefit != null && (!t.mockup || input?.mockup_reviews_allowed === true)).map((t) => [t.benefit, t]));
  const latinOk = new Set([
    ...LATIN_OK_BASE,
    ...String(input?.product_name ?? '').toLowerCase().split(/\W+/),
    ...(input?.sizes ?? []).flatMap((s) => String(s).toLowerCase().match(/[a-z]+/g) ?? []),
  ]);

  // ---------- 01 facts ----------
  const facts = p.facts;
  const featureIds = new Set((facts?.features ?? []).map((f) => f.id));
  if (facts && input) {
    if (facts.status === 'missing_input') err('01-product-facts: status is missing_input — pipeline must stop until input is complete');
    (facts.missing ?? []).forEach((m) => flag(`MISSING: ${m.field} — ${m.needed_for ?? ''}`.trim()));
    for (const k of ['product_name', 'hebrew_product_name']) if (facts[k] !== input[k]) err(`01-product-facts: ${k} ≠ input`);
    if (facts.price?.regular !== input.regular_price || facts.price?.sale !== input.sale_price) err('01-product-facts: prices ≠ input');
    (facts.colors ?? []).forEach((c) => !colorOk(c.name) && err(`01-product-facts: color "${c.name}" is not in input colors (invented?)`));
    colors.forEach((c) => !(facts.colors ?? []).some((x) => String(x.name).toLowerCase() === c.toLowerCase()) && warn(`01-product-facts: input color "${c}" missing`));
    if (JSON.stringify(facts.sizes ?? []) !== JSON.stringify(input.sizes ?? [])) err('01-product-facts: sizes ≠ input');
    if (featureIds.size !== (facts.features ?? []).length) err('01-product-facts: duplicate feature ids');
    (facts.features ?? []).forEach((f) => !['input', 'product_page', 'image'].includes(f.source) && err(`01-product-facts: feature ${f.id} has no valid source`));
    (facts.testimonials ?? []).forEach((t) => {
      if (!tIds.has(t.id)) err(`01-product-facts: testimonial "${t.id}" does not exist in input`);
      if (mockupIds.has(t.id)) err(`01-product-facts: testimonial "${t.id}" is a mockup — mockup reviews are never evidence for product facts`);
    });
  }

  // ---------- 02 angle ----------
  const angle = p.angle;
  if (angle) {
    for (const k of ['central_problem', 'customer_insight', 'product_solution', 'adina_belief', 'core_promise', 'old_alternative_a', 'old_alternative_b', 'why_now', 'founder_letter_hook'])
      if (!isFilled(angle[k])) err(`02-central-angle: "${k}" is empty`);
    const q = angle.questions ?? {};
    for (const k of ['who', 'everyday_problem', 'current_workaround', 'why_frustrating', 'what_changes', 'enabling_features', 'adina_observation', 'core_belief', 'easiest_comparison', 'why_now'])
      if (!isFilled(q[k])) err(`02-central-angle: question "${k}" unanswered`);
    const b = angle.benefits ?? [];
    if (b.length < 5 || b.length > 6) warn(`02-central-angle: ${b.length} benefits (blueprint: 5–6)`);
    b.forEach((x) => {
      if (!x.feature_ids?.length) err(`02-central-angle: benefit ${x.n} has no feature_ids (unsupported benefit)`);
      if (facts) (x.feature_ids ?? []).forEach((id) => !featureIds.has(id) && err(`02-central-angle: benefit ${x.n} → unknown feature "${id}"`));
    });
  }

  // ---------- 03 gempage ----------
  const planIds = new Set((p.plan?.images ?? []).map((i) => i.id));
  for (const lang of ['en', 'he']) {
    const g = p.gempage[lang];
    const f = `03-gempage-copy.${lang}.json`;
    if (!g) continue;
    if (g.lang !== lang) err(`${f}: lang must be "${lang}"`);
    if (g.dir !== (lang === 'he' ? 'rtl' : 'ltr')) err(`${f}: dir must be "${lang === 'he' ? 'rtl' : 'ltr'}"`);
    const blocks = g.blocks ?? [];
    const types = blocks.map((b) => b.type);
    if (types.join() !== BLOCK_ORDER.join()) {
      const missingB = BLOCK_ORDER.filter((t) => !types.includes(t));
      err(`${f}: blocks must be exactly the blueprint order${missingB.length ? ` (missing: ${missingB.join(', ')})` : ' (order differs)'}`);
    }
    const by = Object.fromEntries(blocks.map((b) => [b.type, b]));
    blocks.forEach((b) => {
      if (b.id !== b.type) warn(`${f}: block "${b.type}" should have id "${b.type}"`);
      (REQUIRED_FIELDS[b.type] ?? []).forEach((k) => !isFilled(b[k]) && err(`${f}: ${b.type}.${k} is empty`));
    });
    // story: the product is the conclusion, not the opening
    const parts = by.founder_story?.parts ?? [];
    if (parts.map((x) => x.role).join() !== STORY_ROLES.join()) err(`${f}: founder_story.parts roles must be ${STORY_ROLES.join(' → ')}`);
    const names = [input?.product_name, input?.hebrew_product_name].filter((n) => n && n.length > 3);
    const early = [by.founder_header?.note, by.headline?.headline, by.headline?.subtitle, ...parts.filter((x) => x.role !== 'discovery').map((x) => x.text)].join(' ');
    names.forEach((n) => early.includes(n) && warn(`${f}: product name "${n}" appears before the discovery — the letter must not start by selling the product`));
    if (/₪|%|\bsale\b|\bdiscount\b|מבצע|הנחה/i.test([by.founder_header?.note, by.headline?.headline].join(' ')))
      err(`${f}: header/headline mentions price/discount — must be problem-first`);
    // benefits
    const items = by.benefits?.items ?? [];
    if (items.length < 5 || items.length > 6) warn(`${f}: ${items.length} benefit blocks (blueprint: 5–6)`);
    items.forEach((i, idx) => {
      if (i.n !== idx + 1) err(`${f}: benefits numbered incorrectly at position ${idx + 1}`);
      if (!i.feature_ids?.length) err(`${f}: benefit ${i.n} has no feature_ids`);
      if (facts) (i.feature_ids ?? []).forEach((id) => !featureIds.has(id) && err(`${f}: benefit ${i.n} → unknown feature "${id}"`));
      if (!i.headline || !i.text) err(`${f}: benefit ${i.n} needs headline + text`);
      if (i.review) checkReview(f, `benefit ${i.n} review`, i.review, lang);
      if (i.review && suppliedFor.has(i.n))
        err(`${f}: benefit ${i.n} has a review in the copy, but testimonial ${suppliedFor.get(i.n).id} is supplied for this photo — remove the review from the copy (the page places the supplied one verbatim)`);
    });
    for (const [n, t] of suppliedFor) if (!items.some((i) => i.n === n)) warn(`${f}: testimonial ${t.id} is supplied for benefit ${n}, which does not exist — it is not shown`);
    const withReview = items.filter((i) => i.review?.text || suppliedFor.has(i.n)).length;
    if (lang === 'he' && items.length && withReview < items.length)
      flag(`REVIEWS PER PHOTO: ${withReview}/${items.length} benefit photos have a real customer review — add testimonials that mention these benefits (never invented)`);
    const used = items.filter((i) => i.review?.text).map((i) => i.review.testimonial_id + '|' + i.review.text);
    if (new Set(used).size !== used.length) warn(`${f}: the same review excerpt is used under more than one photo`);
    (by.social_proof?.quotes ?? []).forEach((q, k) => checkReview(f, `social_proof quote ${k + 1}`, q, lang));
    // Keep the opening light (brand/gempage-blueprint.md → founder_story): the reader should reach the product soon.
    if (lang === 'he') {
      const story = (by.founder_story?.parts ?? []).map((x) => x.text ?? '');
      const total = story.join(' ').length;
      if (total > 550) warn(`${f}: founder_story is ${total} characters — keep it under ~550 (1–2 short sentences per part)`);
      story.forEach((x, k) => x.length > 120 && warn(`${f}: founder_story part ${k + 1} is ${x.length} characters — max ~120`));
      if ((by.headline?.headline ?? '').length > 70) warn(`${f}: headline is ${(by.headline.headline).length} characters — max ~70`);
    }
    if ((by.social_proof?.quotes ?? []).length > 1) err(`${f}: social_proof has ${(by.social_proof.quotes).length} quotes — max 1 (the reviews already sit under the photos)`);
    const rows = by.comparison?.rows ?? [];
    if (by.comparison && (rows.length < 3 || rows.length > 5)) warn(`${f}: comparison has ${rows.length} rows (blueprint: 3–5)`);
    // prices
    if (input) {
      for (const t of ['sale', 'offer_box']) {
        if (!by[t]) continue;
        if (by[t].regular_price !== input.regular_price) err(`${f}: ${t}.regular_price ${by[t].regular_price} ≠ input ${input.regular_price}`);
        if (by[t].sale_price !== input.sale_price) err(`${f}: ${t}.sale_price ${by[t].sale_price} ≠ input ${input.sale_price}`);
      }
      const allowed = new Set([input.regular_price, input.sale_price]);
      walkStrings(g, '', []).forEach(([k, s]) => shekels(s).forEach((n) => !allowed.has(n) && err(`${f}.${k}: price ₪${n} is not the regular or sale price`)));
      if (by.sticky_cta && !shekels(by.sticky_cta.text).includes(input.sale_price)) err(`${f}: sticky_cta must show ₪${input.sale_price}`);
    }
    // bundle must equal config
    const tiers = by.bundle?.tiers ?? [];
    const cfgTiers = cfg.bundle_discount;
    if (by.bundle && (tiers.length !== cfgTiers.length || tiers.some((t, i) => t.items !== cfgTiers[i].items || t.extra_discount_pct !== cfgTiers[i].extra_discount_pct)))
      err(`${f}: bundle tiers must be exactly ${cfgTiers.map((t) => `${t.items}${t.or_more ? '+' : ''}=${t.extra_discount_pct}%`).join(' · ')}`);
    if (lang === 'he') tiers.forEach((t, i) => cfgTiers[i] && t.label !== cfgTiers[i].label_he && err(`${f}: bundle label ${i + 1} must be "${cfgTiers[i].label_he}"`));
    // trust values
    if (by.trust_bar) {
      const trust = JSON.stringify(by.trust_bar.items ?? []);
      for (const v of [cfg.founder.experience_years_label, cfg.trust.reviews_label, String(cfg.trust.returns_days)])
        if (!trust.includes(v)) err(`${f}: trust_bar must include "${v}"`);
      if (input && !shekels(trust).includes(input.sale_price)) err(`${f}: trust_bar must include the sale price ₪${input.sale_price}`);
    }
    if (by.social_proof) {
      if (Number(by.social_proof.rating) !== cfg.trust.rating) err(`${f}: social_proof.rating must be ${cfg.trust.rating}`);
      if (by.social_proof.reviews_label !== cfg.trust.reviews_label) err(`${f}: social_proof.reviews_label must be "${cfg.trust.reviews_label}"`);
    }
    if (by.offer_box?.rating_line && !(by.offer_box.rating_line.includes(String(cfg.trust.rating)) && by.offer_box.rating_line.includes(cfg.trust.reviews_label)))
      err(`${f}: offer_box.rating_line must contain ${cfg.trust.rating} and ${cfg.trust.reviews_label}`);
    // Product routes: the product-box button and the sticky bar, both to the real product page.
    if (input) {
      const r = productRoutes(g, input, cfg);
      if (!r.url) err(`${f}: no product URL (input.existing_product_page.url) — the page needs a route to the real product page`);
      if (lang === 'he') {
        eq2(by.cta?.button, r.box, 'cta.button');
        eq2(by.sticky_cta?.text, r.sticky, 'sticky_cta.text');
      }
      if (r.url) {
        const html = renderGpHtml(g, { plan: p.plan, input }).html;
        const links = html.split(`href="${r.url.replace(/&/g, '&amp;')}"`).length - 1;
        if (links < 2) err(`${f}: only ${links} link(s) to the product page — need the product-box button and the sticky CTA`);
        // RTL QA: every left-to-right run must sit in an isolated span in the rendered page.
        if (lang === 'he') {
          const bare = html.replace(/<span class="gp-(?:ltr|brand)">[^<]*<\/span>/g, ' ').replace(/<[^>]+>/g, ' ');
          const loose = [...new Set([...bare.matchAll(LTR_RUN)].map((m) => m[1]).concat(bare.includes('Adina Fashion') ? ['Adina Fashion'] : []))];
          if (loose.length) err(`${f}: RTL — not isolated in the rendered page: ${loose.join(' · ')}`);
          const punct = [...html.matchAll(/<span class="gp-ltr">([^<]*[.,:;!?])<\/span>/g)].map((m) => m[1]);
          if (punct.length) err(`${f}: RTL — punctuation inside an isolated run lands on the wrong side: ${punct.join(' · ')}`);
        }
      }
    }
    function eq2(val, want, what) {
      const n = (x) => String(x).replace(/\u00a0/g, ' ');
      if (val !== undefined && n(val) !== n(want)) err(`${f}: ${what} must be exactly "${want}"`);
    }
    // fixed Hebrew strings
    if (lang === 'he') {
      const L = cfg.landing_page;
      const eq = (val, want, what) => val !== undefined && val !== want && err(`${f}: ${what} must be exactly "${want}"`);
      eq(by.founder_header?.byline, L.byline_he, 'founder_header.byline');
      eq(by.founder_header?.badge, L.badge_he, 'founder_header.badge');
      if (by.founder_header?.note && !by.founder_header.note.startsWith(L.note_prefix_he)) err(`${f}: founder_header.note must start with "${L.note_prefix_he}"`);
      eq(by.founder_story?.greeting, L.greeting_he, 'founder_story.greeting');
      eq(by.about?.title, L.about_title_he, 'about.title');
      eq(by.about?.signoff, cfg.founder.brand_line_he, 'about.signoff');
      if (input) eq(by.offer_box?.product_name, input.hebrew_product_name, 'offer_box.product_name');
      if (by.about?.text && !by.about.text.includes('15')) warn(`${f}: about.text should mention 15+ years`);
      checkHebrew(g, f, latinOk, err, warn);
    }
    checkForbidden(g, f, err);
    // images referenced must exist in plan
    if (p.plan) {
      const refs = [by.hero?.image, by.packing?.image, ...items.map((i) => i.image)].filter(Boolean);
      refs.forEach((id) => !planIds.has(id) && err(`${f}: image "${id}" is not in 04-gempage-image-plan.json`));
    }
  }
  if (p.gempage.en && p.gempage.he) {
    const sig = (g) => (g.blocks ?? []).map((b) => `${b.type}:${(b.items ?? []).map((i) => `${i.n}/${i.image ?? ''}`).join(',')}:${b.image ?? ''}`).join('|');
    if (sig(p.gempage.en) !== sig(p.gempage.he)) err('03-gempage-copy.he.json structure (blocks, benefits, images) does not match the EN master');
  }

  // ---------- 04 image plan ----------
  const plan = p.plan;
  const page = p.gempage.he ?? p.gempage.en;
  if (plan) {
    const imgs = plan.images ?? [];
    if (imgs.length !== (cfg.landing_page.image_count ?? 7)) warn(`04-gempage-image-plan: ${imgs.length} images (blueprint: ${cfg.landing_page.image_count ?? 7})`);
    if (planIds.size !== imgs.length) err('04-gempage-image-plan: duplicate image ids');
    const blockTypes = new Set((page?.blocks ?? []).map((b) => b.type));
    const benefitNs = new Set(((page?.blocks ?? []).find((b) => b.type === 'benefits')?.items ?? []).map((i) => i.n));
    imgs.forEach((i) => {
      const w = `04-gempage-image-plan ${i.id}`;
      if (!IMAGE_ROLES.includes(i.role)) err(`${w}: role "${i.role}" not in ${IMAGE_ROLES.join('|')}`);
      if (!isFilled(i.purpose)) err(`${w}: no purpose — every image must prove a story point`);
      if (page && !blockTypes.has(i.block)) err(`${w}: block "${i.block}" does not exist in the GemPage`);
      if (i.block === 'benefits' && page && !benefitNs.has(i.benefit_n)) err(`${w}: benefit_n ${i.benefit_n} does not exist`);
      if (!colorOk(i.product_color)) err(`${w}: product_color "${i.product_color}" is not an input color`);
      if (!['generate', 'existing'].includes(i.source)) err(`${w}: source must be generate|existing`);
      if (i.source === 'existing') {
        const ex = i.existing_image;
        const known = (input?.existing_product_images ?? []).includes(ex) || (ex && !/^https?:/.test(ex) && fs.existsSync(path.join(p.dir, ex)));
        if (!known) err(`${w}: existing_image "${ex}" is not one of the supplied product images`);
      }
    });
    for (const r of ['hero', 'packing']) if (!imgs.some((i) => i.role === r)) err(`04-gempage-image-plan: no "${r}" image`);
    const hero = imgs.find((i) => i.role === 'hero');
    const variation = imgs.find((i) => i.role === 'variation');
    if (hero && variation && hero.product_color === variation.product_color && hero.model === variation.model)
      warn('04-gempage-image-plan: variation uses the same model and color as the hero');
    if (page) {
      const placed = new Set(walkStrings(page, '', []).map(([, s]) => s));
      imgs.forEach((i) => !placed.has(i.id) && warn(`04-gempage-image-plan: ${i.id} is not placed in any GemPage block`));
    }
  }

  // Casting (brand/image-rules.md): every person is an Israeli woman of 40–60 with an Israeli look.
  const castingCheck = (w, prompt, age) => {
    if (!/\b(woman|women|she|her|man|people|hands?)\b/i.test(prompt)) return; // product-only shot
    if (!/Casting: a Jewish Israeli woman/.test(prompt)) err(`${w}: prompt misses the casting line (brand/image-rules.md → Casting)`);
    if (!/Photo style: an ordinary candid photo taken on a smartphone/.test(prompt)) err(`${w}: prompt misses the photo-style line (brand/image-rules.md → Echte foto, geen AI-look)`);
    if (/golden hour|string lights|dreamy|bokeh(?! ,| no)/i.test(prompt.replace(/no creamy bokeh|no golden-hour glow/g, ''))) warn(`${w}: AI-looking light/background wording (golden hour, string lights, dreamy, bokeh)`);
    const ages = [...`${age ?? ''} ${prompt}`.matchAll(/\b(?:about|aged|approximately|around)\s+(\d{2})\b/gi)].map((m) => +m[1]);
    ages.filter((n) => n < 40 || n > 60).forEach((n) => err(`${w}: age ${n} is outside 40–60`));
    if (/\b(blonde?|platinum|silver hair|scandinavian|nordic)\b/i.test(prompt.replace(/Not Northern European, not blonde/g, '')))
      err(`${w}: casting describes a non-Israeli look (blonde/silver/Nordic)`);
  };

  // A review on the page must be a real testimonial; in Hebrew its text must be a verbatim excerpt of it.
  function checkReview(f, where, r, lang) {
    const tm = (input?.testimonials ?? []).find((x) => x.id === r.testimonial_id);
    if (!tm) return err(`${f}: ${where} → "${r.testimonial_id}" is not a testimonial in input.json`);
    if (tm.mockup) return err(`${f}: ${where} quotes mockup testimonial ${tm.id} — mockups are placed only by their \`benefit\`, never quoted in the copy`);
    if (suppliedFor.get(tm.benefit) === tm)
      return err(`${f}: ${where} quotes testimonial ${tm.id}, which is already placed under benefit ${tm.benefit} — it would appear twice`);
    if (!isFilled(r.text)) return err(`${f}: ${where} has no text`);
    const norm = (s) => String(s ?? '').replace(/[\s"'״׳“”„.,!?;:—–-]+/g, '');
    if (lang === 'he' && ![tm.text, tm.text_he].some((src) => src && norm(src).includes(norm(r.text))))
      err(`${f}: ${where} is not a verbatim excerpt of testimonial ${tm.id} — quote the customer, do not rewrite her`);
  }

  // ---------- 05 prompts ----------
  if (p.prompts) {
    const prompts = p.prompts.prompts ?? [];
    const planById = Object.fromEntries((plan?.images ?? []).map((i) => [i.id, i]));
    (plan?.images ?? []).filter((i) => i.source === 'generate').forEach((i) => !prompts.some((x) => x.image_id === i.id) && err(`05-image-prompts: no prompt for ${i.id}`));
    prompts.forEach((x) => {
      const w = `05-image-prompts ${x.image_id}`;
      if (plan && !planById[x.image_id]) err(`${w}: not in the image plan`);
      if (planById[x.image_id]?.source === 'existing') warn(`${w}: plan says this image already exists — no need to generate`);
      PROMPT_FIELDS.forEach((k) => !isFilled(x.fields?.[k]) && err(`${w}: field "${k}" is empty`));
      if (x.fields?.exact_color && !colorOk(x.fields.exact_color)) err(`${w}: exact_color "${x.fields.exact_color}" is not an input color`);
      if (planById[x.image_id] && x.fields?.exact_color && x.fields.exact_color.toLowerCase() !== String(planById[x.image_id].product_color).toLowerCase())
        err(`${w}: exact_color ≠ plan product_color`);
      if (!isFilled(x.prompt)) err(`${w}: prompt text is empty`);
      else {
        if (!/no text/i.test(x.prompt)) warn(`${w}: prompt should say "No text in image"`);
        if (!/reference/i.test(x.prompt)) warn(`${w}: prompt should require consistency with the reference images`);
        castingCheck(w, x.prompt, x.fields?.age);
      }
      if (!x.reference_images?.length) warn(`${w}: no reference_images`);
      if (x.aspect_ratio !== '4:5') err(`${w}: aspect_ratio must be 4:5 — every GemPage photo has the same portrait format (mobile)`);
      if (/\bmirror|reflection\b/i.test(`${x.fields?.action ?? ''} ${x.fields?.framing ?? ''}`)) warn(`${w}: mirrors/reflections tend to duplicate the person — avoid them`);
    });
  }

  // ---------- 07 creatives + 08 ugc ----------
  if (p.creatives) {
    const cr = p.creatives.creatives ?? [];
    const want = cfg.static_creatives;
    if (cr.length !== want.length || cr.some((c, i) => c.type !== want[i] || c.id !== 'ABCD'[i]))
      err(`07-creative-plan: must be exactly ${want.map((t, i) => `${'ABCD'[i]} ${t}`).join(', ')}`);
    cr.forEach((c) => {
      if (!colorOk(c.product_color)) err(`07-creative-plan ${c.id}: product_color "${c.product_color}" is not an input color`);
      for (const k of ['concept', 'visual', 'prompt']) if (!isFilled(c[k])) err(`07-creative-plan ${c.id}: ${k} is empty`);
      if (isFilled(c.prompt)) castingCheck(`07-creative-plan ${c.id}`, c.prompt);
    });
    const d = cr.find((c) => c.type === 'designed_hook');
    if (d && !(d.overlay_text_he && HEBREW.test(d.overlay_text_he))) err('07-creative-plan D: designed_hook needs a Hebrew overlay_text_he');
    const a = cr.find((c) => c.type === 'customer_discovery');
    const c = cr.find((x) => x.type === 'everyday_use');
    if (a && c && a.product_color === c.product_color && jaccard(a.visual, c.visual) > 0.5) warn('07-creative-plan: A and C look too similar (vary situation/model/color)');
    if (input) {
      const allowed = new Set([input.regular_price, input.sale_price]);
      walkStrings(p.creatives, '', []).forEach(([k, s]) => shekels(s).forEach((n) => !allowed.has(n) && err(`07-creative-plan.${k}: price ₪${n} is not the regular or sale price`)));
    }
    checkForbidden(p.creatives, '07-creative-plan', err);
  }
  if (input?.ugc_needed && p.creatives && !p.ugc?.needed) err('08-ugc: input asks for UGC but 08-ugc.json has needed: false or is missing');
  if (p.ugc?.needed) {
    const s = p.ugc.script ?? [];
    if (!s.length) err('08-ugc: needed but no script');
    s.forEach((x, i) => !(x.voice_he && HEBREW.test(x.voice_he)) && err(`08-ugc: script[${i}] needs Hebrew voice_he`));
    checkForbidden(p.ugc, '08-ugc', err);
  }

  // ---------- Hebrew spelling (scripts/spellcheck.js + Claude's proofread in 03-gempage-spellcheck.json) ----------
  if (p.gempage.he || p.creatives) {
    for (const i of spellcheckProduct(p).issues) (i.level === 'error' ? err : warn)(`spelling ${i.file} ${i.at}: ${i.message}`);
    const mtime = (f) => (fs.existsSync(path.join(p.dir, f)) ? fs.statSync(path.join(p.dir, f)).mtimeMs : 0);
    const proofed = mtime(FILES.spellcheck);
    if (p.gempage.he && !p.spellcheck) warn(`${FILES.spellcheck} missing — Claude has not proofread the Hebrew yet (step 6b)`);
    else if (p.spellcheck) {
      if (!['clean', 'fixed'].includes(p.spellcheck.status)) err(`${FILES.spellcheck}: status must be clean|fixed`);
      const stale = [FILES.gempageHe, FILES.creatives, FILES.ugc].filter((f) => mtime(f) > proofed + 1000);
      if (stale.length) warn(`${FILES.spellcheck} is older than ${stale.join(', ')} — proofread again (/launch-step <slug> spellcheck)`);
      (p.spellcheck.doubts ?? []).forEach((d) => flag(`SPELLING DOUBT — ${d.text ?? d}${d.question ? ': ' + d.question : ''}`));
    }

    // Hebrew naturalness pass (step 6c, brand/hebrew-copy.md): required, and fresh, before the GemPage is uploaded.
    const upload = stage === 'upload' || stage === 'publish' ? err : warn;
    const natural = mtime(FILES.naturalness);
    if (p.gempage.he && !p.naturalness) upload(`${FILES.naturalness} missing — the Hebrew naturalness pass (step 6c) has not been done`);
    else if (p.naturalness) {
      if (!['clean', 'rewritten'].includes(p.naturalness.status)) err(`${FILES.naturalness}: status must be clean|rewritten`);
      const stale = [FILES.gempageHe, FILES.creatives, FILES.ugc].filter((f) => mtime(f) > natural + 1000);
      if (stale.length) upload(`${FILES.naturalness} is older than ${stale.join(', ')} — run the naturalness pass again (/launch-step <slug> naturalness)`);
      (p.naturalness.doubts ?? []).forEach((d) => flag(`HEBREW DOUBT — ${d.text ?? d}${d.question ? ': ' + d.question : ''}`));
    }
  }

  return summary();

  function summary() {
    const steps = p?.steps ?? [];
    const ready = !errors.length && steps.every((s) => s.done);
    return { slug, errors, warnings, flags, missing, steps, ready };
  }
}

function checkHebrew(obj, where, latinOk, err, warn) {
  for (const [k, s] of walkStrings(obj, '', [])) {
    if (NON_COPY.test(k) || !s.trim()) continue;
    const at = `${where}${k.startsWith('[') ? '' : '.'}${k}`;
    const latin = (s.match(/[A-Za-z][A-Za-z0-9]*/g) ?? []).filter((x) => !latinOk.has(x.toLowerCase()));
    if (!HEBREW.test(s) && latin.length) err(`${at}: not Hebrew → "${s.slice(0, 60)}"`);
    else if (latin.length) warn(`${at}: Latin words in Hebrew copy (${[...new Set(latin)].join(', ')})`);
  }
}

function checkForbidden(obj, where, err) {
  for (const [k, s] of walkStrings(obj, '', [])) {
    if (NON_COPY.test(k)) continue;
    for (const f of FORBIDDEN) if (f.re.test(s)) err(`${where}${k.startsWith('[') ? '' : '.'}${k}: ${f.msg} → "${s.match(f.re)[0]}"`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const a = parseArgs(process.argv.slice(2));
  const slugs = a.all ? listSlugs() : a._;
  if (!slugs.length) {
    console.log(a.all ? 'No products yet.' : 'Usage: node scripts/validate.js <slug> | --all [--stage input|upload|publish] [--json]');
    process.exit(a.all ? 0 : 1);
  }
  const results = slugs.map((s) => validateProduct(s, { stage: a.stage }));
  if (a.json) console.log(JSON.stringify(results, null, 2));
  else
    for (const r of results) {
      console.log(`\n${r.errors.length ? '✗' : '✓'} ${r.slug} — ${r.errors.length} errors · ${r.warnings.length} warnings · ${r.flags.length} flags${r.ready ? ' · READY' : ''}`);
      if (a.stage !== 'input') console.log('  ' + r.steps.map((s) => `${s.done ? '■' : '□'} ${s.n} ${s.label}`).join('  '));
      r.errors.forEach((e) => console.log(`  ERROR  ${e}`));
      r.flags.forEach((f) => console.log(`  FLAG   ${f}`));
      r.warnings.forEach((w) => console.log(`  warn   ${w}`));
    }
  process.exit(results.some((r) => r.errors.length) ? 1 : 0);
}
