// Tokens exportados de Figma (Rumbo · variables Primitivos, Color, Espaciado y radios).
export const primitivos = {
  verde50: '#F2FAF5',
  verde100: '#E1F4E8',
  verde200: '#C2E8D0',
  verde300: '#92D4AD',
  verde400: '#5CB984',
  verde500: '#349A64',
  verde600: '#217A50',
  verde700: '#1A6142',
  verde800: '#154D36',
  verde900: '#0F3A29',
  verde950: '#08251A',
  neutro0: '#FFFFFF',
  neutro200: '#D6E2DB',
  neutro500: '#4A5F55',
  pizarra500: '#5B6F8C',
  calido100: '#FBEBDC',
  calido600: '#B4531A',
  calido800: '#6B3A17',
} as const;

const p = primitivos;

export const color = {
  fondo: { base: p.verde50, superficie: p.neutro0, suave: p.verde100, hero: p.verde900 },
  texto: {
    principal: p.verde950,
    secundario: p.neutro500,
    invertido: p.neutro0,
    acento: p.verde700,
    heroSuave: p.verde200,
  },
  accion: {
    primaria: p.verde600,
    primariaTexto: p.neutro0,
    suave: p.verde200,
    suaveTexto: p.verde800,
  },
  borde: { sutil: p.neutro200, acento: p.verde300 },
  apoyo: { fondo: p.calido100, accion: p.calido600, texto: p.calido800 },
  dato: { aciertos: p.verde600, bienestar: p.pizarra500, pista: p.verde100 },
} as const;

export const espacio = { 4: 4, 8: 8, 12: 12, 16: 16, 20: 20, 24: 24, 32: 32 } as const;
export const radio = { sm: 8, md: 12, lg: 16, xl: 20, full: 999 } as const;

export const fuente = {
  titulo: 'Nunito_800ExtraBold',
  tituloBold: 'Nunito_700Bold',
  cuerpo: 'Inter_400Regular',
  cuerpoMedio: 'Inter_500Medium',
  cuerpoFuerte: 'Inter_600SemiBold',
} as const;

// Estilos de texto de Figma (tamaño / alto de línea en px).
export const texto = {
  display: { fontFamily: fuente.titulo, fontSize: 44, lineHeight: 48 },
  titulo1: { fontFamily: fuente.titulo, fontSize: 26, lineHeight: 31 },
  titulo2: { fontFamily: fuente.titulo, fontSize: 18, lineHeight: 23 },
  subtitulo: { fontFamily: fuente.tituloBold, fontSize: 16, lineHeight: 21 },
  cuerpo: { fontFamily: fuente.cuerpo, fontSize: 15, lineHeight: 22 },
  cuerpoFuerte: { fontFamily: fuente.cuerpoFuerte, fontSize: 15, lineHeight: 22 },
  pie: { fontFamily: fuente.cuerpo, fontSize: 13, lineHeight: 18 },
  etiqueta: { fontFamily: fuente.cuerpoFuerte, fontSize: 12, lineHeight: 16 },
} as const;

export const sombra = {
  tarjeta: {
    shadowColor: '#08251A',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
} as const;
