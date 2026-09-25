#!/usr/bin/env node
// Step 5b: generate the GemPage storytelling images with OpenAI and host them on the Shopify CDN.
//   1. generate: for every image in 04-gempage-image-plan.json with source "generate", send its prompt from
//      05-image-prompts.json to the OpenAI Images API. The existing product photos are sent along as reference
//      images (images/edits) so the product stays the same. Result → products/<slug>/images/<IMG-ID>.png
//   2. upload:   stagedUploadsCreate → upload → fileCreate → poll until READY → CDN url written to the plan.
// Existing product photos (source "existing") are never regenerated.
//
// Usage: node scripts/images.js <slug> [generate|upload|all] [--only IMG-02,IMG-03] [--force] [--dry-run]
// Env:   OPENAI_API_KEY, OPENAI_IMAGE_MODEL (default gpt-image-1), OPENAI_IMAGE_QUALITY (default high),
//        OPENAI_BASE_URL (default https://api.openai.com/v1), SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_TOKEN
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadProduct, loadEnv, parseArgs, writeJSON, FILES } from './lib.js';
import { gql, userErrors } from './shopify-push.js';

const MAX_REFERENCES = 4;

// OpenAI image sizes: square, portrait, landscape.
export function sizeFor(aspect = '4:5') {
  const [w, h] = String(aspect).split(':').map(Number);
  if (!w || !h || w === h) return '1024x1024';
  return w > h ? '1536x1024' : '1024x1536';
}

async function loadReference(ref, dir) {
  if (/^https?:\/\//.test(ref)) {
    const res = await fetch(ref);
    if (!res.ok) throw new Error(`reference image ${ref}: HTTP ${res.status}`);
    const type = res.headers.get('content-type') || 'image/jpeg';
    const name = path.basename(new URL(ref).pathname) || 'reference.jpg';
    return { blob: new Blob([await res.arrayBuffer()], { type }), name };
  }
  const file = path.join(dir, ref);
  const ext = path.extname(file).toLowerCase();
  const type = { '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' }[ext] ?? 'image/png';
  return { blob: new Blob([fs.readFileSync(file)], { type }), name: path.basename(file) };
}

export async function openaiImage({ prompt, size, references = [] }) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is not set (.env)');
  const base = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
  const quality = process.env.OPENAI_IMAGE_QUALITY || 'high';
  let res;
  if (references.length) {
    const form = new FormData();
    form.append('model', model);
    form.append('prompt', prompt);
    form.append('size', size);
    form.append('quality', quality);
    form.append('n', '1');
    if (process.env.OPENAI_INPUT_FIDELITY !== 'off') form.append('input_fidelity', 'high');
    for (const r of references) form.append('image[]', r.blob, r.name);
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
  return { png: Buffer.from(b64, 'base64'), model };
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

export async function runImages(slug, { mode = 'all', only = null, force = false, dryRun = false, log = console.log } = {}) {
  loadEnv();
  const p = loadProduct(slug);
  if (!p.plan) throw new Error(`${FILES.plan} missing — run step 4 first`);
  const prompts = Object.fromEntries((p.prompts?.prompts ?? []).map((x) => [x.image_id, x]));
  const planFile = path.join(p.dir, FILES.plan);
  const imgDir = path.join(p.dir, 'images');
  const pick = (i) => !only || only.includes(i.id);
  const summary = { generated: [], uploaded: [], skipped: [], errors: [] };

  // Existing product photos: use their own URL, never regenerate.
  for (const i of p.plan.images ?? [])
    if (i.source === 'existing' && /^https?:\/\//.test(i.existing_image ?? '') && !i.url) i.url = i.existing_image;

  if (mode === 'all' || mode === 'generate') {
    const refsCache = new Map();
    for (const i of (p.plan.images ?? []).filter((x) => x.source === 'generate' && pick(x))) {
      const pr = prompts[i.id];
      if (!pr) { summary.errors.push(`${i.id}: no prompt in ${FILES.prompts}`); continue; }
      if (i.file && fs.existsSync(path.join(p.dir, i.file)) && !force) { summary.skipped.push(`${i.id} (already generated)`); continue; }
      const refs = (pr.reference_images?.length ? pr.reference_images : p.input?.existing_product_images ?? []).slice(0, MAX_REFERENCES);
      const size = sizeFor(pr.aspect_ratio);
      if (dryRun) { log(`[dry-run] ${i.id}: ${size}, ${refs.length} reference image(s), prompt ${pr.prompt.length} chars`); continue; }
      try {
        const references = [];
        for (const r of refs) {
          if (!refsCache.has(r)) refsCache.set(r, await loadReference(r, p.dir));
          references.push(refsCache.get(r));
        }
        log(`→ ${i.id} generating (${size}, ${references.length} reference image(s))…`);
        const { png, model } = await openaiImage({ prompt: pr.prompt, size, references });
        fs.mkdirSync(imgDir, { recursive: true });
        fs.writeFileSync(path.join(imgDir, `${i.id}.png`), png);
        i.file = `images/${i.id}.png`;
        i.generated = { model, size, at: new Date().toISOString() };
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
        const r = await shopifyUpload({ buffer: fs.readFileSync(path.join(p.dir, i.file)), filename: `${slug}-${i.id}.png`, alt: i.purpose });
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

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = parseArgs(process.argv.slice(2));
  const [slug, mode = 'all'] = a._;
  if (!slug || !['all', 'generate', 'upload'].includes(mode)) {
    console.error('Usage: node scripts/images.js <slug> [generate|upload|all] [--only IMG-02,IMG-03] [--force] [--dry-run]');
    process.exit(1);
  }
  try {
    const s = await runImages(slug, { mode, only: typeof a.only === 'string' ? a.only.split(',') : null, force: !!a.force, dryRun: !!a['dry-run'] });
    console.log(`\n✓ generated: ${s.generated.join(', ') || '—'}\n✓ uploaded:  ${s.uploaded.join(', ') || '—'}`);
    if (s.skipped.length) console.log(`  skipped:   ${s.skipped.join(', ')}`);
    s.errors.forEach((e) => console.log(`✗ ${e}`));
    process.exit(s.errors.length ? 1 : 0);
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  }
}
