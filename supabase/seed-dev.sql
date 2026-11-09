-- Dati di prova per il progetto OutingModules (non è una migrazione: si esegue a mano).
-- Da rimuovere insieme all'utente di prova quando arrivano i dati veri.

insert into public.people (first_name, last_name, email, user_id)
select 'Test', 'Utente', u.email, u.id
from auth.users u
where u.email = 'test.utente@example.com'
on conflict (user_id) do nothing;

insert into public.classes (school_year, name)
select '2026/2027', c.name
from unnest(array['1A','1B','1C','2A','2B','2C','3A','3B','3C']) as c(name)
on conflict (school_year, name) do nothing;

-- Altre persone e una classe disattivata, usate dai test della funzione di salvataggio.
insert into public.people (first_name, last_name, active) values
  ('Anna', 'Verdi', true),
  ('Luca', 'Neri', true),
  ('Sara', 'Gialli', true),
  ('Marco', 'Dismesso', false)
on conflict do nothing;

insert into public.classes (school_year, name, active) values ('2026/2027', '3D', false)
on conflict (school_year, name) do nothing;

-- Una classe di un altro anno scolastico e un tipo disattivato per ogni elenco (test dei rifiuti).
insert into public.classes (school_year, name, active) values ('2025/2026', '1A', true)
on conflict (school_year, name) do nothing;

insert into public.outing_types (id, name, active) values ('retired-test', 'Tipologia disattivata (prova)', false) on conflict (id) do nothing;
insert into public.transport_types (id, name, active) values ('retired-test', 'Mezzo disattivato (prova)', false) on conflict (id) do nothing;
insert into public.booking_types (id, name, active) values ('retired-test', 'Prenotazione disattivata (prova)', false) on conflict (id) do nothing;

-- Pulizia delle compilazioni create dai test (hanno la destinazione che inizia per "[TEST]"):
--   delete from public.outing_requests where destination like '[TEST]%';
