# Stap 6c: Hebreeuwse natuurlijkheid → `03-gempage-naturalness.json`

Lees: `brand/hebrew-copy.md` (de standaard), `brand/adina.md`, `03-gempage-copy.he.json`, en als ze bestaan
`07-creative-plan.json` (`overlay_text_he`) en `08-ugc.json` (`voice_he`). Ter controle van de feiten:
`03-gempage-copy.en.json`, `02-central-angle.json`, `01-product-facts.json`.

Draai deze stap na 6b, na stap 9, en **altijd als laatste vóór de upload** (stap 11) als er daarna nog iets aan de
Hebreeuwse tekst is veranderd.

Je bent nu een Israëlische copywriter voor een boetiek, niet een vertaler en niet een corrector. 6b heeft spelling en
grammatica al gedaan; hier gaat het om: **klinkt dit als echte Israëlische marketingtekst voor vrouwen van 45–65+?**

1. `node scripts/spellcheck.js <slug>` en bekijk de `phrasing`- en `repetition`-meldingen: dat zijn de eerste
   kandidaten.
2. Lees de pagina van boven naar beneden **hardop** (in je hoofd), als de lezeres. Beoordeel elke zin met de vier
   vragen uit `brand/hebrew-copy.md` → *De maatstaf*. Let extra op:
   - koppen (hoofdkop, ondertitel, voordeel-koppen, sectietitels): conversational, emotioneel natuurlijk, niet alle
     in dezelfde bouw;
   - woorden die als vertaling zijn gekozen in plaats van het woord dat Israëlische vrouwen in die context gebruiken
     (bv. `מסודרת` voor "stijlvol");
   - AI-patronen en vertaalconstructies uit de lijst;
   - vrouwelijke grammatica en congruentie met het product.
3. **Herschrijf** elke zin die technisch klopt maar niet natuurlijk klinkt, direct in het bronbestand. Behoud:
   betekenis, feiten, prijzen, claims, `id`s, blokstructuur, beeld-ID's, en de vaste teksten en reviewfragmenten
   (die meld je alleen, zie `brand/hebrew-copy.md` → *Wat niet verandert*). Geen nieuwe claims.
4. Na herschrijven: `node scripts/spellcheck.js <slug>` (0 errors) en `node scripts/validate.js <slug>` (0 errors).
5. Schrijf `03-gempage-naturalness.json`:

```json
{
  "status": "rewritten",
  "checked": ["03-gempage-copy.he.json", "07-creative-plan.json"],
  "rewrites": [
    { "file": "03-gempage-copy.he.json", "at": "headline.headline", "before": "…", "after": "…",
      "reason": "vertaalde constructie (why not both) / onnatuurlijk woord / AI-patroon / stijf / herhaling" }
  ],
  "kept": [{ "text": "…", "why": "gemelde phrasing, maar hier natuurlijk" }],
  "doubts": [{ "text": "…", "question": "vaste tekst uit config klinkt onnatuurlijk — aanpassen in config?" }]
}
```
`status` = `clean` (alles klinkt al natuurlijk) of `rewritten`. Elke `phrasing`-melding die blijft staan, staat in
`kept` met de reden. `doubts` worden flags in de validator.
