// Casting rules for generated photos (brand/image-rules.md → Casting): attractive, well-groomed Israeli women of about
// 45–58, ages varied across the page, never styled old. Prompts under the previous rules only warn.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setProductsDir } from '../scripts/lib.js';
import { validateProduct } from '../scripts/validate.js';
import { writeDemo } from './fixture.js';

const RULES = fs.readFileSync(new URL('../brand/image-rules.md', import.meta.url), 'utf8');
const line = (start) => RULES.split('\n').find((l) => l.startsWith(start));
const CASTING = line('Casting: a Jewish Israeli woman');
const STYLE = line('Photo style: a natural, flattering lifestyle photo');
const LEGACY_STYLE = 'Photo style: an ordinary candid photo taken on a smartphone, soft daylight.';

const prompt = (age, extra = '', style = STYLE) =>
  `Create a realistic, flattering lifestyle photograph of a stylish Israeli woman approximately ${age} years old wearing the top. ${extra} ` +
  `${CASTING.replace('[45–58]', String(age))} ${style} No text in image. Consistent with the reference images.`;

let dir;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adina-casting-'));
  setProductsDir(dir);
});

// Person prompts for the first images, one age each.
const withAges = (ages, make = (a) => prompt(a)) => (d) =>
  ages.forEach((a, k) => Object.assign(d.prompts.prompts[k], { prompt: make(a, k), fields: { ...d.prompts.prompts[k].fields, age: String(a) } }));
const run = (mutate) => validateProduct(writeDemo(dir, mutate));
const casting = (msgs) => msgs.filter((m) => /^0[57]-(image-prompts|creative-plan)/.test(m));

test('the brand rules carry the new casting and style sentences', () => {
  assert.ok(CASTING?.includes('aged about [45–58]') && CASTING.includes('youthful and aspirational'));
  assert.ok(STYLE?.includes('age-appropriate features') && STYLE.includes('no airbrushed or plastic skin'));
  assert.doesNotMatch(RULES, /40–60/);
});

test('a prompt set under the new rules passes cleanly', () => {
  const r = run(withAges([47, 53, 57]));
  assert.deepEqual(casting(r.errors), []);
  assert.deepEqual(casting(r.warnings), []);
});

test('ages outside 45–60 are errors', () => {
  const r = run(withAges([44, 53, 62]));
  assert.ok(r.errors.some((e) => /IMG-01: age 44 is outside 45–60/.test(e)));
  assert.ok(r.errors.some((e) => /IMG-03: age 62 is outside 45–60/.test(e)));
});

test('old or unflattering styling words are errors; negated ones are fine', () => {
  for (const bad of ['She has silver hair in a bun.', 'An elderly woman, frail and smiling.', 'Grandmother look, deep wrinkles.', 'Flawless skin, airbrushed.']) {
    const r = run(withAges([47, 53, 57], (a, k) => prompt(a, k === 0 ? bad : '')));
    assert.ok(r.errors.some((e) => /IMG-01: ".+" styles the model old or unflattering/.test(e)), bad);
  }
  const ok = run(withAges([47, 53, 57], (a, k) => prompt(a, k === 0 ? 'No grey hair, without a grandmother look.' : '')));
  assert.deepEqual(casting(ok.errors), []);
});

test('missing style line is an error; the previous style line is only a warning (existing products keep validating)', () => {
  const none = run(withAges([47, 53, 57], (a, k) => (k === 0 ? prompt(a).replace(STYLE, '') : prompt(a))));
  assert.ok(none.errors.some((e) => /IMG-01: prompt misses the photo-style line/.test(e)));
  const legacy = run(withAges([44, 44, 44], (a) => prompt(a, '', LEGACY_STYLE)));
  assert.deepEqual(casting(legacy.errors), []);
  assert.ok(legacy.warnings.some((w) => /IMG-01: prompt uses the old casting rules/.test(w)));
});

test('all ages within 5 years is a variation warning', () => {
  const r = run(withAges([50, 52, 54]));
  assert.ok(r.warnings.some((w) => /all model ages lie within 5 years \(50, 52, 54\)/.test(w)));
});
