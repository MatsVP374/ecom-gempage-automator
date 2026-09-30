# Adina Fashion Launch Engine — instructies voor Claude Code

Deze repo is de vaste product-launch-workflow van **Adina Fashion** (Israël, Hebreeuws, vrouwen 45–65+).
Voor elk nieuw product maakt hij:

1. een **Hebreeuwse founder-letter GemPage** (advertorial, géén standaard productpagina), met onder elke foto
   een **echte klantreview**,
2. een **beeldplan** + **image-generation prompts** voor de extra storytelling-foto's in die GemPage,
3. een **creative plan** (4 statics + optioneel UGC),
4. een **QA-rapport** en een **launch package** voor GemPages en de Meta-creatives.

**De ad copy (primary text/headline/description) schrijft deze workflow niet**; die maakt de gebruiker zelf.

## Het belangrijkste principe: MESSAGE CONTINUITY

```
META CREATIVE → CUSTOMER AD STORY → ADINA FOUNDER LETTER → PRODUCT/OFFER → PURCHASE
                 (klant-hoofdstuk)    (Adina's hoofdstuk)    (conversie)
```

Ad en GemPage zijn **één verhaal**. De ad (door de gebruiker geschreven) en de GemPage gaan over hetzelfde
centrale probleem, eindigen bij hetzelfde product, benadrukken dezelfde voordelen en gebruiken exact hetzelfde aanbod. `02-central-angle.json`
is de **single source of truth** waar alles na stap 2 op gebouwd wordt.

## Altijd eerst lezen

| Bestand | Waarvoor |
|---|---|
| `config/adina.json` | **Globale feiten**: trust, verzending, retour, bundelkorting, vaste Hebreeuwse teksten. Nergens anders vandaan halen. |
| `brand/fact-rules.md` | Nooit feiten verzinnen, hoe je ontbrekende input flagt |
| `brand/adina.md` | Merk, Adina, founder-verhaal, tone of voice |
| `brand/customer-avatar.md` | De klant |
| `brand/gempage-blueprint.md` | De vaste founder-letter GemPage (blok voor blok) |
| `brand/image-rules.md` | GemPage-beeldplan, promptformaat, statische creatives |
| `brand/ad-system.md` | Hoe de GemPage aansluit op de ads van de gebruiker; UGC-script |
| `brand/testimonial-rules.md` | Wat je met testimonials wel/niet mag |
| `brand/hebrew-copy.md` | **De standaard voor de Hebreeuwse tekst**: natuurlijk Israëlisch Hebreeuws, geen vertaling, geen AI-patronen |
| `brand/hebrew-style.md` | Hebreeuwse stijl en RTL |

## De pipeline

Commando: `/launch-product <slug>` (volledig) · `/launch-step <slug> <stap>` (één stap) ·
`/new-launch` (intake: productinput verzamelen en `input.json` maken).

| # | Stap | Prompt | Output in `products/<slug>/` |
|---|------|--------|------|
| 0 | Input | `templates/product-input.md` | `input.json` |
| 1 | Product research / fact sheet | `prompts/01-product-facts.md` | `01-product-facts.json` |
| 2 | Marketing angle (single source of truth) | `prompts/02-central-angle.md` | `02-central-angle.json` |
| 3 | GemPage founder-letter copy (Engelse master) | `prompts/03-gempage-copy.md` | `03-gempage-copy.en.json` |
| 4 | GemPage image plan | `prompts/04-gempage-image-plan.md` | `04-gempage-image-plan.json` |
| 5 | Image-generation prompts | `prompts/05-image-prompts.md` | `05-image-prompts.json` |
| 5b | Beelden genereren (Gemini of OpenAI) + uploaden (Shopify CDN) | `node scripts/images.js <slug>` | `images/IMG-xx.png`, `url` per beeld in `04-…plan.json` |
| 6 | GemPage build / Hebreeuws | `prompts/06-gempage-build-he.md` | `03-gempage-copy.he.json` |
| 6b | Hebreeuwse spellingcheck (script + proeflezen) | `prompts/06b-spellcheck.md` | `03-gempage-spellcheck.json` (+ fixes in de HE-teksten) |
| 6c | Hebreeuwse natuurlijkheid (klinkt het als echte Israëlische copy?) | `prompts/06c-hebrew-naturalness.md` | `03-gempage-naturalness.json` (+ herschreven zinnen) |
| 7 | Quality control (feiten, GemPage, beelden) | `prompts/07-quality-control.md` | `09-qa-report.md` (deel 1) |
| 9 | Creative plan + UGC | `prompts/09-creative-plan.md` | `07-creative-plan.json`, `08-ugc.json` |
| 10 | Final launch package | `prompts/10-final-package.md` | `09-qa-report.md` (compleet) + `output/` incl. **`<slug>-founder-letter.gempages`** |
| 11 | Upload naar GemPages (als de GemPages-koppeling er is) | `prompts/11-gempages-upload.md` | `10-gempages-upload.json` (pagina-id, editor- en previewlink) |

