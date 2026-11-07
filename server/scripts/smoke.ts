/** Recorre todos los endpoints contra la API en memoria. Uso: npm run smoke */
import type { AddressInfo } from 'node:net';
import { crearApp } from '../src/app.js';

const server = crearApp().listen(0);
const base = `http://localhost:${(server.address() as AddressInfo).port}/api`;
let token = '';
let fallos = 0;

async function llamar(metodo: string, ruta: string, cuerpo?: unknown, esperado = 200) {
  const r = await fetch(base + ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const datos = r.status === 204 ? null : await r.json();
  const ok = r.status === esperado;
  if (!ok) fallos++;
  console.log(`${ok ? '✓' : '✗'} ${metodo} ${ruta} → ${r.status}${ok ? '' : ` (esperaba ${esperado}) ${JSON.stringify(datos)}`}`);
  return datos;
}

const enDias = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

await llamar('GET', '/salud');
await llamar('GET', '/universidades');
await llamar('GET', '/me', undefined, 401);
const reg = await llamar('POST', '/auth/registro', { nombre: 'Ana Quispe', correo: 'Ana@Uni.pe', password: 'secreta123' }, 201);
await llamar('POST', '/auth/registro', { nombre: 'Ana', correo: 'ana@uni.pe', password: 'secreta123' }, 409);
await llamar('POST', '/auth/registro', { nombre: '', correo: 'x', password: '1' }, 400);
await llamar('POST', '/auth/login', { correo: 'ana@uni.pe', password: 'mala' }, 401);
const log = await llamar('POST', '/auth/login', { correo: 'ana@uni.pe', password: 'secreta123' });
if (reg.usuario.passwordHash || log.usuario.passwordHash) throw new Error('¡Se filtró el hash!');
token = log.token;
await llamar('POST', '/auth/google', {}, 501);
await llamar('GET', '/me');
await llamar('PUT', '/me/perfil-academico', { universidad: 'XYZ', carrera: 'Sistemas', ciclo: 5 }, 400);
await llamar('PUT', '/me/perfil-academico', { universidad: 'OTRA', universidadNombre: 'UNFV', carrera: 'Sistemas', ciclo: 5 });
const perfil = await llamar('PUT', '/me/perfil-academico', { universidad: 'UNMSM', carrera: 'Ing. de Sistemas', ciclo: 5 });
console.log('   universidad:', perfil.universidad.sigla);

const [calculo, fisica] = await llamar('POST', '/cursos', [
  { nombre: 'Cálculo II', horasClase: 5, dificultad: 'complicado', proximoParcial: enDias(5) },
  { nombre: 'Física II', horasClase: 4 },
], 201);
const ed = await llamar('POST', '/cursos', { nombre: 'Estructuras de datos' }, 201);
await llamar('PATCH', `/cursos/${fisica.id}`, { dificultad: 'normal', proximoParcial: enDias(10) });
const f2 = await llamar('GET', `/cursos/${fisica.id}`);
if (f2.horasClase !== 4) throw new Error('PATCH pisó horasClase con el default');
await llamar('DELETE', `/cursos/${ed.id}`, undefined, 204);
await llamar('GET', `/cursos/${ed.id}`, undefined, 404);
await llamar('POST', `/cursos/${calculo.id}/evaluaciones`, { tipo: 'practica', nota: 8 }, 201);
await llamar('POST', `/cursos/${calculo.id}/evaluaciones`, { nota: 25 }, 400);
await llamar('GET', `/cursos/${calculo.id}/evaluaciones`);
const lista = await llamar('GET', '/cursos');
console.log('   cursos:', lista.map((c: any) => `${c.nombre} prom=${c.promedio} avance=${c.avance}`).join(' | '));

const ini = await llamar('GET', '/inicio');
console.log('   inicio:', ini.saludo, '·', ini.recomendacion?.texto, '· check-in pendiente:', ini.checkinPendiente);

const ci = await llamar('POST', '/checkins', { animo: 1, horasSueno: 5, carga: 'pesada' }, 201);
console.log('   apoyo tras check-in:', ci.apoyo.nivel, ci.apoyo.senales.join(','), '· recursos:', ci.apoyo.recursos.length);
await llamar('GET', `/checkins?desde=${enDias(-7)}`);
const prog = await llamar('GET', '/progreso');
console.log('   tarjeta:', prog.tarjetaApoyo.mostrar, prog.tarjetaApoyo.nivel);

const conv = await llamar('POST', '/tutor/conversaciones', { cursoId: calculo.id }, 201);
const m = await llamar('POST', `/tutor/conversaciones/${conv.id}/mensajes`, { texto: '¿Me das un ejemplo de integración por partes?' }, 201);
console.log('   tutor:', m.respuesta.texto.slice(0, 80));
await llamar('GET', `/tutor/conversaciones/${conv.id}/mensajes`);
await llamar('GET', '/tutor/conversaciones');
// ---- Agenda académica ----
const sync = await llamar('POST', '/actividades/sincronizar', {});
console.log(`   sincronizadas: ${sync.agregadas} actividades de la universidad (simulada)`);
const sync2 = await llamar('POST', '/actividades/sincronizar', {});
if (sync2.agregadas !== 0) throw new Error('Sincronizar dos veces no debe duplicar');
const manual = await llamar('POST', '/actividades', { cursoId: calculo.id, tipo: 'entrega_grupal', titulo: 'Proyecto final', fecha: enDias(3) }, 201);
await llamar('POST', '/actividades', { cursoId: calculo.id, tipo: 'quiz', fecha: enDias(3) }, 400);
await llamar('POST', '/actividades', { cursoId: 'no-existe', tipo: 'practica', fecha: enDias(3) }, 404);
await llamar('PATCH', `/actividades/${manual.id}`, { fecha: enDias(2), completada: false });
const agenda = await llamar('GET', '/actividades');
console.log(`   agenda: ${agenda.length} actividades · primera: ${agenda[0].titulo} de ${agenda[0].curso} en ${agenda[0].diasRestantes} día(s)`);
const ini2 = await llamar('GET', '/inicio');
console.log(`   inicio: ${ini2.proximas.length} próximas · ${ini2.recomendacion.texto}`);
await llamar('DELETE', `/actividades/${manual.id}`, undefined, 204);
await llamar('DELETE', `/actividades/${manual.id}`, undefined, 404);

const pregunta = { mensajes: [{ autor: 'estudiante', texto: 'Hola' }], contexto: { ciclo: 3, carrera: 'Economía' } };
await llamar('POST', '/tutor/preguntar', pregunta); // con sesión
const progreso = await llamar('GET', '/progreso');
if (progreso.semanas?.length !== 6) throw new Error('/progreso debe traer 6 semanas');
token = '';
await llamar('POST', '/tutor/preguntar', pregunta, 401); // sin sesión: el tutor ya no es público
await llamar('GET', '/nada', undefined, 401);

server.close();
console.log(fallos ? `\n${fallos} fallo(s)` : '\nTodo OK');
process.exit(fallos ? 1 : 0);
