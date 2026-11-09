# Specifica: moduli scuola

Specifica di consegna per l'implementazione. Nasce dalla mappa Wayfinder in `.scratch/wayfinder/uscite-didattiche/` (decisioni e ricerche complete nei ticket). I termini del dominio sono in [GLOSSARY.md](./GLOSSARY.md).

## 1. Obiettivo

Un'applicazione web da condividere con i colleghi della scuola: una **griglia di moduli** da compilare. Ogni modulo ha una **pagina dedicata** con un proprio URL. Alla fine della compilazione i dati vengono salvati su **Supabase**. Oggi esiste un solo modulo, **Uscita didattica**; altri arriveranno.

I moduli saranno compilati soprattutto da **smartphone**: il mobile è il caso primario (mobile-first). Il programma deve essere chiaro e ridurre al minimo l'errore umano.

## 2. Stack e ambiente

- Vite + React 19 + TypeScript. Package manager **bun** (mai npm): `bun add`, `bunx --bun shadcn@latest ...`, `bun run dev`.
- Grafica con **shadcn/ui** (già installato; stile `base-nova`, base-ui). Componenti presenti: button, field, input, label, select, separator, textarea, card, badge.
- Tema scuro come default (ThemeProvider già nel progetto).
- Supabase: progetto **OutingModules**, ref `dodmwpkjdzhyssimxtnv` (eu-west-1). Esiste anche un progetto OutingProject: **non toccarlo**. L'accesso dell'agente al database avviene con il server MCP `supabase-scuola`, limitato a OutingModules tramite `.mcp.json`.
- Variabili d'ambiente di build (il file `.env.example` elenca i nomi, i valori vanno in `.env.local`, che non si versiona): `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`, cioè la chiave pubblica del progetto (publishable key, formato `sb_publishable_...`, da preferire alla vecchia `anon` che Supabase dismette entro fine 2026). Sono pubbliche: la sicurezza è nelle regole RLS e nei permessi. La `service_role`/secret key non va mai nel client e non ha mai il prefisso `VITE_`.
- Deploy: ogni commit su `master` della repo GitHub fa il deploy automatico su Cloudflare Pages. Preset React (Vite), cartella `dist`, comando `bun run build`. Le rotte SPA funzionano senza `_redirects` finché in `dist` non c'è un `404.html`. Da verificare al primo deploy: il riconoscimento di `bun.lock` (altrimenti `SKIP_DEPENDENCY_INSTALL=1` con `bun install --frozen-lockfile && bun run build`) e che il progetto sia di tipo Pages e non Worker.

## 3. Accesso

- Login con **email e password** (`signInWithPassword` di supabase-js).
- Gli account li crea il **gestore**; la registrazione pubblica è **spenta**. Nessun magic link, nessun "password dimenticata", nessun cambio password nell'app: le password le gestisce il gestore dalla dashboard di Supabase. Nella schermata di login compare un messaggio fisso, sotto il pulsante di accesso: **"Hai dimenticato la password? Rivolgiti al gestore"**.
- Sessione **persistente** sul dispositivo, con pulsante "Esci".
- Senza sessione si viene portati su `/login` e, dopo l'accesso, **riportati alla pagina richiesta** (link diretti ai moduli).
- Il saluto "Ciao, <nome>" usa il nome della persona collegata all'account (`people.user_id = auth.uid()`). **Regola:** ogni account ha sempre una persona collegata, è il gestore a crearla insieme all'account. Se manca, l'app non finge: mostra "Il tuo account non è collegato a nessuna persona. Rivolgiti al gestore."

## 4. Interfaccia

**Griglia dei moduli** (pagina iniziale)
- Testata: "Ciao, <nome>, che modulo vuoi compilare oggi?".
- Griglia di schede responsive (1 colonna su telefono, più colonne sopra): icona, titolo, **descrizione** breve che chiarisce a cosa serve il modulo.
- I moduli non ancora disponibili compaiono come schede disattivate con il badge **"In arrivo"**.

