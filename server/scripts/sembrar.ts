/**
 * Carga datos de ejemplo realistas (evaluaciones de un ciclo) en una cuenta existente.
 * Uso:  npm run sembrar                      (si solo hay una cuenta)
 *       npm run sembrar -- correo@dominio.pe (para elegir la cuenta)
 * Es idempotente: no duplica actividades ni notas si se ejecuta otra vez.
 */
import { db } from '../src/db/index.js';
import type { Curso, TipoActividad, TipoEvaluacion } from '../src/db/tipos.js';
import { crearClienteSupabase } from '../src/db/supabase.js';
import { hoyLima, sumarDias } from '../src/lib/fechas.js';

// Evaluaciones típicas de un ciclo. `dias` es relativo a hoy; las pasadas ya tienen nota.
const PLAN: { titulo: string; tipo: TipoActividad; dias: number; nota?: { tipo: TipoEvaluacion; valores: number[] } }[] = [
  { titulo: 'Práctica calificada 1', tipo: 'practica', dias: -10, nota: { tipo: 'practica', valores: [14, 9] } },
  { titulo: 'Entrega de avance 1', tipo: 'entrega_grupal', dias: -3, nota: { tipo: 'otro', valores: [16, 11] } },
  { titulo: 'Examen Parcial', tipo: 'parcial', dias: 3 },
  { titulo: 'Trabajo Parcial', tipo: 'entrega_grupal', dias: 6 },
  { titulo: 'Práctica calificada 2', tipo: 'practica', dias: 10 },
  { titulo: 'Entrega de avance 2', tipo: 'entrega_grupal', dias: 13 },
  { titulo: 'Examen final', tipo: 'examen', dias: 24 },
  { titulo: 'Trabajo final', tipo: 'entrega_grupal', dias: 28 },
];
const CURSOS_EXTRA = ['Algoritmos y Estructuras de Datos', 'Física II'];

const correoArg = process.argv[2]?.toLowerCase();
const sb = crearClienteSupabase();
const { data: usuarios, error } = await sb.from('usuarios').select('id,nombre,correo');
if (error) throw new Error(error.message);

const usuario = correoArg ? usuarios?.find((u) => u.correo === correoArg) : usuarios?.length === 1 ? usuarios[0] : null;
if (!usuario) {
  console.error(correoArg ? `No existe la cuenta ${correoArg}` : `Hay ${usuarios?.length ?? 0} cuentas: indica el correo (npm run sembrar -- correo).`);
  process.exit(1);
}
console.log(`Cuenta: ${usuario.nombre}`);

// Al menos dos cursos.
let cursos: Curso[] = await db.cursos.listar(usuario.id);
for (const nombre of CURSOS_EXTRA) {
  if (cursos.length >= 2) break;
  if (cursos.some((c) => c.nombre.toLowerCase() === nombre.toLowerCase())) continue;
  await db.cursos.crear({ usuarioId: usuario.id, nombre, horasClase: 4, dificultad: 'normal', proximoParcial: null });
  console.log(`+ curso ${nombre}`);
  cursos = await db.cursos.listar(usuario.id);
}

const hoy = hoyLima();
const elegidos = cursos.slice(0, 2);
for (const [i, curso] of elegidos.entries()) {
  const existentes = await db.actividades.listar(usuario.id, curso.id);
  const notas = await db.evaluaciones.listar(usuario.id, curso.id);
  let nuevas = 0;
  for (const p of PLAN) {
    const fecha = sumarDias(hoy, p.dias + i); // el segundo curso, un día después
    if (!existentes.some((a) => a.titulo.toLowerCase() === p.titulo.toLowerCase())) {
      await db.actividades.crear({
        usuarioId: usuario.id,
        cursoId: curso.id,
        tipo: p.tipo,
        titulo: p.titulo,
        fecha,
        origen: 'universidad',
        completada: p.dias < 0,
      });
      nuevas++;
    }
    const nota = p.nota?.valores[i];
    if (p.nota && nota !== undefined && !notas.some((n) => n.fecha === fecha && n.nota === nota)) {
      await db.evaluaciones.crear({ usuarioId: usuario.id, cursoId: curso.id, tipo: p.nota.tipo, nota, fecha });
    }
  }
  console.log(`${curso.nombre}: ${nuevas} actividades nuevas (${PLAN.length} en el plan)`);
}
console.log('Listo.');
