#!/usr/bin/env node
// Step 5b: generate the GemPage storytelling images (Gemini or OpenAI) and host them on the Shopify CDN.
//   1. generate: for every image in 04-gempage-image-plan.json with source "generate", send its prompt from
//      05-image-prompts.json to the image provider, with the existing product photos as reference images so the
//      product stays the same. Result → products/<slug>/images/<IMG-ID>.<png|jpg|webp>
//   2. upload:   stagedUploadsCreate → upload → fileCreate → poll until READY → CDN url written to the plan.
//   compare:     generate the selected images with BOTH providers into images/compare/ (no plan change, no upload),
//                so you can pick the provider that looks most real.
// Existing product photos (source "existing") are never regenerated.
//
// Usage: node scripts/images.js <slug> [generate|upload|all|compare] [--provider gemini|openai]
//        [--only IMG-02,IMG-03] [--force] [--dry-run]
// Env:   IMAGE_PROVIDER (gemini|openai; default: gemini when GEMINI_API_KEY is set, else openai)
//        GEMINI_API_KEY, GEMINI_IMAGE_MODEL (default gemini-3.1-flash-image), GEMINI_BASE_URL
//        OPENAI_API_KEY, OPENAI_IMAGE_MODEL (default gpt-image-1), OPENAI_IMAGE_QUALITY (default high), OPENAI_BASE_URL
//        SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_TOKEN
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadProduct, loadEnv, parseArgs, writeJSON, FILES } from './lib.js';
import { gql, userErrors } from './shopify-push.js';
import { renderedReviewFor } from './gempages.js';

const MAX_REFERENCES = 4;
const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
const PROVIDERS = ['gemini', 'openai'];
const KEY = { gemini: 'GEMINI_API_KEY', openai: 'OPENAI_API_KEY' };

export function pickProvider(explicit) {
  const p = explicit || process.env.IMAGE_PROVIDER || (process.env.GEMINI_API_KEY ? 'gemini' : 'openai');
  if (!PROVIDERS.includes(p)) throw new Error(`unknown image provider "${p}" (use ${PROVIDERS.join(' or ')})`);
  return p;
}

// OpenAI image sizes: square, portrait, landscape.
export function sizeFor(aspect = '4:5') {
  const [w, h] = String(aspect).split(':').map(Number);
  if (!w || !h || w === h) return '1024x1024';
  return w > h ? '1536x1024' : '1024x1536';
}

async function loadReference(ref, dir) {
  if (/^https?:\/\//.test(ref)) {
    // Local copy first (images/refs/<basename>), e.g. when the CDN is only reachable via curl.
    const cached = path.join(dir, 'images', 'refs', path.basename(new URL(ref).pathname));
    if (fs.existsSync(cached)) return { buffer: fs.readFileSync(cached), type: MIME[path.extname(cached).toLowerCase()] ?? 'image/jpeg', name: path.basename(cached) };
    const res = await fetch(ref);
    if (!res.ok) throw new Error(`reference image ${ref}: HTTP ${res.status}`);
    const type = (res.headers.get('content-type') || 'image/jpeg').split(';')[0];
    const name = path.basename(new URL(ref).pathname) || 'reference.jpg';
    return { buffer: Buffer.from(await res.arrayBuffer()), type, name };
  }
  const file = path.join(dir, ref);
  return { buffer: fs.readFileSync(file), type: MIME[path.extname(file).toLowerCase()] ?? 'image/png', name: path.basename(file) };
}

