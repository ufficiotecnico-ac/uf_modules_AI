# Deploy di una SPA Vite + React su Cloudflare Pages (collegato a GitHub)

Ricerca per il ticket `01-cloudflare-pages-deploy-research`. Data della consultazione: 2026-11-06.
Solo fonti primarie (documentazione Cloudflare e Vite). Ogni punto riporta la fonte; dove la documentazione tace lo dico esplicitamente ("NON DOCUMENTATO").

## Sintesi

1. Build: preset "React (Vite)" = comando `npm run build`, cartella di output `dist`. Con `bun` il comando va cambiato in `bun run build` (Vite stesso usa la cartella `dist`).
2. Fallback SPA: nessuna configurazione necessaria. Se nel build output non c'e' un `404.html` di primo livello, Pages serve `/` per ogni percorso che non corrisponde a un asset statico. Quindi `/modulo/uscita-didattica` ricaricata dal browser funziona senza `_redirects`.
3. Variabili: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` si impostano in Settings > Environment variables del progetto Pages (valide a build-time, separate per Production e Preview). Vite le incorpora nel bundle: sono pubbliche per costruzione, quindi la anon key va bene solo se la sicurezza e' demandata alle RLS di Supabase.
4. Piano gratuito: 500 build/mese, 1 build alla volta, timeout build 20 minuti, 20.000 file per sito, 25 MiB per file, 100 domini custom per progetto; richieste a risorse statiche gratuite e illimitate.
5. Punto aperto: la documentazione Pages NON documenta il rilevamento di `bun.lock`/`bun.lockb` ne' quale comando di install venga usato. Va verificato con un primo deploy o aggirato (vedi "Bun").

## 1. Impostazioni di build

| Campo | Valore | Fonte |
|---|---|---|
| Preset | "React (Vite)" | [Build configuration, Framework presets](https://developers.cloudflare.com/pages/configuration/build-configuration/) |
| Build command (preset) | `npm run build` | idem; [guida React](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/) |
| Build output directory (preset) | `dist` | idem |
| Production branch | `main` (nell'esempio della guida; configurabile in Settings > Builds > Branch control) | guida React; [GitHub integration](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/) |
| Root directory | Se non indicata, Cloudflare assume che la radice della repo sia la root del progetto; serve solo per monorepo | Build configuration |

Lato Vite: il comando di build predefinito esegue lo script `build` di `package.json` (`vite build`) e la cartella di output predefinita e' `dist`, modificabile con `build.outDir` ([Vite, Deploying a Static Site](https://vite.dev/guide/static-deploy)). Vite documenta anche la procedura "Cloudflare Pages with Git" (push su GitHub/GitLab, dashboard > Workers & Pages > Create > Pages > Git, scegliere preset o inserire a mano comando e cartella di output, sito su `https://<PROJECTNAME>.pages.dev/`).

Esito della build: Pages la considera riuscita o fallita solo dal codice di uscita del comando di build (0 = riuscita) ([Build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)). Quindi un `tsc -b && vite build` che fallisce sul type-check blocca il deploy.

Deploy automatici da GitHub: ogni push al branch di produzione genera un Production Deployment, gli altri branch generano Preview Deployments (Vite static-deploy); le pull request ricevono un URL di anteprima univoco, non creato per PR da fork ([GitHub integration](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/)). Si puo' saltare una build con il prefisso `[CI Skip]`, `[Skip CI]`, `[CF-Pages-Skip]` ecc. nel messaggio di commit (stessa pagina).

### Bun

Cosa e' documentato:

