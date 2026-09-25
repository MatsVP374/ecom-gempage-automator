# GemPage blueprint — de vaste founder-letter advertorial

De landingspagina is een **advertorial / brief van Adina**, geen standaard productpagina.
**De GemPage begint nooit met het product.** Hij begint met een probleem dat ze herkent. Dan legt
Adina uit waarom ze naar iets beters zocht, en dan wordt het product de oplossing. Pas later wordt
de pagina commercieel.

Psychologie: PROBLEM → RECOGNITION → PERSONAL STORY → DISCOVERY → PRODUCT → SPECIFIC REAL-LIFE
BENEFITS → FOUNDER STORY → OFFER. Niet: PRODUCT → 50% OFF → BUY NOW → FEATURE LIST.

De lezer denkt achtereenvolgens: *"Dat is precies wat ik meemaak"* → *"Dat klinkt handig"* →
*"Ik wil weten wat Adina hierover zegt"* → pas later: *"Dat is eigenlijk een goed aanbod."*

Vaste Hebreeuwse teksten komen uit `config/adina.json` → `landing_page`.
Blokken hieronder = de `type`s in `03-gempage-copy.*.json`, in deze volgorde.

---

### 1. `founder_header`
- `byline`: `מכתב מעדינה · מייסדת Adina Fashion`
- `place_date`: `תל אביב · <maand jaar>` (Hebreeuwse maandnaam, uit `input.launch_month`)
- `note` (groene banner): `הערה מעדינה — <centrale probleem, kort>`
- `badge`: `מכתב מהמייסדת`

### 2. `headline`
Grote, **probleem-eerst** headline, gebaseerd op 15+ jaar ervaring + het probleem van de klant +
Adina's observatie. Subtitle die nieuwsgierig maakt naar wat Adina ontdekte.
Niet openen met korting, specificaties of "koop nu". Geen productnaam in header/headline.

### 3. `hero`
Lifestyle-foto (image plan `hero`): vrouw ±50–65, natuurlijke Israëlische/Tel Aviv-omgeving,
product duidelijk zichtbaar, realistisch, spontaan, volwassen. Niet fashion-editorial, niet zichtbaar AI.

### 4. `founder_story`
`greeting`: `שלום, אני עדינה.` De `parts` in deze volgorde:
1. `intro`: 15+ jaar boetiek in Tel Aviv
2. `observation`: wat ze klanten steeds hoort of ziet zeggen
3. `problem`: het specifieke dagelijkse probleem (het centrale probleem uit stap 2)
4. `alternatives`: waarom de bestaande opties (old alternative A/B) niet voldoen
5. `search`: waar Adina naar ging zoeken
6. `discovery`: de introductie van het product, als **conclusie** van haar zoektocht

### 5. `benefits`: 5–6 genummerde blokken
Elk blok: `n`, een **benefit-headline** (menselijk probleem, geen feature), korte uitleg in Adina's stem
volgens **FEATURE → PRACTICAL EFFECT → REAL-LIFE BENEFIT**, `feature_ids` (bron), en een `image` die
dat voordeel bewijst.

❌ `#3 Verstelbare gesp. Hij heeft een verstelbare gesp.`
✓ `#3 Omdat niet elke vrouw dezelfde voet heeft.` De verstelbare gesp laat je…

Altijd menselijk probleem → feature. Nooit andersom.

### 6. `comparison`
Titel in de trant van: `<product>, vergeleken met de keuzes die vrouwen normaal maken`.
Drie kolommen: **OLD OPTION A** vs **OLD OPTION B** vs **PRODUCT** (productkolom wordt gehighlight).
Maximaal 4–5 vergelijkingspunten, alle gebaseerd op feiten.
Voorbeelden: Elegante schoen vs. orthopedische schoen vs. <product> · Alleen een blouse vs. zware jas vs. <product>.

### 7. `founder_quote`
Eén zin die de hele positionering samenvat, in de geest van:
*"Ik vind niet dat een vrouw [ongewenst compromis] zou moeten accepteren, alleen omdat ze [gewenste uitkomst] wil."* — עדינה
Niet letterlijk die constructie. Hij moet natuurlijk bij het product passen.

### 8. `sale`: waarom het product nu in de aanbieding is
Nu pas gaan we echt verkopen. Flow: natuurlijke sale reason (`input.sale_reason`) → huidige situatie →
reguliere prijs → saleprijs → alleen **echte** urgentie/beschikbaarheid. Geen nep-schaarste.

### 9. `trust_bar`: vier blokken
Standaard: `₪<sale>` / מחיר מבצע · `15+` / שנים באופנה · `2,550+` / ביקורות · `30` / ימים להחזרה.
Waarden uit input + config.

### 10. `packing`
Foto (image plan `packing`): product, houten inpaktafel, kraftdoos, zijdepapier, volwassen handen,
kleine boetiek, eventueel andere **echte** kleuren op de achtergrond.
Caption in de stijl van: `ארוזה ומוכנה לצאת. כל הזמנה נארזת בקפידה ובאהבה…`
Doel: herinneren dat dit uit Adina's boetiek komt.

### 11. `founder_observation`
Nog een korte persoonlijke observatie van Adina over het product of haar klanten.

### 12. `social_proof`
`★★★★★ 4.7/5` · `2,550+ ביקורות` + korte boutique/trust-copy. `quotes` alleen uit
`input.testimonials` (letterlijk of trouw vertaald), anders leeg laten. Nooit reviews verzinnen.
In GemPages kan hier het echte review-widget (Judge.me/Loox) staan.

### 13. `offer_box`
Nu mag het een echte productpagina worden. `product_name` = `hebrew_product_name`,
`rating_line`: `★★★★★ 4.7/5 מתוך 2,550+ ביקורות`, reguliere prijs → saleprijs, 4–6 bullets:
✓ sterkste voordeel · ✓ tweede voordeel · ✓ belangrijke functionaliteit · ✓ verzending/retour · ✓ kleuren/maten.
Niet opnieuw het hele verhaal vertellen.

### 14. `bundle`
Vast (uit config), nooit anders:
```
2 פריטים — 10% הנחה נוספת
3 פריטים — 15% הנחה נוספת
4 פריטים — 20% הנחה נוספת
5 פריטים ומעלה — 25% הנחה נוספת
```

### 15. `cta`
Hoofd-CTA: `בדקי אם המידה והצבע שלך עדיין במלאי`. Is kleur niet relevant (maar 1 kleur):
`בדקי אם המידה שלך עדיין במלאי`.

### 16. `about`
`אודות הכותבת`. Kort: Adina → oprichter → 15+ jaar → familieboetiek in Tel Aviv → korte persoonlijke
gedachte over dit product → `מתל אביב, באהבה!`

### 17. `sticky_cta`
`<product> עכשיו ב־₪<sale> — בדקי אם המידה שלך עדיין במלאי`

---

## Mapping naar de 26 GemPage-elementen
1 byline · 2 plaats/datum · 3 groene banner · 4 badge → `founder_header` · 5–6 → `headline` ·
7 → `hero` · 8–10 → `founder_story` · 11–12 → `benefits` (+ beelden) · 13 → `comparison` ·
14 → `founder_quote` · 15–16 → `sale` · 17 → `trust_bar` · 18 → `packing` · 19 → `founder_observation` ·
20 → `social_proof` · 21–22 → `offer_box` · 23 → `bundle` · 24 → `cta` · 25 → `about` · 26 → `sticky_cta`.
