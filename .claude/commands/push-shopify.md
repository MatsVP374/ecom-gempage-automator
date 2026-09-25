---
description: Zet een gevalideerd product als DRAFT in Shopify
argument-hint: <slug>
---

Product: `$ARGUMENTS`

1. `node scripts/validate.js <slug>` moet 0 errors geven, anders stoppen en melden.
2. `node scripts/shopify-push.js <slug>` (dry-run) en laat de gebruiker de payload-samenvatting zien.
3. Vraag bevestiging. Pas na "ja": `node scripts/shopify-push.js <slug> --push`.
   Ontbreken `SHOPIFY_STORE_DOMAIN`/`SHOPIFY_ADMIN_TOKEN`, dan mag je de Shopify MCP-connector
   gebruiken met exact dezelfde velden uit `output/shopify-product.json` (status DRAFT).
4. Meld de product-ID/admin-URL. Nooit op ACTIVE zetten zonder expliciete opdracht.