Regels:
- **Stap 0 is een poort.** Draai eerst `node scripts/validate.js <slug> --stage input`. Ontbreken
  verplichte velden → STOP, noem precies welke velden ontbreken, verzin niets.
- Elke stap leest de output van alle eerdere stappen opnieuw. Na stap 2 wijk je niet meer af van de
  centrale angle; wil je dat, zeg het dan en pas stap 2 aan.
- Bestaat een outputbestand al, sla de stap dan over, tenzij `--force` of een expliciete opdracht.
- Stap 5b is een script, geen schrijfwerk: `node scripts/images.js <slug>`. Het stuurt elke prompt met de
  bestaande productfoto's als referentie naar de beeldmaker — **Gemini** (`GEMINI_API_KEY`, standaard als die
  sleutel er is) of **OpenAI** (`OPENAI_API_KEY`); kiezen met `IMAGE_PROVIDER` of `--provider` — uploadt het
  resultaat naar Shopify Files en zet de CDN-URL in het beeldplan. `node scripts/images.js <slug> compare` maakt
  de hero met beide ter vergelijking (geen upload). Faalt het (geen sleutel/Shopify-token, netwerk geblokkeerd),
  meld dan de exacte foutmelding als flag `IMAGES NOT GENERATED — …` en ga door; de `.gempages` krijgt dan
  zichtbare placeholders. Genereer nooit beelden op een andere manier en verzin geen beeld-URL's.
- Na stap 6 en 9: `node scripts/validate.js <slug>` en fix alle **errors** vóór je verdergaat.
- **Hebreeuwse natuurlijkheid (6c)** na 6b, na stap 9, en als laatste vóór de upload: elke zin die grammaticaal klopt maar
  niet klinkt als natuurlijk Israëlisch Hebreeuws voor vrouwen van 45–65+ wordt herschreven (`brand/hebrew-copy.md`).
  `node scripts/validate.js <slug> --stage upload` weigert de upload zonder verse 6c.
- **Spellingcheck (6b)** na stap 6 én opnieuw na stap 9: `node scripts/spellcheck.js <slug>` (sluitletters, geplakt
  Hebreeuws/Latijn, dubbele woorden, nikud, spaties, spelfouten uit `brand/hebrew-spelling.json`) plus proeflezen door jou
  (grammatica, vrouwelijke aanspreekvorm, natuurlijk Hebreeuws). Spelling-errors blokkeren de validatie.
- Geen (passende) testimonials → geen review onder die foto's (flag `REVIEWS PER PHOTO: x/6`).
  **Nooit een review of klantverhaal verzinnen.**
- Eindig met de eindchecklist (onderaan). Niets naar Shopify pushen tenzij gevraagd.

## Datacontract (strikt — `scripts/` en de UI lezen dit)

Taal: `01`, `02`, `03-…en`, `04`, `05` zijn Engelse werkbestanden (intern, voor review). Alles wat de klant
ziet — `03-gempage-copy.he.json`,
`07-creative-plan.json` (`overlay_text_he`), `08-ugc.json` (`voice_he`) — is **Hebreeuws**.

### `input.json` (door de gebruiker, via UI / `/new-launch` / `node scripts/new-product.js`)
```json
{
  "slug": "example-cardigan",
  "product_name": "Example",
  "hebrew_product_name": "…",
  "product_type": "Soft knitted hooded cardigan",
  "regular_price": 319,
  "sale_price": 159,
  "promotion": "50% discount",
  "sale_reason": "",
  "colors": ["Blue", "Black"],
  "sizes": ["S–5XL"],
  "features": ["soft knitted texture", "full front button closure"],
  "existing_product_page": { "url": "https://…", "content": "plak hier de tekst van de huidige productpagina" },
  "existing_product_images": ["source/1.jpg", "https://…/2.jpg"],
  "testimonials": [
    { "id": "t1", "name": null, "age": null, "source": "Judge.me review 2026-08-12",
      "text": "letterlijke review", "text_he": null, "rating": 5,
      "details": "extra door de gebruiker aangeleverde context" }
  ],
  "known_customer_problems": "",
  "central_problem_hint": "",
  "competitor_reference": "",
  "extra_info": "",
  "ugc_needed": false,
  "launch_month": "2026-09"
}
```
Testimonials kunnen twee optionele velden hebben (aangeleverd via Activepieces): `benefit` (1–6: onder welke voordeelfoto,
de GemPage plaatst hem dan zelf letterlijk) en `mockup: true` (gegenereerd, geen klant; alleen met
`"mockup_reviews_allowed": true` op een draft die niet gepubliceerd wordt). Zie `brand/testimonial-rules.md`.

