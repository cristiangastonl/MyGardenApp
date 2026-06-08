# Store Launch Checklist — My Happy Garden

Path from "internal/TestFlight" to "live & monetizable". Code-side items are ✅ done
(see commit history). The remaining work is **console configuration + device QA** — things
that live outside the repo and must be done by hand in the dashboards.

Last reviewed: 2026-06-08 · Build in stores: v2.0.0 (internal/TestFlight only)

---

## 0. Reference values (must match exactly)

| Thing | Value | Source of truth |
|---|---|---|
| iOS bundle ID | `com.mygardencare.app` | `app.json` |
| Android package | `com.mygardencare.app` | `app.json` |
| Entitlement ID | `premium` | `src/config/revenuecat.ts` |
| Product ID — annual | `yearly` | `src/config/revenuecat.ts` (`PRODUCT_IDS.ANNUAL`) |
| Product ID — lifetime | `lifetime` | `src/config/revenuecat.ts` (`PRODUCT_IDS.LIFETIME`) |
| RevenueCat iOS key | `appl_NSBzjMYEBnDMKZnZznHlvFRqwFS` | `src/config/revenuecat.ts` |
| RevenueCat Android key | `goog_LdRPduDNmtqmeEvyDSTuhPLPPeq` | `src/config/revenuecat.ts` |
| Apple App Store Connect App ID | `6760934404` | `eas.json` / CLAUDE.md |
| Apple Team ID | `N3K92QGR4U` | `eas.json` / CLAUDE.md |
| Privacy Policy URL | `https://mygardencare.app/privacy` | landing/privacy |
| Terms of Use URL | `https://mygardencare.app/terms` | landing/terms |

> ⚠️ Product IDs in both stores **must be exactly** `yearly` and `lifetime`. If they differ,
> RevenueCat will return no offerings and the paywall shows fallback prices but can't sell.

---

## 1. App Store Connect (iOS)

- [ ] **Create IAP products** → App Store Connect → your app → Monetization → In-App Purchases / Subscriptions
  - [ ] Auto-renewable subscription, Product ID `yearly`, in a Subscription Group, with a **7-day free trial** introductory offer
  - [ ] Non-consumable, Product ID `lifetime`
  - [ ] Set price tiers for both; fill localized display name + description (EN + ES)
  - [ ] Each product reaches status **"Ready to Submit"** (needs at least the review screenshot + metadata)
- [ ] **App Privacy** section completed (data types: approximate location, photos→3rd-party processing, anonymous analytics — mirror `landing/privacy`)
- [ ] **Privacy Policy URL** entered: `https://mygardencare.app/privacy`
- [ ] **App Information → License Agreement**: standard EULA is fine, or point to `https://mygardencare.app/terms`
- [ ] Screenshots uploaded (6.7" + 5.5" iPhone minimum), EN + ES
- [ ] App description / keywords from `store-listing.md`
- [ ] `usesNonExemptEncryption: false` already declared in `app.json` ✅

## 2. Google Play Console (Android)

- [ ] **Create IAP products** → Monetize → Products
  - [ ] Subscription, Product ID `yearly`, base plan + **7-day free trial** offer
  - [ ] One-time product, Product ID `lifetime`
  - [ ] Activate both
- [ ] **Data safety** form completed (mirror privacy policy)
- [ ] **Privacy Policy** link set: `https://mygardencare.app/privacy`
- [ ] Store listing assets (screenshots, feature graphic, description from `store-listing.md`)
- [ ] **API access / service account** (`pc-api-key.json`) has permissions in Play Console → for `eas submit` (account-level setting)

## 3. RevenueCat dashboard

- [ ] Project has **iOS app** (bundle `com.mygardencare.app`) + **Android app** (package `com.mygardencare.app`)
- [ ] iOS: **App Store Connect App-Specific Shared Secret** pasted (receipt validation)
- [ ] Android: **Play service account JSON** uploaded + Play↔RevenueCat linked
- [ ] Entitlement **`premium`** created
- [ ] Products `yearly` + `lifetime` imported and **attached to `premium`**
- [ ] **Default offering** created with two packages (annual + lifetime) → these are what `paymentService.getOfferings()` reads
- [ ] Sandbox test → entitlement flips to active after purchase

## 4. Device QA (your v1.2 backlog — do on a real device, dev/prod build)

- [ ] iOS sandbox account: buy **annual** → premium unlocks, `PaywallModal` closes cleanly (z-order)
- [ ] iOS sandbox account: buy **lifetime** → premium unlocks
- [ ] **Restore purchases** works after reinstall
- [ ] Free-tier gates enforce limits (5 plants / 1 identify / 1 diagnosis / 3 chat msgs / 7-day tips)
- [ ] Paywall footer: **Terms** + **Privacy** links open in browser; auto-renew disclosure visible on annual
- [ ] Settings → **Legal** → both links open
- [ ] Android: repeat purchase + restore with a license-tester account

## 5. Ship to production

- [ ] Verify a finished production build exists (don't rebuild needlessly):
      `eas build:list --platform ios --status finished --limit 5`
      `eas build:list --platform android --status finished --limit 5`
- [ ] If IAP products were added **after** the last build, no rebuild needed (products are server-side),
      but a **fresh build is required if you changed `app.json`/native config** since the last one
- [ ] Submit / promote:
      `eas submit --platform ios --profile production --id <BUILD_ID>`
      `eas submit --platform android --profile production --id <BUILD_ID>`
- [ ] iOS: attach the IAP products to the app version **in the same submission** (first-time IAP review
      happens alongside the binary — easy to forget; Apple rejects subscriptions reviewed without the binary)
- [ ] Android: promote internal → closed/production track in Play Console
- [ ] Submit for review

---

## Critical-path summary

The only things blocking **taking real money** right now:
1. IAP products created + "Ready to Submit" / active in **both** consoles (§1, §2)
2. RevenueCat **`premium` entitlement + default offering** wired (§3)
3. One real **sandbox purchase verified** on device (§4)

Everything in code is done: keys, paywall, legal links, disclosure, gates.
