import bcrypt from 'bcryptjs';
import { config } from '../config.js';

/** Hashea una contraseña con bcrypt (sal incluida en el hash). */
export function hashearPassword(plano: string): Promise<string> {
  return bcrypt.hash(plano, config.bcryptRondas);
}

/** Compara una contraseña en texto plano con su hash bcrypt. */
export function verificarPassword(plano: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plano, hash);
}
