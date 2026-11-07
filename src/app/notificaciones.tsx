import { router, useFocusEffect } from 'expo-router';
import { Bell, BellRing, ChevronLeft, HeartHandshake, Lightbulb, MessageCircle, Sparkles, type LucideIcon } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Aviso } from '../components/Aviso';
import { Boton } from '../components/Boton';
import { mensajeDeError } from '../lib/api';
import { activarNotificaciones, notificacionesPermitidas, probarNotificacion } from '../lib/notificaciones';
import { useEstudiante, type AvisoTutor } from '../state/estudiante';
import { color, fuente, radio } from '../theme';

const CATEGORIA: Record<AvisoTutor['categoria'], { Icono: LucideIcon; etiqueta: string }> = {
  recordatorio: { Icono: Bell, etiqueta: 'Recordatorio' },
  metodo: { Icono: Lightbulb, etiqueta: 'Método de estudio' },
  bienestar: { Icono: HeartHandshake, etiqueta: 'Bienestar' },
};

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function momento(iso: string) {
  const d = new Date(iso);
  const hora = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]} · ${hora}`;
}

export default function Notificaciones() {
  const { avisos, actualizarAvisos, marcarAvisosLeidos } = useEstudiante();
  const [permitidas, setPermitidas] = useState<boolean | null>(null);
  const [pidiendo, setPidiendo] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      notificacionesPermitidas().then(setPermitidas);
      // Al abrir la bandeja, lo recibido queda como leído.
      marcarAvisosLeidos().catch(() => {});
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const recibidas = avisos.filter((a) => a.entregada).reverse();
  const programadas = avisos.filter((a) => !a.entregada);

  const pedirConsejos = async () => {
    setPidiendo(true);
    setError(null);
    setMensaje(null);
    try {
      const r = await actualizarAvisos(true);
      setMensaje(
        r.generadas === 0
          ? 'No hay evaluaciones en las próximas 2 semanas: agrega fechas en tu Agenda.'
          : `Tu tutor preparó ${r.generadas} avisos${r.programadas ? ` y ${r.programadas} sonarán en tu celular` : ''}.`,
      );
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setPidiendo(false);
    }
  };

  const activar = async () => {
    const ok = await activarNotificaciones();
    setPermitidas(ok);
    if (ok) await actualizarAvisos().catch(() => {});
    else Linking.openSettings();
  };

  return (
    <SafeAreaView style={s.pantalla}>
      <View style={s.cabecera}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={() => router.back()} style={s.atras}>
          <ChevronLeft size={22} color={color.texto.principal} />
        </Pressable>
        <Text style={s.titulo}>Notificaciones</Text>
      </View>

      <ScrollView contentContainerStyle={s.contenido}>
        {Platform.OS !== 'web' && permitidas === false && (
          <View style={s.permiso}>
            <BellRing size={22} color={color.apoyo.texto} />
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={s.permisoTitulo}>Activa los avisos en tu celular</Text>
              <Text style={s.permisoTexto}>Así tu tutor te avisa con sonido antes de cada examen, práctica o entrega.</Text>
              <Boton etiqueta="Activar avisos" estilo="apoyo" onPress={activar} />
            </View>
          </View>
        )}

        <View style={s.tutor}>
          <View style={s.tutorFila}>
            <Sparkles size={18} color={color.texto.heroSuave} />
            <Text style={s.tutorRotulo}>TU TUTOR TE ESCRIBE</Text>
          </View>
          <Text style={s.tutorTexto}>
            Según tu agenda, tus notas y tu ánimo, el tutor programa recordatorios y te sugiere métodos de estudio por curso.
          </Text>
          <Boton
            etiqueta={pidiendo ? 'El tutor está pensando…' : 'Pedir nuevos consejos'}
            estilo="suave"
            deshabilitado={pidiendo}
            onPress={pedirConsejos}
          />
          {Platform.OS !== 'web' && permitidas && (
            <Text style={s.prueba} onPress={() => probarNotificacion()} accessibilityRole="button">
              Probar sonido (en 5 segundos)
            </Text>
          )}
          {mensaje && <Text style={s.mensaje}>{mensaje}</Text>}
        </View>

        <Aviso texto={error} />

        <Text style={s.seccion}>Recibidas</Text>
        {recibidas.length === 0 && <Text style={s.vacio}>Aún no te llegan avisos. Mira abajo los que vienen.</Text>}
        {recibidas.map((a) => (
          <Tarjeta key={a.id} a={a} />
        ))}

        <Text style={s.seccion}>Programadas</Text>
        {programadas.length === 0 && <Text style={s.vacio}>No hay avisos programados. Pide nuevos consejos al tutor.</Text>}
        {programadas.map((a) => (
          <Tarjeta key={a.id} a={a} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Tarjeta({ a }: { a: AvisoTutor }) {
  const { Icono, etiqueta } = CATEGORIA[a.categoria];
  const practicar = () =>
    router.navigate({
      pathname: '/tutor',
      params: { pregunta: `Ayúdame con esto${a.curso ? ` en ${a.curso}` : ''}: ${a.titulo}. ${a.texto}` },
    });

  return (
    <View style={[s.tarjeta, !a.entregada && s.tarjetaProgramada, a.entregada && !a.leida && s.tarjetaNueva]}>
      <View style={s.tarjetaFila}>
        <View style={[s.icono, a.categoria === 'bienestar' && { backgroundColor: color.apoyo.fondo }]}>
          <Icono size={18} color={a.categoria === 'bienestar' ? color.apoyo.texto : color.texto.acento} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.meta}>
            {etiqueta}
            {a.curso ? ` · ${a.curso}` : ''}
          </Text>
          <Text style={s.tarjetaTitulo}>{a.titulo}</Text>
        </View>
      </View>
      <Text style={s.tarjetaTexto}>{a.texto}</Text>
      <View style={s.pie}>
        <Text style={s.cuando}>
          {a.entregada ? '' : 'Sonará el '}
          {momento(a.programadaPara)}
          {a.origen === 'ia' ? ' · Escrito por tu tutor IA' : ''}
        </Text>
        {a.categoria !== 'bienestar' && (
          <Pressable accessibilityRole="button" onPress={practicar} hitSlop={8} style={s.practicar}>
            <MessageCircle size={14} color={color.texto.acento} />
            <Text style={s.practicarTexto}>Practicar</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.fondo.base },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  atras: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: fuente.titulo, fontSize: 22, color: color.texto.principal },
  contenido: { padding: 20, paddingTop: 4, gap: 12, paddingBottom: 32 },
  permiso: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: radio.xl, backgroundColor: color.apoyo.fondo },
  permisoTitulo: { fontFamily: fuente.tituloBold, fontSize: 16, color: color.apoyo.texto },
  permisoTexto: { fontFamily: fuente.cuerpo, fontSize: 13, lineHeight: 18, color: color.apoyo.texto },
  tutor: { gap: 12, padding: 18, borderRadius: 24, backgroundColor: color.fondo.hero },
  tutorFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tutorRotulo: { fontFamily: fuente.cuerpoFuerte, fontSize: 12, letterSpacing: 1.2, color: color.texto.heroSuave },
  tutorTexto: { fontFamily: fuente.cuerpo, fontSize: 14, lineHeight: 20, color: color.texto.invertido },
  prueba: { fontFamily: fuente.cuerpoFuerte, fontSize: 13, color: color.texto.heroSuave, textAlign: 'center' },
  mensaje: { fontFamily: fuente.cuerpoMedio, fontSize: 13, lineHeight: 18, color: color.texto.heroSuave },
  seccion: { fontFamily: fuente.titulo, fontSize: 18, color: color.texto.principal, marginTop: 8 },
  vacio: { fontFamily: fuente.cuerpo, fontSize: 14, lineHeight: 20, color: color.texto.secundario },
  tarjeta: {
    gap: 8,
    padding: 14,
    borderRadius: radio.xl,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    backgroundColor: color.fondo.superficie,
  },
  tarjetaNueva: { borderColor: color.accion.primaria, borderWidth: 1.5 },
  tarjetaProgramada: { backgroundColor: color.fondo.base, borderStyle: 'dashed' },
  tarjetaFila: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icono: { width: 36, height: 36, borderRadius: radio.md, backgroundColor: color.fondo.suave, alignItems: 'center', justifyContent: 'center' },
  meta: { fontFamily: fuente.cuerpoMedio, fontSize: 12, color: color.texto.secundario },
  tarjetaTitulo: { fontFamily: fuente.tituloBold, fontSize: 15, color: color.texto.principal },
  tarjetaTexto: { fontFamily: fuente.cuerpo, fontSize: 14, lineHeight: 20, color: color.texto.principal },
  pie: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cuando: { flex: 1, fontFamily: fuente.cuerpo, fontSize: 12, color: color.texto.secundario },
  practicar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radio.full,
    backgroundColor: color.fondo.suave,
  },
  practicarTexto: { fontFamily: fuente.cuerpoFuerte, fontSize: 12, color: color.texto.acento },
});
