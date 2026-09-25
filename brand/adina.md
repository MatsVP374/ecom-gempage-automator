# Adina — merk

> ✏️ Dit is een startversie. Pas aan waar het niet klopt; Claude leest dit bij elke launch.

## Wie we zijn
Adina is een online boutique voor Israëlische vrouwen van 45–65. Het voelt als een kleine
boetiek waar de eigenaresse (Adina) zelf elk stuk uitkiest: persoonlijk, warm, met smaak.
Geen fast fashion-schreeuwerigheid, geen influencer-taal.

## Belofte
Kleding die comfortabel zit, flatteert zonder te knellen, en past bij het Israëlische klimaat —
zodat je je elke dag verzorgd en jezelf voelt.

## Tone of voice
- Warm, zeker, volwassen. Zoals een goede vriendin met stijl die eerlijk advies geeft.
- Concreet boven vaag: "luchtig linnen dat niet plakt op 35 graden" > "premium kwaliteit".
- Complimenteus zonder neerbuigend te zijn. Nooit "voor oudere vrouwen", nooit leeftijd benoemen.
- Kort. Een zin mag één ding zeggen.

## Productnamen
- Elk product krijgt een **Hebreeuwse vrouwennaam** als modelnaam: נועה, מאיה, תמר, שירה,
  יעל, רותם, ליה, הדר, אורית, מיכל, דנה, גלי…
- Formaat: `<naam> | <producttype + 1 kernvoordeel>` → `נועה | חולצת פשתן נושמת`.
- Check `products/*/product.json` zodat een naam niet dubbel gebruikt wordt.

## Prijsstrategie
- Verkoopprijs eindigt op 9: ₪149, ₪179, ₪199, ₪249.
- Minimaal ~3× landed cost (inkoop + verzending). `validate.js` checkt dit met `EUR_TO_ILS`.
- Compare-at ≈ 2× verkoopprijs, afgerond op 9.
- Standaard aanbod: **2e stuk 20% korting** of **gratis verzending boven ₪299**.
- Verzending: 7–14 werkdagen naar Israël (pas aan als dit verandert).
- Retour: 30 dagen.

## Wat Adina niet is
Geen goedkope marktplaats, geen "SALE!!!" overal, geen nep-countdowns.
