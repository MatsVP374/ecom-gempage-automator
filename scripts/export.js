#!/usr/bin/env node
// Build products/<slug>/output/: the final launch package for GemPages, image generation and the Meta creatives.
// Usage: node scripts/export.js <slug> | --all
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadProduct, loadConfig, listSlugs, parseArgs, writeJSON, shekel } from './lib.js';
import { renderGpDocument, buildGempages } from './gempages.js';
import { validateProduct } from './validate.js';
import { buildShopifyPayload } from './shopify-push.js';

// Which of the 26 GemPage elements each block covers.
const ELEMENTS = {
  founder_header: '1–4 · byline, place/date, green note, badge',
  headline: '5–6 · problem-first headline + subtitle',
  hero: '7 · hero lifestyle photo',
  founder_story: '8–10 · personal intro, problem story, discovery',
  benefits: '11–12 · numbered benefits + photos',
  comparison: '13 · comparison',
  founder_quote: '14 · founder quote',
  sale: '15–16 · why on sale now + old → sale price',
  trust_bar: '17 · trust/statistics',
  packing: '18 · boutique packing photo',
  founder_observation: '19 · founder observation',
  social_proof: '20 · social proof',
  offer_box: '21–22 · offer box + product benefits',
  bundle: '23 · bundle discount',
  cta: '24 · CTA',
  about: '25 · about Adina',
  sticky_cta: '26 · sticky CTA',
};

function blockCopy(b) {
  const L = [];
  const f = (label, v) => v != null && v !== '' && L.push(`**${label}:** ${v}`);
  switch (b.type) {
    case 'founder_header':
      f('Byline', b.byline); f('Plaats/datum', b.place_date); f('Groene banner', b.note); f('Badge', b.badge);
      break;
    case 'headline':
      f('Headline', b.headline); f('Subtitle', b.subtitle);
      break;
    case 'hero':
      f('Beeld', b.image); f('Alt', b.alt);
      break;
    case 'founder_story':
      f('Aanhef', b.greeting);
      (b.parts ?? []).forEach((p) => L.push(`_${p.role}_\n\n${p.text}`));
      break;
    case 'benefits':
      f('Titel', b.title);
      (b.items ?? []).forEach((i) => L.push(`### ${i.n}. ${i.headline}\n\n${i.text}\n\n📷 ${i.image ?? '—'}`));
      break;
    case 'comparison':
      f('Titel', b.title);
      L.push(`| | ${b.columns?.a} | ${b.columns?.b} | **${b.columns?.product}** |\n|---|---|---|---|\n${(b.rows ?? []).map((r) => `| ${r.label} | ${r.a} | ${r.b} | **${r.product}** |`).join('\n')}`);
      break;
    case 'founder_quote':
      L.push(`> "${b.quote}"\n> — ${b.author}`);
      break;
    case 'sale':
      f('Titel', b.title);
      (b.paragraphs ?? []).forEach((p) => L.push(p));
      f('Prijs', `~~${shekel(b.regular_price)}~~ → ${shekel(b.sale_price)}`);
      f('Beschikbaarheid', b.availability_note);
      break;
    case 'trust_bar':
      L.push((b.items ?? []).map((i) => `**${i.value}** ${i.label}`).join(' · '));
      break;
    case 'packing':
      f('Beeld', b.image); f('Caption', b.caption);
      break;
    case 'founder_observation':
      L.push(b.text);
      break;
    case 'social_proof':
      f('Rating', `★★★★★ ${b.rating}/5 · ${b.reviews_label}`); L.push(b.text);
      (b.quotes ?? []).forEach((q) => L.push(`> ${q.text} _(testimonial ${q.testimonial_id})_`));
      break;
    case 'offer_box':
      f('Productnaam', b.product_name); f('Rating', b.rating_line); f('Prijs', `~~${shekel(b.regular_price)}~~ → ${shekel(b.sale_price)}`);
      L.push((b.bullets ?? []).map((x) => `- ✓ ${x}`).join('\n'));
      break;
    case 'bundle':
      f('Titel', b.title);
      L.push((b.tiers ?? []).map((t) => `- ${t.label}`).join('\n'));
      break;
    case 'cta':
      f('Knop', b.button); f('Subtekst', b.subtext);
      break;
    case 'about':
      f('Titel', b.title); L.push(b.text); f('Afsluiting', b.signoff);
      break;
    case 'sticky_cta':
      f('Sticky', b.text);
      break;
  }
  return L.join('\n\n');
}

