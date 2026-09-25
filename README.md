# Adina Launch Engine

Van **leverancier-URL** naar een **Hebreeuwse productpagina**, **GemPages/Shopify** en een compleet
**advertentiepakket**, met Claude Code als motor.

```
URL → analyse → positionering + naam → Engelse PDP → Hebreeuwse PDP (RTL-check)
    → ad angles → ad copy HE/EN → creative briefs → QA → export (GemPages · Shopify · Meta CSV)
```

Geen `npm install` nodig: alles is Node 20+ zonder dependencies.

---

## Snel starten

```bash
git clone <deze repo> && cd ecom-gempage-automator
cp .env.example .env          # alleen nodig voor Shopify-push
npm start                     # → http://localhost:3000
```

Klik in de UI op **+ Nieuw product**, vul de URL + prijzen in, en druk op
**🚀 GENERATE COMPLETE LAUNCH**. De UI start Claude Code op de achtergrond
(`claude -p "/launch-product <slug>"`) en je ziet live welke stap bezig is.

Daarvoor moet [Claude Code](https://docs.claude.com/en/docs/claude-code) geïnstalleerd en ingelogd zijn
(`claude` in je terminal). Staat hij ergens anders: `CLAUDE_BIN=/pad/naar/claude npm start`.

### Of helemaal vanuit Claude Code

```
claude
> /launch-product https://supplier.com/product/123 price=179 cost=12.5 notes="focus op ademende stof"
```

| Commando | Wat het doet |
|---|---|
| `/launch-product <slug\|url>` | Volledige pipeline, slaat bestaande stappen over (`--force` = alles opnieuw) |
| `/launch-step <slug> <stap>` | Eén stap opnieuw: `research`, `positioning`, `page`, `hebrew`, `angles`, `copy`, `creatives`, `qa` |
| `/translate-he <slug> [instructies]` | Hebreeuws opnieuw lokaliseren, bv. "korter en feestelijker" |
| `/ad-pack <slug> [instructies]` | Angles/copy/creatives (opnieuw), of extra angles toevoegen ("3 angles voor Rosh Hashana") |
| `/push-shopify <slug>` | Validatie → dry-run → na jouw "ja" als DRAFT in Shopify |

## De UI

| Tab | Inhoud |
|---|---|
| **OVERVIEW** | Generate-knop, pipeline-checklist, live log, positionering, research |
| **PAGE** | Preview van de productpagina, HE (RTL) en EN |
| **HEBREW** | Engels en Hebreeuws naast elkaar, veld voor veld |
| **ADS** | Angle-matrix + alle copy met tekenteller (Meta-limieten), Meta CSV-download |
| **CREATIVES** | Image- en videobriefs met kant-en-klare beeldprompts |
| **QA** | Validator-uitslag (errors/warnings) + menselijke checklist |
| **EXPORT** | Export opnieuw bouwen, Shopify dry-run/push, alle outputbestanden |

## Wat er per product ontstaat

```
products/<slug>/
├── input.json          jouw input (URL, prijzen, notes)
├── source/             leveranciersfoto's (optioneel, Claude bekijkt ze)
├── research.md         feiten, te-verifiëren, pijn/verlangen/bezwaren, marge
├── product.json        naam (נועה), positionering, prijs, aanbod, specs, Shopify-velden
├── page.en.json        productpagina — Engelse basis
├── page.he.json        productpagina — Hebreeuws (verkooptaal)
├── ads.json            5 angles + copy HE/EN (3 primary texts × 3 headlines per angle)
├── creatives.md        7 image briefs + 3 videoconcepten + shotlist
├── qa.md               wat gefixt is + wat jij nog moet checken
└── output/             (gegenereerd, niet in git)
    ├── gempages.html         RTL-secties, plakbaar in GemPages Custom HTML
    ├── gempages-copy.md      copy per sectie in template-volgorde
    ├── page.he.html / page.en.html   previews
    ├── meta-ads.csv          alle combinaties (angle × primary × headline), UTF-8 met BOM
    ├── ad-pack.md            leesbaar advertentiepakket
    └── shopify-product.json  exacte payload voor Shopify
```

`products/noa-linen-top/` is een volledig uitgewerkt voorbeeld én de kwaliteitsreferentie voor Claude.

## GemPages & Shopify

De repo is de **source of truth**; Shopify slaat op, GemPages presenteert.

1. **Eén keer**: bouw in GemPages een productpagina-template met de secties uit
   `brand/product-page-rules.md` (hero, benefits, story, features, comparison, size guide,
   reviews, FAQ, guarantee, CTA). Titel/prijs/varianten/foto's koppel je dynamisch aan Shopify.
2. **Per product**: `npm run shopify -- <slug>` (dry-run) → `npm run shopify -- <slug> --push`.
   Het product komt als **DRAFT** in Shopify met Hebreeuwse titel en beschrijving, prijs en
   compare-at, maat/kleur-varianten, tags, SEO, en metafield **`adina.pdp`** (de volledige
   Hebreeuwse pagina als JSON) voor dynamische GemPages-content.
3. Wijs de GemPages-template toe aan het product, en vul de sectie-teksten via de metafield of
   plak ze uit `output/gempages-copy.md`.

Shopify-token: maak in Shopify Admin → *Settings → Apps → Develop apps* een custom app met
`write_products`, en zet `SHOPIFY_STORE_DOMAIN` + `SHOPIFY_ADMIN_TOKEN` in `.env`.

## Scripts

```bash
npm run new -- <slug> --url <url> --price 179 --cost 12.5 --notes "..."
npm run validate -- <slug>        # of --all; exit 1 bij errors
npm run export -- <slug>          # of --all
npm run shopify -- <slug> [--push]
npm test                          # validate + export voor alle producten (ook in GitHub Actions)
```

De validator bewaakt o.a.: datacontract, prijs gelijk in alle bestanden, marge ≥ 3× inkoop,
Hebreeuwse velden echt Hebreeuws (geen achtergebleven Engels, bidi-sprongen), Meta-lengtes
(headline ≤ 40, description ≤ 30), sectie-volgorde, reviews als placeholder, en verboden claims
(valse schaarste, afslank/anti-aging, verzonnen klantaantallen, leeftijd van de lezer benoemen).

## Jouw workflow vastleggen

Alles wat Claude over Adina weet staat in platte tekst, pas het aan en elke volgende launch volgt het:

| Bestand | Inhoud |
|---|---|
| `CLAUDE.md` | pipeline, datacontract, harde regels |
| `brand/adina.md` | merk, tone of voice, naamgeving, prijsstrategie, verzending/retour |
| `brand/customer-avatar.md` | klant, pijn, verlangens, bezwaren, momenten |
| `brand/copywriting-rules.md` | wel/niet, Meta-regels, awareness-niveaus |
| `brand/hebrew-style.md` | Hebreeuwse stijl, woordenlijst, RTL-regels |
| `brand/product-page-rules.md` | vaste PDP-structuur |
| `prompts/01…08-*.md` | instructies per pipeline-stap |

## Volgende stappen (nog niet gebouwd)

- **Creatives genereren**: de beeldprompts uit `creatives.md` automatisch door een image/video-API halen.
- **Meta Ads API**: campagnes direct als paused aanmaken vanuit `ads.json`.
- **GitHub-issue → launch**: met `anthropics/claude-code-action` een issue "Launch: <url>" automatisch
  laten uitvoeren en als PR laten opleveren.
