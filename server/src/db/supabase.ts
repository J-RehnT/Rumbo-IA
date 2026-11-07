import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import { ErrorApi } from '../lib/errores.js';
import type { Actividad, CheckIn, Conversacion, Curso, Evaluacion, Mensaje, Repositorio, Usuario } from './tipos.js';

/**
 * Repositorio sobre Supabase (Postgres). Listo pero AÚN NO CONECTADO: ver src/db/index.ts.
 *
 * Usa la service role key porque el backend hace su propia autenticación (bcrypt + JWT),
 * así que esta clave solo debe vivir en el servidor, nunca en la app.
 */
export function crearClienteSupabase(): SupabaseClient {
  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    throw new Error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env');
  }
  return createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---- conversión camelCase <-> snake_case ----
type Fila = Record<string, unknown>;
const aSnake = (o: object): Fila =>
  Object.fromEntries(
    Object.entries(o)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`), v]),
  );
const aCamel = <T>(f: Fila): T =>
  Object.fromEntries(Object.entries(f).map(([k, v]) => [k.replace(/_([a-z])/g, (_, l) => l.toUpperCase()), v])) as T;

function revisar<T>(r: { data: T | null; error: { message: string; code?: string } | null }): T {
  if (r.error) {
    // La tabla no existe: falta ejecutar supabase/schema.sql (ver README).
    if (r.error.code === 'PGRST205' || r.error.code === '42P01') {
      throw new ErrorApi(503, 'esquema_desactualizado', 'Falta actualizar la base de datos: ejecuta supabase/schema.sql en Supabase.');
    }
    throw new Error(`Supabase: ${r.error.message}`);
  }
  return r.data as T;
}

export function crearRepositorioSupabase(sb: SupabaseClient = crearClienteSupabase()): Repositorio {
  const uno = async <T>(q: PromiseLike<{ data: Fila | null; error: { message: string } | null }>) => {
    const d = revisar(await q);
    return d ? aCamel<T>(d) : null;
  };
  const varios = async <T>(q: PromiseLike<{ data: Fila[] | null; error: { message: string } | null }>) =>
    (revisar(await q) ?? []).map((f) => aCamel<T>(f));

  return {
    usuarios: {
      crear: async (d) => (await uno<Usuario>(sb.from('usuarios').insert(aSnake(d)).select().single()))!,
      porId: (id) => uno<Usuario>(sb.from('usuarios').select().eq('id', id).maybeSingle()),
      porCorreo: (correo) => uno<Usuario>(sb.from('usuarios').select().eq('correo', correo).maybeSingle()),
      actualizar: async (id, c) =>
        (await uno<Usuario>(sb.from('usuarios').update(aSnake(c)).eq('id', id).select().single()))!,
    },
    cursos: {
      listar: (u) => varios<Curso>(sb.from('cursos').select().eq('usuario_id', u).order('creado_en')),
      porId: (u, id) => uno<Curso>(sb.from('cursos').select().eq('usuario_id', u).eq('id', id).maybeSingle()),
      crear: async (d) => (await uno<Curso>(sb.from('cursos').insert(aSnake(d)).select().single()))!,
      actualizar: (u, id, c) =>
        uno<Curso>(sb.from('cursos').update(aSnake(c)).eq('usuario_id', u).eq('id', id).select().maybeSingle()),
      eliminar: async (u, id) => {
        const filas = revisar(await sb.from('cursos').delete().eq('usuario_id', u).eq('id', id).select('id'));
        return (filas ?? []).length > 0;
      },
    },
    actividades: {
      listar: (u, cursoId) => {
        let q = sb.from('actividades').select().eq('usuario_id', u);
        if (cursoId) q = q.eq('curso_id', cursoId);
        return varios<Actividad>(q.order('fecha'));
      },
      porId: (u, id) => uno<Actividad>(sb.from('actividades').select().eq('usuario_id', u).eq('id', id).maybeSingle()),
      crear: async (d) => (await uno<Actividad>(sb.from('actividades').insert(aSnake(d)).select().single()))!,
      actualizar: (u, id, c) =>
        uno<Actividad>(sb.from('actividades').update(aSnake(c)).eq('usuario_id', u).eq('id', id).select().maybeSingle()),
      eliminar: async (u, id) => {
        const filas = revisar(await sb.from('actividades').delete().eq('usuario_id', u).eq('id', id).select('id'));
        return (filas ?? []).length > 0;
      },
    },
    evaluaciones: {
      listar: (u, cursoId) => {
        let q = sb.from('evaluaciones').select().eq('usuario_id', u);
        if (cursoId) q = q.eq('curso_id', cursoId);
        return varios<Evaluacion>(q.order('fecha'));
      },
      crear: async (d) => (await uno<Evaluacion>(sb.from('evaluaciones').insert(aSnake(d)).select().single()))!,
    },
    checkins: {
      listar: (u, desde) => {
        let q = sb.from('checkins').select().eq('usuario_id', u);
        if (desde) q = q.gte('fecha', desde);
        return varios<CheckIn>(q.order('fecha'));
      },
      crear: async (d) => (await uno<CheckIn>(sb.from('checkins').insert(aSnake(d)).select().single()))!,
    },
    conversaciones: {
      listar: (u) =>
        varios<Conversacion>(sb.from('conversaciones').select().eq('usuario_id', u).order('creada_en', { ascending: false })),
      porId: (u, id) =>
        uno<Conversacion>(sb.from('conversaciones').select().eq('usuario_id', u).eq('id', id).maybeSingle()),
      crear: async (d) =>
        (await uno<Conversacion>(sb.from('conversaciones').insert(aSnake(d)).select().single()))!,
    },
    mensajes: {
      listar: (c) => varios<Mensaje>(sb.from('mensajes').select().eq('conversacion_id', c).order('creado_en')),
      crear: async (d) => (await uno<Mensaje>(sb.from('mensajes').insert(aSnake(d)).select().single()))!,
    },
  };
}
