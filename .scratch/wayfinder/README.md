# Tracker local-markdown per Wayfinder

Nessun issue tracker configurato (repo senza git/remote), quindi mappe e ticket vivono come file Markdown.

## Layout

```
.scratch/wayfinder/<slug-mappa>/
  map.md                 la mappa (label: wayfinder:map)
  tickets/NN-<slug>.md   un ticket per file (figlio della mappa)
  research/<slug>.md     esiti dei ticket di tipo research
```

## Convenzioni

- **Nome** = il titolo (`# ...`) del file. Nel testo ci si riferisce sempre al nome, mai al numero.
- Ogni ticket ha un frontmatter:
  - `type`: `research` | `prototype` | `grilling` | `task` (equivale al label `wayfinder:<type>`)
  - `status`: `open` | `closed`
  - `assignee`: vuoto = non preso in carico; valorizzato = **claim** (si assegna PRIMA di lavorare)
  - `blocked-by`: lista di file ticket (es. `02-supabase-research.md`); vuota = sbloccato
- **Frontiera** = ticket `open`, senza `assignee`, con tutti i `blocked-by` in stato `closed`.
- **Risoluzione**: aggiungere in fondo al ticket una sezione `## Resolution` con la risposta, mettere `status: closed`, aggiungere una riga a "Decisions so far" nella mappa.
- Le sezioni della mappa sono quelle standard: Destination, Notes, Decisions so far, Not yet specified, Out of scope.
