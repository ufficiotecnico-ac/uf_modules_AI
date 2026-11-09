import type { OutingFormValues } from './outing-form'

/** "Oggi" fisso per i test, così non dipendono dal giorno in cui girano. */
export const TODAY = '2026-11-10'

/** Una compilazione valida di un giorno (domani). `overrides` sostituisce singoli campi. */
export function validOutingValues(overrides: Partial<OutingFormValues> = {}): OutingFormValues {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    outing_type_id: 'local-outing',
    project: '',
    destination: 'Museo di storia naturale',
    multi_day: false,
    start_date: '2026-11-11',
    end_date: '',
    departure_time: '08:00',
    return_time: '14:00',
    classes: [
      {
        class_id: 'class-1a',
        students_count: '20',
        males_count: '',
        females_count: '',
        students_with_disabilities: '1',
      },
    ],
    needs: '',
    lead_person_id: 'person-utente',
    companion_id: 'person-verdi',
    other_companion_ids: [],
    objective: 'Visita guidata al museo',
    program: 'Mattina: visita guidata',
    transports: [
      {
        transport_type_id: 'train',
        departure_place: 'Stazione centrale',
        departure_day: '2026-11-11',
        departure_time: '08:30',
        destination: 'Milano',
        return_required: true,
        return_day: '',
        return_time: '13:00',
        notes: '',
      },
    ],
    bookings: [{ booking_type_id: 'guides', description: 'Guida al museo', time: '10:00' }],
    other_services: '',
    notes: '',
    ...overrides,
  }
}