Verplicht: `product_name`, `hebrew_product_name`, `product_type`, `regular_price`, `sale_price`,
`promotion`, `colors`, `sizes`, `features`, `existing_product_page` (url of content),
`existing_product_images`. `sale_reason` is optioneel: alleen een echte, aangeleverde reden voor de korting; leeg = het
aanbod is een tijdelijke introductie-/boetiekprijs zonder reden (nooit zelf "einde seizoen" e.d. invullen). Testimonials zijn nodig voor de **review onder elke GemPage-foto**
(zonder testimonials blijven die reviews weg). `text_he` alleen als de review niet in het Hebreeuws is; `rating` alleen als bekend.
Shipping/returns komen uit `config/adina.json` (niet per product).

### `01-product-facts.json`
```json
{
  "product_name": "…", "hebrew_product_name": "…", "product_type": "…",
  "price": { "regular": 319, "sale": 159, "currency": "ILS" },
  "promotion": "…", "sale_reason": "…",
  "colors": [{ "name": "Blue", "he": "כחול" }],
  "sizes": ["S–5XL"],
  "features": [{ "id": "f1", "fact": "Soft knitted texture", "source": "input" }],
  "page_facts": [{ "fact": "…", "source": "product_page" }],
  "image_observations": [{ "image": "source/1.jpg", "observed": "…" }],
  "testimonials": [{ "id": "t1", "supported_statements": ["…"], "sufficient_for_ad": true, "gaps": ["…"] }],
  "unverified": ["…"],
  "missing": [{ "field": "…", "needed_for": "…" }],
  "status": "complete"
}
```
`source` ∈ `input | product_page | image`. `status` ∈ `complete | missing_input`.
`colors[].name` = exact zoals in input (vertalen naar `he` is toegestaan, kleuren toevoegen niet).

### `02-central-angle.json`
```json
{
  "questions": {
    "who": "…", "everyday_problem": "…", "current_workaround": "…", "why_frustrating": "…",
    "what_changes": "…", "enabling_features": ["f1", "f3"], "adina_observation": "…",
    "core_belief": "…", "easiest_comparison": "…", "why_now": "…"
  },
  "central_problem": "…",
  "customer_insight": "…",
  "product_solution": "…",
  "adina_belief": "…",
  "core_promise": "…",
  "old_alternative_a": "…",
  "old_alternative_b": "…",
  "why_now": "…",
  "founder_letter_hook": "…",
  "selection_story": {
    "opening": "skepticism | curiosity | familiar_problem | surprising_detail | disappointing_alternatives | overlooked",
    "hook": "…", "real_problem": "…", "what_changed_her_mind": "…", "turning_point_feature_ids": ["f2"],
    "why_selected": "…", "real_life": "…", "offer_framing": "supplied_sale_reason | introductory_offer"
  },
  "benefits": [
    { "n": 1, "human_problem": "…", "feature_ids": ["f1"], "practical_effect": "…",
      "real_life_benefit": "…", "situations": ["…"] }
  ]
}
```
5–6 `benefits`; elk `feature_ids` verwijst naar `01-product-facts.json`. `selection_story` = waarom dít product een plek in
Adina's selectie verdiende (`brand/adina.md` → founder-verhaal); `supplied_sale_reason` alleen met een gevulde `input.sale_reason`.

### `03-gempage-copy.en.json` en `03-gempage-copy.he.json` (identieke blokstructuur)
```json
{ "lang": "he", "dir": "rtl", "blocks": [ { "id": "…", "type": "…", "…": "…" } ] }
```
Vaste blokvolgorde (zie `brand/gempage-blueprint.md`), `id` = `type`:

