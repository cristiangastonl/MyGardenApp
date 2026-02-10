# Configuración OAuth para Mi Jardín

## 1. Google Cloud Console

### Crear proyecto OAuth
1. Ir a https://console.cloud.google.com/
2. Crear nuevo proyecto o seleccionar existente
3. Ir a **APIs & Services > Credentials**
4. Click **+ CREATE CREDENTIALS > OAuth client ID**

### Configurar OAuth Client (Android)
1. Application type: **Android**
2. Name: `MiJardin Android`
3. Package name: `com.cristianlopez.mijardin`
4. SHA-1 certificate fingerprint: (obtener del keystore de EAS)

```bash
# Obtener SHA-1 del keystore de EAS
eas credentials --platform android
```

5. Click **CREATE**
6. Copiar el **Client ID** generado

### Configurar pantalla de consentimiento
1. Ir a **OAuth consent screen**
2. User Type: **External**
3. Completar:
   - App name: `Mi Jardín`
   - User support email: tu email
   - Developer contact: tu email
4. Agregar scopes:
   - `email`
   - `profile`
   - `openid`
5. Publicar app (o dejar en Testing con usuarios de prueba)

---

## 2. Supabase Dashboard

### Habilitar Google Provider
1. Ir a https://supabase.com/dashboard
2. Seleccionar proyecto MiJardin
3. Ir a **Authentication > Providers**
4. Click en **Google**
5. Toggle **Enable Sign in with Google**
6. Completar:
   - **Client ID**: pegar el Client ID de Google Cloud
   - **Client Secret**: pegar el Client Secret de Google Cloud
7. Copiar la **Callback URL** de Supabase (la necesitás en Google Cloud)
8. Click **Save**

### Agregar Callback URL en Google Cloud
1. Volver a Google Cloud Console
2. Editar el OAuth Client creado
3. En **Authorized redirect URIs** agregar:
   - La callback URL de Supabase (ej: `https://xxx.supabase.co/auth/v1/callback`)
   - `mijardin://auth/callback` (para deep linking en la app)

---

## 3. Variables de entorno

Verificar que `.env` tenga:
```
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

---

## 4. Verificación

1. Instalar APK en dispositivo Android
2. Abrir app
3. Tocar "Iniciar sesión con Google"
4. Debería abrir browser con pantalla de Google
5. Seleccionar cuenta
6. Redirigir de vuelta a la app autenticado

---

## Troubleshooting

### "redirect_uri_mismatch"
- Verificar que las URIs en Google Cloud coincidan exactamente con las de Supabase

### "Error de autenticación" genérico
- Verificar Client ID y Secret en Supabase
- Verificar que el proyecto de Google Cloud esté publicado o el email esté en testers

### App no se abre después del login
- Verificar que el scheme `mijardin` esté en app.json
- Rebuildar la app después de cambiar app.json
