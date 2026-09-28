#!/usr/bin/env node
// RTL audit of the rendered founder-letter page, desktop (1280) and mobile (390), in Chromium (Playwright).
// Checks the approved Adina RTL layout per component, not just `direction`:
//   every Hebrew text element rtl and right/centre aligned · numbered sections: number right of the title ·
//   comparison table: row labels in the rightmost column · stats: first stat top right · prices: sale price right of
//   the struck old price · product facts: check icon on the right · CTAs: the arrow (←) at the left end · no sideways overflow.
//
// Usage: node scripts/rtl-audit.js <slug>                 the generated page inside a hostile GemPages-like host
//        node scripts/rtl-audit.js <slug> --url <preview>  the real GemPages preview after upload (step 11)
// Exit 0 = no issues · 1 = issues (listed) · 2 = page could not be rendered · 3 = Playwright/Chromium not available (skipped, not a pass).
import { execSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadProduct, parseArgs } from './lib.js';
import { renderGpHtml, LETTER_CSS_TEMPLATE } from './gempages.js';

export const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900, isMobile: false },
  { name: 'mobile', width: 390, height: 844, isMobile: true },
];

// GemPages wraps a Custom Code element as <div class="<uid> gp-custom-code" style="…--ta:left…"> and styles it with
// `.gps.gpsi [style*="--ta:"]{text-align:var(--ta)}`. The host below reproduces that, on an LTR document, with the
// worst-case --ta:left, so the page must carry its own RTL.
export function hostileHost(html, css, rootClass = 'gpRtlAudit') {
  return `<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;direction:ltr;text-align:left}.gps.gpsi [style*="--ta:"]{text-align:var(--ta)}</style>
<style>${css.replaceAll('{{rootClassName}}', rootClass)}</style></head>
<body class="gps gpsi"><div class="${rootClass} gp-custom-code" style="--ta:left">${html}</div></body></html>`;
}

// Runs inside the page. Returns a list of human-readable issues.
export function auditInPage() {
  const issues = [];
  const page = document.querySelector('.gp-page') ?? document.querySelector('.gp-card')?.parentElement;
  if (!page) return ['no founder-letter page (.gp-page / .gp-card) found'];
  const name = (e) => e.tagName.toLowerCase() + (e.classList.length ? '.' + [...e.classList].join('.') : '');
  const snip = (e) => (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  const cs = (e, p) => getComputedStyle(e, p);
  const HE = /[֐-׿]/;
  const isolated = (e) => e.closest('.gp-ltr, .gp-brand');

  const pcs = cs(page);
  if (pcs.direction !== 'rtl') issues.push(`page root ${name(page)} is ${pcs.direction}, not rtl`);
  if (pcs.textAlign !== 'right' && pcs.textAlign !== 'start') issues.push(`page root ${name(page)} text-align is ${pcs.textAlign}`);

  // 1. every element that holds Hebrew text itself: rtl, aligned right or centred (never left/end)
  for (const e of page.querySelectorAll('*')) {
    if (isolated(e)) continue;
    const own = [...e.childNodes].some((n) => n.nodeType === 3 && HE.test(n.textContent));
    if (!own) continue;
    const s = cs(e);
    if (s.direction !== 'rtl') issues.push(`${name(e)} "${snip(e)}" direction ${s.direction}`);
    const block = s.display === 'inline' ? e.parentElement : e;
    const a = cs(block).textAlign;
    if (!['right', 'center', 'start', '-webkit-right', '-webkit-center'].includes(a)) issues.push(`${name(e)} "${snip(e)}" aligned ${a} (via ${name(block)})`);
  }
  // 2. numbered sections: the number circle on the right of the title
  for (const fh of page.querySelectorAll('.gp-fh')) {
    const n = fh.querySelector('.gp-fnum'), t = fh.querySelector('h3');
    if (n && t && !(n.getBoundingClientRect().right > t.getBoundingClientRect().right)) issues.push(`numbered section "${snip(t)}": number is not right of the title`);
  }
  // 3. comparison table: first column (labels) rightmost, product column leftmost
  for (const tr of page.querySelectorAll('.gp-cmp3 tr')) {
    const c = tr.children;
    if (c.length > 1 && !(c[0].getBoundingClientRect().left > c[c.length - 1].getBoundingClientRect().left)) issues.push(`comparison row "${snip(c[0])}": first column is not on the right`);
  }
  for (const row of page.querySelectorAll('.gp-cmp-row')) {
    const c = row.children;
    if (c.length > 1 && c[0].getBoundingClientRect().top === c[1].getBoundingClientRect().top && !(c[0].getBoundingClientRect().left > c[1].getBoundingClientRect().left)) issues.push('comparison cards: first card is not on the right');
  }
  // 4. stats: the first stat is on the right of the second (same row)
  for (const row of page.querySelectorAll('.gp-stats-row')) {
    const [a, b] = row.children;
    if (a && b && Math.abs(a.getBoundingClientRect().top - b.getBoundingClientRect().top) < 2 && !(a.getBoundingClientRect().left > b.getBoundingClientRect().left)) issues.push('stats: first stat is not on the right');
  }
  // 5. prices (approved Adina layout): the sale price on the right, the struck regular price to its left
  for (const pr of page.querySelectorAll('.gp-prices, .gp-sale-prices')) {
    const o = pr.querySelector('.gp-old'), n = pr.querySelector('.gp-new');
    if (o && n && !(n.getBoundingClientRect().left > o.getBoundingClientRect().left)) issues.push('prices: sale price is not right of the old price');
  }
  // 6. product facts: check icon on the right side of the text
  for (const li of page.querySelectorAll('.gp-product-box ul.gp-facts li')) {
    const b = cs(li, '::before');
    if (b.content === 'none' || b.right !== '0px' || !(parseFloat(cs(li).paddingRight) > parseFloat(cs(li).paddingLeft))) issues.push(`fact "${snip(li)}": check icon is not on the right`);
  }
  // 7. CTAs: the arrow at the left end of the button text
  for (const a of page.querySelectorAll('a.gp-buy, .gp-sticky-bar a')) {
    const walker = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
    let arrow = null, first = null;
    for (let n; (n = walker.nextNode()); ) {
      if (!first && HE.test(n.textContent)) first = n;
      const i = n.textContent.indexOf('←');
      if (i >= 0) arrow = [n, i];
    }
    if (arrow && first) {
      const r1 = document.createRange(); r1.setStart(arrow[0], arrow[1]); r1.setEnd(arrow[0], arrow[1] + 1);
      const r2 = document.createRange(); r2.setStart(first, 0); r2.setEnd(first, 1);
      if (!(r1.getBoundingClientRect().left < r2.getBoundingClientRect().left)) issues.push(`CTA "${snip(a)}": arrow is not at the left end`);
    }
  }
  // 8. the page itself does not scroll sideways
  if (page.scrollWidth > page.clientWidth + 1) issues.push(`page content is wider than the page (${page.scrollWidth} > ${page.clientWidth})`);
  return [...new Set(issues)];
}

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {}
  try {
    const root = execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    return await import(pathToFileURL(path.join(root, 'playwright', 'index.mjs')).href);
  } catch {
    return null;
  }
}

