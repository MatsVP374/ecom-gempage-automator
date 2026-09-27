# Adina Fashion Launch Engine

De vaste product-launch-workflow van **Adina Fashion**, uitgevoerd door Claude Code.

```
META CREATIVE → CUSTOMER AD STORY → ADINA FOUNDER LETTER → PRODUCT/OFFER → PURCHASE
                 (klant-hoofdstuk)    (Adina's hoofdstuk)    (conversie)
```

Voor elk nieuw product:

```
INPUT NEW PRODUCT
  → [1] Product research / fact sheet
  → [2] Marketing angle            ← single source of truth voor alles hierna
  → [3] GemPage founder-letter copy (Engelse master)
  → [4] GemPage image plan         ← welke extra storytelling-foto's de brief nodig heeft
  → [5] Image-generation prompts
  → [5b] Beelden genereren (OpenAI) + uploaden naar Shopify-CDN   ← script, volledig automatisch
  → [6] GemPage build (Hebreeuws)
  → [6b] Hebreeuwse spellingcheck  ← script + proeflezen door Claude
  → [7] Quality control
  → [9] Creative plan (4 statics + optioneel UGC)
  → [10] FINAL LAUNCH PACKAGE
```

**Er wordt niets verzonnen.** Ontbreekt een verplicht veld, dan stopt de workflow met `MISSING INPUT`.
Onder elke voordeelfoto komt een **echte klantreview** (letterlijk, uit jouw input). Zonder passende review blijft
die plek leeg; er wordt nooit een review verzonnen. **De ad copy schrijf je zelf**; deze workflow levert de GemPage
en de creatives waar je ads naartoe leiden.

Geen `npm install` nodig (Node 20+, geen dependencies).

---

## Een nieuw product starten

### Optie A: de UI
```bash
npm start          # → http://localhost:3000
```
1. **+ New Adina product launch** → vul het formulier in (zie "Wat je aanlevert").
2. Ontbreekt er iets verplicht, dan zie je het in rood en blijft Generate uit.
3. **🚀 GENERATE COMPLETE LAUNCH**: Claude Code draait de hele pipeline op de achtergrond, met live log.
4. Bekijk en kopieer het resultaat in de tabs: ANGLE · GEMPAGE · IMAGES · CREATIVES · QA · EXPORT.

