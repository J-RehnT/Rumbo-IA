import 'dotenv/config';

export const config = {
  puerto: Number(process.env.PORT ?? 3000),
  jwtSecreto: process.env.JWT_SECRET ?? 'rumbo-dev-secreto-solo-local',
  jwtExpira: process.env.JWT_EXPIRA ?? '7d',
  bcryptRondas: Number(process.env.BCRYPT_ROUNDS ?? 10),
  anthropicKey: process.env.ANTHROPIC_API_KEY || undefined,
  tutorModelo: process.env.TUTOR_MODELO ?? 'claude-opus-5-5',
  tutorEsfuerzo: (process.env.TUTOR_ESFUERZO ?? 'low') as 'low' | 'medium' | 'high',
  supabaseUrl: process.env.SUPABASE_URL || undefined,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
};

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('Falta JWT_SECRET en producción');
}