async function fetchDocument(url) {
  for (const wait of [0, 5000, 15000, 30000]) {
    if (wait) await new Promise((r) => setTimeout(r, wait));
    const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (adina-rtl-audit)' } });
    if (res.ok) return res.text();
    if (res.status !== 429 && res.status < 500) throw new Error(`GET ${url} → HTTP ${res.status}`);
  }
  throw new Error(`GET ${url} → still rate-limited (429) after retries`);
}

// { html, css } → audit the page in the hostile host; { url } → audit that URL as served.
export async function runRtlAudit({ html, css, url }) {
  const pw = await loadPlaywright();
  if (!pw) return { skipped: 'Playwright is not installed (npm i -g playwright, with Chromium)' };
  const browser = await pw.chromium.launch();
  const result = {};
  let document = null;
  try {
    for (const vp of VIEWPORTS) {
      // --url is a read-only render; cloud sessions reach the store through a TLS-inspecting proxy Chromium does not trust.
      const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, ignoreHTTPSErrors: !!url });
      const p = await ctx.newPage();
      if (url) {
        // The document comes from Node (it handles the session proxy and Shopify's 429s); Chromium then loads the
        // page's own CSS/JS as a browser would.
        document ??= await fetchDocument(url);
        await p.route((u) => u.href === url, (r) => r.fulfill({ body: document, contentType: 'text/html; charset=utf-8' }));
        await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await p.waitForLoadState('load', { timeout: 30000 }).catch(() => {});
        await p.waitForTimeout(1500);
      }
      else await p.setContent(hostileHost(html, css), { waitUntil: 'load' });
      result[vp.name] = await p.evaluate(auditInPage);
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const a = parseArgs(process.argv.slice(2));
  const slug = a._[0];
  if (!slug && !a.url) {
    console.error('Usage: node scripts/rtl-audit.js <slug> [--url <preview url>]');
    process.exit(1);
  }
  let input = { url: typeof a.url === 'string' ? a.url : undefined };
  if (!input.url) {
    const p = loadProduct(slug);
    if (!p.gempage.he) {
      console.error('✗ 03-gempage-copy.he.json is required');
      process.exit(1);
    }
    input = { html: renderGpHtml(p.gempage.he, { plan: p.plan, input: p.input }).html, css: LETTER_CSS_TEMPLATE() };
  }
  let r;
  try {
    r = await runRtlAudit(input);
  } catch (e) {
    console.log(`✗ RTL AUDIT FAILED — could not render the page: ${e.message.split('\n')[0]}`);
    process.exit(2);
  }
  if (r.skipped) {
    console.log(`RTL AUDIT SKIPPED — ${r.skipped}`);
    process.exit(3);
  }
  let n = 0;
  for (const [vp, issues] of Object.entries(r)) {
    n += issues.length;
    console.log(`${issues.length ? '✗' : '✓'} RTL ${vp}: ${issues.length} issue(s)`);
    issues.forEach((i) => console.log(`   - ${i}`));
  }
  process.exit(n ? 1 : 0);
}
