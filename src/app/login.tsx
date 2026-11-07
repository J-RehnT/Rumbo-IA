import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Aviso } from '../components/Aviso';
import { Boton } from '../components/Boton';
import { Campo } from '../components/Campo';
import { mensajeDeError } from '../lib/api';
import { useEstudiante } from '../state/estudiante';
import { color, fuente, radio } from '../theme';

export default function Login() {
  const { iniciarSesion } = useEstudiante();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const entrar = async () => {
    if (enviando) return;
    if (!correo.trim() || !password) return setError('Escribe tu correo y tu contraseña.');
    setError(null);
    setEnviando(true);
    try {
      await iniciarSesion({ correo: correo.trim(), password });
      router.replace('/inicio');
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={s.pantalla}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.contenido} keyboardShouldPersistTaps="handled">
          <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={() => router.back()} style={s.atras}>
            <ChevronLeft size={22} color={color.texto.principal} />
          </Pressable>

          <View style={{ gap: 8 }}>
            <Text style={s.titulo}>Qué bueno verte de nuevo</Text>
            <Text style={s.bajada}>Ingresa para retomar tu ruta donde la dejaste.</Text>
          </View>

          <View style={{ gap: 16 }}>
            <Campo
              etiqueta="Correo"
              placeholder="tu.correo@universidad.edu.pe"
              value={correo}
              onChangeText={setCorreo}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Campo
              etiqueta="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              onSubmitEditing={entrar}
            />
            <Aviso texto={error} />
          </View>
        </ScrollView>

        <View style={s.pie}>
          <Boton etiqueta={enviando ? 'Ingresando…' : 'Ingresar'} onPress={entrar} deshabilitado={enviando} />
          <View style={s.registro}>
            <Text style={s.registroTexto}>¿Aún no tienes cuenta?</Text>
            <Text style={s.registroEnlace} onPress={() => router.replace('/registro/cuenta')} accessibilityRole="link">
              Créala aquí
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.fondo.base },
  contenido: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, gap: 24 },
  atras: {
    width: 44,
    height: 44,
    borderRadius: radio.full,
    backgroundColor: color.fondo.superficie,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontFamily: fuente.titulo, fontSize: 28, lineHeight: 32, color: color.texto.principal },
  bajada: { fontFamily: fuente.cuerpo, fontSize: 15, lineHeight: 22, color: color.texto.secundario },
  pie: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8, gap: 12 },
  registro: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  registroTexto: { fontFamily: fuente.cuerpo, fontSize: 14, color: color.texto.secundario },
  registroEnlace: { fontFamily: fuente.tituloBold, fontSize: 14, color: color.texto.acento },
});
