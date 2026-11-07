import { config } from '../config.js';
import type { Curso, Usuario } from '../db/tipos.js';

export type MensajeChat = { autor: 'estudiante' | 'tutor'; texto: string };
export type ContextoTutor = {
  nombre?: string | null;
  carrera?: string | null;
  ciclo?: number | null;
  curso?: Pick<Curso, 'nombre' | 'dificultad'> | null;
};

type RespuestaDeepSeek = {
  choices?: { message?: { content?: string | null }; finish_reason?: string }[];
  error?: { message?: string };
};

function promptSistema(ctx: ContextoTutor): string {
  const quien = [
    ctx.nombre && `Se llama ${ctx.nombre}.`,
    ctx.carrera && `Estudia ${ctx.carrera}.`,
    ctx.ciclo && `Está en ${ctx.ciclo}.º ciclo.`,
    ctx.curso && `Ahora pregunta sobre ${ctx.curso.nombre}, un curso que siente ${ctx.curso.dificultad}.`,
  ]
    .filter(Boolean)
    .join(' ');
  return `Eres Rumbo, un tutor universitario peruano, cálido y paciente. Respondes en español neutro y cercano.
${quien}
Adapta la profundidad a su ciclo: en ciclos iniciales usa analogías y pasos pequeños; en ciclos avanzados puedes ser más técnico.
Explica paso a paso, con un ejemplo concreto, y cierra con una pregunta corta para comprobar que entendió.
Sé breve (máximo unos 150 palabras salvo que pida más). No hagas tareas evaluadas por el estudiante: guíalo para que llegue solo.
Si el estudiante expresa agobio, tristeza o estrés fuerte, valida cómo se siente y sugiere con tacto hablar con Bienestar de su universidad o la Línea 113 (opción 5).`;
}

function respuestaDemo(historial: MensajeChat[], ctx: ContextoTutor): string {
  const ultimo = historial[historial.length - 1]?.texto.toLowerCase() ?? '';
  if (ultimo.includes('simple'))
    return 'Piensa en u como la parte que se vuelve más fácil al derivarla. ln(x) se simplifica a 1/x, por eso va primero.';
  if (ultimo.includes('ejemplo'))
    return 'Otro: ∫ x·eˣ dx. Por LIATE, x (algebraica) va antes que eˣ (exponencial), así que u = x y dv = eˣ dx.';
  const ciclo = ctx.ciclo ? `${ctx.ciclo}.º ciclo` : 'tu ciclo';
  return `Buena pregunta. Te lo explico pensando en que vas en ${ciclo}${ctx.carrera ? ` de ${ctx.carrera}` : ''}: vamos paso a paso y me dices dónde te trabas.`;
}

/** Devuelve la respuesta del tutor con DeepSeek. Sin DEEPSEEK_API_KEY responde en modo demo. */
export async function responderTutor(historial: MensajeChat[], ctx: ContextoTutor): Promise<string> {
  if (!config.deepseekKey) return respuestaDemo(historial, ctx);

  const messages = [
    { role: 'system', content: promptSistema(ctx) },
    ...historial.map((m) => ({
      role: m.autor === 'estudiante' ? 'user' : 'assistant',
      content: m.texto,
    })),
  ];

  const res = await fetch(`${config.deepseekUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.deepseekKey}`,
    },
    body: JSON.stringify({ model: config.tutorModelo, messages, max_tokens: 4000, stream: false }),
    signal: AbortSignal.timeout(60_000),
  });

  const r = (await res.json().catch(() => ({}))) as RespuestaDeepSeek;
  if (!res.ok) {
    throw new Error(`DeepSeek respondió ${res.status}: ${r.error?.message ?? res.statusText}`);
  }

  const opcion = r.choices?.[0];
  if (opcion?.finish_reason === 'content_filter') {
    return 'Prefiero no responder eso, pero con gusto te ayudo con otro tema del curso.';
  }
  return (opcion?.message?.content ?? '').trim();
}

export function contextoDe(u: Usuario | null, curso?: Curso | null): ContextoTutor {
  return { nombre: u?.nombre, carrera: u?.carrera, ciclo: u?.ciclo, curso: curso ?? null };
}
