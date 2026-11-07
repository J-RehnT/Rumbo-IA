import { router } from 'expo-router';
import type { TipoActividad } from '../data/actividades';

/** Tipos de evaluación que se pueden entrenar con "Prepárame" (las entregas grupales no). */
export const sePuedePreparar = (tipo: TipoActividad) => tipo !== 'entrega_grupal';

/** Abre el tutor en modo "Prepárame" para una evaluación de la agenda. */
export function abrirPreparame(e: { titulo: string; tipo: TipoActividad; diasRestantes: number; curso: string }) {
  router.navigate({
    pathname: '/tutor',
    params: {
      preparar: e.titulo,
      tipo: e.tipo,
      dias: String(e.diasRestantes),
      curso: e.curso,
      t: String(Date.now()), // fuerza una sesión nueva aunque sea la misma evaluación
    },
  });
}
