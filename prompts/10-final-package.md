# Stap 10: Final launch package → `09-qa-report.md` (compleet) + `output/`

1. `node scripts/validate.js <slug>` → 0 errors (fix wat nodig is).
2. `node scripts/export.js <slug>` → `output/`, inclusief `output/<slug>-founder-letter.gempages`.
   Controleer in `output/launch-package.md` dat alle beelden een Shopify-URL hebben; zo niet, flag
   `IMAGES NOT GENERATED — <welke IMG's>` (de `.gempages` bevat dan placeholders).
3. Vul `09-qa-report.md` aan met `## Stap 10: Final QA`:

TESTIMONIAL
☐ Echte bron aangeleverd? ☐ Geen verzonnen ervaringen? ☐ Naam/leeftijd alleen als aangeleverd? ☐ Betekenis behouden?

ADS
☐ Precies 2? ☐ Verschillende verhalen? ☐ Zelfde GemPage-angle? ☐ Prijs laat? ☐ Founder-letter-brug?
☐ Geen onbewezen claims?

OFFER
☐ Verzending correct (gratis, Israel Post)? ☐ Retour 30 dagen? ☐ Bundel 10/15/20/25? ☐ Reviews/rating correct (4.7/5, 2,550+)?

CREATIVES
☐ 4 statics, zelfde angle? ☐ Kleuren uit input? ☐ UGC volgens input?

Plus: `## Flags` (alles wat ontbreekt/geblokkeerd is, bv. TESTIMONIAL DATA INSUFFICIENT, MISSING INPUT)
en `## Voor de mens` (bv. echte reviews in het GemPages-widget, beelden genereren en plaatsen,
ontbrekende testimonial aanleveren).

Kan een feit niet worden geverifieerd uit input/config → **FLAG IT**. Niet gokken.

4. Rapporteer met de eindchecklist uit `CLAUDE.md`.