- Il build image Pages ha Bun preinstallato (versione predefinita 1.4.4, "Any version" supportata) e si sceglie la versione con la variabile d'ambiente `BUN_VERSION`; per Bun non esiste un file di versione ([Build image](https://developers.cloudflare.com/pages/configuration/build-image/)).
- La build cache Pages sa mettere in cache `.bun/install/cache` ([Build caching](https://developers.cloudflare.com/pages/configuration/build-caching/)). La cache e' richiesta dalla build system v2 o successiva.
- Le dipendenze vengono installate automaticamente all'avvio della build; per disattivare l'install automatico si imposta `SKIP_DEPENDENCY_INSTALL` a `1` o `true` e si esegue un comando di install personalizzato ([Build image, Skip dependency install](https://developers.cloudflare.com/pages/configuration/build-image/)). L'unico esempio concreto della pagina cita `npm install`.

Cosa NON e' documentato (nessuna menzione nelle pagine Pages lette):

- se `bun.lock` (testuale) o `bun.lockb` (binario) venga riconosciuto e porti a usare `bun install`;
- quale comando di install sia usato quando e' presente solo un lockfile Bun.

Nota di confronto: la documentazione di Workers Builds (prodotto diverso, non Pages) dice che la versione di npm/yarn/pnpm/Bun si imposta anche con il campo `packageManager` di `package.json` ([Workers Builds, build image](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/)). Per Pages questo campo non e' citato.

Opzioni pratiche (derivate dalla documentazione, da confermare con un primo deploy; non sono affermazioni della documentazione):

- A) Lasciare il rilevamento automatico e impostare Build command = `bun run build`. Se l'install automatico non usasse Bun, il build fallirebbe o userebbe npm: lo si vede subito dai log.
- B) Impostare `SKIP_DEPENDENCY_INSTALL=1` e Build command = `bun install --frozen-lockfile && bun run build`. Usa solo meccanismi documentati (la variabile e' documentata; Bun e' nel build image). Rende deterministico l'uso del lockfile Bun.
- In entrambi i casi fissare `BUN_VERSION` alla versione usata in locale evita sorprese quando l'immagine aggiorna il default (la documentazione dice che per strumenti come Bun gli aggiornamenti con possibili breaking change hanno 3 mesi di preavviso, [Build image](https://developers.cloudflare.com/pages/configuration/build-image/)).

Node: default 22.23.4 nella build system v3 (18.17.1 nella v2); si cambia con `NODE_VERSION` o `.nvmrc`/`.node-version` (stessa pagina). Vite non richiede variabili particolari qui.

## 2. Fallback SPA per il client-side routing

Fonte: [Serving Pages, Single-page application (SPA) rendering](https://developers.cloudflare.com/pages/configuration/serving-pages/#single-page-application-spa-rendering).

Citazione: "If your project does not include a top-level `404.html` file, Pages assumes that you are deploying a single-page application. [...] Pages' default single-page application behavior serves the root (`/`) for any incoming path that does not correspond to a static asset, allowing your application to handle routes like `/about` or `/help` client-side from within your SPA."

La guida React di Pages ripete la stessa nota ("By default, Cloudflare Pages assumes you are developing a single-page application").

Conseguenze per questo progetto:

- Un refresh su `/modulo/uscita-didattica` restituisce `/` (l'`index.html` dell'app) e React Router gestisce la rotta. Non serve `public/_redirects`.
- Condizione: non deve esistere un `404.html` di primo livello nella cartella `dist`. Con un `404.html`, Pages passa invece al comportamento "pagina non trovata" (cerca il `404.html` piu' vicino risalendo l'albero delle cartelle, [Serving Pages, Not Found behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/#not-found-behavior)) e il fallback SPA non c'e'.
- Effetto collaterale: un URL di asset inesistente (es. `/assets/vecchio.js` dopo un nuovo deploy) riceve comunque l'`index.html`, non un 404 (deduzione dal testo citato: "any incoming path that does not correspond to a static asset").
- Non e' stata trovata nella documentazione Pages una raccomandazione di usare `/* /index.html 200` in `_redirects` per le SPA; la pagina [Redirects](https://developers.cloudflare.com/pages/configuration/redirects/) elenca solo il proxying relativo come tipo di regola con stato 200. Per questo la regola esplicita non e' necessaria.

## 3. Variabili d'ambiente di build (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

Lato Cloudflare:

- Si impostano nella dashboard: Workers & Pages > progetto Pages > Settings > Environment variables ([Build configuration, Environment variables](https://developers.cloudflare.com/pages/configuration/build-configuration/)). Nella pagina dei Functions la stessa schermata e' chiamata "Variables and Secrets" ([Functions, Bindings](https://developers.cloudflare.com/pages/functions/bindings/#environment-variables)): il nome del menu varia tra le pagine, e' lo stesso posto.
- Possono essere definite "for both your production and preview environments at runtime and build-time" e sono memorizzate in chiaro (stessa pagina Bindings). Vanno quindi inserite sia per Production sia per Preview se anche le anteprime delle PR devono funzionare.
- Le variabili vanno impostate prima del deploy che le usa: essendo incorporate in fase di build, una modifica richiede una nuova build/deploy per avere effetto (conseguenza del fatto che Vite le sostituisce a build-time; la documentazione Cloudflare lo dice esplicitamente solo per i secrets: "needs to be done before a deployment that uses those secrets").
- Pages inietta in automatico `CI=true`, `CF_PAGES=1`, `CF_PAGES_COMMIT_SHA`, `CF_PAGES_BRANCH`, `CF_PAGES_URL` (sovrascrivibili) ([Build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)).
- Il tipo "Secret" (cifrato) di Pages e' descritto per i Functions (`context.env`); non e' stato trovato un testo che dica che sia leggibile dal comando di build. Per le variabili `VITE_*`, che finiscono nel bundle pubblico, comunque non ha senso trattarle come segreti.

Lato Vite ([Env Variables and Modes](https://vite.dev/guide/env-and-mode)):

- Solo le variabili con prefisso `VITE_` sono esposte al codice client, tramite `import.meta.env` (valori sempre stringhe).
- Citazione: "`VITE_*` variables should _not_ contain sensitive information such as API keys. The values of these variables are bundled into your source code at build time."
- Le variabili gia' presenti nell'ambiente quando Vite parte hanno la priorita' piu' alta e non vengono sovrascritte dai file `.env` (esempio della doc: `VITE_SOME_KEY=123 vite build`). E' il meccanismo che fa funzionare le variabili impostate nella dashboard Cloudflare senza alcun file `.env` in repo.
- Avviso "Bun users": Bun carica da solo i file `.env` in `process.env` prima dello script, e questo puo' interferire con la logica di Vite (che rispetta i valori gia' presenti in `process.env`). Nel build Cloudflare non ci sono file `.env` committati (di norma sono in `.gitignore`, i `*.local` vanno ignorati), quindi il rischio e' basso, ma se in repo ci fosse un `.env` con valori diversi andrebbe verificato quale valore vince.

Implicazione di sicurezza (da portare alla fase di design): `VITE_SUPABASE_ANON_KEY` e' per costruzione visibile a chiunque scarichi il bundle. Va bene solo se l'accesso ai dati e' protetto da Row Level Security in Supabase; la `service_role` key non deve mai avere il prefisso `VITE_` ne' stare nelle variabili di build.

## 4. Limiti rilevanti del piano gratuito

Fonte: [Pages, Limits](https://developers.cloudflare.com/pages/platform/limits/) (aggiornata 2026-09-05), salvo diversa indicazione.

| Limite | Free |
|---|---|
| Build al mese | 500 |
| Build concorrenti (per account) | 1 alla volta |
| Timeout di una build | 20 minuti |
| Domini custom per progetto | 100 |
| File per sito | 20.000 (100.000 sui piani a pagamento con `PAGES_WRANGLER_MAJOR_VERSION=4`) |
| Dimensione massima di un file | 25 MiB |
| Regole `_headers` | max 100; singolo header max 2.000 caratteri |
| Regole `_redirects` | max 2.000 statiche + 100 dinamiche (2.100 totali) |
| Preview deployments attivi | illimitati |
| Progetti per account | 100 (non aumentato di routine); nuovi progetti con restrizioni nelle prime 48 ore |
| Utenti che gestiscono il sito | illimitati |

Costi di traffico: la pagina dei limiti non indica un limite di banda. La pagina [Functions pricing](https://developers.cloudflare.com/pages/functions/pricing/) dice che "requests for static assets (those that don't invoke Functions) are free and unlimited" su tutti i piani. Se si aggiungono Pages Functions, le richieste contano sulla quota Workers Free giornaliera (azzerata a mezzanotte UTC).

Note pratiche per questo progetto: 500 build/mese con un push = una build (piu' una per ogni push su branch/PR di anteprima) e' ampiamente sufficiente per una SPA interna; per non consumarle inutilmente si puo' usare `[CI Skip]` nei commit solo-documentazione. Il fatto che sia 1 build alla volta per account significa che push ravvicinati vanno in coda.

## 5. Nota di contesto: Pages vs Workers static assets

Esiste un percorso alternativo, Workers con static assets, dove il fallback SPA si abilita esplicitamente con `assets.not_found_handling = "single-page-application"` nel file Wrangler ([Workers, Single Page Application](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)), e dove il build image documenta il campo `packageManager` per scegliere la versione di Bun ([Workers Builds, build image](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/)). Non ho trovato nelle pagine Pages lette un avviso di deprecazione di Pages; non l'ho approfondito perche' il ticket chiede Pages. Il progetto e' gia' collegato a Cloudflare tramite GitHub, quindi se in dashboard e' stato creato un progetto Pages valgono le sezioni 1-4; se e' stato creato un Worker (Workers Builds) valgono le regole del paragrafo precedente e le sezioni 1-4 vanno ricontrollate (impostazioni e limiti sono diversi).

## Domande aperte da verificare al primo deploy

1. Il build Pages con `bun.lock`/`bun.lockb` usa `bun install` in automatico? (non documentato; vedi opzioni A/B in "Bun").
2. Il build image applica il `BUN_VERSION` richiesto e la versione locale di Bun produce lo stesso lockfile?
3. Un refresh su una rotta profonda restituisce l'app e non un 404 (verifica che in `dist` non finisca un `404.html`).
4. Le variabili `VITE_*` sono presenti sia in Production sia in Preview (altrimenti le anteprime delle PR partono con `undefined`).

## Fonti consultate

- https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/
- https://developers.cloudflare.com/pages/configuration/build-configuration/
- https://developers.cloudflare.com/pages/configuration/build-image/
- https://developers.cloudflare.com/pages/configuration/build-caching/
- https://developers.cloudflare.com/pages/configuration/serving-pages/
- https://developers.cloudflare.com/pages/configuration/redirects/
- https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/
- https://developers.cloudflare.com/pages/functions/bindings/
- https://developers.cloudflare.com/pages/functions/pricing/
- https://developers.cloudflare.com/pages/platform/limits/
- https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/
- https://developers.cloudflare.com/workers/ci-cd/builds/build-image/
- https://vite.dev/guide/static-deploy
- https://vite.dev/guide/env-and-mode
