import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { ErrorApi } from './lib/errores.js';
import { requiereAuth } from './middleware/auth.js';
import { manejarErrores } from './middleware/errores.js';
import { auth } from './routes/auth.js';
import { bienestar } from './routes/bienestar.js';
import { cursos } from './routes/cursos.js';
import { me } from './routes/me.js';
import { tutor, tutorRapido } from './routes/tutor.js';
import { RECURSOS_APOYO, UNIVERSIDADES } from './services/catalogo.js';

export function crearApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '100kb' }));

  const api = express.Router();

  // Públicos
  api.get('/salud', (_req, res) => res.json({ ok: true, tutor: config.deepseekKey ? 'deepseek' : 'demo' }));
  api.get('/universidades', (_req, res) => res.json(UNIVERSIDADES));
  api.get('/recursos-apoyo', (_req, res) => res.json(RECURSOS_APOYO));
  api.use('/auth', auth);
  api.use('/tutor/preguntar', tutorRapido);

  // Con sesión
  api.use(requiereAuth);
  api.use('/me', me);
  api.use('/cursos', cursos);
  api.use('/tutor', tutor);
  api.use(bienestar); // /checkins, /progreso, /inicio

  app.use('/api', api);
  app.use(() => {
    throw new ErrorApi(404, 'ruta_no_encontrada', 'Esa ruta no existe');
  });
  app.use(manejarErrores);
  return app;
}
