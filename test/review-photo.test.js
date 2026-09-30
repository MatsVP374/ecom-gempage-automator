// One customer-style photo with review 1 (image role `customer_review`, benefits item 1 → review_image). It renders only
// inside review 1's own card, so only when review 1 itself renders; mockup reviews and their photo never reach a
// published page, and a photo that cannot show is never planned or generated.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setProductsDir, loadProduct } from '../scripts/lib.js';
import { renderGpHtml, renderedReviewFor, LETTER_CSS_TEMPLATE } from '../scripts/gempages.js';
import { validateProduct } from '../scripts/validate.js';
import { runImages } from '../scripts/images.js';
import { runRtlAudit } from '../scripts/rtl-audit.js';
import { writeDemo } from './fixture.js';

const RULES = fs.readFileSync(new URL('../brand/image-rules.md', import.meta.url), 'utf8').split('\n');
const CASTING = RULES.find((l) => l.startsWith('Casting: a Jewish Israeli woman')).replace('[45–58]', '52');
const STYLE = RULES.find((l) => l.startsWith('Photo style: a natural, flattering lifestyle photo'));
const URL8 = 'https://cdn.example.com/demo/IMG-08.png';

let dir;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adina-review-photo-'));
  setProductsDir(dir);
});

const REVIEW = { id: 'r1', benefit: 1, name: 'מיכל', rating: 5, text: 'הבד נעים וקליל, לובשת אותה כל הבוקר.' };
const benefitsOf = (g) => g.blocks.find((b) => b.type === 'benefits');

// review: 'supplied' | 'copy' | 'mockup-draft' | 'mockup-unallowed' | 'none'
const withPhoto = ({ review = 'supplied', url = URL8, prompt } = {}) => (d) => {
  d.plan.images.push({ id: 'IMG-08', role: 'customer_review', block: 'benefits', benefit_n: 1, purpose: 'customer-style photo with review 1', source: 'generate', existing_image: null, product_color: 'Blue', model: 'stylish Israeli woman, ~52', setting: 'balcony', ...(url && { url }) });
  d.prompts.prompts.push({
    image_id: 'IMG-08',
    aspect_ratio: '4:5',
    reference_images: d.input.existing_product_images,
    fields: { ...d.prompts.prompts[0].fields, age: '52' },
    prompt: prompt ?? `A customer-style photo of a stylish Israeli woman aged about 52 on her balcony wearing the top. ${CASTING} ${STYLE} No text in image. Consistent with the reference images.`,
  });
  for (const g of [d.gempageEn, d.gempageHe]) benefitsOf(g).items[0].review_image = 'IMG-08';
  if (review === 'supplied') d.input.testimonials.push({ ...REVIEW, source: 'Judge.me' });
  if (review === 'copy') {
    d.input.testimonials.push({ id: 't9', name: 'מיכל', rating: 5, source: 'Judge.me', text: REVIEW.text });
    for (const g of [d.gempageEn, d.gempageHe]) benefitsOf(g).items[0].review = { testimonial_id: 't9', text: REVIEW.text };
  }
  if (review.startsWith('mockup')) {
    d.input.testimonials.push({ ...REVIEW, mockup: true, source: 'MOCKUP_PLACEHOLDER — generated, not a customer review' });
    if (review === 'mockup-draft') d.input.mockup_reviews_allowed = true;
  }
};
const render = (slug) => {
  const p = loadProduct(slug);
  return renderGpHtml(p.gempage.he, { plan: p.plan, input: p.input });
};
const firstFeature = (html) => html.split('\n').find((l) => l.startsWith('<div class="gp-feature gp-measure">'));
const count = (s, x) => s.split(x).length - 1;
const photoErr = (r) => r.errors.filter((e) => /IMG-08|customer_review|review_image|review 1/.test(e));

test('a real supplied review 1 renders with its customer-style photo, inside its card, once', () => {
  const slug = writeDemo(dir, withPhoto());
  const { html, missingImages } = render(slug);
  const f = firstFeature(html);
  assert.equal(count(html, URL8), 1);
  assert.match(f, /<div class="gp-review-card gp-photo-review"><div class="gp-review-photo"><img src="https:\/\/cdn\.example\.com\/demo\/IMG-08\.png" alt=""/);
  assert.ok(f.indexOf('gp-review-photo') < f.indexOf('gp-quote'), 'photo sits at the top of the review card');
  assert.ok(!missingImages.includes('IMG-08'));
  assert.deepEqual(photoErr(validateProduct(slug)), []);
  assert.deepEqual(photoErr(validateProduct(slug, { stage: 'publish' })), []);
});

test('a real review 1 from the copy (benefits[0].review) also carries the photo', () => {
  const slug = writeDemo(dir, withPhoto({ review: 'copy' }));
  assert.equal(count(firstFeature(render(slug).html), URL8), 1);
  assert.deepEqual(photoErr(validateProduct(slug)), []);
});

