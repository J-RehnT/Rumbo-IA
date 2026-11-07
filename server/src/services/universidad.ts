import type { Curso, TipoActividad } from '../db/tipos.js';
import { hoyLima, sumarDias } from '../lib/fechas.js';

/**
 * SIMULACIÓN del calendario académico que enviaría la universidad.
 * No hay integración real: genera fechas verosímiles a partir de hoy para cada curso
 * (prácticas, parcial, trabajo en equipo y examen final). Es determinista por curso,
 * así que sincronizar dos veces no duplica nada.
 */
const PLAN: { tipo: TipoActividad; titulo: string; dias: number }[] = [
  { tipo: 'practica', titulo: 'Práctica calificada 1', dias: 5 },
  { tipo: 'parcial', titulo: 'Examen parcial', dias: 14 },
  { tipo: 'entrega_grupal', titulo: 'Entrega de trabajo en equipo', dias: 19 },
  { tipo: 'practica', titulo: 'Práctica calificada 2', dias: 26 },
  { tipo: 'examen', titulo: 'Examen final', dias: 40 },
];

export function calendarioSimulado(cursos: Curso[]) {
  const hoy = hoyLima();
  return cursos.flatMap((curso, i) =>
    PLAN.map((p) => ({
      cursoId: curso.id,
      tipo: p.tipo,
      titulo: p.titulo,
      // Cada curso se corre unos días para que no caigan todos el mismo día.
      fecha: sumarDias(hoy, p.dias + ((i * 2) % 5)),
    })),
  );
}
