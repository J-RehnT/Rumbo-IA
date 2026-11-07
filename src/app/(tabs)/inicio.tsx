import { router } from 'expo-router';
import { ArrowRight, Calendar, ChevronRight, Clock, Compass, GraduationCap, Smile } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { diasHasta, duracion, haceCuanto, textoParcial } from '../../lib/fechas';
import { useEstudiante, type Curso, type Dificultad } from '../../state/estudiante';
import { color, fuente, radio } from '../../theme';

const DIFICULTAD: Record<Dificultad, { etiqueta: string; fondo: string; texto: string }> = {
  facil: { etiqueta: 'Fácil', fondo: color.fondo.suave, texto: color.texto.acento },
  normal: { etiqueta: 'Normal', fondo: color.fondo.base, texto: color.texto.secundario },
  complicado: { etiqueta: 'Complicado', fondo: color.accion.suave, texto: color.accion.suaveTexto },
};

// Primero el parcial más cercano; los cursos sin fecha van al final.
const porParcial = (a: Curso, b: Curso) =>
  (a.parcial ? diasHasta(a.parcial) : Infinity) - (b.parcial ? diasHasta(b.parcial) : Infinity);

/** Datos que Rumbo sí puede medir: fecha del parcial, tiempo de estudio y último tema visto. */
function TarjetaCurso({ c, onPress }: { c: Curso; onPress: () => void }) {
  const dif = DIFICULTAD[c.dificultad];
  const dias = c.parcial ? diasHasta(c.parcial) : null;
  const cerca = dias !== null && dias >= 0 && dias <= 7;
  const promedio = c.notas.length ? c.notas.reduce((a, b) => a + b, 0) / c.notas.length : null;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={s.curso}>
      <View style={s.cursoFila}>
        <Text style={s.cursoNombre} numberOfLines={1}>
          {c.nombre}
        </Text>
        <View style={[s.dificultad, { backgroundColor: dif.fondo }]}>
          <Text style={[s.dificultadTexto, { color: dif.texto }]}>{dif.etiqueta}</Text>
        </View>
      </View>
      <View style={s.datos}>
        <View style={s.dato}>
          <Calendar size={16} color={cerca ? color.texto.acento : color.texto.secundario} />
          <Text style={[s.datoTexto, cerca && s.datoUrgente]}>{c.parcial ? textoParcial(c.parcial) : 'Sin fecha de parcial'}</Text>
        </View>
        <View style={s.dato}>
          <Clock size={16} color={color.texto.secundario} />
          <Text style={s.datoTexto}>{duracion(c.minutosSemana)} esta semana</Text>
        </View>
        {promedio !== null && (
          <View style={s.dato}>
            <GraduationCap size={16} color={color.texto.secundario} />
            <Text style={s.datoTexto}>
              Promedio {promedio.toFixed(1).replace('.', ',').replace(',0', '')} / 20
            </Text>
          </View>
        )}
      </View>
      <Text style={s.cursoNota} numberOfLines={1}>
        {c.ultimoTema && c.ultimaVez
          ? `Último tema: ${c.ultimoTema} · ${haceCuanto(c.ultimaVez)}`
          : 'Aún no lo estudias con Rumbo. ¿Empezamos?'}
      </Text>
    </Pressable>
  );
}

