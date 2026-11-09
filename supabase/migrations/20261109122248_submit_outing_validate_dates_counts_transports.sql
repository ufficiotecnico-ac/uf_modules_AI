-- Aggiunge a submit_outing_request i controlli su campi obbligatori, date, orari, alunni e trasporti.
-- Ogni rifiuto e un errore con un codice stabile, che l app traduce in italiano.
-- La data di oggi e quella italiana: a mezzanotte il giorno cambia per i colleghi, non per il server.

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
  v_today date := (now() at time zone 'Europe/Rome')::date;
  v_start date := (payload->>'start_date')::date;
  v_end date := (payload->>'end_date')::date;
  v_multi_day boolean;
  v_year integer := extract(year from v_today)::integer;
  -- Anno scolastico in corso: da settembre ad agosto.
  v_school_year text := case
    when extract(month from v_today) >= 9 then v_year::text || '/' || (v_year + 1)::text
    else (v_year - 1)::text || '/' || v_year::text
  end;
  v_companions uuid[] := array(
    select p::uuid from jsonb_array_elements_text(coalesce(payload->'companion_ids', '[]'::jsonb)) as p
  );
  v_classes uuid[] := array(
    select (c->>'class_id')::uuid from jsonb_array_elements(coalesce(payload->'classes', '[]'::jsonb)) as c
  );
  v_item jsonb;
  v_departure_day date;
  v_return_day date;
  v_return_required boolean;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- Campi obbligatori.
  if v_start is null
     or v_end is null
     or payload->>'departure_time' is null
     or payload->>'return_time' is null
     or coalesce(btrim(payload->>'destination'), '') = ''
     or coalesce(btrim(payload->>'objective'), '') = ''
     or coalesce(btrim(payload->>'program'), '') = ''
  then
    raise exception 'missing_required_field';
  end if;

  -- Date e orari.
  if v_start < v_today then
    raise exception 'start_date_in_past';
  end if;
  if v_end < v_start then
    raise exception 'end_before_start';
  end if;
  v_multi_day := v_end > v_start;
  if not v_multi_day and (payload->>'return_time')::time <= (payload->>'departure_time')::time then
    raise exception 'return_before_departure';
  end if;

  -- Tipologia, persone e classi.
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

  -- Alunni: totale, maschi e femmine (solo per piu giorni), alunni con disabilita.
  if exists (
    select 1 from jsonb_array_elements(payload->'classes') as c
    where coalesce((c->>'students_count')::integer, 0) < 1
  ) then
    raise exception 'invalid_students_count';
  end if;
  if v_multi_day then
    if exists (
      select 1 from jsonb_array_elements(payload->'classes') as c
      where c->>'males_count' is null or c->>'females_count' is null
         or (c->>'males_count')::integer < 0 or (c->>'females_count')::integer < 0
    ) then
      raise exception 'gender_counts_required';
    end if;
    if exists (
      select 1 from jsonb_array_elements(payload->'classes') as c
      where (c->>'males_count')::integer + (c->>'females_count')::integer <> (c->>'students_count')::integer
    ) then
      raise exception 'invalid_gender_counts';
    end if;
  elsif exists (
    select 1 from jsonb_array_elements(payload->'classes') as c
    where c->>'males_count' is not null or c->>'females_count' is not null
  ) then
    raise exception 'unexpected_gender_counts';
  end if;
  if exists (
    select 1 from jsonb_array_elements(payload->'classes') as c
    where coalesce((c->>'students_with_disabilities')::integer, 0) < 0
       or coalesce((c->>'students_with_disabilities')::integer, 0) > (c->>'students_count')::integer
  ) then
    raise exception 'invalid_disabled_count';
  end if;

  -- Trasporti.
  for v_item in select value from jsonb_array_elements(coalesce(payload->'transports', '[]'::jsonb)) loop
    if not exists (
      select 1 from public.transport_types x where x.id = v_item->>'transport_type_id' and x.active
    ) then
      raise exception 'invalid_transport_type';
    end if;
    if coalesce(btrim(v_item->>'departure_place'), '') = ''
       or coalesce(btrim(v_item->>'destination'), '') = ''
       or v_item->>'departure_time' is null
    then
      raise exception 'missing_required_field';
    end if;

    v_departure_day := (v_item->>'departure_day')::date;
    v_return_day := (v_item->>'return_day')::date;
    v_return_required := coalesce((v_item->>'return_required')::boolean, false);

    if v_departure_day is null or v_departure_day not between v_start and v_end
       or (v_return_day is not null and v_return_day not between v_start and v_end) then
      raise exception 'transport_day_out_of_range';
    end if;
    if (v_return_required and v_item->>'return_time' is null)
       or (not v_return_required and (v_item->>'return_time' is not null or v_return_day is not null))
       or (v_return_day is not null and v_return_day < v_departure_day)
       or (v_return_required
           and coalesce(v_return_day, v_departure_day) = v_departure_day
           and (v_item->>'return_time')::time <= (v_item->>'departure_time')::time)
    then
      raise exception 'invalid_transport_return';
    end if;
  end loop;

  -- Visite.
  for v_item in select value from jsonb_array_elements(coalesce(payload->'bookings', '[]'::jsonb)) loop
    if not exists (
      select 1 from public.booking_types x where x.id = v_item->>'booking_type_id' and x.active
    ) then
      raise exception 'invalid_booking_type';
    end if;
    if coalesce(btrim(v_item->>'description'), '') = '' or v_item->>'time' is null then
      raise exception 'missing_required_field';
    end if;
  end loop;

  insert into public.outing_requests (
    id, user_id, outing_type_id, project, destination, start_date, end_date,
    departure_time, return_time, needs, objective, program, other_services, notes, lead_person_id
  ) values (
    v_id, v_user, payload->>'outing_type_id', nullif(btrim(payload->>'project'), ''),
    payload->>'destination', v_start, v_end,
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
  from jsonb_array_elements(payload->'classes') as c;

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
