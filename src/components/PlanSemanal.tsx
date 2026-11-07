import { Check, CloudSun, Flame, Plus, Sun, Target, Trash2, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Curso } from '../state/estudiante';
import { color, fuente, radio } from '../theme';
import { Chip } from './Chip';
import { Tarjeta } from './Tarjeta';

export type Proyeccion = 'tranquila' | 'normal' | 'intensa';
export type Objetivo = { id: string; texto: string; cursoId: string | null; metodo: string | null; cumplido: boolean };
export type Plan = { objetivos: Objetivo[]; proyeccion: Proyeccion | null; comentario: string | null };

const PROYECCIONES: { valor: Proyeccion; etiqueta: string; Icono: LucideIcon }[] = [
  { valor: 'tranquila', etiqueta: 'Tranquila', Icono: Sun },
  { valor: 'normal', etiqueta: 'Normal', Icono: CloudSun },
  { valor: 'intensa', etiqueta: 'Intensa', Icono: Flame },
];

/** Bloques del check-in para la semana: cómo se proyecta y sus objetivos por curso o método. */
export function PlanSemanal({
  plan,
  onCambiar,
  cursos,
  metodos,
}: {
  plan: Plan;
  onCambiar: (p: Plan) => void;
  cursos: Curso[];
  metodos: string[];
}) {
  const [texto, setTexto] = useState('');
  const [cursoId, setCursoId] = useState<string | null>(null);
  const [metodo, setMetodo] = useState<string | null>(null);

  const agregar = () => {
    if (!texto.trim() || plan.objetivos.length >= 10) return;
    onCambiar({
      ...plan,
      objetivos: [...plan.objetivos, { id: String(Date.now()), texto: texto.trim(), cursoId, metodo, cumplido: false }],
    });
    setTexto('');
    setCursoId(null);
    setMetodo(null);
  };
  const cambiarObjetivo = (id: string, cambios: Partial<Objetivo> | null) =>
    onCambiar({
      ...plan,
      objetivos: cambios === null ? plan.objetivos.filter((o) => o.id !== id) : plan.objetivos.map((o) => (o.id === id ? { ...o, ...cambios } : o)),
    });
  const nombreCurso = (id: string | null) => cursos.find((c) => c.id === id)?.nombre;

  return (
    <>
      <Tarjeta style={s.bloque}>
        <View style={s.rotulo}>
          <View style={s.iconoRotulo}>
            <CloudSun size={16} color={color.texto.acento} />
          </View>
          <Text style={s.rotuloTexto}>¿Cómo te proyectas esta semana?</Text>
        </View>
        <View style={s.fila}>
          {PROYECCIONES.map(({ valor, etiqueta, Icono }) => {
            const activo = plan.proyeccion === valor;
            return (
              <Pressable
                key={valor}
                accessibilityRole="button"
                accessibilityState={{ selected: activo }}
                onPress={() => onCambiar({ ...plan, proyeccion: activo ? null : valor })}
                style={[s.opcion, activo && s.opcionActiva]}
              >
                <Icono size={20} color={activo ? color.accion.suaveTexto : color.texto.secundario} />
                <Text style={[s.opcionTexto, activo && { color: color.accion.suaveTexto, fontFamily: fuente.cuerpoFuerte }]}>{etiqueta}</Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          value={plan.comentario ?? ''}
          onChangeText={(c) => onCambiar({ ...plan, comentario: c })}
          placeholder="Cuéntale al tutor (opcional). Ej. tengo parcial y trabajo el jueves"
          placeholderTextColor={color.texto.secundario}
          multiline
          maxLength={300}
          style={[s.input, { minHeight: 64, textAlignVertical: 'top' }]}
        />
      </Tarjeta>

      <Tarjeta style={s.bloque}>
        <View style={s.rotulo}>
          <View style={s.iconoRotulo}>
            <Target size={16} color={color.texto.acento} />
          </View>
          <Text style={s.rotuloTexto}>Objetivos de la semana</Text>
        </View>
        <Text style={s.ayuda}>El tutor ajusta sus métodos y recordatorios a lo que te propongas.</Text>

        {plan.objetivos.map((o) => (
          <View key={o.id} style={s.objetivo}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: o.cumplido }}
              accessibilityLabel={o.texto}
              onPress={() => cambiarObjetivo(o.id, { cumplido: !o.cumplido })}
              style={[s.check, o.cumplido && s.checkActivo]}
            >
              {o.cumplido && <Check size={14} color={color.texto.invertido} />}
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[s.objetivoTexto, o.cumplido && { textDecorationLine: 'line-through', color: color.texto.secundario }]}>{o.texto}</Text>
              {(o.cursoId || o.metodo) && (
                <Text style={s.objetivoMeta}>{[nombreCurso(o.cursoId), o.metodo].filter(Boolean).join(' · ')}</Text>
              )}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Quitar ${o.texto}`} onPress={() => cambiarObjetivo(o.id, null)} hitSlop={8}>
              <Trash2 size={16} color={color.texto.secundario} />
            </Pressable>
          </View>
        ))}

        <View style={s.agregar}>
          <TextInput
            value={texto}
            onChangeText={setTexto}
            onSubmitEditing={agregar}
            placeholder="Ej. Resolver 10 integrales por partes"
            placeholderTextColor={color.texto.secundario}
            maxLength={140}
            style={[s.input, { flex: 1 }]}
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Agregar objetivo" onPress={agregar} style={s.mas}>
            <Plus size={20} color={color.texto.invertido} />
          </Pressable>
        </View>
        {cursos.length > 0 && (
          <>
            <Text style={s.mini}>Curso (opcional)</Text>
            <View style={s.chips}>
              {cursos.map((c) => (
                <Chip key={c.id} etiqueta={c.nombre} activo={cursoId === c.id} onPress={() => setCursoId(cursoId === c.id ? null : c.id)} />
              ))}
            </View>
          </>
        )}
        <Text style={s.mini}>Método que quieres probar (opcional)</Text>
        <View style={s.chips}>
          {metodos.map((m) => (
            <Chip key={m} etiqueta={m} activo={metodo === m} onPress={() => setMetodo(metodo === m ? null : m)} />
          ))}
        </View>
      </Tarjeta>
    </>
  );
}

const s = StyleSheet.create({
  bloque: { gap: 12, padding: 18 },
  rotulo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconoRotulo: { width: 32, height: 32, borderRadius: 16, backgroundColor: color.fondo.suave, alignItems: 'center', justifyContent: 'center' },
  rotuloTexto: { flex: 1, fontFamily: fuente.tituloBold, fontSize: 16, color: color.texto.principal },
  ayuda: { fontFamily: fuente.cuerpo, fontSize: 13, lineHeight: 18, color: color.texto.secundario },
  fila: { flexDirection: 'row', gap: 8 },
  opcion: {
    flex: 1,
    minHeight: 64,
    gap: 4,
    borderRadius: radio.lg,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcionActiva: { backgroundColor: color.accion.suave, borderColor: color.accion.suave },
  opcionTexto: { fontFamily: fuente.cuerpoMedio, fontSize: 13, color: color.texto.secundario },
  input: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    backgroundColor: color.fondo.base,
    fontFamily: fuente.cuerpo,
    fontSize: 14,
    color: color.texto.principal,
  },
  objetivo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  check: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: color.borde.acento,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActivo: { backgroundColor: color.accion.primaria, borderColor: color.accion.primaria },
  objetivoTexto: { fontFamily: fuente.cuerpoMedio, fontSize: 14, color: color.texto.principal },
  objetivoMeta: { fontFamily: fuente.cuerpo, fontSize: 12, color: color.texto.acento },
  agregar: { flexDirection: 'row', gap: 8 },
  mas: { width: 44, height: 44, borderRadius: 12, backgroundColor: color.accion.primaria, alignItems: 'center', justifyContent: 'center' },
  mini: { fontFamily: fuente.cuerpoFuerte, fontSize: 12, color: color.texto.secundario },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
