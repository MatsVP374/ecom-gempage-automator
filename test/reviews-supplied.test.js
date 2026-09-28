// Supplied reviews (Activepieces) with `benefit`, and mockup reviews on drafts (brand/testimonial-rules.md).
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setProductsDir, loadProduct } from '../scripts/lib.js';
import { renderGpHtml, LETTER_CSS_TEMPLATE, MOCKUP_LABEL_HE, MOCKUP_BANNER_HE } from '../scripts/gempages.js';
import { validateProduct } from '../scripts/validate.js';
import { normaliseInput } from '../scripts/new-product.js';
import { runRtlAudit } from '../scripts/rtl-audit.js';
import { writeDemo } from './fixture.js';

let dir;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adina-rev-'));
  setProductsDir(dir);
});

// Six supplied reviews, as Activepieces sends them (text with punctuation, quotes, a price and a Latin size).
const SUPPLIED = [1, 2, 3, 4, 5, 6].map((n) => ({
  id: `r${n}`,
  name: ['מיכל', 'רחל', 'יעל', 'דפנה', 'נועה', 'שירה'][n - 1],
  rating: n === 4 ? 4 : 5,
  text: `ביקורת מספר ${n}: הבד "נעים", המידה M ישבה טוב, שווה כל ₪179!`,
  benefit: n,
}));
const mockups = (allowed = true) => (d) => {
  d.input.testimonials = SUPPLIED.map((r) => ({ ...r, source: 'MOCKUP_PLACEHOLDER — not a customer review', mockup: true }));
  if (allowed) d.input.mockup_reviews_allowed = true;
  d.facts.testimonials = [];
};
const render = (slug) => {
  const p = loadProduct(slug);
  return renderGpHtml(p.gempage.he, { plan: p.plan, input: p.input });
};
const cards = (html) => [...html.matchAll(/<div class="gp-review-card[^"]*"[^>]*>[\s\S]*?<\/cite><\/div>/g)].map((m) => m[0]);
const plain = (s) => s.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&');

test('input: benefit and mockup survive normalisation; absent fields keep the old shape', () => {
  const i = normaliseInput('x', { testimonials: [{ id: 'r1', text: 'a', benefit: 3, mockup: true }, { id: 't2', text: 'b' }], mockup_reviews_allowed: true });
  assert.equal(i.testimonials[0].benefit, 3);
  assert.equal(i.testimonials[0].mockup, true);
  assert.ok(!('benefit' in i.testimonials[1]) && !('mockup' in i.testimonials[1]));
  assert.equal(i.mockup_reviews_allowed, true);
  assert.ok(!('mockup_reviews_allowed' in normaliseInput('x', {})));
});

test('mockups on a draft (publish:false): rendered under their photos and visibly marked', () => {
  const r = render(writeDemo(dir, mockups()));
  const c = cards(r.html);
  assert.equal(c.length, 5, 'one card per existing benefit (benefit 6 has no photo in this template)');
  for (const card of c) {
    assert.match(card, /gp-review-mockup/);
    assert.ok(card.includes(MOCKUP_LABEL_HE));
    assert.doesNotMatch(card, /לקוחה של Adina Fashion/, 'a mockup is never presented as a customer');
  }
  assert.ok(r.html.includes(`<div class="gp-mockup-banner" data-review="mockup">${MOCKUP_BANNER_HE}</div>`));
  assert.ok(r.html.indexOf('gp-mockup-banner') < r.html.indexOf('gp-top-byline'), 'the banner opens the page');
  assert.deepEqual(r.reviews, { customer: 0, mockup: 5, rendered_as: 'mockup' });
});

test('mockups: supplied name, rating and text are kept verbatim (no excerpt, rewrite or correction)', () => {
  const r = render(writeDemo(dir, mockups()));
  cards(r.html).forEach((card, k) => {
    const s = SUPPLIED[k];
    assert.ok(plain(card).includes(`”${s.text}“`), `review ${s.id} text changed`);
    assert.ok(plain(card).includes(`— ${s.name}`));
    assert.equal((card.match(/★/g) ?? []).length, s.rating);
  });
});

test('benefit mapping is deterministic: the supplied `benefit` decides the photo, not the order or the copy', () => {
  const slug = writeDemo(dir, (d) => {
    mockups()(d);
    d.input.testimonials.reverse();
  });
  const html = render(slug).html;
  const features = html.split('<div class="gp-feature gp-measure">').slice(1);
  features.forEach((f, k) => assert.ok(plain(f).includes(`ביקורת מספר ${k + 1}:`), `benefit ${k + 1} got the wrong review`));
  assert.equal(render(slug).html, html, 'same input → same page');
  assert.ok(validateProduct(slug).warnings.some((w) => /testimonial r6 is supplied for benefit 6, which does not exist/.test(w)));
});

test('mockups without draft permission are not rendered, and validation fails', () => {
  const slug = writeDemo(dir, mockups(false));
  const r = render(slug);
  assert.equal(cards(r.html).length, 0);
  assert.doesNotMatch(r.html, /gp-mockup-banner/);
  assert.equal(r.reviews.rendered_as, 'none');
  assert.ok(validateProduct(slug).errors.some((e) => /mockup testimonial\(s\) without mockup_reviews_allowed/.test(e)));
});

test('publish gate: a page with mockups can never pass --stage publish', () => {
  const slug = writeDemo(dir, mockups());
  assert.ok(!validateProduct(slug).errors.some((e) => /MOCKUP/.test(e)), 'a draft is fine');
  const e = validateProduct(slug, { stage: 'publish' }).errors;
  assert.ok(e.some((x) => /^MOCKUP REVIEWS — 6 mockup testimonial/.test(x)));
  assert.ok(e.some((x) => /mockup_reviews_allowed is set — this page is a mockup draft/.test(x)));
  assert.ok(validateProduct(slug).flags.some((f) => /^MOCKUP REVIEWS ON DRAFT/.test(f)));
});

test('mockups are never evidence for product facts', () => {
  const slug = writeDemo(dir, (d) => {
    mockups()(d);
    d.facts.testimonials = [{ id: 'r2', supported_statements: ['breathable'], sufficient_for_ad: true, gaps: [] }];
  });
  assert.ok(validateProduct(slug).errors.some((e) => /testimonial "r2" is a mockup — mockup reviews are never evidence/.test(e)));
});

test('the copy may not quote a mockup, nor add its own review where one is supplied', () => {
  const slug = writeDemo(dir, (d) => {
    mockups()(d);
    const b = d.gempageHe.blocks.find((x) => x.type === 'benefits');
    b.items[0].review = { testimonial_id: 'r1', text: 'ביקורת מספר 1' };
  });
  const e = validateProduct(slug).errors;
  assert.ok(e.some((x) => /quotes mockup testimonial r1/.test(x)));
  assert.ok(e.some((x) => /benefit 1 has a review in the copy, but testimonial r1 is supplied/.test(x)));
  assert.equal(cards(render(slug).html).filter((c) => /ביקורת מספר 1:/.test(c)).length, 1, 'rendered once, from the supplied review');
});

test('real supplied reviews with `benefit` render as customer reviews, verbatim, and may be published', () => {
  const slug = writeDemo(dir, (d) => {
    d.input.testimonials = SUPPLIED.slice(0, 5).map((r) => ({ ...r, source: 'Judge.me' }));
    d.facts.testimonials = [];
  });
  const r = render(slug);
  assert.deepEqual(r.reviews, { customer: 5, mockup: 0, rendered_as: 'customer' });
  assert.doesNotMatch(r.html, /gp-review-mockup|gp-mockup-banner/);
  assert.ok(plain(r.html).includes(`”${SUPPLIED[0].text}“`));
  assert.ok(!validateProduct(slug, { stage: 'publish' }).errors.some((e) => /MOCKUP|mockup/.test(e)));
});

const noBrowser = (await runRtlAudit({ html: '<div class="gp-page" dir="rtl"><div class="gp-card">א</div></div>', css: '' })).skipped;
test('RTL: a mockup draft is still fully RTL on desktop and mobile', { skip: noBrowser ? `render checks skipped: ${noBrowser}` : false }, async () => {
  const r = render(writeDemo(dir, mockups()));
  assert.deepEqual(await runRtlAudit({ html: r.html, css: LETTER_CSS_TEMPLATE() }), { desktop: [], mobile: [] });
});
