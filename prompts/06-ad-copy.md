# Stap 6 — Ad copy → `ads.json.copy`

Lees: `ads.json.angles`, `product.json`, `page.he.json`, `brand/copywriting-rules.md`, `brand/hebrew-style.md`.

Per angle, voor **he** én **en**:
- `primary_texts`: 3 varianten — (a) kort ≤ 125 tekens, (b) middel ~250, (c) verhaal ~400.
  De hook staat altijd in de eerste 125 tekens.
- `headlines`: 3 varianten, **max 40 tekens**.
- `descriptions`: 1–2 varianten, **max 30 tekens**.

Hebreeuws is leidend: schrijf de HE-versie als origineel (niet vertaald uit EN), vrouwelijk
enkelvoud, Israëlische momenten. De EN-versie is voor intern overzicht/testen.

Geen leeftijd/lichaamskenmerken van de lezer benoemen (Meta Personal Attributes).
Geen verzonnen reviews of aantallen. Draai daarna `node scripts/validate.js <slug>`.
