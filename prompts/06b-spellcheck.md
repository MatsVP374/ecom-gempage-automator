# Stap 6b: Hebreeuwse spellingcheck → `03-gempage-spellcheck.json`

Lees: `03-gempage-copy.he.json`, en als ze bestaan `07-creative-plan.json` (`overlay_text_he`),
`08-ugc.json` (`voice_he`). Plus `brand/hebrew-style.md` en `brand/hebrew-spelling.json`.

Draai deze stap na stap 6 én opnieuw na stap 9 (de validator waarschuwt als een tekst nieuwer is dan de check).

1. **Automatische check:** `node scripts/spellcheck.js <slug>`. Fix elke ERROR direct in het bronbestand
   (sluitletters, aan elkaar geplakt Hebreeuws/Latijn, dubbele woorden, bekende spelfouten).
2. **Proeflezen als Israëlische eindredacteur.** Lees elke Hebreeuwse zin en controleer:
   - spelling (volledig ktiv male, Academie-spelling: `הכול`, `מאוד`, `מצוין`, `גזרה`) en één spelling per woord binnen het product;
   - grammatica: geslacht en getal kloppen (bijv. naamwoord ↔ bijvoeglijk naamwoord, `החולצה נוחה`);
   - de lezer wordt aangesproken in **vrouwelijk enkelvoud** (`את`, `תרגישי`, `בדקי`);
   - Adina schrijft in de ik-vorm als vrouw (`אני יודעת`, `הרגשתי`), klanten zijn vrouwelijk meervoud (`הלקוחות שלי אומרות`);
   - voorzetsels en maqaf: `ב־₪179`, `מ־15`; leestekens en spaties; geen nikud; geen vertaalzinnen uit het Engels;
   - vaste teksten uit `config/adina.json` en `input.hebrew_product_name` blijven **letterlijk** staan, ook als je ze anders zou schrijven
     (twijfel? zet het in `doubts`).
3. Verbeter fouten direct in het bronbestand. Verander **geen inhoud**: geen nieuwe claims, prijzen, feiten of zinnen,
   alleen spelling, grammatica en natuurlijkheid van de formulering.
4. Kom je een fout tegen die de automatische check had moeten vangen (een spelfout die vaker voorkomt), voeg hem toe aan
   `brand/hebrew-spelling.json` → `misspellings`.
5. Schrijf `03-gempage-spellcheck.json`:

```json
{
  "status": "fixed",
  "checked": ["03-gempage-copy.he.json", "07-creative-plan.json"],
  "corrections": [
    { "file": "03-gempage-copy.he.json", "at": "benefits.items[2].text", "before": "…", "after": "…", "reason": "gender agreement" }
  ],
  "doubts": [{ "text": "…", "question": "Wat de mens moet beslissen (bv. schrijfwijze van de productnaam)" }]
}
```
`status` = `clean` (niets gevonden) of `fixed` (verbeteringen gedaan). `doubts` worden flags in de validator.

6. `node scripts/spellcheck.js <slug>` en `node scripts/validate.js <slug>` → 0 spelling-errors.