**Pagina del modulo** (URL proprio, es. `/modulo/uscita-didattica`)
- **Smartphone:** form **a passi** a tutto schermo, con indicatore di avanzamento. Ogni sezione si valida prima di passare alla successiva; con errori non si va avanti. L'ultimo passo è il **riepilogo** da confermare.
- **Desktop:** form su **una sola pagina** dentro una scheda, con pulsante "Tutti i moduli" per tornare indietro. All'invio, prima dell'invio vero, una finestra **"Controlla e invia"** con i dati principali.
- Stati dell'invio: in corso (pulsante disattivato), successo (schermata di conferma con ritorno ai moduli), errore (messaggio in italiano, dati conservati, si può riprovare).
- Serve un **router** (libreria da scegliere in implementazione).

Il prototipo usa-e-getta delle tre varianti è in `.scratch/wayfinder/uscite-didattiche/prototypes/griglia/` come riferimento visivo. Non va promosso a produzione: si riscrive seguendo questa specifica.

## 5. Validazione

- Uno **schema `zod` per modulo** nel client, usato da passi mobile e pagina desktop, con `react-hook-form` e i componenti shadcn. Le regole critiche sono **ripetute** nella funzione sul database e nei vincoli.
- Errori **in italiano sotto il campo**, nello stile di shadcn (`FieldError`). Mobile: controllo al passaggio di sezione; desktop: all'invio. La pagina si sposta sul primo errore. Dopo un errore, **ogni modifica del campo ricontrolla** e la segnalazione sparisce solo quando il valore diventa valido.
- Tipi di campo: date con selettore nativo (`type="date"`), numeri con tastiera numerica e minimo/massimo, classi a selezione multipla da elenco, accompagnatori con autocompletamento.
- Regole sulle date: la **data di inizio non può essere nel passato** (si può compilare il giorno stesso); la **data di fine non può precedere l'inizio** (uguale all'inizio se l'uscita dura un giorno).
- **Autocompletamento delle persone:** l'elenco delle persone attive si carica **una volta** all'apertura del modulo e si filtra in locale ignorando accenti e maiuscole. Si può scegliere solo una persona dell'elenco; senza corrispondenza compare "Nessuna persona trovata" e il modulo non si invia. Regge fino a circa un migliaio di persone; oltre, ricerca lato server.
- **Dati in corso:** salvati nel browser (non sul server), recuperati alla riapertura, **cancellati dopo l'invio riuscito e al logout**.
- Errori restituiti dalla funzione sul database: messaggi chiari in italiano nel modulo; i dati restano compilati.

## 6. Modello dati

Convenzioni: nomi di tabelle e colonne in **inglese**, snake_case. Una **tabella per modulo** con colonne tipizzate e vincoli (NOT NULL, tipi, CHECK) come seconda difesa. Migrazioni **solo additive** (nuove colonne facoltative o con default; niente rimozioni o rinomine di colonne già usate; se cambia il significato di un campo si crea una nuova tabella). Le righe di riferimento già usate **non si cancellano**: si disattivano (`active = false`).