| type | velden |
|---|---|
| `founder_header` | `byline`, `place_date`, `note`, `badge` |
| `headline` | `headline`, `subtitle` |
| `hero` | `image`, `alt` |
| `founder_story` | `greeting`, `parts: [{ role, text }]` — roles in volgorde `hook`, `problem`, `turning_point`, `selection` (producten van vóór dit verhaal: `intro` … `discovery`, alleen een waarschuwing) |
| `benefits` | `title`, `items: [{ n, headline, text, feature_ids, image, review? }]` (5–6) · `review = { testimonial_id, text }`: letterlijk fragment van een echte review onder de foto |
| `comparison` | `title`, `columns: { a, b, product }`, `rows: [{ label, a, b, product }]` (3–5) |
| `founder_quote` | `quote`, `author` |
| `sale` | `title`, `paragraphs: []`, `regular_price`, `sale_price`, `availability_note` (optioneel, alleen echte info). Reden voor de korting alleen uit `input.sale_reason`, anders tijdelijke introductieprijs |
| `trust_bar` | `items: [{ value, label }]` (4) |
| `packing` | `image`, `caption` |
| `founder_observation` | `text` |
| `social_proof` | `rating`, `reviews_label`, `text`, `quotes: [{ testimonial_id, text }]` (alleen echte, aangeleverde testimonials) |
| `offer_box` | `product_name`, `rating_line`, `regular_price`, `sale_price` (de box met kleuren/maten/verzending/retour + knop bouwt de GemPage zelf) |
| `bundle` | `title`, `tiers: [{ items, extra_discount_pct, label }]` — exact `config.bundle_discount` |
| `cta` | `button` (= `config.landing_page.cta_he` met korte naam), `subtext` |
| `about` | `title`, `text`, `signoff` |
| `sticky_cta` | `text` (= `config.landing_page.sticky_cta_he`); linkt naar de productpagina |

`image`-velden bevatten een ID uit `04-gempage-image-plan.json` (`IMG-01` …).

### `04-gempage-image-plan.json`
```json
{
  "images": [
    { "id": "IMG-01", "role": "hero", "block": "hero", "benefit_n": null,
      "purpose": "Which story point this photo proves", "source": "generate",
      "existing_image": null, "product_color": "Blue", "model": "…", "setting": "…" }
  ],
  "existing_images_reviewed": ["source/1.jpg"],
  "notes": "…"
}
```
`role` ∈ `hero | benefit_detail | functional_detail | functional_detail_2 | real_life_use | variation | packing`.
`source` ∈ `generate | existing` (bij `existing`: `existing_image` = bestaand productbeeld; dat wordt niet opnieuw gegenereerd).
`product_color` = exact een kleur uit input.

### `05-image-prompts.json`
```json
{
  "prompts": [
    { "image_id": "IMG-01", "aspect_ratio": "4:5", "reference_images": ["source/1.jpg"],
      "fields": { "subject": "…", "age": "…", "product": "…", "exact_color": "Blue", "styling": "…",
        "action": "…", "environment": "…", "framing": "…", "light": "…", "mood": "…",
        "must_be_visible": "…", "realism": "…", "must_not_change": "…" },
      "prompt": "Volledige production-ready prompt (Engels)" }
  ]
}
```
Eén prompt per beeld met `source: "generate"`.

### `07-creative-plan.json`
```json
{
  "creatives": [
    { "id": "A", "type": "customer_discovery", "concept": "…", "visual": "…",
      "overlay_text_he": null, "product_color": "Blue", "format": "4:5", "prompt": "…" }
  ]
}
```
Precies 4: `A customer_discovery`, `B raw_boutique_offer`, `C everyday_use`, `D designed_hook` (D heeft `overlay_text_he`).

### `08-ugc.json`
```json
{ "needed": true, "reason": "…", "voice": "…", "script": [{ "time": "0-3", "visual": "…", "voice_he": "…" }] }
```
Als `input.ugc_needed` false is: `{ "needed": false, "reason": "not requested" }`.

### `03-gempage-spellcheck.json`
```json
{ "status": "fixed", "checked": ["03-gempage-copy.he.json"],
  "corrections": [{ "file": "…", "at": "benefits.items[2].text", "before": "…", "after": "…", "reason": "…" }],
  "doubts": [{ "text": "…", "question": "…" }] }
```
`status` ∈ `clean | fixed`. Alleen spelling/grammatica/formulering verbeteren, nooit inhoud. `doubts` worden flags.

