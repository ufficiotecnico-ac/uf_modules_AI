-- Elenco delle persone (personale interno). Lo scrive solo il gestore dalla dashboard.
create table public.people (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (btrim(first_name) <> ''),
  last_name text not null check (btrim(last_name) <> ''),
  email text unique,
  user_id uuid unique references auth.users (id) on delete set null,
  active boolean not null default true
);

comment on table public.people is 'Personale interno. Le righe usate non si cancellano: si disattivano (active = false).';

alter table public.people enable row level security;

-- Prima difesa: permessi. L''app puo'' solo leggere.
revoke all on public.people from anon, authenticated;
grant select on public.people to authenticated;

-- Seconda difesa: RLS. Ogni utente loggato legge l''elenco; non esiste nessuna policy di scrittura.
create policy "Utenti loggati leggono le persone"
  on public.people for select
  to authenticated
  using (true);
