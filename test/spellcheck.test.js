import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkHebrew } from '../scripts/spellcheck.js';

const rules = (t) => checkHebrew(t).map((i) => i.rule);

test('spellcheck: clean Hebrew passes', () => {
  for (const t of ['שלום, אני עדינה.', 'פאיו | טופ יום נעים', 'מידות S עד 3XL · 10 ס״מ', 'עכשיו ב־₪179', 'צ׳יפס', 'לאט לאט'])
    assert.deepEqual(rules(t), [], t);
});

test('spellcheck: catches final letters, glued Latin, doubled words, misspellings', () => {
  assert.ok(rules('שלומ לכם').includes('final-letter'));
  assert.ok(rules('הכםל טוב').includes('final-letter'));
  assert.ok(rules('שלחוadina').includes('mixed-script'));
  assert.ok(rules('זה זה טוב').includes('doubled-word'));
  assert.ok(rules('ובמצויין').includes('misspelling'));
  assert.ok(checkHebrew('זה מצויין').some((i) => i.message.includes('מצוין')));
});

test('spellcheck: style warnings (maqaf, niqqud, spacing, masculine address)', () => {
  assert.ok(rules('יותר מ-15 שנה').includes('maqaf'));
  assert.ok(rules('שָלוֹם').includes('niqqud'));
  assert.ok(rules('נוחה ,יפה').includes('spacing'));
  assert.ok(rules('אתה תרגיש טוב').includes('masculine'));
  assert.ok(checkHebrew('יפה!!').every((i) => i.level === 'warning'));
});
