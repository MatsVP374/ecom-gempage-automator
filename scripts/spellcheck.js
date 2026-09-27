#!/usr/bin/env node
// Hebrew spelling & typography check for everything the customer sees: the GemPage (03-gempage-copy.he.json),
// the creative overlay texts and the UGC voice-over.
// Mechanical rules only (final letters, glued Latin, doubled words, niqqud, spacing, known misspellings from
// brand/hebrew-spelling.json). Grammar and wording are proofread by Claude in step 6b (03-gempage-spellcheck.json).
// Usage: node scripts/spellcheck.js <slug> [--json]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, loadProduct, parseArgs } from './lib.js';

const LETTER = 'א-ת';
const PREFIXES = 'והבלמשכ';
const IS_WORD = new RegExp(`^[${LETTER}]+$`);

export function loadSpellingList() {
  const f = path.join(ROOT, 'brand', 'hebrew-spelling.json');
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  return { misspellings: j.misspellings ?? {}, masculine: j.masculine ?? {}, reduplications: new Set(j.reduplications ?? []) };
}

// Strip up to 3 one-letter prefixes (ו/ה/ב/ל/מ/ש/כ) and return every candidate stem, longest first.
function stems(word) {
  const out = [word];
  for (let i = 0; i < 3 && i < word.length - 2 && PREFIXES.includes(word[i]); i++) out.push(word.slice(i + 1));
  return out;
}

