---
type: grilling
status: closed
assignee: luca.bonin
blocked-by: [05-modello-dati-supabase-grilling.md]
---

# Validazione e prevenzione dell'errore umano

## Question

Il programma deve ridurre al minimo l'errore umano, e i moduli saranno compilati soprattutto da smartphone, con controlli dei valori sezione per sezione. Come si ottiene? Domande da chiudere:

- dove vivono le regole: solo nel client, o anche come vincoli nel database (CHECK, NOT NULL, tipi) come seconda difesa?
- come si descrivono le regole una volta sola e si riusano nei passi mobile e nella pagina unica desktop (libreria di schema/validazione)?
- quali tipi di controllo riducono gli errori (selettori e date picker invece di testo libero, campi numerici, valori limitati)?
- quando compaiono gli errori (alla fine di ogni sezione, al blur) e come si mostrano su schermo piccolo?
- serve un riepilogo da confermare prima dell'invio finale?
- come si evita il doppio invio?

Input dal modello dati: il salvataggio passa da una funzione sul database che valida lato server e scrive tutto in una transazione; le tabelle hanno vincoli (NOT NULL, tipi, CHECK). Gli accompagnatori e le classi si scelgono da elenchi (`people` con autocompletamento, `classes` dell'anno in corso): se il nome non esiste il modulo dà errore. L'uuid del modulo è generato dal client e protegge dal doppio invio. Resta da decidere come l'autocompletamento previene l'errore prima dell'invio e come si mostrano gli errori della funzione sul telefono.

## Resolution

Strategia di validazione decisa con l'autore.

- **Regole in un solo posto:** uno schema `zod` per modulo nel client, usato sia dai passi su smartphone sia dalla pagina unica su desktop, con `react-hook-form` e i componenti di shadcn. Le regole **critiche** si ripetono nella funzione sul database e nei vincoli come ultima difesa: campi obbligatori, data di fine non prima di quella di inizio, accompagnatori e classi realmente esistenti e attivi.
- **Quando compaiono gli errori:**
  - **smartphone:** al passaggio di sezione ("Avanti"). Se ci sono errori **non si va avanti**;
  - **desktop:** quando si preme l'invio del modulo.
  - **Dove e come:** messaggio **in italiano sotto il campo**, nello stile degli errori di shadcn (componente `FieldError`), con la pagina che si sposta sul primo errore. Se un campo con errore viene modificato, **a ogni modifica si ricontrolla** e la segnalazione sparisce **solo quando il valore diventa valido**.
- **Tipi di campo che riducono l'errore:** date con selettore nativo (`type="date"`), numeri con tastiera numerica e minimo/massimo, classi a selezione multipla da elenco, accompagnatori con autocompletamento. La **data di inizio non può essere nel passato** (si può compilare il giorno stesso); la data di fine non può precedere l'inizio.
- **Riepilogo prima dell'invio, obbligatorio:** su smartphone è l'ultimo passo; su desktop una finestra "Controlla e invia" con i dati principali. Serve perché dopo l'invio i colleghi non possono modificare né cancellare.
- **Dati in corso non persi:** salvati nel **browser** del collega (locale al dispositivo, non una bozza sul server), recuperati alla riapertura del modulo, **cancellati dopo l'invio riuscito e al logout** per i telefoni condivisi.
- **Autocompletamento delle persone:** l'elenco delle persone attive si carica **una sola volta** all'apertura del modulo e si filtra in locale, ignorando accenti e maiuscole. Si può scegliere solo una persona dell'elenco; se non c'è corrispondenza compare "Nessuna persona trovata". Il numero di persone non è stato indicato: l'approccio regge fino a circa un migliaio; se si superasse, si passa a una ricerca lato server.
- **Errori dalla funzione sul database:** messaggi in italiano comprensibili mostrati nel modulo; i dati restano compilati e si può riprovare con lo stesso uuid (nessun doppio invio).
- **Già deciso altrove:** protezione dal doppio invio con uuid generato dal client (modello dati).
