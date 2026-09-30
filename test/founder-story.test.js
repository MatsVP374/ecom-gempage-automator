// Founder-letter story (brand/adina.md → founder-verhaal): Adina is selective and explains why this product earned a
// place in her selection. The offer never gets a reason for the discount that input.sale_reason does not give.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setProductsDir } from '../scripts/lib.js';
import { validateProduct } from '../scripts/validate.js';
import { writeDemo } from './fixture.js';

const ROOT = new URL('..', import.meta.url).pathname;
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

let dir;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adina-story-'));
  setProductsDir(dir);
});

const run = (mutate) => validateProduct(writeDemo(dir, mutate));
const has = (list, re) => list.some((m) => re.test(m));
const block = (g, type) => g.blocks.find((b) => b.type === type);
const noReason = (d) => {
  d.input.sale_reason = '';
  d.facts.sale_reason = '';
  d.angle.selection_story.offer_framing = 'introductory_offer';
};

test('brand rules carry the selective-boutique story and no season default', () => {
  const adina = read('brand/adina.md');
  assert.match(adina, /Adina is selectief\. Niet elk product komt haar boetiek in\. Elk product moet zijn plek verdienen\./);
  for (const step of ['Persoonlijke hook', 'Het echte probleem', 'Wat haar van gedachten deed veranderen', 'Waarom ze het koos', 'Het echte leven', 'Het aanbod', 'Persoonlijke afsluiting'])
    assert.ok(adina.includes(step), step);
  const docs = ['brand/adina.md', 'brand/gempage-blueprint.md', 'CLAUDE.md', 'README.md', 'templates/product-input.md', 'app/index.html', ...fs.readdirSync(path.join(ROOT, 'prompts')).map((f) => `prompts/${f}`)];
  for (const f of docs) assert.doesNotMatch(read(f), /End of season sale|seasonal promotion|\(seizoen \+|Transition into cooler weather/i, f);
});

test('a letter in the new arc (hook → problem → turning_point → selection) passes', () => {
  const r = run();
  assert.deepEqual(r.errors.filter((e) => /founder_story|selection_story|sale_reason|reason for the offer/.test(e)), []);
  assert.ok(!has(r.warnings, /previous story arc/));
});

test('wrong story roles are an error; the previous arc only warns (existing letters keep validating)', () => {
  const wrong = run((d) => (block(d.gempageHe, 'founder_story').parts = block(d.gempageHe, 'founder_story').parts.slice(0, 3)));
  assert.ok(has(wrong.errors, /founder_story\.parts roles must be hook → problem → turning_point → selection/));

  const legacy = run((d) => {
    for (const g of [d.gempageEn, d.gempageHe])
      block(g, 'founder_story').parts = ['intro', 'observation', 'problem', 'alternatives', 'search', 'discovery'].map((role) => ({ role, text: g.lang === 'he' ? 'טקסט' : 'text' }));
    delete d.angle.selection_story;
  });
  assert.ok(!has(legacy.errors, /founder_story|selection_story/));
  assert.ok(has(legacy.warnings, /03-gempage-copy\.he\.json: founder_story uses the previous story arc/));
  assert.ok(has(legacy.warnings, /no "selection_story"/));
});

test('the angle must say why the product earned its place', () => {
  assert.ok(has(run((d) => delete d.angle.selection_story).errors, /02-central-angle: no "selection_story"/));
  const r = run((d) => Object.assign(d.angle.selection_story, { opening: 'always_doubt', why_selected: '', turning_point_feature_ids: ['f99'] }));
  assert.ok(has(r.errors, /selection_story\.opening must be one of skepticism/));
  assert.ok(has(r.errors, /selection_story\.why_selected is empty/));
  assert.ok(has(r.errors, /selection_story → unknown feature "f99"/));
});

test('the product name appears only from the turning point on', () => {
  const r = run((d) => (block(d.gempageHe, 'founder_story').parts[0].text = `ה${d.input.hebrew_product_name} היה נראה לי רגיל`));
  assert.ok(has(r.warnings, /appears before the turning point/));
});

test('sale_reason is optional: without it the offer is an introductory price, never an invented reason', () => {
  const r = run(noReason);
  assert.ok(!has(r.errors, /sale_reason|reason for the offer/));
  const claimed = run((d) => {
    noReason(d);
    d.angle.selection_story.offer_framing = 'supplied_sale_reason';
  });
  assert.ok(has(claimed.errors, /offer_framing is "supplied_sale_reason" but input\.sale_reason is empty/));
});

test('invented discount reasons are errors in copy, angle, creatives and UGC', () => {
  const cases = [
    ['03-gempage-copy.he.json', (d) => block(d.gempageHe, 'sale').paragraphs.push('זה מבצע סוף העונה שלנו.'), /end of season/],
    ['03-gempage-copy.en.json', (d) => block(d.gempageEn, 'sale').paragraphs.push('It is our end-of-season sale.'), /end of season/],
    ['03-gempage-copy.he.json', (d) => block(d.gempageHe, 'sale').paragraphs.push('מלאי מוגבל, כדאי למהר.'), /limited stock/],
    ['03-gempage-copy.en.json', (d) => (block(d.gempageEn, 'sale').availability_note = 'Only the first batch is at this price.'), /first batch/],
    ['03-gempage-copy.he.json', (d) => block(d.gempageHe, 'sale').paragraphs.push('מכירת חיסול לפני שהבוטיק מתחדש.'), /clearance/],
    ['03-gempage-copy.en.json', (d) => block(d.gempageEn, 'sale').paragraphs.push('We have excess inventory to move.'), /overstock/],
    ['02-central-angle', (d) => (d.angle.why_now = 'Clearance before the new collection.'), /clearance/],
    ['07-creative-plan', (d) => (d.creatives.creatives[3].overlay_text_he = 'הזדמנות אחרונה במחיר הזה'), /scarcity/],
  ];
  for (const [where, mutate, what] of cases) {
    const r = run((d) => {
      noReason(d);
      mutate(d);
    });
    assert.ok(r.errors.some((e) => e.startsWith(where) && what.test(e) && /not in input\.sale_reason/.test(e)), `${where} ${what}`);
  }
});

test('a supplied sale_reason may be used; the fixed CTA is not a stock claim', () => {
  const r = run((d) => {
    d.input.sale_reason = 'מבצע סוף העונה';
    d.facts.sale_reason = 'מבצע סוף העונה';
    block(d.gempageHe, 'sale').paragraphs.push('זה מבצע סוף העונה שלנו.');
    block(d.gempageEn, 'sale').paragraphs.push('It is our end-of-season sale.');
    block(d.gempageHe, 'sale').paragraphs.push('בדקי אם המידה שלך עדיין במלאי');
  });
  assert.ok(!has(r.errors, /reason for the offer/));
});
