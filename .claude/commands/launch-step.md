---
description: Voer één pipeline-stap (opnieuw) uit voor een product
argument-hint: <slug> <stap 1-8 | research | positioning | page | hebrew | angles | copy | creatives | qa>
---

Argumenten: `$ARGUMENTS`

Lees `CLAUDE.md` en `brand/`. Voer alleen de genoemde stap uit voor het genoemde product,
met de instructies uit het bijbehorende `prompts/0X-*.md`. Overschrijf de bestaande output van
díe stap (dit is een expliciete opdracht). Controleer of latere stappen nu inconsistent zijn
(bv. nieuwe naam/prijs) en meld dat — pas ze niet ongevraagd aan.
Draai daarna `node scripts/validate.js <slug>` en `node scripts/export.js <slug>`.
