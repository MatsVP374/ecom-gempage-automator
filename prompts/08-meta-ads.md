# Stap 8: Twee Meta-ads → `06-meta-ads.json`

Lees: `02-central-angle.json`, `03-gempage-copy.he.json` (de brief waar de ads naartoe leiden),
`01-product-facts.json` (vooral `testimonials`), `input.json` → `testimonials`, `config/adina.json`,
`brand/ad-system.md`, `brand/testimonial-rules.md`, `brand/hebrew-style.md`.

## Eerst: de testimonial-poort
- Geen testimonials, of te weinig voor een long-form ad →
  `{"status": "blocked", "flags": ["TESTIMONIAL DATA INSUFFICIENT — <precies wat ontbreekt>"], "ads": []}`.
  STOP deze stap, meld het, en ga door met stap 9.
- Genoeg voor maar één ad → `status: "partial"`, 1 ad + flag voor de andere.
- **Nooit** ontbrekende ervaringen aanvullen ("ik bestelde", hoe ze het vond, waar ze het draagt, naam, leeftijd).

## Dan: schrijf intern (niet in de output)
A. het ene centrale probleem · B. het sterkste klantinzicht · C. Adina's kernobservatie ·
D. de 4–6 sterkste voordelen · E. de echte situaties waarin ze ertoe doen (uit de testimonial) ·
F. wat het product vervangt · G. waarom nu · H. het huidige aanbod · I. wat nieuwsgierig maakt naar
de brief · J. hoe Ad 1 en Ad 2 dezelfde positionering vanuit twee echt verschillende verhalen benaderen.

## Schrijf
- `ad1` (`type: "discovery"`) en `ad2` (`type: "routine"`) volgens `brand/ad-system.md`, in natuurlijk
  Hebreeuws, eerste persoon van de klant, long-form (richtlijn 1.200–2.200 tekens).
- Zelfde centrale probleem, voordelen en aanbod als de GemPage. Adina komt natuurlijk binnen, later in de tekst.
- Het aanbod pas in de laatste 20–30%. Het einde leidt naar Adina's brief.
- `headline`: kort, verhaal/probleem (≤ 40 tekens). `description`: korte commerciële regel met de promotie/saleprijs.
- `trace`: elke claim → bron (`testimonial:t1`, `fact:f3`, `input:sale_price`, `config:trust.shipping`, `angle:central_problem`).
- `review_en`: Engelse leesversie van de primary text voor de gebruiker.

## Feitencheck vóór je opslaat
Elk feit in input/config? Prijs en korting correct? Maten/kleuren/specs correct? Verzending/retour correct?
Testimonial trouw (geen verzonnen naam/leeftijd/situaties)? Past het bij de GemPage? Hebreeuws natuurlijk?
Aanbod laat genoeg? Ad 1 en Ad 2 echt verschillend? Leidt elke ad naar de brief?

Daarna `node scripts/validate.js <slug>` en fix alle errors.
