import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Universidad } from '../data/universidades';

export type Dificultad = 'facil' | 'normal' | 'complicado';
export type Curso = {
  id: string;
  nombre: string;
  horasClase: number;
  dificultad: Dificultad;
  parcial?: string;
  avance: number; // 0–100, aciertos en práctica
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
  sugerirApoyo: boolean;
};

const EstudianteContext = createContext<Estado | null>(null);

// Datos de ejemplo para la demo (se reemplazan al completar el registro).
const CURSOS_DEMO: Curso[] = [
  { id: 'c1', nombre: 'Cálculo II', horasClase: 5, dificultad: 'complicado', parcial: '12 nov', avance: 42 },
  { id: 'c2', nombre: 'Física II', horasClase: 4, dificultad: 'normal', avance: 61 },
  { id: 'c3', nombre: 'Algoritmos y Estructuras de Datos', horasClase: 4, dificultad: 'normal', avance: 78 },
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
          { id: String(Date.now()), nombre, horasClase: 4, dificultad: 'normal', avance: 0 },
        ]),
      actualizarCurso: (id, c) => setCursos((cs) => cs.map((x) => (x.id === id ? { ...x, ...c } : x))),
      quitarCurso: (id) => setCursos((cs) => cs.filter((x) => x.id !== id)),
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
