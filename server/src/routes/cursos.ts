import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import type { Curso, Evaluacion } from '../db/tipos.js';
import { noEncontrado } from '../lib/errores.js';
import { promedio } from '../services/apoyo.js';

export const cursos = Router();

const fecha = z.iso.date('Usa el formato AAAA-MM-DD');
const cursoBase = z.object({
  nombre: z.string().trim().min(1, 'Escribe el nombre del curso').max(80),
  horasClase: z.number().int().min(0).max(40).default(4),
  dificultad: z.enum(['facil', 'normal', 'complicado']).default('normal'),
  proximoParcial: fecha.nullable().optional(),
});

export function vistaCurso(c: Curso, evals: Evaluacion[]) {
  const propias = evals.filter((e) => e.cursoId === c.id);
  const p = promedio(propias);
  const { usuarioId: _u, ...resto } = c;
  return {
    ...resto,
    promedio: p, // 0–20 o null
    avance: p === null ? null : Math.round((p / 20) * 100), // 0–100
    evaluaciones: propias.length,
  };
}

cursos.get('/', async (req, res) => {
  const [cs, evs] = await Promise.all([db.cursos.listar(req.usuarioId), db.evaluaciones.listar(req.usuarioId)]);
  res.json(cs.map((c) => vistaCurso(c, evs)));
});

// Acepta un curso o una lista (útil para el paso "Cursos" del registro).
cursos.post('/', async (req, res) => {
  const lista = Array.isArray(req.body) ? z.array(cursoBase).min(1).max(15).parse(req.body) : [cursoBase.parse(req.body)];
  const creados = [];
  for (const d of lista) {
    creados.push(await db.cursos.crear({ ...d, proximoParcial: d.proximoParcial ?? null, usuarioId: req.usuarioId }));
  }
  const vistas = creados.map((c) => vistaCurso(c, []));
  res.status(201).json(Array.isArray(req.body) ? vistas : vistas[0]);
});

cursos.get('/:id', async (req, res) => {
  const c = await db.cursos.porId(req.usuarioId, req.params.id);
  if (!c) throw noEncontrado('El curso');
  res.json(vistaCurso(c, await db.evaluaciones.listar(req.usuarioId, c.id)));
});

cursos.patch('/:id', async (req, res) => {
  const cambios = cursoBase.partial().parse(req.body);
  // .partial() mantiene los defaults de zod: quitamos lo que no vino en el body.
  const soloEnviados = Object.fromEntries(Object.entries(cambios).filter(([k]) => k in req.body));
  const c = await db.cursos.actualizar(req.usuarioId, req.params.id, soloEnviados);
  if (!c) throw noEncontrado('El curso');
  res.json(vistaCurso(c, await db.evaluaciones.listar(req.usuarioId, c.id)));
});

cursos.delete('/:id', async (req, res) => {
  if (!(await db.cursos.eliminar(req.usuarioId, req.params.id))) throw noEncontrado('El curso');
  res.status(204).end();
});

// ---- Evaluaciones (notas) ----
const evaluacion = z.object({
  tipo: z.enum(['practica', 'parcial', 'final', 'quiz', 'otro']).default('practica'),
  nota: z.number().min(0).max(20),
  fecha: fecha.optional(),
});

cursos.get('/:id/evaluaciones', async (req, res) => {
  const c = await db.cursos.porId(req.usuarioId, req.params.id);
  if (!c) throw noEncontrado('El curso');
  res.json(await db.evaluaciones.listar(req.usuarioId, c.id));
});

cursos.post('/:id/evaluaciones', async (req, res) => {
  const c = await db.cursos.porId(req.usuarioId, req.params.id);
  if (!c) throw noEncontrado('El curso');
  const d = evaluacion.parse(req.body);
  const e = await db.evaluaciones.crear({
    ...d,
    fecha: d.fecha ?? new Date().toISOString().slice(0, 10),
    cursoId: c.id,
    usuarioId: req.usuarioId,
  });
  res.status(201).json(e);
});
