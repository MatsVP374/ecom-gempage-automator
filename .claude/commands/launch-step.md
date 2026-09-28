---
description: Voer één stap van de Adina-pipeline (opnieuw) uit
argument-hint: <slug> <facts | angle | gempage | image-plan | image-prompts | images | gempage-he | spellcheck | naturalness | qc | creatives | package> [extra instructies]
---

Argumenten: `$ARGUMENTS`

Stappen → prompts: `facts` 01 · `angle` 02 · `gempage` 03 · `image-plan` 04 · `image-prompts` 05 ·
`gempage-he` 06 · `spellcheck` 06b · `naturalness` 06c · `qc` 07 · `creatives` 09 · `package` 10 ·
`images` = `node scripts/images.js <slug> [--provider gemini|openai] [--force] [--only IMG-02]` (geen prompt, alleen het script) ·
`images compare` = `node scripts/images.js <slug> compare` (hero met Gemini én OpenAI naast elkaar).

Lees `CLAUDE.md`, `config/adina.json` en `brand/`. Voer alleen de genoemde stap uit met
`prompts/<nr>-*.md` en neem extra instructies van de gebruiker mee (bv. "D-overlay korter",
"benefit 3 concreter"). Overschrijf de output van díe stap; dat is een expliciete opdracht.

Na `angle` (stap 2): meld welke latere bestanden nu niet meer op de angle aansluiten. Pas ze niet ongevraagd aan.
Na `gempage` (stap 3): de Hebreeuwse build (stap 6) kan verouderd zijn; meld dat.
Na `gempage-he` of `creatives`: draai ook `spellcheck` (06b) en daarna `naturalness` (06c).
Daarna `node scripts/validate.js <slug>` en `node scripts/export.js <slug>`.
