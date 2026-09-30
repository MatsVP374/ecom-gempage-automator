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
De doelgroep is volwassen (45–65+), maar de beelden zijn **aspirationeel**: de vrouw op de foto is iemand die de
klant wil zijn, niet een afspiegeling van ouder worden. Volwassen en herkenbaar, maar jeugdig, verzorgd en stijlvol.

- **Aantrekkelijke Israëlische/mediterrane vrouwen van ongeveer 45–58.** `age` in de prompt ligt tussen 45 en 60
  (de validator geeft een error daarbuiten); de hoofdmoot 45–58.
- **Varieer de leeftijd over de foto's van één pagina**, in banden: bv. één rond 45–50, één rond 50–55, één rond
  55–60 (in `fields.age` en in de prompt: "aged about 47", "aged about 53", "aged about 57"). Niet elke foto dezelfde
  leeftijd; de validator waarschuwt als alle personen binnen 5 jaar van elkaar liggen.
- **Uitstraling:** stijlvol, gezond, energiek, zelfverzekerd en verzorgd. Warme mediterrane/Israëlische trekken
  (olijf- tot licht-olijfkleurige huid, donkerbruine ogen, donkerbruin tot zwart haar), een **flatterend, modern
  natuurlijk kapsel** (zachte slag, golvend of strak geknipt), **subtiele, elegante make-up**. Afwisselen tussen
  Mizrachi- en Asjkenazisch-Israëlische looks.
- **Echt en passend bij haar leeftijd:** realistische huidstructuur met poriën en leeftijdspassende trekken, maar niet
  aangezet: geen overdreven rimpels, geen "oud gemaakt" gezicht.
- **Styling:** moderne, elegante Israëlische styling die bij Adina Fashion past: het product (exact, zie
  productnauwkeurigheid) met eigentijdse, verzorgde combinaties en discrete accessoires (sieraad, tas, zonnebril).
- **Omgeving herkenbaar Israëlisch en verzorgd:** lichte Tel Avivse flat of balkon, Jeruzalem-steen, een mooi café-
  terras, de boulevard, een lichte boetiek.
- Andere mensen in beeld (vriendinnen, familie, partner) hebben dezelfde verzorgde Israëlische look, in hun 40s–50s.

**Vermijden** (nooit in de prompt vragen; de validator geeft een error op deze woorden buiten de vaste zinnen):
- er oud/bejaard uitziende modellen (`elderly`, `old woman`, `senior`), breekbaar of fragiel (`frail`);
- grijs/zilver haar als standaard (`grey/gray hair`, `silver hair`, `grey-haired`) — alleen als het product/de input
  daar echt om vraagt;
- overdreven rimpels of veroudering (`wrinkled`, `deep wrinkles`, `aged face`);
- het stereotiepe oma-/senior-beeld (`grandmother`, `granny`, `retiree`, rollator, breiwerk, schommelstoel);
- gedateerde kapsels of kleding (permanent, "mom haircut", ouderwetse vesten), onflatterende gezichtsuitdrukkingen
  (knijpogen, dubbele kin door camerahoek van onder, geforceerde grijns);
- kunstmatige beauty-filter- of plastic huid (airbrush, gladgestreken huid, "flawless skin").
- Ook niet: blond/platinablond, Noord-Europees of Scandinavisch uiterlijk, Amerikaans catalogusmodel.

Elke prompt met een persoon bevat daarom letterlijk de **castingzin** en de **stijlzin** hieronder. De validator
controleert beide, de leeftijd en de vermijdlijst.

Castingzin (Engels, in elke prompt met een persoon; vul de leeftijd per foto in):
```
Casting: a Jewish Israeli woman aged about [45–58], attractive, stylish and well-groomed, with a warm Israeli Mediterranean look — olive or light-olive skin, dark brown eyes, dark brown to black hair in a flattering, modern natural style, subtle elegant makeup. She looks healthy, energetic and confident: mature and relatable, yet youthful and aspirational. Not elderly, not frail, not a grandmother type, no grey or silver hair, no dated hairstyle or clothing. Not Northern European, not blonde, not an American catalogue model. Any other people in the frame are equally attractive, well-groomed Israelis in their 40s to 50s with the same look.
```

## Echte, flatterende foto — geen AI-look (elke prompt met een persoon)
Echt, maar op haar mooist: zoals een goede Israëlische boetiek haar eigen klanten fotografeert. AI-beelden verraden
zich door een plastic huid, gouden gloed, een romig wazige achtergrond met lichtbolletjes en een stijve modellenpose;
een onflatterende telefoonfoto (hard middaglicht, lelijke hoek, moe gezicht) maakt de vrouw juist ouder. Daarom
bevat elke prompt met een persoon letterlijk de **stijlzin** hieronder. Kies zacht, flatterend daglicht (open schaduw,
helder raamlicht, zachte ochtend- of namiddagzon) en mooie, gewone plekken; niet "golden hour", "string lights" of
"dreamy". De validator controleert de stijlzin.

```
Photo style: a natural, flattering lifestyle photo, like an Israeli fashion boutique's own shoot of a real customer — candid and believable, not stock photography and not an AI render. Soft, flattering natural light (open shade, bright window light or soft daylight; no harsh overhead sun, no studio flash, no HDR, no golden-hour haze). Realistic skin texture with natural pores and age-appropriate features, no exaggerated wrinkles or ageing, no beauty filter, no airbrushed or plastic skin. A relaxed, genuine expression — a warm natural smile or calm confidence; no stiff model pose, no unflattering expression or camera angle. An attractive everyday Israeli setting with real details, only gently out of focus (no creamy bokeh, no glowing light balls). Real fabric drape and creases. It must look like a real photo of a real Israeli woman at her best, not like AI.
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
Create a realistic, flattering lifestyle photograph of a stylish Israeli woman approximately [45–58] years old
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
- Velden: `age` = één leeftijd per foto binnen 45–60 (gevarieerd over de pagina); `styling` = modern, elegant,
  verzorgd (kapsel, make-up, accessoires); `light` = zacht en flatterend; `mood` = zelfverzekerd, ontspannen, warm.

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
