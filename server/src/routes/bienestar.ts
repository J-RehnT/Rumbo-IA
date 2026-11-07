import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { diasHasta, hoyLima } from '../lib/fechas.js';
import { evaluarApoyo } from '../services/apoyo.js';
import { RECURSOS_APOYO } from '../services/catalogo.js';
import { vistaCurso } from './cursos.js';

/** Check-in, Mi progreso e Inicio: todo lo que depende del estado del estudiante. */
export const bienestar = Router();

async function estado(usuarioId: string) {
  const [usuario, cursos, evaluaciones, checkins] = await Promise.all([
    db.usuarios.porId(usuarioId),
    db.cursos.listar(usuarioId),
    db.evaluaciones.listar(usuarioId),
    db.checkins.listar(usuarioId),
  ]);
  return { usuario, cursos, evaluaciones, checkins };
}

function conRecursos(apoyo: ReturnType<typeof evaluarApoyo>) {
  return { ...apoyo, recursos: apoyo.mostrar ? RECURSOS_APOYO : [] };
}

// ---- Check-in ----
const checkin = z.object({
  animo: z.number().int().min(0).max(4), // 0 Agotado … 4 Genial
  horasSueno: z.number().min(0).max(24),
  carga: z.enum(['ligera', 'normal', 'pesada']),
  nota: z.string().trim().max(500).optional(),
});

bienestar.post('/checkins', async (req, res) => {
  const d = checkin.parse(req.body);
  const c = await db.checkins.crear({ ...d, animo: d.animo as 0 | 1 | 2 | 3 | 4, nota: d.nota ?? null, usuarioId: req.usuarioId });
  const { cursos, evaluaciones, checkins } = await estado(req.usuarioId);
  const { usuarioId: _u, ...vista } = c;
  // La sugerencia viaja en la misma respuesta para mostrarla al cerrar el check-in.
  res.status(201).json({ checkin: vista, apoyo: conRecursos(evaluarApoyo(checkins, cursos, evaluaciones)) });
});

bienestar.get('/checkins', async (req, res) => {
  const desde = z.iso.date().optional().parse(req.query.desde);
  const lista = await db.checkins.listar(req.usuarioId, desde);
  res.json(lista.map(({ usuarioId: _u, ...c }) => c));
});

// ---- Mi progreso ----
const SEMANA_MS = 7 * 24 * 60 * 60 * 1000;
const SEMANAS = 6;

/** Últimas 6 semanas (S1 la más antigua): aciertos = nota/20 y bienestar = ánimo/4, o null sin datos. */
function semanas(evaluaciones: { fecha: string; nota: number }[], checkins: { fecha: string; animo: number }[]) {
  const ahora = Date.now();
  const indice = (fecha: string) => SEMANAS - 1 - Math.floor((ahora - Date.parse(fecha)) / SEMANA_MS);
  const prom = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100 : null);
  return Array.from({ length: SEMANAS }, (_, i) => ({
    semana: `S${i + 1}`,
    aciertos: prom(evaluaciones.filter((e) => indice(e.fecha) === i).map((e) => e.nota / 20)),
    bienestar: prom(checkins.filter((c) => indice(c.fecha) === i).map((c) => c.animo / 4)),
  }));
}

bienestar.get('/progreso', async (req, res) => {
  const { cursos, evaluaciones, checkins } = await estado(req.usuarioId);
  res.json({
    cursos: cursos.map((c) => vistaCurso(c, evaluaciones)),
    semanas: semanas(evaluaciones, checkins),
    animo: checkins.slice(-14).map((c) => ({ fecha: c.fecha, animo: c.animo, horasSueno: c.horasSueno, carga: c.carga })),
    tarjetaApoyo: conRecursos(evaluarApoyo(checkins, cursos, evaluaciones)),
  });
});

// ---- Inicio ----
const cuando = (d: number) => (d <= 0 ? 'hoy' : d === 1 ? 'mañana' : `en ${d} días`);

