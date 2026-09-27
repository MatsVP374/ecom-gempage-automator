import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setProductsDir, loadProduct } from '../scripts/lib.js';
import { validateProduct } from '../scripts/validate.js';
import { renderGpHtml } from '../scripts/gempages.js';
import { writeDemo } from './fixture.js';

// TEST FIXTURE reviews — not real customers.
const withReviews = (quote) => (d) => {
  d.input.testimonials = [
    { id: 't1', name: 'בדיקה', age: 55, rating: 5, source: 'TEST FIXTURE', text: 'TEST FIXTURE: הבד נושם ונוח לי כל היום, אפילו באוגוסט.', details: '' },
    { id: 't2', name: null, age: null, rating: null, source: 'TEST FIXTURE', text: 'TEST FIXTURE: מתאים לי גם לג׳ינס וגם לחצאית.', details: '' },
  ];
  const he = d.gempageHe.blocks.find((b) => b.type === 'benefits').items;
  const en = d.gempageEn.blocks.find((b) => b.type === 'benefits').items;
  he[0].review = { testimonial_id: 't1', text: quote };
  en[0].review = { testimonial_id: 't1', text: 'The fabric breathes, comfortable all day.' };
  he[1].review = { testimonial_id: 't2', text: 'מתאים לי גם לג׳ינס וגם לחצאית' };
  en[1].review = { testimonial_id: 't2', text: 'Works with jeans and skirts.' };
  return d;
};

let dir;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adina-rev-'));
  setProductsDir(dir);
});

test('reviews per photo: verbatim excerpt passes; name, age and stars come from input', () => {
  const slug = writeDemo(dir, withReviews('הבד נושם ונוח לי כל היום'));
  const v = validateProduct(slug);
  assert.deepEqual(v.errors.filter((e) => /review|excerpt/.test(e)), []);
  assert.ok(v.flags.some((f) => f.startsWith('REVIEWS PER PHOTO: 2/')));
  const p = loadProduct(slug);
  const html = renderGpHtml(p.gempage.he, { plan: p.plan, input: p.input }).html;
  assert.match(html, /— בדיקה, 55/);
  assert.match(html, /★★★★★/);
  assert.match(html, /לקוחה של <span class="gp-brand">Adina Fashion<\/span>/); // t2 has no name
});

test('reviews per photo: a rewritten or unknown review is an error', () => {
  const slug = writeDemo(dir, withReviews('הבד הזה פשוט מושלם ומרגיש נהדר'));
  assert.ok(validateProduct(slug).errors.some((e) => /not a verbatim excerpt of testimonial t1/.test(e)));
  writeDemo(dir, (d) => {
    withReviews('הבד נושם')(d);
    d.gempageHe.blocks.find((b) => b.type === 'benefits').items[0].review.testimonial_id = 't9';
    return d;
  });
  assert.ok(validateProduct(slug).errors.some((e) => /"t9" is not a testimonial/.test(e)));
});
