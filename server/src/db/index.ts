import { crearRepositorioMemoria } from './memoria.js';
import type { Repositorio } from './tipos.js';

/**
 * Repositorio activo.
 *
 * Por ahora todo vive en memoria. Cuando tengan el proyecto de Supabase:
 *   1. Ejecuten supabase/schema.sql en el SQL Editor de Supabase.
 *   2. Llenen SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.
 *   3. Cambien la línea de abajo por:
 *        import { crearRepositorioSupabase } from './supabase.js';
 *        export const db: Repositorio = crearRepositorioSupabase();
 */
export const db: Repositorio = crearRepositorioMemoria();
