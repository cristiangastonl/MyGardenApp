# 🌱 Mi Jardín — My Happy Garden

**Weather-first plant care app. Global. Offline-first.**

> "Your garden, powered by real weather."

---

## Estado Actual (Marzo 2026)

**Versión**: 2.0.0 | **Bundle**: `com.cristianlopez.mijardin` | **SDK**: Expo 54
**Idiomas**: English + Español argentino (vos)

### Features activas hoy

| Feature | Versión original | Estado | Notas |
|---------|-----------------|--------|-------|
| Weather alerts + widget (Open-Meteo) | MVP | ✅ Live | Alertas de helada/calor por planta |
| Health score | MVP | ✅ Live | 0-100 basado en riego/sol/exterior + clima + diagnósticos activos |
| Daily tips contextuales | MVP | ✅ Live | 100 tips, gateados post-trial |
| Notificaciones locales | MVP | ✅ Live | Resumen matutino + alertas |
| Catálogo de plantas | MVP | ✅ Live | 49 plantas en 6 categorías, imágenes en Supabase Storage |
| Premium gate (RevenueCat) | MVP | ✅ Live | Paywall modal, free trial 7 días |
| Identificación de plantas (PlantNet) | V1.1 | ✅ Adelantado | Edge function proxy, 1 gratis/mes, disponible en onboarding |
| Subida de fotos | V1.1 | ✅ Adelantado | Cámara + galería, sin crop step |
| Diagnóstico de plagas (AI) | V1.2 | ✅ Adelantado | Edge function + chat follow-up + historial + shopping list |
| Tema estacional + partículas animadas | — | ✅ Live | Fondo adapta a estación del año |
| i18n completo | MVP | ✅ Live | EN/ES con auto-detect + override en Settings |

### Features deshabilitadas (código existe, flag en `false`)

| Feature | Versión target | Qué falta |
|---------|---------------|-----------|
| Auth (Google/Apple OAuth) | V1.1 | Flip flag, configurar OAuth providers en Supabase |
| Cloud Sync (Supabase) | V1.1 | Flip flag, requiere Auth activo |
| Calendar tab | V1.1 | Flip flag, pantalla ya construida |
| Explore tab | V1.1 | Flip flag, pantalla ya construida |
| Catálogo completo (40+) | V1.1 | Ya tenemos 49, flag pendiente de revisar |
| Notificaciones avanzadas | V1.1 | Push notifications server-side |
| DLC Kitchen Garden | V1.2 | No construido |
| Affiliate links | V1.2 | No construido |
| Referral system | V1.2 | No construido |
| Home widgets | V1.2 | No construido |
| DLC Seasonal Prep | V2.0 | No construido |
| DLC Advanced Diagnostics | V2.0 | No construido |
| Plant Compatibility | V2.0 | No construido |
| Care Streaks | V2.0 | No construido |
| Multiple Gardens | V2.0 | No construido |

### Pantallas y navegación

- **3 tabs activos**: Hoy (TodayScreen), Plantas (PlantsScreen), Ajustes (SettingsScreen)
- **Pantallas construidas pero deshabilitadas**: CalendarScreen, ExploreScreen, LoginScreen
- **Onboarding**: OnboardingScreen (incluye identificación de plantas)
- **Navegación**: `@react-navigation/bottom-tabs` (no expo-router)
- **Modales**: AddPlant, PlantDetail, MyPlantDetail, PlantIdentifier, PlantDiagnosis, Paywall, DayDetail, ShoppingList, DataMigration

---

## Métricas del Proyecto

| Métrica | Valor |
|---------|-------|
| Inicio del proyecto | 10 Feb 2026 |
| Commits | 26 |
| Líneas de código (screens + components + services + hooks + utils) | ~22,000 |
| Dependencias | 31 prod + 2 dev |
| Líneas de traducciones (i18n) | ~4,800 (4 archivos × 2 idiomas) |
| Plantas en catálogo | 49 en 6 categorías |
| Pantallas | 7 (4 activas + 3 gateadas) |
| Componentes | ~35 |
| Edge functions | 4 (identify-plant, diagnose-plant, chat-diagnosis, waitlist) |
| Versión actual | 2.0.0 |

---

## Límites del Free Tier

Reglas de gating para usuarios no-premium (definidas en `src/config/premium.ts`):

