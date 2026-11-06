---
type: research
status: closed
assignee:
blocked-by: []
---

# Ricerca: Supabase Auth con utenti creati a mano e RLS in sola scrittura

## Question

Da documentazione primaria Supabase, serve sapere:

- come si creano utenti a mano dalla dashboard (con password / invito) e come si **disabilita la registrazione pubblica**;
- metodi di login email disponibili per una SPA con `supabase-js` (password, magic link / OTP) e i relativi vincoli (limiti di invio mail sul piano gratuito, reset password);
- come scrivere policy RLS dove un utente autenticato può solo **INSERT** le proprie righe (`auth.uid()`), senza SELECT;
- implicazioni di un INSERT senza SELECT: cosa succede con `.insert().select()` / `returning`, e come ottenere comunque conferma di avvenuto salvataggio;
- sicurezza della `anon key` esposta nel client.

Esito: file in `research/supabase-auth-rls.md`.

## Resolution

Esito completo in [research/supabase-auth-rls.md](../research/supabase-auth-rls.md). Fatti principali:

- Registrazione pubblica disattivabile ("Allow new users to sign up"). La documentazione descrive l'invito dalla dashboard; la creazione diretta con password va verificata a mano nella dashboard.
- Per una SPA il metodo più semplice è `signInWithPassword`. Magic link, OTP e reset password inviano mail: con l'SMTP integrato il limite è 2 mail/ora e solo agli indirizzi del team, quindi per i colleghi serve un SMTP personalizzato.
- Basta una policy `FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id)`, più `GRANT INSERT` e RLS attivo. Senza policy SELECT/UPDATE il client non legge né modifica nulla.
- `.insert()` da solo funziona; `.insert().select()` fallisce senza policy SELECT (da confermare con un test). Ricevuta possibile con id generato nel client, funzione `SECURITY DEFINER` o SELECT sulle sole proprie righe.
- La anon key può stare nel client; la secret/`service_role` mai. Supabase dismette `anon`/`service_role` entro fine 2026 a favore della publishable key.
