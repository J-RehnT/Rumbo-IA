import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ErrorApi } from '../lib/errores.js';

export function manejarErrores(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ErrorApi) {
    return res.status(err.status).json({ error: { codigo: err.codigo, mensaje: err.message, detalles: err.detalles } });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        codigo: 'datos_invalidos',
        mensaje: 'Revisa los datos enviados',
        detalles: err.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message })),
      },
    });
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: { codigo: 'json_invalido', mensaje: 'El cuerpo no es JSON válido' } });
  }
  console.error(err);
  res.status(500).json({ error: { codigo: 'error_interno', mensaje: 'Algo salió mal, intenta de nuevo' } });
}
