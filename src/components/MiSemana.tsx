import { router } from 'expo-router';
import { Clock, MessageCircle, Smile, TrendingDown, TrendingUp } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ANIMO_SEMANAS, ETIQUETA_ANIMO, horas, resumenSemanaPasada, simularHoras } from '../data/simulacion';
import type { Curso } from '../state/estudiante';
import { color, fuente, radio } from '../theme';

const ALTO_BARRAS = 120;

/** Sección "Mi semana" de Progreso. Todo con datos simulados (ver src/data/simulacion.ts). */
export function MiSemana({ cursos }: { cursos: Curso[] }) {
  const datos = useMemo(() => simularHoras(cursos), [cursos]);
  const resumen = useMemo(() => resumenSemanaPasada(datos), [datos]);
  const totalActual = datos.reduce((s, d) => s + d.actual, 0);
  const diferencia = totalActual - resumen.total;
  const maximo = Math.max(...datos.flatMap((d) => [d.anterior, d.actual]), 1);

  const ultimo = ANIMO_SEMANAS[ANIMO_SEMANAS.length - 1].valor;
  const penultimo = ANIMO_SEMANAS[ANIMO_SEMANAS.length - 2].valor;

  return (
    <View style={{ gap: 16 }}>
      <Text style={s.simulado}>Datos de ejemplo: así se verá cuando la app registre tus horas de estudio.</Text>

      {/* 1. Resumen de la semana pasada */}
      <View style={s.resumen}>
        <View style={s.rotulo}>
          <Clock size={16} color={color.texto.heroSuave} />
          <Text style={s.rotuloHero}>TU SEMANA PASADA</Text>
        </View>
        <Text style={s.resumenTexto}>{resumen.texto}</Text>
        <Text style={s.resumenSugerencia}>{resumen.sugerencia}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.navigate({
              pathname: '/tutor',
              params: { pregunta: `Quiero probar ${resumen.metodo.toLowerCase()} en ${resumen.curso}. ¿Cómo empiezo esta semana?` },
            })
          }
          style={s.accion}
        >
          <MessageCircle size={16} color={color.texto.principal} />
          <Text style={s.accionTexto}>Probar {resumen.metodo.toLowerCase()} con el tutor</Text>
        </Pressable>
      </View>

      {/* 2. Estado de ánimo de las últimas semanas */}
      <View style={s.tarjeta}>
        <View style={s.rotulo}>
          <Smile size={16} color={color.dato.bienestar} />
          <Text style={s.titulo}>Tu ánimo por semana</Text>
        </View>
        <View style={s.barrasAnimo} accessibilityLabel={`Ánimo de las últimas 6 semanas; esta semana: ${ETIQUETA_ANIMO[Math.round(ultimo)]}`}>
          {ANIMO_SEMANAS.map((a, i) => {
            const actual = i === ANIMO_SEMANAS.length - 1;
            return (
              <View key={a.semana} style={s.columna}>
                <Text style={s.valorAnimo}>{ETIQUETA_ANIMO[Math.round(a.valor)]}</Text>
                <View style={[s.pista, { height: ALTO_BARRAS }]}>
                  <View
                    style={[
                      s.barra,
                      { height: (a.valor / 4) * ALTO_BARRAS, backgroundColor: color.dato.bienestar, opacity: actual ? 1 : 0.45 },
                    ]}
                  />
                </View>
                <Text style={[s.semana, actual && s.semanaActual]}>{a.semana}</Text>
              </View>
            );
          })}
        </View>
        <Text style={s.nota}>
          {ultimo >= penultimo
            ? 'Tu ánimo viene subiendo desde la semana 4. Lo que estás haciendo te está funcionando.'
            : 'Tu ánimo bajó respecto a la semana pasada. Date pausas y, si lo necesitas, habla con Bienestar.'}
        </Text>
      </View>

      {/* 3. Horas por curso: esta semana vs la anterior */}
      <View style={s.tarjeta}>
        <View style={s.rotulo}>
          <Clock size={16} color={color.dato.aciertos} />
          <Text style={s.titulo}>Horas de estudio por curso</Text>
        </View>
        <View style={s.leyenda}>
          <View style={s.leyendaItem}>
            <View style={[s.muestra, { backgroundColor: color.accion.suave }]} />
            <Text style={s.leyendaTexto}>Semana pasada</Text>
          </View>
          <View style={s.leyendaItem}>
            <View style={[s.muestra, { backgroundColor: color.dato.aciertos }]} />
            <Text style={s.leyendaTexto}>Esta semana</Text>
          </View>
        </View>

        {datos.map((d) => {
          const delta = d.actual - d.anterior;
          const sube = delta >= 0;
          return (
            <View key={d.id} style={s.curso}>
              <View style={s.cursoFila}>
                <Text style={s.cursoNombre} numberOfLines={1}>
                  {d.nombre}
                </Text>
                <View style={s.delta}>
                  {sube ? <TrendingUp size={14} color={color.texto.acento} /> : <TrendingDown size={14} color={color.apoyo.accion} />}
                  <Text style={[s.deltaTexto, { color: sube ? color.texto.acento : color.apoyo.accion }]}>
                    {delta === 0 ? 'igual' : `${sube ? '+' : '−'}${horas(Math.abs(delta))}`}
                  </Text>
                </View>
              </View>
              <BarraHoras valor={d.anterior} maximo={maximo} fondo={color.accion.suave} />
              <BarraHoras valor={d.actual} maximo={maximo} fondo={color.dato.aciertos} />
            </View>
          );
        })}

        <Text style={s.nota}>
          {diferencia >= 0
            ? `Esta semana llevas ${horas(totalActual)}, ${horas(diferencia)} más que la anterior. ¡Vas mejorando!`
            : `Esta semana llevas ${horas(totalActual)}, ${horas(-diferencia)} menos que la anterior. Un bloque extra de 45 min te pone al día.`}
        </Text>
      </View>
    </View>
  );
}

