-- Esquema de Rumbo para Supabase (Postgres).
-- Pégalo en Supabase → SQL Editor → Run. Es idempotente.

create extension if not exists pgcrypto;

create table if not exists usuarios (
  id                 uuid primary key default gen_random_uuid(),
  nombre             text not null,
  correo             text not null unique,
  password_hash      text,                       -- bcrypt; null si entra con Google
  universidad_sigla  text,                       -- 'UNMSM', 'UPC', … u 'OTRA'
  universidad_nombre text,
  carrera            text,
  ciclo              smallint check (ciclo between 1 and 12),
  creado_en          timestamptz not null default now()
);

create table if not exists cursos (
  id              uuid primary key default gen_random_uuid(),
  usuario_id      uuid not null references usuarios(id) on delete cascade,
  nombre          text not null,
  horas_clase     smallint not null default 4 check (horas_clase between 0 and 40),
  dificultad      text not null default 'normal' check (dificultad in ('facil','normal','complicado')),
  proximo_parcial date,
  creado_en       timestamptz not null default now()
);
create index if not exists cursos_usuario_idx on cursos(usuario_id);

create table if not exists evaluaciones (
  id         uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  curso_id   uuid not null references cursos(id) on delete cascade,
  tipo       text not null check (tipo in ('practica','parcial','final','quiz','otro')),
  nota       numeric(4,2) not null check (nota between 0 and 20),
  fecha      date not null default current_date
);
create index if not exists evaluaciones_curso_idx on evaluaciones(curso_id);

-- Agenda académica: parciales, exámenes, prácticas y entregas de trabajo en equipo.
create table if not exists actividades (
  id         uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  curso_id   uuid not null references cursos(id) on delete cascade,
  tipo       text not null check (tipo in ('parcial','examen','practica','entrega_grupal')),
  titulo     text not null,
  fecha      date not null,
  origen     text not null default 'manual' check (origen in ('universidad','manual')),
  completada boolean not null default false,
  creado_en  timestamptz not null default now()
);
create index if not exists actividades_usuario_fecha_idx on actividades(usuario_id, fecha);
create index if not exists actividades_curso_idx on actividades(curso_id);

create table if not exists checkins (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references usuarios(id) on delete cascade,
  animo       smallint not null check (animo between 0 and 4),
  horas_sueno numeric(3,1) not null check (horas_sueno between 0 and 24),
  carga       text not null check (carga in ('ligera','normal','pesada')),
  nota        text,
  fecha       timestamptz not null default now()
);
create index if not exists checkins_usuario_fecha_idx on checkins(usuario_id, fecha);

create table if not exists conversaciones (
  id         uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  curso_id   uuid references cursos(id) on delete set null,
  titulo     text not null,
  creada_en  timestamptz not null default now()
);

create table if not exists mensajes (
  id              uuid primary key default gen_random_uuid(),
  conversacion_id uuid not null references conversaciones(id) on delete cascade,
  autor           text not null check (autor in ('estudiante','tutor')),
  texto           text not null,
  creado_en       timestamptz not null default now()
);
create index if not exists mensajes_conversacion_idx on mensajes(conversacion_id, creado_en);

-- El backend entra con la service role key y hace su propia auth (bcrypt + JWT).
-- Activamos RLS sin políticas para que nadie pueda leer estas tablas con la anon key.
alter table usuarios       enable row level security;
alter table cursos         enable row level security;
alter table evaluaciones   enable row level security;
alter table actividades    enable row level security;
alter table checkins       enable row level security;
alter table conversaciones enable row level security;
alter table mensajes       enable row level security;
