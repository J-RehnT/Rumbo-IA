import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import type { Curso, Usuario } from '../db/tipos.js';

export type MensajeChat = { autor: 'estudiante' | 'tutor'; texto: string };
export type ContextoTutor = {
  nombre?: string | null;
  carrera?: string | null;
  ciclo?: number | null;
  curso?: Pick<Curso, 'nombre' | 'dificultad'> | null;
};

const cliente = config.anthropicKey ? new Anthropic({ apiKey: config.anthropicKey }) : null;

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

/** Devuelve la respuesta del tutor. Sin ANTHROPIC_API_KEY responde en modo demo. */
export async function responderTutor(historial: MensajeChat[], ctx: ContextoTutor): Promise<string> {
  if (!cliente) return respuestaDemo(historial, ctx);

  const messages: Anthropic.Beta.BetaMessageParam[] = historial.map((m) => ({
    role: m.autor === 'estudiante' ? 'user' : 'assistant',
    content: m.texto,
  }));

  const r = await cliente.beta.messages.create({
    model: config.tutorModelo,
    max_tokens: 4000,
    system: promptSistema(ctx),
    output_config: { effort: config.tutorEsfuerzo },
    // Si el modelo declina por un falso positivo de seguridad, la API reintenta con otro modelo.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    messages,
  });

  if (r.stop_reason === 'refusal') {
    return 'Prefiero no responder eso, pero con gusto te ayudo con otro tema del curso.';
  }
  return r.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

export function contextoDe(u: Usuario | null, curso?: Curso | null): ContextoTutor {
  return { nombre: u?.nombre, carrera: u?.carrera, ciclo: u?.ciclo, curso: curso ?? null };
}
