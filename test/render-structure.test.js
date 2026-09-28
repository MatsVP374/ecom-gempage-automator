// Structural regression tests for the rendered founder letter (draft 639388586470278066 showed each benefit headline and
// the packing caption twice — as visible text and again as the photo's alt — and a lone ★★★★★ from an empty social-proof
// block). Counts are over the whole HTML, attribute values included, so nothing can be repeated anywhere.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setProductsDir, loadProduct } from '../scripts/lib.js';
import { renderGpHtml, LETTER_CSS_TEMPLATE } from '../scripts/gempages.js';
import { validateProduct } from '../scripts/validate.js';
import { runRtlAudit } from '../scripts/rtl-audit.js';
import { writeDemo } from './fixture.js';

let dir;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adina-struct-'));
  setProductsDir(dir);
});

const HEADLINES = [
  'לא צריך לבחור בין לוק מעודכן לנוחות.',
  'מהסידורים של הבוקר ועד ארוחה עם חברות.',
  'את מחליטה כמה לסגור.',
  'גזרה שלא נצמדת, ועדיין מחמיאה.',
  'קליל גם ביום הכי חם.',
  'ארבעה צבעים, ובטח אחד מהם שלך.',
];
const BODIES = HEADLINES.map((_, k) => `גוף הטקסט של יתרון ${k + 1}, עם ג׳ינס או חצאית.`);
const PACKING = 'ארוז ומוכן לדרך. כל הזמנה נארזת אצלנו בבוטיק בקפידה ובאהבה.';
const REVIEWS = [1, 2, 3, 4, 5, 6].map((n) => ({
  id: `r${n}`,
  benefit: n,
  name: ['מאיה', 'שירה', 'נועה', 'דנה', 'רותי', 'אורית'][n - 1],
  rating: n === 5 ? 4 : 5,
  text: `ביקורת ${n}: הטופ "נעים" וקליל, המידה M ישבה טוב, שווה ₪179!`,
}));

