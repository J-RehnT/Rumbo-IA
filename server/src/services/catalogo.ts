export type Universidad = { sigla: string; nombre: string };

// Igual que src/data/universidades.ts del front.
export const UNIVERSIDADES: Universidad[] = [
  { sigla: 'UNMSM', nombre: 'Universidad Nacional Mayor de San Marcos' },
  { sigla: 'UPC', nombre: 'Universidad Peruana de Ciencias Aplicadas' },
  { sigla: 'PUCP', nombre: 'Pontificia Universidad Católica del Perú' },
  { sigla: 'UNI', nombre: 'Universidad Nacional de Ingeniería' },
  { sigla: 'ULima', nombre: 'Universidad de Lima' },
  { sigla: 'UPCH', nombre: 'Universidad Peruana Cayetano Heredia' },
  { sigla: 'UP', nombre: 'Universidad del Pacífico' },
  { sigla: 'UTEC', nombre: 'Universidad de Ingeniería y Tecnología' },
  { sigla: 'UNALM', nombre: 'Universidad Nacional Agraria La Molina' },
  { sigla: 'USIL', nombre: 'Universidad San Ignacio de Loyola' },
];

export const RECURSOS_APOYO = [
  {
    id: 'linea-113',
    nombre: 'Línea 113, opción 5 (MINSA)',
    descripcion: 'Orientación en salud mental gratuita, las 24 horas.',
    telefono: '113',
  },
  {
    id: 'bienestar',
    nombre: 'Bienestar Universitario',
    descripcion: 'Tu universidad ofrece atención psicológica gratuita para estudiantes. Pide una cita en la oficina de Bienestar.',
  },
];
