import { router } from 'expo-router';
import { Calendar, Minus, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Boton } from '../../components/Boton';
import { PantallaRegistro } from '../../components/PantallaRegistro';
import { useEstudiante, type Curso, type Dificultad } from '../../state/estudiante';
import { color, fuente, radio } from '../../theme';

const NIVELES: { valor: Dificultad; etiqueta: string }[] = [
  { valor: 'facil', etiqueta: 'Fácil' },
  { valor: 'normal', etiqueta: 'Normal' },
  { valor: 'complicado', etiqueta: 'Complicado' },
];

export default function Cursos() {
  const { cursos, agregarCurso, actualizarCurso, quitarCurso } = useEstudiante();
  const [nuevo, setNuevo] = useState('');
  const agregar = () => {
    if (!nuevo.trim()) return;
    agregarCurso(nuevo.trim());
    setNuevo('');
  };

  return (
    <PantallaRegistro
      paso={3}
      titulo="¿Qué cursos llevas este ciclo?"
      bajada="Escríbelos como figuran en tu matrícula."
      pie={<Boton etiqueta="Crear mi rumbo" onPress={() => router.replace('/inicio')} />}
    >
      <View style={s.agregar}>
        <TextInput
          value={nuevo}
          onChangeText={setNuevo}
          onSubmitEditing={agregar}
          placeholder="Ej. Física II"
          placeholderTextColor={color.texto.secundario}
          returnKeyType="done"
          style={s.input}
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Agregar curso" onPress={agregar} style={s.mas}>
          <Plus size={22} color={color.texto.invertido} />
        </Pressable>
      </View>

      <View style={{ gap: 12 }}>
        {cursos.map((c) => (
          <TarjetaCurso
            key={c.id}
            curso={c}
            onCambiar={(cambios) => actualizarCurso(c.id, cambios)}
            onQuitar={() => quitarCurso(c.id)}
          />
        ))}
      </View>
    </PantallaRegistro>
  );
}

function TarjetaCurso({ curso, onCambiar, onQuitar }: { curso: Curso; onCambiar: (c: Partial<Curso>) => void; onQuitar: () => void }) {
  return (
    <View style={s.tarjeta}>
      <View style={s.fila}>
        <Text style={s.nombre}>{curso.nombre}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Quitar ${curso.nombre}`} onPress={onQuitar} hitSlop={12}>
          <X size={18} color={color.texto.secundario} />
        </Pressable>
      </View>

      <View style={s.fila}>
        <Text style={s.rotulo}>Horas de clase por semana</Text>
        <View style={s.contador}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Menos horas"
            onPress={() => onCambiar({ horasClase: Math.max(1, curso.horasClase - 1) })}
            style={s.botonContador}
          >
            <Minus size={16} color={color.texto.principal} />
          </Pressable>
          <Text style={s.horas}>{curso.horasClase} h</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Más horas"
            onPress={() => onCambiar({ horasClase: Math.min(12, curso.horasClase + 1) })}
            style={s.botonContador}
          >
            <Plus size={16} color={color.texto.principal} />
          </Pressable>
        </View>
      </View>

      <Text style={s.rotulo}>¿Qué tan difícil se te hace?</Text>
      <View style={s.niveles}>
        {NIVELES.map((n) => {
          const activo = n.valor === curso.dificultad;
          return (
            <Pressable
              key={n.valor}
              accessibilityRole="button"
              accessibilityState={{ selected: activo }}
              onPress={() => onCambiar({ dificultad: n.valor })}
              style={[s.nivel, activo && s.nivelActivo]}
            >
              <Text style={[s.nivelTexto, activo && { color: color.texto.invertido, fontFamily: fuente.cuerpoFuerte }]}>
                {n.etiqueta}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[s.fila, { justifyContent: 'flex-start', gap: 8 }]}>
        <Calendar size={16} color={color.texto.acento} />
        {curso.parcial ? (
          <Text style={s.parcial}>Próximo parcial: {curso.parcial}</Text>
        ) : (
          <Text style={s.parcialVacio}>Agregar fecha del próximo parcial (opcional)</Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  agregar: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: color.accion.primaria,
    backgroundColor: color.fondo.superficie,
    fontFamily: fuente.cuerpo,
    fontSize: 15,
    color: color.texto.principal,
  },
  mas: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: color.accion.primaria,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarjeta: {
    gap: 10,
    padding: 16,
    paddingTop: 12,
    borderRadius: radio.xl,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    backgroundColor: color.fondo.superficie,
  },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nombre: { flex: 1, fontFamily: fuente.titulo, fontSize: 17, color: color.texto.principal },
  rotulo: { fontFamily: fuente.cuerpo, fontSize: 13, color: color.texto.secundario },
  contador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
    borderRadius: radio.full,
    backgroundColor: color.fondo.base,
  },
  botonContador: {
    width: 32,
    height: 32,
    borderRadius: radio.full,
    backgroundColor: color.fondo.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horas: { width: 44, textAlign: 'center', fontFamily: fuente.titulo, fontSize: 15, color: color.texto.acento },
  niveles: { flexDirection: 'row', gap: 6 },
  nivel: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    backgroundColor: color.fondo.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nivelActivo: { backgroundColor: color.accion.primaria, borderColor: color.accion.primaria },
  nivelTexto: { fontFamily: fuente.cuerpoMedio, fontSize: 13, color: color.texto.principal },
  parcial: { fontFamily: fuente.cuerpoMedio, fontSize: 13, color: color.texto.principal },
  parcialVacio: { fontFamily: fuente.cuerpo, fontSize: 13, color: color.texto.acento },
});
