---
description: Volledige Adina launch — facts → angle → founder-letter GemPage → beeldplan + prompts → HE build → QC → 2 Meta-ads → creatives → package
argument-hint: <slug> [--force]
---

Voer de volledige Adina Fashion launch-pipeline uit voor: `$ARGUMENTS`

1. Lees `CLAUDE.md`, `config/adina.json` en alle bestanden in `brand/`.
2. Het product moet bestaan in `products/<slug>/input.json`. Zo niet: verwijs naar `/new-launch` en stop.
3. **Input-poort:** `node scripts/validate.js <slug> --stage input`. Errors → meld elk ontbrekend veld als
   `MISSING INPUT: <veld>` en STOP. Niets verzinnen.
4. Voer stap 1 t/m 10 uit volgens de tabel in `CLAUDE.md`, telkens met de instructies uit
   `prompts/<nr>-*.md`. Sla stappen met bestaande output over, tenzij `--force`.
   - Stap 1 met `status: "missing_input"` → STOP en meld.
   - Stap 8 zonder bruikbare testimonial → `status: "blocked"` + flag, ga door met 9–10.
5. Na stap 6, 8 en 9 en aan het eind: `node scripts/validate.js <slug>` → fix errors tot 0.
6. `node scripts/export.js <slug>`.
7. Rapporteer met de eindchecklist uit `CLAUDE.md`. Niets naar Shopify pushen tenzij gevraagd.
