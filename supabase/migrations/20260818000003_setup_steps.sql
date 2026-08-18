-- Registra qué secciones de la puesta en marcha ya confirmó el administrador.
alter table public.settings
  add column if not exists setup_steps text[] not null default '{}';
