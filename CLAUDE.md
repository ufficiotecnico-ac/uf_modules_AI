# Moduli scuola

Applicazione web (Vite + React + TypeScript + shadcn/ui + Supabase) con una griglia di moduli che i colleghi della scuola compilano, soprattutto da smartphone. Il primo modulo è l'Uscita didattica.

## Da dove ripartire

1. Leggi [SPEC.md](./SPEC.md): è la specifica di consegna, con tutte le decisioni già prese. Non riaprire decisioni chiuse; se ne emerge una nuova, chiedila all'utente.
2. Per l'Uscita didattica leggi anche [MODULO-USCITA-DIDATTICA.md](./MODULO-USCITA-DIDATTICA.md): campi, sezioni, regole e tabelle del modulo (decisi con l'utente).
3. Leggi [GLOSSARY.md](./GLOSSARY.md) e usa quei termini (modulo, compilazione, collega, gestore, persona, classe...).
4. Le decisioni complete, le ricerche e il prototipo stanno in `.scratch/wayfinder/uscite-didattiche/` (`map.md` è l'indice). Non serve rileggerle tutte: la specifica le riassume.

## Stato attuale (aggiornare a ogni passo concluso)

- Pianificazione **conclusa** il 2026-11-06, implementazione in corso (passi 0-3 fatti).
- **Passo 0 concluso** (2026-11-09): Vitest + Testing Library + jsdom, `bun run test` (singola esecuzione) e `bun run test:watch`; setup in `src/test/setup.ts`; `src/test/smoke.test.tsx` verifica l'infrastruttura.
- **Passo 1 concluso** (2026-11-09): login email+password, sessione persistente, rotte protette con ritorno alla pagina richiesta, "Esci". Codice in `src/features/auth/` (`AuthProvider` riceve un `AuthClient`, nei test un finto in `src/test/fake-auth-client.ts`), `src/app-routes.tsx`, `src/app-shell.tsx`, `src/lib/supabase.ts`. `/` e `/modulo/:slug` sono segnaposto da sostituire (passi 3 e 5). `.env.local` esiste (non versionato). Login riuscito verificato su Supabase con l'utente di test.
- **Passo 2 concluso** (2026-11-09): tabelle `people` e `classes` con RLS di sola lettura (migrazioni in `supabase/migrations/`), dati di prova in `supabase/seed-dev.sql` (già applicati), tipi generati in `src/lib/database.types.ts` (rigenerare dopo ogni migrazione). Test sul database reale con `bun run test:db` (file `*.db.test.ts` in `src/test/db/`, login con `TEST_USER_*` di `.env.local`); `bun run test` non tocca la rete.
- **Passo 3 concluso** (2026-11-09): griglia dei moduli in `src/features/modules/` (elenco unico in `modules.ts`, `ModuleCard`, `HomePage`), saluto dalla persona collegata (`src/features/people/`: `PeopleApi` + provider + `useCurrentPerson`; nei test un finto in `src/test/fake-people-api.ts`, helper `src/test/render-app.tsx`). `/modulo/:slug` è ancora un segnaposto (passo 5). Regola: ogni account ha sempre una persona collegata.
- **Campi del modulo decisi** (2026-11-09) in MODULO-USCITA-DIDATTICA.md (ticket 07 della mappa).
- **Passo 4a concluso** (2026-11-09): tabelle di tipi `outing_types`, `transport_types`, `booking_types` (chiavi in inglese, valori iniziali nella migrazione, sola lettura per i loggati), con test in `src/test/db/type-lists.db.test.ts`.
- **Passo 4b, blocco 1 concluso** (2026-11-09): cinque tabelle del modulo (`outing_requests`, `outing_classes`, `outing_companions`, `outing_transports`, `outing_bookings`, senza accesso diretto) e funzione `submit_outing_request(payload jsonb)` (`saved` / `already_saved`, tutto o niente). Test in `src/test/db/submit-outing.db.test.ts`, payload di prova in `outing-payload.ts`. **I test lasciano righe nel database:** hanno la destinazione che inizia per `[TEST]`; l'utente le cancella dall'SQL editor con `delete from public.outing_requests where destination like '[TEST]%';` (il server MCP rifiuta i delete). I test non possono leggere le tabelle del modulo: la scrittura delle righe figlie si verifica con una query di sola lettura via MCP.
- **Passo 4b, blocco 2 concluso**: la funzione rifiuta con codici di errore stabili (`invalid_outing_type`, `invalid_lead_person`, `no_companion`, `invalid_companion`, `duplicate_person`, `no_classes`, `invalid_class` (anche di un altro anno scolastico), `duplicate_class`, `invalid_transport_type`, `invalid_booking_type`); il client li tradurrà in italiano. Test in `submit-outing-rejections.db.test.ts`. Dati di prova aggiunti in `supabase/seed-dev.sql`.
- **Prossimo passo:** passo 4b, blocco 3 (date, orari, totali, accesso). Poi i passi 5-6. Prima di scrivere test, concordare con l'utente i seam da testare (regola della skill tdd).
- Database OutingModules: vuoto, tranne l'utente di test `test.utente@example.com` (la password non è nella repo: chiedila all'utente).
- Codice: la pagina demo di Vite è stata rimossa; `src/main.tsx` monta `AppRoutes`. Il prototipo della griglia è archiviato in `.scratch/.../prototypes/griglia/` e **non** va promosso: si riscrive seguendo la specifica.

