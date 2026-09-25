---
description: Voer één stap van de Adina-pipeline (opnieuw) uit
argument-hint: <slug> <facts | angle | gempage | image-plan | image-prompts | images | gempage-he | qc | meta-ads | creatives | package> [extra instructies]
---

Argumenten: `$ARGUMENTS`

Stappen → prompts: `facts` 01 · `angle` 02 · `gempage` 03 · `image-plan` 04 · `image-prompts` 05 ·
`gempage-he` 06 · `qc` 07 · `meta-ads` 08 · `creatives` 09 · `package` 10 ·
`images` = `node scripts/images.js <slug> [--force] [--only IMG-02]` (geen prompt, alleen het script).

Lees `CLAUDE.md`, `config/adina.json` en `brand/`. Voer alleen de genoemde stap uit met
`prompts/<nr>-*.md` en neem extra instructies van de gebruiker mee (bv. "Ad 2 met een andere opening",
"benefit 3 concreter"). Overschrijf de output van díe stap; dat is een expliciete opdracht.

Na `angle` (stap 2): meld welke latere bestanden nu niet meer op de angle aansluiten. Pas ze niet ongevraagd aan.
Na `gempage` (stap 3): de Hebreeuwse build (stap 6) en de ads kunnen verouderd zijn; meld dat.
Daarna `node scripts/validate.js <slug>` en `node scripts/export.js <slug>`.
