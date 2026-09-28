// Guards for the Hebrew copy standard (brand/hebrew-copy.md): naturalness signals and the step-6c gate before upload.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setProductsDir, loadProduct } from '../scripts/lib.js';
import { checkHebrew, repetitionIssues } from '../scripts/spellcheck.js';
import { validateProduct } from '../scripts/validate.js';
import { writeDemo } from './fixture.js';

const phrasing = (t) => checkHebrew(t).filter((i) => i.rule === 'phrasing');

let dir;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adina-he-'));
  setProductsDir(dir);
});

test('naturalness: translated / AI phrasing is flagged as a warning, with advice', () => {
  const w = phrasing('נוחה או מסודרת? למה לא שתיהן.');
  assert.ok(w.some((i) => /why not both/.test(i.message)));
  assert.ok(w.some((i) => /מסודרת.*נראית טוב/.test(i.message)), 'מסודרת is not a universal word for stylish');
  assert.ok(w.some((i) => /retorische keuzevraag/.test(i.message)));
  assert.ok(w.every((i) => i.level === 'warning'));
  for (const [t, p] of [['החולצה הזו הינה פתרון עבורך.', ['הינה', 'פתרון', 'עבורך']], ['ניתן לכבס במכונה', ['ניתן ל']], ['זה משנה משחק', ['משנה משחק']]])
    for (const x of p) assert.ok(phrasing(t).some((i) => i.text === x), `${t} → ${x}`);
});

test('naturalness: natural Israeli copy is not flagged', () => {
  for (const t of [
    'למה לבחור בין נוחות לסטייל כשאפשר לקבל את שניהם?',
    'גם ביום הכי חם, את נשארת רעננה.',
    'מחמיא, בלי להיצמד לגוף.',
    'אפשר ללבוש אותה ליום־יום, לעבודה ולארוחה משפחתית.',
    'שלום, אני עדינה.',
  ])
    assert.deepEqual(phrasing(t), [], t);
});

test('naturalness: repetitive structure (same opening, all questions, overused words) is flagged', () => {
  const slug = writeDemo(dir, (d) => {
    const b = d.gempageHe.blocks.find((x) => x.type === 'benefits');
    b.items.forEach((it, i) => (it.headline = ['כי חם בחוץ?', 'כי היום ארוך?', 'כי את עסוקה?', 'נוח ונעים.', 'יפה על הגוף.', 'קליל ללבוש.'][i % 6]));
    d.gempageHe.blocks.find((x) => x.type === 'founder_story').parts.forEach((x) => (x.text = 'ממש ' + x.text + ' ממש'));
  });
  const msgs = repetitionIssues(loadProduct(slug)).map((i) => i.message);
  assert.ok(msgs.some((m) => /voordeel-koppen beginnen met "כי"/.test(m)), msgs.join('\n'));
  assert.ok(msgs.some((m) => /3\+ voordeel-koppen zijn een vraag/.test(m)));
  assert.ok(msgs.some((m) => /"ממש" \d+× op de pagina/.test(m)));
});

test('step 6c gate: without a naturalness pass the upload stage fails, earlier stages only warn', () => {
  const slug = writeDemo(dir);
  fs.rmSync(path.join(dir, slug, '03-gempage-naturalness.json'));
  const normal = validateProduct(slug);
  assert.ok(normal.warnings.some((w) => /naturalness pass \(step 6c\)/.test(w)));
  assert.ok(!normal.errors.some((e) => /naturalness/.test(e)));
  assert.ok(validateProduct(slug, { stage: 'upload' }).errors.some((e) => /naturalness pass \(step 6c\)/.test(e)));
});

test('step 6c gate: Hebrew changed after the naturalness pass blocks the upload', () => {
  const slug = writeDemo(dir);
  const he = path.join(dir, slug, '03-gempage-copy.he.json');
  const later = new Date(Date.now() + 60_000);
  fs.utimesSync(he, later, later);
  assert.ok(validateProduct(slug, { stage: 'upload' }).errors.some((e) => /naturalness\.json is older than 03-gempage-copy\.he\.json/.test(e)));
});

test('step 6c: a fresh pass passes the gate; its doubts become flags', () => {
  const slug = writeDemo(dir);
  const f = path.join(dir, slug, '03-gempage-naturalness.json');
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  j.doubts = [{ text: 'בדקי אם המידה שלך עדיין במלאי', question: 'vaste CTA uit config klinkt stijf — aanpassen?' }];
  fs.writeFileSync(f, JSON.stringify(j));
  const r = validateProduct(slug, { stage: 'upload' });
  assert.ok(!r.errors.some((e) => /naturalness/.test(e)), r.errors.join('\n'));
  assert.ok(r.flags.some((x) => /^HEBREW DOUBT — בדקי אם המידה/.test(x)));
});

test('naturalness: literal customer reviews get no phrasing advice (they are never rewritten)', async () => {
  const { spellcheckProduct } = await import('../scripts/spellcheck.js');
  const slug = writeDemo(dir, (d) => {
    const b = d.gempageHe.blocks.find((x) => x.type === 'benefits');
    b.items[0].review = { testimonial_id: 't1', text: 'נראית מסודרת כל היום' };
    b.items[1].headline = 'נוחה או מסודרת? למה לא שתיהן.';
  });
  const w = spellcheckProduct(loadProduct(slug)).issues.filter((i) => i.rule === 'phrasing');
  assert.ok(!w.some((i) => /review/.test(i.at)), 'review flagged');
  assert.ok(w.some((i) => i.at === 'benefits.items[1].headline'));
});
