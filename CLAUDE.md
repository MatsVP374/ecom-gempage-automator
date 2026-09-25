# Adina Fashion Launch Engine — instructies voor Claude Code

Deze repo is de vaste product-launch-workflow van **Adina Fashion** (Israël, Hebreeuws, vrouwen 45–65+).
Voor elk nieuw product maakt hij:

1. een **Hebreeuwse founder-letter GemPage** (advertorial, géén standaard productpagina),
2. een **beeldplan** + **image-generation prompts** voor de extra storytelling-foto's in die GemPage,
3. **precies 2 long-form Meta-ads** vanuit een **echte klanttestimonial**,
4. een **creative plan** (4 statics + optioneel UGC),
5. een **QA-rapport** en een **launch package** voor GemPages en Meta Ads Manager.

## Het belangrijkste principe: MESSAGE CONTINUITY

```
META CREATIVE → CUSTOMER AD STORY → ADINA FOUNDER LETTER → PRODUCT/OFFER → PURCHASE
                 (klant-hoofdstuk)    (Adina's hoofdstuk)    (conversie)
```

Ad en GemPage zijn **één verhaal**. Ze gaan over hetzelfde centrale probleem, eindigen bij hetzelfde
product, benadrukken dezelfde voordelen en gebruiken exact hetzelfde aanbod. `02-central-angle.json`
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
| `brand/ad-system.md` | De 2 long-form Meta-ads, stijl, UGC |
| `brand/testimonial-rules.md` | Wat je met testimonials wel/niet mag |
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
| 6 | GemPage build / Hebreeuws | `prompts/06-gempage-build-he.md` | `03-gempage-copy.he.json` |
| 7 | Quality control (feiten, GemPage, beelden) | `prompts/07-quality-control.md` | `09-qa-report.md` (deel 1) |
| 8 | 2 Meta-ads | `prompts/08-meta-ads.md` | `06-meta-ads.json` |
| 9 | Creative plan + UGC | `prompts/09-creative-plan.md` | `07-creative-plan.json`, `08-ugc.json` |
| 10 | Final launch package | `prompts/10-final-package.md` | `09-qa-report.md` (compleet) + `output/` |

Regels:
- **Stap 0 is een poort.** Draai eerst `node scripts/validate.js <slug> --stage input`. Ontbreken
  verplichte velden → STOP, noem precies welke velden ontbreken, verzin niets.
- Elke stap leest de output van alle eerdere stappen opnieuw. Na stap 2 wijk je niet meer af van de
  centrale angle; wil je dat, zeg het dan en pas stap 2 aan.
- Bestaat een outputbestand al, sla de stap dan over, tenzij `--force` of een expliciete opdracht.
- Na stap 6, 8 en 9: `node scripts/validate.js <slug>` en fix alle **errors** vóór je verdergaat.
- Stap 8 zonder bruikbare testimonial → schrijf `06-meta-ads.json` met `"status": "blocked"` en de
  flag `TESTIMONIAL DATA INSUFFICIENT`, ga door met stap 9–10, en meld het in de eindchecklist.
  **Nooit een verzonnen klantverhaal schrijven.**
- Eindig met de eindchecklist (onderaan). Niets naar Shopify pushen tenzij gevraagd.

## Datacontract (strikt — `scripts/` en de UI lezen dit)

Taal: `01`, `02`, `03-…en`, `04`, `05` zijn Engelse werkbestanden (intern, voor review). Alles wat de klant
ziet — `03-gempage-copy.he.json`, `06-meta-ads.json` (primary text/headline/description),
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
  "promotion": "50% discount — seasonal promotion",
  "sale_reason": "End of season sale",
  "colors": ["Blue", "Black"],
  "sizes": ["S–5XL"],
  "features": ["soft knitted texture", "full front button closure"],
  "existing_product_page": { "url": "https://…", "content": "plak hier de tekst van de huidige productpagina" },
  "existing_product_images": ["source/1.jpg", "https://…/2.jpg"],
  "testimonials": [
    { "id": "t1", "name": null, "age": null, "source": "Judge.me review 2026-08-12",
      "text": "letterlijke review", "details": "extra door de gebruiker aangeleverde context" }
  ],
  "known_customer_problems": "",
  "central_problem_hint": "",
  "competitor_reference": "",
  "extra_info": "",
  "ugc_needed": false,
  "launch_month": "2026-09"
}
```
Verplicht: `product_name`, `hebrew_product_name`, `product_type`, `regular_price`, `sale_price`,
`promotion`, `sale_reason`, `colors`, `sizes`, `features`, `existing_product_page` (url of content),
`existing_product_images`. Testimonials zijn optioneel voor de GemPage, maar **nodig voor de ads**.
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
  "benefits": [
    { "n": 1, "human_problem": "…", "feature_ids": ["f1"], "practical_effect": "…",
      "real_life_benefit": "…", "situations": ["…"] }
  ]
}
```
5–6 `benefits`; elk `feature_ids` verwijst naar `01-product-facts.json`.

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
| `founder_story` | `greeting`, `parts: [{ role, text }]` — roles in volgorde `intro`, `observation`, `problem`, `alternatives`, `search`, `discovery` |
| `benefits` | `title`, `items: [{ n, headline, text, feature_ids, image }]` (5–6) |
| `comparison` | `title`, `columns: { a, b, product }`, `rows: [{ label, a, b, product }]` (3–5) |
| `founder_quote` | `quote`, `author` |
| `sale` | `title`, `paragraphs: []`, `regular_price`, `sale_price`, `availability_note` (optioneel, alleen echte info) |
| `trust_bar` | `items: [{ value, label }]` (4) |
| `packing` | `image`, `caption` |
| `founder_observation` | `text` |
| `social_proof` | `rating`, `reviews_label`, `text`, `quotes: [{ testimonial_id, text }]` (alleen echte, aangeleverde testimonials) |
| `offer_box` | `product_name`, `rating_line`, `regular_price`, `sale_price`, `bullets: []` (4–6) |
| `bundle` | `title`, `tiers: [{ items, extra_discount_pct, label }]` — exact `config.bundle_discount` |
| `cta` | `button`, `subtext` |
| `about` | `title`, `text`, `signoff` |
| `sticky_cta` | `text` |

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

