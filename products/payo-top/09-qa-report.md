# QA — פאיו | טופ יום נעים

## Stap 7: GemPage QC

PRODUCT
☑ Naam correct (פאיו | טופ יום נעים, exact uit Shopify)
☑ Prijs correct (₪359) ☑ Saleprijs correct (₪179)
☑ Kleuren correct (כחול, ירוק, אפור, סגול) ☑ Maten correct (S–3XL)
☑ Elk voordeel verwijst naar een feature (f1–f5)
☑ Geen verzonnen materiaal, halslijn, mouwen of prestaties (niet bekend, dus niet genoemd)

GEMPAGE
☑ Eén centraal probleem: koel blijven in de hitte vs. er verzorgd uitzien
☑ Founder-verhaal consistent met de angle; Daniel en Yael (bevestigd in config)
☑ Begint niet met product of korting; product pas in "discovery"
☑ Voordelen onderbouwd ☑ Vergelijking logisch (basic T-shirt / nette blouse / Payo)
☑ Aanbod correct (₪359 → ₪179, bundel 10/15/20/25, gratis verzending Israel Post, 30 dagen)
☑ Hebreeuws natuurlijk, vrouwelijk enkelvoud ☑ RTL ☑ CTA met kleur (4 kleuren)

IMAGES
☐ Product visueel consistent — nog niet te controleren: beelden niet gegenereerd
☑ Kleuren uit input ☑ Elk beeld heeft een doel en een blok
☑ Variatie: 3 verschillende modellen, 4 kleuren, 7 verschillende settings

## Stap 10: Final QA

TESTIMONIAL
☐ Echte bron aangeleverd — geen testimonials → ads geblokkeerd
☑ Geen verzonnen ervaringen ☑ Geen naam/leeftijd verzonnen

ADS
☐ Precies 2 — BLOCKED (TESTIMONIAL DATA INSUFFICIENT)

OFFER
☑ Verzending correct ☑ Retour 30 dagen ☑ Bundel 10/15/20/25 ☑ 4.7/5 · 2,550+ reviews

CREATIVES
☑ 4 statics (A–D), zelfde angle ☑ Kleuren uit input ☑ UGC: niet gevraagd

## Validator
```

✓ payo-top — 0 errors · 0 warnings · 4 flags
  ■ 0 Product input  ■ 1 Product facts  ■ 2 Central angle  ■ 3 GemPage copy (EN master)  ■ 4 GemPage image plan  ■ 5 Image prompts  □ 5b Images (OpenAI → Shopify)  ■ 6 GemPage build (HE)  □ 7 Quality control  ■ 8 2 Meta ads  ■ 9 Creative plan + UGC  □ 10 Launch package
  FLAG   NO TESTIMONIALS SUPPLIED — the 2 Meta ads will be BLOCKED until real testimonials are added to input.json
  FLAG   MISSING: product construction details (material, neckline, sleeves, length) — concrete benefits and precise image prompts; prompts now rely on the reference photos
  FLAG   MISSING: testimonials — the 2 Meta ads (blocked without real customer reviews)
  FLAG   TESTIMONIAL DATA INSUFFICIENT — no customer reviews/testimonials were supplied for Payo in input.json; both ads (discovery + routine) need a real customer's own words. Add at least 1–2 real reviews (text + source; name/age only if known) and run /meta-ads payo-top.
```

## Flags
- IMAGES NOT GENERATED — OPENAI_API_KEY is not set; cdn.shopify.com is blocked by the environment's network policy (HTTP 403). The .gempages file contains visible placeholders for IMG-01…IMG-07.
- TESTIMONIAL DATA INSUFFICIENT — no reviews supplied; both Meta ads blocked.
- MISSING: product construction details (material, neckline, sleeves, length). Benefits stay on feel/cut/styling; image prompts rely on the reference photos.
- Product photos could not be viewed, so none were reused as GemPage images.

## Voor de mens
- [ ] Sleutels + netwerktoegang instellen → `npm run images -- payo-top` → export opnieuw (dan zitten de echte beelden in de .gempages)
- [ ] Echte Payo-reviews aanleveren → `/meta-ads payo-top`
- [ ] Materiaal/halslijn/mouwlengte bevestigen (maakt de voordelen concreter)
- [ ] Voorraad controleren: alle Shopify-varianten staan op 0 of -1
- [ ] Afbeelding `veronique_1.png` in de huidige productomschrijving komt van de CDN van een andere winkel
- [ ] Hebreeuwse tekst laten meelezen door een moedertaalspreker vóór livegang
