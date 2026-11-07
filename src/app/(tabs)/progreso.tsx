import { TrendingUp } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { TarjetaApoyo } from '../../components/TarjetaApoyo';
import { useEstudiante } from '../../state/estudiante';
import { color, fuente, radio } from '../../theme';

// Últimas 6 semanas (0–1). Datos de demo hasta conectar el backend.
const ACIERTOS = [0.78, 0.74, 0.69, 0.61, 0.55, 0.48];
const BIENESTAR = [0.8, 0.8, 0.7, 0.6, 0.5, 0.4];
const TEMAS = [
  { tema: 'Integrales por partes', valor: '48% · bajando', sube: false },
  { tema: 'Ley de Gauss', valor: '61% · estable', sube: false },
  { tema: 'Árboles binarios', valor: '82% · subiendo', sube: true },
];

function Grafico({ ancho }: { ancho: number }) {
  const alto = 140;
  const puntos = (v: number[]) => v.map((y, i) => `${4 + (i * (ancho - 8)) / (v.length - 1)},${8 + (1 - y) * (alto - 16)}`).join(' ');
  const ultimo = (v: number[]) => ({ x: ancho - 4, y: 8 + (1 - v[v.length - 1]) * (alto - 16) });
  return (
    <Svg width={ancho} height={alto} accessibilityLabel="Aciertos bajan de 78% a 48% y bienestar baja en seis semanas">
      {[0.15, 0.5, 0.85].map((f) => (
        <Line key={f} x1={0} x2={ancho} y1={alto * f} y2={alto * f} stroke={color.dato.pista} strokeWidth={1} />
      ))}
      <Polyline points={puntos(ACIERTOS)} fill="none" stroke={color.dato.aciertos} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points={puntos(BIENESTAR)} fill="none" stroke={color.dato.bienestar} strokeWidth={3} strokeDasharray="2 6" strokeLinecap="round" />
      <Circle cx={ultimo(ACIERTOS).x} cy={ultimo(ACIERTOS).y} r={4} fill={color.dato.aciertos} />
      <Circle cx={ultimo(BIENESTAR).x} cy={ultimo(BIENESTAR).y} r={4} fill={color.dato.bienestar} />
    </Svg>
  );
}

export default function Progreso() {
  const { sugerirApoyo } = useEstudiante();
  const [descartado, setDescartado] = useState(false);
  const [ancho, setAncho] = useState(0);

  return (
    <SafeAreaView style={s.pantalla} edges={['top']}>
      <ScrollView contentContainerStyle={s.contenido}>
        <View>
          <Text style={s.contexto}>Últimas 6 semanas</Text>
          <Text style={s.titulo}>Mi progreso</Text>
        </View>

        <View style={s.tarjeta}>
          <View style={s.leyenda}>
            <View style={s.leyendaItem}>
              <View style={[s.muestra, { backgroundColor: color.dato.aciertos }]} />
              <Text style={s.leyendaTexto}>Aciertos</Text>
            </View>
            <View style={s.leyendaItem}>
              <View style={[s.muestra, s.muestraPunteada]} />
              <Text style={s.leyendaTexto}>Bienestar</Text>
            </View>
          </View>
          <View onLayout={(e) => setAncho(e.nativeEvent.layout.width)}>{ancho > 0 && <Grafico ancho={ancho} />}</View>
          <View style={s.semanas}>
            {['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].map((w) => (
              <Text key={w} style={s.semana}>
                {w}
              </Text>
            ))}
          </View>
        </View>

        {sugerirApoyo && !descartado && (
          <TarjetaApoyo
            onAgendar={() => Alert.alert('Bienestar', 'Aquí abriremos la agenda de Bienestar de tu universidad.')}
            onDescartar={() => setDescartado(true)}
          />
        )}

        <Text style={s.subtitulo}>Por tema</Text>
        <View style={s.lista}>
          {TEMAS.map((t, i) => (
            <View key={t.tema} style={[s.fila, i < TEMAS.length - 1 && s.filaBorde]}>
              <Text style={s.tema}>{t.tema}</Text>
              <View style={s.valorFila}>
                {t.sube && <TrendingUp size={16} color={color.texto.acento} />}
                <Text style={[s.valor, t.sube && { color: color.texto.acento }]}>{t.valor}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.fondo.base },
  contenido: { padding: 20, gap: 16, paddingBottom: 32 },
  contexto: { fontFamily: fuente.cuerpo, fontSize: 13, color: color.texto.secundario },
  titulo: { fontFamily: fuente.titulo, fontSize: 26, color: color.texto.principal },
  tarjeta: {
    gap: 10,
    padding: 16,
    borderRadius: radio.xl,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    backgroundColor: color.fondo.superficie,
  },
  leyenda: { flexDirection: 'row', gap: 16 },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  muestra: { width: 16, height: 3, borderRadius: 2 },
  muestraPunteada: { height: 0, borderTopWidth: 3, borderStyle: 'dotted', borderColor: color.dato.bienestar },
  leyendaTexto: { fontFamily: fuente.cuerpo, fontSize: 13, color: color.texto.secundario },
  semanas: { flexDirection: 'row', justifyContent: 'space-between' },
  semana: { fontFamily: fuente.cuerpo, fontSize: 11, color: color.texto.secundario },
  subtitulo: { fontFamily: fuente.titulo, fontSize: 18, color: color.texto.principal, marginTop: 4 },
  lista: {
    paddingHorizontal: 16,
    borderRadius: radio.lg,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    backgroundColor: color.fondo.superficie,
  },
  fila: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filaBorde: { borderBottomWidth: 1, borderBottomColor: color.borde.sutil },
  tema: { fontFamily: fuente.cuerpo, fontSize: 15, color: color.texto.principal },
  valorFila: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  valor: { fontFamily: fuente.cuerpo, fontSize: 13, color: color.texto.secundario },
});
