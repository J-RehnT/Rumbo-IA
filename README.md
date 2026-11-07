# Rumbo-IA

Tutor con IA generativa para universitarios: explica los temas difíciles adaptado a tu ciclo, organiza tus evaluaciones, te escribe por su cuenta para recordarte qué estudiar y, si nota semanas pesadas, sugiere con cuidado hablar con Bienestar.

App móvil en **Expo + React Native** (SDK 58, expo-router, TypeScript) con diseño verde de Figma, y API propia en **Node + Express** con **Supabase** (Postgres) y **DeepSeek** como modelo de IA.

## Funcionalidades

- **Cuenta y sesión**: registro e inicio de sesión con correo y contraseña (bcrypt + JWT). La sesión se guarda en el celular (`expo-secure-store`) y las rutas están protegidas.
- **Registro en 3 pasos**: cuenta → universidad, carrera y ciclo → cursos. Incluye un catálogo de cursos de Ingeniería de Software (UPC) por área, con búsqueda.
- **Inicio**: saludo, recomendación del día según la evaluación más urgente, próximas fechas con botón **Prepárame**, avisos del tutor y tarjetas de curso con dificultad, próximo parcial y **promedio (x / 20)**.
- **Agenda académica**: parciales, exámenes, prácticas y entregas de trabajo en equipo. Alta manual o **"Sincronizar con mi universidad"** (simulado).
- **Tutor IA (DeepSeek)**: chat adaptado al ciclo, la carrera y el curso. Modo **Prepárame**: mini-plan y ejercicios tipo examen uno a uno, con corrección y dificultad según tu promedio (banco modelo de Cálculo II).
- **Notificaciones**: la IA arma un plan de avisos (sesiones de estudio, métodos por curso y bienestar) y la app los programa en el celular para que suenen aunque esté cerrada (`expo-notifications`, funciona en Expo Go). Bandeja de notificaciones y campana con contador.
- **Check-in**: ánimo, sueño y carga, más el **plan semanal**: cómo te proyectas (tranquila / normal / intensa) y objetivos por curso o método. El tutor y los avisos usan este plan.
- **Progreso**: aciertos y bienestar de las últimas 6 semanas, promedio por curso y tarjeta de apoyo. Pestaña **Mi semana** (datos simulados): resumen de la semana pasada con sugerencia, ánimo por semana y horas por curso frente a la semana anterior.
- **Derivación a Bienestar**: señales de ánimo bajo, poco sueño, carga pesada o cursos desaprobados activan una sugerencia de apoyo (Línea 113 y Bienestar universitario).

## Cómo correrla

```bash
# 1. Backend
cd server
npm install
cp .env.example .env      # DeepSeek, Supabase y JWT_SECRET
npm run dev               # http://localhost:3000/api

# 2. App (en otra terminal, desde la raíz)
npm install
cp .env.example .env      # EXPO_PUBLIC_API_URL con la IP de tu PC (npm run ip)
npx expo start -c
```

Escanea el QR con **Expo Go**. Celular y PC deben estar en la misma red Wi-Fi (en Windows, abre el puerto 3000 en el firewall).

**Base de datos**: ejecuta [`server/supabase/schema.sql`](server/supabase/schema.sql) en el SQL Editor de Supabase (es idempotente). Para cargar evaluaciones de ejemplo en una cuenta: `npm run sembrar -- correo@dominio.pe` dentro de `server/`.

## Estructura

```
src/
  app/            rutas (expo-router): registro, login, (tabs) inicio/agenda/tutor/progreso,
                  checkin, notificaciones
  components/     Boton, Campo, Chip, PlanSemanal, MiSemana, TarjetaApoyo…
  data/           universidades, catálogo de cursos, tipos de actividad, simulación
  lib/            api, sesión, notificaciones, tutor, Prepárame, fechas
  state/          estado del estudiante conectado a la API
server/           API REST (ver server/README.md)
  src/routes/     auth, me, cursos, actividades, notificaciones, metas, bienestar, tutor
  src/services/   DeepSeek, recordatorios, Prepárame, calendario simulado, apoyo
  supabase/       schema.sql
```

## Simulado (para la demo)

- La sincronización del calendario de la universidad.
- La pestaña **Mi semana** de Progreso y las horas de estudio de las tarjetas de curso.
- Los ejercicios de Prepárame son del estilo de exámenes universitarios peruanos, no preguntas oficiales.

## Pendiente

- Ingreso con Google y recuperación de contraseña.
- Push remotas (requieren un build de desarrollo con EAS).
- Registro real de horas de estudio y despliegue del backend.
