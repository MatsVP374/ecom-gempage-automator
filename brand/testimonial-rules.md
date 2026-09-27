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
