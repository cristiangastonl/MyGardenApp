# Launch Runbook — sacar v2.0.0 a producción (objetivo: submit a review HOY)

> Cuello de botella = review de Apple (24-48h). Meta de hoy: dejar **todo enviado a review**.
> Builds ya terminados: iOS build 14 / Android versionCode 13 (commit d9efaf5). NO se necesita rebuild
> (las edge functions son server-side; los IAP son server-side). Solo rebuild si tocás app.json/nativo.

## Valores exactos (deben matchear EXACTO — copiá de acá)

| Cosa | Valor |
|---|---|
| iOS bundle | `com.mygardencare.app` |
| Android package | `app.mygardencare.app` (⚠️ NO es `com.` — distinto del iOS) |
| Entitlement RevenueCat | `premium` |
| Product ID anual | `yearly`  (suscripción auto-renovable, trial 7 días) |
| Product ID lifetime | `lifetime`  (no-consumible iOS / one-time Android) |
| RevenueCat iOS key | `appl_NSBzjMYEBnDMKZnZznHlvFRqwFS` |
| RevenueCat Android key | `goog_LdRPduDNmtqmeEvyDSTuhPLPPeq` |
| Apple App ID | `6760934404` · Team `N3K92QGR4U` · Apple ID `cristiangastonl@gmail.com` |
| Privacy URL | `https://mygardencare.app/privacy` |
| Terms URL | `https://mygardencare.app/terms` |
| Free-tier gates (para QA) | 5 plantas · 1 identify · 1 diagnóstico · 3 msgs chat/diag · tips 7 días |

⚠️ Si los Product IDs no son EXACTAMENTE `yearly` y `lifetime`, RevenueCat no devuelve offerings y el paywall no vende.

---

## PASO 1 — Rotar Perenual API key (5 min) 🔴 ship-blocker seguridad
Hacelo primero mientras entrás en calor; no depende de nada.
1. Perenual dashboard → regenerar API key.
2. Cargar la nueva en Supabase secrets:
   `source .envrc && supabase secrets set PERENUAL_API_KEY=<nueva-key>`
3. (No hace falta redeploy: `get-plant-care` lee el secret en runtime vía `Deno.env.get`.)
4. Verificar que NO está en el repo: `grep -rc EXPO_PUBLIC_PERENUAL_API_KEY src/ .env app.json` → todo 0.

## PASO 2 — Crear IAP products en App Store Connect (iOS) (~30 min) 🔴 long pole
App Store Connect → app → **Monetization**.
1. **Subscriptions** → crear Subscription Group (ej. "My Happy Garden Premium").
   - Suscripción auto-renovable, **Product ID = `yearly`**.
   - Precio (elegí tier), display name + descripción **EN y ES**.
   - Introductory Offer → **Free trial 7 días**.
2. **In-App Purchases** → Non-Consumable, **Product ID = `lifetime`**, precio + EN/ES.
3. Cada producto debe llegar a estado **"Ready to Submit"** (necesita screenshot de review + metadata).

## PASO 3 — Crear IAP products en Google Play Console (Android) (~20 min) 🔴
Play Console → **Monetize → Products**.
1. **Subscriptions** → Product ID = `yearly` → base plan + offer con **trial 7 días** → **Activar**.
2. **In-app products** → one-time, Product ID = `lifetime` → **Activar**.

## PASO 4 — Wirear RevenueCat (~20 min) 🔴
Dashboard RevenueCat:
1. Project con **iOS app** (bundle `com.mygardencare.app`) + **Android app** (package idem).
2. iOS: pegar **App-Specific Shared Secret** (de App Store Connect) para validar recibos.
3. Android: subir **Play service-account JSON** + linkear Play↔RevenueCat.
4. Crear entitlement **`premium`**.
5. Importar productos `yearly` + `lifetime` y **atarlos a `premium`**.
6. Crear **default offering** con 2 packages (annual + lifetime) → es lo que lee `paymentService.getOfferings()`.

## PASO 5 — Test de compra sandbox en device (~15 min) 🔴 valida 2+3+4
1. iOS: cuenta sandbox → comprar **annual** → premium se desbloquea + `PaywallModal` cierra limpio.
2. Comprar **lifetime** → premium se desbloquea.
3. **Restore purchases** tras reinstalar → vuelve premium.
4. Si esto funciona, los pasos 2-4 quedaron bien wireados.

## PASO 6 — Metadata + assets de tienda
- Screenshots: **6.7" + 5.5" iPhone** mínimo, EN+ES (también Android: feature graphic + screenshots).
- Descripción / keywords → ya están en `store-listing.md`.
- **Privacy Policy URL** cargada en ambas consolas: `https://mygardencare.app/privacy`.
- App Privacy (iOS) / Data Safety (Android) → reflejar `landing/privacy` (location aprox., fotos→3rd-party, analytics anónimo).

## PASO 7 — Submit a review
- iOS: `eas submit --platform ios --profile production --id e32d85fc-5497-4853-933d-d95e8422d9ae`
  - ⚠️ **Atar los IAP a la versión iOS en la MISMA submission** — Apple rechaza suscripciones revisadas sin el binario.
- Android: `eas submit --platform android --profile production --id 5768b817-22e5-4912-b248-1d1362c4f764`
  - Luego promover internal → producción en Play Console.
- Enviar para review en ambas.

---

## QA recomendado (no bloquea técnicamente, pero conviene antes de promover a 100%)
Backlog v1.2 (`memory/v1_2_test_backlog.md`): gates free-tier, links legales abren desde Settings→Legal y footer del paywall, auto-renew disclosure visible en annual, paywall z-order.

## Camino crítico mínimo para COBRAR
Pasos 2+3 (IAP en 2 consolas) → 4 (RevenueCat) → 5 (1 compra sandbox OK). Eso destraba la monetización.
Paso 1 destraba el ship público. Paso 7 arranca la review (el reloj largo).
