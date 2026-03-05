# 🚀 Guía Definitiva de Conexión: Frontend Móvil -> Backend

Esta guía detalla los pasos necesarios para conectar la aplicación móvil (Expo/React Native) con el backend de .NET, especialmente cuando se prueba en dispositivos físicos.

---

## 1. Configuración del Backend (.NET)

Asegúrate de que el backend esté configurado para escuchar en los puertos estándar del proyecto.

- **Archivo**: `Moveo.API/Properties/launchSettings.json`
- **Puertos**: 
  - `HTTPS`: `7085`
  - `HTTP`: `5079` (Usar este preferiblemente para Ngrok)

> [!IMPORTANT]
> El backend debe estar ejecutándose antes de iniciar el túnel de Ngrok.

---

## 2. Configuración de Ngrok (Acceso Remoto)

Ngrok es necesario para que tu iPhone/Android pueda ver el backend de tu ordenador a través de Internet.

### Paso A: Instalación y Verificación
1. Crea una cuenta en [ngrok.com](https://ngrok.com/).
2. **IMPORTANTE**: Verifica tu email (revisa Spam). Ngrok bloquea el tráfico si la cuenta no está verificada.

### Paso B: Configurar Authtoken
Ejecuta este comando en la terminal (asegúrate de usar la versión más reciente):
```bash
npx ngrok@latest config add-authtoken 39lHUrBb0OUeV26QFM4RixaqkMk_535XVSzUSpr2hcHc3Kbzp

### Paso C: Iniciar el Túnel
Cada vez que vayas a programar, abre una terminal y lanza el túnel sobre el puerto **HTTP** del backend:
```bash
npx ngrok@latest http 5079
```
*Copia la URL que aparece en **Forwarding** (ej: `https://abcd-123.ngrok-free.app`).*

---

## 3. Configuración del Frontend (React Native)

Debes decirle a la app qué URL de Ngrok usar.

- **Archivo**: `services/api.ts`
- **Cambio**: Pega la URL copiada en la variable `NGROK_URL`.

```typescript
// services/api.ts
const NGROK_URL: string = 'https://tu-url-de-ngrok.ngrok-free.app';
```

---

## 4. Solución de Problemas Comunes

### Error 404 (Not Found)
- **Causa**: El puerto en `api.ts` no coincide con el del backend.
- **Solución**: Revisa que el backend esté en el puerto `5079` (HTTP) o `7085` (HTTPS).

### Error 4018 (Account Verification)
- **Causa**: No has verificado tu email de Ngrok.
- **Solución**: Ve a tu correo y confirma la cuenta.

### Timeout / Error de Red
- **Causa**: El túnel de Ngrok no está "Online" o la URL en `api.ts` es vieja.
- **Solución**: Reinicia el comando de Ngrok y actualiza la URL en el código.

---

*Guía generada por Antigravity para el equipo de MOVEO.*
