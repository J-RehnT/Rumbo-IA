import { BookOpen, Flag, Lightbulb, MessageCircle, TrendingUp, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { color, fuente, primitivos as p, sombra } from '../theme';
import { BarraAvance } from './BarraAvance';
import { LogoSimbolo } from './Logo';

type Paso = {
  etiqueta: string;
  Icono?: LucideIcon;
  fondo: string;
  borde?: string;
  icono: string;
  texto: string;
  barra: string;
  pista: string;
  avance: number;
};

// Mismos colores que "01 · Inicio (hero)" en Figma: de blanco a menta, luego primario y bosque.
const PASOS: Paso[] = [
  { etiqueta: 'Preguntas', Icono: MessageCircle, fondo: p.neutro0, borde: p.neutro200, icono: p.verde700, texto: p.verde950, barra: p.verde600, pista: p.neutro200, avance: 15 },
  { etiqueta: 'Entiendes', Icono: Lightbulb, fondo: p.neutro0, borde: p.neutro200, icono: p.verde700, texto: p.verde950, barra: p.verde600, pista: p.neutro200, avance: 32 },
  { etiqueta: 'Practicas', Icono: BookOpen, fondo: p.verde100, icono: p.verde700, texto: p.verde950, barra: p.verde600, pista: p.verde200, avance: 50 },
  { etiqueta: 'Mejoras', Icono: TrendingUp, fondo: p.verde200, icono: p.verde800, texto: p.verde950, barra: p.verde600, pista: p.verde100, avance: 70 },
  { etiqueta: 'Logras', Icono: Flag, fondo: p.verde600, icono: p.neutro0, texto: p.neutro0, barra: p.verde200, pista: 'rgba(255,255,255,0.3)', avance: 90 },
  { etiqueta: 'Tu rumbo', fondo: p.verde900, icono: p.verde200, texto: p.neutro0, barra: '', pista: '', avance: 100 },
];

// Medidas del diseño a 390 px de ancho; se escalan al ancho real.
const BASE = 390;
const R = 470;
const SEP = 8;
const INCLINACION = 0.5; // las tarjetas giran la mitad del ángulo del arco
const DIMS: [number, number][] = [[46, 80], [48, 94], [50, 108], [53, 122], [56, 136], [66, 156]];
const ICONOS = [21, 24, 27, 30, 33];
const ETIQUETAS = [8.5, 9, 9.5, 10, 10.5, 11.5];
const BANDAS = [p.verde100, '#D4EEDD', p.verde200, '#AEDFC2', p.verde300];

function calcular(k: number) {
  const r = (R + SEP) * k;
  const dims = DIMS.map(([w, h]) => [w * k, h * k] as const);
  const pasos = dims.slice(0, -1).map((d, i) => ((d[0] + dims[i + 1][0]) / 2 + 4 * k) / r);
  const cx = (BASE * k) / 2;
  const esquinas = (a: number, w: number, h: number) => {
    const px = cx + r * Math.sin(a);
    const py = -r * Math.cos(a);
    const g = INCLINACION * a;
    return [[-w / 2, 0], [w / 2, 0], [-w / 2, -h], [w / 2, -h]].map(([x, y]) => [
      px + x * Math.cos(g) - y * Math.sin(g),
      py + x * Math.sin(g) + y * Math.cos(g),
    ]);
  };
  const extension = (a0: number) => {
    let a = a0, min = Infinity, max = -Infinity, arriba = Infinity;
    dims.forEach(([w, h], i) => {
      esquinas(a, w, h).forEach(([x, y]) => {
        min = Math.min(min, x);
        max = Math.max(max, x);
        arriba = Math.min(arriba, y);
      });
      if (i < pasos.length) a += pasos[i];
    });
    return { min, max, arriba };
  };
  // Busca el ángulo inicial que centra el conjunto en pantalla.
  let lo = -1, hi = 0;
  for (let i = 0; i < 50; i++) {
    const m = (lo + hi) / 2;
    const e = extension(m);
    if ((e.min + e.max) / 2 < cx) lo = m;
    else hi = m;
  }
  return { r, dims, pasos, cx, a0: lo, arriba: extension(lo).arriba };
}

/** Arco de avance con seis tarjetas que crecen: de la primera duda a tu rumbo. */
export function ArcoHero({ ancho, alto }: { ancho: number; alto: number }) {
  const k = ancho / BASE;
  const { r, dims, pasos, cx, a0, arriba } = calcular(k);
  const cy = 20 * k - arriba; // la tarjeta más alta queda a 20 px del borde superior de la zona
  let a = a0;
  const radioBanda = R * k;

  return (
    <View style={{ width: ancho, height: alto }} pointerEvents="none">
      <Svg width={ancho} height={alto} style={StyleSheet.absoluteFill}>
        <Circle cx={cx} cy={cy} r={radioBanda + 30 * k} stroke={p.verde300} strokeWidth={1.5} strokeDasharray="4 6" fill="none" />
        {BANDAS.map((c, i) => (
          <Circle key={c} cx={cx} cy={cy} r={radioBanda - i * 50 * k} fill={c} />
        ))}
      </Svg>
      {PASOS.map((paso, i) => {
        const [w, h] = dims[i];
        const ang = a;
        if (i < pasos.length) a += pasos[i];
        const px = cx + r * Math.sin(ang);
        const py = cy - r * Math.cos(ang);
        const g = INCLINACION * ang;
        // El giro de RN es sobre el centro: lo calculamos desde el borde inferior apoyado en el arco.
        const centroX = px + (h / 2) * Math.sin(g);
        const centroY = py - (h / 2) * Math.cos(g);
        const final = i === PASOS.length - 1;
        return (
          <View
            key={paso.etiqueta}
            style={[
              s.tarjeta,
              sombra.tarjeta,
              {
                left: centroX - w / 2,
                top: centroY - h / 2,
                width: w,
                height: h,
                borderRadius: 14 * k,
                paddingVertical: 7 * k,
                paddingHorizontal: 4 * k,
                backgroundColor: paso.fondo,
                borderWidth: paso.borde ? 1 : 0,
                borderColor: paso.borde,
                transform: [{ rotate: `${g}rad` }],
              },
            ]}
          >
            <View style={s.zonaIcono}>
              {final ? (
                <LogoSimbolo size={46 * k} tinta={paso.icono} grosor={8} />
              ) : (
                paso.Icono && <paso.Icono size={ICONOS[i] * k} color={paso.icono} strokeWidth={2} />
              )}
            </View>
            <Text
              numberOfLines={1}
              style={[
                s.etiqueta,
                // Ajusta la etiqueta al ancho de la tarjeta (las primeras son angostas).
                { fontSize: Math.min(ETIQUETAS[i] * k, (w - 8 * k) / (paso.etiqueta.length * 0.6)), color: paso.texto },
              ]}
            >
              {paso.etiqueta}
            </Text>
            {!final && (
              <View style={{ marginTop: 5 * k, alignSelf: 'stretch' }}>
                <BarraAvance valor={paso.avance} alto={4 * k} relleno={paso.barra} pista={paso.pista} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  tarjeta: { position: 'absolute', alignItems: 'center' },
  zonaIcono: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  etiqueta: { fontFamily: fuente.titulo, color: color.texto.principal },
});
