# Mi Jardín - Funcionalidades

## Pantallas principales (Tab Navigation)

### 1. Hoy (TodayScreen)
- Saludo personalizado con nombre del usuario
- Widget de clima actual (temperatura, condición)
- Alertas de clima (heladas, calor extremo, lluvia)
- Lista de tareas del día:
  - 💧 Regar plantas
  - ☀️ Sacar al sol
  - 🌳 Sacar al exterior
- Tips diarios de jardinería
- Estado de salud del jardín (score general)

### 2. Calendario (CalendarScreen)
- Vista mensual con indicadores de tareas por día
- Detalle del día seleccionado:
  - Tareas programadas
  - Notas del día
  - Recordatorios personalizados

### 3. Plantas (PlantsScreen)
- Lista de plantas del usuario con:
  - Icono/emoji
  - Nombre
  - Tipo (suculenta, helecho, aromática, etc.)
  - Estado de salud (badge de color)
  - Días desde último riego
- Acciones rápidas por planta:
  - Marcar como regada
  - Marcar sol dado
  - Marcar que salió al exterior

### 4. Explorar (ExploreScreen)
- Base de datos de ~25 plantas
- Búsqueda y filtros por categoría:
  - Interior, Exterior, Aromáticas, Huerta, Frutales, Suculentas
- Detalle de cada planta:
  - Nombre científico
  - Frecuencia de riego
  - Horas de sol
  - Temperatura ideal
  - Humedad
  - Problemas comunes y soluciones
- Identificación de plantas con foto (PlantNet API)

---

## Modales y overlays

### AddPlantModal
- Seleccionar tipo de planta
- Nombre personalizado
- Ajustar frecuencia de riego
- Configurar días de sol/exterior

### DayDetailModal
- Ver/agregar notas
- Ver/agregar recordatorios con hora
- Lista de tareas del día

### SettingsPanel
- Ubicación (GPS o búsqueda de ciudad)
- Notificaciones (resumen matutino, alertas clima)
- Configuración de cuenta (con Supabase):
  - Avatar y nombre
  - Estado de sincronización
  - Cerrar sesión
- API key de PlantNet

### LoginScreen
- Continuar con Google
- Continuar con Apple (iOS)
- Continuar sin cuenta

### DataMigrationModal
- "Tenés plantas guardadas localmente"
- Subir a la nube / Empezar de cero

---

## Lógica de cuidado

| Tarea | Cuándo aparece |
|-------|----------------|
| Regar | Pasaron X días desde último riego (configurable por planta) |
| Sol | Es un día configurado para sol y no se marcó hoy |
| Exterior | Es un día configurado para exterior y no se marcó hoy |

### Sistema de salud
- Score 0-100 por planta
- Niveles: Excelente, Bueno, Atención, Peligro
- Factores: días sin riego, días sin sol, clima extremo

---

## Datos que se guardan

```
- Plantas: nombre, tipo, icono, frecuencia riego, horas sol, días sol/exterior, fechas de último cuidado
- Notas: por fecha, texto libre
- Recordatorios: por fecha, texto, hora, completado
- Configuración: ubicación, notificaciones, API keys
- Usuario: nombre, avatar (desde OAuth)
```

---

## Flujo de usuario

### Primera vez (sin cuenta)
1. LoginScreen → "Continuar sin cuenta"
2. OnboardingScreen → Agregar primeras plantas
3. TodayScreen → Ver tareas del día

### Primera vez (con cuenta)
1. LoginScreen → "Continuar con Google"
2. OAuth flow → Autenticado
3. Si tiene datos locales → DataMigrationModal
4. TodayScreen → Datos sincronizados

### Uso diario
1. Abrir app → TodayScreen
2. Ver tareas pendientes
3. Marcar tareas completadas
4. (Opcional) Agregar notas/recordatorios

---

## Integraciones

| Servicio | Uso |
|----------|-----|
| Open-Meteo | Clima actual y pronóstico (gratis, sin API key) |
| Supabase | Auth (Google/Apple) + Base de datos en la nube |
| PlantNet | Identificación de plantas por foto (requiere API key) |

---

## Paleta de colores

| Color | Hex | Uso |
|-------|-----|-----|
| Background | `#f5f0e6` | Fondo principal |
| Card | `#fffdf8` | Tarjetas y modales |
| Text Primary | `#2d3a2e` | Texto principal (verde oscuro) |
| Text Secondary | `#8a7e6b` | Texto secundario (marrón suave) |
| Green | `#5b9a6a` | Acento principal, botones |
| Sun Gold | `#f0c040` | Indicadores de sol |
| Water Blue | `#3a6b8c` | Indicadores de riego |

---

## Tipografía

- **Headings**: Playfair Display (serif, elegante)
- **Body**: DM Sans (sans-serif, legible)