Vereist: [Claude Code](https://docs.claude.com/en/docs/claude-code) geïnstalleerd en ingelogd (`claude`).
Anders pad: `CLAUDE_BIN=/pad/naar/claude npm start`.

### Optie B: in Claude Code
```
claude
> /new-launch            ← toont het input-template; plak het ingevuld terug
> /launch-product <slug> ← draait stap 1–10
```

| Commando | Wat het doet |
|---|---|
| `/new-launch [input]` | Intake: zet jouw productinput om naar `products/<slug>/input.json` en flagt wat ontbreekt |
| `/launch-product <slug> [--force]` | Volledige pipeline; slaat bestaande stappen over (`--force` = alles opnieuw) |
| `/launch-step <slug> <stap> [instructies]` | Eén stap opnieuw: `facts`, `angle`, `gempage`, `image-plan`, `image-prompts`, `gempage-he`, `spellcheck`, `qc`, `creatives`, `package` |
| `/push-shopify <slug>` | Validatie → dry-run → na jouw "ja" als DRAFT in Shopify |

## Automatisering: OpenAI-beelden + importeerbare GemPage

- **Tekst** (fact sheet, angle, brief, creatives) schrijft Claude Code volgens de blueprints.
- **Beelden**: `npm run images -- <slug>` stuurt elke beeldprompt, met de bestaande productfoto's als referentie,
  naar **Gemini** (`gemini-3.1-flash-image`, instelbaar met `GEMINI_IMAGE_MODEL`) of **OpenAI**
  (`OPENAI_IMAGE_MODEL`). Kiezen met `IMAGE_PROVIDER=gemini|openai`; zonder keuze wordt Gemini gebruikt als
  `GEMINI_API_KEY` er is. `npm run images -- <slug> compare` maakt de hero met beide, om te vergelijken. Het resultaat gaat naar
  Shopify Files en de CDN-URL komt in het beeldplan. Bestaande productfoto's worden nooit opnieuw gegenereerd.
  In de UI: tab IMAGES → **🎨 Genereer + upload**.
- **GemPage**: `output/<slug>-founder-letter.gempages` is een echt GemPages-exportbestand (zelfde formaat als
  een export uit GemPages), met de brief in het Adina-design. In GemPages: **Pages → Import → upload**.

Nodig in `.env` (zie `.env.example`): `GEMINI_API_KEY` en/of `OPENAI_API_KEY`, `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_ADMIN_TOKEN`
(custom app met `write_files` en `write_products`). Draai je het in de cloud, laat dan netwerktoegang toe tot
`generativelanguage.googleapis.com` (Gemini), `api.openai.com` (OpenAI), `<winkel>.myshopify.com`, `cdn.shopify.com` en `storage.googleapis.com` (Shopify-uploads).

## Wat je aanlevert

Template: `templates/product-input.md` (hetzelfde als het formulier in de UI).

**Verplicht:** product name · Hebrew product name · product type · regular price · sale price ·
promotion · current sale reason · available colors · available sizes · product features ·
existing product page (URL en/of geplakte tekst) · existing product images (URL's of bestanden in
`products/<slug>/source/`).

**Nodig voor de reviews onder de foto's:** echte customer reviews. Per review: de letterlijke tekst, de
bron, en naam/leeftijd/sterren **alleen als je ze echt weet**. Tip: 5–6 reviews die elk een ander voordeel noemen.

**Optioneel:** known customer problems · central problem (als je hem al weet) · competitor/reference ·
extra product info · UGC nodig (ja/nee) · launch month.

**Niet per product** (staat vast in `config/adina.json`): gratis verzending met Israel Post · 30 dagen
retour · bundel 2 = 10% · 3 = 15% · 4 = 20% · 5+ = 25% extra · 4.7/5 uit 2,550+ reviews · 15+ jaar.

## Wat eruit komt

```
products/<slug>/
├── input.json                 jouw input
├── source/                    bestaande productfoto's (optioneel)
├── 01-product-facts.json      geverifieerde feiten (+ bron per feit), missing, unverified
├── 02-central-angle.json      de 10 vragen + centrale angle + 5–6 voordelen
├── 03-gempage-copy.en.json    founder letter, Engelse master (voor review)
├── 03-gempage-copy.he.json    founder letter, Hebreeuws (live)
├── 03-gempage-spellcheck.json spellingcheck: verbeteringen + twijfels
├── 04-gempage-image-plan.json ±7 beelden, elk gekoppeld aan een GemPage-blok
├── 05-image-prompts.json      production-ready prompts (13 vaste velden)
├── 07-creative-plan.json      4 statics (A discovery · B boutique/offer · C everyday · D designed hook)
├── 08-ugc.json                UGC-script (alleen als gevraagd)
├── 09-qa-report.md            QA-checklist + flags + "voor de mens"
└── output/                    ← het launch package
    ├── <slug>-founder-letter.gempages   ⭐ importeerbaar in GemPages
    ├── launch-package.md      ✓/✗-overzicht + READY FOR
    ├── gempage-copy.md        copy per GemPage-blok (26 elementen), plakklaar
    ├── gempage.he.html        preview (RTL) · gempage.en.html (master)
    ├── image-prompts.md       beeldplan + prompts
    ├── creative-plan.md       statics + UGC
    └── shopify-product.json   DRAFT-payload
```

## Waar het systeem staat (hier pas je Adina aan)

| Bestand | Inhoud |
|---|---|
| `config/adina.json` | **Globale feiten**: trust, verzending, retour, bundel, vaste Hebreeuwse teksten (byline, badge, CTA's, brand line) |
| `CLAUDE.md` | Pipeline, datacontract, harde regels |
| `brand/gempage-blueprint.md` | De founder-letter GemPage, blok voor blok |
| `brand/ad-system.md` | Aansluiting op jouw Meta-ads, UGC-script |
| `brand/testimonial-rules.md` | Wat wel/niet mag met testimonials |
| `brand/image-rules.md` | Beeldplan, promptformaat, statische creatives |
| `brand/fact-rules.md` | Nooit verzinnen + hoe ontbrekende input geflagd wordt |
| `brand/adina.md` · `customer-avatar.md` · `hebrew-style.md` | Merk, klant, Hebreeuws/RTL |
| `prompts/01…10-*.md` | Instructies per pipeline-stap |

Wijzigingen aan `config/` vragen in Claude Code altijd eerst bevestiging.

## Spellingcheck (`npm run spellcheck -- <slug>`)
Controleert alle Hebreeuwse klantteksten (GemPage, overlay-teksten, UGC): sluitletters (ך ם ן ף ץ), aan elkaar
geplakt Hebreeuws/Latijn, dubbele woorden, nikud, spaties/leestekens, spellingvarianten (הכל/הכול) en bekende spelfouten
uit `brand/hebrew-spelling.json` (die lijst vul je zelf aan). Daarna leest Claude alles proef op grammatica, vrouwelijke
aanspreekvorm en natuurlijk Hebreeuws, en legt elke verbetering vast in `03-gempage-spellcheck.json`.
Spelling-errors blokkeren de validatie; de validator waarschuwt als een tekst na de laatste check is gewijzigd.

## Controles (`npm run validate -- <slug>`)

De validator houdt de workflow eerlijk:
- verplichte input aanwezig; prijzen overal gelijk aan input; geen onbekende ₪-bedragen
- kleuren alleen uit input (feiten, beeldplan, prompts, creatives)
- elk voordeel verwijst naar een aangeleverd feature
- GemPage: exacte blokvolgorde, vaste Hebreeuwse teksten, probleem-eerst (geen korting of product in de header),
  bundel exact 10/15/20/25, trust-waarden uit config
- oude logica geblokkeerd: "2e item 20%", "7–14 werkdagen", voorraadclaims, medische claims
- beelden: elk beeld een doel en een blok, alle 13 promptvelden, geen regeneratie van bestaande foto's
- reviews: elke review hoort bij een echte testimonial en is in het Hebreeuws een letterlijk fragment ervan;
  meldt hoeveel voordeelfoto's nog geen review hebben
- casting: Israëlische vrouwen van 40–60 in elke prompt met een persoon
- Hebreeuwse spelling (zie Spellingcheck)

`npm test` draait de testsuite (met een DEMO-fixture, geen echt product) + validatie van alle producten; ook in GitHub Actions.

## Shopify & GemPages
- `npm run shopify -- <slug>` = dry-run; `--push` maakt het product als **DRAFT** (Hebreeuwse naam, sale- en
  compare-at-prijs, kleurvarianten, metafield `adina.gempage` met de volledige brief). Maten als range
  (`S–5XL`) worden niet automatisch varianten. Dat meldt de dry-run.
- Token: Shopify Admin → Settings → Apps → Develop apps → custom app met `write_products`; zet
  `SHOPIFY_STORE_DOMAIN` + `SHOPIFY_ADMIN_TOKEN` in `.env`.
- GemPages: bouw één keer de Adina founder-letter template met de 17 blokken uit `brand/gempage-blueprint.md`;
  vul hem per product vanuit `output/gempage-copy.md`.