// → [{ level: 'error'|'warning', rule, text, message }]
export function checkHebrew(text, list = loadSpellingList()) {
  const issues = [];
  const add = (level, rule, found, message) => issues.push({ level, rule, text: found, message });
  const s = String(text ?? '');
  if (!/[א-ת]/.test(s)) return issues;

  // A plain פ at the end is fine: loanwords like טופ keep the /p/ sound.
  // Tokens: Hebrew words incl. internal geresh/gershayim (ס״מ, צ'יפס), keeping what follows them.
  for (const m of s.matchAll(new RegExp(`[${LETTER}]+(?:["'״׳][${LETTER}]+)*`, 'g'))) {
    const w = m[0];
    const next = s[m.index + w.length] ?? '';
    const plain = w.replace(/["'״׳]/g, '');
    if (/[ךםןףץ](?=[א-ת])/.test(w.replace(/["'״׳]/g, '·'))) add('error', 'final-letter', w, `sluitletter (ך ם ן ף ץ) midden in het woord: "${w}"`);
    const acronym = /["״]/.test(w);
    if (plain.length > 1 && !acronym && /[כמנצ]$/.test(w) && !/['׳־-]/.test(next))
      add('error', 'final-letter', w, `woord eindigt op een gewone letter in plaats van een sluitletter: "${w}"`);
    if (IS_WORD.test(w)) {
      for (const st of stems(w)) {
        if (list.misspellings[st]) {
          add('error', 'misspelling', w, `spelfout: "${w}" → "${w.slice(0, w.length - st.length)}${list.misspellings[st]}"`);
          break;
        }
      }
      if (list.masculine[w]) add('warning', 'masculine', w, `mannelijke vorm "${w}" — spreekt dit de lezer aan, schrijf dan "${list.masculine[w]}"`);
    }
  }
  // Multi-word entries in the misspelling list.
  for (const [bad, good] of Object.entries(list.misspellings)) if (bad.includes(' ') && s.includes(bad)) add('error', 'misspelling', bad, `"${bad}" → "${good}"`);

  for (const m of s.matchAll(/[א-ת][A-Za-z]|[A-Za-z][א-ת]/g)) add('error', 'mixed-script', m[0], `Hebreeuws en Latijn aan elkaar geplakt: "${s.slice(Math.max(0, m.index - 6), m.index + 8)}"`);
  for (const m of s.matchAll(/(?<![א-ת])([א-ת]{2,})\s+\1(?![א-ת])/g))
    if (!list.reduplications.has(m[1])) add('error', 'doubled-word', m[0], `dubbel woord: "${m[0]}"`);
  if (/[\u05B0-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/.test(s)) add('warning', 'niqqud', '', 'nikud (klinkertekens) gebruikt — Adina schrijft zonder nikud');
  for (const m of s.matchAll(/(?<![א-ת])[והבלמשכ]-(?=[\d₪])/g)) add('warning', 'maqaf', m[0], `gebruik een maqaf: "${m[0][0]}־" in plaats van "${m[0]}"`);
  if (/ {2,}/.test(s)) add('warning', 'spacing', '', 'dubbele spatie');
  for (const m of s.matchAll(/[א-ת] [,.!?:;](?!\d)/g)) add('warning', 'spacing', m[0], `spatie vóór leesteken: "${m[0]}"`);
  for (const m of s.matchAll(/[א-ת][,!?;][א-ת]/g)) add('warning', 'spacing', m[0], `geen spatie na leesteken: "${m[0]}"`);
  if (/[!?]{2,}|!{2,}/.test(s)) add('warning', 'punctuation', '', 'meerdere uitroep-/vraagtekens');
  if ((s.match(/\(/g) ?? []).length !== (s.match(/\)/g) ?? []).length) add('warning', 'punctuation', '', 'haakjes niet in paren');
  return issues;
}

// Every customer-facing Hebrew string of a product, with its location.
export function hebrewStrings(p) {
  const out = [];
  const skip = /(^|\.)(id|type|lang|dir|image|role|feature_ids|testimonial_id|angle|source|review_en|trace|claim|n|items_count)$|\.trace\[/;
  const walk = (file, o, at) => {
    if (typeof o === 'string') {
      if (!skip.test(at) && /[א-ת]/.test(o)) out.push({ file, at, text: o });
    } else if (Array.isArray(o)) o.forEach((v, i) => walk(file, v, `${at}[${i}]`));
    else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) walk(file, v, at ? `${at}.${k}` : k);
  };
  if (p.gempage?.he) p.gempage.he.blocks?.forEach((b) => walk('03-gempage-copy.he.json', b, b.id));
  (p.creatives?.creatives ?? []).forEach((c) => walk('07-creative-plan.json', c.overlay_text_he, `${c.id}.overlay_text_he`));
  (p.ugc?.script ?? []).forEach((l, i) => walk('08-ugc.json', l.voice_he, `script[${i}].voice_he`));
  return out;
}

export function spellcheckProduct(p) {
  const list = loadSpellingList();
  const issues = [];
  const all = hebrewStrings(p);
  for (const { file, at, text } of all) for (const i of checkHebrew(text, list)) issues.push({ ...i, file, at });
  // Spelling variants mixed within one product (Academy spelling: הכול, מאוד).
  const joined = all.map((x) => x.text).join(' ');
  for (const [a, b] of [['הכל', 'הכול'], ['מאד', 'מאוד']])
    if (new RegExp(`(^|[^א-ת])[${PREFIXES}]?${a}([^א-ת]|$)`).test(joined) && joined.includes(b))
      issues.push({ level: 'warning', rule: 'consistency', text: a, file: '*', at: '', message: `zowel "${a}" als "${b}" gebruikt — kies één spelling (${b})` });
  return { checked: all.length, issues };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = parseArgs(process.argv.slice(2));
  const slug = args._[0];
  if (!slug) {
    console.error('Usage: node scripts/spellcheck.js <slug> [--json]');
    process.exit(2);
  }
  const r = spellcheckProduct(loadProduct(slug));
  if (args.json) console.log(JSON.stringify(r, null, 2));
  else {
    const errors = r.issues.filter((i) => i.level === 'error');
    console.log(`${errors.length ? '✗' : '✓'} ${slug} — spelling: ${r.checked} Hebrew texts · ${errors.length} errors · ${r.issues.length - errors.length} warnings`);
    for (const i of r.issues) console.log(`  ${i.level === 'error' ? 'ERROR' : 'WARN '}  ${i.file} ${i.at}: ${i.message}`);
  }
  process.exit(r.issues.some((i) => i.level === 'error') ? 1 : 0);
}
