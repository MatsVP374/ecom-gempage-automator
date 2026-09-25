#!/usr/bin/env node
// Create a product in Shopify as DRAFT from products/<slug>.
// Usage: node scripts/shopify-push.js <slug>            (dry run: prints the payload summary)
//        node scripts/shopify-push.js <slug> --push     (really creates it)
// Env: SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_TOKEN, SHOPIFY_API_VERSION (see .env.example)
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadProduct, loadEnv, parseArgs, esc, writeJSON } from './lib.js';
import { validateProduct } from './validate.js';

// Short Hebrew description for Shopify's body; the full page lives in the adina.pdp metafield.
function descriptionHtml(page) {
  const sec = (t) => page.sections?.find((s) => s.type === t);
  const features = sec('features');
  const size = sec('size_guide');
  const parts = [`<div dir="${esc(page.dir)}">`, `<p>${esc(page.subtitle)}</p>`];
  parts.push(`<ul>${(page.bullets ?? []).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`);
  if (features) parts.push(`<h3>${esc(features.title)}</h3><ul>${features.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`);
  if (size)
    parts.push(
      `<h3>${esc(size.title)}</h3><table><tr>${size.headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>${size.rows
        .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
        .join('')}</table>${size.note ? `<p>${esc(size.note)}</p>` : ''}`,
    );
  parts.push('</div>');
  return parts.join('\n');
}

export function buildShopifyPayload(p) {
  const prod = p.product;
  const he = p.page.he;
  if (!prod || !he) throw new Error('product.json and page.he.json are required');
  const sizes = prod.specs?.sizes ?? [];
  const colors = (prod.specs?.colors ?? []).map((c) => (typeof c === 'string' ? c : c.he || c.en));
  const options = [];
  if (sizes.length) options.push({ name: 'מידה', values: sizes });
  if (colors.length) options.push({ name: 'צבע', values: colors });
  const images = (p.input?.images ?? []).filter((u) => /^https?:\/\//.test(u));

  // Cartesian product of option values -> variants.
  let combos = [[]];
  for (const o of options) combos = combos.flatMap((c) => o.values.map((v) => [...c, { optionName: o.name, name: v }]));
  const variants = options.length
    ? combos.map((optionValues) => ({ optionValues, price: String(prod.pricing.price), compareAtPrice: prod.pricing.compare_at ? String(prod.pricing.compare_at) : null }))
    : [];

  return {
    product: {
      title: prod.full_title_he,
      handle: prod.shopify?.handle,
      descriptionHtml: descriptionHtml(he),
      vendor: prod.shopify?.vendor ?? 'Adina',
      productType: prod.shopify?.product_type,
      tags: prod.shopify?.tags ?? [],
      status: 'DRAFT',
      seo: { title: he.seo?.title, description: he.seo?.description },
      productOptions: options.map((o) => ({ name: o.name, values: o.values.map((name) => ({ name })) })),
      metafields: [
        { namespace: 'adina', key: 'pdp', type: 'json', value: JSON.stringify(he) },
        ...(p.page.en ? [{ namespace: 'adina', key: 'pdp_en', type: 'json', value: JSON.stringify(p.page.en) }] : []),
        { namespace: 'adina', key: 'name_en', type: 'single_line_text_field', value: prod.full_title_en ?? '' },
      ],
    },
    media: images.map((originalSource) => ({ originalSource, mediaContentType: 'IMAGE' })),
    price: { price: String(prod.pricing.price), compareAtPrice: prod.pricing.compare_at ? String(prod.pricing.compare_at) : null },
    variants,
  };
}

async function gql(query, variables) {
  const { SHOPIFY_STORE_DOMAIN: shop, SHOPIFY_ADMIN_TOKEN: token, SHOPIFY_API_VERSION: v = '2025-07' } = process.env;
  const res = await fetch(`https://${shop}/admin/api/${v}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.errors) throw new Error(`Shopify ${res.status}: ${JSON.stringify(body.errors ?? body).slice(0, 500)}`);
  return body.data;
}

const userErrors = (r, what) => {
  if (r.userErrors?.length) throw new Error(`${what}: ${r.userErrors.map((e) => `${e.field?.join('.')}: ${e.message}`).join('; ')}`);
};

export async function pushToShopify(slug) {
  loadEnv();
  if (!process.env.SHOPIFY_STORE_DOMAIN || !process.env.SHOPIFY_ADMIN_TOKEN)
    throw new Error('SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_TOKEN must be set in .env');
  const v = validateProduct(slug);
  if (v.errors.length) throw new Error(`${slug} has ${v.errors.length} validation errors — run node scripts/validate.js ${slug}`);
  const payload = buildShopifyPayload(loadProduct(slug));

  const created = await gql(
    `mutation($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
      productCreate(product: $product, media: $media) {
        product { id handle variants(first: 1) { nodes { id } } }
        userErrors { field message }
      }
    }`,
    { product: payload.product, media: payload.media },
  );
  userErrors(created.productCreate, 'productCreate');
  const product = created.productCreate.product;

  if (payload.variants.length) {
    const r = await gql(
      `mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkCreate(productId: $productId, variants: $variants, strategy: REMOVE_STANDALONE_VARIANT) {
          productVariants { id } userErrors { field message }
        }
      }`,
      { productId: product.id, variants: payload.variants },
    );
    userErrors(r.productVariantsBulkCreate, 'productVariantsBulkCreate');
  } else {
    const r = await gql(
      `mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) { userErrors { field message } }
      }`,
      { productId: product.id, variants: [{ id: product.variants.nodes[0].id, ...payload.price }] },
    );
    userErrors(r.productVariantsBulkUpdate, 'productVariantsBulkUpdate');
  }

  const numericId = product.id.split('/').pop();
  const result = {
    id: product.id,
    handle: product.handle,
    status: 'DRAFT',
    admin_url: `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/products/${numericId}`,
    pushed_at: new Date().toISOString(),
  };
  writeJSON(path.join(loadProduct(slug).dir, 'output', 'shopify-result.json'), result);
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = parseArgs(process.argv.slice(2));
  const slug = a._[0];
  if (!slug) {
    console.error('Usage: node scripts/shopify-push.js <slug> [--push]');
    process.exit(1);
  }
  try {
    if (!a.push) {
      const pl = buildShopifyPayload(loadProduct(slug));
      console.log('DRY RUN — nothing sent. Add --push to create the product as DRAFT.\n');
      console.log(`title        ${pl.product.title}`);
      console.log(`handle       ${pl.product.handle}`);
      console.log(`price        ₪${pl.price.price}${pl.price.compareAtPrice ? ` (compare ₪${pl.price.compareAtPrice})` : ''}`);
      console.log(`options      ${pl.product.productOptions.map((o) => `${o.name}: ${o.values.map((x) => x.name).join('/')}`).join(' · ') || '—'}`);
      console.log(`variants     ${pl.variants.length || 1}`);
      console.log(`images       ${pl.media.length}`);
      console.log(`tags         ${pl.product.tags.join(', ')}`);
      console.log(`metafields   ${pl.product.metafields.map((m) => `${m.namespace}.${m.key}`).join(', ')}`);
      console.log(`status       DRAFT`);
    } else {
      const r = await pushToShopify(slug);
      console.log(`✓ Created DRAFT ${r.handle}\n  ${r.admin_url}`);
    }
  } catch (e) {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  }
}
