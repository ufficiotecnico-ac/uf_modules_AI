# Moduli scuola

Applicazione per i colleghi della scuola: una griglia di moduli da compilare, ognuno con una propria pagina, le cui compilazioni vengono salvate e lette dal gestore.

## Language

**Modulo**:
Un form fisso che i colleghi possono compilare, con un titolo e una descrizione che ne chiarisce lo scopo. I moduli sono definiti dal gestore e non cambiano dall'interfaccia.
_Avoid_: form, template, pratica

**Uscita didattica**:
Il primo modulo disponibile: la richiesta di autorizzare un'uscita o una visita guidata, che può durare più giorni.
_Avoid_: gita, viaggio d'istruzione (è un altro modulo, non ancora disponibile)

**Compilazione**:
Un modulo compilato e inviato da un collega. Una volta inviata non si modifica né si cancella dall'applicazione.
_Avoid_: invio, submission, richiesta

**Collega**:
Una persona del personale che ha un account, accede all'applicazione e compila i moduli.
_Avoid_: utente, docente, operatore

**Gestore**:
La persona che crea gli account dei colleghi, mantiene gli elenchi e legge e corregge le compilazioni.
_Avoid_: admin, amministratore, autore

**Persona**:
Un membro del personale interno presente nell'elenco, selezionabile nei campi dei moduli. Può avere o non avere un account.
_Avoid_: anagrafica, contatto

**Accompagnatore**:
Una persona dell'elenco che partecipa a un'uscita didattica. Deve esistere nell'elenco: non si può indicare chi non c'è.
_Avoid_: partecipante, esterno

**Classe**:
Un gruppo di alunni identificato da un nome, valido per un solo anno scolastico. La stessa denominazione in anni diversi è una classe diversa.
_Avoid_: sezione, corso

**Anno scolastico**:
Il periodo da settembre ad agosto a cui appartengono le classi. La compilazione propone solo le classi dell'anno in corso.
_Avoid_: anno accademico

**Elenco**:
Una lista di riferimento (persone, classi) mantenuta dal gestore e consultata dai colleghi senza poterla modificare.
_Avoid_: anagrafica, archivio

**Griglia dei moduli**:
La pagina iniziale con una scheda per ogni modulo, compresi quelli non ancora disponibili, segnati come "In arrivo".
_Avoid_: dashboard (si confonde con la dashboard di Supabase), home
