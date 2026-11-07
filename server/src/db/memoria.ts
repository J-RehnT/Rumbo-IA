import { ahora, nuevoId } from '../lib/ids.js';
import type { Actividad, CheckIn, Conversacion, Curso, Evaluacion, Mensaje, Repositorio, Usuario } from './tipos.js';

/** Repositorio en memoria: sirve para la demo y las pruebas. Se pierde al reiniciar. */
export function crearRepositorioMemoria(): Repositorio {
  const usuarios = new Map<string, Usuario>();
  const cursos = new Map<string, Curso>();
  const evaluaciones: Evaluacion[] = [];
  const actividades = new Map<string, Actividad>();
  const checkins: CheckIn[] = [];
  const conversaciones = new Map<string, Conversacion>();
  const mensajes: Mensaje[] = [];

  return {
    usuarios: {
      async crear(d) {
        const u: Usuario = { ...d, id: nuevoId(), creadoEn: ahora() };
        usuarios.set(u.id, u);
        return u;
      },
      async porId(id) {
        return usuarios.get(id) ?? null;
      },
      async porCorreo(correo) {
        return [...usuarios.values()].find((u) => u.correo === correo) ?? null;
      },
      async actualizar(id, c) {
        const u = { ...usuarios.get(id)!, ...c };
        usuarios.set(id, u);
        return u;
      },
    },
    cursos: {
      async listar(usuarioId) {
        return [...cursos.values()].filter((c) => c.usuarioId === usuarioId);
      },
      async porId(usuarioId, id) {
        const c = cursos.get(id);
        return c && c.usuarioId === usuarioId ? c : null;
      },
      async crear(d) {
        const c: Curso = { ...d, id: nuevoId(), creadoEn: ahora() };
        cursos.set(c.id, c);
        return c;
      },
      async actualizar(usuarioId, id, cambios) {
        const c = cursos.get(id);
        if (!c || c.usuarioId !== usuarioId) return null;
        const n = { ...c, ...cambios };
        cursos.set(id, n);
        return n;
      },
      async eliminar(usuarioId, id) {
        const c = cursos.get(id);
        if (!c || c.usuarioId !== usuarioId) return false;
        cursos.delete(id);
        for (let i = evaluaciones.length - 1; i >= 0; i--) if (evaluaciones[i].cursoId === id) evaluaciones.splice(i, 1);
        for (const a of [...actividades.values()]) if (a.cursoId === id) actividades.delete(a.id);
        return true;
      },
    },
    actividades: {
      async listar(usuarioId, cursoId) {
        return [...actividades.values()]
          .filter((a) => a.usuarioId === usuarioId && (!cursoId || a.cursoId === cursoId))
          .sort((a, b) => a.fecha.localeCompare(b.fecha));
      },
      async porId(usuarioId, id) {
        const a = actividades.get(id);
        return a && a.usuarioId === usuarioId ? a : null;
      },
      async crear(d) {
        const a: Actividad = { ...d, id: nuevoId(), creadoEn: ahora() };
        actividades.set(a.id, a);
        return a;
      },
      async actualizar(usuarioId, id, cambios) {
        const a = actividades.get(id);
        if (!a || a.usuarioId !== usuarioId) return null;
        const n = { ...a, ...cambios };
        actividades.set(id, n);
        return n;
      },
      async eliminar(usuarioId, id) {
        const a = actividades.get(id);
        if (!a || a.usuarioId !== usuarioId) return false;
        actividades.delete(id);
        return true;
      },
    },
    evaluaciones: {
      async listar(usuarioId, cursoId) {
        return evaluaciones.filter((e) => e.usuarioId === usuarioId && (!cursoId || e.cursoId === cursoId));
      },
      async crear(d) {
        const e: Evaluacion = { ...d, id: nuevoId() };
        evaluaciones.push(e);
        return e;
      },
    },
    checkins: {
      async listar(usuarioId, desde) {
        return checkins.filter((c) => c.usuarioId === usuarioId && (!desde || c.fecha >= desde));
      },
      async crear(d) {
        const c: CheckIn = { ...d, id: nuevoId(), fecha: ahora() };
        checkins.push(c);
        return c;
      },
    },
    conversaciones: {
      async listar(usuarioId) {
        return [...conversaciones.values()].filter((c) => c.usuarioId === usuarioId).reverse();
      },
      async porId(usuarioId, id) {
        const c = conversaciones.get(id);
        return c && c.usuarioId === usuarioId ? c : null;
      },
      async crear(d) {
        const c: Conversacion = { ...d, id: nuevoId(), creadaEn: ahora() };
        conversaciones.set(c.id, c);
        return c;
      },
    },
    mensajes: {
      async listar(conversacionId) {
        return mensajes.filter((m) => m.conversacionId === conversacionId);
      },
      async crear(d) {
        const m: Mensaje = { ...d, id: nuevoId(), creadoEn: ahora() };
        mensajes.push(m);
        return m;
      },
    },
  };
}
