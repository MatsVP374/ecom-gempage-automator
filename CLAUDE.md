# Adina Launch Engine — instructies voor Claude Code

Deze repo is de interne launch-tool van **Adina** (Israëlische webshop, vrouwen 45–65).
Eén product gaat hier van **leverancier-URL → positionering → Engelse PDP → Hebreeuwse PDP →
GemPages/Shopify → advertentie-angles → ad copy → creative briefs → QA**.

Jij (Claude) voert de creatieve stappen uit. De scripts in `scripts/` doen het mechanische werk
(valideren, exporteren, naar Shopify pushen). De UI in `app/` is een schil om beide heen.

## Altijd eerst lezen

Voordat je content genereert, lees je **altijd**:

1. `brand/adina.md` — merk, doelgroep, tone of voice, prijsstrategie
2. `brand/customer-avatar.md` — wie is de klant, wat voelt/wil/vreest ze
3. `brand/copywriting-rules.md` — wat wel/niet mag (claims, beloftes, Meta-regels)
4. `brand/hebrew-style.md` — Hebreeuwse schrijfstijl + RTL-regels
5. `brand/product-page-rules.md` — vaste PDP-structuur en sectie-volgorde

Het uitgewerkte voorbeeld `products/noa-linen-top/` is de referentie voor kwaliteit en formaat.

## De pipeline

Commando: `/launch-product <slug of supplier-URL>` (zie `.claude/commands/launch-product.md`).
Elke stap heeft een eigen prompt in `prompts/` en schrijft één bestand in `products/<slug>/`:

| # | Stap | Prompt | Output |
|---|------|--------|--------|
| 0 | Input | — | `input.json` (via `node scripts/new-product.js`) |
| 1 | Productanalyse | `prompts/01-product-analysis.md` | `research.md` |
| 2 | Positionering, naam, aanbod | `prompts/02-positioning.md` | `product.json` |
| 3 | Engelse PDP | `prompts/03-product-page.md` | `page.en.json` |
| 4 | Hebreeuwse PDP (lokaliseren, niet vertalen) | `prompts/04-translate-hebrew.md` | `page.he.json` |
| 5 | Advertentie-angles | `prompts/05-ad-angles.md` | `ads.json` → `angles` |
| 6 | Ad copy HE + EN | `prompts/06-ad-copy.md` | `ads.json` → `copy` |
| 7 | Creative briefs | `prompts/07-creative-briefs.md` | `creatives.md` |
| 8 | QA | `prompts/08-qa.md` | `qa.md` + `node scripts/validate.js <slug>` |
| 9 | Export | — | `node scripts/export.js <slug>` → `output/` |

Regels voor de pipeline:
- Stappen bouwen op elkaar voort: lees altijd de output van de vorige stappen opnieuw in.
- Bestaat een outputbestand al, overschrijf het dan alleen als de gebruiker daarom vraagt of
  als `--force` is meegegeven. Anders: sla de stap over en meld dat.
- Draai na stap 4 en na stap 6 `node scripts/validate.js <slug>` en fix alle **errors** voordat
  je verdergaat. Warnings benoem je in `qa.md`.
- Stop nooit halverwege zonder te melden welke stap is gelukt en welke niet.
- Eindig met de checklist (zie onderaan) — kort, geen lange samenvatting.

## Datacontract (strikt — de scripts en de UI lezen dit)

### `input.json`
```json
{
  "slug": "noa-linen-top",
  "supplier_url": "https://...",
  "supplier_cost": { "amount": 12.5, "currency": "EUR" },
  "selling_price": { "amount": 179, "currency": "ILS" },
  "compare_at_price": { "amount": 359, "currency": "ILS" },
  "category": "blouse",
  "target": "women 45-65",
  "notes": "Vrije tekst van de gebruiker",
  "images": ["https://... of source/1.jpg"],
  "created_at": "2026-09-25"
}
```
`compare_at_price` mag `null` zijn; dan bepaal jij hem in stap 2.

### `product.json`
```json
{
  "name_he": "נועה",
  "name_en": "Noa",
  "product_type_he": "חולצת פשתן נושמת",
  "product_type_en": "Breathable Linen Blouse",
  "full_title_he": "נועה | חולצת פשתן נושמת",
  "full_title_en": "Noa | Breathable Linen Blouse",
  "one_liner_en": "...",
  "positioning": {
    "core_promise": "...",
    "primary_pain": "...",
    "primary_desire": "...",
    "differentiator": "...",
    "objections": [{ "objection": "...", "answer": "..." }]
  },
  "pricing": {
    "price": 179, "compare_at": 359, "currency": "ILS",
    "offer": "...", "bundle": "..."
  },
  "specs": { "material": "...", "sizes": ["S","M"], "colors": [{"en":"White","he":"לבן"}], "care": "..." },
  "shopify": { "product_type": "Blouses", "tags": ["linen","summer"], "vendor": "Adina", "handle": "noa-linen-blouse" }
}
```