### `03-gempage-naturalness.json`
```json
{ "status": "rewritten", "checked": ["03-gempage-copy.he.json"],
  "rewrites": [{ "file": "…", "at": "headline.headline", "before": "…", "after": "…", "reason": "…" }],
  "kept": [{ "text": "…", "why": "…" }],
  "doubts": [{ "text": "…", "question": "…" }] }
```
`status` ∈ `clean | rewritten`. Alleen formulering, nooit feiten/claims/prijzen/ID's; vaste teksten en reviews blijven letterlijk
(twijfel → `doubts`, wordt een flag).

### `09-qa-report.md`
Checklist uit `prompts/10-final-package.md` met ☑/☐, validator-output, alle flags, en "Voor de mens".

## GemPages-bestand (`.gempages`)

`node scripts/gempages.js <slug>` (ook onderdeel van `export.js`) bouwt een importeerbaar GemPages-bestand:
één pagina → één sectie → één Custom Code-element met de brief in Adina's design
(`templates/gempage/letter.css` + `skeleton.json`, afgeleid van een echte GemPages-export). In GemPages:
**Pages → Import → upload het bestand**. Beelden komen van de Shopify-CDN-URL's uit stap 5b.

## Harde regels

- **Nooit feiten verzinnen** (materiaal, kleuren, maten, pasvorm, functies, prijzen, voorraad,
  medische voordelen, verzending, productprestaties). Niet in input/pagina/beelden/config → flaggen.
- **Mockup-reviews zijn nooit klantreviews:** alleen op een niet-gepubliceerde draft (die er voor design-QA uitziet als de
  echte pagina, intern gemarkeerd), nooit bewijs, nooit gepubliceerd (`validate.js --stage publish`). Aangeleverde reviewteksten worden nooit ingekort of herschreven.
- **Nooit een testimonial of klantervaring verzinnen.** Geen naam/leeftijd/vriendin/café/reis/
  aankoopverhaal/draagduur/situaties/resultaten die niet zijn aangeleverd. Zie `brand/testimonial-rules.md`.
- **Geen nep-schaarste** ("nog 3 op voorraad", afteltimers). "בדקי אם המידה שלך עדיין במלאי" is de vaste CTA, geen voorraadclaim.
- Aanbod komt **alleen** uit input (prijzen, promotie, sale reason als aangeleverd) + `config/adina.json`. Geen
  verzonnen reden voor de korting (einde seizoen, opruiming, sluiting, voorraad, "eerste lading", schaarste)
  (bundel 10/15/20/25%, gratis verzending met Israel Post, 30 dagen retour, 4.7/5, 2,550+ reviews, 15+ jaar).
- De GemPage begint **nooit** met het product of de korting; het product is de conclusie van Adina's verhaal.
- Maar zodra ze overtuigd is, hoeft ze **niet te zoeken**: de knop in de productbox en de sticky CTA gaan direct naar de productpagina (blueprint → Productroutes).
- **RTL-QA** bij elke pagina: expliciete RTL per tekstelement, geïsoleerde ₪/4.7/5/S–3XL/Adina Fashion (validator + mobiele preview).
- Productnamen exact zoals aangeleverd.
- **Hebreeuws wordt geschreven, niet vertaald**, en beoordeeld op natuurlijkheid, niet alleen op correctheid:
  warm, persoonlijk, volwassen boetiek-Hebreeuws, vrouwelijke grammatica, geen AI-patronen (`brand/hebrew-copy.md`).
- Geen medische claims.

## Eindchecklist (zo rapporteer je na `/launch-product`)

```
ADINA PRODUCT LAUNCH — <hebrew_product_name>

✓ Product facts validated        0 missing · 2 unverified
✓ Central angle created          "<central_problem>"
✓ GemPage copy complete          17 blocks · HE + EN master
✓ Hebrew spellcheck              0 errors · 4 corrections · 0 doubts
✓ Hebrew naturalness             7 rewrites · 0 doubts
✓ 7 GemPage images planned       5 generate · 2 existing
✓ Image prompts complete         5
✓ Images generated + on Shopify  7/7
✓ Reviews under the photos       6/6 benefits · 23 reviews supplied
✓ Creative plan complete         4 statics · UGC: no
✓ QA passed                      0 errors · 3 warnings

READY FOR:
→ GemPages          output/<slug>-founder-letter.gempages (Import) · output/gempage.he.html (preview)
→ Image generation  output/image-prompts.md
→ Meta creatives    output/creative-plan.md (4 statics)
```
