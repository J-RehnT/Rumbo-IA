import { router } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Aviso } from '../../components/Aviso';
import { Boton } from '../../components/Boton';
import { Campo } from '../../components/Campo';
import { mensajeDeError } from '../../lib/api';
import { PantallaRegistro } from '../../components/PantallaRegistro';
import { SelectorUniversidad } from '../../components/SelectorUniversidad';
import { useEstudiante } from '../../state/estudiante';
import { color, fuente, radio } from '../../theme';

const CICLOS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function Universidad() {
  const { perfil, setPerfil, guardarPerfilAcademico } = useEstudiante();
  const [selector, setSelector] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const seguir = async () => {
    if (enviando) return;
    if (!perfil.universidad) return setError('Elige tu universidad.');
    if (!perfil.carrera.trim()) return setError('Escribe tu carrera.');
    setError(null);
    setEnviando(true);
    try {
      await guardarPerfilAcademico();
      router.push('/registro/cursos');
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <PantallaRegistro
      paso={2}
      titulo="¿Dónde estudias?"
      bajada="Adaptamos las explicaciones a tu carrera y al ciclo en el que vas."
      pie={
        <>
          <Aviso texto={error} />
          <Boton etiqueta={enviando ? 'Guardando…' : 'Continuar'} onPress={seguir} deshabilitado={enviando} />
        </>
      }
    >
      <View style={{ gap: 20 }}>
        <View style={{ gap: 8 }}>
          <Text style={s.etiqueta}>Universidad</Text>
          <Pressable accessibilityRole="button" onPress={() => setSelector(true)} style={s.selector}>
            <Text style={[s.valor, !perfil.universidad && { color: color.texto.secundario }]} numberOfLines={1}>
              {perfil.universidad
                ? perfil.universidad.sigla === 'Otra'
                  ? perfil.universidad.nombre
                  : `${perfil.universidad.sigla} · ${perfil.universidad.nombre}`
                : 'Elige tu universidad'}
            </Text>
            <ChevronDown size={20} color={color.texto.acento} />
          </Pressable>
        </View>

        <Campo
          etiqueta="Carrera"
          placeholder="Ingeniería de Sistemas"
          value={perfil.carrera}
          onChangeText={(carrera) => setPerfil({ carrera })}
          ayuda="Escríbela como figura en tu universidad."
        />

        <View style={{ gap: 10 }}>
          <Text style={s.etiqueta}>¿En qué ciclo estás?</Text>
          <View style={s.ciclos}>
            {CICLOS.map((n) => {
              const activo = n === perfil.ciclo;
              return (
                <Pressable
                  key={n}
                  accessibilityRole="button"
                  accessibilityLabel={`Ciclo ${n}`}
                  accessibilityState={{ selected: activo }}
                  onPress={() => setPerfil({ ciclo: n })}
                  style={[s.ciclo, activo && s.cicloActivo]}
                >
                  <Text style={[s.cicloTexto, activo && { color: color.texto.invertido, fontFamily: fuente.titulo }]}>{n}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={s.ayuda}>{perfil.ciclo}.º ciclo · te explicaremos con lo que ya viste en ciclos anteriores.</Text>
        </View>
      </View>

      <SelectorUniversidad
        visible={selector}
        seleccion={perfil.universidad}
        onCerrar={() => setSelector(false)}
        onElegir={(universidad) => {
          setPerfil({ universidad });
          setSelector(false);
        }}
      />
    </PantallaRegistro>
  );
}

const s = StyleSheet.create({
  etiqueta: { fontFamily: fuente.cuerpoFuerte, fontSize: 13, color: color.texto.principal },
  selector: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 16,
    paddingRight: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    backgroundColor: color.fondo.superficie,
  },
  valor: { flex: 1, fontFamily: fuente.cuerpo, fontSize: 15, color: color.texto.principal },
  ciclos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ciclo: {
    width: '14.6%',
    minWidth: 44,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: color.borde.sutil,
    backgroundColor: color.fondo.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cicloActivo: { backgroundColor: color.accion.primaria, borderColor: color.accion.primaria },
  cicloTexto: { fontFamily: fuente.tituloBold, fontSize: 16, color: color.texto.principal },
  ayuda: { fontFamily: fuente.cuerpo, fontSize: 12, color: color.texto.secundario },
});
