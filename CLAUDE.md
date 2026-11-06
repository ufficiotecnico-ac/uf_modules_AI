# Moduli scuola

Applicazione web (Vite + React + TypeScript + shadcn/ui + Supabase) con una griglia di moduli che i colleghi della scuola compilano, soprattutto da smartphone. Il primo modulo è l'Uscita didattica.

## Da dove ripartire

1. Leggi [SPEC.md](./SPEC.md): è la specifica di consegna, con tutte le decisioni già prese. Non riaprire decisioni chiuse; se ne emerge una nuova, chiedila all'utente.
2. Leggi [GLOSSARY.md](./GLOSSARY.md) e usa quei termini (modulo, compilazione, collega, gestore, persona, classe...).
3. Le decisioni complete, le ricerche e il prototipo stanno in `.scratch/wayfinder/uscite-didattiche/` (`map.md` è l'indice). Non serve rileggerle tutte: la specifica le riassume.

## Stato attuale (aggiornare a ogni passo concluso)

- Pianificazione **conclusa** il 2026-11-06. Nessuna implementazione ancora fatta.
- **Prossimo passo:** passo 0 di SPEC.md, sezione 9 (configurare l'infrastruttura di test), poi i passi 1-6 in ordine.
- Database OutingModules: vuoto, tranne l'utente di test `test.utente@example.com` (la password non è nella repo: chiedila all'utente).
- Codice: ancora lo scaffold Vite con shadcn; `src/main.tsx` monta `App` (pagina demo). Il prototipo della griglia è archiviato in `.scratch/.../prototypes/griglia/` e **non** va promosso: si riscrive seguendo la specifica.

## Regole di lavoro

- **TDD** (skill `mattpocock-skills:tdd`): rosso, verde, refactor, un test per volta. Dettagli in SPEC.md sezione 8.
- Codice **leggibile, mantenibile ed espandibile**: un nuovo modulo si aggiunge senza toccare il resto, logica separata dalla grafica, niente astrazioni non richieste. Dettagli in SPEC.md sezione 8.
- Package manager **bun**, mai npm: `bun add`, `bunx --bun shadcn@latest add ...`, `bun run dev`, `bun run build`.
- Grafica solo con **shadcn/ui**; l'interfaccia è in **italiano**, il codice e i nomi del database in **inglese**.
- Supabase: lavora **solo** sul progetto OutingModules (ref `dodmwpkjdzhyssimxtnv`) tramite il server MCP `supabase-scuola` (definito in `.mcp.json`, limitato a quel progetto). **Non toccare OutingProject.** Le migrazioni sono file in `supabase/migrations/` applicati con lo strumento di migrazione del server.
- La `service_role`/secret key non va mai nel client né nella repo. La chiave pubblica sta nelle variabili `VITE_*`.
- Nessuna password o segreto nei file della repo.
- **Ogni commit su `main` fa il deploy automatico su Cloudflare:** non fare commit né push se l'utente non lo chiede.
- Prima di dichiarare un passo finito: i suoi test passano e `bunx tsc -b` non dà errori.

## Note note

- `bun run lint` segnala 4 errori `react-refresh/only-export-components` già presenti (file shadcn `button.tsx`, `badge.tsx`, `theme-provider.tsx` e un file in `.agents/`). Non sono dovuti al lavoro in corso.
- `src/components/ui/*` importa `cn` dal pacchetto `cn`: è una scelta presente nel progetto.
- Una sessione Claude Code nuova nasce con il server MCP del plugin Supabase (account-wide) da tenere **disattivato** da `/mcp`; si usa solo `supabase-scuola`.
