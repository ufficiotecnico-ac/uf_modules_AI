---
type: grilling
status: closed
assignee: luca.bonin
blocked-by: [04-modello-di-accesso-grilling.md]
---

# Modello dati Supabase e regole RLS

## Question

Come si salvano le compilazioni? Una tabella per modulo con colonne tipizzate, oppure una tabella generica `submissions` con colonna `jsonb` e tipo di modulo? Quali colonne comuni (autore, data, tipo modulo)? Quali policy RLS (insert solo propri, nessuna select dall'app, lettura da dashboard)? Come si versionano i moduli quando i campi cambiano? Come si gestiscono le migrazioni (CLI Supabase, file in repo)?

Input dal modello di accesso: gli utenti sono creati a mano (esiste un utente di test); serve una tabella dedicata alle persone (nome, cognome, altre info, forse email) letta dall'app per salutare il collega. L'elenco di persone selezionabili nei campi potrebbe coincidere con gli utenti oppure includere persone senza account: l'autore non lo sa ancora, quindi lo schema deve reggere entrambi i casi senza migrazioni dolorose. La tabella delle persone ha RLS di sola lettura per il proprio record?

## Decisioni parziali (giri 1 e 2)

- Una **tabella per modulo** con colonne tipizzate; tutto il database in **inglese** (tabelle e colonne in snake_case). Per ora esiste solo l'uscita didattica, anche di più giorni (data di inizio e di fine).
- Migrazioni come file `.sql` in `supabase/migrations/`, applicate dal server MCP, con tipi TypeScript generati.
- Tabella unica `people` con nome, cognome ed email, con `user_id` facoltativo e unico verso `auth.users`. (La colonna `kind` interno/esterno è stata tolta nel giro 3.)
- Identificativo del modulo: **uuid casuale generato dal client** all'apertura del modulo e rigenerato dopo ogni invio riuscito (non un hash dei dati); il database lo rifiuta come duplicato se arriva due volte.
- Colonne comuni: `id`, `user_id` (default `auth.uid()`), `created_at`.
- **Accompagnatori:** (superata nel giro 3, vedi Resolution).

## Resolution

Modello dati deciso con l'autore in tre giri di domande. Lo schema esatto delle colonne di ogni modulo si definisce quando si costruisce la sua pagina; qui si fissano struttura, convenzioni e sicurezza.

**Tabelle di riferimento** (lette dall'app, scritte solo dall'autore)
- `people`: solo **personale interno**. Colonne: `id`, `first_name`, `last_name`, `email`, `user_id` (facoltativo, unico, verso `auth.users`), `active`. Serve per l'autocompletamento nei campi e per il saluto "Ciao, ..." (si trova la propria riga con `user_id = auth.uid()`). Eventuali dati riservati futuri vanno in un'altra tabella.
- `classes`: una riga per **classe e anno scolastico** (es. 2026/27, "5BSIA/RIM"), nome unico per anno, `active`. Il form propone solo le classi dell'anno in corso (l'anno scolastico si ricava dalla data, con inizio a settembre). A settembre l'autore copia l'elenco dell'anno precedente e corregge le differenze. Lo storico si conserva perché le uscite restano collegate alla classe di quell'anno.
- Gli utenti loggati possono solo **leggere** queste tabelle (RLS: SELECT per `authenticated`), mai scriverle.

**Tabelle dei moduli**
- Una tabella per modulo, **colonne tipizzate**, con **vincoli nel database** (NOT NULL, tipi, CHECK) come seconda difesa. Il primo è l'uscita didattica, anche di più giorni (data di inizio e di fine, con CHECK fine >= inizio).
- Colonne comuni: `id` (uuid **generato dal client** all'apertura del modulo e rigenerato dopo ogni invio riuscito, non un hash dei dati), `user_id` (default `auth.uid()`), `created_at`.
- Tabelle di collegamento: `outing_companions` (uscita + `person_id` verso `people`, **sempre una persona dell'elenco, niente testo libero**) e `outing_classes` (uscita + classe).
- **Accompagnatori solo interni:** se il nome non corrisponde a una persona in `people`, il modulo dà errore. Chi non è in elenco (esterni, "operatore da definire") per ora non si può indicare.

**Salvataggio e sicurezza**
- Il client chiama una **funzione sul database** per modulo (`supabase.rpc`) che scrive uscita, accompagnatori e classi in **una sola transazione**, tutto o niente, e valida i dati lato server. I colleghi **non hanno permessi di scrittura diretti** sulle tabelle dei moduli. Se l'uuid esiste già, la funzione risponde "già salvato" senza duplicare (protezione dal doppio invio, oltre al pulsante disattivato in locale).
- Indicazioni tecniche per la funzione: `SECURITY DEFINER` con `search_path` fissato a vuoto, nomi qualificati, `auth.uid()` obbligatorio e usato per `user_id`, `EXECUTE` revocato a `anon`/`PUBLIC` e concesso a `authenticated`. Nessuna lettura delle compilazioni dall'app; quando si farà "i miei moduli" si aggiungerà la lettura delle sole proprie righe.
- Le correzioni ai dati inviati le fa l'autore dalla dashboard.

**Evoluzione**
- Migrazioni **solo additive**: nuove colonne facoltative o con valore predefinito, senza togliere né rinominare colonne già usate. Se cambia il significato di un campo si crea una nuova tabella.
- Le righe di riferimento già usate **non si cancellano**: si disattivano con `active = false`.

**Strumenti**
- Migrazioni come file `.sql` in `supabase/migrations/`, applicate al progetto OutingModules con lo strumento di migrazione del server MCP. Tipi TypeScript generati dal database. Nomi di tabelle e colonne in **inglese**, snake_case.