### `page.en.json` en `page.he.json` (identieke structuur)
```json
{
  "lang": "he",
  "dir": "rtl",
  "title": "נועה | חולצת פשתן נושמת",
  "subtitle": "...",
  "price": { "current": 179, "compare_at": 359, "currency": "ILS" },
  "badge": "...",
  "bullets": ["...", "...", "...", "..."],
  "cta": "...",
  "trust_line": "...",
  "sections": [ { "type": "...", "...": "..." } ],
  "seo": { "title": "...", "description": "..." }
}
```
Toegestane sectietypes (volgorde volgens `brand/product-page-rules.md`):
- `hero` — `headline`, `subheadline`, `image_hint`
- `benefits` — `title`, `items: [{ icon, title, text }]` (icon = één emoji)
- `story` — `title`, `text`, `image_hint`
- `features` — `title`, `items: [string]`
- `comparison` — `title`, `us_label`, `them_label`, `rows: [{ label, us, them }]` (us/them = boolean)
- `size_guide` — `title`, `note`, `headers: [string]`, `rows: [[string]]`
- `reviews` — `title`, `placeholder: true`, `items: [{ name, city, rating, text }]`
- `faq` — `title`, `items: [{ q, a }]`
- `guarantee` — `title`, `text`
- `cta` — `headline`, `button`, `subtext`

### `ads.json`
```json
{
  "angles": [
    { "id": "comfort", "name": "...", "hook_en": "...", "awareness": "problem_aware",
      "audience": "...", "emotion": "...", "creative_idea": "...", "format": "image|video|carousel" }
  ],
  "copy": {
    "he": [ { "angle_id": "comfort", "primary_texts": ["...","...","..."],
              "headlines": ["...","...","..."], "descriptions": ["..."] } ],
    "en": [ { "angle_id": "comfort", "primary_texts": [...], "headlines": [...], "descriptions": [...] } ]
  }
}
```
`awareness` ∈ `unaware | problem_aware | solution_aware | product_aware | most_aware`.

## Harde regels

- **Hebreeuws is de verkooptaal.** Engels is de werkversie/basis. Hebreeuwse tekst wordt
  gelokaliseerd (idiomatisch, Israëlisch), nooit woord-voor-woord vertaald.
- **Geen verzonnen reviews.** De `reviews`-sectie is altijd `placeholder: true` en bevat
  duidelijk voorbeeldtekst die vervangen wordt door echte reviews (Judge.me/Loox). Nooit
  reviews als echt presenteren. Geen verzonnen sterrenaantallen of "10.000+ tevreden klanten".
- **Geen valse urgentie/schaarste** ("nog maar 3 op voorraad") tenzij de gebruiker het in
  `input.json` als waar opgeeft.
- **Geen medische/afslank-claims**, geen "anti-aging"-beloftes, geen voor/na-lichaamsbeloftes.
  Meta keurt die af en ze zijn misleidend.
- Geen persoonlijke-kenmerken-copy richting Meta ("Ben jij 55 en heb je last van…"): Meta
  Personal Attributes policy. Spreek situaties aan, niet eigenschappen van de lezer.
- Prijzen altijd in `₪` voor HE, als geheel getal (bv. `₪179`). Compare-at ≈ 2× prijs, maar
  alleen als die prijs verdedigbaar is.
- Verzin geen materiaal of specs die niet uit de leverancier-info blijken. Twijfel? Zet het
  in `research.md` onder "Te verifiëren" en kies de veilige formulering.
- Leverancier-URL niet te fetchen (AliExpress/1688 blokkeren vaak)? Werk met `input.json`
  `notes` + afbeeldingen in `products/<slug>/source/`, en noteer dit in `research.md`.

## Shopify & GemPages

- **Source of truth = deze repo** (JSON). Shopify is opslag, GemPages is presentatie.
- `node scripts/shopify-push.js <slug>` doet een dry-run; `--push` maakt het product als
  **DRAFT** aan met Hebreeuwse titel/beschrijving, prijs, tags en metafield
  `adina.pdp` (de volledige `page.he.json`) zodat GemPages dynamische content kan binden.
- Nooit een product op ACTIVE zetten zonder expliciete opdracht van de gebruiker.
- Als de Shopify MCP-connector beschikbaar is mag je die ook gebruiken, maar gebruik
  dezelfde velden als `shopify-push.js`.
- GemPages: `output/gempages.html` is een RTL-sectie-voor-sectie export (plakbaar in een
  GemPages "Custom HTML/Liquid" element of als referentie bij het vullen van de template).
  `output/gempages-copy.md` is de copy per sectie in template-volgorde.

## Eindchecklist (zo rapporteer je na `/launch-product`)

```
✓ Product analyzed            research.md
✓ Positioning + name          נועה | חולצת פשתן נושמת
✓ English PDP                 page.en.json
✓ Hebrew PDP (RTL checked)    page.he.json
✓ Ad angles                   5
✓ Ad copy                     HE 15 primary / 15 headlines · EN idem
✓ Creative briefs             7 images · 3 videos
✓ QA                          0 errors · 2 warnings
✓ Export                      output/

READY FOR REVIEW → npm start → http://localhost:3000
```
