import type { Curso } from '../state/estudiante';

export type Mensaje = { id: string; autor: 'estudiante' | 'tutor'; texto: string };

export type ContextoTutor = {
  ciclo: number;
  carrera: string;
  curso?: Curso;
};

/**
 * Punto único para conectar la IA.
 *
 * Para la demo devuelve respuestas de ejemplo. Para usar un modelo real, llama aquí
 * a TU backend (por ejemplo una función serverless) que guarde la clave de la API.
 * Nunca pongas la clave dentro de la app: cualquiera podría extraerla del paquete.
 *
 *   const r = await fetch(process.env.EXPO_PUBLIC_TUTOR_URL!, {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ mensajes, contexto }),
 *   });
 *   return (await r.json()).texto;
 */
export async function preguntarTutor(mensajes: Mensaje[], contexto: ContextoTutor): Promise<string> {
  const url = process.env.EXPO_PUBLIC_TUTOR_URL;
  if (url) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensajes, contexto }),
    });
    if (!r.ok) throw new Error(`Tutor respondió ${r.status}`);
    const data = (await r.json()) as { texto: string };
    return data.texto;
  }

  await new Promise((res) => setTimeout(res, 700));
  const ultimo = mensajes[mensajes.length - 1]?.texto.toLowerCase() ?? '';
  if (ultimo.includes('simple'))
    return 'Piensa en u como la parte que se vuelve más fácil al derivarla. ln(x) se simplifica a 1/x, por eso va primero.';
  if (ultimo.includes('ejemplo'))
    return 'Otro: ∫ x·eˣ dx. Por LIATE, x (algebraica) va antes que eˣ (exponencial), así que u = x y dv = eˣ dx.';
  if (ultimo.includes('siguiente'))
    return 'Siguiente paso: con u = ln(x), du = (1/x) dx y v = x²/2. Aplica ∫u dv = uv − ∫v du. ¿Lo intentas?';
  return `Buena pregunta. Te lo explico pensando en que vas en ${contexto.ciclo}.º ciclo de ${contexto.carrera}: vamos paso a paso y me dices dónde te trabas.`;
}
