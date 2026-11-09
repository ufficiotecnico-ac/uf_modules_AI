const MESSAGES: Record<string, string> = {
  not_authenticated: 'Non risulti collegato. Esci e accedi di nuovo.',
  id_conflict: 'Il modulo non può essere salvato. Riapri la pagina e riprova.',
  missing_required_field: 'Mancano dei dati obbligatori. Controlla il modulo.',
  start_date_in_past: 'La data di partenza non può essere nel passato.',
  end_before_start: 'La data di ritorno non può essere prima della partenza.',
  return_before_departure: "L'orario di arrivo deve essere dopo quello di partenza.",
  invalid_outing_type: 'La tipologia di uscita scelta non è più disponibile. Sceglila di nuovo.',
  invalid_lead_person: 'Il referente scelto non è più disponibile. Sceglilo di nuovo.',
  no_companion: 'Serve almeno un accompagnatore.',
  invalid_companion: 'Un accompagnatore scelto non è più disponibile. Sceglilo di nuovo.',
  duplicate_person: 'Una persona è stata scelta più di una volta.',
  no_classes: 'Aggiungi almeno una classe.',
  invalid_class: "Una classe scelta non è disponibile per l'anno scolastico in corso. Sceglila di nuovo.",
  duplicate_class: 'Una classe è stata indicata più di una volta.',
  invalid_students_count: 'Ogni classe deve avere almeno un alunno.',
  gender_counts_required: 'Per le uscite di più giorni indica maschi e femmine di ogni classe.',
  invalid_gender_counts: 'Maschi e femmine devono sommare al numero di alunni della classe.',
  unexpected_gender_counts: 'Maschi e femmine si indicano solo per le uscite di più giorni.',
  invalid_disabled_count: 'Gli alunni con disabilità non possono essere più degli alunni.',
  invalid_transport_type: 'Un mezzo di trasporto scelto non è più disponibile. Sceglilo di nuovo.',
  transport_day_out_of_range: "Un giorno di trasporto è fuori dal periodo dell'uscita.",
  invalid_transport_return: 'Il ritorno di un trasporto non è valido. Controlla giorno e orario.',
  invalid_booking_type: 'Un tipo di prenotazione scelto non è più disponibile. Sceglilo di nuovo.',
}

const GENERIC_MESSAGE = 'Non è stato possibile inviare il modulo. Riprova tra poco.'

/** Il messaggio in italiano per un errore della funzione `submit_outing_request` (il suo codice). */
export function submitErrorMessage(code: string | undefined): string {
  return code && Object.hasOwn(MESSAGES, code) ? MESSAGES[code] : GENERIC_MESSAGE
}
