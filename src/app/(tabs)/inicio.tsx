import { router, useFocusEffect } from 'expo-router';
import { ArrowRight, ChevronRight, Compass, LogOut, Smile } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarraAvance } from '../../components/BarraAvance';
import { tipoDe } from '../../data/actividades';
import { cuando, fechaLarga } from '../../lib/fechas';
import { useEstudiante, type Curso } from '../../state/estudiante';
import { color, fuente, radio } from '../../theme';

function nota(c: Curso) {
  if (c.avance >= 75) return 'Vas muy bien, sigue así';
  if (c.avance >= 55) return 'Último repaso: ayer';
  if (c.avance > 0) return 'Este tema te está costando, repasemos';
  return 'Aún sin práctica';
}

export default function Inicio() {
  const { perfil, cursos, recomendacion, proximas, checkinPendiente, refrescar, cerrarSesion } = useEstudiante();
  const [duda, setDuda] = useState('');

  // Cada vez que vuelves a Inicio se actualizan cursos, recomendación y check-in.
  useFocusEffect(
    useCallback(() => {
      refrescar().catch(() => {});
    }, [refrescar]),
  );
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
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sesión" onPress={cerrarSesion} hitSlop={8} style={s.salir}>
            <LogOut size={20} color={color.texto.secundario} />
          </Pressable>
        </View>

        <View style={s.tutor}>
          <View style={s.tutorRotulo}>
            <Compass size={18} color={color.texto.heroSuave} />
            <Text style={s.tutorRotuloTexto}>TU TUTOR</Text>
          </View>
          <Text style={s.tutorPregunta}>¿Qué tema se te complica hoy?</Text>
          {recomendacion && <Text style={s.recomendacion}>{recomendacion.texto}</Text>}
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
            <Text style={s.checkinSub}>{checkinPendiente ? 'Check-in de 10 segundos' : 'Ya hiciste el de hoy · puedes actualizarlo'}</Text>
          </View>
          <ChevronRight size={20} color={color.texto.principal} />
        </Pressable>

        {proximas.length > 0 && (
          <>
            <View style={s.seccion}>
              <Text style={s.seccionTitulo}>Próximas fechas</Text>
              <Text style={s.verTodos} onPress={() => router.navigate('/agenda')} accessibilityRole="link">
                Ver agenda
              </Text>
            </View>
            {proximas.map((e) => {
              const { Icono } = tipoDe(e.tipo);
              const urgente = e.diasRestantes <= 3;
              return (
                <Pressable key={e.id} accessibilityRole="button" onPress={() => router.navigate('/agenda')} style={s.evento}>
                  <View style={[s.eventoIcono, urgente && { backgroundColor: color.apoyo.fondo }]}>
                    <Icono size={18} color={urgente ? color.apoyo.texto : color.texto.acento} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.eventoTitulo} numberOfLines={1}>
                      {e.titulo} · {e.curso}
                    </Text>
                    <Text style={[s.eventoFecha, urgente && { color: color.apoyo.accion }]}>
                      {fechaLarga(e.fecha)} · {cuando(e.diasRestantes)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </>
        )}

        <View style={s.seccion}>
          <Text style={s.seccionTitulo}>Tus cursos</Text>
          <Text style={s.verTodos} onPress={() => router.push('/registro/cursos')} accessibilityRole="link">
            Ver todos
          </Text>
        </View>

        {cursos.length === 0 && (
          <Text style={s.cursoNota}>Aún no tienes cursos. Toca «Ver todos» para agregarlos.</Text>
        )}
        {cursos.map((c) => (
          <Pressable key={c.id} accessibilityRole="button" onPress={() => abrirTutor(c.nombre)} style={s.curso}>
            <View style={s.cursoFila}>
              <Text style={s.cursoNombre}>{c.nombre}</Text>
              <Text style={s.cursoPct}>{c.avance}%</Text>
            </View>
            <BarraAvance valor={c.avance} />
            <Text style={s.cursoNota}>{nota(c)}</Text>
          </Pressable>
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
  evento: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radio.lg,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    backgroundColor: color.fondo.superficie,
  },
  eventoIcono: { width: 36, height: 36, borderRadius: radio.md, backgroundColor: color.fondo.suave, alignItems: 'center', justifyContent: 'center' },
  eventoTitulo: { fontFamily: fuente.tituloBold, fontSize: 14, color: color.texto.principal },
  eventoFecha: { fontFamily: fuente.cuerpoMedio, fontSize: 12, color: color.texto.acento },
  salir: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  recomendacion: { fontFamily: fuente.cuerpo, fontSize: 14, lineHeight: 20, color: color.texto.heroSuave },
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
  cursoFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cursoNombre: { fontFamily: fuente.titulo, fontSize: 16, color: color.texto.principal },
  cursoPct: { fontFamily: fuente.cuerpo, fontSize: 13, color: color.texto.secundario },
  cursoNota: { fontFamily: fuente.cuerpo, fontSize: 13, color: color.texto.secundario },
});
