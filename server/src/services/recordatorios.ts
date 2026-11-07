import { z } from 'zod';
import type { Actividad, CategoriaNotificacion, CheckIn, Curso, Usuario } from '../db/tipos.js';
import { diasHasta, hoyLima, sumarDias } from '../lib/fechas.js';
import { deepseekDisponible, llamarDeepSeek } from './deepseek.js';

/**
 * Arma el plan de notificaciones de los próximos días a partir de la agenda del estudiante.
 *  - Reglas fijas: aviso la noche anterior y la mañana de cada evaluación o entrega (nunca fallan).
 *  - IA (DeepSeek): mensajes propios del tutor con métodos de estudio por curso, sesiones de repaso
 *    y bienestar, adaptados a la dificultad, las notas y el ánimo. Sin clave, usa consejos de reglas.
 */

export type ItemPlan = {
  categoria: CategoriaNotificacion;
  cursoId: string | null;
  actividadId: string | null;
  titulo: string;
  texto: string;
  programadaPara: string; // ISO con zona de Lima
  origen: 'ia' | 'reglas';
};

export type ContextoPlan = {
  usuario: Usuario | null;
  cursos: (Curso & { promedio: number | null })[];
  actividades: Actividad[];
  checkins: CheckIn[];
};

const HORIZONTE_DIAS = 14;
const MAXIMO = 14;
const enLima = (fecha: string, hora: string) => `${fecha}T${hora}:00-05:00`;

const QUE_ES: Record<Actividad['tipo'], string> = {
  parcial: 'evaluación',
  examen: 'examen',
  practica: 'práctica',
  entrega_grupal: 'entrega',
};

const METODO: Record<Actividad['tipo'], { titulo: string; texto: (curso: string) => string }> = {
  parcial: {
    titulo: 'Simulacro de examen',
    texto: (c) => `Para ${c}: resuelve un examen pasado con el tiempo real y sin apuntes. Luego repasa solo lo que fallaste.`,
  },
  examen: {
    titulo: 'Repaso espaciado',
    texto: (c) => `Para el final de ${c}: repasa cada tema hoy, en 2 días y en 5 días. Recordar a intervalos fija mejor que releer.`,
  },
  practica: {
    titulo: 'Práctica activa',
    texto: (c) => `En ${c}, resuelve 5 ejercicios sin mirar la solución. Si te trabas, pide una pista al tutor en vez de la respuesta.`,
  },
  entrega_grupal: {
    titulo: 'Organiza a tu equipo',
    texto: (c) => `Para ${c}: reunión de 15 minutos, repartan tareas con responsables y fecha interna un día antes de la entrega.`,
  },
};

/** Recordatorios fijos: la noche anterior (20:00) y la mañana del día (07:00). */
function recordatoriosFijos(actividades: Actividad[], cursos: Curso[]): ItemPlan[] {
  const nombre = (id: string) => cursos.find((c) => c.id === id)?.nombre ?? 'tu curso';
  return actividades.flatMap((a) => {
    const curso = nombre(a.cursoId);
    const base = { categoria: 'recordatorio' as const, cursoId: a.cursoId, actividadId: a.id, origen: 'reglas' as const };
    const entrega = a.tipo === 'entrega_grupal';
    return [
      {
        ...base,
        titulo: `Mañana: ${a.titulo}`,
        texto: entrega
          ? `Mañana vence «${a.titulo}» de ${curso}. Confirma con tu equipo que todo esté integrado y súbelo con tiempo.`
          : `Mañana tienes «${a.titulo}» de ${curso}. Repasa lo clave hoy y duerme bien: rinde más que trasnochar.`,
        programadaPara: enLima(sumarDias(a.fecha, -1), '20:00'),
      },
      {
        ...base,
        titulo: `Hoy: ${a.titulo}`,
        texto: entrega
          ? `Hoy se entrega «${a.titulo}» de ${curso}. Revisa el formato y que estén todos los nombres del equipo.`
          : `Hoy es tu ${QUE_ES[a.tipo]} «${a.titulo}» de ${curso}. Tú puedes: confía en lo que practicaste.`,
        programadaPara: enLima(a.fecha, '07:00'),
      },
    ];
  });
}