**Tabelle di riferimento** (lette dall'app, scritte solo dal gestore; RLS: SELECT per `authenticated`, nessuna scrittura)
- `people`: `id`, `first_name`, `last_name`, `email`, `user_id` (facoltativo, unico, riferimento a `auth.users`), `active`. Solo personale interno. Dati riservati futuri in un'altra tabella.
- `classes`: `id`, `school_year`, `name`, `active`; nome unico per anno scolastico. L'anno scolastico in corso si ricava dalla data (inizio a settembre). A settembre il gestore copia l'elenco dell'anno precedente e corregge le differenze.

**Modulo Uscita didattica** (tabella principale, nome da definire, es. `outing_requests`)
- Colonne comuni a ogni modulo: `id` (uuid **generato dal client** all'apertura del modulo e rigenerato dopo ogni invio riuscito; non è un hash dei dati), `user_id` (default `auth.uid()`), `created_at`.
- Colonne note: data di inizio e data di fine (CHECK fine >= inizio). Gli altri campi dell'uscita (destinazione, numero di alunni, motivazione, ...) **si definiscono quando si costruisce la pagina**; quelli nel prototipo erano inventati.
- Tabelle di collegamento: `outing_companions` (uscita + `person_id` verso `people`, sempre una persona dell'elenco) e `outing_classes` (uscita + classe).

**Salvataggio e sicurezza**
- Il client chiama una **funzione sul database** (`supabase.rpc`) per modulo, che scrive la compilazione, gli accompagnatori e le classi in **una sola transazione** (tutto o niente) e valida i dati lato server.
- I colleghi **non hanno permessi di scrittura diretti** sulle tabelle dei moduli e **non le leggono**. Quando si farà la sezione "i miei moduli" si aggiungerà la lettura delle sole proprie righe.
- Se l'uuid esiste già, la funzione risponde "già salvato" senza duplicare. Il pulsante si disattiva anche in locale durante l'invio.
- La funzione è `SECURITY DEFINER` con `search_path` fissato a vuoto e nomi qualificati; richiede `auth.uid()` non nullo e lo usa come `user_id`; `EXECUTE` revocato a `anon`/`PUBLIC` e concesso a `authenticated`.
- Le correzioni ai dati inviati le fa il gestore dalla dashboard di Supabase.
- Migrazioni come file `.sql` in `supabase/migrations/`, applicate al progetto con lo strumento di migrazione del server MCP. Tipi TypeScript generati dal database.

## 7. Stato attuale

- Database OutingModules **vuoto**, tranne un **utente di test**: `test.utente@example.com`, email confermata, login verificato. È stato creato con un inserimento SQL diretto in `auth.users`; gli account veri vanno creati dalla dashboard di Supabase o con l'API admin. La password è stata consegnata in chat al gestore, non è nella repo.
- La registrazione pubblica è stata spenta dal gestore nella dashboard.
- Nel codice: scaffold Vite con shadcn; `src/main.tsx` monta ancora `App` (pagina demo di Vite) dentro il ThemeProvider. Aggiunti `card.tsx` e `badge.tsx`. Nessuna logica applicativa.
- Il file `src/components/ui/*` importa `cn` dal pacchetto `cn`, scelta presente nel progetto e non toccata.

## 8. Metodo di sviluppo: TDD e qualità del codice

Lo sviluppo segue il **test-driven development** (skill `mattpocock-skills:tdd`): ogni comportamento si scrive prima come test che fallisce (rosso), poi il codice minimo che lo fa passare (verde), poi si ripulisce (refactor). Un test per volta, a fette verticali; non si scrivono tutti i test in blocco prima del codice. I test verificano il comportamento tramite l'interfaccia pubblica (cosa vede e fa l'utente, cosa restituisce la funzione), non i dettagli interni.

- **Infrastruttura di test:** oggi non esiste. Va configurata come primo passo, con strumenti compatibili con Vite e bun (indicativamente Vitest, Testing Library, jsdom; la scelta definitiva spetta alla sessione di implementazione). Il comando `bun run test` deve essere parte del progetto.
- **Cosa si testa nel client:** gli schemi `zod` (campi obbligatori, data di inizio non passata, fine non prima dell'inizio); il comportamento dei form (errore in italiano sotto il campo, mobile che non avanza con errori, errore che sparisce solo quando il campo diventa valido, desktop che controlla all'invio); l'autocompletamento (filtro senza accenti e maiuscole, "Nessuna persona trovata", scelta obbligatoria dall'elenco); l'uuid (rigenerato dopo l'invio riuscito, riuso in caso di nuovo tentativo); il salvataggio locale (recuperato alla riapertura, cancellato dopo l'invio e al logout); le rotte protette con ritorno alla pagina richiesta.
- **Cosa si testa nel database:** le regole RLS (i colleghi leggono gli elenchi, non scrivono, non leggono le compilazioni, non scrivono direttamente nelle tabelle dei moduli) e la funzione di salvataggio (tutto o niente, "già salvato" se l'uuid esiste, rifiuto di persone o classi inesistenti o disattivate, rifiuto di date non valide). Anche queste si scrivono prima della migrazione. Dove eseguirle (stack locale con la CLI di Supabase e Docker, oppure il progetto OutingModules) lo decide la sessione di implementazione; non su OutingProject.
- Un passo dell'ordine sotto si considera finito solo quando i suoi test passano.

### Qualità del codice: leggibile, mantenibile, espandibile

Il codice deve poter essere letto e modificato da chi non l'ha scritto e deve crescere senza riscritture. Il caso di crescita previsto è uno solo: **aggiungere nuovi moduli**. Si ottimizza per quello e non per altro: niente astrazioni "per il futuro" che nessuno ha chiesto.

- **Un nuovo modulo si aggiunge senza toccare il resto.** Ogni modulo vive in una propria cartella (indicativamente `src/features/<modulo>/`) con schema di validazione, campi, passi del form, riepilogo e chiamata di salvataggio. La griglia dei moduli, le rotte e le schede "In arrivo" nascono da **un unico elenco dei moduli** (titolo, descrizione, icona, percorso, disponibile o no): aggiungere un modulo significa aggiungere la sua cartella e una riga a quell'elenco.
- **Separazione dei compiti.** La logica (validazione, regole sulle date, filtro dell'autocompletamento, salvataggio locale) sta in funzioni e hook piccoli, **separati dai componenti grafici**, così si testa senza schermo. L'accesso a Supabase passa da un unico livello sottile, non è sparso nei componenti.
- **Parti comuni condivise.** Il form a passi su mobile, la pagina unica su desktop, il riepilogo, il campo di autocompletamento delle persone e la selezione delle classi sono componenti riutilizzabili da ogni modulo. Una regola scritta due volte va estratta alla terza.
- **Tipi forti.** TypeScript rigoroso, niente `any`. I tipi del database sono generati, non scritti a mano; i tipi dei form derivano dagli schemi `zod`.
- **Leggibilità.** File e funzioni piccoli e con un solo scopo; nomi chiari che usano i termini del glossario; commenti solo per spiegare il **perché**, non il cosa. Nessun numero o testo "magico" sparso: costanti con nome, testi in italiano raccolti in un posto.
- **Coerenza.** Si usano i componenti shadcn e le convenzioni già nel progetto invece di crearne di nuovi. `bunx tsc -b` senza errori e lint pulito sul codice nuovo prima di dichiarare un passo finito.
- **Semplicità prima di tutto.** La soluzione più semplice che soddisfa la specifica vince. Un'astrazione si introduce quando c'è già più di un caso reale che la richiede.

## 9. Ordine di implementazione suggerito

Ogni passo è completo da solo e si può verificare.

0. **Test:** configurare l'infrastruttura di test e verificare che `bun run test` giri.
1. **Fondamenta:** client Supabase con le variabili d'ambiente, router, schermata di login, sessione persistente, rotte protette con ritorno alla pagina richiesta, pulsante "Esci".
2. **Elenchi:** migrazione con `people` e `classes`, RLS di sola lettura, una persona collegata all'utente di test, classi di esempio dell'anno in corso.
3. **Griglia dei moduli:** testata con il nome, schede con descrizione e "In arrivo", navigazione alla pagina del modulo.
4. **Uscita didattica, dati:** migrazione della tabella del modulo, delle tabelle di collegamento e della funzione di salvataggio con i suoi controlli; test con l'utente di test.
5. **Uscita didattica, interfaccia:** definire i campi veri, schema `zod`, form a passi su mobile e pagina unica su desktop, autocompletamento delle persone, selezione delle classi, riepilogo, salvataggio locale dei dati in corso, stati di invio.
6. **Rifinitura e deploy:** verifica del primo deploy su Cloudflare, prova su smartphone reale, controllo degli avvisi di sicurezza e prestazioni del database (advisors di Supabase).

## 10. Fuori scopo (per ora)

- Form builder (creare o modificare moduli dall'interfaccia).
- Sezione "i miei moduli compilati" e qualunque vista delle compilazioni nell'app; i dati si leggono dalla dashboard di Supabase.
- Ruolo admin nell'app e workflow di approvazione.
- Cambio password da parte dell'utente.
- Notifiche all'invio (mail o altro) e allegati (upload di file).

## 11. Da decidere più avanti

- Campi precisi di ogni modulo, a partire dall'Uscita didattica.
- Accompagnatori esterni o ancora da definire (oggi non si possono indicare).
- Caricamento massivo dei colleghi (sono tanti): script o importazione.
- Reset password via mail (richiede un servizio SMTP personalizzato: il servizio integrato di Supabase invia 2 mail all'ora e solo agli indirizzi del team).
- Bozza salvata sul server (oggi i dati in corso restano solo nel browser).

## Appendice A. Persone e percorsi per i test di usabilità

Servono a dare una direzione a chi esegue i test di usabilità. Le persone sono **ipotesi** costruite su ciò che l'autore ha detto (colleghi della scuola, molti, soprattutto da smartphone); età e competenza digitale non sono state indicate e vanno verificate con colleghi veri. Ogni persona ha un compito e un modo di sbagliare, non una biografia.

### Persone

- **Docente organizzatore su smartphone (principale).** Compila tra una lezione e l'altra, con poco tempo, un pollice solo e rete non sempre stabile. Sbaglia per fretta: tocca due volte "Invia", chiude l'app a metà, scrive male un nome.
- **Docente al computer.** Compila con calma da scuola o da casa, sul desktop. Si aspetta di vedere tutto in una pagina e di controllare prima di inviare.
- **Collega al primo accesso o con la password persa.** Ha ricevuto un'email e una password dal gestore e non sa cosa fare se non funziona. Sbaglia l'accesso e si blocca.
- **Gestore** (non usa l'interfaccia dei colleghi: lavora nella dashboard di Supabase). Crea account, aggiorna elenchi e classi a settembre, legge e corregge le compilazioni. Va coinvolto per verificare che i dati salvati siano leggibili e completi, non per testare le schermate.

### Percorsi da provare

Ogni percorso indica cosa deve succedere; il test fallisce se l'utente si blocca, sbaglia senza capirlo o perde dati.

1. **Primo accesso e prima compilazione da smartphone** (percorso felice): login, saluto con il proprio nome, scelta di "Uscita didattica", compilazione a passi, riepilogo, invio, schermata di conferma, ritorno ai moduli.
2. **Link diretto senza sessione:** apre il link di un modulo da un messaggio, viene portato al login e, dopo l'accesso, arriva sul modulo richiesto.
3. **Errore in una sezione:** lascia un campo obbligatorio vuoto e preme "Avanti". Non deve avanzare, deve vedere un messaggio in italiano sotto il campo, e l'errore deve sparire solo quando il valore diventa valido.
4. **Accompagnatore:** scrive il nome di un collega con maiuscole o accenti diversi e lo trova; scrive un nome che non esiste e capisce che non può proseguire.
5. **Uscita di più giorni e date:** indica date di inizio e fine diverse; prova una data di inizio nel passato e una fine prima dell'inizio e capisce l'errore.
6. **Interruzione:** chiude il browser a metà compilazione e, riaprendo, ritrova i dati; dopo "Esci" i dati non ci sono più.
7. **Rete instabile e doppio tocco:** tocca due volte "Invia" o ripete l'invio dopo un errore di rete. La compilazione risulta salvata una sola volta e l'utente capisce che è andata a buon fine.
8. **Compilazione da desktop:** vede il modulo su una sola pagina, apre "Controlla e invia" e conferma.
9. **Modulo non disponibile:** tocca una scheda "In arrivo" e capisce che non è ancora utilizzabile.
10. **Password dimenticata:** non può reimpostarla da solo. Dalla schermata di login deve capire che si rivolge al gestore, grazie al messaggio "Hai dimenticato la password? Rivolgiti al gestore" sotto il pulsante di accesso.

### Criteri e ambienti di prova

- Schermi: telefono stretto (circa 360 x 800) e desktop (circa 1280 x 800), con tema scuro e chiaro.
- Elementi toccabili grandi abbastanza per un pollice (indicativamente almeno 44 px) e campi numerici che aprono la tastiera numerica.
- Il percorso 1 si deve completare senza aiuto. Ipotesi di partenza, da regolare con prove reali: nessun errore bloccante per chi compila in buona fede e nessuna perdita di dati nei percorsi 6 e 7.
- Dopo ogni prova sul database, verificare che il gestore veda nella dashboard di Supabase una sola riga per compilazione, con tutti i dati collegati (accompagnatori e classi).