async function openaiImage({ prompt, aspect, references = [] }) {
  const key = process.env.OPENAI_API_KEY;
  const base = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
  const quality = process.env.OPENAI_IMAGE_QUALITY || 'high';
  const size = sizeFor(aspect);
  let res;
  if (references.length) {
    const form = new FormData();
    form.append('model', model);
    form.append('prompt', prompt);
    form.append('size', size);
    form.append('quality', quality);
    form.append('n', '1');
    if (process.env.OPENAI_INPUT_FIDELITY !== 'off') form.append('input_fidelity', 'high');
    for (const r of references) form.append('image[]', new Blob([r.buffer], { type: r.type }), r.name);
    res = await fetch(`${base}/images/edits`, { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form });
  } else {
    res = await fetch(`${base}/images/generations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, size, quality, n: 1 }),
    });
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${body.error?.message ?? JSON.stringify(body).slice(0, 300)}`);
  const b64 = body.data?.[0]?.b64_json;
  if (!b64) throw new Error('OpenAI returned no image data');
  return { buffer: Buffer.from(b64, 'base64'), mime: 'image/png', model, size };
}

async function geminiImage({ prompt, aspect, references = [] }) {
  const key = process.env.GEMINI_API_KEY;
  const base = (process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/$/, '');
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';
  const parts = [
    { text: `${prompt}\n\nThe attached photos are reference images of the exact product. Reproduce the garment exactly as shown in them.` },
    ...references.map((r) => ({ inline_data: { mime_type: r.type, data: r.buffer.toString('base64') } })),
  ];
  const res = await fetch(`${base}/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: aspect || '4:5' } } }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${body.error?.message ?? JSON.stringify(body).slice(0, 300)}`);
  const outParts = body.candidates?.[0]?.content?.parts ?? [];
  const img = outParts.map((x) => x.inlineData ?? x.inline_data).find((x) => x?.data);
  if (!img) {
    const why = body.candidates?.[0]?.finishReason ?? body.promptFeedback?.blockReason ?? outParts.find((x) => x.text)?.text ?? 'no image in response';
    throw new Error(`Gemini returned no image (${String(why).slice(0, 200)})`);
  }
  return { buffer: Buffer.from(img.data, 'base64'), mime: img.mimeType ?? img.mime_type ?? 'image/png', model, size: aspect };
}

export async function generateImage({ provider, ...args }) {
  const fn = { gemini: geminiImage, openai: openaiImage }[provider];
  if (!process.env[KEY[provider]]) throw new Error(`${KEY[provider]} is not set — add it to the environment (see .env.example)`);
  return fn(args);
}

export async function shopifyUpload({ buffer, filename, alt, mimeType = 'image/png' }) {
  const staged = await gql(
    `mutation($input: [StagedUploadInput!]!) { stagedUploadsCreate(input: $input) { stagedTargets { url resourceUrl parameters { name value } } userErrors { field message } } }`,
    { input: [{ resource: 'IMAGE', filename, mimeType, httpMethod: 'POST', fileSize: String(buffer.length) }] },
  );
  userErrors(staged.stagedUploadsCreate, 'stagedUploadsCreate');
  const target = staged.stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  for (const { name, value } of target.parameters) form.append(name, value);
  form.append('file', new Blob([buffer], { type: mimeType }), filename);
  const up = await fetch(target.url, { method: 'POST', body: form });
  if (!up.ok) throw new Error(`staged upload failed: HTTP ${up.status}`);

  const created = await gql(
    `mutation($files: [FileCreateInput!]!) { fileCreate(files: $files) { files { id fileStatus ... on MediaImage { image { url } } } userErrors { field message } } }`,
    { files: [{ originalSource: target.resourceUrl, contentType: 'IMAGE', alt: String(alt ?? '').slice(0, 500) }] },
  );
  userErrors(created.fileCreate, 'fileCreate');
  const file = created.fileCreate.files[0];
  let url = file.image?.url;
  const wait = Number(process.env.SHOPIFY_FILE_POLL_MS ?? 2000);
  for (let i = 0; !url && i < 30; i++) {
    await new Promise((r) => setTimeout(r, wait));
    const n = await gql(`query($id: ID!) { node(id: $id) { ... on MediaImage { fileStatus image { url } fileErrors { message } } } }`, { id: file.id });
    if (n.node?.fileStatus === 'FAILED') throw new Error(`Shopify file failed: ${(n.node.fileErrors ?? []).map((e) => e.message).join('; ')}`);
    url = n.node?.image?.url;
  }
  if (!url) throw new Error(`Shopify file ${file.id} not READY after polling`);
  return { id: file.id, url };
}

export async function runImages(slug, { mode = 'all', provider = null, only = null, force = false, dryRun = false, log = console.log } = {}) {
  loadEnv();
  const p = loadProduct(slug);
  if (!p.plan) throw new Error(`${FILES.plan} missing — run step 4 first`);
  const prompts = Object.fromEntries((p.prompts?.prompts ?? []).map((x) => [x.image_id, x]));
  const planFile = path.join(p.dir, FILES.plan);
  const imgDir = path.join(p.dir, 'images');
  // The customer-style photo of review 1 is only generated when review 1 renders on this page (never for a mockup review
  // on a page that may be published, never when there is no review 1): no cost for a photo that cannot show.
  const page = p.gempage?.he ?? p.gempage?.en;
  const reviewOneRenders = !!renderedReviewFor(page, p.input, 1);
  const pick = (i) => (!only || only.includes(i.id)) && (i.role !== 'customer_review' || reviewOneRenders);
  const summary = { generated: [], uploaded: [], skipped: [], errors: [], compared: [] };
  for (const i of p.plan?.images ?? [])
    if (i.role === 'customer_review' && !reviewOneRenders) summary.skipped.push(`${i.id}: review 1 does not render on this page — customer_review photo not generated`);
  const exists = (i) => i.file && fs.existsSync(path.join(p.dir, i.file));

  const refsCache = new Map();
  const referencesFor = async (pr) => {
    const refs = (pr.reference_images?.length ? pr.reference_images : p.input?.existing_product_images ?? []).slice(0, MAX_REFERENCES);
    const out = [];
    for (const r of refs) {
      if (!refsCache.has(r)) refsCache.set(r, await loadReference(r, p.dir));
      out.push(refsCache.get(r));
    }
    return out;
  };

  // Compare mode: same prompt + references through both providers, side by side. Nothing else changes.
  if (mode === 'compare') {
    const targets = (p.plan.images ?? []).filter((x) => x.source === 'generate' && (only ? pick(x) : x.role === 'hero'));
    const missingKeys = PROVIDERS.filter((pv) => !process.env[KEY[pv]]);
    if (missingKeys.length && !dryRun) throw new Error(`compare needs both keys; missing: ${missingKeys.map((pv) => KEY[pv]).join(', ')}`);
    for (const i of targets) {
      const pr = prompts[i.id];
      if (!pr) { summary.errors.push(`${i.id}: no prompt in ${FILES.prompts}`); continue; }
      if (dryRun) { log(`[dry-run] compare ${i.id} with ${PROVIDERS.join(' + ')}`); continue; }
      let references;
      try { references = await referencesFor(pr); } catch (e) { summary.errors.push(`${i.id}: ${e.message}`); continue; }
      for (const pv of PROVIDERS) {
        try {
          log(`→ ${i.id} with ${pv}…`);
          const r = await generateImage({ provider: pv, prompt: pr.prompt, aspect: pr.aspect_ratio, references });
          const rel = `images/compare/${i.id}.${pv}.${EXT[r.mime] ?? 'png'}`;
          fs.mkdirSync(path.join(p.dir, 'images', 'compare'), { recursive: true });
          fs.writeFileSync(path.join(p.dir, rel), r.buffer);
          summary.compared.push(`${rel} (${r.model})`);
        } catch (e) {
          summary.errors.push(`${i.id} [${pv}]: ${e.message}`);
        }
      }
    }
    return summary;
  }

  // Existing product photos: use their own URL, never regenerate.
  for (const i of p.plan.images ?? [])
    if (i.source === 'existing' && /^https?:\/\//.test(i.existing_image ?? '') && !i.url) i.url = i.existing_image;

  const pv = pickProvider(provider);
  const toGenerate = (p.plan.images ?? []).filter((x) => x.source === 'generate' && pick(x) && (force || !exists(x)));
  if ((mode === 'all' || mode === 'generate') && toGenerate.length && !dryRun && !process.env[KEY[pv]])
    throw new Error(`${KEY[pv]} is not set — add it to the environment (see .env.example)`);

  if (mode === 'all' || mode === 'generate') {
    for (const i of (p.plan.images ?? []).filter((x) => x.source === 'generate' && pick(x))) {
      const pr = prompts[i.id];
      if (!pr) { summary.errors.push(`${i.id}: no prompt in ${FILES.prompts}`); continue; }
      if (exists(i) && !force) { summary.skipped.push(`${i.id} (already generated)`); continue; }
      if (dryRun) { log(`[dry-run] ${i.id}: ${pv}, ${pr.aspect_ratio}, prompt ${pr.prompt.length} chars`); continue; }
      try {
        const references = await referencesFor(pr);
        log(`→ ${i.id} generating with ${pv} (${pr.aspect_ratio}, ${references.length} reference image(s))…`);
        const r = await generateImage({ provider: pv, prompt: pr.prompt, aspect: pr.aspect_ratio, references });
        fs.mkdirSync(imgDir, { recursive: true });
        if (i.file && exists(i)) fs.rmSync(path.join(p.dir, i.file));
        i.file = `images/${i.id}.${EXT[r.mime] ?? 'png'}`;
        fs.writeFileSync(path.join(p.dir, i.file), r.buffer);
        i.generated = { provider: pv, model: r.model, size: r.size, at: new Date().toISOString() };
        delete i.url; // a new image needs a new upload
        summary.generated.push(i.id);
        writeJSON(planFile, p.plan);
      } catch (e) {
        summary.errors.push(`${i.id}: ${e.message}`);
      }
    }
  }

  if (mode === 'all' || mode === 'upload') {
    for (const i of (p.plan.images ?? []).filter((x) => x.source === 'generate' && pick(x))) {
      if (!i.file) { summary.skipped.push(`${i.id} (not generated yet)`); continue; }
      if (i.url && !force) { summary.skipped.push(`${i.id} (already uploaded)`); continue; }
      if (dryRun) { log(`[dry-run] upload ${i.file}`); continue; }
      try {
        log(`→ ${i.id} uploading to Shopify…`);
        const ext = path.extname(i.file).toLowerCase();
        const r = await shopifyUpload({ buffer: fs.readFileSync(path.join(p.dir, i.file)), filename: `${slug}-${i.id}${ext}`, alt: i.purpose, mimeType: MIME[ext] ?? 'image/png' });
        i.url = r.url;
        i.shopify_file_id = r.id;
        summary.uploaded.push(i.id);
        writeJSON(planFile, p.plan);
      } catch (e) {
        summary.errors.push(`${i.id}: ${e.message}`);
      }
    }
  }
  writeJSON(planFile, p.plan);
  return summary;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const a = parseArgs(process.argv.slice(2));
  const [slug, mode = 'all'] = a._;
  if (!slug || !['all', 'generate', 'upload', 'compare'].includes(mode)) {
    console.error('Usage: node scripts/images.js <slug> [generate|upload|all|compare] [--provider gemini|openai] [--only IMG-02,IMG-03] [--force] [--dry-run]');
    process.exit(1);
  }
  try {
    const s = await runImages(slug, {
      mode,
      provider: typeof a.provider === 'string' ? a.provider : null,
      only: typeof a.only === 'string' ? a.only.split(',') : null,
      force: !!a.force,
      dryRun: !!a['dry-run'],
    });
    if (mode === 'compare') console.log(`\n✓ compare: ${s.compared.join(', ') || '—'}  → products/${slug}/images/compare/`);
    else console.log(`\n✓ generated: ${s.generated.join(', ') || '—'}\n✓ uploaded:  ${s.uploaded.join(', ') || '—'}`);
    if (s.skipped.length) console.log(`  skipped:   ${s.skipped.join(', ')}`);
    s.errors.forEach((e) => console.log(`✗ ${e}`));
    process.exit(s.errors.length ? 1 : 0);
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  }
}
