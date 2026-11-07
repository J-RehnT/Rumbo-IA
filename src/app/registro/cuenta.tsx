import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Aviso } from '../../components/Aviso';
import { Boton } from '../../components/Boton';
import { Campo } from '../../components/Campo';
import { PantallaRegistro } from '../../components/PantallaRegistro';
import { mensajeDeError } from '../../lib/api';
import { useEstudiante } from '../../state/estudiante';
import { color, fuente } from '../../theme';

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Cuenta() {
  const { autenticado, registrar } = useEstudiante();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const seguir = async () => {
    if (enviando) return;
    // Si ya creó la cuenta y vuelve atrás, solo avanza.
    if (autenticado) return router.push('/registro/universidad');

    if (!nombre.trim()) return setError('Escribe tu nombre.');
    if (!CORREO.test(correo.trim())) return setError('Escribe un correo válido.');
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');

    setError(null);
    setEnviando(true);
    try {
      await registrar({ nombre: nombre.trim(), correo: correo.trim(), password });
      router.push('/registro/universidad');
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <PantallaRegistro
      paso={1}
      titulo="Crea tu cuenta"
      bajada="Así guardamos tu avance de un ciclo a otro."
      pie={
        <>
          <Boton etiqueta={enviando ? 'Creando cuenta…' : 'Continuar'} onPress={seguir} deshabilitado={enviando} />
          <View style={s.login}>
            <Text style={s.loginTexto}>¿Ya tienes cuenta?</Text>
            <Text style={s.loginEnlace} onPress={() => router.replace('/login')} accessibilityRole="link">
              Inicia sesión
            </Text>
          </View>
        </>
      }
    >
      <View style={{ gap: 16 }}>
        <Boton
          etiqueta="Continuar con Google"
          estilo="secundario"
          onPress={() => setError('El ingreso con Google estará disponible pronto. Por ahora usa tu correo.')}
        />
        <View style={s.separador}>
          <View style={s.linea} />
          <Text style={s.separadorTexto}>o con tu correo</Text>
          <View style={s.linea} />
        </View>
        <Campo etiqueta="Nombre" placeholder="Ana Quispe" value={nombre} onChangeText={setNombre} autoComplete="name" editable={!autenticado} />
        <Campo
          etiqueta="Correo"
          placeholder="tu.correo@universidad.edu.pe"
          value={correo}
          onChangeText={setCorreo}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!autenticado}
        />
        <Campo
          etiqueta="Contraseña"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          ayuda="Mínimo 8 caracteres."
          autoComplete="new-password"
          editable={!autenticado}
        />
        <Aviso texto={error} />
      </View>
    </PantallaRegistro>
  );
}

const s = StyleSheet.create({
  separador: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  linea: { flex: 1, height: 1, backgroundColor: color.borde.sutil },
  separadorTexto: { fontFamily: fuente.cuerpo, fontSize: 13, color: color.texto.secundario },
  login: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  loginTexto: { fontFamily: fuente.cuerpo, fontSize: 14, color: color.texto.secundario },
  loginEnlace: { fontFamily: fuente.tituloBold, fontSize: 14, color: color.texto.acento },
});
