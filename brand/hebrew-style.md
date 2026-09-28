# Hebreeuwse stijl & RTL

## Stijl
> De volledige standaard voor de Hebreeuwse tekst (natuurlijkheid, woordkeus per context, koppen, AI-patronen,
> vrouwelijke grammatica, de natuurlijkheidsronde 6c) staat in **`brand/hebrew-copy.md`**. Hieronder de basis.

- Modern, natuurlijk Israëlisch Hebreeuws. Zoals een Israëlische vrouw het zelf zou schrijven
  (reviews, overlays) of zoals Adina een persoonlijke brief schrijft (GemPage). Niet formeel/bijbels,
  geen Google Translate-constructies, geen vertaald-Amerikaanse reclametaal.
- Schrijf Hebreeuws als origineel. Nooit Engels woord-voor-woord vertalen; de Engelse master is
  alleen voor structuur en betekenis.
- Spreek de klant aan in **vrouwelijk enkelvoud** (את, תרגישי, תזמיני, מושלמת לך).
- Lokaliseer, vertaal niet: gebruik Israëlische referenties (שבת, חג, ים, קיץ ישראלי, לחות,
  אירוע משפחתי, בר מצווה, חתונה), maar alleen als ze bij het product passen.
- Geen nikud (klinkertekens).
- Natuurlijke zinnen en alinea's, geen telegramstijl. Uitroeptekens spaarzaam.
- Prijzen: `₪<bedrag>` (symbool vóór het getal), consistent binnen een product. In lopende tekst
  mag `ב־₪<bedrag>` (met maqaf).
- Maten blijven Latijns (S, M, L, XL). Afmetingen in cm: `ס״מ`.

## Veelgebruikte woorden
| NL/EN | HE |
|---|---|
| gratis verzending met Israel Post | משלוח חינם בדואר ישראל |
| 30 dagen retour | 30 יום להחזרה |
| hoofd-CTA | בדקי אם המידה והצבע שלך עדיין במלאי |
| CTA (1 kleur) | בדקי אם המידה שלך עדיין במלאי |
| brief van Adina | המכתב של עדינה |
| founder | המייסדת |
| maattabel | טבלת מידות |
| linnen | פשתן |
| katoen | כותנה |
| ademend | נושם/נושמת |
| flatterend | מחמיא/מחמיאה |
| comfortabel | נוח/נוחה |
| veelgestelde vragen | שאלות נפוצות |
| wat klanten zeggen | מה הלקוחות אומרות |
| bundelkorting | 2 פריטים — 10% הנחה נוספת (zie config) |

## RTL-regels (validate.js checkt een deel hiervan)
- Hebreeuwse velden bevatten Hebreeuws — geen achtergebleven Engelse zinnen.
  Toegestaan Latijns: maten (S–5XL), merknaam "Adina Fashion", de Latijnse productnaam uit input,
  eenheden, percentages.
- Zet geen Latijnse woorden aan het begin of eind van een zin (bidi-sprongen). Beter:
  "המידות: S עד XXL" dan "S-XXL מידות".
- Getallen met een plus (`15+`, `2,550+`) worden in RTL als `+15` getoond. In lopende tekst liever
  `יותר מ־15 שנה` / `יותר מ־2,550 ביקורות`. In GemPages-velden met alleen het getal (trust bar): zet het
  element op LTR of gebruik het `.gempages`-bestand (dat isoleert het al).
- Geen losse haakjes/aanhalingstekens rond gemengde tekst; gebruik ״ (gershayim) voor afkortingen.
- In de GemPage: ✓ voor offer-bullets, ★ voor rating, verder niets.

## RTL-QA (bij elke gegenereerde pagina)
Hebreeuws gemengd met getallen en Latijn springt in een RTL-layout makkelijk verkeerd. Daarom, structureel:
- **Eigen RTL-root**: de pagina zit in `<div class="gp-page" dir="rtl" lang="he">`; richting en uitlijning staan dáár, niet
  op het GemPages-element eromheen (GemPages geeft dat element zelf `text-align:var(--ta)`). Het Custom Code-element
  krijgt `align: right`.
- **CSS per component** (`templates/gempage/letter.css`): tekstelementen expliciet `direction: rtl` + `text-align: right`;
  wat van de richting afhangt regelt het component zelf: genummerde secties (nummer rechts), vergelijkingstabel (labels
  rechts), stats (eerste rechtsboven), prijsblok (saleprijs rechts, oude prijs links ervan), vinkjes rechts, CTA-pijl ← links.
- **Isolatie**: de GemPage zet elk links-naar-rechts stuk automatisch in een geïsoleerde span
  (`direction:ltr; unicode-bidi:isolate`): `₪179`, `179₪`, `4.7/5`, `2,550+`, `15+`, `25%`, `S–3XL`, `Adina Fashion`.
- **Controle**: de validator rendert de Hebreeuwse pagina en geeft een **error** als zo'n stuk niet geïsoleerd is
  (`RTL — not isolated …`).
- **Render-audit**: `node scripts/rtl-audit.js <slug>` (desktop 1280 + mobiel 390, in een LTR-host met GemPages'
  `--ta:left`) en na de upload `--url <preview>`; 0 issues vereist (stap 11). `test/rtl.test.js` bewaakt dit.
- **Visueel** (stap 7): bekijk de preview op mobiel (390 px): header, prijzen in sale en productbox, rating,
  maten, bundel, sticky balk. Doorgestreepte oude prijs zichtbaar? Pijl ← op dezelfde regel als de tekst?
