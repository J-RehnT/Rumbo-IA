/**
 * Banco de ejercicios tipo examen para el modo "Prepárame".
 * Son ejercicios del estilo que se toma en los cursos de Cálculo II (cálculo integral) de
 * universidades peruanas como UNI, UNMSM, PUCP o UPC. No son preguntas oficiales de esas
 * universidades: sirven de modelo para que el tutor genere ejercicios parecidos.
 */
type Ejercicio = { tema: string; enunciado: string; nivel: 'basico' | 'intermedio' | 'examen' };

const CALCULO_II: Ejercicio[] = [
  { tema: 'Integración por partes', nivel: 'basico', enunciado: 'Calcule ∫ x² eˣ dx.' },
  { tema: 'Integración por partes', nivel: 'intermedio', enunciado: 'Calcule ∫ eˣ cos(x) dx (integral cíclica).' },
  { tema: 'Integración por partes', nivel: 'examen', enunciado: 'Calcule ∫ x·arctan(x) dx.' },
  { tema: 'Sustitución trigonométrica', nivel: 'intermedio', enunciado: 'Calcule ∫ dx / (x²·√(9 − x²)).' },
  { tema: 'Sustitución trigonométrica', nivel: 'examen', enunciado: 'Calcule ∫ √(x² + 4) dx.' },
  { tema: 'Fracciones parciales', nivel: 'basico', enunciado: 'Calcule ∫ (3x + 5) / (x² − x − 2) dx.' },
  { tema: 'Fracciones parciales', nivel: 'examen', enunciado: 'Calcule ∫ (x² + 1) / (x(x − 1)²) dx.' },
  { tema: 'Integrales impropias', nivel: 'intermedio', enunciado: 'Determine si converge ∫₁^∞ ln(x) / x² dx y, de ser así, calcule su valor.' },
  { tema: 'Integrales impropias', nivel: 'examen', enunciado: 'Analice la convergencia de ∫₀^1 dx / √(1 − x²) y ∫₀^∞ x·e^(−x²) dx.' },
  { tema: 'Área entre curvas', nivel: 'basico', enunciado: 'Halle el área de la región limitada por y = x² e y = 2x − x².' },
  { tema: 'Área entre curvas', nivel: 'examen', enunciado: 'Halle el área de la región limitada por y² = 2x y x − y = 4 (integre respecto de y).' },
  { tema: 'Volumen de sólidos de revolución', nivel: 'intermedio', enunciado: 'La región limitada por y = √x, y = 0 y x = 4 gira alrededor del eje X. Halle el volumen (método de discos).' },
  { tema: 'Volumen de sólidos de revolución', nivel: 'examen', enunciado: 'La región limitada por y = x² e y = 4 gira alrededor de la recta y = 4. Halle el volumen y justifique el método (discos o casquetes).' },
  { tema: 'Longitud de arco', nivel: 'intermedio', enunciado: 'Halle la longitud de la curva y = x^(3/2) desde x = 0 hasta x = 4.' },
  { tema: 'Coordenadas polares', nivel: 'examen', enunciado: 'Halle el área encerrada por un pétalo de la rosa r = cos(3θ).' },
  { tema: 'Sucesiones y series', nivel: 'intermedio', enunciado: 'Determine si converge Σ (n! / nⁿ) usando el criterio del cociente.' },
  { tema: 'Sucesiones y series', nivel: 'examen', enunciado: 'Halle el radio y el intervalo de convergencia de Σ (x − 2)ⁿ / (n·3ⁿ), analizando los extremos.' },
];

const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Ejercicios modelo para el curso, o null si no hay banco para ese curso. */
export function bancoPara(curso: string): Ejercicio[] | null {
  const n = normalizar(curso);
  if (/calculo (ii|2)|calculo integral/.test(n)) return CALCULO_II;
  return null;
}

export type Preparacion = {
  titulo: string;
  tipo: 'parcial' | 'examen' | 'practica' | 'entrega_grupal';
  diasRestantes: number;
};

/** Instrucciones extra del sistema para el modo "Prepárame". */
export function instruccionesPreparacion(p: Preparacion, curso: string | undefined, universidad: string | null, promedio: number | null) {
  const banco = curso ? bancoPara(curso) : null;
  const ejemplos = banco
    ? `\nEjercicios modelo (estilo de exámenes de Cálculo II en universidades peruanas; úsalos como referencia de formato y dificultad, crea variantes, no los copies todos):\n${banco
        .map((e) => `- [${e.tema} · ${e.nivel}] ${e.enunciado}`)
        .join('\n')}`
    : '';
  const nivel =
    promedio === null ? 'Aún no hay notas: empieza en nivel intermedio.' : promedio < 11 ? `Su promedio es ${promedio}/20: empieza en nivel básico y sube de a poco.` : `Su promedio es ${promedio}/20: puedes llegar a nivel examen.`;

  return `
MODO PREPÁRAME: el estudiante se entrena para «${p.titulo}» de ${curso ?? 'su curso'}, que es en ${p.diasRestantes} día(s)${universidad ? `, en ${universidad}` : ''}.
${nivel}
Cómo trabajar:
1. Primero da un mini-plan de 3 líneas: qué temas priorizar según los días que faltan.
2. Luego propone UN ejercicio tipo examen (enunciado formal, como en una práctica calificada o examen universitario) y espera su intento. No des la solución hasta que lo intente o la pida.
3. Corrige su respuesta paso a paso, señala el error exacto y propone el siguiente ejercicio, ajustando la dificultad.
4. Si lleva varios aciertos seguidos, sube a nivel examen; si falla dos veces, baja un nivel y repasa el concepto.
Escribe las matemáticas en texto plano legible (∫, √, ², x^(3/2)); no uses LaTeX.${ejemplos}`;
}
