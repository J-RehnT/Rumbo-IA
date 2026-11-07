# API de Rumbo

Backend REST de Rumbo en **Node + Express + TypeScript**. Vive en `server/`, separado de la app Expo.

```bash
cd server
npm install
cp .env.example .env   # opcional: sin .env funciona en modo demo
npm run dev            # http://localhost:3000/api
npm run smoke          # recorre todos los endpoints y verifica las respuestas
```

- **Contraseñas:** se hashean con bcrypt (`bcryptjs`, `BCRYPT_ROUNDS`, 10 por defecto). Nunca se devuelve el hash.
- **Sesión:** `POST /auth/login` o `/auth/registro` devuelven un `token` JWT. Envíalo como `Authorization: Bearer <token>`.
- **Datos:** con `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en `.env` se guardan en **Supabase**; sin ellas, en memoria (se borran al reiniciar). En producción las claves son obligatorias.
- **Tutor:** con `DEEPSEEK_API_KEY` responde DeepSeek (`TUTOR_MODELO`, por defecto `deepseek-flash`; también `deepseek-v4-pro`). Sin clave responde ejemplos. La clave se crea en https://platform.deepseek.com.
- **Errores:** siempre `{ error: { codigo, mensaje, detalles? } }`. Los mensajes están en español y se pueden mostrar tal cual.

## Endpoints

Todo va bajo `/api`. 🔓 = público, el resto pide token.

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| 🔓 GET | `/salud` | | `{ ok, tutor: 'deepseek' \| 'demo' }` |
| 🔓 GET | `/universidades` | | `[{ sigla, nombre }]` (las 10 del registro) |
| 🔓 GET | `/recursos-apoyo` | | Línea 113 y Bienestar |
| 🔓 POST | `/auth/registro` | `{ nombre, correo, password }` (mín. 8) | `201 { token, usuario }` · `409` si el correo existe |
| 🔓 POST | `/auth/login` | `{ correo, password }` | `{ token, usuario }` · `401` |
| 🔓 POST | `/auth/google` | | `501` por ahora |
| GET | `/me` | | usuario |
| PATCH | `/me` | `{ nombre }` | usuario |
| PUT | `/me/perfil-academico` | `{ universidad: 'UNMSM' \| … \| 'OTRA', universidadNombre?, carrera, ciclo: 1–12 }` | usuario |
| GET | `/cursos` | | `[curso]` con `promedio` (0–20) y `avance` (0–100) |
| POST | `/cursos` | `{ nombre, horasClase?, dificultad?, proximoParcial? }` **o una lista** | `201` curso(s) |
| GET · PATCH · DELETE | `/cursos/:id` | campos a cambiar | curso · `204` |
| GET · POST | `/cursos/:id/evaluaciones` | `{ tipo?, nota: 0–20, fecha? }` | notas del curso |
| GET | `/inicio` | | `{ saludo, proximoParcial, recomendacion, checkinPendiente, cursos, apoyo }` |
| POST | `/checkins` | `{ animo: 0–4, horasSueno, carga, nota? }` | `201 { checkin, apoyo }` |
| GET | `/checkins?desde=AAAA-MM-DD` | | historial |
| GET | `/progreso` | | `{ cursos, animo, tarjetaApoyo }` |
| GET · POST | `/tutor/conversaciones` | `{ cursoId?, titulo? }` | conversaciones |
| GET | `/tutor/conversaciones/:id/mensajes` | | mensajes |
| POST | `/tutor/conversaciones/:id/mensajes` | `{ texto }` | `201 { enviado, respuesta }` |
| POST | `/tutor/preguntar` (20 por minuto por usuario) | `{ mensajes: [{ autor, texto }], contexto }` | `{ texto }` |

`dificultad`: `facil` · `normal` · `complicado`. `carga`: `ligera` · `normal` · `pesada`. `animo`: 0 Agotado … 4 Genial. Fechas en `AAAA-MM-DD`.

La app usa este backend con `EXPO_PUBLIC_API_URL=http://<tu-ip>:3000/api` en el `.env` de la raíz (`npm run ip` te muestra tu IP). Todo, incluido el tutor, exige sesión. `/progreso` también devuelve `semanas` (aciertos y bienestar de las últimas 6 semanas, 0–1 o `null`).

### Tarjeta de apoyo

`apoyo` / `tarjetaApoyo` = `{ mostrar, nivel: 'ninguno' | 'suave' | 'recomendado', senales, mensaje, recursos }`.
Señales: ánimo ≤ 1, menos de 6 h de sueño, carga pesada, tres check-ins seguidos con ánimo bajo y cursos con promedio desaprobatorio. Una señal da `suave`; dos o más, `recomendado`. La regla está en `src/services/apoyo.ts`.

## Conectar Supabase

Ya están el cliente, el repositorio y el esquema; solo falta activarlos:

1. En Supabase, abre **SQL Editor** y ejecuta `supabase/schema.sql`.
2. En `.env`, llena `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API).
3. En `src/db/index.ts`, cambia el repositorio en memoria por `crearRepositorioSupabase()` (el comentario del archivo tiene las dos líneas).

Los endpoints no cambian: solo hablan con la interfaz `Repositorio` de `src/db/tipos.ts`. La service role key solo debe vivir en este servidor, nunca en la app.

## Publicar en Render

1. En render.com: **New → Web Service** y conecta el repo `Rumbo-IA`.
2. **Root Directory:** `server` · **Build Command:** `npm install` · **Start Command:** `npm start` · plan **Free**.
3. En **Environment** agrega `JWT_SECRET`, `ANTHROPIC_API_KEY`, `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. `PORT` lo pone Render solo.
4. La URL queda como `https://<nombre>.onrender.com/api`. Pruébala con `/api/salud`.

El plan Free se duerme tras 15 minutos sin uso y la primera petición tarda ~1 minuto: ábrela antes de la demo. Al dormirse se borran los datos en memoria, así que en Render conviene tener Supabase conectado.

## Estructura

```
src/
  app.ts            rutas y middlewares
  config.ts         variables de entorno
  db/               tipos + Repositorio, memoria.ts (activo), supabase.ts (listo)
  lib/              password.ts (bcrypt), jwt.ts, errores
  routes/           auth, me, cursos, bienestar (inicio/check-in/progreso), tutor
  services/         apoyo.ts (regla de derivación), tutor.ts (DeepSeek), catálogo
supabase/schema.sql
scripts/smoke.ts
```
