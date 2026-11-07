import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import type { Actividad, Curso } from '../db/tipos.js';
import { ErrorApi, noEncontrado } from '../lib/errores.js';
import { diasHasta } from '../lib/fechas.js';
import { calendarioSimulado } from '../services/universidad.js';

export const actividades = Router();

const TIPOS = ['parcial', 'examen', 'practica', 'entrega_grupal'] as const;
const TITULO_POR_DEFECTO = {
  parcial: 'Examen parcial',
  examen: 'Examen final',
  practica: 'Práctica calificada',
  entrega_grupal: 'Entrega de trabajo en equipo',
} as const;

const fecha = z.iso.date('Usa el formato AAAA-MM-DD');
const nueva = z.object({
  cursoId: z.string().min(1, 'Elige un curso'),
  tipo: z.enum(TIPOS),
  titulo: z.string().trim().max(80).optional(),
  fecha,
});
const cambios = z.object({
  tipo: z.enum(TIPOS).optional(),
  titulo: z.string().trim().min(1).max(80).optional(),
  fecha: fecha.optional(),
  completada: z.boolean().optional(),
});

/** Actividad lista para el front: con el nombre del curso y los días que faltan. */
export function vistaActividad(a: Actividad, cursos: Curso[]) {
  const { usuarioId: _u, ...resto } = a;
  return { ...resto, curso: cursos.find((c) => c.id === a.cursoId)?.nombre ?? 'Curso', diasRestantes: diasHasta(a.fecha) };
}

actividades.get('/', async (req, res) => {
  const [lista, cursos] = await Promise.all([db.actividades.listar(req.usuarioId), db.cursos.listar(req.usuarioId)]);
  res.json(lista.map((a) => vistaActividad(a, cursos)));
});

actividades.post('/', async (req, res) => {
  const d = nueva.parse(req.body);
  const curso = await db.cursos.porId(req.usuarioId, d.cursoId);
  if (!curso) throw noEncontrado('El curso');
  const a = await db.actividades.crear({
    usuarioId: req.usuarioId,
    cursoId: curso.id,
    tipo: d.tipo,
    titulo: d.titulo || TITULO_POR_DEFECTO[d.tipo],
    fecha: d.fecha,
    origen: 'manual',
    completada: false,
  });
  res.status(201).json(vistaActividad(a, [curso]));
});

/**
 * Simula que la universidad envía el calendario: agrega las fechas de cada curso del estudiante.
 * Es idempotente: lo que ya existe (mismo curso, tipo y título) no se vuelve a crear.
 */
actividades.post('/sincronizar', async (req, res) => {
  const [cursos, existentes] = await Promise.all([db.cursos.listar(req.usuarioId), db.actividades.listar(req.usuarioId)]);
  if (cursos.length === 0) {
    throw new ErrorApi(400, 'sin_cursos', 'Primero agrega tus cursos para sincronizar el calendario de tu universidad.');
  }
  const clave = (x: { cursoId: string; tipo: string; titulo: string }) => `${x.cursoId}|${x.tipo}|${x.titulo}`;
  const yaEstan = new Set(existentes.map(clave));

  let agregadas = 0;
  for (const p of calendarioSimulado(cursos)) {
    if (yaEstan.has(clave(p))) continue;
    await db.actividades.crear({ ...p, usuarioId: req.usuarioId, origen: 'universidad', completada: false });
    agregadas++;
  }
  const lista = await db.actividades.listar(req.usuarioId);
  res.json({ agregadas, actividades: lista.map((a) => vistaActividad(a, cursos)) });
});

actividades.patch('/:id', async (req, res) => {
  const d = cambios.parse(req.body);
  const soloEnviados = Object.fromEntries(Object.entries(d).filter(([k]) => k in req.body));
  const a = await db.actividades.actualizar(req.usuarioId, req.params.id, soloEnviados);
  if (!a) throw noEncontrado('La actividad');
  res.json(vistaActividad(a, await db.cursos.listar(req.usuarioId)));
});

actividades.delete('/:id', async (req, res) => {
  if (!(await db.actividades.eliminar(req.usuarioId, req.params.id))) throw noEncontrado('La actividad');
  res.status(204).end();
});
