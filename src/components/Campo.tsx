import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { color, fuente, radio } from '../theme';

export function Campo({
  etiqueta,
  ayuda,
  derecha,
  ...input
}: TextInputProps & { etiqueta?: string; ayuda?: string; derecha?: ReactNode }) {
  const [foco, setFoco] = useState(false);
  return (
    <View style={s.grupo}>
      {etiqueta ? <Text style={s.etiqueta}>{etiqueta}</Text> : null}
      <View style={[s.caja, foco && s.foco]}>
        <TextInput
          placeholderTextColor={color.texto.secundario}
          {...input}
          onFocus={(e) => {
            setFoco(true);
            input.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFoco(false);
            input.onBlur?.(e);
          }}
          style={s.input}
        />
        {derecha}
      </View>
      {ayuda ? <Text style={s.ayuda}>{ayuda}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  grupo: { gap: 8 },
  etiqueta: { fontFamily: fuente.cuerpoFuerte, fontSize: 13, color: color.texto.principal },
  caja: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 16,
    paddingRight: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    backgroundColor: color.fondo.superficie,
  },
  foco: { borderColor: color.accion.primaria, borderWidth: 1.5 },
  input: { flex: 1, fontFamily: fuente.cuerpo, fontSize: 15, color: color.texto.principal, paddingVertical: 12 },
  ayuda: { fontFamily: fuente.cuerpo, fontSize: 12, color: color.texto.secundario },
});
