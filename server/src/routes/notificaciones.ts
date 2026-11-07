import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import type { Curso, Notificacion } from '../db/tipos.js';
import { limiteTutor } from '../middleware/limite.js';
import { promedio } from '../services/apoyo.js';
import { planificarRecordatorios } from '../services/recordatorios.js';
import { resumenSemana } from './metas.js';

export const notificaciones = Router();

const HORAS_ENTRE_PLANES = 6;
const DIA_MS = 24 * 60 * 60 * 1000;

function vista(n: Notificacion, cursos: Curso[]) {
  const { usuarioId: _u, ...resto } = n;
  return {
    ...resto,
    curso: n.cursoId ? (cursos.find((c) => c.id === n.cursoId)?.nombre ?? null) : null,
    entregada: Date.parse(n.programadaPara) <= Date.now(),
  };
}

/** Las ya entregadas de los últimos 14 días y las programadas (la app las agenda en el celular). */
async function listado(usuarioId: string) {
  const [lista, cursos] = await Promise.all([db.notificaciones.listar(usuarioId), db.cursos.listar(usuarioId)]);
  const desde = Date.now() - 14 * DIA_MS;
  const visibles = lista.filter((n) => Date.parse(n.programadaPara) >= desde).map((n) => vista(n, cursos));
  return {
    noLeidas: visibles.filter((n) => n.entregada && !n.leida).length,
    notificaciones: visibles,
  };
}

notificaciones.get('/', async (req, res) => {
  res.json(await listado(req.usuarioId));
});

/**
 * El tutor (IA) arma el plan de notificaciones según la agenda. La app lo pide al abrirse;
 * para no gastar en cada apertura, solo regenera cada 6 horas salvo `forzar: true`.
 */
notificaciones.post('/generar', limiteTutor, async (req, res) => {
  const { forzar } = z.object({ forzar: z.boolean().optional() }).parse(req.body ?? {});
  const actuales = await db.notificaciones.listar(req.usuarioId);
  const ultimoPlan = Math.max(0, ...actuales.map((n) => Date.parse(n.creadoEn)));
  if (!forzar && Date.now() - ultimoPlan < HORAS_ENTRE_PLANES * 60 * 60 * 1000) {
    return res.json({ generadas: 0, origen: null, ...(await listado(req.usuarioId)) });
  }

  const [usuario, cursos, evaluaciones, actividades, checkins, semana] = await Promise.all([
    db.usuarios.porId(req.usuarioId),
    db.cursos.listar(req.usuarioId),
    db.evaluaciones.listar(req.usuarioId),
    db.actividades.listar(req.usuarioId),
    db.checkins.listar(req.usuarioId),
    resumenSemana(req.usuarioId),
  ]);
  const { items, origen } = await planificarRecordatorios({
    usuario,
    cursos: cursos.map((c) => ({ ...c, promedio: promedio(evaluaciones.filter((e) => e.cursoId === c.id)) })),
    actividades,
    checkins,
    semana,
  });

  // El plan nuevo reemplaza lo que aún no se entregó; lo ya entregado queda en el historial.
  await db.notificaciones.eliminarPendientes(req.usuarioId, new Date().toISOString());
  for (const i of items) {
    // Se guarda en UTC para que las comparaciones de fechas sean consistentes.
    const programadaPara = new Date(Date.parse(i.programadaPara)).toISOString();
    await db.notificaciones.crear({ ...i, programadaPara, usuarioId: req.usuarioId, leida: false });
  }

  res.json({ generadas: items.length, origen, ...(await listado(req.usuarioId)) });
});

notificaciones.post('/leer', async (req, res) => {
  const { ids } = z.object({ ids: z.array(z.string()).max(100).optional() }).parse(req.body ?? {});
  await db.notificaciones.marcarLeidas(req.usuarioId, ids);
  res.json(await listado(req.usuarioId));
});
