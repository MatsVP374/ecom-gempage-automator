#!/usr/bin/env node
// Build an importable GemPages file (.gempages) from 03-gempage-copy.he.json.
// Format (reverse-engineered from a GemPages "export_v2" file, see templates/gempage/skeleton.json):
//   <name>.gempages (zip) = manifest.json + pages_info.zip + 1_<pageId>.zip
//   1_<pageId>.zip holds 1_<pageId>.json: one page → one section → one "Custom Code" (CSSCode) element
//   whose advanced.editorData = { html, css }. section.checksum = sha256(section.component).
// The HTML/CSS is Adina's founder-letter design (templates/gempage/letter.css).
//
// Usage: node scripts/gempages.js <slug> [--allow-missing-images]
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { ROOT, loadProduct, loadConfig, parseArgs, esc } from './lib.js';

const TEMPLATE_DIR = path.join(ROOT, 'templates', 'gempage');
export const LETTER_CSS_TEMPLATE = () => fs.readFileSync(path.join(TEMPLATE_DIR, 'letter.css'), 'utf8');

// Escape, and isolate every left-to-right run inside RTL text so it cannot jump around:
// ₪179 · 179₪ · 15+ · 2,550+ · 4.7/5 · 25% · S–3XL · Adina Fashion (brand/hebrew-style.md → RTL).
const SIZE = '(?:XXXL|XXL|XL|XS|[2-6]XL|S|M|L)';
export const LTR_RUN = new RegExp(
  `(₪\\s?\\d+(?:[.,]\\d+)*|\\d+(?:[.,]\\d+)*\\s?₪|\\d+(?:[.,/]\\d+)*\\+|\\d+(?:\\.\\d+)?\\s?\\/\\s?\\d+|\\d+(?:\\.\\d+)?%|\\b${SIZE}\\s?[–-]\\s?${SIZE}\\b)`,
  'g',
);
const t = (s) =>
  esc(s)
    .replace(LTR_RUN, '<span class="gp-ltr">$1</span>')
    // A one-letter prefix with maqaf (ב־₪179, מ־15+) stays on the same line as its number.
    .replace(/([א-ת]־)(<span class="gp-ltr">[^<]*<\/span>)/g, '<span class="gp-nb">$1$2</span>')
    .replace(/Adina Fashion/g, '<span class="gp-brand">Adina Fashion</span>');
const brand = t;
const shekel = (n) => (n == null ? '' : `₪${n}`);

