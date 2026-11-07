# Rumbo-IA

Tutor con IA generativa que explica los temas difíciles adaptado a tu ciclo académico y, si nota semanas pesadas, sugiere con cuidado hablar con Bienestar.

App móvil en **Expo + React Native** (expo-router, TypeScript), construida a partir del diseño verde de Figma.

## Cómo correrla

```bash
npm install
npx expo start
```

Escanea el QR con **Expo Go** (Android / iOS) o presiona `w` para abrirla en el navegador.

## Pantallas

| Ruta | Pantalla |
|---|---|
| `/` | Inicio (hero del arco): "Empezar mi ruta" y "Ya tengo cuenta" |
| `/registro/cuenta` | Registro 1 · Cuenta |
| `/registro/universidad` | Registro 2 · Universidad, carrera y ciclo (+ selector de 10 universidades) |
| `/registro/cursos` | Registro 3 · Cursos con horas de clase, dificultad y parcial |
| `/inicio`, `/tutor`, `/progreso` | Pestañas de la app |
| `/checkin` | Check-in de bienestar (modal) |

Todavía no hay backend: **ningún campo es obligatorio** y todos los botones avanzan, así se puede recorrer la app completa sin registrarse. "Ya tengo cuenta" e "Inicia sesión" entran directo a la app.

## Estructura

```
src/
  app/            rutas (expo-router)
  components/     Botón, Campo, Chip, Pasos, ArcoHero, Logo, TarjetaApoyo, SelectorUniversidad…
  data/           universidades
  state/          estado del estudiante (perfil, cursos, check-ins) en memoria
  lib/tutor.ts    punto único para conectar la IA
  theme.ts        tokens de Figma: colores, espaciado, radios, tipografía
```

## Backend

La API REST está en [`server/`](server/README.md) (Express + TypeScript, bcrypt + JWT, lista para Supabase).

## Conectar la IA

`src/lib/tutor.ts` responde con ejemplos mientras no exista backend. Cuando lo tengan, define `EXPO_PUBLIC_TUTOR_URL` con la URL de su endpoint (recibe `{ mensajes, contexto }` y devuelve `{ texto }`). La clave de la API debe vivir en ese backend, nunca dentro de la app.

## Derivación a Bienestar

`sugerirApoyo` en `src/state/estudiante.tsx` decide cuándo mostrar la tarjeta de apoyo en Mi progreso (ánimo bajo, menos de 6 h de sueño o carga pesada en el último check-in). Ahí se afina la regla con el desempeño real.
