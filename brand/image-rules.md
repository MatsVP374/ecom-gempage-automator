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

## Casting (elke foto met mensen: GemPage, statics, UGC)
- **Israëlische vrouwen van 40–60.** `age` in de prompt ligt altijd tussen 40 en 60; varieer over de foto's (bv. 44, 50, 55, 58).
- **Ze moeten er echt Israëlisch uitzien**: warme olijf- tot licht-olijfkleurige huid, donkerbruine ogen, donkerbruin tot
  zwart haar (vaak golvend/krullend; grijze strepen mag). Afwisselen tussen Mizrachi- en Asjkenazisch-Israëlische looks.
- **Niet**: blond/platinablond, Noord-Europees of Scandinavisch uiterlijk, Amerikaans catalogusmodel, zilvergrijs "oma"-type.
- Andere mensen in beeld (familie, vriendinnen, man) zijn ook Israëliërs van 40–60 met dezelfde natuurlijke look.
- Omgeving herkenbaar Israëlisch: Tel Avivse flat of balkon met rolluiken, Jeruzalem-steen, shuk, café-terras.
- Elke prompt bevat daarom letterlijk de **castingzin** (zie hieronder). De validator controleert leeftijd en castingzin.

Castingzin (Engels, in elke prompt met een persoon):
```
Casting: a Jewish Israeli woman aged about [40–60], with a natural Israeli Mediterranean look — warm olive or
light-olive skin, dark brown eyes, dark brown to black hair. Not Northern European, not blonde, not an American
catalogue model. Any other people in the frame are also Israelis in their 40s to 60s with the same natural Israeli look.
```

## Echte foto, geen AI-look (elke prompt met een persoon)
AI-beelden verraden zich door een gladde huid, gouden licht, een romig wazige achtergrond met lichtbolletjes en een
geposeerde modellenglimlach. Daarom bevat elke prompt met een persoon letterlijk de **stijlzin** hieronder, en kies je
gewoon licht (middagzon, schaduw, raamlicht) en gewone plekken (buurtcafé, eigen woonkamer, straat met scooters)
in plaats van "golden hour", "string lights" of "dreamy". De validator controleert de stijlzin.

```
Photo style: an ordinary candid photo taken on a smartphone by a friend, not a professional shoot and not stock photography. Slightly imperfect framing, natural unretouched skin with visible pores, fine lines and wrinkles that fit her age, a few flyaway hairs, real fabric creases. Ordinary background with everyday details, only mildly out of focus (no creamy bokeh, no glowing light balls). Plain, uneven natural light (no golden-hour glow, no studio light, no HDR). No beauty filter, no airbrushing, no posed model smile. It must look like a real photo from an Israeli woman's phone, not like AI.
```

**Formaat: elke GemPage-foto is 4:5 (staand).** Geen mix van breed, vierkant en staand: op mobiel moet elke foto
even groot zijn. De GemPage toont ook bestaande productfoto's in 4:5 (bijgesneden). De validator geeft een error bij
een ander formaat. (Statics voor Meta mogen 4:5 of 9:16, zie `07-creative-plan`.)

Compositie die AI vaak verpest:
- **Geen spiegels of reflecties**: die leveren dubbele of vervormde mensen op. Wil je "outfit checken", laat haar dan
  naast de kast staan en de top gladstrijken.

## Image-generation prompt (stap 5)
Elke foto met `source: "generate"` krijgt één losse, production-ready prompt. Minimaal deze velden:

`subject` · `age` · `product` · `exact_color` · `styling` · `action` · `environment` · `framing` ·
`light` · `mood` · `must_be_visible` · `realism` · `must_not_change`

Vorm van de volledige `prompt` (Engels):
```
Create a realistic candid lifestyle photograph of an Israeli woman approximately [40–60] years old
wearing [PRODUCT — exact description from facts] in [EXACT COLOR].
She is [ACTION].
Setting: [SETTING].
The [SPECIFIC FEATURE] must be clearly visible because this photograph will accompany the section
explaining [BENEFIT].
[STIJLZIN] [CASTINGZIN] Normal body proportions. No text in image.
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
| A | `customer_discovery` | Spontane klant-lifestyle-shot (past bij een testimonial-ad) |
| B | `raw_boutique_offer` | Product in boetiekomgeving, prijs mag zichtbaar zijn, authentiek eerder dan gepolijst |
| C | `everyday_use` | Product echt in gebruik, **andere** situatie/model/kleur dan A, zodat het account niet vier bijna identieke creatives test |
| D | `designed_hook` | Product prominent + de centrale probleem-hook als tekst (`overlay_text_he`), bv. `למה נעל נוחה צריכה להיראות אורתופדית?`, met hooguit enkele voordelen + het aanbod |

## Alt-tekst in de GemPage
Een foto die direct naast haar eigen tekst staat (voordeelfoto onder de voordeelkop, verpakkingsfoto boven het
bijschrift) krijgt `alt=""`: die tekst beschrijft haar al, en een kopie in de alt verschijnt als dubbele tekst (bij
screenreaders, tekstextractie en als een beeld niet laadt). Alleen de hero heeft een eigen `hero.alt`.
Nooit de Engelse `purpose` uit het beeldplan als alt.