test('no review 1: no photo, no placeholder, and the plan may not contain it', async () => {
  const slug = writeDemo(dir, withPhoto({ review: 'none', url: null }));
  const { html, missingImages } = render(slug);
  assert.doesNotMatch(html, /gp-review-photo|IMG-08/);
  assert.ok(!missingImages.includes('IMG-08'), 'an image that cannot show is not reported missing');
  assert.ok(validateProduct(slug).errors.some((e) => /IMG-08: review 1 is not eligible to render/.test(e)));
  const s = await runImages(slug, { dryRun: true, log: () => {} });
  assert.ok(s.skipped.some((x) => /IMG-08: review 1 does not render/.test(x)), 'never generated');
});

test('mockup review 1 on an unpublished mockup draft: photo renders like the final page, marked internally', () => {
  const slug = writeDemo(dir, withPhoto({ review: 'mockup-draft' }));
  const f = firstFeature(render(slug).html);
  assert.match(f, /<div class="gp-review-card gp-photo-review" data-review="mockup"><div class="gp-review-photo"><img src="https:\/\/cdn\.example\.com\/demo\/IMG-08\.png"/);
  assert.deepEqual(photoErr(validateProduct(slug)), []);
  const pub = validateProduct(slug, { stage: 'publish' });
  assert.ok(pub.errors.some((e) => /MOCKUP REVIEWS — the rendered page contains mockup review cards \(including the review 1 photo\)/.test(e)));
});

test('mockup review 1 on a page that may be published: neither the review nor its photo renders', async () => {
  // What the bridge does with publish:true: MOCKUP_PLACEHOLDER reviews never reach testimonials.
  const dropped = writeDemo(dir, withPhoto({ review: 'none' }));
  assert.equal(renderedReviewFor(loadProduct(dropped).gempage.he, loadProduct(dropped).input, 1), null);
  assert.doesNotMatch(render(dropped).html, /gp-review-photo|IMG-08|data-review="mockup"/);
  // Belt and braces: a mockup that slipped in without mockup_reviews_allowed still renders nothing.
  const slipped = writeDemo(dir, withPhoto({ review: 'mockup-unallowed' }));
  assert.doesNotMatch(render(slipped).html, /gp-review-photo|IMG-08|data-review="mockup"/);
  assert.ok(validateProduct(slipped).errors.some((e) => /IMG-08: review 1 is not eligible to render/.test(e)));
  assert.ok((await runImages(slipped, { dryRun: true, log: () => {} })).skipped.some((x) => /IMG-08/.test(x)));
});

test('placement rules: only review 1, only a customer_review image, at most one', () => {
  const other = validateProduct(writeDemo(dir, (d) => {
    withPhoto()(d);
    benefitsOf(d.gempageHe).items[1].review_image = 'IMG-08';
  }));
  assert.ok(other.errors.some((e) => /benefit 2 has a review_image — only review 1/.test(e)));
  const wrongRole = validateProduct(writeDemo(dir, (d) => {
    withPhoto()(d);
    benefitsOf(d.gempageHe).items[0].review_image = 'IMG-02';
  }));
  assert.ok(wrongRole.errors.some((e) => /review_image "IMG-02" is not a customer_review image/.test(e)));
  const unplaced = validateProduct(writeDemo(dir, (d) => {
    withPhoto()(d);
    delete benefitsOf(d.gempageHe).items[0].review_image;
  }));
  assert.ok(unplaced.errors.some((e) => /benefit 1 has no review_image "IMG-08"/.test(e)));
  const two = validateProduct(writeDemo(dir, (d) => {
    withPhoto()(d);
    d.plan.images.push({ ...d.plan.images.at(-1), id: 'IMG-09' });
  }));
  assert.ok(two.errors.some((e) => /2 "customer_review" images — at most one/.test(e)));
});

test('the photo follows the casting rules and does not count against the 7 story images', () => {
  const ok = validateProduct(writeDemo(dir, withPhoto()));
  assert.ok(!ok.warnings.some((w) => /images \(blueprint/.test(w)));
  const bad = validateProduct(writeDemo(dir, withPhoto({ prompt: 'A customer-style photo of an elderly woman aged about 66 with grey hair. No text in image. Consistent with the reference images.' })));
  const e = bad.errors.filter((x) => x.startsWith('05-image-prompts IMG-08'));
  assert.ok(e.some((x) => /misses the casting line/.test(x)));
  assert.ok(e.some((x) => /age 66 is outside 45–60/.test(x)));
});

const noBrowser = (await runRtlAudit({ html: '<div class="gp-page" dir="rtl"><div class="gp-card">א</div></div>', css: '' })).skipped;
test('RTL: the review 1 card with its photo stays fully RTL', { skip: noBrowser ? `render checks skipped: ${noBrowser}` : false }, async () => {
  const { html } = render(writeDemo(dir, withPhoto()));
  assert.deepEqual(await runRtlAudit({ html, css: LETTER_CSS_TEMPLATE() }), { desktop: [], mobile: [] });
});
