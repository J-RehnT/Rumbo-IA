const DIA_MS = 24 * 60 * 60 * 1000;

/** Fecha de hoy (AAAA-MM-DD) en hora de Perú (UTC-5), no en UTC. */
export const hoyLima = () => new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);

/** Suma días a una fecha AAAA-MM-DD. */
export const sumarDias = (iso: string, dias: number) => new Date(Date.parse(iso) + dias * DIA_MS).toISOString().slice(0, 10);

/** Días entre hoy y la fecha (negativo si ya pasó). */
export const diasHasta = (iso: string) => Math.round((Date.parse(iso) - Date.parse(hoyLima())) / DIA_MS);
