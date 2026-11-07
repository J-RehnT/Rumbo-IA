import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Universidad } from '../data/universidades';
import { enDias } from '../lib/fechas';

export type Dificultad = 'facil' | 'normal' | 'complicado';
export type Curso = {
  id: string;
  nombre: string;
  horasClase: number;
  dificultad: Dificultad;
  parcial?: string; // fecha ISO YYYY-MM-DD
  // Lo que Rumbo puede medir de verdad (en vez de un "% de conocimiento").
  minutosSemana: number; // estudio con el tutor en los últimos 7 días
  sesionesSemana: number; // sesiones con el tutor en los últimos 7 días
  ultimoTema?: string;
  ultimaVez?: string; // fecha ISO de la última sesión
};
export type Animo = 0 | 1 | 2 | 3 | 4; // Agotado … Genial
export type Carga = 'ligera' | 'normal' | 'pesada';
export type CheckIn = { animo: Animo; horasSueno: number; carga: Carga; fecha: string };

type Perfil = {
  nombre: string;
  correo: string;
  universidad: Universidad | null;
  carrera: string;
  ciclo: number;
};

type Estado = {
  perfil: Perfil;
  cursos: Curso[];
  checkins: CheckIn[];
  setPerfil: (cambios: Partial<Perfil>) => void;
  agregarCurso: (nombre: string) => void;
  actualizarCurso: (id: string, cambios: Partial<Curso>) => void;
  quitarCurso: (id: string) => void;
  registrarCheckIn: (c: Omit<CheckIn, 'fecha'>) => void;
  registrarSesion: (cursoId: string, tema: string, minutos?: number) => void;
  sugerirApoyo: boolean;
};

const EstudianteContext = createContext<Estado | null>(null);

// Datos de ejemplo para la demo (se reemplazan al completar el registro).
const CURSOS_DEMO: Curso[] = [
  {
    id: 'c1',
    nombre: 'Cálculo II',
    horasClase: 5,
    dificultad: 'complicado',
    parcial: enDias(5),
    minutosSemana: 150,
    sesionesSemana: 3,
    ultimoTema: 'Integrales por partes',
    ultimaVez: enDias(-1),
  },
  {
    id: 'c2',
    nombre: 'Física II',
    horasClase: 4,
    dificultad: 'normal',
    parcial: enDias(12),
    minutosSemana: 45,
    sesionesSemana: 1,
    ultimoTema: 'Ley de Gauss',
    ultimaVez: enDias(-4),
  },
  { id: 'c3', nombre: 'Estructuras de datos', horasClase: 4, dificultad: 'normal', minutosSemana: 0, sesionesSemana: 0 },
];

export function EstudianteProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfilState] = useState<Perfil>({
    nombre: 'Ana',
    correo: '',
    universidad: null,
    carrera: 'Ing. de Sistemas',
    ciclo: 5,
  });
  const [cursos, setCursos] = useState<Curso[]>(CURSOS_DEMO);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);

  const value = useMemo<Estado>(() => {
    const ultimo = checkins[checkins.length - 1];
    // Regla simple de derivación: ánimo bajo, poco sueño o carga pesada sostenida.
    const sugerirApoyo =
      !ultimo || ultimo.animo <= 1 || ultimo.horasSueno < 6 || ultimo.carga === 'pesada';
    return {
      perfil,
      cursos,
      checkins,
      sugerirApoyo,
      setPerfil: (c) => setPerfilState((p) => ({ ...p, ...c })),
      agregarCurso: (nombre) =>
        setCursos((cs) => [
          ...cs,
          { id: String(Date.now()), nombre, horasClase: 4, dificultad: 'normal', minutosSemana: 0, sesionesSemana: 0 },
        ]),
      actualizarCurso: (id, c) => setCursos((cs) => cs.map((x) => (x.id === id ? { ...x, ...c } : x))),
      quitarCurso: (id) => setCursos((cs) => cs.filter((x) => x.id !== id)),
      registrarSesion: (cursoId, tema, minutos = 10) =>
        setCursos((cs) =>
          cs.map((x) =>
            x.id === cursoId
              ? {
                  ...x,
                  minutosSemana: x.minutosSemana + minutos,
                  sesionesSemana: x.sesionesSemana + 1,
                  ultimoTema: tema,
                  ultimaVez: enDias(0),
                }
              : x,
          ),
        ),
      registrarCheckIn: (c) => setCheckins((cs) => [...cs, { ...c, fecha: new Date().toISOString() }]),
    };
  }, [perfil, cursos, checkins]);

  return <EstudianteContext.Provider value={value}>{children}</EstudianteContext.Provider>;
}

export function useEstudiante() {
  const ctx = useContext(EstudianteContext);
  if (!ctx) throw new Error('useEstudiante debe usarse dentro de EstudianteProvider');
  return ctx;
}
