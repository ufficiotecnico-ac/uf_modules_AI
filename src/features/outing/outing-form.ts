/**
 * I valori del form dell'Uscita didattica, come li tengono i campi HTML:
 * date e orari come testo ("2026-11-10", "08:30"), numeri come testo ("20"), vuoto = "".
 */
export type ClassRow = {
  class_id: string
  students_count: string
  males_count: string
  females_count: string
  students_with_disabilities: string
}

export type TransportRow = {
  transport_type_id: string
  departure_place: string
  departure_day: string
  departure_time: string
  destination: string
  return_required: boolean
  return_day: string
  return_time: string
  notes: string
}

export type BookingRow = {
  booking_type_id: string
  description: string
  time: string
}

export type OutingFormValues = {
  /** uuid generato dal client all'apertura del modulo. */
  id: string
  outing_type_id: string
  project: string
  destination: string
  multi_day: boolean
  start_date: string
  end_date: string
  departure_time: string
  return_time: string
  classes: ClassRow[]
  needs: string
  lead_person_id: string
  companion_id: string
  other_companion_ids: string[]
  objective: string
  program: string
  transports: TransportRow[]
  bookings: BookingRow[]
  other_services: string
  notes: string
}
