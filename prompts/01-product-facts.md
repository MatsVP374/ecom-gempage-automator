# Stap 1: Product research / fact sheet → `01-product-facts.json`

Lees: `input.json`, `config/adina.json`, `brand/fact-rules.md`, `brand/testimonial-rules.md`.
Bekijk: `input.existing_product_page` (geplakte `content` eerst, anders de `url` via WebFetch) en elk
beeld in `input.existing_product_images` / `products/<slug>/source/` (lokale beelden met Read).

Doel: één feitenblad waar alle volgende stappen op mogen bouwen, en **niets anders**.

1. Neem naam, Hebreeuwse naam, type, prijzen, promotie, sale reason, kleuren en maten **exact** over uit input.
   Kleuren krijgen een Hebreeuwse vertaling in `he`, maar er komen geen kleuren bij.
2. `features`: elk aangeleverd feature → `{ id: "f1".., fact, source: "input" }`. Features die je
   **aantoonbaar** op de productpagina leest → `source: "product_page"`. Wat je **duidelijk ziet** op een
   beeld (bv. "ribbed cuffs zichtbaar") → `source: "image"`. Twijfel → `unverified`, niet in `features`.
3. `page_facts`: overige feiten van de productpagina (bv. maattabel, samenstelling).
   Staat er iets op de pagina dat botst met input? Input wint, zet het conflict in `unverified`.
4. `image_observations`: per beeld kort wat er te zien is (kleur, details, setting). Dit gebruik je
   in stap 4/5 als referentie.
5. `testimonials`: per aangeleverde testimonial de concrete uitspraken die ze **echt** doet
   (`supported_statements`), of ze genoeg is voor een long-form ad (`sufficient_for_ad`) en wat
   ontbreekt (`gaps`, bv. "geen gebruikssituaties genoemd", "zegt niet hoe ze het product vond").
6. `missing`: verplichte of belangrijke velden die ontbreken of leeg zijn.
7. `status`: `missing_input` als een **verplicht** veld ontbreekt, anders `complete`.

Bij `missing_input`: schrijf het bestand, STOP de pipeline en meld per veld:
`MISSING INPUT: <veld> — nodig voor <waarom>`.
