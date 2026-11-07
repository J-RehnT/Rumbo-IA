import type { NextFunction, Request, Response } from 'express';
import { ErrorApi } from '../lib/errores.js';
import { leerToken } from '../lib/jwt.js';

declare global {
  namespace Express {
    interface Request {
      usuarioId: string;
    }
  }
}

/** Exige `Authorization: Bearer <token>` y deja el id en req.usuarioId. */
export function requiereAuth(req: Request, _res: Response, next: NextFunction) {
  const [tipo, token] = (req.headers.authorization ?? '').split(' ');
  const id = tipo === 'Bearer' && token ? leerToken(token) : null;
  if (!id) throw new ErrorApi(401, 'no_autenticado', 'Inicia sesión para continuar');
  req.usuarioId = id;
  next();
}
