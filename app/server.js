#!/usr/bin/env node
// Adina Product Launcher — local UI. Zero dependencies.
// npm start  →  http://localhost:3000
// "Generate" runs Claude Code headless (`claude -p "/launch-product <slug>"`) in this repo.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { ROOT, loadEnv, loadProduct, listSlugs, productDir, renderPageDocument } from '../scripts/lib.js';
import { createProduct } from '../scripts/new-product.js';
import { validateProduct } from '../scripts/validate.js';
import { exportProduct } from '../scripts/export.js';
import { buildShopifyPayload, pushToShopify } from '../scripts/shopify-push.js';

loadEnv();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const CLAUDE_BIN = process.env.CLAUDE_BIN || 'claude';

// slug -> { running, log: string[], started, finished, code }
const jobs = new Map();

const COMMANDS = {
  launch: (slug, extra) => `/launch-product ${slug}${extra ? ' ' + extra : ''}`,
  step: (slug, extra) => `/launch-step ${slug} ${extra}`,
  hebrew: (slug, extra) => `/translate-he ${slug}${extra ? ' ' + extra : ''}`,
  ads: (slug, extra) => `/ad-pack ${slug}${extra ? ' ' + extra : ''}`,
};

function runClaude(slug, mode, extra = '') {
  const existing = jobs.get(slug);
  if (existing?.running) throw new Error('A job is already running for this product');
  const build = COMMANDS[mode];
  if (!build) throw new Error(`Unknown mode "${mode}"`);
  if (mode === 'step' && !extra.trim()) throw new Error('Choose a step to re-run');
  const prompt = build(slug, extra.replace(/[\r\n]+/g, ' ').trim());
  const job = { running: true, log: [`$ claude -p "${prompt}"`], started: new Date().toISOString(), finished: null, code: null };
  jobs.set(slug, job);
  const logFile = path.join(productDir(slug), '.job.log');
  const add = (line) => {
    job.log.push(line);
    fs.appendFile(logFile, line + '\n', () => {});
  };
  fs.writeFileSync(logFile, job.log[0] + '\n');

  const child = spawn(
    CLAUDE_BIN,
    ['-p', prompt, '--output-format', 'stream-json', '--verbose', '--permission-mode', 'acceptEdits'],
    { cwd: ROOT, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let buf = '';
  child.stdout.on('data', (d) => {
    buf += d;
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (line) describeEvent(line).forEach(add);
    }
  });
  child.stderr.on('data', (d) => add(`! ${String(d).trim()}`));
  child.on('error', (e) => {
    add(`✗ Could not start "${CLAUDE_BIN}": ${e.message}. Is Claude Code installed and logged in?`);
    job.running = false;
    job.finished = new Date().toISOString();
    job.code = -1;
  });
  child.on('close', (code) => {
    add(code === 0 ? '✓ Claude finished' : `✗ Claude exited with code ${code}`);
    job.running = false;
    job.finished = new Date().toISOString();
    job.code = code;
  });
  return job;
}

// Turn one stream-json event into human-readable log lines.
function describeEvent(line) {
  let ev;
  try {
    ev = JSON.parse(line);
  } catch {
    return [line];
  }
  if (ev.type === 'assistant') {
    return (ev.message?.content ?? []).flatMap((c) => {
      if (c.type === 'text' && c.text.trim()) return [c.text.trim()];
      if (c.type === 'tool_use') {
        const inp = c.input ?? {};
        const target = inp.file_path ? path.relative(ROOT, inp.file_path) : inp.command ?? inp.url ?? inp.pattern ?? '';
        return [`→ ${c.name} ${String(target).slice(0, 140)}`];
      }
      return [];
    });
  }
  if (ev.type === 'result') return [`— ${ev.subtype ?? 'done'} · ${ev.num_turns ?? '?'} turns · $${(ev.total_cost_usd ?? 0).toFixed(2)}`];
  return [];
}

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
}

async function readBody(req) {
  let data = '';
  for await (const chunk of req) {
    data += chunk;
    if (data.length > 1e6) throw new Error('Body too large');
  }
  return data ? JSON.parse(data) : {};
}