/** Consejos por reglas cuando no hay IA: un método 3 días antes y bienestar si hace falta. */
function consejosPorReglas(ctx: ContextoPlan): ItemPlan[] {
  const items: ItemPlan[] = [];
  for (const a of ctx.actividades) {
    const curso = ctx.cursos.find((c) => c.id === a.cursoId)?.nombre ?? 'tu curso';
    const m = METODO[a.tipo];
    const dia = diasHasta(a.fecha) >= 3 ? sumarDias(a.fecha, -3) : sumarDias(hoyLima(), 0);
    items.push({
      categoria: 'metodo',
      cursoId: a.cursoId,
      actividadId: a.id,
      titulo: `${m.titulo} · ${curso}`,
      texto: m.texto(curso),
      programadaPara: enLima(dia, '18:00'),
      origen: 'reglas',
    });
  }
  const ultimo = ctx.checkins[ctx.checkins.length - 1];
  if (ultimo && (ultimo.horasSueno < 6 || ultimo.animo <= 1)) {
    items.push({
      categoria: 'bienestar',
      cursoId: null,
      actividadId: null,
      titulo: 'Hoy toca descansar bien',
      texto: 'Dormir 7 horas antes de una evaluación mejora tu memoria. Si te sientes saturado, Bienestar de tu universidad puede ayudarte.',
      programadaPara: enLima(hoyLima(), '21:30'),
      origen: 'reglas',
    });
  }
  return items;
}

const respuestaIA = z.object({
  notificaciones: z
    .array(
      z.object({
        categoria: z.enum(['recordatorio', 'metodo', 'bienestar']),
        cursoId: z.string().nullable().optional(),
        actividadId: z.string().nullable().optional(),
        titulo: z.string().min(3).max(60),
        texto: z.string().min(10).max(260),
        fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        hora: z.string().regex(/^\d{2}:\d{2}$/),
      }),
    )
    .max(12),
});

