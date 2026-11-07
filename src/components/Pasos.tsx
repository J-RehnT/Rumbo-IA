import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, fuente, radio } from '../theme';

/** Encabezado del registro: botón atrás + "Paso n de total" + barra segmentada. */
export function Pasos({ paso, total = 3 }: { paso: number; total?: number }) {
  return (
    <View style={s.fila}>
      <Pressable accessibilityRole="button" accessibilityLabel="Atrás" onPress={() => router.back()} style={s.atras}>
        <ChevronLeft size={20} color={color.texto.principal} />
      </Pressable>
      <View style={{ flex: 1, gap: 8 }}>
        <Text style={s.texto}>
          Paso {paso} de {total}
        </Text>
        <View style={s.barra}>
          {Array.from({ length: total }, (_, i) => (
            <View key={i} style={[s.segmento, i < paso && s.lleno]} />
          ))}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  atras: {
    width: 44,
    height: 44,
    borderRadius: radio.full,
    backgroundColor: color.fondo.suave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: { fontFamily: fuente.cuerpoMedio, fontSize: 13, color: color.texto.acento },
  barra: { flexDirection: 'row', gap: 6 },
  segmento: { flex: 1, height: 6, borderRadius: 3, backgroundColor: color.borde.sutil },
  lleno: { backgroundColor: color.accion.primaria },
});
