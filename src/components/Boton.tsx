import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { color, fuente, radio } from '../theme';

type Estilo = 'primario' | 'secundario' | 'suave' | 'texto' | 'apoyo';

const fondo: Record<Estilo, string> = {
  primario: color.accion.primaria,
  secundario: color.fondo.superficie,
  suave: color.accion.suave,
  texto: 'transparent',
  apoyo: color.apoyo.accion,
};
const tinta: Record<Estilo, string> = {
  primario: color.accion.primariaTexto,
  secundario: color.texto.principal,
  suave: color.accion.suaveTexto,
  texto: color.texto.acento,
  apoyo: color.texto.invertido,
};

export function Boton({
  etiqueta,
  onPress,
  estilo = 'primario',
  icono,
  deshabilitado,
  colorTexto,
  style,
}: {
  etiqueta: string;
  onPress?: () => void;
  estilo?: Estilo;
  icono?: (c: string) => ReactNode;
  deshabilitado?: boolean;
  colorTexto?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={deshabilitado}
      style={({ pressed }) => [
        s.base,
        { backgroundColor: fondo[estilo], opacity: deshabilitado ? 0.45 : pressed ? 0.85 : 1 },
        estilo === 'secundario' && s.borde,
        style,
      ]}
    >
      <View style={s.fila}>
        <Text style={[s.texto, { color: colorTexto ?? tinta[estilo] }]}>{etiqueta}</Text>
        {icono?.(colorTexto ?? tinta[estilo])}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: { minHeight: 52, borderRadius: radio.full, paddingHorizontal: 24, justifyContent: 'center' },
  borde: { borderWidth: 1, borderColor: color.borde.sutil },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  texto: { fontFamily: fuente.tituloBold, fontSize: 16 },
});
