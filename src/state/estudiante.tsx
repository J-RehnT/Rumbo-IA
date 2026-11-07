import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { TipoActividad } from '../data/actividades';
import type { Universidad } from '../data/universidades';
import { alSesionExpirada, api, fijarToken } from '../lib/api';
import { borrarToken, guardarToken, leerToken } from '../lib/sesion';

export type Dificultad = 'facil' | 'normal' | 'complicado';
export type Curso = {
  id: string;
  nombre: string;
  horasClase: number;
  dificultad: Dificultad;
  parcial?: string; // "12 nov" (para mostrar)
  avance: number; // 0–100 según las notas registradas
};
export type Animo = 0 | 1 | 2 | 3 | 4; // Agotado … Genial
export type Carga = 'ligera' | 'normal' | 'pesada';
export type CheckIn = { animo: Animo; horasSueno: number; carga: Carga };

export type RecursoApoyo = { id: string; nombre: string; descripcion: string; telefono?: string };
export type Apoyo = { mostrar: boolean; nivel: 'ninguno' | 'suave' | 'recomendado'; senales: string[]; mensaje: string; recursos: RecursoApoyo[] };
export type Recomendacion = { cursoId: string; curso: string; minutos: number; texto: string };
/** Próxima fecha importante (parcial, práctica, entrega…) para mostrar en Inicio. */
export type Evento = { id: string; cursoId: string; curso: string; tipo: TipoActividad; titulo: string; fecha: string; diasRestantes: number };

type Perfil = {
  nombre: string;
  correo: string;
  universidad: Universidad | null;
  carrera: string;
  ciclo: number;
};

type Estado = {
  /** true mientras se recupera la sesión guardada al abrir la app. */
  cargando: boolean;
  autenticado: boolean;
  perfil: Perfil;
  cursos: Curso[];
  apoyo: Apoyo | null;
  recomendacion: Recomendacion | null;
  proximas: Evento[];
  checkinPendiente: boolean;
  sugerirApoyo: boolean;
  setPerfil: (cambios: Partial<Perfil>) => void;
  registrar: (d: { nombre: string; correo: string; password: string }) => Promise<void>;
  iniciarSesion: (d: { correo: string; password: string }) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  guardarPerfilAcademico: () => Promise<void>;
  refrescar: () => Promise<void>;
  agregarCurso: (nombre: string) => Promise<void>;
  actualizarCurso: (id: string, cambios: Partial<Pick<Curso, 'horasClase' | 'dificultad'>>) => Promise<void>;
  quitarCurso: (id: string) => Promise<void>;
  registrarNota: (cursoId: string, nota: number) => Promise<void>;
  registrarCheckIn: (c: CheckIn) => Promise<Apoyo>;
};

const EstudianteContext = createContext<Estado | null>(null);

// ---- Formato de la API ----
type UsuarioApi = {
  nombre: string;
  correo: string;
  universidad: { sigla: string; nombre: string } | null;
  carrera: string | null;
  ciclo: number | null;
};
type CursoApi = {
  id: string;
  nombre: string;
  horasClase: number;
  dificultad: Dificultad;
  proximoParcial: string | null;
  avance: number | null;
};
type InicioApi = {
  recomendacion: Recomendacion | null;
  proximas: Evento[];
  checkinPendiente: boolean;
  cursos: CursoApi[];
  apoyo: Apoyo;
};

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const fechaCorta = (iso: string) => `${Number(iso.slice(8, 10))} ${MESES[Number(iso.slice(5, 7)) - 1]}`;

const aCurso = (c: CursoApi): Curso => ({
  id: c.id,
  nombre: c.nombre,
  horasClase: c.horasClase,
  dificultad: c.dificultad,
  parcial: c.proximoParcial ? fechaCorta(c.proximoParcial) : undefined,
  avance: c.avance ?? 0,
});

// La API usa 'OTRA'; la app usa 'Otra'.
const aPerfil = (u: UsuarioApi, previo: Perfil): Perfil => ({
  nombre: u.nombre,
  correo: u.correo,
  universidad: u.universidad ? { sigla: u.universidad.sigla === 'OTRA' ? 'Otra' : u.universidad.sigla, nombre: u.universidad.nombre } : null,
  carrera: u.carrera ?? previo.carrera,
  ciclo: u.ciclo ?? previo.ciclo,
});

const PERFIL_VACIO: Perfil = { nombre: '', correo: '', universidad: null, carrera: '', ciclo: 1 };

