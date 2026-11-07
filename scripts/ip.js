// Muestra la IP de tu PC en la red local y las URLs para el .env de la app (Expo Go).
// Uso: npm run ip
const os = require('os');

const candidatas = Object.entries(os.networkInterfaces())
  .flatMap(([nombre, ifaces]) => (ifaces ?? []).map((i) => ({ nombre, ...i })))
  .filter((i) => i.family === 'IPv4' && !i.internal && !i.address.startsWith('169.254.'));

if (candidatas.length === 0) {
  console.log('No encontré una red local. Conéctate al Wi-Fi e inténtalo de nuevo.');
  process.exit(1);
}

for (const i of candidatas) {
  console.log(`\n${i.nombre}: ${i.address}`);
  console.log(`  EXPO_PUBLIC_API_URL=http://${i.address}:3000/api`);
}
console.log('\nPega la línea de tu Wi-Fi en .env y reinicia con: npx expo start -c');
