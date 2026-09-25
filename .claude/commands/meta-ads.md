---
description: Schrijf (opnieuw) de 2 long-form testimonial Meta-ads voor een product
argument-hint: <slug> [extra instructies]
---

Argumenten: `$ARGUMENTS`

Voer stap 8 uit (`prompts/08-meta-ads.md`) voor het product. Lees eerst `brand/ad-system.md` en
`brand/testimonial-rules.md`. Vereist: `02-central-angle.json` en `03-gempage-copy.he.json` bestaan
(anders eerst `/launch-product`). Neem extra instructies mee zonder de testimonial-regels te breken.
Draai daarna `node scripts/validate.js <slug>` (fix errors) en `node scripts/export.js <slug>`.
Laat daarna de inhoud van `products/<slug>/output/meta-ads.md` zien.
