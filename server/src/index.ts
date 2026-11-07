import { config } from './config.js';
import { crearApp } from './app.js';

crearApp().listen(config.puerto, () => {
  console.log(`API de Rumbo en http://localhost:${config.puerto}/api`);
  console.log(`Tutor: ${config.deepseekKey ? `DeepSeek (${config.tutorModelo})` : 'modo demo (sin DEEPSEEK_API_KEY)'}`);
});
