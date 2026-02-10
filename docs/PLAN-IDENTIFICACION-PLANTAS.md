# Plan: Identificación de Plantas con PlantNet

## Objetivo
Implementar identificación de plantas por foto usando PlantNet API a través de Supabase Edge Function (para mantener la API key segura).

## Arquitectura

```
App (foto) → Supabase Edge Function → PlantNet API
                    ↓
              Respuesta con planta identificada
```

## Pasos a implementar

### 1. Obtener API Key de PlantNet
- Registrarse en https://my.plantnet.org/
- Obtener API key (gratis, 500 requests/día)

### 2. Crear Supabase Edge Function
- Nombre: `identify-plant`
- Recibe: imagen en base64
- Llama a PlantNet API con la key (guardada como secret)
- Retorna: resultado de identificación

### 3. Configurar Secret en Supabase
```bash
supabase secrets set PLANTNET_API_KEY=tu_api_key
```

### 4. Actualizar la app
- Modificar `src/utils/plantIdentification.ts`
- Llamar a la Edge Function en lugar de PlantNet directamente
- Remover la necesidad de API key en el cliente

## Archivos existentes a modificar
- `src/utils/plantIdentification.ts` - Cambiar llamada a usar Edge Function
- `src/hooks/usePlantIdentification.ts` - Remover config de apiKey

## Archivos nuevos a crear
- `supabase/functions/identify-plant/index.ts` - Edge Function

## Código existente relevante
- El modal ya está completo: `src/components/PlantIdentifier/PlantIdentifierModal.tsx`
- Hook de captura listo: `src/hooks/usePlantIdentification.ts`
- Lógica de identificación: `src/utils/plantIdentification.ts`

## Notas
- PlantNet API gratis: 500 requests/día
- La función convertPlantNetResult ya mapea a nuestra base de datos local
- Hay datos genéricos por familia para plantas no conocidas
