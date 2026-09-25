# Feitenregels — nooit verzinnen

## Bronnen die tellen
1. `products/<slug>/input.json` (door de gebruiker aangeleverd)
2. De bestaande productpagina (`input.existing_product_page`: url en/of geplakte content)
3. De bestaande productbeelden (alleen wat je er echt op ziet)
4. `config/adina.json` (globale merkfeiten)
5. Aangeleverde testimonials (alleen voor klantervaringen)

Niets anders is een bron. Ook "gebruikelijk voor dit soort product" niet.

## Nooit verzinnen
materiaal / samenstelling · kleuren · maten · pasvorm · functies · prijzen · kortingspercentages ·
voorraad / schaarste · medische of gezondheidsvoordelen · verzending · retour · productprestaties
(warmte, duurzaamheid, "kreukt niet", "wast perfect") · reviews · klantaantallen.

## Wat je wél mag
- Een aangeleverd feature vertalen naar een **logisch praktisch effect** zonder nieuwe claim.
  "Full button closure" → "je kunt hem open of dicht dragen" ✓.
  "Soft knit" → "houdt je warm bij 10 graden" ✗ (prestatieclaim die niet is aangeleverd).
- Kleurnamen vertalen naar het Hebreeuws.
- Het centrale probleem formuleren op basis van input + productfeiten.

## Als iets ontbreekt
- **Verplicht inputveld ontbreekt** → STOP. Meld: `MISSING INPUT: <veld> — nodig voor <waarom>`.
- **Niet-verplicht maar nuttig** → zet in `01-product-facts.json` → `missing`, schrijf eromheen
  zonder aannames, en noem het in het QA-rapport.
- **Onzeker/tegenstrijdig** (pagina zegt X, input zegt Y) → `unverified`, gebruik de veilige formulering,
  input gaat voor.
- **Testimonial ontbreekt of is te dun** → `TESTIMONIAL DATA INSUFFICIENT` (zie `testimonial-rules.md`).
