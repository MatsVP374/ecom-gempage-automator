import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { setProductsDir, loadProduct } from '../scripts/lib.js';
import { runImages, sizeFor, pickProvider } from '../scripts/images.js';
import { buildGempages, zip } from '../scripts/gempages.js';
import { writeDemo } from './fixture.js';

// ---- mock OpenAI + Shopify + staged-upload target ----
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const calls = [];
let server;
let base;
before(async () => {
  server = http.createServer((req, res) => {
    let body = [];
    req.on('data', (c) => body.push(c));
    req.on('end', () => {
      body = Buffer.concat(body);
      const text = body.toString('latin1');
      calls.push({ method: req.method, url: req.url, auth: req.headers.authorization ?? req.headers['x-shopify-access-token'], text });
      const json = (o) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };
      if (req.url === '/ref.jpg') { res.writeHead(200, { 'content-type': 'image/jpeg' }); return res.end(PNG); }
      if (req.url === '/v1/images/edits' || req.url === '/v1/images/generations') return json({ data: [{ b64_json: PNG.toString('base64') }] });
      if (req.url.startsWith('/v1beta/models/') && req.url.endsWith(':generateContent'))
        return json({ candidates: [{ content: { parts: [{ text: 'here you go' }, { inlineData: { mimeType: 'image/jpeg', data: PNG.toString('base64') } }] } }] });
      if (req.url === '/upload') { res.writeHead(204); return res.end(); }
      if (req.url === '/graphql') {
        const q = JSON.parse(text).query;
        if (q.includes('stagedUploadsCreate'))
          return json({ data: { stagedUploadsCreate: { stagedTargets: [{ url: `${base}/upload`, resourceUrl: `${base}/resource/1`, parameters: [{ name: 'key', value: 'k1' }] }], userErrors: [] } } });
        if (q.includes('fileCreate')) return json({ data: { fileCreate: { files: [{ id: 'gid://shopify/MediaImage/1', fileStatus: 'UPLOADED', image: null }], userErrors: [] } } });
        if (q.includes('node(')) return json({ data: { node: { fileStatus: 'READY', image: { url: 'https://cdn.shopify.com/s/files/test.png' }, fileErrors: [] } } });
      }
      res.writeHead(404); res.end();
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
  Object.assign(process.env, {
    OPENAI_API_KEY: 'sk-test', OPENAI_BASE_URL: `${base}/v1`, SHOPIFY_ADMIN_TOKEN: 'shpat_test',
    SHOPIFY_GRAPHQL_URL: `${base}/graphql`, SHOPIFY_FILE_POLL_MS: '5', GEMINI_BASE_URL: `${base}/v1beta`,
  });
  delete process.env.GEMINI_API_KEY;
  delete process.env.IMAGE_PROVIDER;
});
after(() => server.close());

let dir;
beforeEach(() => {
  calls.length = 0;
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adina-img-'));
  setProductsDir(dir);
});

test('sizeFor maps aspect ratios to OpenAI sizes', () => {
  assert.equal(sizeFor('1:1'), '1024x1024');
  assert.equal(sizeFor('4:5'), '1024x1536');
  assert.equal(sizeFor('3:2'), '1536x1024');
});

test('images: generates with reference photos, uploads to Shopify, writes CDN urls into the plan', async () => {
  const slug = writeDemo(dir, (d) => {
    d.plan.images.forEach((i) => delete i.url);
    d.plan.images[6].source = 'existing';
    d.plan.images[6].existing_image = 'https://example.com/demo-1.jpg';
    d.input.existing_product_images = ['https://example.com/demo-1.jpg'];
    d.prompts.prompts = d.prompts.prompts.filter((x) => x.image_id !== 'IMG-07');
    d.prompts.prompts.forEach((x) => (x.reference_images = [`${base}/ref.jpg`]));
  });
  const s = await runImages(slug, { provider: 'openai', log: () => {} });
  assert.deepEqual(s.errors, []);
  assert.equal(s.generated.length, 6, 'existing photo must not be regenerated');
  assert.equal(s.uploaded.length, 6);
  const edits = calls.filter((c) => c.url === '/v1/images/edits');
  assert.equal(edits.length, 6);
  assert.equal(edits[0].auth, 'Bearer sk-test');
  assert.match(edits[0].text, /name="image\[\]"/);
  assert.match(edits[0].text, /name="model"\r\n\r\ngpt-image-1/);
  assert.match(edits[0].text, /name="size"\r\n\r\n1024x1536/);
  assert.equal(calls.filter((c) => c.url === '/ref.jpg').length, 1, 'reference image downloaded once and cached');
  assert.equal(calls.filter((c) => c.url === '/upload').length, 6);
  assert.ok(calls.filter((c) => c.url === '/graphql').every((c) => c.auth === 'shpat_test'));
  const plan = loadProduct(slug).plan;
  assert.ok(plan.images.slice(0, 6).every((i) => i.url === 'https://cdn.shopify.com/s/files/test.png' && fs.existsSync(path.join(dir, slug, i.file))));
  assert.equal(plan.images[6].url, 'https://example.com/demo-1.jpg');
  assert.equal(loadProduct(slug).steps.find((x) => x.id === 'images').done, true);

  // second run is idempotent
  calls.length = 0;
  const again = await runImages(slug, { provider: 'openai', log: () => {} });
  assert.equal(again.generated.length + again.uploaded.length, 0);
  assert.equal(calls.length, 0);
});

test('images: without reference photos it uses images/generations; errors are collected, not thrown', async () => {
  const slug = writeDemo(dir, (d) => {
    d.plan.images.forEach((i) => delete i.url);
    d.input.existing_product_images = [];
    d.prompts.prompts.forEach((x) => (x.reference_images = []));
    d.prompts.prompts.pop();
  });
  const s = await runImages(slug, { mode: 'generate', provider: 'openai', log: () => {} });
  assert.equal(calls.filter((c) => c.url === '/v1/images/generations').length, 6);
  assert.ok(s.errors.some((e) => /IMG-07: no prompt/.test(e)));
});

test('provider selection: explicit > IMAGE_PROVIDER > gemini when its key is set > openai', () => {
  assert.equal(pickProvider(), 'openai');
  process.env.GEMINI_API_KEY = 'g-test';
  assert.equal(pickProvider(), 'gemini');
  process.env.IMAGE_PROVIDER = 'openai';
  assert.equal(pickProvider(), 'openai');
  assert.equal(pickProvider('gemini'), 'gemini');
  assert.throws(() => pickProvider('midjourney'), /unknown image provider/);
  delete process.env.IMAGE_PROVIDER;
  delete process.env.GEMINI_API_KEY;
});

test('gemini: sends prompt + reference photos + aspect ratio, saves the returned JPEG, uploads it', async () => {
  process.env.GEMINI_API_KEY = 'g-test';
  try {
    const slug = writeDemo(dir, (d) => {
      d.plan.images.forEach((i) => delete i.url);
      d.prompts.prompts.forEach((x) => (x.reference_images = [`${base}/ref.jpg`]));
    });
    const s = await runImages(slug, { provider: 'gemini', only: ['IMG-01', 'IMG-02'], log: () => {} });
    assert.deepEqual(s.errors, []);
    assert.deepEqual(s.generated, ['IMG-01', 'IMG-02']);
    const reqs = calls.filter((c) => c.url === '/v1beta/models/gemini-3.1-flash-image:generateContent');
    assert.equal(reqs.length, 2);
    assert.equal(calls.find((c) => c.url.startsWith('/v1beta')).auth, undefined, 'key goes in x-goog-api-key, not Authorization');
    const body = JSON.parse(reqs[0].text);
    assert.deepEqual(body.generationConfig.responseModalities, ['IMAGE']);
    assert.equal(body.generationConfig.imageConfig.aspectRatio, '4:5');
    assert.equal(body.contents[0].parts.filter((x) => x.inline_data).length, 1);
    assert.match(body.contents[0].parts[0].text, /Test prompt/);
    const plan = loadProduct(slug).plan;
    assert.equal(plan.images[0].file, 'images/IMG-01.jpg');
    assert.equal(plan.images[0].generated.provider, 'gemini');
    assert.equal(plan.images[0].url, 'https://cdn.shopify.com/s/files/test.png');
    assert.ok(calls.some((c) => c.url === '/graphql' && /IMG-01\.jpg/.test(c.text) && /image\/jpeg/.test(c.text)));
  } finally {
    delete process.env.GEMINI_API_KEY;
  }
});

test('gemini key missing → clear error before any network call', async () => {
  const slug = writeDemo(dir, (d) => d.plan.images.forEach((i) => delete i.url));
  await assert.rejects(runImages(slug, { provider: 'gemini', log: () => {} }), /GEMINI_API_KEY is not set/);
  assert.equal(calls.length, 0);
});

test('compare: hero with both providers into images/compare, plan untouched', async () => {
  process.env.GEMINI_API_KEY = 'g-test';
  try {
    const slug = writeDemo(dir, (d) => {
      d.plan.images.forEach((i) => delete i.url);
      d.prompts.prompts.forEach((x) => (x.reference_images = [`${base}/ref.jpg`]));
    });
    const before = fs.readFileSync(path.join(dir, slug, '04-gempage-image-plan.json'), 'utf8');
    const s = await runImages(slug, { mode: 'compare', log: () => {} });
    assert.deepEqual(s.errors, []);
    assert.ok(fs.existsSync(path.join(dir, slug, 'images/compare/IMG-01.gemini.jpg')));
    assert.ok(fs.existsSync(path.join(dir, slug, 'images/compare/IMG-01.openai.png')));
    assert.equal(fs.readFileSync(path.join(dir, slug, '04-gempage-image-plan.json'), 'utf8'), before);
    assert.equal(calls.filter((c) => c.url === '/upload').length, 0);
  } finally {
    delete process.env.GEMINI_API_KEY;
  }
});

// ---- .gempages ----
function unzip(buf) {
  const files = {};
  let i = 0;
  while (buf.readUInt32LE(i) === 0x04034b50) {
    const method = buf.readUInt16LE(i + 8);
    const size = buf.readUInt32LE(i + 18);
    const nameLen = buf.readUInt16LE(i + 26);
    const extra = buf.readUInt16LE(i + 28);
    const name = buf.toString('utf8', i + 30, i + 30 + nameLen);
    const data = buf.subarray(i + 30 + nameLen + extra, i + 30 + nameLen + extra + size);
    files[name] = method === 8 ? zlib.inflateRawSync(data) : data;
    i += 30 + nameLen + extra + size;
  }
  return files;
}

test('zip writer round-trips', () => {
  const f = unzip(zip([{ name: 'a.txt', data: 'שלום' }, { name: 'b.bin', data: PNG }]));
  assert.equal(f['a.txt'].toString(), 'שלום');
  assert.deepEqual(f['b.bin'], PNG);
});

test('.gempages has the GemPages export_v2 structure, valid checksum and our HTML/CSS', () => {
  const slug = writeDemo(dir);
  const r = buildGempages(loadProduct(slug));
  const outer = unzip(r.file);
  assert.deepEqual(Object.keys(outer).sort(), [`1_${r.pageId}.zip`, 'manifest.json', 'pages_info.zip'].sort());
  assert.equal(JSON.parse(outer['manifest.json']).export_version, 'export_v2');
  const info = unzip(outer['pages_info.zip'])['pages_info.json'].toString();
  assert.match(info, new RegExp(`"id":${r.pageId},`), 'page id is a raw 18-digit number');
  const pageText = unzip(outer[`1_${r.pageId}.zip`])[`1_${r.pageId}.json`].toString();
  assert.match(pageText, new RegExp(`^\\{"id":${r.pageId},`));
  const page = JSON.parse(pageText);
  const sec = page.pageSections[0];
  assert.equal(sec.checksum, crypto.createHash('sha256').update(sec.component).digest('hex'));
  assert.equal(page.handle, 'demo-cardigan-founder-letter');
  assert.equal(page.type, 'GP_STATIC');
  const code = JSON.parse(sec.component).childrens[0].childrens[0];
  assert.equal(code.tag, 'CSSCode');
  const { html, css } = code.advanced.editorData;
  assert.match(css, /\{\{rootClassName\}\}/);
  assert.match(html, /class="gp-green-banner">הערה מעדינה/);
  assert.match(html, /https:\/\/cdn\.example\.com\/demo\/IMG-01\.png/);
  assert.match(html, /<span class="gp-ltr">2,550\+<\/span>/);
  assert.doesNotMatch(html, /פיקטיביות|gp-disclosure/, 'no fictitious-review disclosure: we never add fake reviews');
});

test('.gempages refuses images without a URL unless explicitly allowed', () => {
  const slug = writeDemo(dir, (d) => delete d.plan.images[2].url);
  assert.throws(() => buildGempages(loadProduct(slug)), /IMG-03/);
  const r = buildGempages(loadProduct(slug), { allowMissingImages: true });
  assert.deepEqual(r.missingImages, ['IMG-03']);
});
