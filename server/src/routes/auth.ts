import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { ErrorApi } from '../lib/errores.js';
import { firmarToken } from '../lib/jwt.js';
import { hashearPassword, verificarPassword } from '../lib/password.js';
import { usuarioPublico } from '../lib/vistas.js';

export const auth = Router();

const correo = z.string().trim().toLowerCase().pipe(z.email('Correo inválido'));

const registro = z.object({
  nombre: z.string().trim().min(1, 'Escribe tu nombre').max(80),
  correo,
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(72), // límite de bcrypt
});

auth.post('/registro', async (req, res) => {
  const d = registro.parse(req.body);
  if (await db.usuarios.porCorreo(d.correo)) {
    throw new ErrorApi(409, 'correo_en_uso', 'Ya existe una cuenta con ese correo');
  }
  const u = await db.usuarios.crear({
    nombre: d.nombre,
    correo: d.correo,
    passwordHash: await hashearPassword(d.password),
    universidadSigla: null,
    universidadNombre: null,
    carrera: null,
    ciclo: null,
  });
  res.status(201).json({ token: firmarToken(u.id), usuario: usuarioPublico(u) });
});

const login = z.object({ correo, password: z.string().min(1) });

auth.post('/login', async (req, res) => {
  const d = login.parse(req.body);
  const u = await db.usuarios.porCorreo(d.correo);
  const ok = u?.passwordHash ? await verificarPassword(d.password, u.passwordHash) : false;
  if (!u || !ok) throw new ErrorApi(401, 'credenciales_invalidas', 'Correo o contraseña incorrectos');
  res.json({ token: firmarToken(u.id), usuario: usuarioPublico(u) });
});

auth.post('/google', () => {
  throw new ErrorApi(501, 'no_implementado', 'El ingreso con Google estará disponible pronto');
});
