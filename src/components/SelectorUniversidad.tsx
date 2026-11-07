import { Check, Plus, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UNIVERSIDADES, type Universidad } from '../data/universidades';
import { color, fuente, radio } from '../theme';

export function SelectorUniversidad({
  visible,
  seleccion,
  onElegir,
  onCerrar,
}: {
  visible: boolean;
  seleccion: Universidad | null;
  onElegir: (u: Universidad) => void;
  onCerrar: () => void;
}) {
  const [busqueda, setBusqueda] = useState('');
  const { bottom } = useSafeAreaInsets();
  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return q ? UNIVERSIDADES.filter((u) => u.sigla.toLowerCase().includes(q) || u.nombre.toLowerCase().includes(q)) : UNIVERSIDADES;
  }, [busqueda]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <Pressable style={s.velo} onPress={onCerrar} accessibilityLabel="Cerrar selector" />
      <View style={[s.hoja, { paddingBottom: 24 + bottom }]}>
        <View style={s.asa} />
        <View style={s.cabecera}>
          <Text style={s.titulo}>Elige tu universidad</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onCerrar} style={s.cerrar}>
            <X size={18} color={color.texto.principal} />
          </Pressable>
        </View>
        <View style={s.buscar}>
          <Search size={20} color={color.texto.secundario} />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Busca por nombre o sigla"
            placeholderTextColor={color.texto.secundario}
            style={s.buscarInput}
          />
        </View>
        <FlatList
          data={lista}
          keyExtractor={(u) => u.sigla}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const activo = seleccion?.sigla === item.sigla;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: activo }}
                onPress={() => onElegir(item)}
                style={[s.fila, activo && s.filaActiva]}
              >
                <View style={[s.sigla, activo && s.siglaActiva]}>
                  <Text style={[s.siglaTexto, activo && { color: color.texto.invertido }]}>{item.sigla}</Text>
                </View>
                <Text style={s.nombre} numberOfLines={2}>
                  {item.nombre}
                </Text>
                {activo && <Check size={20} color={color.accion.primaria} />}
              </Pressable>
            );
          }}
          ListFooterComponent={
            <Pressable
              accessibilityRole="button"
              onPress={() => onElegir({ sigla: 'Otra', nombre: busqueda.trim() || 'Otra universidad' })}
              style={s.fila}
            >
              <View style={[s.sigla, s.siglaOtra]}>
                <Plus size={16} color={color.accion.primaria} />
              </View>
              <Text style={s.otra}>Otra universidad</Text>
            </Pressable>
          }
        />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  velo: { flex: 1, backgroundColor: 'rgba(8,37,26,0.45)' },
  hoja: {
    maxHeight: '85%',
    backgroundColor: color.fondo.superficie,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    gap: 14,
  },
  asa: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: color.borde.sutil },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { fontFamily: fuente.titulo, fontSize: 20, color: color.texto.principal },
  cerrar: {
    width: 40,
    height: 40,
    borderRadius: radio.full,
    backgroundColor: color.fondo.suave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buscar: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    backgroundColor: color.fondo.superficie,
  },
  buscarInput: { flex: 1, fontFamily: fuente.cuerpo, fontSize: 15, color: color.texto.principal, paddingVertical: 10 },
  fila: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, borderRadius: 12 },
  filaActiva: { backgroundColor: color.fondo.suave },
  sigla: {
    width: 56,
    height: 28,
    borderRadius: radio.sm,
    backgroundColor: color.fondo.suave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  siglaActiva: { backgroundColor: color.accion.primaria },
  siglaOtra: { backgroundColor: 'transparent', borderWidth: 1, borderStyle: 'dashed', borderColor: color.borde.acento },
  siglaTexto: { fontFamily: fuente.titulo, fontSize: 12, color: color.texto.acento },
  nombre: { flex: 1, fontFamily: fuente.cuerpo, fontSize: 14, color: color.texto.principal },
  otra: { fontFamily: fuente.tituloBold, fontSize: 14, color: color.texto.acento },
});
