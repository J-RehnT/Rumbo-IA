import { randomUUID } from 'node:crypto';
export const nuevoId = () => randomUUID();
export const ahora = () => new Date().toISOString();
