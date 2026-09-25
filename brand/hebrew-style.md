# Hebreeuwse stijl & RTL

## Stijl
- Modern, natuurlijk Israëlisch Hebreeuws zoals een Israëlische boetiek op Instagram schrijft.
  Niet formeel/bijbels, geen Google Translate-constructies.
- Spreek de klant aan in **vrouwelijk enkelvoud** (את, תרגישי, תזמיני, מושלמת לך).
- Lokaliseer, vertaal niet: gebruik Israëlische referenties (שבת, חג, ים, קיץ ישראלי, לחות,
  אירוע משפחתי, בר מצווה, חתונה).
- Geen nikud (klinkertekens).
- Korte zinnen. Uitroeptekens spaarzaam.
- Getallen en prijzen: `₪179` (symbool vóór het getal), of `179 ₪` — kies één en wees consistent
  binnen een product. Standaard: `₪179`.
- Maten blijven Latijns (S, M, L, XL). Afmetingen in cm: `ס״מ`.

## Veelgebruikte woorden
| NL/EN | HE |
|---|---|
| gratis verzending | משלוח חינם |
| retour binnen 30 dagen | החזרה עד 30 יום |
| in winkelwagen | הוסיפי לסל |
| nu bestellen | להזמנה עכשיו |
| maattabel | טבלת מידות |
| linnen | פשתן |
| katoen | כותנה |
| ademend | נושם/נושמת |
| flatterend | מחמיא/מחמיאה |
| comfortabel | נוח/נוחה |
| veelgestelde vragen | שאלות נפוצות |
| wat klanten zeggen | מה הלקוחות אומרות |
| 2e stuk 20% korting | 20% הנחה על הפריט השני |

## RTL-regels (validate.js checkt een deel hiervan)
- Hebreeuwse velden bevatten Hebreeuws — geen achtergebleven Engelse zinnen.
  Toegestaan Latijns: maten (S–XXL), merknaam "Adina", eenheden, percentages.
- Zet geen Latijnse woorden aan het begin of eind van een zin (bidi-sprongen). Beter:
  "המידות: S עד XXL" dan "S-XXL מידות".
- Geen losse haakjes/aanhalingstekens rond gemengde tekst; gebruik ״ (gershayim) voor afkortingen.
- Emoji aan het begin van een bullet i.p.v. aan het eind.
