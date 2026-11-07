import { config } from '../config.js';
import { crearRepositorioMemoria } from './memoria.js';
import { crearRepositorioSupabase } from './supabase.js';
import type { Repositorio } from './tipos.js';

/**
 * Repositorio activo: Supabase si hay SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env;
 * si no, memoria (se borra al reiniciar; solo para pruebas locales).
 * En producción exigimos Supabase para no perder datos por accidente.
 */
// RUMBO_DB=memoria fuerza la base en memoria (útil para pruebas sin tocar Supabase).
const usaSupabase = !!(config.supabaseUrl && config.supabaseServiceKey) && process.env.RUMBO_DB !== 'memoria';
if (!usaSupabase && process.env.NODE_ENV === 'production') {
  throw new Error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en producción');
}

export const baseDeDatos: 'supabase' | 'memoria' = usaSupabase ? 'supabase' : 'memoria';
export const db: Repositorio = usaSupabase ? crearRepositorioSupabase() : crearRepositorioMemoria();
