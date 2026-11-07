import { config } from './config.js';
import { crearApp } from './app.js';

crearApp().listen(config.puerto, () => {
  console.log(`API de Rumbo en http://localhost:${config.puerto}/api`);
  console.log(`Tutor: ${config.anthropicKey ? `Claude (${config.tutorModelo})` : 'modo demo (sin ANTHROPIC_API_KEY)'}`);
});
