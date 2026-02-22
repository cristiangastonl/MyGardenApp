# Mi Jardín - Roadmap

## Estado actual: v0.1.0 (MVP)

App React Native (Expo) para cuidado de plantas.

---

## Fases Completadas ✅

### FASE 1 — Fundación y estructura
- [x] Proyecto Expo con TypeScript
- [x] Estructura de carpetas (components, screens, hooks, utils, data, types)
- [x] Persistencia con AsyncStorage
- [x] Navegación con tabs (Hoy, Calendario, Plantas, Explorar)
- [x] Sistema de diseño (theme.ts con colores, fuentes, espaciado)

### FASE 2 — Onboarding
- [x] Pantalla de bienvenida al abrir por primera vez
- [x] Input de nombre (opcional)
- [x] Selección de plantas desde base de datos
- [x] Flujo de 3 pasos con animaciones

### FASE 3 — Base de datos de plantas
- [x] Base de datos local con 25 plantas
- [x] Categorías: Interior, Exterior, Aromáticas, Huerta, Frutales, Suculentas
- [x] Browser con búsqueda y filtros
- [x] Ficha detallada de cada planta
- [x] Botón "Agregar a mi jardín"

### FASE 4 — Settings y ubicación
- [x] Panel de Settings accesible desde header
- [x] Detección automática de ubicación (expo-location)
- [x] Búsqueda manual de ciudades (Open-Meteo geocoding)
- [x] Persistencia de ubicación

### FASE 5 — Integración clima
- [x] Fetch del clima con Open-Meteo API
- [x] Widget de clima en vista "Hoy"
- [x] Pronóstico de 5 días
- [x] Alertas inteligentes (helada, calor, lluvia, viento)
- [x] Cache de 30 minutos

---

## Fases Pendientes 📋

### FASE 6 — Estadísticas y rachas
**Objetivo**: Gamificación liviana para retención.

- [ ] Rastrear historial de acciones (timestamps)
- [ ] Racha de cuidado: días consecutivos sin olvidar tareas
- [ ] Stats por planta: tiempo con vos, veces regada, etc.
- [ ] Resumen semanal
- [ ] Celebración visual al completar todas las tareas del día

### FASE 7 — Push Notifications
**Objetivo**: Recordatorios que llegan sin abrir la app.

- [ ] Pedir permiso con expo-notifications
- [ ] Recordatorio matutino configurable
- [ ] Alertas de clima
- [ ] Recordatorios personalizados del calendario
- [ ] Toggles en Settings para cada tipo

### FASE 8 — Diario fotográfico
**Objetivo**: Registro visual del crecimiento.

- [ ] Sección "Diario" en cada planta
- [ ] Botón para sacar/elegir foto (expo-image-picker)
- [ ] Timeline de fotos con fecha y nota
- [ ] Vista "antes y después"

### FASE 9 — Ajuste estacional automático
**Objetivo**: La app demuestra que "sabe" de plantas.

Depende de: FASE 4 (ubicación) + FASE 3 (base de datos)

- [ ] Detectar estación según hemisferio
- [ ] Sugerencias estacionales de riego
- [ ] Tips estacionales en fichas de plantas
- [ ] Notificación al cambio de estación

### FASE 10 — Modo vacaciones
**Objetivo**: Resolver pain point real.

- [ ] Botón "Me voy de vacaciones"
- [ ] Input de fechas ida/vuelta
- [ ] Cálculo de plantas en riesgo
- [ ] Lista para quien cuida las plantas
- [ ] Compartir por WhatsApp

### FASE 11 — Diagnóstico con IA
**Objetivo**: Feature "wow" para boca a boca.

- [ ] Botón "¿Tu planta tiene algo?"
- [ ] Subir/sacar foto de la planta
- [ ] Enviar a Claude API con contexto
- [ ] Mostrar diagnóstico y solución
- [ ] Guardar en historial de la planta

### FASE 12 — Compartir jardín
**Objetivo**: Marketing orgánico.

- [ ] Botón "Compartir mi jardín"
- [ ] Generar vista/imagen con stats
- [ ] Link copiable para redes
- [ ] Exportar como imagen para stories

---

## Stack Técnico

- **Framework**: React Native (Expo SDK 52)
- **Lenguaje**: TypeScript
- **Navegación**: @react-navigation/bottom-tabs
- **Persistencia**: @react-native-async-storage/async-storage
- **Ubicación**: expo-location
- **API Clima**: Open-Meteo (gratis, sin key)
- **Fuentes**: Playfair Display + DM Sans (Google Fonts)

---

## Paleta de colores

```
Fondo principal: #f5f0e6 → #ede7d9
Cards: #fffdf8
Texto principal: #2d3a2e
Texto secundario: #8a7e6b
Acento verde: #5b9a6a
Acento sol: #f0c040
Acento agua: #3a6b8c
Alerta danger: #fde8e8 / #8c3a3a
Alerta warning: #fef9e7 / #8c7a3a
Alerta info: #e8f4fb / #3a6b8c
```

---

## Notas

- UI en español argentino (vos, regá, sacá)
- Mobile-first pero debe funcionar en tablets
- Valores de plantas son aproximaciones, el usuario puede ajustar