## Regole di lavoro

- **TDD** (skill `mattpocock-skills:tdd`): rosso, verde, refactor, un test per volta. Dettagli in SPEC.md sezione 8.
- Codice **leggibile, mantenibile ed espandibile**: un nuovo modulo si aggiunge senza toccare il resto, logica separata dalla grafica, niente astrazioni non richieste. Dettagli in SPEC.md sezione 8.
- Package manager **bun**, mai npm: `bun add`, `bunx --bun shadcn@latest add ...`, `bun run dev`, `bun run build`.
- Grafica solo con **shadcn/ui**; l'interfaccia è in **italiano**, il codice e i nomi del database in **inglese**.
- Supabase: lavora **solo** sul progetto OutingModules (ref `dodmwpkjdzhyssimxtnv`) tramite il server MCP `supabase-scuola` (definito in `.mcp.json`, limitato a quel progetto). **Non toccare OutingProject.** Le migrazioni sono file in `supabase/migrations/` applicati con lo strumento di migrazione del server.
- La `service_role`/secret key non va mai nel client né nella repo. La chiave pubblica sta nelle variabili `VITE_*`.
- Nessuna password o segreto nei file della repo.
- **Ogni commit su `master` fa il deploy automatico su Cloudflare** (ramo di produzione). Si lavora sul ramo `develop`.
- **Versioning:** un commit per passo (o per sotto-passo coerente), messaggi in stile Conventional Commits (`feat:`, `test:`, `chore:`, `docs:`, `fix:`), ogni commit con test verdi e `tsc` pulito, così ogni commit si può annullare da solo con `git revert`. Il commit lo crea Claude quando un passo è concluso e avvisa l'utente; **il push lo fa solo l'utente**. Mai `--force`, mai riscrivere la storia già pubblicata.
- Prima di dichiarare un passo finito: i suoi test passano e `bunx tsc -b` non dà errori.

## Da valutare più avanti

- **Gestione dello stato del form** (passo 5): valutare **valtio** o librerie simili (stato reattivo a proxy) per i dati del modulo con elenchi annidati (classi, trasporti, visite), in alternativa o insieme a `react-hook-form` previsto in SPEC.md. Decidere con l'utente prima di scrivere il form.

## Note note

- Il server MCP rifiuta i comandi SQL `drop` e `delete` (motivo ignoto): per quelli si chiede all'utente di eseguirli dall'SQL editor di Supabase. `insert`, `update`, `revoke`, `grant` e le migrazioni funzionano.
- I test di sicurezza sul database fanno tentativi di scrittura: se la sicurezza è rotta possono alterare i dati di prova. Per verificare che i test sappiano fallire, indebolire le difese **solo per il tempo della prova** e ripristinare subito.
- `bun run lint` segnala 4 errori `react-refresh/only-export-components` già presenti (file shadcn `button.tsx`, `badge.tsx`, `theme-provider.tsx` e un file in `.agents/`). Non sono dovuti al lavoro in corso.
- `src/components/ui/*` importa `cn` dal pacchetto `cn`: è una scelta presente nel progetto.
- Una sessione Claude Code nuova nasce con il server MCP del plugin Supabase (account-wide) da tenere **disattivato** da `/mcp`; si usa solo `supabase-scuola`.
