// Catálogo de cursos de Ingeniería de Software (UPC) para sugerir en el registro.
// Nombres referenciales de la malla curricular; ajústalos si la malla vigente cambia.

export type AreaCursos = { area: string; cursos: string[] };

export const CURSOS_ING_SOFTWARE_UPC: AreaCursos[] = [
  {
    area: 'Ciencias básicas',
    cursos: [
      'Matemática Básica',
      'Cálculo I',
      'Cálculo II',
      'Álgebra Lineal',
      'Matemática Discreta',
      'Matemática Computacional',
      'Física I',
      'Física II',
      'Estadística Aplicada I',
      'Estadística Aplicada II',
      'Investigación de Operaciones',
    ],
  },
  {
    area: 'Programación y algoritmos',
    cursos: [
      'Fundamentos de Programación',
      'Programación I',
      'Programación II',
      'Programación Orientada a Objetos',
      'Algoritmos y Estructuras de Datos',
      'Complejidad Algorítmica',
      'Paradigmas de Programación',
    ],
  },
  {
    area: 'Ingeniería de software',
    cursos: [
      'Introducción a la Ingeniería de Software',
      'Ingeniería de Requisitos',
      'Diseño y Patrones de Software',
      'Arquitectura de Software',
      'Diseño de Experiencia de Usuario',
      'Interacción Humano-Computador',
      'Pruebas y Calidad de Software',
      'Gestión de la Configuración de Software',
      'Desarrollo de Aplicaciones Open Source',
    ],
  },
  {
    area: 'Desarrollo de aplicaciones',
    cursos: [
      'Aplicaciones Web',
      'Aplicaciones para Dispositivos Móviles',
      'Desarrollo de Soluciones IoT',
      'Desarrollo de Videojuegos',
      'Computación en la Nube',
      'Inteligencia Artificial',
      'Machine Learning',
    ],
  },
  {
    area: 'Datos e infraestructura',
    cursos: [
      'Base de Datos',
      'Base de Datos Avanzada',
      'Big Data',
      'Arquitectura de Computadoras',
      'Sistemas Operativos',
      'Redes y Comunicación de Datos',
      'Seguridad de la Información',
    ],
  },
  {
    area: 'Gestión y proyecto',
    cursos: [
      'Gestión de Proyectos de Software',
      'Emprendimiento de Negocios de Base Tecnológica',
      'Ingeniería Económica',
      'Taller de Proyecto I',
      'Taller de Proyecto II',
      'Prácticas Preprofesionales',
    ],
  },
  {
    area: 'Formación general',
    cursos: [
      'Comprensión y Producción de Lenguaje I',
      'Comprensión y Producción de Lenguaje II',
      'Seminario de Investigación Académica',
      'Ética y Ciudadanía',
      'Inglés',
    ],
  },
];
