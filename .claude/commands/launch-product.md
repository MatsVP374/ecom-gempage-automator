---
description: Volledige Adina launch — facts → angle → founder-letter GemPage (met reviews) → beeldplan + prompts → beelden → HE build → spellingcheck → QC → creatives → package
argument-hint: <slug> [--force]
---

Voer de volledige Adina Fashion launch-pipeline uit voor: `$ARGUMENTS`

1. Lees `CLAUDE.md`, `config/adina.json` en alle bestanden in `brand/`.
2. Het product moet bestaan in `products/<slug>/input.json`. Zo niet: verwijs naar `/new-launch` en stop.
3. **Input-poort:** `node scripts/validate.js <slug> --stage input`. Errors → meld elk ontbrekend veld als
   `MISSING INPUT: <veld>` en STOP. Niets verzinnen.
4. Voer stap 1 t/m 10 uit (stap 8 bestaat niet meer) volgens de tabel in `CLAUDE.md`, telkens met de instructies uit
   `prompts/<nr>-*.md`. Sla stappen met bestaande output over, tenzij `--force`.
   - Stap 1 met `status: "missing_input"` → STOP en meld.
   - Stap 5b = `node scripts/images.js <slug>` (Gemini of OpenAI → Shopify). Mislukt het, neem de foutmelding op als
     flag `IMAGES NOT GENERATED — …` en ga door.
   - Stap 6b (spellingcheck, `prompts/06b-spellcheck.md`) na stap 6 en opnieuw na stap 9.
   - Stap 6c (Hebreeuwse natuurlijkheid, `prompts/06c-hebrew-naturalness.md`) direct na elke 6b, en als laatste vóór
     een upload als de Hebreeuwse tekst daarna nog is veranderd. Standaard: `brand/hebrew-copy.md`.
   - Geen ad copy schrijven: die maakt de gebruiker zelf.
5. Na stap 6 en 9 en aan het eind: `node scripts/validate.js <slug>` → fix errors tot 0.
6. `node scripts/export.js <slug>`.
7. Rapporteer met de eindchecklist uit `CLAUDE.md`. Niets naar Shopify pushen tenzij gevraagd.
