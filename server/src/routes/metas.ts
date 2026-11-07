import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { lunesLima } from '../lib/fechas.js';

/** Plan semanal del check-in: objetivos por curso o método y cómo se proyecta la semana. */
export const metas = Router();

export const METODOS = ['Pomodoro', 'Repaso espaciado', 'Simulacro de examen', 'Técnica Feynman', 'Práctica activa', 'Grupo de estudio', 'Mapas conceptuales'];

const objetivo = z.object({
  id: z.string().min(1).max(40),
  texto: z.string().trim().min(1, 'Escribe tu objetivo').max(140),
  cursoId: z.string().nullable().default(null),
  metodo: z.string().trim().max(40).nullable().default(null),
  cumplido: z.boolean().default(false),
});
const plan = z.object({
  objetivos: z.array(objetivo).max(10),
  proyeccion: z.enum(['tranquila', 'normal', 'intensa']).nullable().default(null),
  comentario: z.string().trim().max(300).nullable().default(null),
});

metas.get('/semana', async (req, res) => {
  const semana = lunesLima();
  const m = await db.metas.obtener(req.usuarioId, semana);
  res.json({ semana, objetivos: m?.objetivos ?? [], proyeccion: m?.proyeccion ?? null, comentario: m?.comentario ?? null, metodos: METODOS });
});

metas.put('/semana', async (req, res) => {
  const d = plan.parse(req.body);
  const cursos = await db.cursos.listar(req.usuarioId);
  const ids = new Set(cursos.map((c) => c.id));
  const m = await db.metas.guardar({
    usuarioId: req.usuarioId,
    semana: lunesLima(),
    objetivos: d.objetivos.map((o) => ({ ...o, cursoId: o.cursoId && ids.has(o.cursoId) ? o.cursoId : null })),
    proyeccion: d.proyeccion,
    comentario: d.comentario || null,
  });
  res.json({ semana: m.semana, objetivos: m.objetivos, proyeccion: m.proyeccion, comentario: m.comentario, metodos: METODOS });
});

/** Resumen en texto para darle contexto a la IA (tutor y avisos). */
export async function resumenSemana(usuarioId: string): Promise<string | null> {
  const m = await db.metas.obtener(usuarioId, lunesLima()).catch(() => null);
  if (!m || (!m.objetivos.length && !m.proyeccion && !m.comentario)) return null;
  const cursos = await db.cursos.listar(usuarioId);
  const objetivos = m.objetivos
    .map((o) => {
      const curso = o.cursoId ? cursos.find((c) => c.id === o.cursoId)?.nombre : null;
      return `- ${o.texto}${curso ? ` (${curso})` : ''}${o.metodo ? ` · método: ${o.metodo}` : ''}${o.cumplido ? ' · ✔ cumplido' : ''}`;
    })
    .join('\n');
  return [
    m.proyeccion && `Cómo se proyecta esta semana: ${m.proyeccion}.`,
    m.comentario && `Lo que dijo de su semana: "${m.comentario}".`,
    objetivos && `Sus objetivos de la semana:\n${objetivos}`,
  ]
    .filter(Boolean)
    .join('\n');
}
