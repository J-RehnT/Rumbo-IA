import { router } from 'expo-router';
import { Annoyed, Frown, Laugh, Layers, Meh, Moon, Smile, X, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boton } from '../components/Boton';
import { Tarjeta } from '../components/Tarjeta';
import { useEstudiante, type Animo, type Carga } from '../state/estudiante';
import { color, fuente, radio } from '../theme';

const ANIMOS: { etiqueta: string; Icono: LucideIcon }[] = [
  { etiqueta: 'Agotado', Icono: Frown },
  { etiqueta: 'Bajón', Icono: Annoyed },
  { etiqueta: 'Normal', Icono: Meh },
  { etiqueta: 'Bien', Icono: Smile },
  { etiqueta: 'Genial', Icono: Laugh },
];
const CARGAS: { valor: Carga; etiqueta: string }[] = [
  { valor: 'ligera', etiqueta: 'Ligera' },
  { valor: 'normal', etiqueta: 'Normal' },
  { valor: 'pesada', etiqueta: 'Pesada' },
];
const MAX_SUENO = 12;

export default function CheckIn() {
  const { registrarCheckIn } = useEstudiante();
  const [animo, setAnimo] = useState<Animo>(1);
  const [sueno, setSueno] = useState(5);
  const [carga, setCarga] = useState<Carga>('pesada');
  const [anchoPista, setAnchoPista] = useState(1);

  const moverSueno = (x: number) => setSueno(Math.round(Math.max(0, Math.min(1, x / anchoPista)) * MAX_SUENO));

  return (
    <SafeAreaView style={s.pantalla}>
      <ScrollView contentContainerStyle={s.contenido}>
        <View style={s.cabecera}>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={() => router.back()} style={s.cerrar}>
            <X size={22} color={color.texto.principal} />
          </Pressable>
          <Text style={s.privado}>Solo lo ves tú</Text>
        </View>

        <View style={{ gap: 6 }}>
          <Text style={s.titulo}>¿Cómo llegas hoy?</Text>
          <Text style={s.bajada}>Tres toques y listo. Nos ayuda a ajustar el ritmo de tus repasos.</Text>
        </View>

        <Tarjeta style={s.bloque}>
          <View style={s.rotulo}>
            <View style={s.iconoRotulo}>
              <Smile size={16} color={color.texto.acento} />
            </View>
            <Text style={s.rotuloTexto}>Tu ánimo</Text>
          </View>
          <View style={s.animos}>
            {ANIMOS.map(({ etiqueta, Icono }, i) => {
              const activo = i === animo;
              return (
                <Pressable
                  key={etiqueta}
                  accessibilityRole="button"
                  accessibilityLabel={etiqueta}
                  accessibilityState={{ selected: activo }}
                  onPress={() => setAnimo(i as Animo)}
                  style={[s.animo, activo && s.animoActivo]}
                >
                  <Icono size={26} color={activo ? color.accion.suaveTexto : color.texto.secundario} />
                  <Text style={[s.animoTexto, activo && { color: color.accion.suaveTexto, fontFamily: fuente.cuerpoFuerte }]}>
                    {etiqueta}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Tarjeta>

        <Tarjeta style={s.bloque}>
          <View style={[s.rotulo, { justifyContent: 'space-between' }]}>
            <View style={s.rotulo}>
              <View style={s.iconoRotulo}>
                <Moon size={16} color={color.texto.acento} />
              </View>
              <Text style={s.rotuloTexto}>Horas de sueño anoche</Text>
            </View>
            <Text style={s.valor}>{sueno} h</Text>
          </View>
          <View
            style={s.deslizador}
            onLayout={(e) => setAnchoPista(e.nativeEvent.layout.width)}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(e) => moverSueno(e.nativeEvent.locationX)}
            onResponderMove={(e) => moverSueno(e.nativeEvent.locationX)}
            accessibilityRole="adjustable"
            accessibilityLabel="Horas de sueño"
            accessibilityValue={{ min: 0, max: MAX_SUENO, now: sueno }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={(e) =>
              setSueno((v) => Math.max(0, Math.min(MAX_SUENO, v + (e.nativeEvent.actionName === 'increment' ? 1 : -1))))
            }
          >
            <View style={s.pista} pointerEvents="none">
              <View style={[s.relleno, { width: `${(sueno / MAX_SUENO) * 100}%` }]} />
            </View>
            <View pointerEvents="none" style={[s.perilla, { left: (sueno / MAX_SUENO) * anchoPista - 12 }]} />
          </View>
          <View style={s.extremos}>
            <Text style={s.extremo}>0 h</Text>
            <Text style={s.extremo}>12 h</Text>
          </View>
        </Tarjeta>

        <Tarjeta style={s.bloque}>
          <View style={s.rotulo}>
            <View style={s.iconoRotulo}>
              <Layers size={16} color={color.texto.acento} />
            </View>
            <Text style={s.rotuloTexto}>Tu carga esta semana</Text>
          </View>
          <View style={s.cargas}>
            {CARGAS.map((c) => {
              const activo = c.valor === carga;
              return (
                <Pressable
                  key={c.valor}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activo }}
                  onPress={() => setCarga(c.valor)}
                  style={[s.carga, activo && s.cargaActiva]}
                >
                  <Text style={[s.cargaTexto, activo && { color: color.accion.suaveTexto, fontFamily: fuente.cuerpoFuerte }]}>
                    {c.etiqueta}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Tarjeta>
      </ScrollView>

      <View style={s.pie}>
        <Boton
          etiqueta="Listo"
          onPress={() => {
            registrarCheckIn({ animo, horasSueno: sueno, carga });
            router.back();
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.fondo.base },
  contenido: { padding: 20, gap: 20 },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cerrar: { width: 44, height: 44, marginLeft: -10, alignItems: 'center', justifyContent: 'center' },
  privado: { fontFamily: fuente.cuerpo, fontSize: 13, color: color.texto.secundario },
  titulo: { fontFamily: fuente.titulo, fontSize: 26, lineHeight: 31, color: color.texto.principal },
  bajada: { fontFamily: fuente.cuerpo, fontSize: 15, lineHeight: 22, color: color.texto.secundario },
  bloque: { gap: 14, padding: 18 },
  rotulo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconoRotulo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: color.fondo.suave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotuloTexto: { fontFamily: fuente.cuerpoFuerte, fontSize: 15, color: color.texto.principal },
  animos: { flexDirection: 'row', gap: 6 },
  animo: {
    flex: 1,
    minHeight: 72,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    backgroundColor: color.fondo.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  animoActivo: { backgroundColor: color.accion.suave, borderColor: color.accion.primaria, borderWidth: 1.5 },
  animoTexto: { fontFamily: fuente.cuerpo, fontSize: 11, color: color.texto.secundario },
  valor: { fontFamily: fuente.titulo, fontSize: 20, color: color.texto.acento },
  deslizador: { height: 32, justifyContent: 'center' },
  pista: { height: 8, borderRadius: 4, backgroundColor: color.dato.pista, overflow: 'hidden' },
  relleno: { height: '100%', backgroundColor: color.accion.primaria },
  perilla: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: color.fondo.superficie,
    borderWidth: 3,
    borderColor: color.accion.primaria,
  },
  extremos: { flexDirection: 'row', justifyContent: 'space-between' },
  extremo: { fontFamily: fuente.cuerpo, fontSize: 12, color: color.texto.secundario },
  cargas: { flexDirection: 'row', gap: 8 },
  carga: {
    flex: 1,
    minHeight: 48,
    borderRadius: radio.full,
    borderWidth: 1,
    borderColor: color.borde.acento,
    backgroundColor: color.fondo.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cargaActiva: { backgroundColor: color.accion.suave, borderColor: color.accion.primaria, borderWidth: 1.5 },
  cargaTexto: { fontFamily: fuente.cuerpoMedio, fontSize: 14, color: color.texto.acento },
  pie: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 },
});
