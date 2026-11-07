import { useFocusEffect } from 'expo-router';
import { TrendingUp } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { TarjetaApoyo } from '../../components/TarjetaApoyo';
import { api, mensajeDeError } from '../../lib/api';
import { color, fuente, radio } from '../../theme';

type Semana = { semana: string; aciertos: number | null; bienestar: number | null }; // 0–1 o null sin datos
type Progreso = {
  semanas: Semana[];
  cursos: { id: string; nombre: string; avance: number | null; evaluaciones: number }[];
  tarjetaApoyo: { mostrar: boolean };
};

function Grafico({ ancho, semanas }: { ancho: number; semanas: Semana[] }) {
  const alto = 140;
  const x = (i: number) => 4 + (i * (ancho - 8)) / Math.max(1, semanas.length - 1);
  const y = (v: number) => 8 + (1 - v) * (alto - 16);
  const serie = (k: 'aciertos' | 'bienestar') =>
    semanas.flatMap((s, i) => (s[k] === null ? [] : [{ x: x(i), y: y(s[k]) }]));
  const aciertos = serie('aciertos');
  const bienestar = serie('bienestar');
  const linea = (p: { x: number; y: number }[]) => p.map((q) => `${q.x},${q.y}`).join(' ');

  return (
    <Svg width={ancho} height={alto} accessibilityLabel="Aciertos y bienestar de las últimas seis semanas">
      {[0.15, 0.5, 0.85].map((f) => (
        <Line key={f} x1={0} x2={ancho} y1={alto * f} y2={alto * f} stroke={color.dato.pista} strokeWidth={1} />
      ))}
      {aciertos.length > 1 && (
        <Polyline points={linea(aciertos)} fill="none" stroke={color.dato.aciertos} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {bienestar.length > 1 && (
        <Polyline points={linea(bienestar)} fill="none" stroke={color.dato.bienestar} strokeWidth={3} strokeDasharray="2 6" strokeLinecap="round" />
      )}
      {aciertos.map((p, i) => (
        <Circle key={`a${i}`} cx={p.x} cy={p.y} r={i === aciertos.length - 1 ? 4 : 3} fill={color.dato.aciertos} />
      ))}
      {bienestar.map((p, i) => (
        <Circle key={`b${i}`} cx={p.x} cy={p.y} r={i === bienestar.length - 1 ? 4 : 3} fill={color.dato.bienestar} />
      ))}
    </Svg>
  );
}

export default function Progreso() {
  const [datos, setDatos] = useState<Progreso | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [descartado, setDescartado] = useState(false);
  const [ancho, setAncho] = useState(0);

  useFocusEffect(
    useCallback(() => {
      api<Progreso>('GET', '/progreso')
        .then((r) => {
          setDatos(r);
          setError(null);
        })
        .catch((e) => setError(mensajeDeError(e)));
    }, []),
  );

  const semanas = datos?.semanas ?? [];
  const hayDatos = semanas.some((w) => w.aciertos !== null || w.bienestar !== null);

  return (
    <SafeAreaView style={s.pantalla} edges={['top']}>
      <ScrollView contentContainerStyle={s.contenido}>
        <View>
          <Text style={s.contexto}>Últimas 6 semanas</Text>
          <Text style={s.titulo}>Mi progreso</Text>
        </View>

        {error && <Text style={s.vacio}>{error}</Text>}

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
          <View onLayout={(e) => setAncho(e.nativeEvent.layout.width)}>{ancho > 0 && <Grafico ancho={ancho} semanas={semanas} />}</View>
          <View style={s.semanas}>
            {['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].map((w) => (
              <Text key={w} style={s.semana}>
                {w}
              </Text>
            ))}
          </View>
          {datos && !hayDatos && (
            <Text style={s.vacio}>Aún no hay datos. Haz tu check-in diario y registra tus notas para ver tu evolución.</Text>
          )}
        </View>

        {datos?.tarjetaApoyo.mostrar && !descartado && (
          <TarjetaApoyo
            onAgendar={() => Alert.alert('Bienestar', 'Aquí abriremos la agenda de Bienestar de tu universidad.')}
            onDescartar={() => setDescartado(true)}
          />
        )}

        <Text style={s.subtitulo}>Por curso</Text>
        <View style={s.lista}>
          {(datos?.cursos ?? []).length === 0 && <Text style={[s.vacio, { paddingVertical: 14 }]}>Aún no tienes cursos.</Text>}
          {(datos?.cursos ?? []).map((c, i, todos) => {
            const sube = (c.avance ?? 0) >= 75;
            return (
              <View key={c.id} style={[s.fila, i < todos.length - 1 && s.filaBorde]}>
                <Text style={s.tema}>{c.nombre}</Text>
                <View style={s.valorFila}>
                  {sube && <TrendingUp size={16} color={color.texto.acento} />}
                  <Text style={[s.valor, sube && { color: color.texto.acento }]}>
                    {c.avance === null ? 'Sin notas aún' : `${c.avance}%`}
                  </Text>
                </View>
              </View>
            );
          })}
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
  vacio: { fontFamily: fuente.cuerpo, fontSize: 13, lineHeight: 18, color: color.texto.secundario },
  filaBorde: { borderBottomWidth: 1, borderBottomColor: color.borde.sutil },
  tema: { fontFamily: fuente.cuerpo, fontSize: 15, color: color.texto.principal },
  valorFila: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  valor: { fontFamily: fuente.cuerpo, fontSize: 13, color: color.texto.secundario },
});
