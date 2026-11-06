# Supabase Auth con utenti creati a mano e RLS in sola scrittura

Ticket: `tickets/02-supabase-auth-rls-research.md`. Data ricerca: 2026-11-06.
Fonti: solo documentazione ufficiale Supabase, documentazione PostgreSQL (per il comportamento di RLS) e riferimento supabase-js. Il server MCP Supabase non era autorizzato, quindi tutto proviene dalle pagine web della documentazione.

Le affermazioni non confermate da una fonte primaria sono segnate **[non verificato]**.

## Sintesi

1. La registrazione pubblica si disabilita con il toggle "Allow new users to sign up" (Authentication > Sign In / Providers). Con il toggle spento "only existing users can sign in".
2. Gli utenti si creano dalla dashboard (Authentication > Users > Add user). La documentazione descrive solo "Send invitation". Con l'SMTP integrato la mail parte solo verso indirizzi del team del progetto, con tetto di 2 mail/ora. Per invitare colleghi serve quindi un SMTP personalizzato, oppure creare gli utenti con password (opzione che la documentazione non descrive, vedi sezione 1).
3. Per una SPA il login più semplice è `signInWithPassword`. Il magic link e l'OTP via mail passano dallo stesso limite di invio mail, quindi sul piano gratuito con SMTP integrato sono poco praticabili. Il reset password richiede ugualmente una mail.
4. La policy per sola scrittura è `FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id)` più il `GRANT INSERT`, senza policy SELECT. `.insert()` senza `.select()` funziona. `.insert().select()` (RETURNING) fallisce con errore RLS, perché Postgres richiede una policy SELECT per RETURNING.
5. La anon key è pensata per stare nel client. La protezione dipende interamente da RLS e dai GRANT. La `service_role`/secret key non deve mai finire nel client.

---

## 1. Creare utenti a mano e disabilitare la registrazione pubblica

### Disabilitare la registrazione pubblica

- Opzione "Allow new users to sign up" nelle impostazioni generali di Auth. La pagina dice: "If this config is disabled, only existing users can sign in."
  Fonte: https://supabase.com/docs/guides/auth/general-configuration
- Con `signInWithOtp` (magic link / OTP) un'email sconosciuta viene registrata in automatico: "If the user hasn't signed up yet, they are automatically signed up by default." Si evita con `options: { shouldCreateUser: false }`.
  Fonte: https://supabase.com/docs/guides/auth/auth-email-passwordless
- Conclusione operativa: spegnere "Allow new users to sign up" e, se si usa `signInWithOtp`, passare anche `shouldCreateUser: false`. **[non verificato]** La documentazione letta non dice esplicitamente se il toggle blocca da solo la creazione automatica di `signInWithOtp`. Il doppio blocco evita il dubbio.

### Creare gli utenti

- Dashboard: Authentication > Users, "Click Add user and select Send invitation", si inserisce l'email e "Invite user". L'invitato riceve una mail con un link che conferma l'indirizzo e gli permette di completare l'account.
  Fonte: https://supabase.com/docs/guides/auth/users
- Il link di invito scade dopo la durata "Email OTP Expiration" (default 1 ora). Se scade bisogna rinviare l'invito. Invitare un'email già appartenente a un utente confermato restituisce errore.
  Fonte: https://supabase.com/docs/guides/auth/users
- API admin: `supabase.auth.admin.inviteUserByEmail()` e `supabase.auth.admin.createUser()` sono "admin action", da eseguire solo lato server con la secret key / `service_role`. `createUser` è descritto come "This function should only be called on a server. Never expose your `service_role` key in the browser."
  Fonti: https://supabase.com/docs/guides/auth/users e https://supabase.com/docs/reference/javascript/auth-admin-createuser
- Creazione diretta con password già impostata e conferma automatica: la pagina `createUser` mostra un esempio "Auto-confirm the user's email" con `email_confirm: true` (e un esempio con `password`). Il riferimento Dart/Python precisa che `email_confirm` e `phone_confirm` valgono `false` di default e che `createUser()` non invia la mail di conferma.
  Fonti: https://supabase.com/docs/reference/javascript/auth-admin-createuser e https://supabase.com/docs/reference/dart/auth-admin-createuser
- **[non verificato]** Il dialogo della dashboard "Create new user" con password e casella "Auto Confirm User" non compare nelle pagine di documentazione che ho potuto leggere. Se esiste, equivale probabilmente a `createUser` con `email_confirm: true`. Va controllato direttamente nell'interfaccia della dashboard.

