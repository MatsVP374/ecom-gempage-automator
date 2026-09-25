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
  "No text in image." en de consistentiezin over de referentiebeelden.
- `aspect_ratio`: hero 4:5 of 3:4, details 1:1 of 4:5, packing 4:5.