export default function Inicio() {
  const { perfil, cursos } = useEstudiante();
  const [duda, setDuda] = useState('');
  const abrirTutor = (texto?: string) =>
    router.navigate({ pathname: '/tutor', params: texto ? { pregunta: texto } : {} });

  return (
    <SafeAreaView style={s.pantalla} edges={['top']}>
      <ScrollView contentContainerStyle={s.contenido}>
        <View style={s.saludo}>
          <View style={{ flex: 1 }}>
            <Text style={s.contexto}>
              {perfil.ciclo}.º ciclo · {perfil.carrera || 'Tu carrera'}
            </Text>
            <Text style={s.hola}>Hola, {perfil.nombre.split(' ')[0]}</Text>
          </View>
          <View style={s.avatar}>
            <Text style={s.avatarTexto}>{perfil.nombre.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        <View style={s.tutor}>
          <View style={s.tutorRotulo}>
            <Compass size={18} color={color.texto.heroSuave} />
            <Text style={s.tutorRotuloTexto}>TU TUTOR</Text>
          </View>
          <Text style={s.tutorPregunta}>¿Qué tema se te complica hoy?</Text>
          <View style={s.tutorFila}>
            <TextInput
              value={duda}
              onChangeText={setDuda}
              onSubmitEditing={() => abrirTutor(duda)}
              placeholder="Ej. integrales por partes"
              placeholderTextColor={color.texto.secundario}
              style={s.tutorInput}
              returnKeyType="send"
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Preguntar" onPress={() => abrirTutor(duda)} style={s.tutorEnviar}>
              <ArrowRight size={20} color={color.texto.principal} />
            </Pressable>
          </View>
          <View style={s.sugerencias}>
            {['Repasar para el parcial', `Seguir con ${cursos[1]?.nombre ?? 'mi curso'}`].map((t) => (
              <Pressable key={t} accessibilityRole="button" onPress={() => abrirTutor(t)} style={s.sugerencia}>
                <Text style={s.sugerenciaTexto}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.push('/checkin')} style={s.checkin}>
          <View style={s.checkinIcono}>
            <Smile size={22} color={color.texto.acento} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.checkinTitulo}>¿Cómo llegas hoy?</Text>
            <Text style={s.checkinSub}>Check-in de 10 segundos</Text>
          </View>
          <ChevronRight size={20} color={color.texto.principal} />
        </Pressable>

        <View style={s.seccion}>
          <Text style={s.seccionTitulo}>Tus cursos</Text>
          <Text style={s.verTodos} onPress={() => router.push('/registro/cursos')} accessibilityRole="link">
            Ver todos
          </Text>
        </View>

        {[...cursos].sort(porParcial).map((c) => (
          <TarjetaCurso key={c.id} c={c} onPress={() => abrirTutor(c.nombre)} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: color.fondo.base },
  contenido: { padding: 20, gap: 16, paddingBottom: 32 },
  saludo: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  contexto: { fontFamily: fuente.cuerpo, fontSize: 13, color: color.texto.secundario },
  hola: { fontFamily: fuente.titulo, fontSize: 26, color: color.texto.principal },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radio.full,
    backgroundColor: color.accion.suave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { fontFamily: fuente.titulo, fontSize: 17, color: color.accion.suaveTexto },
  tutor: { backgroundColor: color.fondo.hero, borderRadius: 24, padding: 18, gap: 14 },
  tutorRotulo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tutorRotuloTexto: { fontFamily: fuente.cuerpoFuerte, fontSize: 12, letterSpacing: 1.2, color: color.texto.heroSuave },
  tutorPregunta: { fontFamily: fuente.titulo, fontSize: 20, color: color.texto.invertido },
  tutorFila: { flexDirection: 'row', gap: 8 },
  tutorInput: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: color.fondo.superficie,
    fontFamily: fuente.cuerpo,
    fontSize: 15,
    color: color.texto.principal,
  },
  tutorEnviar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: color.accion.suave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sugerencias: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sugerencia: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: radio.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
  },
  sugerenciaTexto: { fontFamily: fuente.cuerpoMedio, fontSize: 13, color: color.texto.heroSuave },
  checkin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radio.xl,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    backgroundColor: color.fondo.superficie,
  },
  checkinIcono: {
    width: 40,
    height: 40,
    borderRadius: radio.md,
    backgroundColor: color.fondo.suave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinTitulo: { fontFamily: fuente.tituloBold, fontSize: 16, color: color.texto.principal },
  checkinSub: { fontFamily: fuente.cuerpo, fontSize: 13, color: color.texto.secundario },
  seccion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  seccionTitulo: { fontFamily: fuente.titulo, fontSize: 18, color: color.texto.principal },
  verTodos: { fontFamily: fuente.tituloBold, fontSize: 14, color: color.texto.acento },
  curso: {
    gap: 10,
    padding: 16,
    borderRadius: radio.xl,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    backgroundColor: color.fondo.superficie,
  },
  cursoFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cursoNombre: { flex: 1, fontFamily: fuente.titulo, fontSize: 16, color: color.texto.principal },
  dificultad: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radio.full },
  dificultadTexto: { fontFamily: fuente.cuerpoFuerte, fontSize: 12 },
  datos: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 6 },
  dato: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  datoTexto: { fontFamily: fuente.cuerpoMedio, fontSize: 13, color: color.texto.principal },
  datoUrgente: { fontFamily: fuente.cuerpoFuerte, color: color.texto.acento },
  cursoNota: { fontFamily: fuente.cuerpo, fontSize: 13, color: color.texto.secundario },
});
