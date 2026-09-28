// RTL guards for the Hebrew founder-letter page.
// Static checks always run. The render checks (Chromium via Playwright, desktop + mobile) run when Playwright is
// installed and are skipped otherwise (CI without a browser); `node scripts/rtl-audit.js <slug>` runs the same audit.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { setProductsDir, loadProduct } from '../scripts/lib.js';
import { renderGpHtml, buildGempages, LETTER_CSS_TEMPLATE } from '../scripts/gempages.js';
import { runRtlAudit } from '../scripts/rtl-audit.js';
import { writeDemo } from './fixture.js';

let dir;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adina-rtl-'));
  setProductsDir(dir);
});
const demo = () => {
  const p = loadProduct(writeDemo(dir));
  return { p, html: renderGpHtml(p.gempage.he, { plan: p.plan, input: p.input }).html, css: LETTER_CSS_TEMPLATE() };
};

// Minimal unzip for the .gempages file (deflate-raw entries, as written by scripts/gempages.js).
const unzip = (buf) => {
  const out = {};
  for (let o = 0; buf.readUInt32LE(o) === 0x04034b50; ) {
    const n = buf.readUInt16LE(o + 26), x = buf.readUInt16LE(o + 28), size = buf.readUInt32LE(o + 18);
    const name = buf.subarray(o + 30, o + 30 + n).toString();
    out[name] = zlib.inflateRawSync(buf.subarray(o + 30 + n + x, o + 30 + n + x + size));
    o += 30 + n + x + size;
  }
  return out;
};

test('RTL static: the page has its own RTL root (.gp-page, dir="rtl", lang="he")', () => {
  const { html } = demo();
  assert.match(html, /^<div class="gp-page" [^>]*dir="rtl" lang="he">/);
});

test('RTL static: direction + alignment are set on .gp-page, not only on the GemPages element', () => {
  const { css } = demo();
  assert.match(css, /\.\{\{rootClassName\}\} \.gp-page\{direction:rtl;text-align:right;/);
  // direction-sensitive components carry their own RTL
  for (const sel of ['.gp-feature .gp-fh', '.gp-cmp3', '.gp-stats-row', '.gp-prices', 'a.gp-buy', '.gp-about-box'])
    assert.ok(new RegExp(`\\.\\{\\{rootClassName\\}\\} ${sel.replace(/[.*]/g, '\\$&')}(?:[^{}]|\\{\\{rootClassName\\}\\})*\\{[^}]*direction:rtl`).test(css), `${sel} has no own direction:rtl`);
});

test('RTL static: no left alignment and no LTR direction outside isolated runs', () => {
  const css = demo().css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(css, /text-align:\s*left/);
  for (const m of css.matchAll(/([^{}]+)\{[^}]*direction:\s*ltr[^}]*\}/g)) {
    const selectors = m[1].split(',').map((s) => s.trim().replace('.{{rootClassName}} ', ''));
    for (const s of selectors) assert.ok(['.gp-ltr', '.gp-brand', '.gp-fnum'].includes(s), `direction:ltr on ${s}`);
  }
});

test('RTL static: the uploaded Custom Code element is aligned right (GemPages --ta)', () => {
  const { p } = demo();
  const r = buildGempages(p);
  const page = JSON.parse(unzip(unzip(r.file)[`1_${r.pageId}.zip`])[`1_${r.pageId}.json`].toString().replace(/:(\d{16,})/g, ':"$1"'));
  const code = JSON.parse(page.pageSections[0].component).childrens[0].childrens[0];
  assert.deepEqual(code.settings.align, { desktop: 'right' });
  assert.match(code.advanced.editorData.html, /^<div class="gp-page"/);
});

const audit = await runRtlAudit({ html: '<div class="gp-page" dir="rtl"><div class="gp-card">א</div></div>', css: '' });
const noBrowser = audit.skipped ? `render checks skipped: ${audit.skipped}` : false;

test('RTL render: the whole page is RTL on desktop and mobile inside a GemPages-like LTR host', { skip: noBrowser }, async () => {
  const { html, css } = demo();
  const r = await runRtlAudit({ html, css });
  assert.deepEqual(r, { desktop: [], mobile: [] });
});

test('RTL render: the audit catches the old layout (alignment inherited from the GemPages element)', { skip: noBrowser }, async () => {
  const { html, css } = demo();
  // the CSS/HTML before the fix: no .gp-page root, no per-component RTL
  const oldCss = css.replace(/\.\{\{rootClassName\}\} \.gp-page\{[^}]*\}\n/, '').replace(/\/\* ---- RTL per component[\s\S]*$/, '');
  const oldHtml = html.replace('<div class="gp-page" ', '<div ');
  const r = await runRtlAudit({ html: oldHtml, css: oldCss });
  const all = [...r.desktop, ...r.mobile];
  assert.ok(all.some((i) => /strong .*אודות הכותבת.* aligned left/.test(i)), all.join('\n'));
});
