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
  → [6] GemPage build (Hebreeuws)
  → [7] Quality control
  → [8] 2 long-form Meta-ads       ← vanuit een echte klanttestimonial
  → [9] Creative plan (4 statics + optioneel UGC)
  → [10] FINAL LAUNCH PACKAGE
```

**Er wordt niets verzonnen.** Ontbreekt een verplicht veld, dan stopt de workflow met `MISSING INPUT`.
Zijn er geen of te weinig testimonials, dan worden de ads geblokkeerd met
`TESTIMONIAL DATA INSUFFICIENT` in plaats van een nep-klantverhaal te schrijven.

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
4. Bekijk en kopieer het resultaat in de tabs: ANGLE · GEMPAGE · IMAGES · META ADS · CREATIVES · QA · EXPORT.

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
| `/launch-step <slug> <stap> [instructies]` | Eén stap opnieuw: `facts`, `angle`, `gempage`, `image-plan`, `image-prompts`, `gempage-he`, `qc`, `meta-ads`, `creatives`, `package` |
| `/meta-ads <slug> [instructies]` | Alleen de 2 Meta-ads (opnieuw), bv. nadat je testimonials hebt toegevoegd |
| `/push-shopify <slug>` | Validatie → dry-run → na jouw "ja" als DRAFT in Shopify |

## Wat je aanlevert

Template: `templates/product-input.md` (hetzelfde als het formulier in de UI).

**Verplicht:** product name · Hebrew product name · product type · regular price · sale price ·
promotion · current sale reason · available colors · available sizes · product features ·
existing product page (URL en/of geplakte tekst) · existing product images (URL's of bestanden in
`products/<slug>/source/`).

**Nodig voor de ads:** echte customer reviews/testimonials. Per testimonial: de letterlijke tekst, de
bron, en naam/leeftijd/details **alleen als je ze echt weet**.

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
├── 04-gempage-image-plan.json ±7 beelden, elk gekoppeld aan een GemPage-blok
├── 05-image-prompts.json      production-ready prompts (13 vaste velden)
├── 06-meta-ads.json           2 ads + trace (bron van elke claim) + Engelse leesversie
├── 07-creative-plan.json      4 statics (A discovery · B boutique/offer · C everyday · D designed hook)
├── 08-ugc.json                UGC-script (alleen als gevraagd)
├── 09-qa-report.md            QA-checklist + flags + "voor de mens"
└── output/                    ← het launch package
    ├── launch-package.md      ✓/✗-overzicht + READY FOR
    ├── gempage-copy.md        copy per GemPage-blok (26 elementen), plakklaar
    ├── gempage.he.html        preview (RTL) · gempage.en.html (master)
    ├── gempage-embed.html     plakbaar in een GemPages Custom HTML-element
    ├── image-prompts.md       beeldplan + prompts
    ├── meta-ads.md            exact Ads Manager-formaat (AD 1 / PRIMARY TEXT / HEADLINE / DESCRIPTION)
    ├── meta-ads.csv
    ├── creative-plan.md       statics + UGC
    └── shopify-product.json   DRAFT-payload
```

## Waar het systeem staat (hier pas je Adina aan)

| Bestand | Inhoud |
|---|---|
| `config/adina.json` | **Globale feiten**: trust, verzending, retour, bundel, vaste Hebreeuwse teksten (byline, badge, CTA's, brand line) |
| `CLAUDE.md` | Pipeline, datacontract, harde regels |
| `brand/gempage-blueprint.md` | De founder-letter GemPage, blok voor blok |
| `brand/ad-system.md` | De 2 long-form testimonial-ads, stijl, UGC |
| `brand/testimonial-rules.md` | Wat wel/niet mag met testimonials |
| `brand/image-rules.md` | Beeldplan, promptformaat, statische creatives |
| `brand/fact-rules.md` | Nooit verzinnen + hoe ontbrekende input geflagd wordt |
| `brand/adina.md` · `customer-avatar.md` · `hebrew-style.md` | Merk, klant, Hebreeuws/RTL |
| `prompts/01…10-*.md` | Instructies per pipeline-stap |

Wijzigingen aan `config/` vragen in Claude Code altijd eerst bevestiging.

## Controles (`npm run validate -- <slug>`)

De validator houdt de workflow eerlijk:
- verplichte input aanwezig; prijzen overal gelijk aan input; geen onbekende ₪-bedragen
- kleuren alleen uit input (feiten, beeldplan, prompts, creatives)
- elk voordeel verwijst naar een aangeleverd feature
- GemPage: exacte blokvolgorde, vaste Hebreeuwse teksten, probleem-eerst (geen korting of product in de header),
  bundel exact 10/15/20/25, trust-waarden uit config
- oude logica geblokkeerd: "2e item 20%", "7–14 werkdagen", voorraadclaims, medische claims
- beelden: elk beeld een doel en een blok, alle 13 promptvelden, geen regeneratie van bestaande foto's
- ads: precies 2 (discovery + routine), elke ad gekoppeld aan een echte testimonial, elke claim getraced,
  geen verzonnen leeftijd, Adina + brief-brug aanwezig, prijs laat in de tekst, twee echt verschillende verhalen,
  geen clichés/emoji-regens

`npm test` draait de testsuite (met een DEMO-fixture, geen echt product) + validatie van alle producten; ook in GitHub Actions.

## Shopify & GemPages
- `npm run shopify -- <slug>` = dry-run; `--push` maakt het product als **DRAFT** (Hebreeuwse naam, sale- en
  compare-at-prijs, kleurvarianten, metafield `adina.gempage` met de volledige brief). Maten als range
  (`S–5XL`) worden niet automatisch varianten. Dat meldt de dry-run.
- Token: Shopify Admin → Settings → Apps → Develop apps → custom app met `write_products`; zet
  `SHOPIFY_STORE_DOMAIN` + `SHOPIFY_ADMIN_TOKEN` in `.env`.
- GemPages: bouw één keer de Adina founder-letter template met de 17 blokken uit `brand/gempage-blueprint.md`;
  vul hem per product vanuit `output/gempage-copy.md`.
