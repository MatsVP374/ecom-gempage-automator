#!/usr/bin/env node
// Build products/<slug>/output/: previews, GemPages export, Meta ads CSV, ad pack, Shopify payload.
// Usage: node scripts/export.js <slug> | --all
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadProduct, listSlugs, parseArgs, renderPageDocument, renderPageFragment, PAGE_CSS, writeJSON, formatPrice } from './lib.js';
import { buildShopifyPayload } from './shopify-push.js';

const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function sectionCopy(s) {
  const lines = [];
  const push = (label, v) => v && lines.push(`**${label}:** ${v}`);
  switch (s.type) {
    case 'hero':
      push('Headline', s.headline);
      push('Subheadline', s.subheadline);
      push('Beeld', s.image_hint);
      break;
    case 'story':
      push('Titel', s.title);
      lines.push(s.text);
      push('Beeld', s.image_hint);
      break;
    case 'guarantee':
      push('Titel', s.title);
      lines.push(s.text);
      break;
    case 'cta':
      push('Headline', s.headline);
      push('Knop', s.button);
      push('Subtekst', s.subtext);
      break;
    case 'benefits':
      push('Titel', s.title);
      s.items.forEach((i) => lines.push(`- ${i.icon} **${i.title}** — ${i.text}`));
      break;
    case 'features':
      push('Titel', s.title);
      s.items.forEach((i) => lines.push(`- ${i}`));
      break;
    case 'comparison':
      push('Titel', s.title);
      lines.push(`| | ${s.us_label} | ${s.them_label} |`, '|---|---|---|');
      s.rows.forEach((r) => lines.push(`| ${r.label} | ${r.us ? '✓' : '✗'} | ${r.them ? '✓' : '✗'} |`));
      break;
    case 'size_guide':
      push('Titel', s.title);
      lines.push(`| ${s.headers.join(' | ')} |`, `|${s.headers.map(() => '---').join('|')}|`);
      s.rows.forEach((r) => lines.push(`| ${r.join(' | ')} |`));
      push('Noot', s.note);
      break;
    case 'reviews':
      push('Titel', s.title);
      if (s.placeholder) lines.push('> ⚠️ PLACEHOLDER — vervang door echte reviews (Judge.me/Loox) vóór publicatie.');
      s.items.forEach((r) => lines.push(`- ${'★'.repeat(r.rating ?? 5)} "${r.text}" — ${r.name}`));
      break;
    case 'faq':
      push('Titel', s.title);
      s.items.forEach((i) => lines.push(`- **${i.q}**\n  ${i.a}`));
      break;
  }
  return lines.join('\n');
}

function gempagesCopy(page, product) {
  const out = [
    `# GemPages copy — ${page.title}`,
    '',
    `Taal: ${page.lang} · richting: ${page.dir}. Plak per blok in de GemPages-template (zelfde volgorde).`,
    'Titel, prijs, varianten en afbeeldingen komen dynamisch uit Shopify.',
    '',
    '## Boven de vouw',
    `**Titel:** ${page.title}`,
    `**Subtitel:** ${page.subtitle}`,
    `**Prijs:** ${formatPrice(page.price?.current, page.price?.currency)}${page.price?.compare_at ? ` (was ${formatPrice(page.price.compare_at, page.price.currency)})` : ''}`,
    page.badge ? `**Badge:** ${page.badge}` : '',
    '**Bullets:**',
    ...(page.bullets ?? []).map((b) => `- ✓ ${b}`),
    `**Knop:** ${page.cta}`,
    `**Trust line:** ${page.trust_line}`,
    '',
  ];
  (page.sections ?? []).forEach((s, i) => out.push(`## ${i + 1}. ${s.type}`, sectionCopy(s), ''));
  out.push('## SEO', `**Title:** ${page.seo?.title}`, `**Description:** ${page.seo?.description}`);
  if (product?.shopify?.handle) out.push(`**Handle:** ${product.shopify.handle}`);
  return out.filter((l) => l !== '').join('\n\n').replace(/\n\n(- |\| )/g, '\n$1') + '\n';
}