| Feature | Free | Premium | Trigger de paywall |
|---------|------|---------|-------------------|
| Plantas | 5 máximo | Ilimitadas | Al intentar agregar la 6ta planta |
| Identificación de plantas | 1 por mes | Ilimitadas | Al intentar la 2da identificación |
| Diagnóstico de plagas | 1 por mes | Ilimitados | Al intentar el 2do diagnóstico |
| Chat de diagnóstico | 1 mensaje por diagnóstico | Ilimitado | Al enviar 2do mensaje |
| Lista de compras (diagnóstico) | No disponible | Disponible | Al intentar acceder |
| Tips diarios | Ilimitados primera semana, después 1/día | Ilimitados | Soft gate |
| Weather alerts | Todas | Todas | — |
| Forecast | Básico | Extendido | — |
| Cloud sync | No (V1.1) | Sí (V1.1) | — |

---

## Decisiones de Arquitectura (ADRs)

Decisiones clave y por qué se tomaron. No re-discutir sin buena razón.

**Local-first, sin backend en MVP**
Validar la propuesta de valor (tareas adaptadas al clima) sin complejidad de sync. AsyncStorage como única fuente de verdad. Cloud sync existe como código pero está gateado para V1.1.

**Tareas stateless, recalculadas diario**
`getTasksForDay()` en `plantLogic.ts` no persiste tareas — las recalcula fresh cada vez desde datos de plantas + clima. Evita inconsistencias y simplifica el modelo de datos. Trade-off: no hay historial de tareas completadas más allá de 7 días.

**Emojis en vez de icon library**
Cero dependencias extra de iconos, renderizado nativo, universal entre plataformas. Trade-off: menos control visual, pero consistente con el tono casual de la app.

**Modales con state local, sin nested navigators**
Todos los modales (AddPlant, PlantDetail, Diagnosis, Paywall, etc.) usan `visible` state local dentro de las screens. Evita la complejidad de nested navigation stacks. Trade-off: no hay deep linking a modales.

**Edge functions como proxy de APIs**
PlantNet y Gemini se llaman desde Supabase Edge Functions, nunca desde el cliente. Las API keys quedan server-side. El cliente solo conoce la URL de Supabase.

**Catálogo embebido en código**
Las 49 plantas están en `plantDatabase.ts` como JSON estático. No requiere fetch al iniciar. Se traduce vía `getTranslatedPlant()`. Trade-off: actualizar el catálogo requiere nuevo build.

**RevenueCat para pagos**
Abstrae App Store + Play Store en una sola API. Free hasta $2.5K MRR. Maneja trials, restores, y webhooks. Evita implementar receipt validation manual.

**i18n desde día 1**
Mercado target incluye LATAM (español) y global (inglés). Español argentino con voseo para diferenciarse. Todas las strings via `t()`, nunca hardcoded.

---

## Riesgos y Deuda Técnica

### Críticos (resolver antes de launch)

- **RevenueCat con placeholder keys** — `revenuecat.ts` tiene `appl_TODO_REPLACE_WITH_IOS_KEY` y `goog_TODO_REPLACE_WITH_ANDROID_KEY`. Las compras no funcionan en producción hasta reemplazarlas por keys reales y crear los productos en las stores.
- **Sin tests** — No hay test framework configurado. Cero unit tests, cero integration tests. Riesgo alto de regresiones.
- **Sin linter/formatter** — No hay ESLint ni Prettier. El código es consistente por convención pero no enforced.

### Importantes (resolver pronto post-launch)

- **PLANT_CATEGORIES duplicado** — Existe una versión hardcoded en español y otra con i18n via `getPlantCategories()`. La hardcoded debería eliminarse.
- **Sin error boundary global** — Un crash en un componente tira toda la app. Falta un `ErrorBoundary` wrapper.
- **Analytics sin dashboard** — Los eventos se guardan en Supabase pero no hay visualización. No sabemos qué pasa con los usuarios.
- **Perenual API key en cliente** — `EXPO_PUBLIC_PERENUAL_API_KEY` se expone en el bundle. Debería moverse a edge function como PlantNet.

### Deuda menor (backlog)

- Cache de clima en AsyncStorage podría crecer indefinidamente (no hay cleanup)
- `syncService.ts` tiene converters camelCase↔snake_case que no se testean
- Diagnosis history se guarda en AsyncStorage sin límite de tamaño
- El onboarding no tiene skip analytics (no sabemos cuántos lo completan)

---

## Historial de Desarrollo

### Fase 1 — Fundación

