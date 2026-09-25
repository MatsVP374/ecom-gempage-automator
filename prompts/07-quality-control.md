# Stap 7: Quality control → `09-qa-report.md` (deel 1)

1. `node scripts/validate.js <slug>` en neem de output op.
2. Controleer als kritische Israëlische klant, als feitencontroleur en als GemPages-bouwer:

PRODUCT
☐ Naam correct? ☐ Prijs correct? ☐ Saleprijs correct? ☐ Kleuren correct? ☐ Maten correct?
☐ Features onderbouwd (elk voordeel → feature-id)? ☐ Geen verzonnen materialen of prestaties?

GEMPAGE
☐ Eén centraal probleem? ☐ Founder-verhaal consistent met angle? ☐ Begint niet met het product/korting?
☐ Voordelen onderbouwd? ☐ Vergelijking logisch? ☐ Aanbod correct? ☐ Hebreeuws natuurlijk? ☐ RTL ok?
☐ CTA correct (kleur-variant)?

IMAGES
☐ Product visueel consistent met referenties? ☐ Juiste kleuren? ☐ Juist ontwerp?
☐ Elk beeld heeft een doel/blok? ☐ Niet te veel dezelfde modellen/settings?

3. Fix wat je kunt direct in de bestanden en draai de validator opnieuw.
4. Schrijf `09-qa-report.md` met `# QA — <product>` en een sectie `## Stap 7: GemPage QC` met de
   checklist (☑/☐), de validator-output en de flags. Stap 10 vult het rapport aan.
