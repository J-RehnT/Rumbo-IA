import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { noEncontrado } from '../lib/errores.js';
import { contextoDe, responderTutor } from '../services/tutor.js';

export const tutor = Router();

tutor.get('/conversaciones', async (req, res) => {
  res.json((await db.conversaciones.listar(req.usuarioId)).map(({ usuarioId: _u, ...c }) => c));
});

tutor.post('/conversaciones', async (req, res) => {
  const d = z.object({ cursoId: z.string().optional(), titulo: z.string().trim().max(80).optional() }).parse(req.body ?? {});
  const curso = d.cursoId ? await db.cursos.porId(req.usuarioId, d.cursoId) : null;
  if (d.cursoId && !curso) throw noEncontrado('El curso');
  const c = await db.conversaciones.crear({
    usuarioId: req.usuarioId,
    cursoId: curso?.id ?? null,
    titulo: d.titulo ?? (curso ? `Dudas de ${curso.nombre}` : 'Nueva conversación'),
  });
  const { usuarioId: _u, ...vista } = c;
  res.status(201).json(vista);
});

async function conversacionPropia(usuarioId: string, id: string) {
  const c = await db.conversaciones.porId(usuarioId, id);
  if (!c) throw noEncontrado('La conversación');
  return c;
}

tutor.get('/conversaciones/:id/mensajes', async (req, res) => {
  const c = await conversacionPropia(req.usuarioId, req.params.id);
  res.json(await db.mensajes.listar(c.id));
});

tutor.post('/conversaciones/:id/mensajes', async (req, res) => {
  const c = await conversacionPropia(req.usuarioId, req.params.id);
  const { texto } = z.object({ texto: z.string().trim().min(1).max(4000) }).parse(req.body);

  const [usuario, curso] = await Promise.all([
    db.usuarios.porId(req.usuarioId),
    c.cursoId ? db.cursos.porId(req.usuarioId, c.cursoId) : null,
  ]);
  const enviado = await db.mensajes.crear({ conversacionId: c.id, autor: 'estudiante', texto });
  const historial = (await db.mensajes.listar(c.id)).slice(-20);
  const respuesta = await responderTutor(historial, contextoDe(usuario, curso));
  const recibido = await db.mensajes.crear({ conversacionId: c.id, autor: 'tutor', texto: respuesta });
  res.status(201).json({ enviado, respuesta: recibido });
});

/**
 * Atajo sin historial guardado, compatible con EXPO_PUBLIC_TUTOR_URL del front actual
 * (src/lib/tutor.ts): recibe { mensajes, contexto } y devuelve { texto }.
 */
export const tutorRapido = Router();
tutorRapido.post('/', async (req, res) => {
  const d = z
    .object({
      mensajes: z
        .array(z.object({ autor: z.enum(['estudiante', 'tutor']), texto: z.string().min(1).max(4000) }))
        .min(1)
        .max(40),
      contexto: z
        .object({
          ciclo: z.number().int().min(1).max(12).optional(),
          carrera: z.string().max(120).optional(),
          curso: z.object({ nombre: z.string(), dificultad: z.enum(['facil', 'normal', 'complicado']) }).optional(),
        })
        .default({}),
    })
    .parse(req.body);
  res.json({ texto: await responderTutor(d.mensajes, d.contexto) });
});
