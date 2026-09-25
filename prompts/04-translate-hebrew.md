# Stap 4 — Hebreeuwse productpagina → `page.he.json`

Lees: `page.en.json`, `product.json`, `brand/hebrew-style.md`.

Dit is **lokaliseren**, niet vertalen:
- Zelfde JSON-structuur en sectie-volgorde als `page.en.json`, maar `lang: "he"`, `dir: "rtl"`.
- `title` = `product.json.full_title_he`.
- Herschrijf elke zin zoals een Israëlische boetiek-eigenaresse hem zou schrijven, vrouwelijk
  enkelvoud. Mag korter of anders dan het Engels als het in het Hebreeuws beter werkt.
- Vervang Engelse/Europese referenties door Israëlische (zomer, לחות, שבת, חגים, אירועים).
- Maattabel: kopjes in het Hebreeuws, maten Latijns, cm → ס״מ.
- Reviews blijven `placeholder: true`; namen bv. "לקוחה לדוגמה".
- Lees de `RTL-regels` in `brand/hebrew-style.md` en controleer elke string.

Draai daarna `node scripts/validate.js <slug>` en fix alle errors.
