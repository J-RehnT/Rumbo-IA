const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "2026-11-14" → "sáb 14 nov" */
export function fechaLarga(iso: string) {
  const [a, m, d] = iso.split('-').map(Number);
  const dia = DIAS[new Date(Date.UTC(a, m - 1, d)).getUTCDay()];
  return `${dia} ${d} ${MESES[m - 1]}`;
}

/** Días que faltan → "hoy", "mañana", "en 5 días", "hace 2 días". */
export function cuando(dias: number) {
  if (dias === 0) return 'hoy';
  if (dias === 1) return 'mañana';
  if (dias === -1) return 'ayer';
  return dias > 0 ? `en ${dias} días` : `hace ${-dias} días`;
}

/** Fecha de hoy (AAAA-MM-DD) en hora de Perú (UTC-5), igual que el servidor. */
export const hoyLima = () => new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);

export const sumarDias = (iso: string, dias: number) => new Date(Date.parse(iso) + dias * 86_400_000).toISOString().slice(0, 10);

/** "14/11/2026" (o "14-11-2026") → "2026-11-14"; null si no es una fecha real. */
export function parsearFecha(texto: string): string | null {
  const m = texto.trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!m) return null;
  const [d, mes, a] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const f = new Date(Date.UTC(a, mes - 1, d));
  if (f.getUTCFullYear() !== a || f.getUTCMonth() !== mes - 1 || f.getUTCDate() !== d) return null;
  return f.toISOString().slice(0, 10);
}