export function EstudianteProvider({ children }: { children: ReactNode }) {
  const [cargando, setCargando] = useState(true);
  const [autenticado, setAutenticado] = useState(false);
  const [perfil, setPerfilState] = useState<Perfil>(PERFIL_VACIO);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [apoyo, setApoyo] = useState<Apoyo | null>(null);
  const [recomendacion, setRecomendacion] = useState<Recomendacion | null>(null);
  const [proximas, setProximas] = useState<Evento[]>([]);
  const [checkinPendiente, setCheckinPendiente] = useState(false);

  const limpiar = useCallback(() => {
    fijarToken(null);
    setAutenticado(false);
    setPerfilState(PERFIL_VACIO);
    setCursos([]);
    setApoyo(null);
    setRecomendacion(null);
    setProximas([]);
    setCheckinPendiente(false);
  }, []);

  const refrescar = useCallback(async () => {
    const r = await api<InicioApi>('GET', '/inicio');
    setCursos(r.cursos.map(aCurso));
    setApoyo(r.apoyo);
    setRecomendacion(r.recomendacion);
    setProximas(r.proximas ?? []);
    setCheckinPendiente(r.checkinPendiente);
  }, []);

  const entrar = useCallback(
    async (token: string, usuario: UsuarioApi) => {
      fijarToken(token);
      await guardarToken(token);
      setPerfilState((p) => aPerfil(usuario, p));
      setAutenticado(true);
      await refrescar().catch(() => {});
    },
    [refrescar],
  );

  // Al abrir la app: recupera la sesión guardada.
  useEffect(() => {
    alSesionExpirada(() => {
      borrarToken();
      limpiar();
    });
    (async () => {
      try {
        const token = await leerToken();
        if (token) {
          fijarToken(token);
          const usuario = await api<UsuarioApi>('GET', '/me');
          setPerfilState((p) => aPerfil(usuario, p));
          setAutenticado(true);
          await refrescar().catch(() => {});
        }
      } catch {
        fijarToken(null); // sin conexión o sesión vencida: pide ingresar de nuevo
      } finally {
        setCargando(false);
      }
    })();
  }, [limpiar, refrescar]);

  const value = useMemo<Estado>(
    () => ({
      cargando,
      autenticado,
      perfil,
      cursos,
      apoyo,
      recomendacion,
      proximas,
      checkinPendiente,
      sugerirApoyo: apoyo?.mostrar ?? false,
      refrescar,
      setPerfil: (c) => setPerfilState((p) => ({ ...p, ...c })),

      registrar: async (d) => {
        const r = await api<{ token: string; usuario: UsuarioApi }>('POST', '/auth/registro', d);
        await entrar(r.token, r.usuario);
      },
      iniciarSesion: async (d) => {
        const r = await api<{ token: string; usuario: UsuarioApi }>('POST', '/auth/login', d);
        await entrar(r.token, r.usuario);
      },
      cerrarSesion: async () => {
        await borrarToken();
        limpiar();
      },

      guardarPerfilAcademico: async () => {
        if (!perfil.universidad) throw new Error('Elige tu universidad');
        const otra = perfil.universidad.sigla === 'Otra';
        const u = await api<UsuarioApi>('PUT', '/me/perfil-academico', {
          universidad: otra ? 'OTRA' : perfil.universidad.sigla,
          universidadNombre: otra ? perfil.universidad.nombre : undefined,
          carrera: perfil.carrera.trim(),
          ciclo: perfil.ciclo,
        });
        setPerfilState((p) => aPerfil(u, p));
      },

      agregarCurso: async (nombre) => {
        const c = await api<CursoApi>('POST', '/cursos', { nombre });
        setCursos((cs) => [...cs, aCurso(c)]);
      },
      actualizarCurso: async (id, cambios) => {
        const anterior = cursos;
        setCursos((cs) => cs.map((x) => (x.id === id ? { ...x, ...cambios } : x))); // respuesta inmediata
        try {
          const c = await api<CursoApi>('PATCH', `/cursos/${id}`, cambios);
          setCursos((cs) => cs.map((x) => (x.id === id ? aCurso(c) : x)));
        } catch (e) {
          setCursos(anterior);
          throw e;
        }
      },
      quitarCurso: async (id) => {
        const anterior = cursos;
        setCursos((cs) => cs.filter((x) => x.id !== id));
        try {
          await api('DELETE', `/cursos/${id}`);
        } catch (e) {
          setCursos(anterior);
          throw e;
        }
      },
      registrarNota: async (cursoId, nota) => {
        await api('POST', `/cursos/${cursoId}/evaluaciones`, { nota });
        await refrescar();
      },

      registrarCheckIn: async (c) => {
        const r = await api<{ apoyo: Apoyo }>('POST', '/checkins', c);
        setApoyo(r.apoyo);
        setCheckinPendiente(false);
        return r.apoyo;
      },
    }),
    [cargando, autenticado, perfil, cursos, apoyo, recomendacion, proximas, checkinPendiente, entrar, limpiar, refrescar],
  );

  return <EstudianteContext.Provider value={value}>{children}</EstudianteContext.Provider>;
}

export function useEstudiante() {
  const ctx = useContext(EstudianteContext);
  if (!ctx) throw new Error('useEstudiante debe usarse dentro de EstudianteProvider');
  return ctx;
}
