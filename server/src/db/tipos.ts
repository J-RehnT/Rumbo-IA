/** Modelos de datos de Rumbo. En Supabase se guardan en snake_case (ver supabase/schema.sql). */

export type Dificultad = 'facil' | 'normal' | 'complicado';
export type Carga = 'ligera' | 'normal' | 'pesada';
export type Animo = 0 | 1 | 2 | 3 | 4; // Agotado … Genial
export type TipoEvaluacion = 'practica' | 'parcial' | 'final' | 'quiz' | 'otro';

export type Usuario = {
  id: string;
  nombre: string;
  correo: string;
  passwordHash: string | null; // null si entró con Google
  universidadSigla: string | null; // 'UNMSM', 'UPC'… u 'OTRA'
  universidadNombre: string | null; // texto libre cuando es 'OTRA'
  carrera: string | null;
  ciclo: number | null; // 1–12
  creadoEn: string;
};

export type Curso = {
  id: string;
  usuarioId: string;
  nombre: string;
  horasClase: number;
  dificultad: Dificultad;
  proximoParcial: string | null; // fecha ISO (YYYY-MM-DD)
  creadoEn: string;
};

export type Evaluacion = {
  id: string;
  usuarioId: string;
  cursoId: string;
  tipo: TipoEvaluacion;
  nota: number; // escala vigesimal 0–20
  fecha: string;
};

export type TipoActividad = 'parcial' | 'examen' | 'practica' | 'entrega_grupal';
export type OrigenActividad = 'universidad' | 'manual';

/** Fecha de evaluación o entrega de un curso (parcial, examen, práctica, trabajo en equipo). */
export type Actividad = {
  id: string;
  usuarioId: string;
  cursoId: string;
  tipo: TipoActividad;
  titulo: string;
  fecha: string; // YYYY-MM-DD
  origen: OrigenActividad; // 'universidad' = cargada por la sincronización (simulada)
  completada: boolean;
  creadoEn: string;
};

export type CheckIn = {
  id: string;
  usuarioId: string;
  animo: Animo;
  horasSueno: number;
  carga: Carga;
  nota: string | null;
  fecha: string;
};

export type Conversacion = {
  id: string;
  usuarioId: string;
  cursoId: string | null;
  titulo: string;
  creadaEn: string;
};

export type Mensaje = {
  id: string;
  conversacionId: string;
  autor: 'estudiante' | 'tutor';
  texto: string;
  creadoEn: string;
};

type Nuevo<T> = Omit<T, 'id' | 'creadoEn' | 'creadaEn'>;

/**
 * Contrato de acceso a datos. Los endpoints solo conocen esta interfaz, así que cambiar
 * de memoria a Supabase es cambiar una línea en src/db/index.ts.
 */
export interface Repositorio {
  usuarios: {
    crear(datos: Nuevo<Usuario>): Promise<Usuario>;
    porId(id: string): Promise<Usuario | null>;
    porCorreo(correo: string): Promise<Usuario | null>;
    actualizar(id: string, cambios: Partial<Nuevo<Usuario>>): Promise<Usuario>;
  };
  cursos: {
    listar(usuarioId: string): Promise<Curso[]>;
    porId(usuarioId: string, id: string): Promise<Curso | null>;
    crear(datos: Nuevo<Curso>): Promise<Curso>;
    actualizar(usuarioId: string, id: string, cambios: Partial<Nuevo<Curso>>): Promise<Curso | null>;
    eliminar(usuarioId: string, id: string): Promise<boolean>;
  };
  evaluaciones: {
    listar(usuarioId: string, cursoId?: string): Promise<Evaluacion[]>;
    crear(datos: Omit<Evaluacion, 'id'>): Promise<Evaluacion>;
  };
  actividades: {
    listar(usuarioId: string, cursoId?: string): Promise<Actividad[]>; // por fecha
    porId(usuarioId: string, id: string): Promise<Actividad | null>;
    crear(datos: Nuevo<Actividad>): Promise<Actividad>;
    actualizar(usuarioId: string, id: string, cambios: Partial<Nuevo<Actividad>>): Promise<Actividad | null>;
    eliminar(usuarioId: string, id: string): Promise<boolean>;
  };
  checkins: {
    listar(usuarioId: string, desde?: string): Promise<CheckIn[]>; // orden cronológico
    crear(datos: Omit<CheckIn, 'id' | 'fecha'>): Promise<CheckIn>;
  };
  conversaciones: {
    listar(usuarioId: string): Promise<Conversacion[]>;
    porId(usuarioId: string, id: string): Promise<Conversacion | null>;
    crear(datos: Nuevo<Conversacion>): Promise<Conversacion>;
  };
  mensajes: {
    listar(conversacionId: string): Promise<Mensaje[]>; // orden cronológico
    crear(datos: Omit<Mensaje, 'id' | 'creadoEn'>): Promise<Mensaje>;
  };
}
