import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, useFonts as useInter } from '@expo-google-fonts/inter';
import { Nunito_700Bold, Nunito_800ExtraBold, useFonts as useNunito } from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EstudianteProvider } from '../state/estudiante';
import { color } from '../theme';

export default function RootLayout() {
  const [nunito] = useNunito({ Nunito_700Bold, Nunito_800ExtraBold });
  const [inter] = useInter({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  if (!nunito || !inter) return null;

  return (
    <SafeAreaProvider>
      <EstudianteProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.fondo.base } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="registro" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="checkin" options={{ presentation: 'modal' }} />
        </Stack>
      </EstudianteProvider>
    </SafeAreaProvider>
  );
}