// Every GemPage photo is 4:5 portrait (brand/image-rules.md), so the page keeps one rhythm on mobile.
function img(id, ctx, { width = 640, height = 800, eager = false, alt = '' } = {}) {
  if (!id) return '';
  const p = ctx.planById[id];
  const url = p?.url || (p?.source === 'existing' && /^https?:\/\//.test(p.existing_image ?? '') ? p.existing_image : null);
  if (!url) {
    ctx.missingImages.push(id);
    return `<div class="gp-img-missing">📷 ${esc(id)}${p ? ` — ${esc(p.role)} · ${esc(p.purpose)}` : ''}</div>`;
  }
  return `<img src="${esc(url)}" alt="${esc(alt || p?.purpose || '')}" loading="${eager ? 'eager' : 'lazy'}"${eager ? ' fetchpriority="high"' : ''} width="${width}" height="${height}">`;
}

// A real customer review card. Name/age/stars come from input.testimonials, never from the copy:
// no name → "customer of Adina Fashion", no rating → no stars.
function reviewCard(r, ctx, lang) {
  if (!r?.text) return '';
  const tm = ctx.testimonials[r.testimonial_id];
  const who = tm?.name ? `${tm.name}${tm.age ? `, ${tm.age}` : ''}` : lang === 'he' ? 'לקוחה של Adina Fashion' : 'Adina Fashion customer';
  const stars = tm?.rating ? `<div class="gp-stars" aria-label="${tm.rating}/5">${'★'.repeat(tm.rating)}${'☆'.repeat(5 - tm.rating)}</div>` : '';
  return `<div class="gp-review-card gp-photo-review">${stars}<span class="gp-quote">”${t(r.text)}“</span><cite>— ${brand(who)}</cite></div>`;
}

// The routes to the real product page (brand/gempage-blueprint.md → Productroutes): product-box button + sticky bar.
// Texts are fixed in config/adina.json; {name} = short product name (before "|"), {price} = sale price.
export function productRoutes(page, input, cfg = loadConfig()) {
  const L = cfg.landing_page;
  const he = page.lang === 'he';
  const name = he ? String(input?.hebrew_product_name ?? '').split('|')[0].trim() : String(input?.product_name ?? '').trim();
  const colors = input?.colors ?? [];
  const many = colors.length > 1;
  // A no-break space keeps the arrow on the same line as the last word.
  const fill = (s) => s.replaceAll('{name}', name).replaceAll('{price}', String(input?.sale_price ?? '')).replace(/ ([←→])$/, '\u00a0$1');
  const list = (a) => (a.length > 1 ? `${a.slice(0, -1).join(', ')} ${he ? 'ו' : 'and '}${a.at(-1)}` : a.join(''));
  const sz = input?.sizes ?? [];
  const sizes = sz.length > 2 ? `${sz[0]}–${sz.at(-1)}` : sz.join(', ');
  return {
    url: /^https?:\/\//.test(input?.existing_product_page?.url ?? '') ? input.existing_product_page.url : null,
    box: fill(he ? (many ? L.cta_he : L.cta_no_color_he) : many ? 'Choose size and colour of {name} →' : 'Choose the size of {name} →'),
    sticky: fill(he ? (many ? L.sticky_cta_he : L.sticky_cta_no_color_he) : many ? '{name} now ₪{price} — choose size and colour' : '{name} now ₪{price} — choose your size'),
    facts: [
      colors.length ? list(colors) : null,
      sizes ? (he ? `מידות ${sizes}` : `Sizes ${sizes}`) : null,
      he ? 'משלוח חינם' : 'Free shipping',
      he ? `${cfg.trust.returns_days} יום להחזרה` : `${cfg.trust.returns_days} days to return`,
    ].filter(Boolean),
  };
}

// Renders the founder letter in the Adina GemPages markup (gp-* classes).
export function renderGpHtml(page, { plan = null, input = null } = {}) {
  const cfg = loadConfig();
  const ctx = { planById: Object.fromEntries((plan?.images ?? []).map((i) => [i.id, i])), missingImages: [], testimonials: Object.fromEntries((input?.testimonials ?? []).map((x) => [x.id, x])) };
  const by = Object.fromEntries((page.blocks ?? []).map((b) => [b.type, b]));
  const routes = productRoutes(page, input, cfg);
  const productUrl = routes.url || '#product';
  const out = [`<div aria-label="${esc(input?.product_name ?? 'Adina')} Founder Letter" dir="${esc(page.dir ?? 'rtl')}">`, '<div class="gp-card"><div class="gp-card-pad">'];
  const h = by.founder_header;
  if (h)
    out.push(
      `<div class="gp-top-byline"><div class="gp-who">${brand(h.byline)}</div><div class="gp-where">${t(h.place_date)}</div></div>`,
      `<div class="gp-green-banner">${t(h.note)}</div>`,
      `<div class="gp-badge-row"><span class="gp-badge">${t(h.badge)}</span></div>`,
    );
  if (by.headline)
    out.push(
      `<h1 class="gp-headline">${t(by.headline.headline)}</h1>`,
      `<p class="gp-subtitle">${t(by.headline.subtitle)}</p>`,
      '<hr class="gp-hr">',
      h ? `<p class="gp-byline2">${brand(`${cfg.founder.name_he} · ${h.byline.split('·').slice(1).join('·').trim() || cfg.brand} · ${h.place_date}`)}</p>` : '',
    );
  if (by.hero) out.push(`<div class="gp-hero-photo">${img(by.hero.image, ctx, { eager: true, alt: by.hero.alt })}</div>`);
  if (by.founder_story) {
    const g = String(by.founder_story.greeting ?? '');
    out.push('<div class="gp-letter gp-measure">');
    // Like the reference letter: the drop cap opens the first real paragraph (greeting + intro).
    const [first, ...rest] = by.founder_story.parts ?? [];
    const opening = [g, first?.text].filter(Boolean).join(' ');
    out.push(`<p class="gp-first"><span class="gp-dropcap">${esc(opening.slice(0, 1))}</span>${t(opening.slice(1))}</p>`);
    for (const p of rest) out.push(`<p>${t(p.text)}</p>`);
    out.push('</div>');
  }
  if (by.benefits) {
    out.push('<div class="gp-features-wrap">');
    if (by.benefits.title) out.push(`<div class="gp-measure"><h2 class="gp-section-title">${t(by.benefits.title)}</h2></div>`);
    for (const i of by.benefits.items ?? []) {
      out.push(`<div class="gp-feature gp-measure"><div class="gp-fh"><span class="gp-fnum">${esc(i.n)}</span><h3>${t(i.headline)}</h3></div><p>${t(i.text)}</p>${img(i.image, ctx, { alt: i.headline })}${reviewCard(i.review, ctx, page.lang)}</div>`);
    }
    out.push('</div>');
  }
  const c = by.comparison;
  const q = by.founder_quote;
  if (c || q) {
    out.push('<div class="gp-measure">');
    if (c) {
      const cols = c.columns ?? {};
      out.push(`<h2 class="gp-section-title">${t(c.title)}</h2>`);
      out.push(
        `<table class="gp-cmp3"><thead><tr><th></th><th>${t(cols.a)}</th><th>${t(cols.b)}</th><th class="gp-cmp3-us">${t(cols.product)}</th></tr></thead><tbody>${(c.rows ?? [])
          .map((r) => `<tr><td>${t(r.label)}</td><td>${t(r.a)}</td><td>${t(r.b)}</td><td class="gp-cmp3-us">${t(r.product)}</td></tr>`)
          .join('')}</tbody></table>`,
      );
    }
    if (q) out.push(`<blockquote class="gp-pull">${t(q.quote)}</blockquote>`);
    out.push('</div>');
  }
  const s = by.sale;
  const tb = by.trust_bar;
  if (s || tb) {
    out.push('<div class="gp-measure">');
    if (s) {
      out.push(`<h2 class="gp-section-title">${t(s.title)}</h2>`, ...(s.paragraphs ?? []).map((p) => `<p>${t(p)}</p>`));
      // No separate big price here: the sale text, the trust bar and the product box already show it.
      if (s.availability_note) out.push(`<p>${t(s.availability_note)}</p>`);
    }
    if (tb) out.push(`<div class="gp-stats-row">${(tb.items ?? []).map((i) => `<div><div class="gp-stat-num">${t(i.value)}</div><div class="gp-stat-label">${t(i.label)}</div></div>`).join('')}</div>`);
    out.push('</div>');
  }
  if (by.packing) out.push(`<div class="gp-fold-photo">${img(by.packing.image, ctx, { alt: by.packing.caption })}</div>`, `<p class="gp-fold-cap">${t(by.packing.caption)}</p>`);
  const fo = by.founder_observation;
  const sp = by.social_proof;
  if (fo || sp) {
    out.push('<div class="gp-measure">');
    if (fo) out.push(`<p>${t(fo.text)}</p>`, `<p class="gp-signature">— ${esc(cfg.founder.name_he)}</p>`);
    if (sp) {
      out.push(`<div class="gp-social"><div class="gp-stars">★★★★★</div><div class="gp-rating-line">${t(page.lang === 'he' ? `${sp.rating} / ${cfg.trust.rating_scale} מתוך ${sp.reviews_label} ביקורות` : `${sp.rating} / ${cfg.trust.rating_scale} from ${sp.reviews_label} reviews`)}</div><p>${t(sp.text)}</p></div>`);
      for (const r of (sp.quotes ?? []).slice(0, 1)) out.push(reviewCard(r, ctx, page.lang));
    }
    out.push('</div>');
  }
  const ob = by.offer_box;
  const bu = by.bundle;
  const cta = by.cta;
  const ab = by.about;
  out.push('<div class="gp-measure">');
  if (ob || bu || cta) {
    out.push('<div class="gp-product-box" id="product">');
    if (ob)
      out.push(
        `<h3>${t(ob.product_name)}</h3>`,
        `<div class="gp-rating"><span class="gp-stars">★★★★★</span> ${t(`${cfg.trust.rating}/${cfg.trust.rating_scale}`)}</div>`,
        `<div class="gp-prices"><del class="gp-old">${t(shekel(ob.regular_price))}</del><span class="gp-new">${t(shekel(ob.sale_price))}</span></div>`,
        `<ul class="gp-facts">${routes.facts.map((b) => `<li>${t(b)}</li>`).join('')}</ul>`,
        // The big button. This is where she orders.
        `<a class="gp-cta-btn gp-buy" href="${esc(productUrl)}">${t(routes.box)}</a>`,
      );
    if (bu) out.push(`<div class="gp-stack"><div class="gp-bundle-title">${t(bu.title)}</div><ul class="gp-bundle">${(bu.tiers ?? []).map((x) => `<li>${t(x.label)}</li>`).join('')}</ul></div>`);
    if (cta && !ob) out.push(`<a class="gp-cta-btn gp-buy" href="${esc(productUrl)}">${t(cta.button)}</a>`);
    if (cta?.subtext) out.push(`<p class="gp-cta-sub">${t(cta.subtext)}</p>`);
    out.push('</div>');
  }
  if (ab) out.push(`<div class="gp-about-box"><strong>${t(ab.title)}</strong><p>${t(ab.text)}</p><p class="gp-signature">${t(ab.signoff)}</p></div>`);
  out.push('</div>', '</div></div>');
  // Always visible, straight to the product page.
  if (by.sticky_cta) out.push(`<div class="gp-sticky-bar"><a href="${esc(productUrl)}">${t(by.sticky_cta.text)}</a></div>`);
  out.push('</div>');
  return { html: out.filter(Boolean).join('\n'), missingImages: [...new Set(ctx.missingImages)] };
}

// Standalone preview document (same markup/CSS as the GemPages import).
export function renderGpDocument(page, opts = {}) {
  const { html } = renderGpHtml(page, opts);
  const css = LETTER_CSS_TEMPLATE().replaceAll('{{rootClassName}}', 'adina-gp');
  return `<!doctype html><html lang="${esc(page.lang)}" dir="${esc(page.dir)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(page.blocks?.find((b) => b.type === 'headline')?.headline ?? 'Adina Fashion')}</title><style>body{margin:0}${css}</style></head>
<body><div class="adina-gp">${html}</div></body></html>`;
}

// ---------- minimal zip writer (deflate) ----------
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
export function zip(entries, date = new Date()) {
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
  const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const raw = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    const comp = zlib.deflateRawSync(raw);
    const crc = crc32(raw);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6); local.writeUInt16LE(8, 8);
    local.writeUInt16LE(dosTime, 10); local.writeUInt16LE(dosDate, 12); local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comp.length, 18); local.writeUInt32LE(raw.length, 22); local.writeUInt16LE(nameBuf.length, 26); local.writeUInt16LE(0, 28);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0x0800, 8); central.writeUInt16LE(8, 10);
    central.writeUInt16LE(dosTime, 12); central.writeUInt16LE(dosDate, 14); central.writeUInt32LE(crc, 16); central.writeUInt32LE(comp.length, 20);
    central.writeUInt32LE(raw.length, 24); central.writeUInt16LE(nameBuf.length, 28); central.writeUInt32LE(0, 38); central.writeUInt32LE(offset, 42);
    locals.push(local, nameBuf, comp);
    centrals.push(central, nameBuf);
    offset += local.length + nameBuf.length + comp.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

