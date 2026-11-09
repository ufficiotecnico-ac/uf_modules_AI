# Modulo: Uscita didattica

Specifica dei campi, delle sezioni e delle regole del primo modulo. Nasce dall'intervista del ticket [Campi e sezioni del modulo Uscita didattica](.scratch/wayfinder/uscite-didattiche/tickets/07-campi-e-sezioni-uscita-didattica-grilling.md). Completa [SPEC.md](./SPEC.md) (passi 4 e 5 della sezione 9) e usa i termini di [GLOSSARY.md](./GLOSSARY.md). Dove questo file e SPEC.md divergono sui campi del modulo, vale questo file.

**Chi legge le compilazioni:** l'ufficio tecnico (il gestore), dalla dashboard di Supabase. Nessuna vista, filtro o notifica nell'app per ora; la gestione successiva sarà un altro software o la v2.

## 1. Campi

Convenzioni: etichette e testi in italiano; nomi nel database in inglese. "Più giorni" è una casella nel form, non una colonna: un'uscita è di più giorni quando la data di fine è dopo l'inizio.

### Sezione 1 - Uscita

| Campo | Obbligatorio | Regole |
|---|---|---|
| Tipologia di uscita | sì | scelta da elenco (`outing_types`) |
| Progetto | no | testo libero. In futuro potrà diventare un elenco o un autocompletamento, per tipologia |
| Destinazione | sì | testo libero |
| Uscita di più giorni | - | casella. Se spuntata compare la data di ritorno |
| Data di partenza | sì | selettore data; non nel passato (il giorno stesso va bene) |
| Data di ritorno | sì, se più giorni | strettamente dopo la data di partenza |
| Orario di partenza (da istituto) | sì | selettore ora |
| Orario di arrivo (in istituto) | sì | selettore ora; per un'uscita di un giorno viene dopo la partenza |

Se la casella "più giorni" viene tolta dopo aver compilato i dati specifici (data di ritorno, maschi e femmine, giorni dei trasporti e delle visite), il form chiede conferma e poi li azzera. Il totale degli alunni di una classe resta.

### Sezione 2 - Classi

Elenco di righe, **almeno una**; ogni riga si può rimuovere se ne resta almeno una.

| Colonna | Obbligatorio | Regole |
|---|---|---|
| Classe | sì | dalle classi attive dell'anno scolastico in corso; la stessa classe non compare due volte |
| Alunni | sì | uscita di un giorno: numero scritto a mano, da 1 in su. Più giorni: non si scrive, è la somma di maschi e femmine |
| Maschi, Femmine | sì, solo più giorni | numeri da 0; la somma deve essere almeno 1 |
| di cui con disabilità | sì | numero da 0 al totale degli alunni della classe |

Sotto la colonna compare l'avviso: gli alunni con disabilità sono **già inclusi** nel totale. Il form mostra i totali calcolati (alunni, maschi, femmine, di cui con disabilità); non esiste un campo "numero di alunni" a parte.

