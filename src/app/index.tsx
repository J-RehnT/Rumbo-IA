import { Redirect, router } from 'expo-router';
import { ArrowRight, Menu, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArcoHero } from '../components/ArcoHero';
import { Boton } from '../components/Boton';
import { LogoHorizontal } from '../components/Logo';
import { useEstudiante } from '../state/estudiante';
import { color, fuente, radio } from '../theme';

/** Pantalla inicial: "01 · Inicio (hero)" del diseño verde. */
export default function Hero() {
  const { autenticado } = useEstudiante();
  const { width } = useWindowDimensions();
  const [altoArco, setAltoArco] = useState(0);

  // Con sesión iniciada, la bienvenida no se muestra: va directo a la app.
  if (autenticado) return <Redirect href="/inicio" />;

  return (
    <SafeAreaView style={s.pantalla} edges={['top']}>
      <View style={s.navbar}>
        <LogoHorizontal height={30} />
        <Pressable accessibilityRole="button" accessibilityLabel="Menú" style={s.menu}>
          <Menu size={20} color={color.texto.principal} />
        </Pressable>
      </View>

      <View style={s.frase}>
        <View style={s.pildora}>
          <Sparkles size={14} color={color.texto.acento} />
          <Text style={s.pildoraTexto}>Tutor con IA generativa</Text>
        </View>
        <Text style={s.titular}>Cada ciclo, un paso{'\n'}más cerca de tu meta</Text>
        <Text style={s.bajada}>
          Rumbo te explica lo difícil a tu medida y avanza contigo, desde la primera duda hasta tu logro.
        </Text>
        <Boton
          etiqueta="Empezar mi ruta"
          onPress={() => router.push('/registro/cuenta')}
          icono={(c) => <ArrowRight size={20} color={c} />}
          style={{ alignSelf: 'stretch' }}
        />
        <Boton etiqueta="Ya tengo cuenta" estilo="texto" onPress={() => router.push('/login')} />
      </View>

      <View style={{ flex: 1 }} onLayout={(e) => setAltoArco(e.nativeEvent.layout.height)}>
        {altoArco > 0 && <ArcoHero ancho={width} alto={altoArco} />}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.fondo.base },
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  menu: {
    width: 44,
    height: 44,
    borderRadius: radio.full,
    backgroundColor: color.fondo.superficie,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frase: { paddingHorizontal: 36, paddingTop: 28, alignItems: 'center', gap: 14 },
  pildora: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radio.full,
    backgroundColor: color.fondo.superficie,
    borderWidth: 1,
    borderColor: color.borde.sutil,
  },
  pildoraTexto: { fontFamily: fuente.cuerpoMedio, fontSize: 13, color: color.texto.acento },
  titular: { fontFamily: fuente.titulo, fontSize: 31, lineHeight: 36, color: color.texto.principal, textAlign: 'center' },
  bajada: { fontFamily: fuente.cuerpo, fontSize: 15, lineHeight: 22, color: color.texto.secundario, textAlign: 'center' },
});