### Conferma email

- Sui progetti ospitati la conferma email è attiva di default ("On hosted Supabase projects, this is true by default").
  Fonte: https://supabase.com/docs/guides/auth/passwords
- Il riferimento C# precisa che con "Confirm email" attivo un nuovo utente registrato via `signUp` non ha sessione finché non conferma. Per utenti creati dall'amministratore la strada è `email_confirm: true` oppure l'invito.

## 2. Metodi di login email per una SPA con supabase-js

### Email + password

```js
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'valid.email@supabase.io',
  password: 'example-password',
})
```

Fonte: https://supabase.com/docs/guides/auth/passwords

È l'unico metodo che non invia mail a ogni accesso, quindi è immune ai limiti di invio.

### Magic link / OTP via email

- Entrambi usano `signInWithOtp`. "Though the method is labelled "OTP", it sends a Magic Link by default." Per ottenere un codice a 6 cifre il template mail deve contenere il token. Il codice si verifica con `verifyOtp({ email, token, type: 'email' })`.
- Vincoli: una richiesta ogni 60 secondi per utente, scadenza di default 1 ora.
  Fonte: https://supabase.com/docs/guides/auth/auth-email-passwordless

### Limiti di invio mail (piano gratuito, SMTP integrato)

- Tabella rate limit: "2 emails per hour with the built-in email provider", per progetto. Personalizzabile solo con SMTP personalizzato o Send Email hook. Le richieste oltre il limite ricevono errore 429.
  Fonte: https://supabase.com/docs/guides/auth/rate-limits
- SMTP integrato: "Supabase Auth will refuse to deliver messages to addresses that are not part of the project's team" (errore "Email address not authorized"). "Currently this value is set to 2 messages per hour." È "not meant for production use".
  Fonte: https://supabase.com/docs/guides/auth/auth-smtp
- Con SMTP personalizzato "your project's Auth server will send messages to all addresses", con un nuovo limite predefinito di 30 messaggi/ora, alzabile dalla pagina Rate Limits.
  Fonte: https://supabase.com/docs/guides/auth/auth-smtp
- Altri limiti per IP: 30 richieste ogni 5 minuti per signup/signin/recover/otp, 150 ogni 5 minuti per l'endpoint token. Per utente: 60 secondi tra due invii (otp, signup, recover).
  Fonte: https://supabase.com/docs/guides/auth/rate-limits

Implicazione: sul piano gratuito con SMTP integrato non si possono né invitare colleghi esterni al team, né usare magic link/OTP o reset password per loro. Sono due le strade: configurare un SMTP personalizzato (qualunque servizio SMTP), oppure creare gli utenti con password e conferma automatica ed evitare le mail.

### Reset password

1. `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://.../update-password' })`. La pagina di richiesta deve essere pubblica. Per evitare l'enumerazione degli utenti la chiamata non rivela se l'account esiste.
2. Nella pagina di destinazione, l'utente autenticato dal link chiama `supabase.auth.updateUser({ password: 'nuova' })`.
   Fonte: https://supabase.com/docs/guides/auth/passwords
- `redirectTo` deve essere elencato negli URL di redirect consentiti, altrimenti l'utente finisce sul Site URL (vedi la pagina `users` per il comportamento analogo degli inviti).
- Il reset invia una mail, quindi soggiace ai limiti sopra. **[non verificato]** La pagina letta non menziona l'evento `PASSWORD_RECOVERY` di `onAuthStateChange`. Va verificato nel riferimento `onAuthStateChange` prima di implementare la pagina di cambio password.

### Sessione nel browser

- Le librerie JS salvano i token nello storage del browser. Il JWT dura 1 ora di default. Il refresh token non scade ma si può usare una volta sola. Le sessioni durano a tempo indeterminato di default. Timebox e timeout per inattività richiedono il piano Pro.
  Fonte: https://supabase.com/docs/guides/auth/sessions

## 3. Policy RLS: solo INSERT delle proprie righe

Schema di esempio (nome tabella indicativo):

```sql
create table public.uscite (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id),
  -- ...altre colonne del modulo
  created_at timestamptz not null default now()
);

alter table public.uscite enable row level security;

grant insert on table public.uscite to authenticated;

create policy "Utenti autenticati inseriscono le proprie righe"
on public.uscite
for insert
to authenticated
with check ( (select auth.uid()) = user_id );

-- Nessuna policy SELECT, UPDATE o DELETE.
```

Cosa dice la documentazione, punto per punto:

- Una policy di INSERT usa `with check`, non `using`. L'esempio ufficiale è `create policy ... on profiles for insert to authenticated with check ( (select auth.uid()) = user_id );`. Postgres precisa che una policy INSERT "cannot have a `USING` expression".
  Fonti: https://supabase.com/docs/guides/database/postgres/row-level-security e https://www.postgresql.org/docs/current/sql-createpolicy.html
- Con RLS attivo e nessuna policy, il client con chiave pubblica non vede né modifica nulla ("Once RLS is enabled, no data is accessible through the API when using a publishable key, until you create policies."). Quindi l'assenza di policy SELECT/UPDATE/DELETE basta a negarle.
  Fonte: https://supabase.com/docs/guides/database/postgres/row-level-security
- `to authenticated` esclude il ruolo `anon`: "Always name the role a policy applies to, using the `to` clause."
  Fonte: stessa pagina RLS.
- `auth.uid()` restituisce l'ID dell'utente, `null` per richieste non autenticate. Avvolgerlo in `(select auth.uid())` permette a Postgres di calcolarlo una volta per istruzione (initPlan).
  Fonte: stessa pagina RLS.
- Servono sia il GRANT sia la policy. "Grants control whether a role can access an object. RLS controls which rows the role can access." Se manca il grant PostgREST risponde con errore `42501` e un suggerimento sul `grant` necessario. Sui progetti esistenti le nuove tabelle in `public` concedono già privilegi ampi a `anon` e `authenticated`: conviene restringerli (`revoke`) e concedere solo `insert` a `authenticated`.
  Fonte: https://supabase.com/docs/guides/database/hardening-data-api
- Le tabelle create dalla dashboard hanno RLS attivo di default, quelle create dal SQL Editor no: va attivato esplicitamente.
  Fonte: https://supabase.com/docs/guides/database/hardening-data-api
- Il default `user_id uuid default auth.uid()` è una scelta di progetto (non è nella documentazione citata): evita che il client debba inviare `user_id`, e `with check` lo verifica comunque. **[non verificato]** come pattern raccomandato, ma è SQL standard e coerente con la pagina RLS.
- Indice sulle colonne usate nelle policy: raccomandato dalla pagina RLS per le letture. Con sola scrittura non serve per le policy.

## 4. INSERT senza SELECT: `.insert().select()`, RETURNING e conferma di salvataggio

### Comportamento

- supabase-js: "By default, inserted rows are not returned. To return it, chain the call with `.select()`."
  Fonte: https://supabase.com/docs/reference/javascript/insert
- `.insert(...)` da solo non richiede SELECT e con la policy sopra riesce.
- `.insert(...).select()` aggiunge RETURNING. Documentazione PostgreSQL: "If a data-modifying query has a `RETURNING` clause, `SELECT` permissions are required on the relation, and any newly inserted or updated rows from the relation must satisfy the relation's `SELECT` policies in order to be available to the `RETURNING` clause. If a newly inserted or updated row does not satisfy the relation's `SELECT` policies, an error will be thrown (inserted or updated rows to be returned are _never_ silently ignored)."
  Fonte: https://www.postgresql.org/docs/current/sql-createpolicy.html
- Quindi con policy di sola INSERT, `.insert().select()` fallisce con un errore di violazione RLS anche se la riga rispetta il `WITH CHECK`. La documentazione Supabase sulla pagina RLS non lo dice esplicitamente (dichiara solo che per `UPDATE` serve una policy SELECT). Il comportamento deriva dalla regola PostgreSQL citata e va riconfermato con un test sul progetto reale.
- Anche `INSERT ... ON CONFLICT DO UPDATE` (cioè `upsert`) richiede permessi e policy SELECT (stessa pagina PostgreSQL), quindi con sola INSERT non va usato.

### Come avere conferma di avvenuto salvataggio

Opzioni, tutte compatibili con l'assenza di SELECT:

1. **Usare solo `.insert()` e controllare `error`.** Il client supabase-js restituisce `{ data, error }` (ma anche `status`/`statusText`). Se `error` è `null` l'INSERT è stato eseguito: i controlli RLS e i vincoli di tabella falliscono in modo sincrono e abortiscono tutto il comando ("the entire `INSERT` command will be aborted"). È la conferma sufficiente per un modulo. **[non verificato]** Il riferimento supabase-js letto non documenta i campi `status`/`statusText`. Verificare nel riferimento della versione usata.
   Fonti: https://supabase.com/docs/reference/javascript/insert, https://www.postgresql.org/docs/current/sql-createpolicy.html
