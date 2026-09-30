# Stap 5: Image-generation prompts → `05-image-prompts.json`

Lees: `04-gempage-image-plan.json`, `01-product-facts.json`, `03-gempage-copy.en.json`, `brand/image-rules.md`.

Voor **elk** beeld met `source: "generate"` precies één prompt:
- `fields`: alle 13 velden ingevuld (`subject`, `age`, `product`, `exact_color`, `styling`, `action`,
  `environment`, `framing`, `light`, `mood`, `must_be_visible`, `realism`, `must_not_change`).
- `exact_color` = de `product_color` uit het plan (exact een inputkleur).
- `product` en `must_not_change`: beschrijf het product **alleen** met geverifieerde features en wat op
  de referentiebeelden te zien is. Noem expliciet wat niet mag veranderen (knopen, zakken, naden,
  materiaal, decoratie).
- `must_be_visible` = het feature dat dit beeld moet bewijzen, met de reden ("because this photo
  accompanies the section explaining …").
- `reference_images` = de bestaande productbeelden die als referentie moeten dienen.
- `prompt` = één production-ready Engelse prompt volgens de vorm in `brand/image-rules.md`, met
  "No text in image.", de consistentiezin over de referentiebeelden en — bij elke persoon in beeld — de
  **castingzin** én de **stijlzin** (`Photo style: a natural, flattering lifestyle photo…`) letterlijk uit `brand/image-rules.md`
  (aantrekkelijke Israëlische vrouw van ongeveer 45–58, verzorgd en aspirationeel; `[45–58]` vervangen door de leeftijd).
- `age`: één leeftijd per foto binnen 45–60 en **gevarieerd** over de pagina (bijv. 47, 53, 57 — verschillende banden
  45–50 / 50–55 / 55–60, niet allemaal dezelfde). `styling` modern en elegant, `light` zacht en flatterend,
  `mood` zelfverzekerd, ontspannen en warm. Geen woorden uit de vermijdlijst in `brand/image-rules.md` → Casting.
- `aspect_ratio`: **altijd `4:5`** voor elke GemPage-foto (hero, details, packing). Eén formaat = een rustige pagina op mobiel.
