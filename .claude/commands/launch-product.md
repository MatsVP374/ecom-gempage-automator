---
description: Volledige launch — van leverancier-URL tot Hebreeuwse PDP, ads, creatives, QA en export
argument-hint: <slug | supplier-URL> [--force] [key=value ...]
---

Voer de volledige Adina launch-pipeline uit voor: `$ARGUMENTS`

1. Lees `CLAUDE.md` en alle bestanden in `brand/`.
2. Bepaal het product:
   - Is het argument een bestaande map in `products/`? Gebruik die.
   - Is het een URL of een nieuwe slug? Leid een korte Engelse kebab-case slug af en draai
     `node scripts/new-product.js <slug> --url <url> [--price N] [--cost N] [--category X] [--notes "..."]`
     met de key=value-argumenten die de gebruiker meegaf. Ontbreekt de verkoopprijs, kies er
     een volgens `brand/adina.md` en meld dat.
3. Voer stap 1 t/m 8 uit volgens de tabel in `CLAUDE.md`, telkens met de instructies uit het
   bijbehorende `prompts/0X-*.md`. Sla stappen met bestaande output over, tenzij `--force`.
4. Draai `node scripts/validate.js <slug>` en fix errors tot 0.
5. Draai `node scripts/export.js <slug>`.
6. Rapporteer met de eindchecklist uit `CLAUDE.md`. Niets naar Shopify pushen tenzij gevraagd.
