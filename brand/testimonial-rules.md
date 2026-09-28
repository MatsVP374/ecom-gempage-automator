# Testimonial-regels (reviews in de GemPage)

Reviews komen **alleen** uit `input.testimonials` (door de gebruiker aangeleverd, met bron).
Ze staan op de GemPage **onder elke voordeelfoto** (`benefits[].review`) en in `social_proof.quotes`.

## Letterlijk
De klant staat **tussen aanhalingstekens**, dus alleen een **letterlijk fragment** (inkorten mag, herschrijven niet).
In het Hebreeuws woord voor woord uit `text`, of uit `text_he` als de review in een andere taal is; de validator
controleert dat. De EN-master mag een vertaling tonen.

## Kiezen
- Kies per voordeel de review die **dát voordeel** noemt (licht in de hitte, pasvorm, combineren, kleur…).
- Elk fragment maar één keer op de pagina.
- Winkel-/bestelervaringen (verpakking, service, terugkomen) passen bij `social_proof`, niet onder een productfoto.
- Geen passende review → geen review onder die foto (flag `REVIEWS PER PHOTO: x/6`). Nooit een review
  "verbuigen" naar een voordeel dat de klant niet noemt.

## Je mag NIET verzinnen
naam · leeftijd · sterren · bron · situaties · resultaten. Naam, leeftijd en sterren typ je nooit in de copy: de
GemPage haalt ze zelf uit `input.testimonials` (geen naam → "לקוחה של Adina Fashion", geen rating → geen sterren).
Leeftijd alleen als de klant die zelf opgeeft.

## Aangeleverde reviews met `benefit` (Activepieces) en mockups
Levert de input een testimonial met `benefit: n`, dan is de keuze al gemaakt: die review hoort onder foto n.
- De GemPage zet hem daar **zelf**, **volledig en letterlijk** (`text`, met de aangeleverde `name` en `rating`).
  Claude kiest niet, kort niet in, herschrijft, vertaalt of corrigeert niet. In de copy staat bij dat voordeel dus
  **geen** `review` (de validator geeft een error als het wel zo is).
- Twee reviews voor hetzelfde voordeel → error. Een `benefit` zonder bijbehorend voordeel → warning, niet getoond.
- Zonder `benefit` blijft het oude pad: Claude kiest per voordeel een passend letterlijk fragment.

**Mockups** (`mockup: true`, uit `reviews.type: MOCKUP_PLACEHOLDER`) zijn gegenereerde teksten, geen klanten:
- alleen op een **draft die niet gepubliceerd wordt** (`input.mockup_reviews_allowed: true`, gezet door de bridge bij
  `publish: false`). Zonder die vlag worden ze niet gerenderd en geeft de validator een error;
- alleen via hun `benefit`; nooit in `social_proof`, nooit geciteerd in de copy;
- de draft ziet er **precies zo uit als de uiteindelijke pagina** (voor design-QA): geen zichtbaar label of banner.
  Intern blijven ze herkenbaar: `mockup: true` in `input.json`, `data-review="mockup"` op de kaart,
  `data-reviews="mockup"` op `.gp-page`, `reviews.rendered_as: "mockup"` in het resultaat. Juist omdat je het niet
  ziet, publiceert de workflow zo'n pagina nooit (hieronder) en publiceer je hem ook niet met de hand in GemPages;
- **nooit bewijs** voor productfeiten of claims (stap 1 neemt ze niet op in `01-product-facts.json` → `testimonials`);
- `node scripts/validate.js <slug> --stage publish` faalt zolang er een mockup op de pagina staat: zo'n pagina wordt
  nooit gepubliceerd.
