# CLAUDE.md

Guía para Claude Code al trabajar en este repositorio.

## Descripción

Mi Jardín es una app React Native (Expo) para cuidado de plantas. Ayuda a los usuarios a trackear riego, sol, y actividades de exterior, con integración de clima.

## Stack

- **Framework**: React Native con Expo SDK 52
- **Lenguaje**: TypeScript
- **Navegación**: @react-navigation/bottom-tabs
- **Storage**: AsyncStorage + Supabase (sync)
- **Backend**: Supabase (auth, database, edge functions)
- **APIs**:
  - Open-Meteo (clima y geocoding, gratis sin key)
  - PlantNet (identificación de plantas, via Edge Function)

## Estructura del proyecto

```
src/
├── components/     # Componentes reutilizables (PlantCard, WeatherWidget, etc.)
├── screens/        # Pantallas principales (TodayScreen, CalendarScreen, etc.)
├── hooks/          # useStorage, useWeather
├── data/           # plantDatabase.ts, constants.ts, weatherCodes.ts
├── utils/          # dates.ts, plantLogic.ts
├── types/          # Interfaces TypeScript
└── theme.ts        # Sistema de diseño (colores, fuentes, spacing)
```

## Sistema de diseño (RESPETAR)

### Colores (no agregar otros)
- Background: `#f5f0e6`, `#ede7d9`
- Cards: `#fffdf8`
- Texto primario: `#2d3a2e`
- Texto secundario: `#8a7e6b`
- Acento verde: `#5b9a6a`
- Acento sol: `#f0c040`
- Acento agua: `#3a6b8c`

### Fuentes
- Títulos: `PlayfairDisplay_700Bold`
- Body: `DMSans_400Regular`, `DMSans_500Medium`, `DMSans_600SemiBold`

### Estilos
- Border radius: 8-20px
- Sombras: sutiles (usar `shadows` de theme.ts)
- Animaciones: fadeIn suave, transiciones 0.2-0.3s

## Supabase

El proyecto usa Supabase para auth y sync. La configuración está en:
- **`.env`** - URL y anon key de Supabase (para el cliente)
- **`.envrc`** - Access token para CLI de Supabase (para deploy)

### Edge Functions

- **`identify-plant`** - Proxy a PlantNet API para identificación de plantas por foto

Para deployear funciones:
```bash
source .envrc && supabase functions deploy identify-plant
```

Para configurar secrets:
```bash
source .envrc && supabase secrets set NOMBRE=valor
```

### Secrets configurados en Supabase
- `PLANTNET_API_KEY` - API key de PlantNet (https://my.plantnet.org/)

## SEGURIDAD - NO COMMITEAR

**NUNCA versionar estos archivos** (ya están en .gitignore):
- `.env` - Contiene keys de Supabase
- `.envrc` - Contiene access token de Supabase CLI

Si se regeneran tokens:
1. PlantNet: https://my.plantnet.org/ → regenerar → `supabase secrets set PLANTNET_API_KEY=nuevo_token`
2. Supabase CLI: https://supabase.com/dashboard/account/tokens → actualizar `.envrc`

## Comandos útiles

```bash
npx expo start          # Iniciar dev server
npx tsc --noEmit        # Verificar TypeScript
npx expo install [pkg]  # Instalar dependencias compatibles

# Supabase
source .envrc && supabase functions deploy [nombre]  # Deploy edge function
source .envrc && supabase secrets list               # Ver secrets
```

## Idioma

Todo el texto de UI está en **español argentino** (vos, regá, sacá).

## Estado actual

Ver `ROADMAP.md` para fases completadas y pendientes.
