import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
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
bienestar.get('/progreso', async (req, res) => {
  const { cursos, evaluaciones, checkins } = await estado(req.usuarioId);
  res.json({
    cursos: cursos.map((c) => vistaCurso(c, evaluaciones)),
    animo: checkins.slice(-14).map((c) => ({ fecha: c.fecha, animo: c.animo, horasSueno: c.horasSueno, carga: c.carga })),
    tarjetaApoyo: conRecursos(evaluarApoyo(checkins, cursos, evaluaciones)),
  });
});

// ---- Inicio ----
const DIA = 24 * 60 * 60 * 1000;
const hoyISO = () => new Date().toISOString().slice(0, 10);

bienestar.get('/inicio', async (req, res) => {
  const { usuario, cursos, evaluaciones, checkins } = await estado(req.usuarioId);
  const vistas = cursos.map((c) => vistaCurso(c, evaluaciones));

  const proximos = vistas
    .filter((c) => c.proximoParcial && c.proximoParcial >= hoyISO())
    .sort((a, b) => a.proximoParcial!.localeCompare(b.proximoParcial!));
  const p = proximos[0];
  const proximoParcial = p
    ? {
        cursoId: p.id,
        curso: p.nombre,
        fecha: p.proximoParcial,
        diasRestantes: Math.round((Date.parse(p.proximoParcial!) - Date.parse(hoyISO())) / DIA),
      }
    : null;

  // Curso a priorizar hoy: parcial cercano, luego el de menor promedio, luego el más difícil.
  const peso = { complicado: 2, normal: 1, facil: 0 } as const;
  const foco = [...vistas].sort((a, b) => {
    if (proximoParcial && proximoParcial.diasRestantes <= 7) {
      if (a.id === proximoParcial.cursoId) return -1;
      if (b.id === proximoParcial.cursoId) return 1;
    }
    return (a.promedio ?? 21) - (b.promedio ?? 21) || peso[b.dificultad] - peso[a.dificultad];
  })[0];
  const recomendacion = foco
    ? {
        cursoId: foco.id,
        curso: foco.nombre,
        minutos: foco.dificultad === 'complicado' ? 45 : 30,
        texto:
          proximoParcial && foco.id === proximoParcial.cursoId
            ? `Tu parcial de ${foco.nombre} es en ${proximoParcial.diasRestantes} día(s). Repasa 45 minutos con el tutor.`
            : `Dale ${foco.dificultad === 'complicado' ? 45 : 30} minutos a ${foco.nombre} hoy.`,
      }
    : null;

  const ultimo = checkins[checkins.length - 1];
  res.json({
    saludo: `Hola, ${usuario?.nombre?.split(' ')[0] ?? 'estudiante'}`,
    proximoParcial,
    recomendacion,
    checkinPendiente: !ultimo || ultimo.fecha.slice(0, 10) !== hoyISO(),
    cursos: vistas,
    apoyo: conRecursos(evaluarApoyo(checkins, cursos, evaluaciones)),
  });
});
