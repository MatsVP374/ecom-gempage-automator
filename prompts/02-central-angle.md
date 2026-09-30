# Stap 2: Marketing angle → `02-central-angle.json` (single source of truth)

Lees: `01-product-facts.json`, `input.json` (vooral `central_problem_hint`, `known_customer_problems`),
`brand/adina.md` (vooral het founder-verhaal: Adina is selectief), `brand/customer-avatar.md`, `config/adina.json`.

Beantwoord eerst de 10 vragen (`questions`):
1. `who`: voor wie is dit product?
2. `everyday_problem`: welk dagelijks probleem ervaart ze?
3. `current_workaround`: wat doet ze nu in plaats daarvan?
4. `why_frustrating`: waarom is dat alternatief frustrerend?
5. `what_changes`: wat verandert dit product?
6. `enabling_features`: welke feature-id's maken dat mogelijk? (uit stap 1)
7. `adina_observation`: wat is Adina's observatie na 15+ jaar in de mode?
8. `core_belief`: wat is het sterkste geloof achter het product, in één zin?
9. `easiest_comparison`: welke vergelijking maakt het product het makkelijkst te begrijpen?
10. `why_now`: hoe wordt het aanbod gebracht? Alleen `input.sale_reason` als die is aangeleverd; anders een tijdelijke
    introductie-/boetiekprijs voor deze selectie, zonder reden. Nooit zelf einde seizoen, opruiming, sluiting,
    overtollige/beperkte voorraad, "eerste lading" of schaarste aannemen.

Leg dan de angle vast:
`central_problem` · `customer_insight` · `product_solution` · `adina_belief` · `core_promise` ·
`old_alternative_a` · `old_alternative_b` · `why_now` · `founder_letter_hook`.

En het verhaal waarom dít product een plek in Adina's selectie verdiende (`selection_story`, zie `brand/adina.md`):
- `opening`: hoe de brief opent, één van `skepticism` · `curiosity` · `familiar_problem` · `surprising_detail` ·
  `disappointing_alternatives` · `overlooked`. Kies wat bij dít product past; niet elke brief met scepsis.
- `hook`: Adina's eigen, productspecifieke eerste gedachte (vers geschreven, geen voorbeeldzin hergebruiken).
- `real_problem`: wat ze aan dit soort producten vaak niet goed vindt / waar vrouwen mee worstelen (= `central_problem`,
  uit de aangeleverde strategie en feiten).
- `what_changed_her_mind` + `turning_point_feature_ids`: welke geverifieerde details haar van gedachten deden
  veranderen, en welk alledaags voordeel dat oplevert.
- `why_selected`: waarom ze het met een gerust hart aan haar klanten aanbeveelt en het een plek in haar boetiek gaf.
- `real_life`: waar het in de dag, garderobe of routine van de klant past.
- `offer_framing`: `supplied_sale_reason` (alleen als `input.sale_reason` gevuld is) of `introductory_offer`.
Geen verzonnen gebeurtenissen: niet dat Adina het zelf droeg/testte (tenzij aangeleverd), geen klantreacties,
verkoopcijfers, voorraad, inkoopverhalen of redenen voor de korting. `founder_letter_hook` = de `hook` in één zin.

Voorbeeld (alleen ter illustratie, niet hergebruiken):
```
Problem:       Too cool for just a blouse, too warm for a coat.
Alternatives:  Blouse only ↔ heavy coat
Solution:      The layer in between.
Adina belief:  A useful wardrobe piece should adapt as the day changes.
Opening:       overlooked: "I almost walked past it on the rail. Another in-between layer, I thought."
Offer:         introductory boutique price (no sale_reason supplied).
```

Tot slot `benefits`: de 5–6 sterkste voordelen, elk als
`human_problem → feature_ids → practical_effect → real_life_benefit → situations`.
Elk voordeel moet traceren naar feature-id's uit stap 1. Effecten zijn logische gevolgen van het
feature, geen nieuwe prestatieclaims (zie `brand/fact-rules.md`).

Er is **één** centraal probleem. Alles wat hierna komt (GemPage, beelden, creatives, en de ads die de gebruiker schrijft) gebruikt deze angle.

**Aangeleverde strategie en reviews:** staan er in `input.extra_info` key benefits en hebben testimonials een `benefit`,
houd de voordelen dan in die volgorde (voordeel n = key benefit n), zodat review `benefit: n` onder de juiste foto komt.
