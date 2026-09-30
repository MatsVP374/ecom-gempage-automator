# GemPage blueprint — de vaste founder-letter advertorial

De landingspagina is een **advertorial / brief van Adina**, geen standaard productpagina.
**De GemPage begint nooit met het product als verkoop.** Kernidee (`brand/adina.md` → founder-verhaal): Adina is
selectief, en de brief legt uit **waarom dít product een plek in haar selectie verdiende**. Pas later wordt de pagina
commercieel.

Verhaal: PERSOONLIJKE HOOK (aarzeling/scepsis/nieuwsgierigheid) → HET ECHTE PROBLEEM → WAT HAAR VAN GEDACHTEN DEED
VERANDEREN → WAAROM ZE HET KOOS → ECHT LEVEN (voordelen + foto's) → AANBOD → PERSOONLIJKE AFSLUITING.
Niet: PRODUCT → 50% OFF → BUY NOW → FEATURE LIST.

De lezer denkt achtereenvolgens: *"Dat herken ik"* → *"Wat zag Adina erin?"* → *"Als zij het goed genoeg vindt…"*
→ pas later: *"Dat is eigenlijk een goed aanbod."*

Vaste Hebreeuwse teksten komen uit `config/adina.json` → `landing_page`.
Blokken hieronder = de `type`s in `03-gempage-copy.*.json`, in deze volgorde.

---

### 1. `founder_header`
- `byline`: `מכתב מעדינה · מייסדת Adina Fashion`
- `place_date`: `תל אביב · <maand jaar>` (Hebreeuwse maandnaam, uit `input.launch_month`)
- `note` (groene banner): `הערה מעדינה — <centrale probleem, kort>`
- `badge`: `מכתב מהמייסדת`

### 2. `headline`
Grote headline vanuit Adina's hook of het probleem dat de klant herkent (bv. haar aanvankelijke twijfel over dit
soort items). Subtitle die nieuwsgierig maakt naar wat Adina van gedachten deed veranderen.
Niet openen met korting, specificaties of "koop nu". Geen productnaam in header/headline.

### 3. `hero`
Lifestyle-foto (image plan `hero`): casting volgens `brand/image-rules.md` → Casting, natuurlijke Israëlische/Tel
Aviv-omgeving, product duidelijk zichtbaar, realistisch. Niet fashion-editorial, niet zichtbaar AI.

### 4. `founder_story`
`greeting`: `שלום, אני עדינה.` De `parts` in deze volgorde (uit `02-central-angle.json` → `selection_story`):
1. `hook`: Adina's persoonlijke, productspecifieke eerste gedachte: aarzeling, scepsis, nieuwsgierigheid, een bekend
   klantprobleem, een verrassend detail, een teleurstellend alternatief, of dat ze het stuk eerst over het hoofd zag.
2. `problem`: wat ze aan dit soort producten vaak niet goed vindt / waar vrouwen mee worstelen (het centrale probleem)
3. `turning_point`: de specifieke details van dít product die haar van gedachten deden veranderen (ontdekking, geen specs)
4. `selection`: waarom het een plek in haar boetiek kreeg: het lost het probleem op zoals zij het wil aanbevelen

Het product (type, "deze trui") mag vanaf de hook genoemd worden; de **productnaam** pas vanaf `turning_point`.
Geen twee brieven met dezelfde opening of zinsbouw. De 15+ jaar staan al in de byline en `about`; alleen noemen als
het de hook natuurlijk sterker maakt.

**Kort houden.** Elk deel 1–2 korte zinnen (max ~120 tekens), het hele verhaal max ~550 tekens. De kop max ~70
tekens. De lezer moet snel bij de voordelen en foto's zijn.

### 5. `benefits`: 5–6 genummerde blokken
Elk blok: `n`, een **benefit-headline** (menselijk probleem, geen feature), korte uitleg in Adina's stem
volgens **FEATURE → PRACTICAL EFFECT → REAL-LIFE BENEFIT**, `feature_ids` (bron), en een `image` die
dat voordeel bewijst.

❌ `#3 Verstelbare gesp. Hij heeft een verstelbare gesp.`
✓ `#3 Omdat niet elke vrouw dezelfde voet heeft.` De verstelbare gesp laat je…

Altijd menselijk probleem → feature. Nooit andersom.

**Onder elke foto een echte review** (zoals in de Anzhela-brief): een kort, letterlijk fragment van een klant die
dát voordeel noemt, met haar naam (en leeftijd/sterren) uit `input.testimonials`, anders "לקוחה של Adina Fashion".
Geen passende echte review → geen review onder die foto (de validator meldt `REVIEWS PER PHOTO: x/6`).
Review 1 mag één klantachtige foto in de reviewkaart hebben (`review_image`, beeldrol `customer_review`); die verschijnt
alleen als review 1 zelf getoond wordt, en nooit met een mockup-review op een gepubliceerde pagina.

### 6. `comparison`
Titel in de trant van: `<product>, vergeleken met de keuzes die vrouwen normaal maken`.
Drie kolommen: **OLD OPTION A** vs **OLD OPTION B** vs **PRODUCT** (productkolom wordt gehighlight).
Maximaal 4–5 vergelijkingspunten, alle gebaseerd op feiten.
Voorbeelden: Elegante schoen vs. orthopedische schoen vs. <product> · Alleen een blouse vs. zware jas vs. <product>.

### 7. `founder_quote`
Eén zin die de hele positionering samenvat, in de geest van:
*"Ik vind niet dat een vrouw [ongewenst compromis] zou moeten accepteren, alleen omdat ze [gewenste uitkomst] wil."* — עדינה
Niet letterlijk die constructie. Hij moet natuurlijk bij het product passen.

