import type { Curso } from '../state/estudiante';
import { api, apiConfigurada } from './api';

export type Mensaje = { id: string; autor: 'estudiante' | 'tutor'; texto: string };

export type ContextoTutor = {
  ciclo: number;
  carrera: string;
  curso?: Curso;
};

/**
 * Pregunta al tutor (DeepSeek) a través de tu backend: la clave de la IA vive en el servidor,
 * nunca en la app. Requiere sesión iniciada. Sin EXPO_PUBLIC_API_URL responde con ejemplos.
 */
export async function preguntarTutor(mensajes: Mensaje[], contexto: ContextoTutor): Promise<string> {
  if (apiConfigurada()) {
    const r = await api<{ texto: string }>('POST', '/tutor/preguntar', {
      mensajes: mensajes.map(({ autor, texto }) => ({ autor, texto })),
      contexto: {
        ciclo: contexto.ciclo,
        carrera: contexto.carrera,
        curso: contexto.curso && { nombre: contexto.curso.nombre, dificultad: contexto.curso.dificultad },
      },
    });
    return r.texto;
  }

  await new Promise((res) => setTimeout(res, 700));
  return `Buena pregunta. Te lo explico pensando en que vas en ${contexto.ciclo}.º ciclo de ${contexto.carrera}: vamos paso a paso y me dices dónde te trabas.`;
}
