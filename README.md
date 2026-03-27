# My Happy Garden

Weather-first plant care app. Global. Offline-first.

## Overview

React Native (Expo SDK 54) app that adapts daily plant care tasks to real weather conditions. Supports English and Spanish (Argentine).

**Bundle IDs**: `com.mygardencare.app` (iOS) / `app.mygardencare.app` (Android)

## Features

- Weather-adapted daily care tasks (watering, sun, outdoor)
- AI plant identification (PlantNet via edge function)
- AI pest/disease diagnosis with chat follow-up (Gemini via edge function)
- Health scoring (0-100) based on care + weather + active diagnoses
- 49-plant catalog across 6 categories
- Premium subscriptions via RevenueCat (annual + lifetime)
- Local push notifications (morning summary + weather alerts)
- Seasonal themes with animated particles
- Full i18n (EN + ES-AR with voseo)

## Quick Start

```bash
npm install
npx expo start
```

## Build

```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

## Tech Stack

- React Native + Expo SDK 54, TypeScript strict
- AsyncStorage (local-first, no cloud sync in current version)
- Supabase (edge functions, storage, plant knowledge cache)
- Open-Meteo (weather + geocoding, free)
- RevenueCat (in-app purchases)
- react-i18next (internationalization)

See [CLAUDE.md](./CLAUDE.md) for detailed architecture and [PRODUCT_PLAN.md](./PRODUCT_PLAN.md) for full project state.
