import { router, useLocalSearchParams } from 'expo-router';
import { Check, ChevronLeft, Lightbulb, Send, Sparkles } from 'lucide-react-native';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { preguntarTutor, type Mensaje } from '../../lib/tutor';
import { useEstudiante } from '../../state/estudiante';
import { color, fuente, radio } from '../../theme';

const OPCIONES = ['u = ln(x)', 'u = x'];
const RAPIDAS = ['Más simple', 'Otro ejemplo', 'Siguiente paso'];

export default function Tutor() {
  const { perfil, cursos } = useEstudiante();
  const { pregunta } = useLocalSearchParams<{ pregunta?: string }>();
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { id: 'm1', autor: 'estudiante', texto: 'No entiendo cuándo elegir u y cuándo dv' },
  ]);
  const [eleccion, setEleccion] = useState<number | null>(0);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);

  const enviar = async (t: string) => {
    const limpio = t.trim();
    if (!limpio || pensando) return;
    const nuevos: Mensaje[] = [...mensajes, { id: String(Date.now()), autor: 'estudiante', texto: limpio }];
    setMensajes(nuevos);
    setTexto('');
    setPensando(true);
    try {
      const r = await preguntarTutor(nuevos, { ciclo: perfil.ciclo, carrera: perfil.carrera, curso: cursos[0] });
      setMensajes((m) => [...m, { id: `${Date.now()}t`, autor: 'tutor', texto: r }]);
    } catch {
      setMensajes((m) => [...m, { id: `${Date.now()}e`, autor: 'tutor', texto: 'No pude responder ahora. Intenta de nuevo en un momento.' }]);
    } finally {
      setPensando(false);
    }
  };

  // Llega una pregunta desde Inicio.
  useEffect(() => {
    if (pregunta) enviar(pregunta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pregunta]);

  return (
    <SafeAreaView style={s.pantalla} edges={['top']}>
      <View style={s.cabecera}>
        <View style={s.cabeceraFila}>
          <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={() => router.navigate('/inicio')} style={s.atras}>
            <ChevronLeft size={22} color={color.texto.principal} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.tema}>Integrales por partes</Text>
            <Text style={s.nivel}>
              {cursos[0]?.nombre ?? 'Cálculo II'} · nivel {perfil.ciclo}.º ciclo
            </Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Pista" onPress={() => enviar('Dame una pista')} style={s.pista}>
            <Lightbulb size={20} color={color.texto.acento} />
          </Pressable>
        </View>
        <View style={s.progresoFila}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[s.segmento, i < 2 && s.segmentoLleno]} />
          ))}
          <Text style={s.paso}>Paso 2 de 4</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={s.chat} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
          <Burbuja m={mensajes[0]} />

          <View style={[s.burbuja, s.burbujaTutor]}>
            <Text style={s.burbujaTexto}>Tranqui, es la duda más común. Usa esta regla para elegir u:</Text>
            <View style={s.regla}>
              <Text style={s.reglaTexto}>L · I · A · T · E</Text>
            </View>
            <Text style={s.reglaNota}>
              Logarítmica, Inversa trig., Algebraica, Trigonométrica, Exponencial. La que aparece primero es tu u.
            </Text>
          </View>

          <View style={s.ejercicio}>
            <View style={s.ejercicioFila}>
              <Text style={s.pruebalo}>PRUÉBALO</Text>
              <Text style={s.contador}>1 de 3</Text>
            </View>
            <Text style={s.enunciado}>En ∫ x·ln(x) dx, ¿qué eliges como u?</Text>
            {OPCIONES.map((o, i) => {
              const activo = eleccion === i;
              return (
                <Pressable
                  key={o}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activo }}
                  onPress={() => setEleccion(i)}
                  style={[s.opcion, activo && (i === 0 ? s.opcionBien : s.opcionMal)]}
                >
                  <Text style={[s.opcionTexto, activo && { fontFamily: fuente.cuerpoFuerte }]}>{o}</Text>
                  {activo && i === 0 && <Check size={20} color={color.accion.primaria} />}
                </Pressable>
              );
            })}
            {eleccion !== null && (
              <View style={s.feedback}>
                <Sparkles size={16} color={color.texto.acento} />
                <Text style={s.feedbackTexto}>
                  {eleccion === 0 ? '¡Bien! L va antes que A en LIATE.' : 'Casi. Mira LIATE: la L (ln) va antes que la A (x).'}
                </Text>
              </View>
            )}
          </View>

          {mensajes.slice(1).map((m) => (
            <Burbuja key={m.id} m={m} />
          ))}
          {pensando && <ActivityIndicator color={color.accion.primaria} style={{ alignSelf: 'flex-start', marginLeft: 8 }} />}
        </ScrollView>

        <View style={s.pie}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {RAPIDAS.map((r) => (
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
