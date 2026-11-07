import { FileText, GraduationCap, Pencil, Users, type LucideIcon } from 'lucide-react-native';

export type TipoActividad = 'parcial' | 'examen' | 'practica' | 'entrega_grupal';

export const TIPOS_ACTIVIDAD: { valor: TipoActividad; etiqueta: string; Icono: LucideIcon }[] = [
  { valor: 'parcial', etiqueta: 'Parcial', Icono: FileText },
  { valor: 'examen', etiqueta: 'Examen final', Icono: GraduationCap },
  { valor: 'practica', etiqueta: 'Práctica', Icono: Pencil },
  { valor: 'entrega_grupal', etiqueta: 'Trabajo en equipo', Icono: Users },
];

export const tipoDe = (valor: TipoActividad) => TIPOS_ACTIVIDAD.find((t) => t.valor === valor) ?? TIPOS_ACTIVIDAD[0];
