import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { ErrorApi } from '../lib/errores.js';
import { usuarioPublico } from '../lib/vistas.js';
import { UNIVERSIDADES } from '../services/catalogo.js';

export const me = Router();

async function usuarioActual(id: string) {
  const u = await db.usuarios.porId(id);
  if (!u) throw new ErrorApi(401, 'no_autenticado', 'Tu sesión ya no es válida');
  return u;
}

me.get('/', async (req, res) => {
  res.json(usuarioPublico(await usuarioActual(req.usuarioId)));
});

me.patch('/', async (req, res) => {
  const d = z.object({ nombre: z.string().trim().min(1).max(80) }).parse(req.body);
  await usuarioActual(req.usuarioId);
  res.json(usuarioPublico(await db.usuarios.actualizar(req.usuarioId, d)));
});

const perfil = z
  .object({
    universidad: z.string().trim().min(1, 'Elige tu universidad'), // sigla o 'OTRA'
    universidadNombre: z.string().trim().max(120).optional(),
    carrera: z.string().trim().min(1, 'Escribe tu carrera').max(120),
    ciclo: z.number().int().min(1).max(12),
  })
  .refine((d) => d.universidad === 'OTRA' || UNIVERSIDADES.some((u) => u.sigla === d.universidad), {
    path: ['universidad'],
    message: 'Universidad desconocida; usa "OTRA" y escribe el nombre',
  })
  .refine((d) => d.universidad !== 'OTRA' || !!d.universidadNombre, {
    path: ['universidadNombre'],
    message: 'Escribe el nombre de tu universidad',
  });

me.put('/perfil-academico', async (req, res) => {
  const d = perfil.parse(req.body);
  await usuarioActual(req.usuarioId);
  const u = await db.usuarios.actualizar(req.usuarioId, {
    universidadSigla: d.universidad,
    universidadNombre: d.universidad === 'OTRA' ? d.universidadNombre! : null,
    carrera: d.carrera,
    ciclo: d.ciclo,
  });
  res.json(usuarioPublico(u));
});
