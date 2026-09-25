# Stap 4: GemPage image plan → `04-gempage-image-plan.json`

Lees: `03-gempage-copy.en.json`, `02-central-angle.json`, `01-product-facts.json` (vooral
`image_observations`), `brand/image-rules.md`.

1. Bekijk de bestaande productbeelden opnieuw (Read). Die worden **niet** opnieuw gegenereerd.
2. Bepaal welke beelden de advertorial nodig heeft om het verhaal te bewijzen: standaard 7, met de
   rollen uit `brand/image-rules.md` (`hero`, `benefit_detail`, `functional_detail`,
   `functional_detail_2`, `real_life_use`, `variation`, `packing`).
3. Per beeld: `block` + `benefit_n` (bij `benefits`), `purpose` (welk verhaalpunt/voordeel het
   bewijst), `source` (`generate`, of `existing` + `existing_image` als een bestaand beeld de rol al
   goed dekt), `product_color` (exact een inputkleur), `model` en `setting`.
4. Variatie: `variation` gebruikt een ander model en/of een andere echte kleur dan `hero`. Niet elke
   foto dezelfde vrouw, setting of kleur.
5. Werk de `image`-velden in `03-gempage-copy.en.json` bij zodat elk blok met een beeld naar het
   juiste `IMG-..` verwijst (hero, benefit-items, packing, eventueel social_proof).
6. `existing_images_reviewed` = alle bestaande beelden die je bekeek; `notes` = wat je bewust niet genereert en waarom.
