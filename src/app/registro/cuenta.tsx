import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Boton } from '../../components/Boton';
import { Campo } from '../../components/Campo';
import { PantallaRegistro } from '../../components/PantallaRegistro';
import { useEstudiante } from '../../state/estudiante';
import { color, fuente } from '../../theme';

export default function Cuenta() {
  const { perfil, setPerfil } = useEstudiante();
  // Sin backend todavía: ningún campo es obligatorio y todos los botones avanzan.
  const seguir = () => router.push('/registro/universidad');

  return (
    <PantallaRegistro
      paso={1}
      titulo="Crea tu cuenta"
      bajada="Así guardamos tu avance de un ciclo a otro."
      pie={
        <>
          <Boton etiqueta="Continuar" onPress={seguir} />
          <View style={s.login}>
            <Text style={s.loginTexto}>¿Ya tienes cuenta?</Text>
            <Text style={s.loginEnlace} onPress={() => router.replace('/inicio')} accessibilityRole="link">
              Inicia sesión
            </Text>
          </View>
        </>
      }
    >
      <View style={{ gap: 16 }}>
        <Boton etiqueta="Continuar con Google" estilo="secundario" onPress={seguir} />
        <View style={s.separador}>
          <View style={s.linea} />
          <Text style={s.separadorTexto}>o con tu correo</Text>
          <View style={s.linea} />
        </View>
        <Campo
          etiqueta="Nombre"
          placeholder="Ana Quispe"
          value={perfil.nombre === 'Ana' ? '' : perfil.nombre}
          onChangeText={(nombre) => setPerfil({ nombre: nombre || 'Ana' })}
          autoComplete="name"
        />
        <Campo
          etiqueta="Correo"
          placeholder="tu.correo@universidad.edu.pe"
          value={perfil.correo}
          onChangeText={(correo) => setPerfil({ correo })}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Campo etiqueta="Contraseña" placeholder="••••••••" secureTextEntry ayuda="Mínimo 8 caracteres." autoComplete="new-password" />
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
