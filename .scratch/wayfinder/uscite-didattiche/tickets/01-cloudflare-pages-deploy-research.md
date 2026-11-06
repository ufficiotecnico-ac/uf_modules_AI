---
type: research
status: closed
assignee:
blocked-by: []
---

# Ricerca: deploy di una SPA Vite su Cloudflare Pages

## Question

Come si distribuisce una SPA Vite + React (client-side routing) su Cloudflare Pages collegato a una repo GitHub? Servono fatti da fonti primarie (documentazione Cloudflare e Vite):

- impostazioni di build (comando, cartella di output) per Vite con `bun`/`npm`;
- fallback SPA per le rotte (es. `/modulo/uscita-didattica` ricaricata dal browser);
- come passare `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (variabili d'ambiente di build);
- limiti rilevanti del piano gratuito.

Esito: file in `research/cloudflare-pages-deploy.md`.

## Resolution

Esito completo in [research/cloudflare-pages-deploy.md](../research/cloudflare-pages-deploy.md). Fatti principali:

- Build: preset "React (Vite)", cartella `dist`; con bun il comando è `bun run build`. Bun è preinstallato nel build image (`BUN_VERSION` per fissarlo). La documentazione non dice se `bun.lock` venga riconosciuto: da confermare al primo deploy (oppure `SKIP_DEPENDENCY_INSTALL=1` con `bun install --frozen-lockfile && bun run build`).
- Fallback SPA: nessuna configurazione. Senza `404.html` di primo livello in `dist`, Pages serve `/` per ogni percorso non statico, quindi il refresh sulle rotte funziona senza `_redirects`.
- Variabili `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`: in Settings > Environment variables, separate per Production e Preview. Finiscono nel bundle (pubbliche); la `service_role` non deve mai avere il prefisso `VITE_`.
- Piano gratuito: 500 build/mese, 1 build alla volta, timeout 20 min, 20.000 file per sito, 25 MiB per file; richieste statiche illimitate.
- Da controllare: se in dashboard è stato creato un Worker invece di un progetto Pages, impostazioni e limiti cambiano.