/** Mensajes escritos por la IA: métodos por curso, sesiones de estudio y bienestar. */
async function consejosPorIA(ctx: ContextoPlan): Promise<ItemPlan[]> {
  const hoy = hoyLima();
  const datos = {
    hoy,
    estudiante: { nombre: ctx.usuario?.nombre?.split(' ')[0], carrera: ctx.usuario?.carrera, ciclo: ctx.usuario?.ciclo },
    cursos: ctx.cursos.map((c) => ({ id: c.id, nombre: c.nombre, dificultad: c.dificultad, promedio: c.promedio })),
    proximas: ctx.actividades.map((a) => ({ id: a.id, cursoId: a.cursoId, tipo: a.tipo, titulo: a.titulo, fecha: a.fecha, diasRestantes: diasHasta(a.fecha) })),
    ultimosCheckins: ctx.checkins.slice(-3).map((c) => ({ animo: c.animo, horasSueno: c.horasSueno, carga: c.carga, fecha: c.fecha.slice(0, 10) })),
  };

  const pedir = () => llamarDeepSeek(
    [
      {
        role: 'system',
        content: `Eres Rumbo, el tutor de un estudiante universitario peruano. Escribes por tu cuenta mensajes cortos de notificación (como push del celular) para ayudarle a llegar preparado a sus evaluaciones.
Responde SOLO un objeto JSON con la forma {"notificaciones":[{"categoria","cursoId","actividadId","titulo","texto","fecha","hora"}]}.
Reglas:
- Entre 5 y 10 notificaciones repartidas en los próximos ${HORIZONTE_DIAS} días (fecha AAAA-MM-DD desde ${hoy}, hora HH:MM entre 07:00 y 21:30, hora de Lima).
- categoria "metodo": propone un método de estudio concreto para un curso y su evaluación (simulacro de examen, repaso espaciado, práctica de recuperación, técnica Feynman, Pomodoro, mapas conceptuales, práctica intercalada, enseñar a un compañero…). Varía los métodos entre cursos y semanas; si un curso tiene promedio bajo o es "complicado", sugiere cambiar de método.
- categoria "recordatorio": sesiones de estudio concretas ("hoy 40 min de…") unos días antes de cada evaluación o entrega. No repitas los avisos de "mañana" ni de "hoy es tu examen": esos ya existen.
- categoria "bienestar": solo si el ánimo es bajo, duerme poco o la carga es pesada; tono cálido, sin diagnosticar.
- Usa los id exactos de cursos y actividades que te doy (o null). titulo de máximo 45 caracteres, texto de máximo 180, español neutro y cercano, tutea, sin emojis.`,
      },
      { role: 'user', content: JSON.stringify(datos) },
    ],
    { json: true, maxTokens: 6000 },
  );

  // A veces el modelo devuelve vacío o texto alrededor del JSON: se extrae y se reintenta una vez.
  const leer = (texto: string) => {
    const bloque = texto.slice(texto.indexOf('{'), texto.lastIndexOf('}') + 1);
    try {
      return respuestaIA.safeParse(JSON.parse(bloque));
    } catch {
      return null;
    }
  };
  let parsed = leer((await pedir()).texto);
  if (!parsed?.success) parsed = leer((await pedir()).texto);
  if (!parsed?.success) {
    console.error('Recordatorios IA: respuesta con formato inesperado', parsed ? parsed.error.issues.slice(0, 3) : '(vacía o no es JSON)');
    return [];
  }

  const idsCurso = new Set(ctx.cursos.map((c) => c.id));
  const idsActividad = new Set(ctx.actividades.map((a) => a.id));
  return parsed.data.notificaciones.map((n) => {
    const [h, m] = n.hora.split(':').map(Number);
    const hora = `${String(Math.min(21, Math.max(7, h))).padStart(2, '0')}:${String(Math.min(59, m)).padStart(2, '0')}`;
    return {
      categoria: n.categoria,
      cursoId: n.cursoId && idsCurso.has(n.cursoId) ? n.cursoId : null,
      actividadId: n.actividadId && idsActividad.has(n.actividadId) ? n.actividadId : null,
      titulo: n.titulo.slice(0, 60),
      texto: n.texto.slice(0, 260),
      programadaPara: enLima(n.fecha, hora),
      origen: 'ia' as const,
    };
  });
}

export async function planificarRecordatorios(ctx: ContextoPlan): Promise<{ items: ItemPlan[]; origen: 'ia' | 'reglas' }> {
  const hoy = hoyLima();
  const limite = sumarDias(hoy, HORIZONTE_DIAS);
  const proximas = ctx.actividades.filter((a) => !a.completada && a.fecha >= hoy && a.fecha <= limite);
  const contexto = { ...ctx, actividades: proximas };

  let consejos: ItemPlan[] = [];
  let origen: 'ia' | 'reglas' = 'reglas';
  if (deepseekDisponible() && proximas.length > 0) {
    try {
      consejos = await consejosPorIA(contexto);
      if (consejos.length > 0) origen = 'ia';
    } catch (e) {
      console.error('Recordatorios IA:', e instanceof Error ? e.message : e);
    }
  }
  if (consejos.length === 0) consejos = consejosPorReglas(contexto);

  // Solo lo que aún no llega, dentro del horizonte; sin dos avisos a la misma hora.
  const ahora = new Date().toISOString();
  const finHorizonte = new Date(Date.parse(enLima(limite, '23:59'))).toISOString();
  const vistos = new Set<string>();
  const items = [...recordatoriosFijos(proximas, ctx.cursos), ...consejos]
    .filter((i) => {
      const t = new Date(Date.parse(i.programadaPara)).toISOString();
      if (Number.isNaN(Date.parse(i.programadaPara)) || t <= ahora || t > finHorizonte || vistos.has(t)) return false;
      vistos.add(t);
      return true;
    })
    .sort((a, b) => Date.parse(a.programadaPara) - Date.parse(b.programadaPara))
    .slice(0, MAXIMO);

  return { items, origen };
}
