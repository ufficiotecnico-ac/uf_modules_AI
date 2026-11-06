---
label: wayfinder:map
---

# Dashboard moduli scuola

## Destination

> **Raggiunta**: la specifica di consegna è in `SPEC.md` (radice del progetto), con `GLOSSARY.md`. Nessun ticket aperto. Per riprendere il lavoro in una nuova sessione: leggere `CLAUDE.md`.

Una **specifica di handoff** pronta da implementare: dashboard a griglia di moduli compilabili dai colleghi della scuola, ogni modulo ha una propria pagina di compilazione, l'invio viene salvato su Supabase. La specifica fissa: modello di accesso (login), modello dati e regole RLS su Supabase, flusso UX griglia → pagina modulo → invio, e piano di deploy. Wayfinder pianifica soltanto: l'implementazione avviene dopo, in sessioni separate.

## Notes

- Lingua di lavoro: italiano.
- Stack già nel repo: Vite + React 19 + TypeScript, **shadcn/ui già installato** (`components.json`, `src/components/ui`; skill in `.agents/skills/shadcn`). La grafica usa shadcn.
- Backend: **Supabase** (skill `supabase:supabase` e `supabase:supabase-postgres-best-practices` da consultare per schema/RLS).
- Deploy: già configurato. Ogni commit su `main` della repo GitHub fa il deploy automatico su **Cloudflare**. Nessun lavoro di deploy da pianificare: serve solo scrivere il codice.
- Package manager: **bun** (mai npm). Comandi come `bun add`, `bunx --bun shadcn@latest ...`, `bun run dev`.
- Progetto Supabase: **OutingModules** (ref `dodmwpkjdzhyssimxtnv`, eu-west-1), database vuoto (nessuna tabella in `public`). Accesso dell'agente via server MCP `supabase-scuola`, limitato a quel progetto con `project_ref` in `.mcp.json`; il server del plugin (account-wide) è disattivato. Esiste anche un altro progetto, OutingProject: non toccarlo. Le modifiche allo schema vanno anche salvate come file di migrazione SQL in repo.
- Il primo (e per ora unico) modulo è **Uscita didattica**. I suoi campi si decidono quando si implementa la sua pagina.
- Form fissi nel codice, nessun form builder.
- Sviluppo con **TDD** (skill `mattpocock-skills:tdd`) e codice leggibile, mantenibile ed espandibile: vedi sezione 8 di `SPEC.md`.
- Accesso: email e password. Utenti creati dall'autore su Supabase (nessuna registrazione self-service); esiste un utente di test `test.utente@example.com`.
- Per ora non esiste una sezione "i miei moduli compilati" né un ruolo admin nell'app.

## Decisions so far

<!-- una riga per ticket chiuso: [titolo](tickets/file.md): gist -->

- [Ricerca: Supabase Auth con utenti creati a mano e RLS in sola scrittura](tickets/02-supabase-auth-rls-research.md): login password semplice per SPA; mail (reset/magic link) richiede SMTP custom; basta una policy INSERT per `auth.uid()`; `.insert().select()` richiede policy SELECT; anon key ok nel client.
- [Ricerca: deploy di una SPA Vite su Cloudflare Pages](tickets/01-cloudflare-pages-deploy-research.md): preset React (Vite), `dist`, nessun `_redirects` per le rotte SPA; variabili `VITE_*` per ambiente (pubbliche); da verificare al primo deploy il riconoscimento di `bun.lock`.
- [Prototipo: griglia dashboard e pagina modulo](tickets/03-griglia-dashboard-prototype.md): struttura della variante A (griglia di card con descrizione, responsive, mobile-first) con la testata "Ciao, che modulo vuoi compilare oggi?" della C; moduli futuri come card "In arrivo"; form a passi con controlli per sezione su smartphone, pagina unica su desktop; una pagina con URL proprio per ogni modulo (serve un router).
- [Modello di accesso: login e utenti](tickets/04-modello-di-accesso-grilling.md): login email+password, utenti creati dall'autore con registrazione spenta, sessione persistente e ritorno alla pagina richiesta dopo il login; nessun reset/cambio password nell'app; tabella persone con nome e cognome per la testata; utente di test creato.
- [Modello dati Supabase e regole RLS](tickets/05-modello-dati-supabase-grilling.md): una tabella per modulo con colonne tipizzate e vincoli, nomi in inglese; `people` (solo personale interno, `user_id` facoltativo) e `classes` (per anno scolastico) di sola lettura per i colleghi; accompagnatori e classi come tabelle di collegamento, solo da elenco; salvataggio tutto o niente tramite una funzione sul database, senza scritture dirette; uuid generato dal client; migrazioni additive come file in `supabase/migrations/` applicate dal server MCP.
- [Validazione e prevenzione dell'errore umano](tickets/06-validazione-e-prevenzione-errori-grilling.md): schema `zod` per modulo nel client (react-hook-form + shadcn) con le regole critiche ripetute nel database; errori in italiano sotto il campo, controllo al passaggio di sezione su mobile e all'invio su desktop, ricontrollo a ogni modifica; data di inizio non nel passato; riepilogo obbligatorio prima dell'invio; dati in corso salvati nel browser e cancellati dopo l'invio e al logout; autocompletamento delle persone con filtro locale.

## Not yet specified

- **Campi di ogni modulo** (a partire da Uscita didattica): decisi quando si implementa la rispettiva pagina, non in questa mappa.
- **Bozza sul server**: i dati in corso restano solo nel browser (decisione sulla validazione); una bozza salvata su Supabase non è prevista.
- **Accompagnatori esterni o da definire**: per ora non si possono indicare (solo persone in `people`). Si riprende se serve un testo libero o un elenco di esterni.
- **Caricamento massivo dei colleghi**: sono tanti; come creare gli utenti (script, import) si decide più avanti.
- **Reset password via mail**: richiede un SMTP personalizzato; si valuta quando serve.

## Out of scope

- **Form builder** (creare/modificare moduli da interfaccia): possibile in futuro, fuori da questo sforzo.
- **Sezione "i miei moduli compilati"** e qualunque vista delle compilazioni nell'app: fuori scopo per ora; i dati si leggono dalla dashboard Supabase.
- **Ruolo admin e workflow di approvazione**: non richiesti.
- **Cambio password da parte dell'utente** nell'app: per ora le password le gestisce l'autore dalla dashboard.
- **Notifiche all'invio** (mail o altro) e **allegati** (upload di file): fuori scopo per la prima versione; si riprendono solo se servono.
