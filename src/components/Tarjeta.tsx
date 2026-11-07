import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { color, radio } from '../theme';

export function Tarjeta({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.tarjeta, style]}>{children}</View>;
}

const s = StyleSheet.create({
  tarjeta: {
    backgroundColor: color.fondo.superficie,
    borderRadius: radio.xl,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    padding: 16,
  },
});
