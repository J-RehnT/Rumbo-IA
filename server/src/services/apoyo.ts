import type { CheckIn, Curso, Evaluacion } from '../db/tipos.js';

export type NivelApoyo = 'ninguno' | 'suave' | 'recomendado';

export type TarjetaApoyo = {
  mostrar: boolean;
  nivel: NivelApoyo;
  senales: string[];
  mensaje: string;
};

const NOTA_APROBATORIA = 10.5; // vigesimal

/** Promedio 0–20 de un curso, o null si aún no hay notas. */
export function promedio(evals: Evaluacion[]): number | null {
  if (!evals.length) return null;
  return Math.round((evals.reduce((s, e) => s + e.nota, 0) / evals.length) * 10) / 10;
}

/**
 * Regla de derivación a Bienestar. Junta señales de bienestar (último check-in y racha)
 * y de desempeño (cursos desaprobados). 1 señal = sugerencia suave, 2+ = recomendado.
 * Misma idea que sugerirApoyo en src/state/estudiante.tsx del front.
 */
export function evaluarApoyo(checkins: CheckIn[], cursos: Curso[], evaluaciones: Evaluacion[]): TarjetaApoyo {
  const senales: string[] = [];
  const ultimo = checkins[checkins.length - 1];
  if (ultimo) {
    if (ultimo.animo <= 1) senales.push('animo_bajo');
    if (ultimo.horasSueno < 6) senales.push('poco_sueno');
    if (ultimo.carga === 'pesada') senales.push('carga_pesada');
  }
  const ultimos3 = checkins.slice(-3);
  if (ultimos3.length === 3 && ultimos3.every((c) => c.animo <= 1)) senales.push('animo_bajo_sostenido');

  const desaprobados = cursos.filter((c) => {
    const p = promedio(evaluaciones.filter((e) => e.cursoId === c.id));
    return p !== null && p < NOTA_APROBATORIA;
  });
  if (desaprobados.length) senales.push('cursos_en_riesgo');

  const nivel: NivelApoyo = senales.length === 0 ? 'ninguno' : senales.length === 1 ? 'suave' : 'recomendado';
  const mensaje =
    nivel === 'ninguno'
      ? 'Vas a buen ritmo. Sigue cuidando tu descanso.'
      : nivel === 'suave'
        ? 'Notamos una semana un poco pesada. Si quieres, Bienestar puede darte una mano.'
        : 'Llevas varios días cargados. Hablar con alguien de Bienestar o un psicólogo puede ayudarte mucho, y es gratis en tu universidad.';
  return { mostrar: nivel !== 'ninguno', nivel, senales, mensaje };
}
