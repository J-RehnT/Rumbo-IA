import { Stack } from 'expo-router';
import { color } from '../../theme';

export default function RegistroLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.fondo.base } }} />;
}
