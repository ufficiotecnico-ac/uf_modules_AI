-- Aggiunge a submit_outing_request i controlli su persone, classi e tipi.
-- Ogni rifiuto e un errore con un codice stabile, che l app traduce in italiano.

create or replace function public.submit_outing_request(payload jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := (payload->>'id')::uuid;
  v_user uuid := auth.uid();
  v_inserted integer;
  v_lead uuid := (payload->>'lead_person_id')::uuid;
  v_year integer := extract(year from current_date)::integer;
  -- Anno scolastico in corso: da settembre ad agosto.
  v_school_year text := case
    when extract(month from current_date) >= 9 then v_year::text || '/' || (v_year + 1)::text
    else (v_year - 1)::text || '/' || v_year::text
  end;
  v_companions uuid[] := array(
    select p::uuid from jsonb_array_elements_text(coalesce(payload->'companion_ids', '[]'::jsonb)) as p
  );
  v_classes uuid[] := array(
    select (c->>'class_id')::uuid from jsonb_array_elements(coalesce(payload->'classes', '[]'::jsonb)) as c
  );
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if not exists (select 1 from public.outing_types where id = payload->>'outing_type_id' and active) then
    raise exception 'invalid_outing_type';
  end if;

  if not exists (select 1 from public.people where id = v_lead and active) then
    raise exception 'invalid_lead_person';
  end if;

  if cardinality(v_companions) = 0 then
    raise exception 'no_companion';
  end if;
  if (select count(*) from public.people where id = any (v_companions) and active)
     <> (select count(distinct x) from unnest(v_companions) as x) then
    raise exception 'invalid_companion';
  end if;
  if (select count(distinct x) from unnest(v_companions) as x) <> cardinality(v_companions)
     or v_lead = any (v_companions) then
    raise exception 'duplicate_person';
  end if;

  if cardinality(v_classes) = 0 then
    raise exception 'no_classes';
  end if;
  if (select count(*) from public.classes where id = any (v_classes) and active and school_year = v_school_year)
     <> (select count(distinct x) from unnest(v_classes) as x) then
    raise exception 'invalid_class';
  end if;
  if (select count(distinct x) from unnest(v_classes) as x) <> cardinality(v_classes) then
    raise exception 'duplicate_class';
  end if;

  if exists (
    select 1 from jsonb_array_elements(coalesce(payload->'transports', '[]'::jsonb)) as t
    where not exists (
      select 1 from public.transport_types x where x.id = t->>'transport_type_id' and x.active
    )
  ) then
    raise exception 'invalid_transport_type';
  end if;

  if exists (
    select 1 from jsonb_array_elements(coalesce(payload->'bookings', '[]'::jsonb)) as b
    where not exists (
      select 1 from public.booking_types x where x.id = b->>'booking_type_id' and x.active
    )
  ) then
    raise exception 'invalid_booking_type';
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
    v_lead
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
  select v_id, unnest(v_companions);

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