- Estructura base React Native + Expo + TypeScript strict
- Tema visual: PlayfairDisplay + DMSans, paleta botánica (#f5f0e6, #5b9a6a, #3a6b8c)
- Sistema de datos local-first con AsyncStorage (`plant-agenda-v2`)
- Motor de tareas stateless: `getTasksForDay()` recalcula diario desde datos de plantas
- Integración Open-Meteo (clima + geocoding, gratis, sin API key)
- Catálogo inicial de 20 plantas embebido en JSON

### Fase 2 — Expansión del catálogo y monetización

- Catálogo expandido a 49 plantas en 6 categorías (interior, exterior, aromáticas, huerta, frutales, suculentas)
- Migración de imágenes de Pexels a Supabase Storage
- Información nutricional por planta
- RevenueCat integrado: annual ($29.99/yr) + lifetime ($69.99)
- Paywall modal con conversión triggers
- Premium gate: 5 plantas free, tips limitados post-trial, identification/diagnosis gateados
- Free tier mejorado: 100 tips, 1 ID gratis/mes, 1 diagnóstico gratis/mes

### Fase 3 — AI Features (adelantados del roadmap)

- **Identificación de plantas**: Edge function `identify-plant` → proxy PlantNet API
  - Disponible desde onboarding
  - Resultados deduplicados
  - 1 gratis/mes (free), ilimitado (premium)
- **Diagnóstico de plagas**: Edge function `diagnose-plant` + `chat-diagnosis`
  - Análisis por foto con AI
  - Chat de seguimiento para preguntas
  - Historial de diagnósticos persistente
  - Lista de compras de productos recomendados
  - Diagnósticos activos integrados en health score
- Plant knowledge service: cache en Supabase `plant_knowledge` → fallback Perenual API

### Fase 4 — i18n, UX y preparación para stores

- i18n completo con react-i18next (EN/ES-AR)
- Español argentino con vos (regá, sacá, podés)
- Traducción de catálogo de plantas via `getTranslatedPlant()`
- Edge functions aceptan param `lang`
- Separación Home (acciones diarias) vs Plants (colección)
- Tema estacional con partículas animadas de fondo
- Crop step deshabilitado en fotos
- Rename a "My Happy Garden"
- Store listing preparado (EN/ES)
- Privacy manifest en app.json
- iOS config: bundleIdentifier, camera/photo/location permissions, non-exempt encryption

### Fase 5 — Build Android

- EAS Build configurado (profile production → .aab)
- Keystore remoto en EAS servers
- Google Play App Signing configurado
- `eas.json` validado
- ExtraTranslation lint deshabilitado para builds de producción
- Submit config: service account `pc-api-key.json`, track `internal`

### Fase 6 — iOS prep y Landing

- Apple Developer Account configurada
- App Store Connect app creada (ID: 6760934404)
- `eas.json` con credenciales iOS completas (appleId, ascAppId, appleTeamId)
- Bundle ID iOS: `com.mygardencare.app`
- PrivacyInfo.xcprivacy creado
- Landing page estática (`landing/`) con Cloudflare Workers deploy
- Waitlist edge function + migration SQL
- RevenueCat keys actualizadas a per-platform (iOS/Android placeholders)

---

## Definición MVP (original)

### Hipótesis

People want a plant care app that adapts daily tasks to real weather conditions.

### Criterios de éxito

- 500 DAU within 60 days of launch
- 40%+ D7 retention
- 12%+ trial-to-paid conversion

---

## Business Model

### Revenue Structure

| Stream | % of Revenue | When |
|--------|-------------|------|
| Premium subscription ($29.99/yr) | 70-80% | MVP |
| DLC packs à la carte ($1.99-3.99) | 10-15% | V1.2+ |
| Lifetime ($69.99) + Affiliate | 10-15% | MVP / V1.2 |

### Pricing

| Tier | Price | Details |
|------|-------|---------|
| Free | $0 | 5 plants, basic weather, 1 tip/day post-trial, 1 plant ID/mo, 1 diagnosis/mo, 1 chat msg/diagnosis |
| Premium | $29.99/yr | Unlimited everything + DLC included. 7-day free trial. |
| Lifetime | $69.99 once | First 1,000 users only. Everything in Premium, forever. |

### Key Numbers

| Metric | Target |
|--------|--------|
| MVP monthly cost | ~$14 |
| Break-even | 7 annual subscribers |
| Net per subscriber | $25.49/yr (after 15% store cut) |
| Trial → Paid target | 12-18% |
| Month 6 target | 70 subs (~$150/mo net) |
| Month 12 target | 240 subs (~$450/mo net) |

### Conversion Triggers

- **6th plant added** → soft paywall ("Unlock unlimited plants")
- **Frost alert fires** → FOMO ("Premium users get per-plant alerts")
- **Trial day 5** → engagement ("You've kept 8 plants healthy")
- **2nd photo ID attempt** → hard paywall
- **2nd diagnosis attempt** → hard paywall
- **Calendar note attempt** → feature gate (V1.1)
- **7 days daily use** → engagement gate

---

## Tech Stack

| Layer | Tech | Notas |
|-------|------|-------|
| Framework | React Native + Expo SDK 54 | Managed workflow, TypeScript strict |
| Navegación | @react-navigation/bottom-tabs | 3 tabs MVP, modales con state local |
| Storage local | AsyncStorage | Key: `plant-agenda-v2` |
| Backend | Supabase | Edge functions, Storage, DB (plant_knowledge). RLS habilitado. |
| Clima | Open-Meteo API | Free, sin API key |
| Pagos | RevenueCat | Free < $2.5K MRR |
| Identificación | PlantNet API (via edge function) | API key server-side |
| Diagnóstico | AI via edge functions | diagnose-plant + chat-diagnosis |
| i18n | react-i18next | EN + ES-AR, auto-detect |
| Build | EAS Build + Submit | Android .aab, Google Play signing |

### Supabase Edge Functions

- `identify-plant` — proxy PlantNet API, acepta `lang`
- `diagnose-plant` — análisis AI de fotos de plantas, acepta `lang`
- `chat-diagnosis` — chat follow-up sobre diagnósticos, acepta `lang`

### Servicios (`src/services/`)

- `authService.ts` — (V1.1) Google/Apple OAuth
- `syncService.ts` — (V1.1) Supabase CRUD con converters camelCase ↔ snake_case
- `plantKnowledgeService.ts` — Supabase cache → Perenual API → cache
- `imageService.ts` — (V1.1) Upload/delete fotos a Supabase Storage
- `photoService.ts` — Cámara + galería local
- `payments.ts` — RevenueCat integration
- `analyticsService.ts` — Eventos básicos

---

## Servicios y Cuentas

Todos los servicios externos que usa la app, centralizados.

### APIs y Backend

| Servicio | Para qué | Costo | Auth | Estado |
|----------|----------|-------|------|--------|
| **Supabase** | DB, auth, storage, edge functions | Free tier | Env vars: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ Configurado |
| **Open-Meteo** | Clima (forecast 7 días) + geocoding | Free, sin límite | Sin API key | ✅ Live |
| **PlantNet** | Identificación de plantas por foto | Free tier disponible | Secret en Supabase: `PLANTNET_API_KEY` | ✅ Live (via edge function) |
| **Google Gemini** (2.5 Flash) | Diagnóstico de plagas + chat follow-up | Pay-per-token | Secret en Supabase: `GEMINI_API_KEY` | ✅ Live (via edge functions) |
| **Perenual** | Info de plantas (fallback, cacheado) | Free tier | Env var: `EXPO_PUBLIC_PERENUAL_API_KEY` | ✅ Live (opcional) |

### Monetización

| Servicio | Para qué | Costo | Auth | Estado |
|----------|----------|-------|------|--------|
| **RevenueCat** | Suscripciones + compras in-app | Free < $2.5K MRR | API key en `src/config/revenuecat.ts` | ⚠️ Placeholder keys (`appl_TODO_REPLACE_WITH_IOS_KEY` / `goog_TODO_REPLACE_WITH_ANDROID_KEY`), falta prod |

**Productos configurados:**
- `yearly` — $29.99/yr con 7 días trial
- `lifetime` — $69.99 one-time
- Entitlement: `premium`

### Stores y Distribución

| Servicio | Para qué | Config | Estado |
|----------|----------|--------|--------|
| **EAS / Expo** | Build y deploy | Project ID: `b0bc8bf8-e038-41e4-8b6e-6bf6dd868b4d`, owner: `cristianlopez` | ✅ Configurado |
| **Google Play Console** | Android store | Service account: `pc-api-key.json`, track: `internal` | ⚠️ No submitted aún |
| **Apple App Store** | iOS store | Bundle: `com.mygardencare.app`, Team: `N3K92QGR4U`, ASC App ID: `6760934404` | ✅ Credenciales configuradas en eas.json, falta build + submit |

**Android signing:**
- Google Play App Signing activo (Google maneja signing key)
- Upload key via EAS keystore (SHA1: `86:F5:51:D5:84:4C:88:F3:52:44:DC:03:F0:A7:FC:17:DC:1A:39:D8`)
- Keystore alias: `b357e57c403e45a4772fcdb168129f18`

### Auth (V1.1, deshabilitado)

| Servicio | Para qué | Estado |
|----------|----------|--------|
| **Google OAuth** | Sign in with Google (via Supabase auth) | ❌ V1.1, flag `AUTH: false` |
| **Apple OAuth** | Sign in with Apple (via Supabase auth) | ❌ V1.1, flag `AUTH: false` |

Flow: `expo-auth-session` + `expo-web-browser` → Supabase auth → tokens en secure storage
Callback scheme: `mijardin://auth/callback`

### Otros servicios integrados

| Servicio | Para qué | Notas |
|----------|----------|-------|
| **Expo Notifications** | Push notifications locales | Configurado para iOS (aps-environment: production) y Android. MVP = local only. |
| **Analytics (in-house)** | Tracking de eventos | Cola local en AsyncStorage → flush cada 30s a Supabase `analytics_events` |
| **Google Fonts** | Tipografía | DM Sans (body) + Playfair Display (títulos). Bundled, sin API key. |
| **Expo Secure Store** | Almacenamiento seguro de tokens | Usado por Supabase client para session tokens |

### Variables de entorno

**Archivo `.env`** (local, no committed):
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_PERENUAL_API_KEY` (opcional)

**Secrets en Supabase Dashboard:**
- `PLANTNET_API_KEY`
- `GEMINI_API_KEY`

**Archivos locales (no en git):**
- `.env` / `.envrc` — variables de entorno
- `pc-api-key.json` — service account Google Play

---

## Pendientes / Launch Checklist

### Para lanzar (críticos)

- [ ] RevenueCat: configurar productos reales en dashboard (annual + lifetime)
- [ ] RevenueCat: reemplazar placeholder keys por producción en `revenuecat.ts`
- [ ] RevenueCat: crear in-app purchases en App Store Connect y Google Play Console
- [ ] App Store: screenshots y assets finales (6.7" + 5.5" mínimo)
- [ ] Play Store: screenshots y assets finales
- [ ] iOS build con EAS (`eas build --platform ios --profile production`)
- [ ] TestFlight beta (10+ testers, 1 semana)
- [ ] Google Play: cerrar test interno con testers
- [ ] Privacy policy page (URL pública) — requerida por Apple y Google
- [ ] Terms of service page (URL pública)
- [x] Landing page creada (`landing/index.html` + Cloudflare Workers)
- [x] Waitlist edge function + migration creados
- [x] Apple Developer Account configurada (eas.json con appleId, ascAppId, appleTeamId)
- [x] App Store Connect app creada (ID: 6760934404)
- [ ] Analytics: verificar 7 eventos básicos funcionando

### Para V1.1 (post-launch)

- [ ] Configurar OAuth providers en Supabase (Google + Apple)
- [ ] Flip `AUTH` flag → activar LoginScreen + AuthProvider
- [ ] Flip `CLOUD_SYNC` flag → activar sync automático
- [ ] Flip `CALENDAR_TAB` + `EXPLORE_TAB` → agregar tabs
- [ ] Push notifications server-side (NOTIFICATIONS_ADVANCED)
- [ ] Expandir catálogo si hace falta (ya tenemos 49)

### Nice-to-have pre-launch

- [ ] ASO keywords research final
- [ ] Configurar analytics más detallado (dashboard o export)
- [ ] Onboarding A/B test (con/sin identificación)
- [ ] Deep links configurados

### Deuda técnica (post-launch)

- [ ] Agregar test framework (Jest + React Native Testing Library)
- [ ] Agregar ESLint + Prettier
- [ ] Error boundary global
- [ ] Eliminar `PLANT_CATEGORIES` hardcoded (usar solo `getPlantCategories()`)
- [ ] Mover Perenual API key a edge function
- [ ] Cleanup de cache de clima viejo en AsyncStorage
- [ ] Límite de tamaño para diagnosis history
- [ ] Analytics en onboarding (funnel tracking)