function metaCsv(slug, ads) {
  const header = ['ad_name', 'language', 'angle_id', 'angle_name', 'awareness', 'format', 'primary_text', 'headline', 'description'];
  const rows = [header];
  const angles = Object.fromEntries((ads.angles ?? []).map((a) => [a.id, a]));
  for (const lang of ['he', 'en'])
    for (const set of ads.copy?.[lang] ?? []) {
      const a = angles[set.angle_id] ?? {};
      (set.primary_texts ?? []).forEach((pt, pi) =>
        (set.headlines ?? []).forEach((h, hi) =>
          rows.push([`${slug}_${set.angle_id}_${lang}_p${pi + 1}h${hi + 1}`, lang, set.angle_id, a.name, a.awareness, a.format, pt, h, (set.descriptions ?? [])[0] ?? '']),
        ),
      );
    }
  // BOM so Excel/Sheets open Hebrew correctly.
  return '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

function adPackMd(p) {
  const ads = p.ads;
  const out = [`# Ad pack — ${p.product?.full_title_he ?? p.slug}`, ''];
  out.push('## Angles', '', '| id | naam | awareness | hook | format |', '|---|---|---|---|---|');
  for (const a of ads.angles ?? []) out.push(`| ${a.id} | ${a.name} | ${a.awareness} | ${a.hook_en} | ${a.format} |`);
  for (const lang of ['he', 'en']) {
    out.push('', `## Copy — ${lang.toUpperCase()}`);
    for (const set of ads.copy?.[lang] ?? []) {
      out.push('', `### ${set.angle_id}`, '', '**Primary texts**', '');
      set.primary_texts.forEach((t, i) => out.push(`${i + 1}. ${t.replace(/\n/g, '  \n   ')}`, ''));
      out.push('**Headlines**', '', ...set.headlines.map((h) => `- ${h}`), '');
      if (set.descriptions?.length) out.push('**Descriptions**', '', ...set.descriptions.map((d) => `- ${d}`));
    }
  }
  return out.join('\n') + '\n';
}

export function exportProduct(slug) {
  const p = loadProduct(slug);
  if (p.parseErrors.length) throw new Error(p.parseErrors.join('\n'));
  const out = path.join(p.dir, 'output');
  fs.mkdirSync(out, { recursive: true });
  const written = [];
  const write = (name, content) => {
    fs.writeFileSync(path.join(out, name), content);
    written.push(name);
  };

  for (const lang of ['en', 'he']) if (p.page[lang]) write(`page.${lang}.html`, renderPageDocument(p.page[lang]));
  const main = p.page.he ?? p.page.en;
  if (main) {
    write('gempages.html', `<style>${PAGE_CSS}</style>\n${renderPageFragment(main)}\n`);
    write('gempages-copy.md', gempagesCopy(main, p.product));
  }
  if (p.ads?.copy) {
    write('meta-ads.csv', metaCsv(slug, p.ads));
    write('ad-pack.md', adPackMd(p));
  }
  if (p.product && p.page.he) {
    writeJSON(path.join(out, 'shopify-product.json'), buildShopifyPayload(p));
    written.push('shopify-product.json');
  }
  return written;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = parseArgs(process.argv.slice(2));
  const slugs = a.all ? listSlugs() : a._;
  if (!slugs.length) {
    console.error('Usage: node scripts/export.js <slug> | --all');
    process.exit(1);
  }
  let failed = false;
  for (const slug of slugs) {
    try {
      const files = exportProduct(slug);
      console.log(`✓ ${slug} → products/${slug}/output/  (${files.join(', ') || 'nothing to export yet'})`);
    } catch (e) {
      failed = true;
      console.error(`✗ ${slug}: ${e.message}`);
    }
  }
  process.exit(failed ? 1 : 0);
}
