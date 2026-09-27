# Stap 11: Upload naar GemPages → `10-gempages-upload.json`

Alleen als de GemPages-koppeling (Gemcommerce MCP) in de sessie zit. Anders: de gebruiker importeert
`output/<slug>-founder-letter.gempages` zelf (Pages → Import).

1. **Laatste controle vóór upload** (alles moet slagen, anders niet uploaden):
   `node scripts/validate.js <slug>` (0 errors) · `node scripts/spellcheck.js <slug>` (0 errors) ·
   alle beeld-URL's uit `04-gempage-image-plan.json` geven 200 · de productpagina geeft 200 ·
   in de `.gempages`: 2 links naar de productpagina (knop + sticky), geen placeholders.
2. Winkel: `gempages_list_connected_shops` → `get_shop` (themeID).
3. `gempages_validate_page_handle` (`<korte-naam>-founder-letter`) → `gempages_create_page`
   met `type: GP_STATIC`, **`status: DRAFT`**.
4. `gempages_create_section` met `cid` en `component` = de sectie uit het `.gempages`-bestand
   (één Custom Code-element met de brief), daarna `gempages_update_page` met `sectionPosition: [<section id>]`.
5. `gempages_get_page_links` → editor- en previewlink. Haal de preview op en controleer: kop, alle beelden,
   reviews, knop, sticky → productpagina, RTL-isolatie.
6. Schrijf `10-gempages-upload.json` (shop, pagina, sectie, links, controles) en geef de gebruiker de links.

**Nooit publiceren** (`gempages_publish_page`) zonder expliciete opdracht van de gebruiker; de pagina blijft DRAFT.