### 8. `sale`: het aanbod
Geen apart groot prijsblok: de prijs staat in de tekst, in de trust bar en in de productbox. Dat is genoeg.
Nu pas gaan we verkopen, rustig. Flow: het stuk hoort nu bij Adina's selectie → reguliere prijs → saleprijs.
- **Met `input.sale_reason`**: die reden (en alleen die) mag genoemd worden.
- **Zonder `input.sale_reason`**: een tijdelijke introductie-/boetiekprijs voor deze selectie (bv. "voor de introductie
  in de boetiek geldt nu een speciale prijs"), zonder een reden voor de korting te verzinnen.
- Nooit uit jezelf: einde seizoen, opruiming, sluiting, overtollige of beperkte voorraad, "eerste lading", schaarste,
  afteltijd. `availability_note` alleen met echte, aangeleverde beschikbaarheidsinfo. De validator blokkeert zulke
  redenen als ze niet in `input.sale_reason` staan.

### 9. `trust_bar`: vier blokken
Standaard: `₪<sale>` / מחיר מבצע · `15+` / שנים באופנה · `2,550+` / ביקורות · `30` / ימים להחזרה.
Waarden uit input + config.

### 10. `packing`
Foto (image plan `packing`): product, houten inpaktafel, kraftdoos, zijdepapier, volwassen handen,
kleine boetiek, eventueel andere **echte** kleuren op de achtergrond.
Caption in de stijl van: `ארוזה ומוכנה לצאת. כל הזמנה נארזת בקפידה ובאהבה…`
Doel: herinneren dat dit uit Adina's boetiek komt.

### 11. `founder_observation`
Nog een korte persoonlijke gedachte van Adina: waarom ze dit stuk met een gerust hart in haar selectie heeft (of hoe
het in het leven van haar klanten past). Geen verzonnen klantreacties.

### 12. `social_proof`
`★★★★★ 4.7/5` · `2,550+ ביקורות` + korte boutique/trust-copy. `quotes` alleen uit
`input.testimonials` (letterlijk), **maximaal één**: de reviews staan al onder de foto's. Kies een winkelervaring
(terugkomen, verpakking, service). Nooit reviews verzinnen.
In GemPages kan hier het echte review-widget (Judge.me/Loox) staan.

### 13. `offer_box`: de productbox, hier bestelt ze
Geen verhaal meer, alleen: dit is het, zo kies je. De GemPage bouwt de box **vast** op (niet per product schrijven):
```
פאיו | טופ יום נעים                  ← offer_box.product_name = input.hebrew_product_name
★★★★★ 4.7/5
~~₪359~~ ₪179
✓ כחול, ירוק, אפור וסגול              ← input.colors
✓ מידות S–3XL                         ← input.sizes (eerste–laatste)
✓ משלוח חינם
✓ 30 יום להחזרה
[ לבחירת מידה וצבע של פאיו ← ]        ← grote contrasterende knop naar de productpagina
```
`rating_line` blijft in de data (`★★★★★ 4.7/5 מתוך 2,550+ ביקורות`) voor de copy-export.

### 14. `bundle`
Vast (uit config), nooit anders:
```
2 פריטים — 10% הנחה נוספת
3 פריטים — 15% הנחה נוספת
4 פריטים — 20% הנחה נוספת
5 פריטים ומעלה — 25% הנחה נוספת
```

### 15. `cta`
`cta.button` = de knop in de productbox: `לבחירת מידה וצבע של <korte naam> ←` (1 kleur: `לבחירת מידה של <korte naam> ←`),
uit `config.landing_page.cta_he`. `subtext`: verzending/retour.

### 16. `about`
`אודות הכותבת`. Kort: Adina → oprichter → 15+ jaar → familieboetiek in Tel Aviv, samen met Daniel en Yael
(`config.founder.family`) → korte persoonlijke
gedachte over dit product → `מתל אביב, באהבה!` (de persoonlijke afsluiting, vaste merkstijl)

### 17. `sticky_cta`
`<korte naam> עכשיו ב־₪<sale> — לבחירת מידה וצבע` (1 kleur: `— לבחירת מידה`), uit `config.landing_page.sticky_cta_he`.
Altijd zichtbaar onderaan, linkt **rechtstreeks naar de productpagina** (niet naar een anker).

## Productroutes: nooit laten zoeken waar ze kan kopen
De brief verkoopt met het verhaal, maar zodra ze overtuigd is moet de weg naar maat/kleur meteen zichtbaar zijn.
Elke GemPage heeft **twee vaste routes** naar `input.existing_product_page.url` (de validator telt ze):
1. **De knop in de productbox** (`cta.button`), groot en contrasterend.
2. **De sticky CTA** onderaan (`sticky_cta`), altijd zichtbaar.
Geen extra tussen-CTA's in het verhaal: die maken de brief onrustig.
`<korte naam>` = het deel van `hebrew_product_name` vóór `|` (bv. `פאיו`). Zonder product-URL faalt de validatie.

---

## Mapping naar de 26 GemPage-elementen
1 byline · 2 plaats/datum · 3 groene banner · 4 badge → `founder_header` · 5–6 → `headline` ·
7 → `hero` · 8–10 → `founder_story` · 11–12 → `benefits` (+ beelden) · 13 → `comparison` ·
14 → `founder_quote` · 15–16 → `sale` · 17 → `trust_bar` · 18 → `packing` · 19 → `founder_observation` ·
20 → `social_proof` · 21–22 → `offer_box` · 23 → `bundle` · 24 → `cta` · 25 → `about` · 26 → `sticky_cta`.