// ---------- .gempages builder ----------
// 18-digit ids like GemPages uses (kept as strings, then written as raw JSON numbers).
const newId = () => String(600000000000000000n + (BigInt('0x' + crypto.randomBytes(8).toString('hex')) % 99999999999999999n));
const uid = () => Array.from(crypto.randomBytes(10), (b) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[b % 62]).join('');
const stamp = (d) => d.toISOString().replace(/\.(\d{3})Z$/, '.$1000Z');

export function buildGempages(p, { allowMissingImages = false, now = new Date() } = {}) {
  const page = p.gempage.he;
  if (!page) throw new Error('03-gempage-copy.he.json is required');
  const { html, missingImages } = renderGpHtml(page, { plan: p.plan, input: p.input });
  if (missingImages.length && !allowMissingImages)
    throw new Error(`images without a URL: ${missingImages.join(', ')} — run node scripts/images.js ${p.slug} first (or use --allow-missing-images)`);
  const css = LETTER_CSS_TEMPLATE();
  const sk = JSON.parse(fs.readFileSync(path.join(TEMPLATE_DIR, 'skeleton.json'), 'utf8'));
  const tpl = sk.page;
  const ids = { page: newId(), section: newId(), meta1: newId(), meta2: newId() };
  const shortName = String(p.input?.hebrew_product_name ?? p.slug).split('|')[0].trim();
  const handle = `${p.slug}-founder-letter`;
  const ts = stamp(now);

  // component: Section > Col > CSSCode, fresh uids, our html/css
  const comp = JSON.parse(JSON.stringify(tpl.pageSections[0].component));
  comp.uid = uid();
  comp.childrens[0].uid = uid();
  const code = comp.childrens[0].childrens[0];
  code.uid = uid();
  code.advanced.editorData.html = html;
  code.advanced.editorData.css = css;
  const component = JSON.stringify(comp);

  const I = (k) => `__ID_${k}__`; // replaced by raw 18-digit numbers after stringify (beyond JS number precision)
  const out = {
    ...tpl,
    id: I('page'),
    name: `${p.input?.product_name || p.slug} - Founder Letter`,
    handle,
    sectionPosition: [ids.section],
    meta: [
      { ...tpl.meta[0], id: I('meta1'), createdAt: ts, updatedAt: ts, themePageID: I('page'), key: 'seo_title', value: JSON.stringify(`מכתב מהמייסדת: ${shortName}`) },
      { ...tpl.meta[1], id: I('meta2'), createdAt: ts, updatedAt: ts, themePageID: I('page'), key: 'global_layout', value: '{"showHeader": true, "showFooter": true}' },
    ],
    pageSections: [
      {
        ...tpl.pageSections[0],
        id: I('section'),
        createdAt: ts,
        updatedAt: ts,
        themePageID: I('page'),
        cid: uid(),
        name: `Section ${handle}`,
        component,
        checksum: crypto.createHash('sha256').update(component).digest('hex'),
      },
    ],
  };
  const raw = (json) => json.replace(/"__ID_(\w+)__"/g, (_, k) => ids[k]);
  const pageJson = raw(JSON.stringify(out));
  const pagesInfo = `[{"id":${ids.page},"name":${JSON.stringify(out.name)},"type":"GP_STATIC"}]`;
  const manifest = JSON.stringify({ ...sk.manifest, theme_page_count: 1, theme_section_count: 0, image_url_count: 0 });
  const file = zip(
    [
      { name: `1_${ids.page}.zip`, data: zip([{ name: `1_${ids.page}.json`, data: pageJson }], now) },
      { name: 'manifest.json', data: manifest },
      { name: 'pages_info.zip', data: zip([{ name: 'pages_info.json', data: pagesInfo }], now) },
    ],
    now,
  );
  return { file, name: `${p.slug}-founder-letter.gempages`, missingImages, pageId: ids.page, handle };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const a = parseArgs(process.argv.slice(2));
  const slug = a._[0];
  if (!slug) {
    console.error('Usage: node scripts/gempages.js <slug> [--allow-missing-images]');
    process.exit(1);
  }
  try {
    const p = loadProduct(slug);
    const r = buildGempages(p, { allowMissingImages: !!a['allow-missing-images'] });
    const out = path.join(p.dir, 'output', r.name);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, r.file);
    console.log(`✓ products/${slug}/output/${r.name}  (GemPages → Import → upload this file)`);
    if (r.missingImages.length) console.log(`  ⚠ placeholders for images without URL: ${r.missingImages.join(', ')}`);
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  }
}