function gempageCopyMd(p) {
  const g = p.gempage.he;
  const out = [
    `# GemPage — ${p.input?.hebrew_product_name ?? p.slug}`,
    '',
    'Founder-letter advertorial · Hebreeuws · RTL. Plak blok voor blok in de Adina GemPages-template.',
    'Beelden: zie `image-prompts.md` (📷 = ID uit het beeldplan).',
    '',
  ];
  for (const b of g.blocks ?? []) out.push(`## ${b.type}  \n<sub>GemPage-element ${ELEMENTS[b.type] ?? ''}</sub>`, '', `<div dir="rtl">\n\n${blockCopy(b)}\n\n</div>`, '');
  return out.join('\n');
}

function imagePromptsMd(p) {
  const plan = p.plan?.images ?? [];
  const prompts = Object.fromEntries((p.prompts?.prompts ?? []).map((x) => [x.image_id, x]));
  const out = [`# GemPage image plan + prompts — ${p.input?.product_name ?? p.slug}`, ''];
  out.push('Bestaande productfoto\'s worden niet opnieuw gegenereerd. Alleen beelden met `generate` hebben een prompt.', '');
  out.push('| ID | Rol | Blok | Doel | Bron | Kleur | Shopify URL |', '|---|---|---|---|---|---|---|');
  plan.forEach((i) => out.push(`| ${i.id} | ${i.role} | ${i.block}${i.benefit_n ? ` #${i.benefit_n}` : ''} | ${i.purpose} | ${i.source === 'existing' ? `existing: ${i.existing_image}` : 'generate'} | ${i.product_color} | ${i.url ?? '—'} |`));
  for (const i of plan) {
    const x = prompts[i.id];
    if (!x) continue;
    out.push('', `## ${i.id} — ${i.role} → ${i.block}${i.benefit_n ? ` #${i.benefit_n}` : ''}`, '');
    out.push(`**Aspect ratio:** ${x.aspect_ratio ?? '—'} · **Referentiebeelden:** ${(x.reference_images ?? []).join(', ') || '—'}`, '');
    out.push('| Veld | Waarde |', '|---|---|', ...Object.entries(x.fields ?? {}).map(([k, v]) => `| ${k} | ${String(v).replace(/\|/g, '/')} |`), '');
    out.push('**Prompt:**', '', '```', x.prompt, '```');
  }
  return out.join('\n') + '\n';
}

function creativePlanMd(p) {
  const out = [`# Creative plan — ${p.input?.product_name ?? p.slug}`, ''];
  for (const c of p.creatives?.creatives ?? []) {
    out.push(`## ${c.id} — ${c.type}`, '', `**Concept:** ${c.concept}`, '', `**Visual:** ${c.visual}`, '');
    if (c.overlay_text_he) out.push(`**Tekst op beeld:** <span dir="rtl">${c.overlay_text_he}</span>`, '');
    out.push(`**Kleur:** ${c.product_color} · **Formaat:** ${c.format}`, '', '```', c.prompt, '```', '');
  }
  const u = p.ugc;
  out.push('## UGC-video', '');
  if (!u?.needed) out.push(`Niet nodig (${u?.reason ?? 'not requested'}).`);
  else {
    out.push(`**Waarom:** ${u.reason ?? ''}`, '', `**Stem:** ${u.voice ?? ''}`, '', '| Tijd | Beeld | Voice-over (HE) |', '|---|---|---|');
    (u.script ?? []).forEach((s) => out.push(`| ${s.time} | ${s.visual} | <span dir="rtl">${s.voice_he}</span> |`));
  }
  return out.join('\n') + '\n';
}

function launchPackageMd(p, v, gp) {
  const cfg = loadConfig();
  const plan = p.plan?.images ?? [];
  const gen = plan.filter((i) => i.source === 'generate').length;
  const ok = (b) => (b ? '✓' : '✗');
  const items = (p.gempage.he?.blocks ?? []).find((b) => b.type === 'benefits')?.items ?? [];
  const reviews = { total: items.length, withReview: items.filter((i) => i.review?.text).length };
  const step = (id) => p.steps.find((s) => s.id === id)?.done;
  const lines = [
    `# ADINA PRODUCT LAUNCH — ${p.input?.hebrew_product_name ?? p.slug}`,
    '',
    '```',
    `${ok(step('facts') && !(p.facts?.missing ?? []).length)} Product facts validated        ${(p.facts?.missing ?? []).length} missing · ${(p.facts?.unverified ?? []).length} unverified`,
    `${ok(step('angle'))} Central angle created          "${p.angle?.central_problem ?? '—'}"`,
    `${ok(step('gempage-he'))} GemPage copy complete          ${(p.gempage.he?.blocks ?? []).length} blocks · HE + EN master`,
    `${ok(step('spellcheck') && !v.errors.some((x) => x.startsWith('spelling')))} Hebrew spellcheck              ${v.errors.filter((x) => x.startsWith('spelling')).length} errors · ${(p.spellcheck?.corrections ?? []).length} corrections · ${(p.spellcheck?.doubts ?? []).length} doubts`,
    `${ok(plan.length)} ${plan.length} GemPage images planned       ${gen} generate · ${plan.length - gen} existing`,
    `${ok(step('image-prompts'))} Image prompts complete         ${(p.prompts?.prompts ?? []).length}`,
    `${ok(step('images'))} Images generated + on Shopify  ${plan.filter((i) => i.url).length}/${plan.length}${gp?.missingImages?.length ? ` · missing: ${gp.missingImages.join(', ')}` : ''}`,
    `${ok(reviews.total && reviews.withReview === reviews.total)} Reviews under the photos       ${reviews.withReview}/${reviews.total} benefits · ${(p.input?.testimonials ?? []).length} reviews supplied`,
    `${ok(step('creatives'))} Creative plan complete         ${(p.creatives?.creatives ?? []).length} statics · UGC: ${p.ugc?.needed ? 'yes' : 'no'}`,
    `${ok(!v.errors.length)} QA ${v.errors.length ? 'FAILED' : 'passed'}                      ${v.errors.length} errors · ${v.warnings.length} warnings`,
    '',
    v.ready ? 'READY FOR:' : 'NOT READY YET — resolve the flags/errors below. Available so far:',
    `→ GemPages          ${gp ? gp.name + ' (Import)' : '—'} · gempage.he.html (preview) · gempage-copy.md`,
    '→ Image generation  image-prompts.md',
    '→ Meta creatives    creative-plan.md (4 statics' + (p.ugc?.needed ? ' + UGC' : '') + ')',
    '```',
    '',
    '## Offer (from input + config)',
    `- ${shekel(p.input?.regular_price)} → ${shekel(p.input?.sale_price)} · ${p.input?.promotion ?? ''} · ${p.input?.sale_reason ?? ''}`,
    `- Bundle: ${cfg.bundle_discount.map((t) => `${t.items}${t.or_more ? '+' : ''} = ${t.extra_discount_pct}%`).join(' · ')}`,
    `- ${cfg.trust.shipping} · ${cfg.trust.returns_days} days returns · ${cfg.trust.rating}/${cfg.trust.rating_scale} from ${cfg.trust.reviews_label} reviews · ${cfg.founder.experience}`,
  ];
  if (v.flags.length) lines.push('', '## Flags', ...v.flags.map((f) => `- ${f}`));
  if (v.errors.length) lines.push('', '## Errors', ...v.errors.map((e) => `- ${e}`));
  if (v.warnings.length) lines.push('', '## Warnings', ...v.warnings.map((w) => `- ${w}`));
  return lines.join('\n') + '\n';
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
  const opts = { plan: p.plan, input: p.input };
  for (const lang of ['en', 'he']) if (p.gempage[lang]) write(`gempage.${lang}.html`, renderGpDocument(p.gempage[lang], opts));
  let gp = null;
  if (p.gempage.he) {
    write('gempage-copy.md', gempageCopyMd(p));
    // Importable GemPages file. Images without a Shopify URL become visible placeholders (see launch-package.md).
    gp = buildGempages(p, { allowMissingImages: true });
    for (const f of fs.readdirSync(out)) if (f.endsWith('.gempages')) fs.rmSync(path.join(out, f));
    write(gp.name, gp.file);
  }
  if (p.plan) write('image-prompts.md', imagePromptsMd(p));
  if (p.creatives) write('creative-plan.md', creativePlanMd(p));
  if (p.input && p.gempage.he) {
    try {
      writeJSON(path.join(out, 'shopify-product.json'), buildShopifyPayload(p));
      written.push('shopify-product.json');
    } catch {}
  }
  // The package summary is written once the last pipeline steps exist.
  if (p.creatives && p.qa) {
    const pre = validateProduct(slug);
    // launch-package.md itself completes the last step, so recompute readiness as if it exists.
    pre.ready = !pre.errors.length && pre.steps.every((s) => s.done || s.id === 'package');
    write('launch-package.md', launchPackageMd(p, pre, gp));
  }
  return written;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const a = parseArgs(process.argv.slice(2));
  const slugs = a.all ? listSlugs() : a._;
  if (!slugs.length) {
    console.log(a.all ? 'No products yet.' : 'Usage: node scripts/export.js <slug> | --all');
    process.exit(a.all ? 0 : 1);
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