bienestar.get('/inicio', async (req, res) => {
  const { usuario, cursos, evaluaciones, checkins } = await estado(req.usuarioId);
  // Si falta actualizar la base de datos (tabla actividades), Inicio sigue funcionando sin agenda.
  const agenda = await db.actividades.listar(req.usuarioId).catch(() => []);
  const vistas = cursos.map((c) => vistaCurso(c, evaluaciones));
  const hoy = hoyLima();

  // Próximos eventos: la agenda pendiente + el parcial "suelto" que algún curso tenga cargado.
  const eventos = agenda
    .filter((a) => !a.completada && a.fecha >= hoy)
    .map((a) => ({ id: a.id, cursoId: a.cursoId, curso: vistas.find((c) => c.id === a.cursoId)?.nombre ?? 'Curso', tipo: a.tipo, titulo: a.titulo, fecha: a.fecha }));
  for (const c of vistas) {
    if (c.proximoParcial && c.proximoParcial >= hoy && !eventos.some((e) => e.cursoId === c.id && e.tipo === 'parcial')) {
      eventos.push({ id: `parcial-${c.id}`, cursoId: c.id, curso: c.nombre, tipo: 'parcial', titulo: 'Examen parcial', fecha: c.proximoParcial });
    }
  }
  eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));
  const proximas = eventos.slice(0, 5).map((e) => ({ ...e, diasRestantes: diasHasta(e.fecha) }));

  const evaluacion = eventos.find((e) => e.tipo === 'parcial' || e.tipo === 'examen');
  const proximoParcial = evaluacion
    ? { cursoId: evaluacion.cursoId, curso: evaluacion.curso, fecha: evaluacion.fecha, diasRestantes: diasHasta(evaluacion.fecha) }
    : null;

  // Lo más urgente (dentro de 7 días) manda la recomendación; si no, el curso con menor promedio.
  const urgente = proximas[0] && proximas[0].diasRestantes <= 7 ? proximas[0] : null;
  const peso = { complicado: 2, normal: 1, facil: 0 } as const;
  const foco = [...vistas].sort((a, b) => {
    if (urgente) {
      if (a.id === urgente.cursoId) return -1;
      if (b.id === urgente.cursoId) return 1;
    }
    return (a.promedio ?? 21) - (b.promedio ?? 21) || peso[b.dificultad] - peso[a.dificultad];
  })[0];

  const textoUrgente = (e: NonNullable<typeof urgente>) =>
    e.tipo === 'entrega_grupal'
      ? `La entrega «${e.titulo}» de ${e.curso} vence ${cuando(e.diasRestantes)}. Coordina con tu equipo y avanza hoy.`
      : e.tipo === 'practica'
        ? `Tienes «${e.titulo}» de ${e.curso} ${cuando(e.diasRestantes)}. Practica 30 minutos con el tutor.`
        : `Tu evaluación «${e.titulo}» de ${e.curso} es ${cuando(e.diasRestantes)}. Repasa 45 minutos con el tutor.`;

  const recomendacion = foco
    ? {
        cursoId: foco.id,
        curso: foco.nombre,
        minutos: foco.dificultad === 'complicado' ? 45 : 30,
        texto:
          urgente && foco.id === urgente.cursoId
            ? textoUrgente(urgente)
            : `Dale ${foco.dificultad === 'complicado' ? 45 : 30} minutos a ${foco.nombre} hoy.`,
      }
    : null;

  const ultimo = checkins[checkins.length - 1];
  res.json({
    saludo: `Hola, ${usuario?.nombre?.split(' ')[0] ?? 'estudiante'}`,
    proximoParcial,
    proximas,
    recomendacion,
    checkinPendiente: !ultimo || ultimo.fecha.slice(0, 10) !== hoy,
    cursos: vistas,
    apoyo: conRecursos(evaluarApoyo(checkins, cursos, evaluaciones)),
  });
});
