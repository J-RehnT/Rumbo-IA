/**
 * DATOS SIMULADOS para mostrar la sección "Mi semana" de Progreso.
 * No se guardan en la base de datos: se calculan a partir del nombre de cada curso
 * (siempre dan lo mismo para el mismo curso) hasta que la app registre horas reales.
 */

const METODOS = ['Pomodoro', 'Repaso espaciado', 'Simulacro de examen', 'Técnica Feynman', 'Práctica activa', 'Mapas conceptuales'];

/** Número estable a partir de un texto (para que la simulación no cambie en cada render). */
function semilla(texto: string) {
  let h = 7;
  for (const ch of texto) h = (h * 31 + ch.charCodeAt(0)) % 100_003;
  return h;
}

export type HorasCurso = {
  id: string;
  nombre: string;
  anterior: number; // horas la semana pasada
  actual: number; // horas esta semana
  metodo: string; // método que usó la semana pasada
  sugerido: string; // método que le proponemos probar
};

export function simularHoras(cursos: { id: string; nombre: string }[]): HorasCurso[] {
  const lista = cursos.length ? cursos.slice(0, 4) : [{ id: 'demo', nombre: 'Cálculo II' }];
  return lista.map((c) => {
    const h = semilla(c.nombre);
    const anterior = 1.5 + (h % 5) + (h % 2 ? 0.5 : 0);
    const cambio = ((h >> 3) % 4) - 1; // entre −1 y +2 horas (la mayoría mejora, alguno baja)
    const actual = Math.max(0.5, anterior + cambio + (h % 3 === 0 ? 0.5 : 0));
    return {
      id: c.id,
      nombre: c.nombre,
      anterior,
      actual,
      metodo: METODOS[h % METODOS.length],
      sugerido: METODOS[(h + 3) % METODOS.length],
    };
  });
}

/** Ánimo promedio (0 Agotado … 4 Genial) de las últimas 6 semanas, la última es la más reciente. */
export const ANIMO_SEMANAS = [
  { semana: 'S1', valor: 3.2 },
  { semana: 'S2', valor: 2.9 },
  { semana: 'S3', valor: 2.4 },
  { semana: 'S4', valor: 1.9 },
  { semana: 'S5', valor: 2.5 },
  { semana: 'S6', valor: 3.1 },
];

export const ETIQUETA_ANIMO = ['Agotado', 'Bajón', 'Normal', 'Bien', 'Genial'];

/** "4.5" → "4 h 30 min" */
export function horas(h: number) {
  const total = Math.round(h * 60);
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  if (hh === 0) return `${mm} min`;
  return mm ? `${hh} h ${mm} min` : `${hh} h`;
}

/** Resumen en lenguaje natural de la semana pasada, con una sugerencia. */
export function resumenSemanaPasada(datos: HorasCurso[]) {
  const total = datos.reduce((s, d) => s + d.anterior, 0);
  const masHoras = [...datos].sort((a, b) => b.anterior - a.anterior)[0];
  const menosHoras = [...datos].sort((a, b) => a.anterior - b.anterior)[0];
  const otros = datos.filter((d) => d.id !== masHoras.id);

  const detalle = otros.length
    ? ` y ${otros.map((d) => `${d.nombre} ${horas(d.anterior)}`).join(', ')}`
    : '';
  const texto =
    `La semana pasada estudiaste ${horas(total)} en total. Repasaste ${masHoras.nombre} ${horas(masHoras.anterior)} ` +
    `con ${masHoras.metodo.toLowerCase()}${detalle}.`;
  const sugerencia =
    menosHoras.id !== masHoras.id
      ? `¿Qué te parece sumar 1 hora a ${menosHoras.nombre} o probar ${menosHoras.sugerido.toLowerCase()} esta semana?`
      : `¿Qué te parece sumar 1 hora más o probar ${masHoras.sugerido.toLowerCase()} esta semana?`;
  return { texto, sugerencia, metodo: menosHoras.sugerido, curso: menosHoras.nombre, total };
}
