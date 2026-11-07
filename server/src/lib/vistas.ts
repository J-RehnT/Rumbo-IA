import type { Usuario } from '../db/tipos.js';
import { UNIVERSIDADES } from '../services/catalogo.js';

/** Usuario sin el hash de la contraseña, listo para enviar al front. */
export function usuarioPublico(u: Usuario) {
  const uni =
    u.universidadSigla === 'OTRA'
      ? { sigla: 'OTRA', nombre: u.universidadNombre ?? 'Otra' }
      : (UNIVERSIDADES.find((x) => x.sigla === u.universidadSigla) ?? null);
  return {
    id: u.id,
    nombre: u.nombre,
    correo: u.correo,
    universidad: uni,
    carrera: u.carrera,
    ciclo: u.ciclo,
    creadoEn: u.creadoEn,
  };
}
