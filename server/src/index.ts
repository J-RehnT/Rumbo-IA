import { config } from './config.js';
import { crearApp } from './app.js';
import { baseDeDatos } from './db/index.js';

crearApp().listen(config.puerto, '0.0.0.0', () => {
  console.log(`API de Rumbo en http://localhost:${config.puerto}/api`);
  console.log(`Datos: ${baseDeDatos === 'supabase' ? 'Supabase' : 'memoria (se borran al reiniciar)'}`);
  console.log(`Tutor: ${config.deepseekKey ? `DeepSeek (${config.tutorModelo})` : 'modo demo (sin DEEPSEEK_API_KEY)'}`);
});
