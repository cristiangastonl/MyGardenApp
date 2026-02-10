# Auditoría UX/UI - Mi Jardín App

## 1. PROBLEMAS CRÍTICOS (ALTA PRIORIDAD)

### 1.1 Touch Targets Muy Pequeños
**Archivos afectados:** `Header.tsx`, `PlantCard.tsx`, `DayDetailModal.tsx`

| Problema | Archivo | Línea | Actual | Recomendado |
|----------|---------|-------|--------|-------------|
| Settings button | Header.tsx | 66-69 | 40x40px | 44x44px |
| Close button | DayDetailModal.tsx | 315-322 | padding.xs (4px) | padding.sm (8px) |

**Mínimo recomendado por Apple HIG:** 44x44px para todos los touch targets

---

### 1.2 TaskButton con Altura Insuficiente
**Archivo:** `TaskButton.tsx` (líneas 49-56)

- **Actual:** paddingVertical: spacing.sm (8px) → ~32px altura total
- **Recomendado:** paddingVertical: spacing.md (12px) o spacing.lg (16px) → 44px mínimo

---

### 1.3 Jerarquía Visual Confusa en Modales
**Archivos:** `AddPlantModal.tsx`, `DayDetailModal.tsx`, `SettingsPanel.tsx`

- Botones de acción se pierden en el scroll
- `AddPlantModal.tsx` líneas 502-537: botones al final sin emphasis

**Recomendación:**
- Hacer sticky los botones de acción al bottom
- Aumentar bottom padding a 32px mínimo

---

## 2. PROBLEMAS SIGNIFICATIVOS (MEDIA PRIORIDAD)

### 2.1 Espaciado Inconsistente

| Archivo | Problema | Recomendación |
|---------|----------|---------------|
| TodayScreen.tsx | marginBottom inconsistente | Estandarizar a spacing.lg |
| SectionHeader.tsx | marginTop spacing.lg extra | Reducir o eliminar |
| ExploreScreen.tsx | space-between crea gaps grandes | Usar spacing.md (12px) |

---

### 2.2 Modales Muy Altos
**Archivos:** `SettingsPanel.tsx`, `AddPlantModal.tsx`

| Archivo | Actual | Recomendado |
|---------|--------|-------------|
| SettingsPanel.tsx | maxHeight: 85% | maxHeight: 88%, agregar minHeight: 50% |
| AddPlantModal.tsx | maxHeight: 90% | Agregar minHeight: 50% |

**Solución adicional:** Dividir SettingsPanel en tabs o secciones colapsables

---

### 2.3 Day Selection Chips Muy Chicos
**Archivo:** `AddPlantModal.tsx` (líneas 474-481)

| Elemento | Actual | Recomendado |
|----------|--------|-------------|
| dayChip | 40x40px | 48x48px |
| dayText fontSize | 12px | 14px |

---

## 3. PROBLEMAS DE USABILIDAD (BAJA PRIORIDAD)

### 3.1 Clear Button en Búsqueda
**Archivo:** `ExploreScreen.tsx` (línea 244)
- Actual: padding: spacing.xs
- Recomendado: padding: spacing.sm

### 3.2 Estados de Botones
**Archivo:** `LoginScreen.tsx` (líneas 67-80)
- Agregar opacity: 0.6 cuando disabled
- Agregar ActivityIndicator cuando isLoading

### 3.3 Tipografía Pequeña

| Archivo | Elemento | Actual | Recomendado |
|---------|----------|--------|-------------|
| MonthCalendar.tsx | day numbers | 15px | 16-17px |
| SettingsPanel.tsx | API key input | 14px | 16px |

### 3.4 Scroll Horizontal sin Hint
**Archivo:** `OnboardingScreen.tsx` (línea 269)
- showsHorizontalScrollIndicator={false} sin hint visual
- Agregar gradiente a los lados o mostrar indicator

---

## 4. PROBLEMAS DE RESPONSIVE

### 4.1 FAB Positioning
**Archivo:** `ExpandedFAB.tsx` (líneas 150-161)
- Posición fija con right/bottom spacing.xl
- En devices con notch puede quedar oculto
- **Solución:** Usar useSafeAreaInsets() para posicionamiento dinámico

### 4.2 Grid Columns Hardcoded
**Archivo:** `ExploreScreen.tsx` (línea 174)
- numColumns={2} fijo
- **Solución:** Usar useWindowDimensions, 3 columns para pantallas > 500px

---

## 5. RESUMEN DE CAMBIOS POR ARCHIVO

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| **Header.tsx** | Settings button 40→44px | ALTA |
| **TaskButton.tsx** | paddingVertical sm→md | ALTA |
| **DayDetailModal.tsx** | Close button padding xs→sm | ALTA |
| **AddPlantModal.tsx** | Day chips 40→48px, font 12→14 | MEDIA |
| **SettingsPanel.tsx** | maxHeight 85→88%, dividir en tabs | MEDIA |
| **ExpandedFAB.tsx** | Usar useSafeAreaInsets() | MEDIA |
| **ExploreScreen.tsx** | Responsive columns | MEDIA |
| **TodayScreen.tsx** | Estandarizar spacing | MEDIA |
| **MonthCalendar.tsx** | Day font 15→16px | BAJA |

---

## 6. ESTÁNDARES RECOMENDADOS

### Touch Targets
- **Mínimo:** 44x44px (Apple HIG)
- **Óptimo:** 48x48px

### Typography
| Uso | Tamaño |
|-----|--------|
| Inputs | 16px mínimo |
| Labels pequeños | 11-12px máximo |
| Body text | 14-15px |
| Headings | 18-28px |

### Espaciado Vertical
| Uso | Valor |
|-----|-------|
| Entre secciones | spacing.lg (16px) |
| Entre items | spacing.md (12px) |
| Dentro de item | spacing.sm (8px) |

### Modales
- Botones de acción: sticky al bottom
- maxHeight: máximo 88% en iOS
- Bottom padding: spacing.xxxl (32px) mínimo
