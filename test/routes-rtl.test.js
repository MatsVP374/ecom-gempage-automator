import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setProductsDir, loadProduct } from '../scripts/lib.js';
import { validateProduct } from '../scripts/validate.js';
import { renderGpHtml } from '../scripts/gempages.js';
import { writeDemo } from './fixture.js';

let dir;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adina-routes-'));
  setProductsDir(dir);
});
const html = (slug) => {
  const p = loadProduct(slug);
  return renderGpHtml(p.gempage.he, { plan: p.plan, input: p.input }).html;
};

test('two routes to the real product page: product-box button and sticky bar, no mid-CTA', () => {
  const slug = writeDemo(dir);
  const h = html(slug);
  assert.equal(h.split('href="https://example.com/demo"').length - 1, 2);
  assert.ok(!h.includes('gp-mid-cta'));
  assert.match(h, /gp-buy" href="https:\/\/example.com\/demo">לבחירת מידה וצבע של דמו\u00a0←/);
  assert.match(h, /gp-sticky-bar"><a href="https:\/\/example.com\/demo">/);
});

test('product box shows fixed facts: colours, size range, free shipping, 30-day returns', () => {
  const slug = writeDemo(dir, (d) => (d.input.sizes = ['S', 'M', 'L', 'XL', '2XL']));
  const h = html(slug);
  assert.ok(h.includes('<ul class="gp-facts"><li>Blue וGray</li><li>מידות <span class="gp-ltr">S–2XL</span></li><li>משלוח חינם</li><li>30 יום להחזרה</li></ul>'));
});

test('no product URL or a rewritten CTA/sticky text is an error', () => {
  const slug = writeDemo(dir, (d) => {
    d.input.existing_product_page = { url: '', content: 'page text' };
    d.gempageHe.blocks.find((b) => b.type === 'sticky_cta').text = 'דמו ב־₪150';
  });
  const e = validateProduct(slug).errors;
  assert.ok(e.some((x) => /no product URL/.test(x)));
  assert.ok(e.some((x) => /sticky_cta.text must be exactly "דמו עכשיו ב־₪150 — לבחירת מידה וצבע"/.test(x)));
});

test('RTL: ₪ prices, ratings, +counts, percentages, size ranges and the brand are isolated', () => {
  const slug = writeDemo(dir, (d) => d.gempageHe.blocks.find((b) => b.type === 'sale').paragraphs.push('עכשיו ב־₪150 במקום ₪300, מידות S–5XL, 25% הנחה, 4.7/5 מ־2,550+ ביקורות, Adina Fashion.'));
  const h = html(slug);
  for (const s of ['₪150', '₪300', 'S–5XL', '25%', '4.7/5', '2,550+']) assert.ok(h.includes(`<span class="gp-ltr">${s}</span>`), s);
  assert.ok(h.includes('<span class="gp-brand">Adina Fashion</span>'));
  assert.deepEqual(validateProduct(slug).errors.filter((x) => /RTL/.test(x)), []);
  // punctuation after a price stays outside the isolated run, and ב־ stays glued to its number
  assert.ok(h.includes('<span class="gp-nb">ב־<span class="gp-ltr">₪150</span></span> במקום <span class="gp-ltr">₪300</span>,'));
});
