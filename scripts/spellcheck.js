#!/usr/bin/env node
// Hebrew spelling & typography check for everything the customer sees: the GemPage (03-gempage-copy.he.json),
// the creative overlay texts and the UGC voice-over.
// Mechanical rules (final letters, glued Latin, doubled words, niqqud, spacing, known misspellings from
// brand/hebrew-spelling.json) plus naturalness signals (translated/AI phrasing, repetitive structure) as warnings.
// Grammar is proofread by Claude in step 6b (03-gempage-spellcheck.json), naturalness in step 6c (03-gempage-naturalness.json).
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
  return {
    misspellings: j.misspellings ?? {},
    masculine: j.masculine ?? {},
    reduplications: new Set(j.reduplications ?? []),
    phrasing: j.phrasing ?? {},
    overused: j.overused ?? [],
  };
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

  // Naturalness (brand/hebrew-copy.md): translated or AI-like phrasing. Warnings — step 6c rewrites or keeps them.
  for (const [phrase, advice] of Object.entries(list.phrasing ?? {})) {
    const open = phrase.endsWith(' ל') ? '' : '(?![א-ת])'; // "ניתן ל" is followed by the verb
    if (new RegExp(`(?<![א-ת])[${PREFIXES}]{0,2}${phrase}${open}`).test(s)) add('warning', 'phrasing', phrase, `natuurlijkheid: "${phrase}" — ${advice}`);
  }
  if (/(?<![א-ת])[א-ת]+ או [א-ת]+\?/.test(s)) add('warning', 'phrasing', '', 'natuurlijkheid: retorische keuzevraag ("X או Y?") klinkt vaak vertaald — schrijf de gedachte zoals een vrouw hem zou zeggen');
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
  // Reviews and quotes are the customer's own words (kept literally), so they get no naturalness advice.
  const customerWords = /\.review\.text$|quotes\[\d+\]\.text$/;
  for (const { file, at, text } of all)
    for (const i of checkHebrew(text, list)) if (!(i.rule === 'phrasing' && customerWords.test(at))) issues.push({ ...i, file, at });
  // Spelling variants mixed within one product (Academy spelling: הכול, מאוד).
  const joined = all.map((x) => x.text).join(' ');
  for (const [a, b] of [['הכל', 'הכול'], ['מאד', 'מאוד']])
    if (new RegExp(`(^|[^א-ת])[${PREFIXES}]?${a}([^א-ת]|$)`).test(joined) && joined.includes(b))
      issues.push({ level: 'warning', rule: 'consistency', text: a, file: '*', at: '', message: `zowel "${a}" als "${b}" gebruikt — kies één spelling (${b})` });
  issues.push(...repetitionIssues(p, all, list));
  return { checked: all.length, issues };
}

// Naturalness at page level: the same sentence shape over and over reads as AI-written (brand/hebrew-copy.md).
export function repetitionIssues(p, all = hebrewStrings(p), list = loadSpellingList()) {
  const issues = [];
  const add = (at, message) => issues.push({ level: 'warning', rule: 'repetition', text: '', file: '03-gempage-copy.he.json', at, message });
  const first = (t) => String(t ?? '').trim().split(/[\s,.:;!?—]+/)[0];
  const blocks = Object.fromEntries((p.gempage?.he?.blocks ?? []).map((b) => [b.type, b]));
  const heads = (blocks.benefits?.items ?? []).map((i) => i.headline).filter(Boolean);
  const same = (arr, key) => {
    const c = {};
    arr.forEach((x) => (c[key(x)] = (c[key(x)] ?? 0) + 1));
    return Object.entries(c).filter(([k, n]) => k && n >= 3);
  };
  for (const [w, n] of same(heads, first)) add('benefits.items[].headline', `natuurlijkheid: ${n} voordeel-koppen beginnen met "${w}" — varieer de bouw`);
  if (heads.length >= 3 && heads.filter((h) => /\?\s*$/.test(h)).length >= 3) add('benefits.items[].headline', 'natuurlijkheid: 3+ voordeel-koppen zijn een vraag — varieer de bouw');
  const parts = (blocks.founder_story?.parts ?? []).map((x) => x.text).filter(Boolean);
  for (const [w, n] of same(parts, first)) add('founder_story.parts[]', `natuurlijkheid: ${n} alinea's beginnen met "${w}" — varieer de opening`);
  const text = all.filter((x) => x.file === '03-gempage-copy.he.json').map((x) => x.text).join(' ');
  for (const w of list.overused ?? []) {
    const n = (text.match(new RegExp(`(?<![א-ת])[${PREFIXES}]?${w}(?![א-ת])`, 'g')) ?? []).length;
    if (n > 2) add('*', `natuurlijkheid: "${w}" ${n}× op de pagina — hooguit 2×`);
  }
  return issues;
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
