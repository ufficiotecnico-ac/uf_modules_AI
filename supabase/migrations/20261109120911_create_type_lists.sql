-- Elenchi di tipi per il modulo Uscita didattica. Li gestisce il gestore dalla dashboard:
-- la chiave (id) e'' in inglese, l''etichetta (name) in italiano. Le righe usate non si cancellano, si disattivano.

create table public.outing_types (
  id text primary key check (id ~ '^[a-z][a-z-]*$'),
  name text not null check (btrim(name) <> ''),
  active boolean not null default true
);

create table public.transport_types (
  id text primary key check (id ~ '^[a-z][a-z-]*$'),
  name text not null check (btrim(name) <> ''),
  active boolean not null default true
);

create table public.booking_types (
  id text primary key check (id ~ '^[a-z][a-z-]*$'),
  name text not null check (btrim(name) <> ''),
  active boolean not null default true
);

alter table public.outing_types enable row level security;
alter table public.transport_types enable row level security;
alter table public.booking_types enable row level security;

-- Prima difesa: permessi. L''app puo'' solo leggere.
revoke all on public.outing_types, public.transport_types, public.booking_types from anon, authenticated;
grant select on public.outing_types, public.transport_types, public.booking_types to authenticated;

-- Seconda difesa: RLS. Ogni utente loggato legge gli elenchi; nessuna policy di scrittura.
create policy "Utenti loggati leggono le tipologie di uscita"
  on public.outing_types for select to authenticated using (true);
create policy "Utenti loggati leggono i mezzi di trasporto"
  on public.transport_types for select to authenticated using (true);
create policy "Utenti loggati leggono i tipi di prenotazione"
  on public.booking_types for select to authenticated using (true);

-- Valori iniziali concordati con il gestore.
insert into public.outing_types (id, name) values
  ('other-project', 'Altra uscita progettuale, Progetto'),
  ('other', 'Altro'),
  ('language-course', 'Corso di lingua, stage, CLIL'),
  ('civic-education', 'Uscita Ed. Civica, Salute e benessere'),
  ('workshops-competitions', 'Esercitazioni/Laboratori/Gare'),
  ('work-based-learning', 'FSL, Visita aziendale'),
  ('exchange-erasmus', 'Scambio, gemellaggio, Mobilità Erasmus'),
  ('local-outing', 'Uscita didattica sul territorio'),
  ('sports', 'Uscita Sportiva'),
  ('trip-abroad', 'Viaggio culturale all''estero'),
  ('trip-italy', 'Viaggio culturale in Italia');

insert into public.transport_types (id, name) values
  ('train', 'Treno'),
  ('other', 'Altro');

insert into public.booking_types (id, name) values
  ('fairs', 'Fiere'),
  ('guides', 'Guide'),
  ('workshops', 'Laboratori'),
  ('other', 'Altro');
