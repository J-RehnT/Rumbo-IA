import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config.js';

export function firmarToken(usuarioId: string): string {
  return jwt.sign({ sub: usuarioId }, config.jwtSecreto, {
    expiresIn: config.jwtExpira as SignOptions['expiresIn'],
  });
}

export function leerToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, config.jwtSecreto);
    return typeof payload === 'object' && typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}
