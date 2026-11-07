import { useFocusEffect } from 'expo-router';
import { Check, Plus, RefreshCw, Sparkles, Trash2, X } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Aviso } from '../../components/Aviso';
import { Boton } from '../../components/Boton';
import { Chip } from '../../components/Chip';
import { TIPOS_ACTIVIDAD, tipoDe, type TipoActividad } from '../../data/actividades';
import { api, mensajeDeError } from '../../lib/api';
import { cuando, fechaLarga, hoyLima, parsearFecha, sumarDias } from '../../lib/fechas';
import { abrirPreparame, sePuedePreparar } from '../../lib/preparame';
import { useEstudiante } from '../../state/estudiante';
import { color, fuente, radio } from '../../theme';

type Actividad = {
  id: string;
  cursoId: string;
  curso: string;
  tipo: TipoActividad;
  titulo: string;
  fecha: string;
  origen: 'universidad' | 'manual';
  completada: boolean;
  diasRestantes: number;
};

const ATAJOS = [
  { etiqueta: 'En 3 días', dias: 3 },
  { etiqueta: '1 semana', dias: 7 },
  { etiqueta: '2 semanas', dias: 14 },
];

export default function Agenda() {
  const { cursos, refrescar } = useEstudiante();
  const [lista, setLista] = useState<Actividad[]>([]);
  const [filtro, setFiltro] = useState<TipoActividad | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [formulario, setFormulario] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setLista(await api<Actividad[]>('GET', '/actividades'));
      setError(null);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  /** Ejecuta un cambio, recarga la agenda y avisa a Inicio. */
  const cambiar = async (operacion: () => Promise<unknown>) => {
    setError(null);
    try {
      await operacion();
      await Promise.all([cargar(), refrescar()]);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  };

  const sincronizar = async () => {
    setSincronizando(true);
    setMensaje(null);
    await cambiar(async () => {
      const r = await api<{ agregadas: number }>('POST', '/actividades/sincronizar', {});
      setMensaje(
        r.agregadas > 0
          ? `Tu universidad envió ${r.agregadas} fechas nuevas (simulación).`
          : 'Ya tienes todas las fechas que envió tu universidad.',
      );
    });
    setSincronizando(false);
  };

  const visibles = useMemo(
    () => lista.filter((a) => !filtro || a.tipo === filtro),
    [lista, filtro],
  );
  const proximas = visibles.filter((a) => !a.completada && a.diasRestantes >= 0);
  const pasadas = visibles.filter((a) => a.completada || a.diasRestantes < 0);

  return (
    <SafeAreaView style={s.pantalla} edges={['top']}>
      <ScrollView contentContainerStyle={s.contenido} keyboardShouldPersistTaps="handled">
        <View style={s.cabecera}>
          <View style={{ flex: 1 }}>
            <Text style={s.contexto}>Parciales, prácticas y entregas</Text>
            <Text style={s.titulo}>Mi agenda</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={formulario ? 'Cerrar formulario' : 'Agregar actividad'}
            onPress={() => setFormulario((v) => !v)}
            style={s.mas}
          >
            {formulario ? <X size={22} color={color.texto.invertido} /> : <Plus size={22} color={color.texto.invertido} />}
          </Pressable>
        </View>

        <View style={s.universidad}>
          <Text style={s.universidadTitulo}>Calendario de tu universidad</Text>
          <Text style={s.universidadTexto}>
            Simulamos que tu universidad nos envía las fechas de evaluaciones y entregas de tus cursos.
          </Text>
          <Boton
            etiqueta={sincronizando ? 'Sincronizando…' : 'Sincronizar con mi universidad'}
            estilo="suave"
            deshabilitado={sincronizando}
            onPress={sincronizar}
            icono={(c) => <RefreshCw size={18} color={c} />}
          />
          {mensaje && <Text style={s.mensaje}>{mensaje}</Text>}
        </View>

        {formulario && (
          <Formulario
            onGuardar={async (d) => {
              await api('POST', '/actividades', d);
              setFormulario(false);
              await Promise.all([cargar(), refrescar()]);
            }}
          />
        )}

        <Aviso texto={error} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chip etiqueta="Todo" activo={filtro === null} onPress={() => setFiltro(null)} />
          {TIPOS_ACTIVIDAD.map((t) => (
            <Chip key={t.valor} etiqueta={t.etiqueta} activo={filtro === t.valor} onPress={() => setFiltro(filtro === t.valor ? null : t.valor)} />
          ))}
        </ScrollView>

        {lista.length === 0 && !error && (
          <Text style={s.vacio}>
            {cursos.length === 0
              ? 'Primero agrega tus cursos desde Inicio → Ver todos.'
              : 'Aún no hay fechas. Sincroniza con tu universidad o agrega una con el botón +.'}
          </Text>
        )}

        {proximas.length > 0 && <Text style={s.seccion}>Próximas</Text>}
        {proximas.map((a) => (
          <Fila
            key={a.id}
            a={a}
            onCompletar={() => cambiar(() => api('PATCH', `/actividades/${a.id}`, { completada: true }))}
            onBorrar={() => cambiar(() => api('DELETE', `/actividades/${a.id}`))}
          />
        ))}

        {pasadas.length > 0 && <Text style={s.seccion}>Hechas o vencidas</Text>}
        {pasadas.map((a) => (
          <Fila
            key={a.id}
            a={a}
            onCompletar={() => cambiar(() => api('PATCH', `/actividades/${a.id}`, { completada: !a.completada }))}
            onBorrar={() => cambiar(() => api('DELETE', `/actividades/${a.id}`))}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Fila({ a, onCompletar, onBorrar }: { a: Actividad; onCompletar: () => void; onBorrar: () => void }) {
  const { Icono } = tipoDe(a.tipo);
  const urgente = !a.completada && a.diasRestantes >= 0 && a.diasRestantes <= 3;
  return (
    <View style={[s.fila, a.completada && { opacity: 0.6 }]}>
      <View style={[s.icono, urgente && s.iconoUrgente]}>
        <Icono size={20} color={urgente ? color.apoyo.texto : color.texto.acento} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[s.filaTitulo, a.completada && { textDecorationLine: 'line-through' }]} numberOfLines={2}>
          {a.titulo}
        </Text>
        <Text style={s.filaCurso}>{a.curso}</Text>
        <Text style={[s.filaFecha, urgente && { color: color.apoyo.accion, fontFamily: fuente.cuerpoFuerte }]}>
          {fechaLarga(a.fecha)} · {cuando(a.diasRestantes)}
          {a.origen === 'universidad' ? ' · Universidad' : ''}
        </Text>
        {!a.completada && a.diasRestantes >= 0 && sePuedePreparar(a.tipo) && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Prepárame para ${a.titulo}`}
            onPress={() => abrirPreparame(a)}
            style={s.preparame}
          >
            <Sparkles size={14} color={color.texto.invertido} />
            <Text style={s.preparameTexto}>Prepárame</Text>
          </Pressable>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a.completada ? `Marcar ${a.titulo} como pendiente` : `Marcar ${a.titulo} como hecha`}
        onPress={onCompletar}
        hitSlop={8}
        style={[s.check, a.completada && s.checkActivo]}
      >
        <Check size={16} color={a.completada ? color.texto.invertido : color.texto.secundario} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Borrar ${a.titulo}`} onPress={onBorrar} hitSlop={8} style={s.borrar}>
        <Trash2 size={18} color={color.texto.secundario} />
      </Pressable>
    </View>
  );
}

function Formulario({ onGuardar }: { onGuardar: (d: { cursoId: string; tipo: TipoActividad; titulo?: string; fecha: string }) => Promise<void> }) {
  const { cursos } = useEstudiante();
  const [cursoId, setCursoId] = useState(cursos[0]?.id ?? '');
  const [tipo, setTipo] = useState<TipoActividad>('practica');
  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    const iso = parsearFecha(fecha);
    if (!cursoId) return setError('Primero agrega un curso.');
    if (!iso) return setError('Escribe la fecha como día/mes/año, por ejemplo 14/11/2026.');
    if (iso < hoyLima()) return setError('Esa fecha ya pasó.');
    setError(null);
    setGuardando(true);
    try {
      await onGuardar({ cursoId, tipo, titulo: titulo.trim() || undefined, fecha: iso });
    } catch (e) {
      setError(mensajeDeError(e));
      setGuardando(false);
    }
  };

  return (
    <View style={s.formulario}>
      <Text style={s.formTitulo}>Nueva fecha</Text>

      <Text style={s.rotulo}>Curso</Text>
      <View style={s.chips}>
        {cursos.map((c) => (
          <Chip key={c.id} etiqueta={c.nombre} activo={c.id === cursoId} onPress={() => setCursoId(c.id)} />
        ))}
        {cursos.length === 0 && <Text style={s.vacio}>Aún no tienes cursos.</Text>}
      </View>

      <Text style={s.rotulo}>¿Qué es?</Text>
      <View style={s.chips}>
        {TIPOS_ACTIVIDAD.map((t) => (
          <Chip key={t.valor} etiqueta={t.etiqueta} activo={t.valor === tipo} onPress={() => setTipo(t.valor)} />
        ))}
      </View>

      <TextInput
        value={titulo}
        onChangeText={setTitulo}
        placeholder="Título (opcional). Ej. Práctica 3"
        placeholderTextColor={color.texto.secundario}
        style={s.input}
      />
      <TextInput
        value={fecha}
        onChangeText={setFecha}
        placeholder="Fecha: día/mes/año"
        placeholderTextColor={color.texto.secundario}
        keyboardType="numbers-and-punctuation"
        style={s.input}
      />
      <View style={s.chips}>
        {ATAJOS.map((x) => (
          <Chip
            key={x.etiqueta}
            etiqueta={x.etiqueta}
            onPress={() => {
              const [a, m, d] = sumarDias(hoyLima(), x.dias).split('-');
              setFecha(`${d}/${m}/${a}`);
            }}
          />
        ))}
      </View>

      <Aviso texto={error} />
      <Boton etiqueta={guardando ? 'Guardando…' : 'Guardar'} onPress={guardar} deshabilitado={guardando} />
    </View>
  );
}

const s = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.fondo.base },
  contenido: { padding: 20, gap: 14, paddingBottom: 32 },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contexto: { fontFamily: fuente.cuerpo, fontSize: 13, color: color.texto.secundario },
  titulo: { fontFamily: fuente.titulo, fontSize: 26, color: color.texto.principal },
  mas: { width: 48, height: 48, borderRadius: radio.full, backgroundColor: color.accion.primaria, alignItems: 'center', justifyContent: 'center' },
  universidad: {
    gap: 10,
    padding: 16,
    borderRadius: radio.xl,
    backgroundColor: color.fondo.suave,
    borderWidth: 1,
    borderColor: color.borde.acento,
  },
  universidadTitulo: { fontFamily: fuente.tituloBold, fontSize: 16, color: color.texto.principal },
  universidadTexto: { fontFamily: fuente.cuerpo, fontSize: 13, lineHeight: 18, color: color.texto.secundario },
  mensaje: { fontFamily: fuente.cuerpoMedio, fontSize: 13, color: color.texto.acento },
  seccion: { fontFamily: fuente.titulo, fontSize: 18, color: color.texto.principal, marginTop: 6 },
  vacio: { fontFamily: fuente.cuerpo, fontSize: 14, lineHeight: 20, color: color.texto.secundario },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radio.xl,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    backgroundColor: color.fondo.superficie,
  },
  icono: { width: 40, height: 40, borderRadius: radio.md, backgroundColor: color.fondo.suave, alignItems: 'center', justifyContent: 'center' },
  iconoUrgente: { backgroundColor: color.apoyo.fondo },
  filaTitulo: { fontFamily: fuente.tituloBold, fontSize: 15, color: color.texto.principal },
  filaCurso: { fontFamily: fuente.cuerpo, fontSize: 13, color: color.texto.secundario },
  filaFecha: { fontFamily: fuente.cuerpoMedio, fontSize: 12, color: color.texto.acento },
  check: {
    width: 32,
    height: 32,
    borderRadius: radio.full,
    borderWidth: 1.5,
    borderColor: color.borde.acento,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActivo: { backgroundColor: color.accion.primaria, borderColor: color.accion.primaria },
  preparame: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radio.full,
    backgroundColor: color.accion.primaria,
  },
  preparameTexto: { fontFamily: fuente.cuerpoFuerte, fontSize: 12, color: color.texto.invertido },
  borrar: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  formulario: {
    gap: 12,
    padding: 16,
    borderRadius: radio.xl,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    backgroundColor: color.fondo.superficie,
  },
  formTitulo: { fontFamily: fuente.titulo, fontSize: 18, color: color.texto.principal },
  rotulo: { fontFamily: fuente.cuerpoFuerte, fontSize: 13, color: color.texto.principal },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    backgroundColor: color.fondo.base,
    fontFamily: fuente.cuerpo,
    fontSize: 15,
    color: color.texto.principal,
  },
});
