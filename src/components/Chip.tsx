import { Pressable, StyleSheet, Text } from 'react-native';
import { color, fuente, radio } from '../theme';

export function Chip({ etiqueta, activo, onPress }: { etiqueta: string; activo?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      style={[s.chip, activo && s.activo]}
    >
      <Text style={[s.texto, activo && { color: color.texto.invertido }]}>{etiqueta}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: radio.full,
    borderWidth: 1,
    borderColor: color.borde.acento,
    backgroundColor: color.fondo.superficie,
    justifyContent: 'center',
  },
  activo: { backgroundColor: color.accion.primaria, borderColor: color.accion.primaria },
  texto: { fontFamily: fuente.cuerpoFuerte, fontSize: 13, color: color.texto.acento },
});
