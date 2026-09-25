# Meta-ad-systeem: precies 2 long-form testimonial-ads

Funnel: **META AD (klant-hoofdstuk) → FOUNDER-LETTER GEMPAGE (Adina's hoofdstuk) → PRODUCT/OFFER → PURCHASE**.

De ad begint het verhaal vanuit het perspectief van de **klant**. De GemPage zet het voort vanuit
**Adina**. Geen message mismatch: hetzelfde centrale probleem, hetzelfde product, dezelfde
kernvoordelen, hetzelfde aanbod (`02-central-angle.json` + input + config).

Per product **precies 2** long-form ads naar **dezelfde** GemPage, met verschillende openingen en een
andere verhaalstructuur. Geen twee parafrases van dezelfde ad.

## Verteller
De verteller is een **echte klant**, niet Adina. Eerste persoon. Het moet lezen alsof zij zelf een
doordachte Facebook-post schreef over iets wat ze kocht, niet alsof Adina Fashion een ad schreef en
er een vrouwennaam onder zette. Alles wat ze meemaakte komt uit de aangeleverde testimonial
(`brand/testimonial-rules.md`).

## Ad 1: DISCOVERY
```
PERSONAL OBSERVATION → PROBLEM → HOW CUSTOMER DISCOVERED PRODUCT → ADINA / LETTER →
CUSTOMER RECOGNIZES HERSELF → PRODUCT EXPERIENCE → 4–6 BENEFITS THROUGH REAL USE →
WHAT SURPRISED HER → OFFER → READ ADINA'S LETTER
```
- Opening: een sterke maar geloofwaardige persoonlijke observatie: een terugkerend probleem, iets
  wat ze niet meer koopt, een regel die ze ontwikkelde, iets wat ze bij een andere vrouw zag, iets
  wat een vriendin liet zien, iets wat veranderde in wat ze van kleding wil. **Alleen als de
  testimonial dat ondersteunt.**
- Neem de tijd voor het probleem. Geen sale in het begin.
- Hoe ze het product vond: **alleen de versie uit de testimonial**. Staat het er niet in, beschrijf
  de ontdekking dan niet als gebeurtenis. Gebruik een neutrale brug ("Het is van Adina…",
  "Adina schreef er een brief over…").
- Adina: kleine familieboetiek in Tel Aviv, 15+ jaar ervaring. De klant herkent zich in het probleem
  dat Adina beschrijft.

## Ad 2: ROUTINE / REAL LIFE
```
PERSONAL RULE / ROUTINE → NORMAL DAILY SITUATION → PRODUCT ENTERS ROUTINE → SPECIFIC USE CASES →
PRODUCT BENEFITS → WHY SHE KEEPS USING IT → ADINA / LETTER → OFFER → READ ADINA'S LETTER
```
- Een **andere** opening dan Ad 1, meestal een persoonlijke regel of routine
  (mechaniek, niet kopiëren: "Er is één vest dat ik bij de deur laat hangen", "Ik heb één simpele
  test voor schoenen").
- Laat zien hoe het product in haar echte leven past. Details via situaties uit de testimonial.

## Voordelen: altijd "SO WHAT?"
FEATURE → REAL-LIFE EFFECT → WHY SHE CARES.
- ❌ "Het vest heeft knopen en een kap."
- ✓ "'s Ochtends knoop ik hem dicht. Een paar uur later, als het warmer wordt, draag ik hem gewoon open. En als het 's avonds weer afkoelt, ben ik blij dat de kap er is." *(alleen als zij dit zo zei; anders feitelijk formuleren zonder verzonnen routine)*
- ❌ "De schoen heeft een verstelbare gesp."
- ✓ "De gesp is verstelbaar. Dat klonk als een klein detail, tot ik merkte hoe fijn het is om de schoen aan mijn voet aan te passen in plaats van andersom."

Relaxed fit → valt comfortabel, niet steeds trekken. Volledige knoopsluiting → dicht in de koele
ochtend, open later. Gevoerd voetbed → langer op de been zonder meteen te willen wisselen.
Open hiel → instappen en gaan.

## Stijl
Klinkt als: **één volwassen vrouw die met een andere vrouw praat.** Persoonlijk · observerend ·
specifiek · rustig · volwassen · geloofwaardig · verhalend · ingetogen.
Natuurlijke alinea's, **niet** elke zin als losse dramatische regel.

Vermijden: ❌ "Maak kennis met …!" · ❌ "Upgrade je garderobe" · ❌ "De perfecte combinatie van
comfort en stijl" · ❌ "Je MOET dit hebben!" / "Dames, …" · ❌ emoji-regens · ❌ "KOOP NU" ·
❌ nep-urgentie · ❌ generieke AI-taal · ❌ feature dumps · ❌ prijs als eerste hook · ❌ reeksen uitroeptekens ·
❌ korte 5-regel-ads · ❌ een nieuwe angle die niet op de GemPage staat.

## Aanbod
Pas in ongeveer de **laatste 20–30%** van de tekst. Alleen: input-prijzen/promotie/sale reason +
config (bundel 10/15/20/25%, gratis verzending met Israel Post, 30 dagen retour, 4.7/5, 2,550+ reviews,
15+ jaar). Niet alles in elke ad proppen; alleen wat het verhaal sterker maakt.

## Einde: de founder-letter-brug
De ideale gedachte aan het eind: *"Oké, nu wil ik Adina's uitleg lezen."*
In de geest van: *"Als je dit herkent, zou ik beginnen met Adina's brief."*
Niet: *"KOOP NU VOORDAT HET TE LAAT IS!!!"*

## Meta-output per ad
- **PRIMARY TEXT**: Hebreeuws, long-form.
- **HEADLINE**: kort, Hebreeuws, verbonden met verhaal/probleem (bv. `למה נעל נוחה צריכה להיראות אורתופדית?`,
  `הקרדיגן שאני משאירה ליד הדלת`). Streef naar ≤ 40 tekens.
- **DESCRIPTION**: korte commerciële regel, bv. `<promotie> · <product> עכשיו ב־₪<sale>`.

Output-formaat in `output/meta-ads.md`:
```
AD 1 — [ANGLE]

PRIMARY TEXT:
[…]

HEADLINE:
[…]

DESCRIPTION:
[…]


AD 2 — [ANGLE]
…
```

## UGC-video (als `input.ugc_needed`)
```
HOOK → CUSTOMER PROBLEM → PRODUCT DISCOVERY → 2–4 REAL BENEFITS → CORE DIFFERENTIATOR → OFFER
```
±20–35 sec. Stem: natuurlijk Hebreeuws, vrouw, passend bij de doelgroepleeftijd, geen
omroepstem, niet overdreven enthousiast.
Visueel: 0–3s hook · 3–8s product/context · 8–20s voordelen gedemonstreerd · 20–26s
onderscheidend punt · 26–30s aanbod/product.
UGC gebruikt dezelfde angle maar leest niet letterlijk de long-form ad voor. Een UGC-script is een
script voor een creator, geen testimonial. Laat de creator niet beweren dat ze iets meemaakte wat
niet aangeleverd is; formuleer als demonstratie ("kijk, zo…").