function BarraHoras({ valor, maximo, fondo }: { valor: number; maximo: number; fondo: string }) {
  return (
    <View style={s.horasFila}>
      <View style={s.horasPista}>
        <View style={[s.horasBarra, { width: `${(valor / maximo) * 100}%`, backgroundColor: fondo }]} />
      </View>
      <Text style={s.horasTexto}>{horas(valor)}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  simulado: { fontFamily: fuente.cuerpo, fontSize: 12, color: color.texto.secundario, fontStyle: 'italic' },
  resumen: { gap: 10, padding: 18, borderRadius: 24, backgroundColor: color.fondo.hero },
  rotulo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rotuloHero: { fontFamily: fuente.cuerpoFuerte, fontSize: 12, letterSpacing: 1.2, color: color.texto.heroSuave },
  resumenTexto: { fontFamily: fuente.cuerpo, fontSize: 15, lineHeight: 22, color: color.texto.invertido },
  resumenSugerencia: { fontFamily: fuente.tituloBold, fontSize: 15, lineHeight: 21, color: color.texto.heroSuave },
  accion: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radio.full,
    backgroundColor: color.accion.suave,
  },
  accionTexto: { fontFamily: fuente.cuerpoFuerte, fontSize: 13, color: color.texto.principal },
  tarjeta: {
    gap: 12,
    padding: 16,
    borderRadius: radio.xl,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    backgroundColor: color.fondo.superficie,
  },
  titulo: { fontFamily: fuente.tituloBold, fontSize: 16, color: color.texto.principal },
  barrasAnimo: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  columna: { flex: 1, alignItems: 'center', gap: 6 },
  valorAnimo: { fontFamily: fuente.cuerpo, fontSize: 9, color: color.texto.secundario },
  pista: { width: '70%', maxWidth: 28, justifyContent: 'flex-end', borderRadius: 8, backgroundColor: color.dato.pista, overflow: 'hidden' },
  barra: { width: '100%', borderRadius: 8 },
  semana: { fontFamily: fuente.cuerpo, fontSize: 11, color: color.texto.secundario },
  semanaActual: { fontFamily: fuente.cuerpoFuerte, color: color.texto.principal },
  nota: { fontFamily: fuente.cuerpo, fontSize: 13, lineHeight: 18, color: color.texto.secundario },
  leyenda: { flexDirection: 'row', gap: 16 },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  muestra: { width: 14, height: 8, borderRadius: 4 },
  leyendaTexto: { fontFamily: fuente.cuerpo, fontSize: 12, color: color.texto.secundario },
  curso: { gap: 6 },
  cursoFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cursoNombre: { flex: 1, fontFamily: fuente.tituloBold, fontSize: 14, color: color.texto.principal },
  delta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deltaTexto: { fontFamily: fuente.cuerpoFuerte, fontSize: 12 },
  horasFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  horasPista: { flex: 1, height: 10, borderRadius: 5, backgroundColor: color.fondo.base, overflow: 'hidden' },
  horasBarra: { height: '100%', borderRadius: 5 },
  horasTexto: { width: 78, fontFamily: fuente.cuerpoMedio, fontSize: 12, color: color.texto.secundario, textAlign: 'right' },
});
