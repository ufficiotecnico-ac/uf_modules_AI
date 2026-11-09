-- Modulo Uscita didattica: tabelle della compilazione e funzione di salvataggio.
-- I colleghi non leggono ne scrivono queste tabelle: si scrive solo da submit_outing_request.

create table public.outing_requests (
  id uuid primary key,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  outing_type_id text not null references public.outing_types (id),
  project text check (project is null or btrim(project) <> ''),
  destination text not null check (btrim(destination) <> ''),
  start_date date not null,
  end_date date not null,
  departure_time time not null,
  return_time time not null,
  needs text check (needs is null or btrim(needs) <> ''),
  objective text not null check (btrim(objective) <> ''),
  program text not null check (btrim(program) <> ''),
  other_services text check (other_services is null or btrim(other_services) <> ''),
  notes text check (notes is null or btrim(notes) <> ''),
  lead_person_id uuid not null references public.people (id),
  check (end_date >= start_date),
  -- Uscita di un solo giorno: il rientro viene dopo la partenza.
  check (end_date > start_date or return_time > departure_time)
);

create table public.outing_classes (
  outing_id uuid not null references public.outing_requests (id) on delete cascade,
  class_id uuid not null references public.classes (id),
  students_count integer not null check (students_count > 0),
  males_count integer check (males_count >= 0),
  females_count integer check (females_count >= 0),
  students_with_disabilities integer not null default 0 check (students_with_disabilities >= 0),
  primary key (outing_id, class_id),
  check (students_with_disabilities <= students_count),
  -- Maschi e femmine vanno indicati insieme e il loro totale e il numero di alunni.
  check ((males_count is null) = (females_count is null)),
  check (males_count is null or males_count + females_count = students_count)
);

create table public.outing_companions (
  outing_id uuid not null references public.outing_requests (id) on delete cascade,
  person_id uuid not null references public.people (id),
  primary key (outing_id, person_id)
);

create table public.outing_transports (
  id uuid primary key default gen_random_uuid(),
  outing_id uuid not null references public.outing_requests (id) on delete cascade,
  transport_type_id text not null references public.transport_types (id),
  departure_place text not null check (btrim(departure_place) <> ''),
  departure_day date not null,
  departure_time time not null,
  destination text not null check (btrim(destination) <> ''),
  return_required boolean not null default false,
  return_day date,
  return_time time,
  notes text check (notes is null or btrim(notes) <> ''),
  -- L orario di ritorno c e solo se il ritorno e da prenotare; il giorno di ritorno solo con un orario.
  check (return_required = (return_time is not null)),
  check (return_day is null or return_required),
  check (return_day is null or return_day >= departure_day),
  -- Ritorno lo stesso giorno: dopo la partenza.
  check (not return_required or coalesce(return_day, departure_day) > departure_day or return_time > departure_time)
);

create table public.outing_bookings (
  id uuid primary key default gen_random_uuid(),
  outing_id uuid not null references public.outing_requests (id) on delete cascade,
  booking_type_id text not null references public.booking_types (id),
  description text not null check (btrim(description) <> ''),
  time time not null
);

create index outing_requests_user_id_idx on public.outing_requests (user_id);
create index outing_requests_lead_person_id_idx on public.outing_requests (lead_person_id);
create index outing_requests_outing_type_id_idx on public.outing_requests (outing_type_id);
create index outing_classes_class_id_idx on public.outing_classes (class_id);
create index outing_companions_person_id_idx on public.outing_companions (person_id);
create index outing_transports_outing_id_idx on public.outing_transports (outing_id);
create index outing_transports_transport_type_id_idx on public.outing_transports (transport_type_id);
create index outing_bookings_outing_id_idx on public.outing_bookings (outing_id);
create index outing_bookings_booking_type_id_idx on public.outing_bookings (booking_type_id);

-- Nessun accesso diretto: RLS attiva senza policy e nessun permesso per anon e authenticated.
alter table public.outing_requests enable row level security;
alter table public.outing_classes enable row level security;
alter table public.outing_companions enable row level security;
alter table public.outing_transports enable row level security;
alter table public.outing_bookings enable row level security;

revoke all on public.outing_requests, public.outing_classes, public.outing_companions,
  public.outing_transports, public.outing_bookings from anon, authenticated;

-- Funzione di salvataggio: scrive tutto o niente in una sola transazione.
-- SECURITY DEFINER con search_path vuoto: richiede un utente loggato e usa auth.uid() come autore.
create function public.submit_outing_request(payload jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := (payload->>'id')::uuid;
  v_user uuid := auth.uid();
  v_inserted integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  insert into public.outing_requests (
    id, user_id, outing_type_id, project, destination, start_date, end_date,
    departure_time, return_time, needs, objective, program, other_services, notes, lead_person_id
  ) values (
    v_id, v_user, payload->>'outing_type_id', nullif(btrim(payload->>'project'), ''),
    payload->>'destination', (payload->>'start_date')::date, (payload->>'end_date')::date,
    (payload->>'departure_time')::time, (payload->>'return_time')::time,
    nullif(btrim(payload->>'needs'), ''), payload->>'objective', payload->>'program',
    nullif(btrim(payload->>'other_services'), ''), nullif(btrim(payload->>'notes'), ''),
    (payload->>'lead_person_id')::uuid
  )
  on conflict (id) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    if exists (select 1 from public.outing_requests where id = v_id and user_id = v_user) then
      return 'already_saved';
    end if;
    raise exception 'id_conflict' using errcode = '23505';
  end if;

  insert into public.outing_classes (
    outing_id, class_id, students_count, males_count, females_count, students_with_disabilities
  )
  select v_id, (c->>'class_id')::uuid, (c->>'students_count')::integer,
    (c->>'males_count')::integer, (c->>'females_count')::integer,
    coalesce((c->>'students_with_disabilities')::integer, 0)
  from jsonb_array_elements(coalesce(payload->'classes', '[]'::jsonb)) as c;

  insert into public.outing_companions (outing_id, person_id)
  select v_id, p::uuid
  from jsonb_array_elements_text(coalesce(payload->'companion_ids', '[]'::jsonb)) as p;

  insert into public.outing_transports (
    outing_id, transport_type_id, departure_place, departure_day, departure_time,
    destination, return_required, return_day, return_time, notes
  )
  select v_id, t->>'transport_type_id', t->>'departure_place', (t->>'departure_day')::date,
    (t->>'departure_time')::time, t->>'destination',
    coalesce((t->>'return_required')::boolean, false), (t->>'return_day')::date,
    (t->>'return_time')::time, nullif(btrim(t->>'notes'), '')
  from jsonb_array_elements(coalesce(payload->'transports', '[]'::jsonb)) as t;

  insert into public.outing_bookings (outing_id, booking_type_id, description, time)
  select v_id, b->>'booking_type_id', b->>'description', (b->>'time')::time
  from jsonb_array_elements(coalesce(payload->'bookings', '[]'::jsonb)) as b;

  return 'saved';
end;
$$;

revoke all on function public.submit_outing_request(jsonb) from public, anon;
grant execute on function public.submit_outing_request(jsonb) to authenticated;
