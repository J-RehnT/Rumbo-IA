import { Heart } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { color, fuente, radio } from '../theme';
import { Boton } from './Boton';

/** Derivación amable a Bienestar. Mantiene el tono cálido para destacar sin alarmar. */
export function TarjetaApoyo({ onAgendar, onDescartar }: { onAgendar: () => void; onDescartar: () => void }) {
  return (
    <View style={s.tarjeta} accessibilityRole="summary">
      <View style={s.fila}>
        <View style={s.icono}>
          <Heart size={20} color={color.apoyo.accion} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.titulo}>Han sido semanas pesadas</Text>
          <Text style={s.cuerpo}>
            Dormir poco y cargar tanto le pasa a muchos. Hablar con alguien de Bienestar puede ayudarte. Es gratis y
            confidencial.
          </Text>
        </View>
      </View>
      <View style={s.acciones}>
        <Boton etiqueta="Agendar cita" estilo="apoyo" onPress={onAgendar} style={{ flex: 1 }} />
        <Boton etiqueta="Ahora no" estilo="texto" colorTexto={color.apoyo.texto} onPress={onDescartar} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  tarjeta: { backgroundColor: color.apoyo.fondo, borderRadius: radio.xl, padding: 18, gap: 14 },
  fila: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  icono: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color.fondo.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontFamily: fuente.titulo, fontSize: 17, color: color.apoyo.texto },
  cuerpo: { fontFamily: fuente.cuerpo, fontSize: 14, lineHeight: 21, color: color.apoyo.texto },
  acciones: { flexDirection: 'row', gap: 8, alignItems: 'center' },
});
