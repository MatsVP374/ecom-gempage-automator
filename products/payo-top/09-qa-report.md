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
☑ Echte bron aangeleverd — 23 reviews (5★, door de gebruiker aangeleverd op 2026-09-27)
☑ Geen verzonnen ervaringen ☑ Naam/leeftijd alleen uit de reviews (leeftijd alleen bij t14, die haar leeftijd zelf noemt)
☑ Review onder elke GemPage-foto: 6/6 letterlijke fragmenten (t3, t13, t4, t6, t5, t8) + 3 winkelreviews in social proof (t9, t17, t16)

ADS
☑ Precies 2: ad1 discovery (t14 אסתר דיין) · ad2 routine (t5 אורית מזרחי)
☑ Elke eerste-persoonservaring getraced naar de review; de rest komt uit de brief, de feiten of de config
☑ Aanbod pas aan het eind ☑ Einde leidt naar het brief van Adina ☑ Spellingcheck + proeflezen (Payo consequent vrouwelijk)

OFFER
☑ Verzending correct ☑ Retour 30 dagen ☑ Bundel 10/15/20/25 ☑ 4.7/5 · 2,550+ reviews

CREATIVES
☑ 4 statics (A–D), zelfde angle ☑ Kleuren uit input ☑ UGC: niet gevraagd

## Validator
```
✓ payo-top — 0 errors · 0 warnings · 1 flags
  ■ 0 Product input  ■ 1 Product facts  ■ 2 Central angle  ■ 3 GemPage copy (EN master)  ■ 4 GemPage image plan  ■ 5 Image prompts  □ 5b Images (Gemini/OpenAI → Shopify)  ■ 6 GemPage build (HE)  ■ 6b Spellcheck (HE)  ■ 7 Quality control  ■ 8 2 Meta ads  ■ 9 Creative plan + UGC  ■ 10 Launch package
  FLAG   MISSING: product construction details (material, neckline, sleeves, length) — concrete benefits and precise image prompts; prompts now rely on the reference photos
```

## Flags
- IMAGES NOT GENERATED — Gemini API returns 429 (free tier, limit 0) for the key in this environment; billing must be enabled on that key's Google project. The .gempages file contains visible placeholders for IMG-01…IMG-07.
- MISSING: product construction details (material, neckline, sleeves, length). Benefits stay on feel/cut/styling; image prompts rely on the reference photos.
- Product photos could not be viewed, so none were reused as GemPage images.

## Voor de mens
- [ ] Sleutels + netwerktoegang instellen → `npm run images -- payo-top` → export opnieuw (dan zitten de echte beelden in de .gempages)
- [x] Echte Payo-reviews aangeleverd → 2 ads geschreven, reviews onder elke foto
- [ ] Bevestigen dat de 23 reviews echte klantreviews zijn (ze staan met naam op de pagina en in de ads)
- [ ] Materiaal/halslijn/mouwlengte bevestigen (maakt de voordelen concreter)
- [ ] Voorraad controleren: alle Shopify-varianten staan op 0 of -1
- [ ] Afbeelding `veronique_1.png` in de huidige productomschrijving komt van de CDN van een andere winkel
- [ ] Hebreeuwse tekst laten meelezen door een moedertaalspreker vóór livegang
