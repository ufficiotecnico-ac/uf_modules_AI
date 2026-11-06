---
type: prototype
status: closed
assignee: luca.bonin
blocked-by: []
---

# Prototipo: griglia dashboard e pagina modulo

## Question

Come appare e si comporta il flusso UX? Prototipo rozzo e usa-e-getta con shadcn/ui:

- la **griglia** di card-modulo (cosa mostra una card: titolo, icona, descrizione breve?);
- come appaiono i moduli non ancora disponibili (nascosti, segnaposto "in arrivo")?;
- la **navigazione** tra griglia e pagina modulo (rotte, pulsante indietro) e se serve un router;
- la **pagina modulo** con form di esempio, stati di invio (in corso, successo, errore) e schermata di conferma;
- schermata di login e comportamento da non autenticato.

Esito: il prototipo (collegato come asset) più la decisione su layout e navigazione, registrata nella resolution.

## Prototype

Codice archiviato in `prototypes/griglia/` (fuori da `src`, non entra nella build). Per rivederlo: copiare la cartella in `src/prototype/` e montare `PrototypeApp` in `src/main.tsx`, poi `bun run dev` e `?variant=A|B|C`.

- A: griglia di card, il modulo si apre a pagina intera.
- B: sidebar con i moduli + pannello a destra, nessun cambio di pagina.
- C: launcher a tile raggruppati per categoria con ricerca, form a passi a tutto schermo.

Interruttori nella barra in basso: "Moduli in arrivo" (mostra/nasconde i segnaposto) e "Simula errore" (l'invio fallisce). I campi del form e i moduli diversi da Uscita didattica sono inventati. Login condiviso, non in discussione.

## Resolution

Verdetto dell'autore dopo aver provato le tre varianti.

- **Struttura base: variante A.** Griglia di card responsive, ognuna con titolo, icona e **descrizione**: la descrizione serve a rendere chiaro il modulo e a ridurre al minimo l'errore umano. Dalla variante C si tiene la **testata** "Ciao, che modulo vuoi compilare oggi?". Niente sidebar (B scartata) e niente launcher a tile con ricerca (C scartata, a parte la testata).
- **Moduli non ancora disponibili:** mostrati come card disattivate con badge **"In arrivo"** (non nascosti).
- **Form responsive, due layout:**
  - **smartphone:** stile C, form **a passi**, con i valori inseriti **controllati sezione per sezione** prima di passare alla successiva;
  - **desktop:** stile A, form su **una sola pagina** dentro una card.
  I moduli saranno compilati soprattutto da smartphone: il mobile è il caso primario (mobile-first).
- **Navigazione:** ogni modulo ha una **pagina dedicata con un proprio URL** (es. `/modulo/uscita-didattica`). Serve quindi un router; la libreria si sceglie in implementazione. Il ricaricamento della pagina funziona su Cloudflare Pages senza configurazione (vedi ricerca sul deploy).
- **Stati di invio** visti nel prototipo e da tenere: in corso, successo con schermata di conferma e ritorno ai moduli, errore con dati conservati e possibilità di riprovare.

Nuove questioni emerse: la saluto "Ciao, ..." vorrebbe il nome del collega (legato al ticket sul modello di accesso) e la prevenzione dell'errore umano chiede una strategia di validazione (nuovo ticket).
