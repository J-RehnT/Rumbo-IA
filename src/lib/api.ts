/** Cliente HTTP de la API de Rumbo (server/). La URL sale de EXPO_PUBLIC_API_URL (.env). */

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

export class ErrorApi extends Error {
  constructor(
    public status: number,
    public codigo: string,
    mensaje: string,
    public detalles?: { campo: string; mensaje: string }[],
  ) {
    super(mensaje);
  }
}

let token: string | null = null;
let alExpirar: (() => void) | null = null;

export const fijarToken = (t: string | null) => {
  token = t;
};
/** Se llama cuando el servidor responde 401 con una sesión activa (token vencido o inválido). */
export const alSesionExpirada = (f: () => void) => {
  alExpirar = f;
};

export const apiConfigurada = () => BASE.length > 0;

export async function api<T>(metodo: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', ruta: string, cuerpo?: unknown): Promise<T> {
  if (!BASE) {
    throw new ErrorApi(0, 'sin_configurar', 'Falta EXPO_PUBLIC_API_URL en el archivo .env de la app (ejecuta "npm run ip").');
  }

  let res: Response;
  try {
    res = await fetch(BASE + ruta, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new ErrorApi(0, 'sin_conexion', 'No pude conectarme al servidor. Revisa que esté encendido y que estés en la misma red Wi-Fi.');
  }

  if (res.status === 204) return undefined as T;
  const datos = await res.json().catch(() => null);

  if (!res.ok) {
    const e = datos?.error;
    if (res.status === 401 && token && e?.codigo === 'no_autenticado') alExpirar?.();
    throw new ErrorApi(res.status, e?.codigo ?? 'error', e?.mensaje ?? `Error ${res.status}`, e?.detalles);
  }
  return datos as T;
}

/** Texto listo para mostrar al usuario a partir de cualquier error. */
export function mensajeDeError(e: unknown): string {
  if (e instanceof ErrorApi) {
    const campos = e.detalles?.map((d) => d.mensaje).join('. ');
    return campos ? `${e.message}: ${campos}` : e.message;
  }
  return 'Algo salió mal, intenta de nuevo.';
}
