import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Lightbulb, Send, X } from 'lucide-react-native';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mensajeDeError } from '../../lib/api';
import { cuando } from '../../lib/fechas';
import { preguntarTutor, type Mensaje, type Preparacion } from '../../lib/tutor';
import { useEstudiante } from '../../state/estudiante';
import { color, fuente, radio } from '../../theme';

const RAPIDAS = ['Más simple', 'Otro ejemplo', 'Siguiente paso'];
const RAPIDAS_PREPARAME = ['Otro ejercicio', 'Ver solución', 'Más difícil', 'Más fácil'];

type SesionPreparame = { preparacion: Preparacion; curso: string };

export default function Tutor() {
  const { perfil, cursos } = useEstudiante();
  const params = useLocalSearchParams<{ pregunta?: string; preparar?: string; tipo?: string; dias?: string; curso?: string; t?: string }>();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const [sesion, setSesion] = useState<SesionPreparame | null>(null);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);

  const saludo = sesion
    ? `Modo Prepárame: vamos a entrenar para «${sesion.preparacion.titulo}» de ${sesion.curso} con ejercicios tipo examen. Intenta cada uno antes de pedir la solución.`
    : `¡Hola, ${perfil.nombre.split(' ')[0]}! Soy tu tutor de Rumbo. ¿Con qué tema${cursos[0] ? ` de ${cursos[0].nombre}` : ''} quieres empezar?`;

  const enviar = async (t: string, opciones: { reiniciar?: boolean; sesion?: SesionPreparame | null } = {}) => {
    const limpio = t.trim();
    if (!limpio || pensando) return;
    const actual = opciones.sesion !== undefined ? opciones.sesion : sesion;
    const base = opciones.reiniciar ? [] : mensajes;
    const nuevos: Mensaje[] = [...base, { id: String(Date.now()), autor: 'estudiante', texto: limpio }];
    setMensajes(nuevos);
    setTexto('');
    setPensando(true);
    try {
      // En Prepárame manda el curso de la evaluación; si no, el curso que se mencione en la conversación.
      const curso = actual
        ? cursos.find((c) => c.nombre === actual.curso)
        : cursos.find((c) => nuevos.some((m) => m.texto.toLowerCase().includes(c.nombre.toLowerCase())));
      const r = await preguntarTutor(nuevos.slice(-40), {
        ciclo: perfil.ciclo,
        carrera: perfil.carrera,
        curso: curso ?? cursos[0],
        preparacion: actual?.preparacion,
      });
      setMensajes((m) => [...m, { id: `${Date.now()}t`, autor: 'tutor', texto: r }]);
    } catch (e) {
      setMensajes((m) => [...m, { id: `${Date.now()}e`, autor: 'tutor', texto: mensajeDeError(e) }]);
    } finally {
      setPensando(false);
    }
  };

  // Llega una pregunta desde Inicio o Notificaciones.
  useEffect(() => {
    if (params.pregunta) enviar(params.pregunta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.pregunta]);

  // Llega "Prepárame" desde la Agenda o Inicio: empieza una sesión nueva de entrenamiento.
  useEffect(() => {
    if (!params.preparar || !params.curso) return;
    const nueva: SesionPreparame = {
      curso: params.curso,
      preparacion: {
        titulo: params.preparar,
        tipo: (params.tipo as Preparacion['tipo']) ?? 'parcial',
        diasRestantes: Number(params.dias ?? 0),
      },
    };
    setSesion(nueva);
    enviar(`Prepárame para «${nueva.preparacion.titulo}» de ${nueva.curso}. Faltan ${nueva.preparacion.diasRestantes} día(s).`, {
      reiniciar: true,
      sesion: nueva,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.t]);

  const salirDePreparame = () => {
    setSesion(null);
    setMensajes([]);
  };

  return (
    <SafeAreaView style={s.pantalla} edges={['top']}>
      <View style={s.cabecera}>
        <View style={s.cabeceraFila}>
          <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={() => router.navigate('/inicio')} style={s.atras}>
            <ChevronLeft size={22} color={color.texto.principal} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.tema} numberOfLines={1}>
              {sesion ? `Prepárame · ${sesion.preparacion.titulo}` : 'Tu tutor'}
            </Text>
            <Text style={s.nivel} numberOfLines={1}>
              {sesion
                ? `${sesion.curso} · ${cuando(sesion.preparacion.diasRestantes)}`
                : `${perfil.ciclo}.º ciclo · ${perfil.carrera || 'tu carrera'}`}
            </Text>
          </View>
          {sesion ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Salir de Prepárame" onPress={salirDePreparame} style={s.pista}>
              <X size={20} color={color.texto.acento} />
            </Pressable>
          ) : (
            <Pressable accessibilityRole="button" accessibilityLabel="Pista" onPress={() => enviar('Dame una pista')} style={s.pista}>
              <Lightbulb size={20} color={color.texto.acento} />
            </Pressable>
          )}
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={s.chat} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
          <Burbuja m={{ id: 'saludo', autor: 'tutor', texto: saludo }} />
          {mensajes.map((m) => (
            <Burbuja key={m.id} m={m} />
          ))}
          {pensando && <ActivityIndicator color={color.accion.primaria} style={{ alignSelf: 'flex-start', marginLeft: 8 }} />}
        </ScrollView>

        <View style={s.pie}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {(sesion ? RAPIDAS_PREPARAME : RAPIDAS).map((r) => (
              <Pressable key={r} accessibilityRole="button" onPress={() => enviar(r)} style={s.rapida}>
                <Text style={s.rapidaTexto}>{r}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={s.entrada}>
            <TextInput
              value={texto}
              onChangeText={setTexto}
              onSubmitEditing={() => enviar(texto)}
              placeholder="Escribe tu duda…"
              placeholderTextColor={color.texto.secundario}
              returnKeyType="send"
              style={s.input}
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Enviar" onPress={() => enviar(texto)} style={s.enviar}>
              <Send size={20} color={color.texto.invertido} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
function Burbuja({ m }: { m: Mensaje }) {
  const propia = m.autor === 'estudiante';
  return (
    <View style={[s.burbuja, propia ? s.burbujaPropia : s.burbujaTutor]}>
      <Text style={[s.burbujaTexto, propia && { color: color.texto.invertido }]}>{m.texto}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.fondo.base },
  cabecera: {
    backgroundColor: color.fondo.superficie,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: color.borde.sutil,
  },
  cabeceraFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  atras: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  tema: { fontFamily: fuente.titulo, fontSize: 17, color: color.texto.principal },
  nivel: { fontFamily: fuente.cuerpo, fontSize: 13, color: color.texto.secundario },
  pista: {
    width: 44,
    height: 44,
    borderRadius: radio.full,
    backgroundColor: color.fondo.suave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progresoFila: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  segmento: { flex: 1, height: 6, borderRadius: 3, backgroundColor: color.dato.pista },
  segmentoLleno: { backgroundColor: color.accion.primaria },
  paso: { marginLeft: 6, fontFamily: fuente.cuerpo, fontSize: 13, color: color.texto.secundario },
  chat: { padding: 16, gap: 12 },
  burbuja: { maxWidth: '86%', padding: 14, borderRadius: 18, gap: 12 },
  burbujaPropia: { alignSelf: 'flex-end', backgroundColor: color.accion.primaria, borderBottomRightRadius: 6 },
  burbujaTutor: {
    alignSelf: 'flex-start',
    backgroundColor: color.fondo.superficie,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    borderBottomLeftRadius: 6,
  },
  burbujaTexto: { fontFamily: fuente.cuerpo, fontSize: 15, lineHeight: 22, color: color.texto.principal },
  regla: { backgroundColor: color.accion.suave, borderRadius: radio.md, paddingVertical: 12, alignItems: 'center' },
  reglaTexto: { fontFamily: fuente.titulo, fontSize: 17, letterSpacing: 3, color: color.accion.suaveTexto },
  reglaNota: { fontFamily: fuente.cuerpo, fontSize: 13, lineHeight: 19, color: color.texto.secundario },
  ejercicio: {
    gap: 10,
    padding: 16,
    borderRadius: radio.xl,
    borderWidth: 1.5,
    borderColor: color.borde.acento,
    backgroundColor: color.fondo.superficie,
  },
  ejercicioFila: { flexDirection: 'row', justifyContent: 'space-between' },
  pruebalo: { fontFamily: fuente.cuerpoFuerte, fontSize: 12, letterSpacing: 1, color: color.texto.acento },
  contador: { fontFamily: fuente.cuerpo, fontSize: 13, color: color.texto.secundario },
  enunciado: { fontFamily: fuente.cuerpoFuerte, fontSize: 15, color: color.texto.principal },
  opcion: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderRadius: radio.md,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    backgroundColor: color.fondo.superficie,
  },
  opcionBien: { backgroundColor: color.accion.suave, borderColor: color.accion.primaria, borderWidth: 1.5 },
  opcionMal: { backgroundColor: color.apoyo.fondo, borderColor: color.apoyo.accion, borderWidth: 1.5 },
  opcionTexto: { fontFamily: fuente.cuerpo, fontSize: 15, color: color.texto.principal },
  feedback: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  feedbackTexto: { flex: 1, fontFamily: fuente.cuerpo, fontSize: 13, color: color.texto.acento },
  pie: {
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: color.fondo.superficie,
    borderTopWidth: 1,
    borderTopColor: color.borde.sutil,
  },
  rapida: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: radio.full,
    borderWidth: 1,
    borderColor: color.borde.acento,
    justifyContent: 'center',
  },
  rapidaTexto: { fontFamily: fuente.cuerpoFuerte, fontSize: 13, color: color.texto.acento },
  entrada: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    backgroundColor: color.fondo.base,
    fontFamily: fuente.cuerpo,
    fontSize: 15,
    color: color.texto.principal,
  },
  enviar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: color.accion.primaria,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
