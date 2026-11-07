import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, useFonts as useInter } from '@expo-google-fonts/inter';
import { Nunito_700Bold, Nunito_800ExtraBold, useFonts as useNunito } from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EstudianteProvider, useEstudiante } from '../state/estudiante';
import { color } from '../theme';

export default function RootLayout() {
  const [nunito] = useNunito({ Nunito_700Bold, Nunito_800ExtraBold });
  const [inter] = useInter({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  if (!nunito || !inter) return null;

  return (
    <SafeAreaProvider>
      <EstudianteProvider>
        <StatusBar style="dark" />
        <Navegacion />
      </EstudianteProvider>
    </SafeAreaProvider>
  );
}

/** Con sesión: la app. Sin sesión: bienvenida e ingreso. El registro es accesible en ambos casos. */
function Navegacion() {
  const { cargando, autenticado } = useEstudiante();
  if (cargando) return null; // espera a recuperar la sesión guardada

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.fondo.base } }}>
      <Stack.Protected guard={autenticado}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="checkin" options={{ presentation: 'modal' }} />
      </Stack.Protected>
      <Stack.Protected guard={!autenticado}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Screen name="registro" />
    </Stack>
  );
}
