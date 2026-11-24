-- Osito English: lista cerrada de personas, progreso por persona y contador de uso de la conversación.
create schema if not exists privado;

-- Correos que pueden entrar (máximo 5). Ningún cliente la lee ni la escribe: solo el servidor.
create table public.permitidos (
  email text primary key check (email = lower(email)),
  nombre text,
  creado_en timestamptz not null default now()
);
alter table public.permitidos enable row level security;

create function privado.max_cinco_permitidos() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (select count(*) from public.permitidos) >= 5 then
    raise exception 'maximo_5_personas';
  end if;
  return new;
end $$;
create trigger permitidos_max_cinco before insert on public.permitidos
  for each row execute function privado.max_cinco_permitidos();

-- ¿El correo de quien está conectado está en la lista?
create function privado.es_permitido() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.permitidos p where p.email = lower(auth.jwt() ->> 'email'));
$$;
revoke all on function privado.es_permitido() from public;
grant usage on schema privado to authenticated;
grant execute on function privado.es_permitido() to authenticated;

-- Progreso: una fila por persona.
create table public.progreso (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  datos jsonb not null default '{}'::jsonb,
  actualizado_en timestamptz not null default now()
);
alter table public.progreso enable row level security;

create policy progreso_leer on public.progreso for select to authenticated
  using ((select auth.uid()) = usuario_id and (select privado.es_permitido()));
create policy progreso_crear on public.progreso for insert to authenticated
  with check ((select auth.uid()) = usuario_id and (select privado.es_permitido()));
create policy progreso_guardar on public.progreso for update to authenticated
  using ((select auth.uid()) = usuario_id and (select privado.es_permitido()))
  with check ((select auth.uid()) = usuario_id and (select privado.es_permitido()));

-- Mensajes de conversación por persona y día, para no pasarse del cupo gratis. Solo el servidor la usa.
create table public.uso_ia (
  usuario_id uuid not null references auth.users(id) on delete cascade,
  dia date not null,
  mensajes int not null default 0,
  primary key (usuario_id, dia)
);
alter table public.uso_ia enable row level security;

-- La persona puede saber si está en la lista sin ver la lista.
create function public.puedo_entrar() returns boolean
language sql stable set search_path = '' as $$
  select privado.es_permitido();
$$;
revoke all on function public.puedo_entrar() from public, anon;
grant execute on function public.puedo_entrar() to authenticated;

-- Los correos invitados se agregan desde el panel de Supabase, en la tabla permitidos (en minúsculas).
