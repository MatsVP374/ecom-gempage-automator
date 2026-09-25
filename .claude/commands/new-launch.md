---
description: Nieuwe Adina product launch — productinput verzamelen, input.json maken en ontbrekende velden flaggen
argument-hint: [geplakte productinput of productnaam]
---

New Adina product launch. Input van de gebruiker: `$ARGUMENTS`

1. Lees `CLAUDE.md`, `config/adina.json`, `brand/fact-rules.md` en `templates/product-input.md`.
2. Heeft de gebruiker (nog) geen productinput geplakt, laat dan de template uit
   `templates/product-input.md` zien en vraag om die in te vullen. Stop.
3. Zet de geplakte input om naar `products/<slug>/input.json` volgens het datacontract in `CLAUDE.md`:
   - `slug`: korte Engelse kebab-case van de productnaam (bv. `mila-cardigan`).
   - Neem waarden **letterlijk** over. Prijzen als getallen. Kleuren/maten/features als lijsten.
   - Testimonials: `id` t1, t2…; `name`/`age` alleen als aangeleverd, anders `null`; `text` letterlijk.
   - Onbekend = leeg laten (`null` / `[]` / `""`). Niets aanvullen.
   - Maak de map via `node scripts/new-product.js <slug>` en schrijf daarna het volledige `input.json`.
4. Draai `node scripts/validate.js <slug> --stage input` en toon de ontbrekende verplichte velden als
   `MISSING INPUT: <veld>`, en of er testimonials zijn (zonder testimonials worden de ads geblokkeerd).
5. Is de input compleet, vraag dan of je `/launch-product <slug>` moet starten.
