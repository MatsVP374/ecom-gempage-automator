---
description: Genereer (extra) angles, ad copy en creative briefs voor een product
argument-hint: <slug> [bv. "3 extra angles voor Rosh Hashana"]
---

Argumenten: `$ARGUMENTS`

Lees `CLAUDE.md`, `brand/`, en `products/<slug>/product.json` + `page.he.json`.
Zonder extra instructies: voer stap 5, 6 en 7 uit (overschrijven).
Met extra instructies (bv. extra angles voor een seizoen): **voeg toe** aan de bestaande
`ads.json`/`creatives.md` met nieuwe unieke `id`'s, verwijder niets.
Draai `node scripts/validate.js <slug>` en `node scripts/export.js <slug>`; de Meta-CSV staat
daarna in `products/<slug>/output/meta-ads.csv`.