### `06-meta-ads.json`
```json
{
  "status": "ready",
  "flags": [],
  "ads": [
    { "id": "ad1", "type": "discovery", "angle": "short angle name", "testimonial_id": "t1",
      "primary_text": "…", "headline": "…", "description": "…",
      "trace": [{ "claim": "wat de ad beweert", "source": "testimonial:t1" }],
      "review_en": "Engelse leesversie voor de gebruiker" },
    { "id": "ad2", "type": "routine", "…": "…" }
  ]
}
```
`status` ∈ `ready | partial | blocked`. `ready` = precies 2 ads. `partial` = 1 ad (de testimonial draagt er maar één) + flag. `blocked` = `ads: []`. Bij `partial`/`blocked` bevat `flags` `TESTIMONIAL DATA INSUFFICIENT — …`.
`trace[].source` ∈ `testimonial:<id> | fact:<feature-id> | input:<veld> | config:<pad> | angle:<veld>`.
**Elke eerste-persoonservaring in de ad moet traceren naar `testimonial:<id>`.**

### `07-creative-plan.json`
```json
{
  "creatives": [
    { "id": "A", "type": "customer_discovery", "matches": "ad1", "concept": "…", "visual": "…",
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

### `09-qa-report.md`
Checklist uit `prompts/10-final-package.md` met ☑/☐, validator-output, alle flags, en "Voor de mens".

## Harde regels

- **Nooit feiten verzinnen** (materiaal, kleuren, maten, pasvorm, functies, prijzen, voorraad,
  medische voordelen, verzending, productprestaties). Niet in input/pagina/beelden/config → flaggen.
- **Nooit een testimonial of klantervaring verzinnen.** Geen naam/leeftijd/vriendin/café/reis/
  aankoopverhaal/draagduur/situaties/resultaten die niet zijn aangeleverd. Zie `brand/testimonial-rules.md`.
- **Geen nep-schaarste** ("nog 3 op voorraad", afteltimers). "בדקי אם המידה שלך עדיין במלאי" is de vaste CTA, geen voorraadclaim.
- Aanbod komt **alleen** uit input (prijzen, promotie, sale reason) + `config/adina.json`
  (bundel 10/15/20/25%, gratis verzending met Israel Post, 30 dagen retour, 4.7/5, 2,550+ reviews, 15+ jaar).
- De GemPage begint **nooit** met het product of de korting; het product is de conclusie van Adina's verhaal.
- Productnamen exact zoals aangeleverd.
- Geen medische claims.

## Eindchecklist (zo rapporteer je na `/launch-product`)

```
ADINA PRODUCT LAUNCH — <hebrew_product_name>

✓ Product facts validated        0 missing · 2 unverified
✓ Central angle created          "<central_problem>"
✓ GemPage copy complete          17 blocks · HE + EN master
✓ 7 GemPage images planned       5 generate · 2 existing
✓ Image prompts complete         5
✓ 2 Meta ads complete            (of: ✗ BLOCKED — TESTIMONIAL DATA INSUFFICIENT)
✓ Creative plan complete         4 statics · UGC: no
✓ QA passed                      0 errors · 3 warnings

READY FOR:
→ GemPages          output/gempage-copy.md · output/gempage.he.html
→ Image generation  output/image-prompts.md
→ Meta Ads Manager  output/meta-ads.md · output/meta-ads.csv
```
