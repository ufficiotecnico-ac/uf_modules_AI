---
type: grilling
status: closed
assignee: luca.bonin
blocked-by: []
---

# Campi e sezioni del modulo Uscita didattica

## Question

Quali sono i campi del modulo Uscita didattica e come si raggruppano in sezioni, su smartphone e su desktop? Domande da chiudere:

- quali campi esistono, quali sono obbligatori e quali facoltativi, con tipo e regole di ciascuno (la bozza di partenza: destinazione, data di inizio, data di fine, numero di alunni, motivazione, classi, accompagnatori);
- quali campi di contenuto servono oltre alla bozza (orari, mezzo di trasporto, costo, pernottamento, note...) e quali sono regole di dominio (per esempio il rapporto alunni/accompagnatori);
- come si raggruppano i campi in sezioni, e in che ordine;
- come cambia la presentazione tra smartphone (un passo per sezione) e desktop (una sola pagina);
- cosa mostra il riepilogo finale.

Input già deciso: validazione e tipi di controllo (ticket sulla validazione), modello dati con tabelle di collegamento per classi e accompagnatori (ticket sul modello dati), le migrazioni sono solo additive. La decisione finisce in un file dedicato che la sessione di implementazione (passi 4 e 5 di `SPEC.md`) usa direttamente.

## Resolution

Campi, sezioni e layout decisi con l'autore in un'intervista a tornate. La decisione completa sta in [MODULO-USCITA-DIDATTICA.md](../../../../MODULO-USCITA-DIDATTICA.md); qui il riassunto.

- **Il modulo è molto più ricco della bozza iniziale:** tipologia di uscita (elenco gestito dal gestore) e progetto facoltativo; destinazione; date (ritorno solo se "più giorni", strettamente dopo la partenza) e orari di partenza e arrivo in istituto; elenco di classi con alunni, maschi e femmine (solo più giorni) e "di cui con disabilità"; necessità; referente, accompagnatore e altri accompagnatori; obiettivo; programma di massima; trasporti; visite; altri servizi; altre note.
- **Tre tabelle di tipi** con chiavi in inglese, gestite dal gestore e mai cancellate: `outing_types`, `transport_types`, `booking_types`.
- **Elenchi ripetibili:** classi (almeno una), altri accompagnatori, trasporti (anche zero), visite (anche zero). Trasporti e visite si inseriscono in un `AlertDialog` (non si chiude toccando fuori).
- **Sei passi su smartphone più il riepilogo; le stesse sezioni in una pagina su desktop.** Il riepilogo si apre solo se tutto è corretto, altrimenti si evidenziano i campi sbagliati con il motivo.
- **Cambia il modello dati del passo 4:** più tabelle (`outing_requests`, `outing_classes` con conteggi, `outing_companions`, `outing_transports`, `outing_bookings`) e il referente come colonna di `outing_requests`.
- **Chi legge:** l'ufficio tecnico dalla dashboard di Supabase; nessuna vista o filtro nell'app per ora.