const MIME = { '.html': 'text/html; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.csv': 'text/csv; charset=utf-8', '.json': 'application/json; charset=utf-8', '.log': 'text/plain; charset=utf-8' };

const summary = (slug) => {
  const p = loadProduct(slug);
  return { slug, title: p.product?.full_title_he ?? p.product?.full_title_en ?? slug, steps: p.steps, running: !!jobs.get(slug)?.running };
};

async function route(req, res) {
  const url = new URL(req.url, 'http://x');
  const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  const m = req.method;

  if (m === 'GET' && url.pathname === '/') return send(res, 200, fs.readFileSync(path.join(ROOT, 'app', 'index.html')), MIME['.html']);

  if (parts[0] !== 'api') return send(res, 404, { error: 'Not found' });

  // /api/products
  if (parts[1] === 'products' && parts.length === 2) {
    if (m === 'GET') return send(res, 200, listSlugs().map(summary));
    if (m === 'POST') {
      const b = await readBody(req);
      const n = (v) => (v === '' || v == null ? null : Number(v));
      createProduct(b.slug, { url: b.url, price: n(b.price), compare: n(b.compare), cost: n(b.cost), costCurrency: b.cost_currency, category: b.category, target: b.target, notes: b.notes });
      return send(res, 201, summary(b.slug));
    }
  }

  if (parts[1] === 'products' && parts[2]) {
    const slug = parts[2];
    productDir(slug); // validates slug
    if (!fs.existsSync(productDir(slug))) return send(res, 404, { error: `Unknown product ${slug}` });
    const action = parts[3];

    if (m === 'GET' && !action) {
      const p = loadProduct(slug);
      const job = jobs.get(slug);
      const outDir = path.join(p.dir, 'output');
      const outputs = fs.existsSync(outDir) ? fs.readdirSync(outDir).sort() : [];
      return send(res, 200, { ...p, dir: undefined, outputs, job: job ? { ...job, log: job.log.slice(-400) } : null });
    }
    if (m === 'GET' && action === 'preview') {
      const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'he';
      const page = loadProduct(slug).page[lang];
      if (!page) return send(res, 200, `<p style="font-family:sans-serif;padding:2em;color:#888">page.${lang}.json does not exist yet.</p>`, MIME['.html']);
      return send(res, 200, renderPageDocument(page), MIME['.html']);
    }
    if (m === 'GET' && action === 'output' && parts[4]) {
      const file = path.join(productDir(slug), 'output', path.basename(parts[4]));
      if (!fs.existsSync(file)) return send(res, 404, { error: 'Not found' });
      const type = MIME[path.extname(file)] ?? 'application/octet-stream';
      const headers = { 'Content-Type': type };
      if (url.searchParams.has('download')) headers['Content-Disposition'] = `attachment; filename="${slug}-${path.basename(file)}"`;
      res.writeHead(200, headers);
      return fs.createReadStream(file).pipe(res);
    }
    if (m === 'POST' && action === 'generate') {
      const b = await readBody(req);
      runClaude(slug, b.mode ?? 'launch', b.extra ?? '');
      return send(res, 202, { ok: true });
    }
    if (m === 'POST' && action === 'validate') return send(res, 200, validateProduct(slug));
    if (m === 'POST' && action === 'export') return send(res, 200, { files: exportProduct(slug) });
    if (m === 'POST' && action === 'shopify') {
      const b = await readBody(req);
      if (!b.push) {
        const pl = buildShopifyPayload(loadProduct(slug));
        return send(res, 200, { dryRun: true, title: pl.product.title, handle: pl.product.handle, price: pl.price, variants: pl.variants.length || 1, images: pl.media.length, tags: pl.product.tags, status: 'DRAFT' });
      }
      return send(res, 200, await pushToShopify(slug));
    }
  }
  return send(res, 404, { error: 'Not found' });
}

http
  .createServer((req, res) =>
    route(req, res).catch((e) => {
      if (!res.headersSent) send(res, 400, { error: e.message });
    }),
  )
  .listen(PORT, HOST, () => console.log(`Adina Product Launcher → http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`));
