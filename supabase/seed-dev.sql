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
