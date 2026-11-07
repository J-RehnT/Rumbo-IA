import { StyleSheet, Text } from 'react-native';
import { color, fuente } from '../theme';

/** Mensaje de error de un formulario (en el tono cálido del diseño, no rojo alarmante). */
export function Aviso({ texto }: { texto?: string | null }) {
  if (!texto) return null;
  return (
    <Text accessibilityRole="alert" style={s.texto}>
      {texto}
    </Text>
  );
}

const s = StyleSheet.create({
  texto: { fontFamily: fuente.cuerpoMedio, fontSize: 13, lineHeight: 18, color: color.apoyo.accion },
});
