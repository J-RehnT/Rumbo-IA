const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];

const inicioDelDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Fecha ISO (YYYY-MM-DD) a N días de hoy. */
export function enDias(n: number, desde = new Date()): string {
  const d = inicioDelDia(desde);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function leer(iso: string) {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(a, m - 1, d);
}

/** Días enteros desde hoy hasta la fecha (negativo si ya pasó). */
export function diasHasta(iso: string, hoy = new Date()): number {
  return Math.round((leer(iso).getTime() - inicioDelDia(hoy).getTime()) / 86_400_000);
}

/** "12 nov" */
export function fechaCorta(iso: string): string {
  const d = leer(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}

/** "Parcial hoy", "Parcial mañana", "Parcial en 5 días", "Parcial el 12 nov" (si falta más de 2 semanas). */
export function textoParcial(iso: string): string {
  const n = diasHasta(iso);
  if (n < 0) return `Parcial pasado (${fechaCorta(iso)})`;
  if (n === 0) return 'Parcial hoy';
  if (n === 1) return 'Parcial mañana';
  if (n <= 14) return `Parcial en ${n} días`;
  return `Parcial el ${fechaCorta(iso)}`;
}

/** "hoy", "ayer", "hace 3 días" */
export function haceCuanto(iso: string): string {
  const n = -diasHasta(iso);
  if (n <= 0) return 'hoy';
  if (n === 1) return 'ayer';
  return `hace ${n} días`;
}

/** 150 → "2 h 30 min" */
export function duracion(min: number): string {
  if (min <= 0) return '0 min';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return [h ? `${h} h` : '', m ? `${m} min` : ''].filter(Boolean).join(' ');
}
