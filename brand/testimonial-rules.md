# Testimonial-regels (Meta-ads)

De ads zijn **klanttestimonial-ads**: eerste persoon, vanuit een **echte klant**, gebaseerd op
**aangeleverd** review- of testimonialmateriaal (`input.testimonials`).

## Je mag
- vertalen (ook naar natuurlijk Hebreeuws);
- herstructureren en de volgorde verbeteren;
- de leesbaarheid verbeteren;
- inkorten of uitbreiden in formulering **zonder de betekenis te veranderen**;
- feitelijke uitspraken van de klant natuurlijk verbinden met **geverifieerde productfeiten**
  ("de kap heeft verstelbare koordjes" is een productfeit; "ik gebruik de kap elke avond" is alleen
  toegestaan als de klant dat zei);
- de brug naar Adina's brief maken (dat is de functie van de ad, geen klantclaim):
  "Adina schreef er een brief over", "in haar brief legt ze uit waarom…".

## Je mag NIET verzinnen
naam · leeftijd · vriendin · ontmoeting in een café · reis · aankoopverhaal · **hoe ze het product
ontdekte** · hoe lang ze het draagt · **situaties waarin ze het gebruikte** · resultaten die ze niet noemde ·
"ik bestelde" / "toen het binnenkwam" als ze dat niet zei.

Naam en leeftijd alleen als ze in `input.testimonials[]` staan.

## Traceerbaarheid
Elke eerste-persoonservaring in een ad staat in `06-meta-ads.json` → `trace` met
`source: "testimonial:<id>"`. Kun je een zin niet traceren → schrap hem.

## Te weinig materiaal
```
DO NOT WRITE FAKE FIRST-PERSON EXPERIENCES.
Flag: TESTIMONIAL DATA INSUFFICIENT
```
Dan:
- `06-meta-ads.json` → `"status": "blocked"`, `"ads": []`, en in `flags` precies wat er ontbreekt
  (bv. "t1 noemt geen gebruikssituaties; ad 2 (routine) heeft minimaal 2 concrete situaties nodig");
- vraag de gebruiker om het ontbrekende testimonialmateriaal.

Je mag ook een ad schrijven die **alleen** uitspraken gebruikt die de testimonial ondersteunt, als dat
genoeg is voor een geloofwaardige long-form ad. Maar liever geblokkeerd dan verzonnen.

## Één of twee testimonials?
- Twee testimonials: Ad 1 = de een, Ad 2 = de ander (kies de beste match: ontdekking vs. routine).
- Eén testimonial met genoeg materiaal voor twee verschillende verhalen: mag voor beide, met
  **verschillende** uitspraken als opening.
- Eén dunne testimonial: schrijf alleen de ad die hij draagt en flag de andere.
