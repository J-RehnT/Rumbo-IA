import { config } from '../config.js';

export type MensajeLLM = { role: 'system' | 'user' | 'assistant'; content: string };

type Respuesta = {
  choices?: { message?: { content?: string | null }; finish_reason?: string }[];
  error?: { message?: string };
};

export const deepseekDisponible = () => !!config.deepseekKey;

/** Llama a DeepSeek (formato OpenAI). Con `json: true` pide un objeto JSON como respuesta. */
export async function llamarDeepSeek(messages: MensajeLLM[], opciones: { json?: boolean; maxTokens?: number } = {}) {
  if (!config.deepseekKey) throw new Error('Falta DEEPSEEK_API_KEY');
  const res = await fetch(`${config.deepseekUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.deepseekKey}` },
    body: JSON.stringify({
      model: config.tutorModelo,
      messages,
      max_tokens: opciones.maxTokens ?? 4000,
      stream: false,
      ...(opciones.json && { response_format: { type: 'json_object' } }),
    }),
    signal: AbortSignal.timeout(60_000),
  });
  const r = (await res.json().catch(() => ({}))) as Respuesta;
  if (!res.ok) throw new Error(`DeepSeek respondió ${res.status}: ${r.error?.message ?? res.statusText}`);
  const opcion = r.choices?.[0];
  return { texto: (opcion?.message?.content ?? '').trim(), filtrado: opcion?.finish_reason === 'content_filter' };
}
