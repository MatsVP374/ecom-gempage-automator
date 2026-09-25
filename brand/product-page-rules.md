# Productpagina-regels (PDP)

## Boven de vouw (mobiel)
1. Titel: `<naam> | <type + kernvoordeel>`
2. Subtitel: één zin die de belofte samenvat.
3. Prijs + compare-at + badge (bv. "20% הנחה על הפריט השני").
4. **4 bullets** met ✓ — voordeel + bewijs, max ~45 tekens per bullet.
5. CTA-knop + trust line (verzending · retour · veilig betalen).

## Secties (vaste volgorde)
1. `hero` — emotionele headline + subheadline, beeld: product gedragen in een Israëlische setting.
2. `benefits` — 3–4 voordelen met emoji-icoon.
3. `story` — "Waarom Adina dit stuk koos" — 3–5 zinnen, persoonlijk, in de stem van Adina.
4. `features` — 4–6 feiten (materiaal, pasvorm, lengte, onderhoud).
5. `comparison` — Adina vs. "gewone blouse uit de winkel" (4–5 rijen). Geen merknamen.
6. `size_guide` — tabel in cm + pasvormadvies.
7. `reviews` — ALTIJD `placeholder: true`, 3 voorbeeld-items die later vervangen worden.
8. `faq` — 5–7 vragen: maat, stof/doorschijnend, verzending, retour, wassen, betalen.
9. `guarantee` — 30 dagen retour, warm geformuleerd.
10. `cta` — herhaling aanbod + knop.

## SEO
- `seo.title` max 60 tekens, `seo.description` max 155 tekens.

## GemPages
De template in GemPages heeft voor elke sectie hierboven een blok met dezelfde volgorde.
Product-titel, prijs, varianten en afbeeldingen komen dynamisch uit Shopify.
Sectie-content komt uit metafield `adina.pdp` of wordt geplakt vanuit `output/gempages-copy.md`.
