# Handoff: moduli scuola

Progetto: `C:\Users\luca.bonin\Desktop\archive\ufficio-tecnico\projects\travel-module-page\ai` (no git). L'utente parla italiano; interfaccia in italiano, codice e nomi del database in inglese.

## Dove siamo

La **pianificazione (Wayfinder) è conclusa**: nessun ticket aperto, nessuna implementazione fatta. Dashboard a griglia di moduli per i colleghi della scuola (soprattutto da smartphone); l'invio si salva su Supabase. Primo modulo: Uscita didattica.

Tutto ciò che serve è già scritto nei file, non qui:
- `CLAUDE.md` (radice): punto di ingresso, regole di lavoro, stato attuale. **Leggilo per primo.**
- `SPEC.md`: specifica di consegna completa (accesso, interfaccia, validazione, modello dati, sicurezza, TDD e qualità del codice, ordine di implementazione, appendice con persone e percorsi per i test di usabilità).
- `GLOSSARY.md`: termini del dominio.
- `.scratch/wayfinder/uscite-didattiche/map.md`: indice delle decisioni; ticket in `tickets/`, ricerche in `research/`, prototipo scartato in `prototypes/griglia/`.

## Prossimo passo

Passo 0 di SPEC.md sezione 9: configurare l'infrastruttura di test (`bun run test`), poi i passi 1-6 in ordine, con TDD. L'utente non ha ancora detto di iniziare l'implementazione: chiedigli conferma e da quale passo partire.

## Stato dell'ambiente (non nei file)

- Supabase: progetto **OutingModules** (ref `dodmwpkjdzhyssimxtnv`), database vuoto tranne un utente di test `test.utente@example.com` (password consegnata in chat all'utente, **non nella repo**: chiedigliela se serve). Esiste anche OutingProject: non toccarlo.
- Il server MCP `supabase-scuola` (`.mcp.json`) è limitato a OutingModules. Il server del plugin Supabase (account-wide) deve restare **disattivato** da `/mcp`. In una nuova sessione verifica che `supabase-scuola` sia connesso.
- L'utente ha già spento "Allow new users to sign up" nella dashboard di Supabase.
- Deploy: ogni commit su `master` fa il deploy su Cloudflare. **Nessun commit/push senza richiesta esplicita.**
- Aggiunti da me al codice: `src/components/ui/card.tsx`, `badge.tsx`; creati `.env.example`, `CLAUDE.md`, `SPEC.md`, `GLOSSARY.md`; `.gitignore` esteso. `src/main.tsx` monta ancora `App` (demo Vite) nel ThemeProvider aggiunto dall'utente.
- `bun run lint` ha 4 errori preesistenti (react-refresh nei file shadcn e in `.agents`); `bunx tsc -b` passa.

## Preferenze dell'utente emerse

- Vuole risposte con raccomandazione e decisioni una alla volta; delega volentieri ("dimmi tu") quando non ha un'opinione.
- Mobile-first, riduzione dell'errore umano, semplicità. Ha semplificato più volte (accompagnatori solo da elenco, niente reset password nell'app, niente notifiche/allegati).
- Usa bun, non npm. Usa il plugin VS Code di Claude, non la CLI.

## Skill suggerite

- `mattpocock-skills:tdd`: obbligatorio per ogni passo di implementazione.
- `supabase:supabase` e `supabase:supabase-postgres-best-practices`: prima di scrivere migrazioni, RLS e la funzione di salvataggio.
- Skill `shadcn` in `.agents/skills/shadcn` (installata nel progetto): per aggiungere componenti.
- `mattpocock-skills:code-review`: a fine di ogni passo, se l'utente lo chiede.
- `mattpocock-skills:wayfinder`: solo se emerge una nuova decisione grossa da pianificare; la mappa è in `.scratch/wayfinder/uscite-didattiche/`.
