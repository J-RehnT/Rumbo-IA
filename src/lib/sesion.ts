import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CLAVE = 'rumbo.token';

/** Guarda el token de sesión: SecureStore en el celular, localStorage en la web. */
export async function leerToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(CLAVE) ?? null;
    return await SecureStore.getItemAsync(CLAVE);
  } catch {
    return null;
  }
}

export async function guardarToken(token: string): Promise<void> {
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(CLAVE, token);
    else await SecureStore.setItemAsync(CLAVE, token);
  } catch {
    // Sin almacenamiento seguro la sesión dura mientras la app esté abierta.
  }
}

export async function borrarToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.removeItem(CLAVE);
    else await SecureStore.deleteItemAsync(CLAVE);
  } catch {
    // Nada que borrar.
  }
}
