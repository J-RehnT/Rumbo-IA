import type { NextFunction, Request, Response } from 'express';
import { ErrorApi } from '../lib/errores.js';

/** Limita las preguntas al tutor por usuario (ventana deslizante en memoria). */
const VENTANA_MS = 60_000;
const MAXIMO = 20;
const registro = new Map<string, number[]>();

export function limiteTutor(req: Request, _res: Response, next: NextFunction) {
  const ahora = Date.now();
  const recientes = (registro.get(req.usuarioId) ?? []).filter((t) => ahora - t < VENTANA_MS);
  if (recientes.length >= MAXIMO) {
    throw new ErrorApi(429, 'demasiadas_preguntas', 'Vas muy rápido. Espera un momento y vuelve a preguntar.');
  }
  recientes.push(ahora);
  registro.set(req.usuarioId, recientes);
  next();
}
