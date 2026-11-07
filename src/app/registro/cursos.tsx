import { router } from 'expo-router';
import { Calendar, Minus, Plus, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Aviso } from '../../components/Aviso';
import { Boton } from '../../components/Boton';
import { Chip } from '../../components/Chip';
import { PantallaRegistro } from '../../components/PantallaRegistro';
import { CURSOS_ING_SOFTWARE_UPC } from '../../data/cursos';
import { mensajeDeError } from '../../lib/api';
import { useEstudiante, type Curso, type Dificultad } from '../../state/estudiante';
import { color, fuente, radio } from '../../theme';

const NIVELES: { valor: Dificultad; etiqueta: string }[] = [
  { valor: 'facil', etiqueta: 'Fácil' },
  { valor: 'normal', etiqueta: 'Normal' },
  { valor: 'complicado', etiqueta: 'Complicado' },
];

export default function Cursos() {
  const { cursos, agregarCurso, actualizarCurso, quitarCurso, registrarNota } = useEstudiante();
  const [nuevo, setNuevo] = useState('');
  const [area, setArea] = useState(CURSOS_ING_SOFTWARE_UPC[0].area);
  const [error, setError] = useState<string | null>(null);

  /** Ejecuta una operación contra la API y muestra el error si falla. */
  const intentar = async (operacion: () => Promise<unknown>) => {
    setError(null);
    try {
      await operacion();
    } catch (e) {
      setError(mensajeDeError(e));
    }
  };

  const buscarCurso = (nombre: string) =>
    cursos.find((c) => normalizar(c.nombre) === normalizar(nombre));

  const agregar = () => {
    const nombre = nuevo.trim();
    if (!nombre) return;
    if (!buscarCurso(nombre)) intentar(() => agregarCurso(nombre));
    setNuevo('');
  };

  const alternar = (nombre: string) => {
    const existente = buscarCurso(nombre);
    intentar(() => (existente ? quitarCurso(existente.id) : agregarCurso(nombre)));
  };

  const terminar = () => {
    if (cursos.length === 0) return setError('Agrega al menos un curso para crear tu rumbo.');
    router.replace('/inicio');
  };

  // Con texto escrito se busca en todo el catálogo; si no, se muestra el área elegida.
  const sugerencias = useMemo(() => {
    const consulta = normalizar(nuevo.trim());
    if (!consulta) return CURSOS_ING_SOFTWARE_UPC.find((a) => a.area === area)?.cursos ?? [];
    return CURSOS_ING_SOFTWARE_UPC.flatMap((a) => a.cursos).filter((c) => normalizar(c).includes(consulta));
  }, [nuevo, area]);

  return (
    <PantallaRegistro
      paso={3}
      titulo="¿Qué cursos llevas este ciclo?"
      bajada="Elígelos del catálogo o escríbelos como figuran en tu matrícula."
      pie={
        <>
          <Aviso texto={error} />
          <Boton etiqueta="Crear mi rumbo" onPress={terminar} />
        </>
      }
    >
      <View style={s.agregar}>
        <TextInput
          value={nuevo}
          onChangeText={setNuevo}
          onSubmitEditing={agregar}
          placeholder="Busca o escribe un curso"
          placeholderTextColor={color.texto.secundario}
          returnKeyType="done"
          style={s.input}
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Agregar curso" onPress={agregar} style={s.mas}>
          <Plus size={22} color={color.texto.invertido} />
        </Pressable>
      </View>

      <View style={s.catalogo}>
        <Text style={s.catalogoTitulo}>Ingeniería de Software · UPC</Text>

        {!nuevo.trim() && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.areas}
            keyboardShouldPersistTaps="handled"
          >
            {CURSOS_ING_SOFTWARE_UPC.map((a) => {
              const activa = a.area === area;
              return (
                <Pressable
                  key={a.area}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activa }}
                  onPress={() => setArea(a.area)}
                  style={[s.area, activa && s.areaActiva]}
                >
                  <Text style={[s.areaTexto, activa && s.areaTextoActivo]}>{a.area}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {sugerencias.length > 0 ? (
          <View style={s.chips}>
            {sugerencias.map((nombre) => (
              <Chip key={nombre} etiqueta={nombre} activo={!!buscarCurso(nombre)} onPress={() => alternar(nombre)} />
            ))}
          </View>
        ) : (
          <Text style={s.sinResultados}>
            No está en el catálogo. Toca + para agregar «{nuevo.trim()}».
          </Text>
        )}
      </View>

      <View style={{ gap: 12 }}>
        {cursos.map((c) => (
          <TarjetaCurso
            key={c.id}
            curso={c}
            onCambiar={(cambios) => intentar(() => actualizarCurso(c.id, cambios))}
            onQuitar={() => intentar(() => quitarCurso(c.id))}
            onNota={(nota) => intentar(() => registrarNota(c.id, nota))}
          />
        ))}
      </View>
    </PantallaRegistro>
  );
}

function TarjetaCurso({
  curso,
  onCambiar,
  onQuitar,
  onNota,
}: {
  curso: Curso;
  onCambiar: (c: Partial<Curso>) => void;
  onQuitar: () => void;
  onNota: (nota: number) => void;
}) {
  const [nota, setNota] = useState('');
  const valor = Number(nota.replace(',', '.'));
  const notaValida = nota.trim() !== '' && Number.isFinite(valor) && valor >= 0 && valor <= 20;
  const guardarNota = () => {
    if (!notaValida) return;
    onNota(valor);
    setNota('');
  };

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

      <View style={s.fila}>
        <Text style={s.rotulo}>Avance: {curso.avance}%</Text>
        <View style={s.notaFila}>
          <TextInput
            value={nota}
            onChangeText={setNota}
            onSubmitEditing={guardarNota}
            placeholder="Nota 0–20"
            placeholderTextColor={color.texto.secundario}
            keyboardType="decimal-pad"
            returnKeyType="done"
            style={s.notaInput}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Guardar nota de ${curso.nombre}`}
            onPress={guardarNota}
            disabled={!notaValida}
            style={[s.notaBoton, !notaValida && { opacity: 0.4 }]}
          >
            <Plus size={16} color={color.texto.invertido} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/** Compara nombres sin distinguir mayúsculas ni tildes (ej. "calculo ii" = "Cálculo II"). */
function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

const s = StyleSheet.create({
  agregar: { flexDirection: 'row', gap: 10 },
  catalogo: { gap: 12 },
  catalogoTitulo: { fontFamily: fuente.cuerpoFuerte, fontSize: 13, color: color.texto.secundario },
  areas: { gap: 8 },
  area: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radio.full,
    backgroundColor: color.fondo.suave,
  },
  areaActiva: { backgroundColor: color.texto.acento },
  areaTexto: { fontFamily: fuente.cuerpoMedio, fontSize: 12, color: color.texto.acento },
  areaTextoActivo: { color: color.texto.invertido, fontFamily: fuente.cuerpoFuerte },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sinResultados: { fontFamily: fuente.cuerpo, fontSize: 13, color: color.texto.secundario },
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
  notaFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notaInput: {
    width: 96,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    backgroundColor: color.fondo.base,
    fontFamily: fuente.cuerpo,
    fontSize: 13,
    color: color.texto.principal,
  },
  notaBoton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: color.accion.primaria,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