// Payo-like page: six benefits (the first without a photo), packing photo + caption, social proof without a quote.
const payoLike = ({ mockup = true, social = {} } = {}) => (d) => {
  const b = d.gempageHe.blocks.find((x) => x.type === 'benefits');
  const img = [null, ...b.items.map((i) => i.image)].slice(0, 6);
  b.items = HEADLINES.map((headline, k) => ({ n: k + 1, headline, text: BODIES[k], feature_ids: [`f${Math.min(k + 1, 5)}`], image: img[k] }));
  d.gempageHe.blocks.find((x) => x.type === 'packing').caption = PACKING;
  Object.assign(d.gempageHe.blocks.find((x) => x.type === 'social_proof'), social);
  d.input.testimonials = REVIEWS.map((r) => ({ ...r, source: mockup ? 'MOCKUP_PLACEHOLDER — not a customer review' : 'Judge.me', ...(mockup && { mockup: true }) }));
  if (mockup) d.input.mockup_reviews_allowed = true;
  d.facts.testimonials = [];
};
const render = (slug) => {
  const p = loadProduct(slug);
  return renderGpHtml(p.gempage.he, { plan: p.plan, input: p.input });
};
const count = (html, s) => html.split(s).length - 1;
const esc = (s) => s.replace(/"/g, '&quot;');
// renderGpHtml writes each benefit block as one line.
const features = (html) => html.split('\n').filter((l) => l.startsWith('<div class="gp-feature gp-measure">'));
const plain = (s) => s.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"');

test('each benefit headline renders exactly once (also not repeated as the photo alt)', () => {
  const html = render(writeDemo(dir, payoLike())).html;
  for (const h of HEADLINES) assert.equal(count(html, h), 1, h);
  for (const f of features(html)) for (const m of f.matchAll(/<img [^>]*>/g)) assert.match(m[0], / alt=""/, 'benefit photo alt repeats nothing');
});

test('each benefit body renders exactly once', () => {
  const html = render(writeDemo(dir, payoLike())).html;
  for (const b of BODIES) assert.equal(count(html, b), 1, b);
});

test('benefit structure: number → headline → body → photo → review, each once, in that order', () => {
  const fs6 = features(render(writeDemo(dir, payoLike())).html);
  assert.equal(fs6.length, 6);
  fs6.forEach((f, k) => {
    assert.equal(count(f, '<span class="gp-fnum">'), 1);
    assert.equal(count(f, '<h3>'), 1);
    assert.equal(count(f, '<p>'), 1);
    assert.equal(count(f, 'gp-review-card'), 1);
    assert.equal(count(f, '<img'), k === 0 ? 0 : 1, 'benefit 1 has no photo in this page');
    const order = ['gp-fnum', '<h3>', '<p>', ...(k ? ['<img'] : []), 'gp-review-card'].map((m) => f.indexOf(m));
    assert.deepEqual([...order].sort((a, b) => a - b), order, `benefit ${k + 1} out of order`);
  });
});

test('supplied review insertion does not duplicate surrounding benefit content', () => {
  const withReviews = features(render(writeDemo(dir, payoLike())).html);
  const bare = features(render(writeDemo(dir, (d) => { payoLike()(d); d.input.testimonials = []; delete d.input.mockup_reviews_allowed; })).html);
  withReviews.forEach((f, k) => assert.equal(f.replace(/<div class="gp-review-card[\s\S]*<\/cite><\/div>/, ''), bare[k], `benefit ${k + 1}`));
});

test('packing caption renders exactly once (not also as the photo alt)', () => {
  const html = render(writeDemo(dir, payoLike())).html;
  assert.equal(count(html, PACKING), 1);
  assert.match(html, /<div class="gp-fold-photo"><img [^>]*alt=""/);
  const noCaption = render(writeDemo(dir, (d) => { payoLike()(d); d.gempageHe.blocks.find((x) => x.type === 'packing').caption = ''; })).html;
  assert.doesNotMatch(noCaption, /gp-fold-cap/, 'no empty caption element');
});

test('social proof without a review: no standalone stars; empty social proof renders nothing', () => {
  const html = render(writeDemo(dir, payoLike())).html;
  const stars = (h) => count(h, '★★★★★') + count(h, '★★★★☆');
  const cardStars = count(html, 'gp-review-card');
  assert.equal(stars(html), cardStars + 1, 'only the review cards and the product-box rating have stars');
  assert.doesNotMatch(html, /<div class="gp-social"><div class="gp-stars">/);
  assert.match(html, /<div class="gp-social"><div class="gp-rating-line">/, 'the store rating line itself stays');

  const empty = render(writeDemo(dir, payoLike({ social: { text: '', rating: null, reviews_label: '', quotes: [] } }))).html;
  assert.doesNotMatch(empty, /gp-social/);
  const ghost = render(writeDemo(dir, payoLike({ social: { quotes: [{ testimonial_id: 't1', text: '   ' }] } }))).html;
  assert.equal(count(ghost, 'gp-review-card'), 6, 'a quote without text renders no card');
});

test('social proof with a real review keeps its star row and the review card', () => {
  const html = render(writeDemo(dir, (d) => {
    payoLike({ mockup: false })(d);
    d.input.testimonials.push({ id: 't9', name: 'לאה', rating: 5, source: 'Judge.me', text: 'הזמנתי שוב, בצבע נוסף.' });
    d.gempageHe.blocks.find((x) => x.type === 'social_proof').quotes = [{ testimonial_id: 't9', text: 'הזמנתי שוב, בצבע נוסף.' }];
  })).html;
  assert.match(html, /<div class="gp-social"><div class="gp-stars">★★★★★<\/div><div class="gp-rating-line">/);
  assert.equal(count(html, 'הזמנתי שוב, בצבע נוסף.'), 1);
});

test('a supplied review quoted again in the copy renders once, and validation flags it', () => {
  const slug = writeDemo(dir, (d) => {
    payoLike({ mockup: false })(d);
    d.gempageHe.blocks.find((x) => x.type === 'social_proof').quotes = [{ testimonial_id: 'r3', text: REVIEWS[2].text }];
  });
  assert.equal(count(render(slug).html, `ביקורת 3:`), 1);
  assert.ok(validateProduct(slug).errors.some((e) => /quotes testimonial r3, which is already placed under benefit 3 — it would appear twice/.test(e)));
});

test('all six mapped reviews stay present, verbatim, under their benefit; mockups stay invisible-marked', () => {
  const r = render(writeDemo(dir, payoLike()));
  features(r.html).forEach((f, k) => {
    const s = REVIEWS[k];
    assert.ok(plain(f).includes(`”${s.text}“`), `review ${s.id} not verbatim under benefit ${k + 1}`);
    assert.ok(plain(f).includes(`— ${s.name}`));
    assert.equal(count(f, '★'), s.rating);
    assert.equal(count(f, '☆'), 5 - s.rating);
    assert.match(f, /data-review="mockup"/);
  });
  assert.deepEqual(r.reviews, { customer: 0, mockup: 6, rendered_as: 'mockup' });
  assert.doesNotMatch(r.html, /ביקורת לדוגמה|gp-mockup|טיוטה פנימית/);
});

const noBrowser = (await runRtlAudit({ html: '<div class="gp-page" dir="rtl"><div class="gp-card">א</div></div>', css: '' })).skipped;
test('RTL: the Payo-like page is fully RTL on desktop and mobile', { skip: noBrowser ? `render checks skipped: ${noBrowser}` : false }, async () => {
  const r = render(writeDemo(dir, payoLike()));
  assert.deepEqual(await runRtlAudit({ html: r.html, css: LETTER_CSS_TEMPLATE() }), { desktop: [], mobile: [] });
});
