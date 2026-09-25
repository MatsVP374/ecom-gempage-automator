# Stap 3: GemPage founder-letter copy (Engelse master) → `03-gempage-copy.en.json`

Lees: `02-central-angle.json`, `01-product-facts.json`, `input.json`, `config/adina.json`,
`brand/gempage-blueprint.md`, `brand/adina.md`.

Schrijf de complete founder letter in het **Engels** als master (structuur + betekenis, voor
review). Stap 6 schrijft de Hebreeuwse versie. `lang: "en"`, `dir: "ltr"`.

- Volg de 17 blokken en velden uit het datacontract in `CLAUDE.md`, **in die volgorde**.
- Adina is de verteller ("I"). Het verhaal volgt `brand/gempage-blueprint.md`: probleem eerst,
  het product pas in `founder_story` → `discovery`.
- `founder_header.note` = het centrale probleem. `headline` = probleem-eerst, geen productnaam, geen korting.
- `benefits` = de 5–6 benefits uit stap 2 (zelfde volgorde, `n`, `feature_ids`). De headline is het
  menselijke probleem, de tekst gaat feature → effect → leven.
- `comparison.columns` = `old_alternative_a` / `old_alternative_b` / productnaam; 3–5 rijen, alleen feiten.
- `founder_quote` = de positionering in één zin (`adina_belief`).
- `sale`: `input.sale_reason` + prijzen uit input. `availability_note` alleen als de input echte
  beschikbaarheidsinfo geeft, anders weglaten.
- `trust_bar`, `social_proof`, `offer_box.rating_line`, `bundle`, `cta`, `about.signoff`: waarden uit
  `config/adina.json`. `social_proof.quotes` alleen uit `input.testimonials`.
- `cta.button`: bij 1 kleur de variant zonder kleur.
- `image`-velden: vul alvast `IMG-01` (hero), `IMG-07` (packing) en voorlopige ID's voor de
  benefit-beelden in. Stap 4 maakt ze definitief en past zo nodig dit bestand aan.
