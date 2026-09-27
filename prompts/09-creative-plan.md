# Stap 9: Creative plan + UGC → `07-creative-plan.json`, `08-ugc.json`

Lees: `02-central-angle.json`, `03-gempage-copy.he.json`, `04-gempage-image-plan.json`, `01-product-facts.json`,
`brand/image-rules.md`, `brand/ad-system.md` (UGC).

## Statics: precies 4
`A customer_discovery` (spontane klant-lifestyle) · `B raw_boutique_offer` (prijs mag zichtbaar) ·
`C everyday_use` (andere situatie/model/kleur dan A) · `D designed_hook` (`overlay_text_he` = de centrale
probleem-hook in het Hebreeuws, hooguit enkele voordelen + het aanbod).
- Niet simpelweg GemPage-foto's hergebruiken. Wel dezelfde angle.
- Per creative: `concept`, `visual`, `product_color` (inputkleur),
  `format` (4:5 feed / 9:16 stories), `prompt` (production-ready, zelfde realisme- en
  consistentie- en castingregels (Israëlische vrouwen 40–60) als de GemPage-prompts; bij tekst-overlay: tekst wordt in de editor toegevoegd,
  "no text in image" in de prompt).

## UGC
- `input.ugc_needed` true → `08-ugc.json` met `needed: true`, `voice`, en `script` volgens de
  timing in `brand/ad-system.md` (`voice_he` natuurlijk Hebreeuws). Zelfde angle, geen voorgelezen
  ad-tekst, geen verzonnen persoonlijke ervaringen.
- Anders → `{ "needed": false, "reason": "not requested in input" }`.
