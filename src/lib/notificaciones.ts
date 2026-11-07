import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Notificaciones del celular (las que suenan). El servidor (IA) arma el plan y la app lo programa
 * aquí como notificaciones locales: suenan a su hora aunque la app esté cerrada.
 * Funcionan en Expo Go; las push remotas necesitarían un build de desarrollo.
 */
const CANAL = 'recordatorios';
const disponible = Platform.OS === 'ios' || Platform.OS === 'android';

if (disponible) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export type NotificacionProgramable = { id: string; titulo: string; texto: string; programadaPara: string; cursoId: string | null };

/** Pide permiso (una vez) y crea el canal de Android. Devuelve si quedó permitido. */
export async function activarNotificaciones(): Promise<boolean> {
  if (!disponible) return false;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CANAL, {
        name: 'Recordatorios de estudio',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 200, 250],
      });
    }
    const actual = await Notifications.getPermissionsAsync();
    if (actual.granted) return true;
    if (!actual.canAskAgain) return false;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

export async function notificacionesPermitidas(): Promise<boolean> {
  if (!disponible) return false;
  try {
    return (await Notifications.getPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

/** Reemplaza lo programado en el celular por el plan actual. Devuelve cuántas quedaron programadas. */
export async function programarEnCelular(lista: NotificacionProgramable[]): Promise<number> {
  if (!disponible || !(await notificacionesPermitidas())) return 0;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    // iOS admite hasta 64 programadas; nos quedamos con las 30 más próximas.
    const futuras = lista
      .filter((n) => Date.parse(n.programadaPara) > Date.now() + 5_000)
      .sort((a, b) => Date.parse(a.programadaPara) - Date.parse(b.programadaPara))
      .slice(0, 30);
    for (const n of futuras) {
      await Notifications.scheduleNotificationAsync({
        identifier: n.id,
        content: { title: n.titulo, body: n.texto, sound: 'default', data: { id: n.id, cursoId: n.cursoId } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(n.programadaPara), channelId: CANAL },
      });
    }
    return futuras.length;
  } catch {
    return 0;
  }
}

/** Avisa cuando el estudiante toca una notificación (para abrir la pantalla correspondiente). */
export function alTocarNotificacion(f: () => void): () => void {
  if (!disponible) return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener(() => f());
  return () => sub.remove();
}

/** Prueba inmediata: suena en 5 segundos. */
export async function probarNotificacion(): Promise<boolean> {
  if (!(await activarNotificaciones())) return false;
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Rumbo', body: 'Así sonarán los recordatorios de tu tutor.', sound: 'default' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: CANAL },
  });
  return true;
}
