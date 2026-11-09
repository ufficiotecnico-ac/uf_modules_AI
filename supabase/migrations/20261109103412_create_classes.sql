-- Elenco delle classi per anno scolastico. A settembre il gestore copia l''elenco dell''anno precedente.
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_year text not null check (school_year ~ '^\d{4}/\d{4}$'),
  name text not null check (btrim(name) <> ''),
  active boolean not null default true,
  unique (school_year, name)
);

comment on table public.classes is 'Classi per anno scolastico (es. 2026/2027). Le righe usate non si cancellano: si disattivano (active = false).';

alter table public.classes enable row level security;

-- Prima difesa: permessi. L''app puo'' solo leggere.
revoke all on public.classes from anon, authenticated;
grant select on public.classes to authenticated;

-- Seconda difesa: RLS. Ogni utente loggato legge l''elenco; non esiste nessuna policy di scrittura.
create policy "Utenti loggati leggono le classi"
  on public.classes for select
  to authenticated
  using (true);
