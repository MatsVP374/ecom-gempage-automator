# Stap 6: GemPage build / Hebreeuws → `03-gempage-copy.he.json`

Lees: **`brand/hebrew-copy.md` (de standaard voor de Hebreeuwse tekst)**, `03-gempage-copy.en.json`,
`02-central-angle.json`, `01-product-facts.json`, `config/adina.json`, `brand/hebrew-style.md`, `brand/adina.md`,
`brand/gempage-blueprint.md`.

Schrijf de founder letter in het **Hebreeuws**, met dezelfde blokken, volgorde, `id`s, `n`s,
`feature_ids` en `image`-ID's als de Engelse master. `lang: "he"`, `dir: "rtl"`.

- **Schrijf, vertaal niet.** Het moet klinken als een persoonlijke brief van een Israëlische
  boetiekeigenares aan vrouwen van 45–65+: warm, volwassen, natuurlijk Israëlisch Hebreeuws, vrouwelijk enkelvoud
  naar de lezer. Beoordeeld wordt op natuurlijkheid, niet alleen op correctheid (`brand/hebrew-copy.md`).
- **Werkwijze per blok:** lees het Engelse blok voor de betekenis en de feiten, en schrijf het dan opnieuw zoals Adina
  het in het Hebreeuws zou zeggen. Vast liggen: blokken, velden, feiten, claims, prijzen, ID's. Vrij zijn:
  zinsbouw, zinsvolgorde binnen een alinea, zinnen splitsen of samenvoegen, beeldspraak en woordkeus. Engelse
  beeldspraak en oneliners niet overnemen maar vervangen door wat in het Hebreeuws natuurlijk is.
- **Koppen** (hoofdkop, ondertitel, voordeel-koppen, sectietitels): conversational en emotioneel natuurlijk, zoals een
  vrouw het zelf zou zeggen; de voordeel-koppen niet allemaal in dezelfde bouw. Het voorbeeld in `brand/hebrew-copy.md`
  is een standaard, geen zin om te hergebruiken.
- Vaste teksten **exact** uit `config/adina.json` → `landing_page`: `byline`, `badge`, `greeting`,
  het voorvoegsel van `note`, `about.title`, `about.signoff` (= `founder.brand_line_he`), en de productroutes
  `cta.button` (`cta_he`) en `sticky_cta.text` (`sticky_cta_he`) met `{name}` = korte productnaam (vóór `|`), `{price}` = saleprijs.
- `place_date`: `תל אביב · <Hebreeuwse maand> <jaar>` uit `input.launch_month`.
- `benefits[].review` en `social_proof.quotes`: dezelfde `testimonial_id` als de master, `text` letterlijk uit de
  Hebreeuwse review (`text`, of `text_he` als de review in een andere taal is). Niet herschrijven, alleen inkorten.
- Productnaam exact `input.hebrew_product_name` in `offer_box.product_name`.
- Prijzen exact uit input. Bundel-`label`s exact `config.bundle_discount[].label_he`.
- `trust_bar` zoals in het blueprint (₪sale / 15+ / 2,550+ / 30).
- De productbox bouwt de GemPage zelf (zie blueprint → Productroutes).

Daarna: stap 6b (`prompts/06b-spellcheck.md`), stap 6c (`prompts/06c-hebrew-naturalness.md`),
`node scripts/validate.js <slug>` en fix alle errors. Dan `node scripts/export.js <slug>`
en bekijk `output/gempage.he.html` op RTL-problemen (zie `brand/hebrew-style.md` → RTL-QA).
