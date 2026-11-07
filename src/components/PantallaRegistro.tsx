import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, fuente } from '../theme';
import { Pasos } from './Pasos';

/** Estructura común de los pasos del registro: encabezado, título, contenido y pie fijo. */
export function PantallaRegistro({
  paso,
  titulo,
  bajada,
  children,
  pie,
}: {
  paso: number;
  titulo: string;
  bajada: string;
  children: ReactNode;
  pie: ReactNode;
}) {
  return (
    <SafeAreaView style={s.pantalla}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.contenido} keyboardShouldPersistTaps="handled">
          <Pasos paso={paso} />
          <View style={{ gap: 8 }}>
            <Text style={s.titulo}>{titulo}</Text>
            <Text style={s.bajada}>{bajada}</Text>
          </View>
          {children}
        </ScrollView>
        <View style={s.pie}>{pie}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.fondo.base },
  contenido: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, gap: 24 },
  titulo: { fontFamily: fuente.titulo, fontSize: 28, lineHeight: 32, color: color.texto.principal },
  bajada: { fontFamily: fuente.cuerpo, fontSize: 15, lineHeight: 22, color: color.texto.secundario },
  pie: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8, gap: 12 },
});
