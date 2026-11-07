import { View } from 'react-native';
import { color } from '../theme';

export function BarraAvance({
  valor,
  alto = 6,
  relleno = color.accion.primaria,
  pista = color.dato.pista,
}: {
  valor: number;
  alto?: number;
  relleno?: string;
  pista?: string;
}) {
  return (
    <View style={{ height: alto, borderRadius: alto / 2, backgroundColor: pista, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, valor))}%`, height: '100%', borderRadius: alto / 2, backgroundColor: relleno }} />
    </View>
  );
}
