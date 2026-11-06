---
type: grilling
status: closed
assignee: luca.bonin
blocked-by: [02-supabase-auth-rls-research.md]
---

# Modello di accesso: login e utenti

## Question

Alla luce della ricerca su Supabase Auth: quale metodo di login (password o magic link/OTP)? Come si gestisce il reset password? Chi può creare utenti (solo l'autore da dashboard) e cosa succede a un collega non presente? Serve un legame utente ↔ nome/cognome per mostrare chi ha compilato (tabella profilo) o basta l'email?

Emerso dal prototipo della griglia: la testata saluta il collega ("Ciao, ..."). Serve quindi il **nome** dell'utente? Se sì, dove vive (tabella profilo creata a mano insieme all'utente)?

## Decisioni parziali (giro 1 di domande)

- Login con **email e password** (`signInWithPassword`). Nessun magic link/OTP.
- Gli utenti li crea l'autore; registrazione pubblica spenta. Il **caricamento massivo** dei colleghi (sono tanti) si decide più avanti.
- Utente di **test** creato nel progetto OutingModules il 2026-11-06 (`test.utente@example.com`, email confermata, login verificato). La password è stata consegnata all'autore in chat, non è nella repo.
- Una **tabella dedicata alle persone** con nome, cognome e altre info (da definire). Da valutare l'email nella stessa tabella: nei moduli serviranno elenchi di email accettate nei campi, con nome e cognome associati. Va riconciliata con il modello dati.
- Sessione **persistente** sullo smartphone, con pulsante "Esci".
- Senza sessione si va su `/login`; dopo l'accesso si torna alla pagina richiesta (link diretti ai moduli).

## Resolution

Modello di accesso deciso con l'autore (due giri di domande).

- **Login:** email e password (`signInWithPassword`), nessun magic link o OTP. Non dipende da un servizio di posta.
- **Utenti:** li crea l'autore, con email già confermata; registrazione pubblica spenta ("Allow new users to sign up" da disattivare in Authentication > Sign In / Providers). Il caricamento massivo dei colleghi (sono tanti) si decide più avanti. Per sviluppare esiste un **utente di test** (`test.utente@example.com`) nel progetto OutingModules, con login verificato.
- **Sessione:** persistente (default di supabase-js), con pulsante "Esci". Senza sessione si va su `/login` e dopo l'accesso si torna alla pagina richiesta (link diretti ai moduli).
- **Password:** nessun "password dimenticata" e nessun cambio password nell'app per ora; le reimposta l'autore dalla dashboard di Supabase. Reset via mail e cambio password da parte dell'utente si rimandano.
- **Nome dell'utente:** la testata saluta per nome, quindi serve una tabella dedicata alle persone con nome, cognome e altre info (da definire). Da valutare se contiene anche l'email: nei moduli serviranno elenchi di email accettate nei campi, con nome e cognome associati.
- **Aperto, rimandato:** l'elenco di persone selezionabili nei campi (es. accompagnatori) coincide con gli utenti che fanno login o include persone senza account? L'autore non lo sa ancora; si valuta quando si arriva ai moduli che lo richiedono. Il modello dati deve poter reggere entrambi i casi.
