# Beeldregels — GemPage image plan, prompts, statische creatives

## GemPage image plan (stap 4)
De bestaande productfoto's worden **niet opnieuw gegenereerd**. De vraag is: *welke beelden heeft
deze advertorial nodig om het verhaal te bewijzen?* Meestal **7**. Elk beeld hoort bij een specifiek
GemPage-blok. Geen willekeurige mooie foto's.

| # | role | blok | Wat het bewijst |
|---|---|---|---|
| 1 | `hero` | `hero` | Vrouw 50–65 draagt/gebruikt het product, Tel Aviv of passende lifestyle-setting, product ruim genoeg in beeld om het te begrijpen, natuurlijk licht, spontaan |
| 2 | `benefit_detail` | `benefits` #n | Bewijst voordeel #1 (bv. materiaal, zachtheid, vorm) |
| 3 | `functional_detail` | `benefits` #n | Bewijst een belangrijke feature (bv. voetbed, laagjes, knopen) |
| 4 | `functional_detail_2` | `benefits` #n | Een andere feature (bv. gesp, kap, mouw) |
| 5 | `real_life_use` | `benefits` #n | Product echt in gebruik in een dagelijkse situatie |
| 6 | `variation` | `benefits` #n of `social_proof` | Andere vrouw en/of andere **echte** kleur, niet hetzelfde model als de hero |
| 7 | `packing` | `packing` | Product, Adina's inpaktafel, handen, kraft/zijdepapier, eventueel andere echte kleuren op de achtergrond |

Als een bestaand productbeeld een rol al goed dekt (bv. een scherpe detailfoto), zet dan
`source: "existing"` met `existing_image`. Niet opnieuw genereren.

Variatie: niet elke foto hetzelfde model, dezelfde setting of dezelfde kleur. Kleuren alleen uit input.

## Image-generation prompt (stap 5)
Elke foto met `source: "generate"` krijgt één losse, production-ready prompt. Minimaal deze velden:

`subject` · `age` · `product` · `exact_color` · `styling` · `action` · `environment` · `framing` ·
`light` · `mood` · `must_be_visible` · `realism` · `must_not_change`

Vorm van de volledige `prompt` (Engels):
```
Create a realistic candid lifestyle photograph of an Israeli woman approximately 58–63 years old
wearing [PRODUCT — exact description from facts] in [EXACT COLOR].
She is [ACTION].
Setting: [SETTING].
The [SPECIFIC FEATURE] must be clearly visible because this photograph will accompany the section
explaining [BENEFIT].
Natural daylight. Realistic skin texture. Normal body proportions. Small Tel Aviv boutique/lifestyle
photography. Not glossy fashion advertising. No text in image.
The product design must remain consistent with the supplied reference images. Do not invent
additional buttons, pockets, seams, materials or decorative elements.
```
- Beschrijf het product alleen met geverifieerde feiten en wat zichtbaar is op de referentiebeelden.
- `reference_images` = de bestaande productbeelden die de generator als referentie moet gebruiken.
- Altijd: "No text in image", normale lichaamsverhoudingen, echte huidstructuur, geen AI-glans.

## Statische Meta-creatives (stap 9)
Niet simpelweg de GemPage-foto's hergebruiken. Vier creatives, allemaal binnen **dezelfde centrale
angle** (geen nieuwe funnel):

| id | type | Wat |
|---|---|---|
| A | `customer_discovery` | Spontane lifestyle-shot die visueel past bij Ad 1 |
| B | `raw_boutique_offer` | Product in boetiekomgeving, prijs mag zichtbaar zijn, authentiek eerder dan gepolijst |
| C | `everyday_use` | Product echt in gebruik, **andere** situatie/model/kleur dan A, zodat het account niet vier bijna identieke creatives test |
| D | `designed_hook` | Product prominent + de centrale probleem-hook als tekst (`overlay_text_he`), bv. `למה נעל נוחה צריכה להיראות אורתופדית?`, met hooguit enkele voordelen + het aanbod |