**Necessità** (sotto l'elenco delle classi): testo lungo facoltativo, per pedane, carrozzine e simili.

### Sezione 3 - Docenti

| Campo | Obbligatorio | Regole |
|---|---|---|
| Referente | sì | una persona attiva dell'elenco; precompilato con la persona che compila, modificabile |
| Accompagnatore | sì | una persona attiva dell'elenco, diversa dal referente |
| Altri accompagnatori | no | elenco di campi con autocompletamento e pulsante "Aggiungi accompagnatore"; ogni riga si può rimuovere |

Nessuna persona può comparire due volte nel modulo (referente, accompagnatore, altri). Si sceglie tra tutte le persone attive, senza distinguere i professori dal resto del personale. Autocompletamento come in [SPEC.md](./SPEC.md) sezione 5.

### Sezione 4 - Obiettivo e programma

| Campo | Obbligatorio | Regole |
|---|---|---|
| Obiettivo dell'uscita | sì | testo lungo (la motivazione) |
| Programma di massima | sì | testo lungo |

Nessuna lunghezza minima o massima.

### Sezione 5 - Trasporti

Elenco di **zero o più** trasporti (un'uscita a piedi non ne ha; gli alunni possono prendere più mezzi). Ogni trasporto si inserisce e si modifica in una finestra `AlertDialog` (non si chiude toccando fuori: l'utente sceglie "Salva" o "Annulla"); su smartphone a tutto schermo, su desktop al centro. L'elenco mostra una riga di riepilogo (mezzo, partenza, destinazione) con "Modifica" ed "Elimina".

| Campo | Obbligatorio | Regole |
|---|---|---|
| Mezzo di trasporto | sì | da elenco (`transport_types`) |
| Luogo di partenza | sì | testo libero, **anche per le uscite di un giorno**, mai precompilato |
| Giorno di partenza | sì, solo più giorni | dentro il periodo dell'uscita. Per un giorno solo è la data dell'uscita |
| Orario di partenza | sì | selettore ora |
| Destinazione del trasporto | sì | testo libero |
| Prenotare anche il ritorno | - | casella |
| Orario di ritorno | sì, se ritorno | se il ritorno è lo stesso giorno della partenza, dopo l'orario di partenza |
| Giorno di ritorno | no, solo più giorni e solo se ritorno | dentro il periodo e non prima del giorno di partenza; se vuoto coincide con il giorno di partenza del trasporto |
| Note | no | testo libero |

### Sezione 6 - Visite e altro

**Visite:** elenco di **zero o più** righe, nella stessa finestra `AlertDialog`.

| Campo | Obbligatorio | Regole |
|---|---|---|
| Tipo di prenotazione | sì | da elenco (`booking_types`) |
| Descrizione | sì | testo libero |
| Orario | sì | selettore ora |

Una visita dura poche ore: non ha un giorno, nemmeno nelle uscite di più giorni (se serve, il giorno si scrive nella descrizione).

**Altri servizi:** testo lungo facoltativo. **Altre note:** testo lungo facoltativo, con l'indicazione di non inserire dati sensibili sugli alunni.

## 2. Layout

**Smartphone:** un passo per sezione, a tutto schermo, con indicatore di avanzamento.

1. Uscita
2. Classi (con Necessità)
3. Docenti
4. Obiettivo e programma
5. Trasporti
6. Visite e altro
7. Riepilogo

**Desktop:** le stesse sezioni, nello stesso ordine e con gli stessi titoli, in **una sola pagina** dentro una scheda, senza indicatore di passi. In fondo il pulsante "Invia".

**Validazione e riepilogo:** come in [SPEC.md](./SPEC.md) sezione 5. Il riepilogo si apre **solo se tutto è corretto**:
- smartphone: "Avanti" non lascia passare se la sezione ha errori, e il riepilogo è l'ultimo passo;
- desktop: "Invia" controlla tutto; se ci sono errori restano evidenziati i campi sbagliati, ciascuno con il suo motivo, e la pagina si sposta sul primo; altrimenti si apre la finestra "Controlla e invia".

**Contenuto del riepilogo:** tutti i dati inseriti, raggruppati per sezione, con i totali calcolati (alunni totali, di cui maschi e femmine, di cui con disabilità). I campi facoltativi vuoti non compaiono. Su smartphone ogni sezione ha un "Modifica" che riporta a quel passo.

## 3. Modello dati (per il passo 4)

Nomi in inglese; chiavi identificative in inglese; migrazioni solo additive; tabelle e RLS come in [SPEC.md](./SPEC.md) sezione 6.

**Tabelle di tipi** (come `classes`: lette dall'app, scritte solo dal gestore, disattivate e non cancellate): `outing_types`, `transport_types`, `booking_types`, ciascuna con `id text` (la chiave in inglese), `name text` (l'etichetta in italiano) e `active boolean`.

| Tabella | Valori iniziali (`id` - `name`) |
|---|---|
| `outing_types` | `other-project` - Altra uscita progettuale, Progetto · `other` - Altro · `language-course` - Corso di lingua, stage, CLIL · `civic-education` - Uscita Ed. Civica, Salute e benessere · `workshops-competitions` - Esercitazioni/Laboratori/Gare · `work-based-learning` - FSL, Visita aziendale · `exchange-erasmus` - Scambio, gemellaggio, Mobilità Erasmus · `local-outing` - Uscita didattica sul territorio · `sports` - Uscita Sportiva · `trip-abroad` - Viaggio culturale all'estero · `trip-italy` - Viaggio culturale in Italia |
| `transport_types` | `train` - Treno · `other` - Altro |
| `booking_types` | `fairs` - Fiere · `guides` - Guide · `workshops` - Laboratori · `other` - Altro |

**Tabelle del modulo** (nessuna lettura né scrittura diretta per i colleghi; si scrive solo dalla funzione di salvataggio):

- `outing_requests`: `id` (uuid dal client), `user_id`, `created_at`, `outing_type_id`, `project`, `destination`, `start_date`, `end_date` (CHECK fine >= inizio; uguali per le uscite di un giorno), `departure_time`, `return_time`, `needs`, `objective`, `program`, `other_services`, `notes`, `lead_person_id` (verso `people`).
- `outing_classes`: uscita, `class_id`, `students_count`, `males_count` e `females_count` (solo più giorni), `students_with_disabilities` (CHECK <= `students_count`).
- `outing_companions`: uscita, `person_id`. Almeno uno; il referente non compare qui; nessuna persona due volte.
- `outing_transports`: uscita, `transport_type_id`, `departure_place`, `departure_day`, `departure_time`, `destination`, `return_required`, `return_day`, `return_time`, `notes`.
- `outing_bookings`: uscita, `booking_type_id`, `description`, `time`.

La funzione di salvataggio (`SECURITY DEFINER`, tutto o niente, "già salvato" se l'uuid esiste) **ripete le regole critiche** del paragrafo 1: campi obbligatori, date e orari coerenti, classi e persone esistenti e attive, nessun doppione, totali e disabilità coerenti, tipi esistenti e attivi.
