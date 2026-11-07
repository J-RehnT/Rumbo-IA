export class ErrorApi extends Error {
  constructor(
    public status: number,
    public codigo: string,
    mensaje: string,
    public detalles?: unknown,
  ) {
    super(mensaje);
  }
}

export const noEncontrado = (que: string) => new ErrorApi(404, 'no_encontrado', `${que} no existe`);
