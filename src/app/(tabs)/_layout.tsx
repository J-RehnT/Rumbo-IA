import { Tabs } from 'expo-router';
import { CalendarDays, ChartLine, House, MessageCircle, type LucideIcon } from 'lucide-react-native';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, fuente, radio } from '../../theme';

const ICONOS: Record<string, { Icono: LucideIcon; etiqueta: string }> = {
  inicio: { Icono: House, etiqueta: 'Inicio' },
  agenda: { Icono: CalendarDays, etiqueta: 'Agenda' },
  tutor: { Icono: MessageCircle, etiqueta: 'Tutor' },
  progreso: { Icono: ChartLine, etiqueta: 'Progreso' },
};

type PropsBarra = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

/** Navegación inferior del diseño: ícono en píldora menta cuando está activo. */
function Navegacion({ state, navigateToTab }: PropsBarra) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={[s.barra, { paddingBottom: Math.max(bottom, 10) }]}>
      {state.routes.map((ruta, i) => {
        const item = ICONOS[ruta.name];
        if (!item) return null;
        const activo = state.index === i;
        const { Icono } = item;
        return (
          <Pressable
            key={ruta.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={item.etiqueta}
            onPress={() => {
              if (!activo) navigateToTab(ruta.key);
            }}
            style={s.item}
          >
            <View style={[s.pildora, activo && s.pildoraActiva]}>
              <Icono size={22} color={activo ? color.texto.acento : color.texto.secundario} />
            </View>
            <Text style={[s.etiqueta, activo && s.etiquetaActiva]}>{item.etiqueta}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <Navegacion {...props} />}>
      <Tabs.Screen name="inicio" />
      <Tabs.Screen name="agenda" />
      <Tabs.Screen name="tutor" />
      <Tabs.Screen name="progreso" />
    </Tabs>
  );
}

const s = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    backgroundColor: color.fondo.superficie,
    borderTopWidth: 1,
    borderTopColor: color.borde.sutil,
  },
  item: { minWidth: 64, minHeight: 48, alignItems: 'center', gap: 4 },
  pildora: { width: 54, height: 28, borderRadius: radio.full, alignItems: 'center', justifyContent: 'center' },
  pildoraActiva: { backgroundColor: color.accion.suave },
  etiqueta: { fontFamily: fuente.cuerpo, fontSize: 12, color: color.texto.secundario },
  etiquetaActiva: { fontFamily: fuente.cuerpoFuerte, color: color.texto.acento },
});