2. **Generare l'ID nel client** (`crypto.randomUUID()`) e inviarlo come `id`. Così l'utente può mostrare un codice di ricevuta senza dover leggere la riga. Pattern di progetto, non descritto nella documentazione Supabase.
3. **Se serve restituire dati dal server** (numero progressivo, timestamp): usare una funzione Postgres `SECURITY DEFINER` chiamata con `supabase.rpc()` che inserisce e restituisce il valore, oppure aggiungere una policy SELECT limitata alle proprie righe (`using ((select auth.uid()) = user_id)`), che rende `.insert().select()` valido. La seconda soluzione permette all'utente di rileggere le proprie righe, quindi va valutata rispetto al requisito "nessuna lettura nell'app". **[non verificato]** per i dettagli di `SECURITY DEFINER` in questo contesto: non ho letto la pagina Supabase sulle funzioni, quindi non ho una fonte primaria sulle best practice (`search_path`, grant di EXECUTE).

Nota: il proprietario legge i dati dalla dashboard o con la secret key lato server. Entrambe aggirano RLS e non richiedono policy SELECT per l'app.

## 5. Sicurezza della anon key esposta nel client

- Le chiavi pubbliche sono fatte per il codice client: "Safe to expose online: web page, mobile or desktop app, GitHub actions, CLIs, source code." Dato che chiunque può leggerle, "it only reaches what Row Level Security allows."
  Fonte: https://supabase.com/docs/guides/api/api-keys
- La `anon` key è la versione legacy della publishable key. Le richieste mappano sul ruolo Postgres `anon` (non autenticato) o `authenticated` (con JWT utente). Supabase annuncia che "is deprecating the `anon` and `service_role` keys by the end of 2026"; le nuove chiavi non revocano le vecchie, che restano finché non si disattivano dalla dashboard. Per un progetto nuovo conviene usare la publishable key; con supabase-js si passa al posto della anon key.
  Fonte: https://supabase.com/docs/guides/api/api-keys
- "Write your Row Level Security policies for the `anon` and `authenticated` roles." e "Row Level Security decides what this client can reach, so enable it on every table before you deploy."
  Fonte: https://supabase.com/docs/guides/api/api-keys
- Secret key / `service_role`: "full access to your project's data, bypassing Row Level Security", "Never put one in a browser, a shipped application, or source control." Le policy non si applicano mai a una secret key, perché `service_role` ha l'attributo `BYPASSRLS`. Le secret key sono bloccate nel browser da Supabase.
  Fonte: https://supabase.com/docs/guides/api/api-keys
- Rischio da prevenire in questo progetto: ogni tabella in `public` senza RLS è accessibile a chiunque abbia la anon key e i grant corrispondenti ("Tables and views exposed through the Data API without RLS can be accessed by any role with matching grants").
  Fonte: https://supabase.com/docs/guides/database/hardening-data-api
- Con la registrazione pubblica disabilitata, un visitatore con la sola anon key non può diventare `authenticated`, quindi la policy `TO authenticated` è l'effettivo cancello. Se in futuro si abilitassero accessi anonimi ("Allow anonymous sign-ins") quegli utenti avrebbero comunque il ruolo `authenticated` (**[non verificato]** in questa documentazione): lasciare l'opzione spenta.
- Il traffico di login è limitato per IP (30 richieste/5 min per signup/otp/recover, 150/5 min per token): fonte https://supabase.com/docs/guides/auth/rate-limits.

## Raccomandazioni per il design

1. Spegnere "Allow new users to sign up" e "Allow anonymous sign-ins".
2. Login con `signInWithPassword`. Creare gli utenti dalla dashboard con password e conferma automatica se disponibile; altrimenti configurare un SMTP personalizzato per inviti e reset password.
3. Tabella con RLS attivo, `grant insert ... to authenticated`, una sola policy `FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id)`.
4. Nel client: `await supabase.from('...').insert(row)` senza `.select()`, controllando `error`. Id generato dal client se serve una ricevuta.
5. Nel bundle solo la publishable/anon key. Mai la secret key.

## Punti aperti da verificare sul progetto reale

- Dialogo dashboard "Create new user" con password e auto-conferma (non presente nella documentazione letta).
- Evento `PASSWORD_RECOVERY` e flusso reset password con SPA e redirect.
- Test pratico: `.insert()` riesce e `.insert().select()` fallisce con la sola policy INSERT.
- Se serve davvero un valore restituito dal server, scegliere tra RPC `SECURITY DEFINER` e policy SELECT sulle proprie righe.
