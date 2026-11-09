import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/lib/database.types'

type Client = SupabaseClient<Database>
export type OutingPayload = Record<string, Json>

/** Le compilazioni dei test hanno la destinazione che inizia così: si cancellano a mano (vedi seed-dev.sql). */
export const TEST_TAG = '[TEST]'

/** Data locale nel formato AAAA-MM-GG, `offset` giorni da oggi. */
export function dayFromToday(offset: number) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Gli id reali di persone e classi di prova, per cognome e nome della classe. */
export async function loadReferenceIds(client: Client) {
  const people = await client.from('people').select('id, last_name')
  const classes = await client.from('classes').select('id, name, school_year')
  if (people.error || classes.error) throw new Error('Impossibile leggere gli elenchi di prova')
  const currentYear = classes.data.filter((c) => c.school_year === '2026/2027')
  const previousYear = classes.data.filter((c) => c.school_year === '2025/2026')
  return {
    person: Object.fromEntries(people.data.map((p) => [p.last_name, p.id])),
    /** Classi dell'anno scolastico in corso, per nome (3D è disattivata). */
    klass: Object.fromEntries(currentYear.map((c) => [c.name, c.id])),
    /** Classi dell'anno scolastico precedente, per nome. */
    previousYearKlass: Object.fromEntries(previousYear.map((c) => [c.name, c.id])),
  }
}

export type ReferenceIds = Awaited<ReturnType<typeof loadReferenceIds>>

/** Una compilazione valida di un solo giorno; `overrides` sostituisce singoli campi. */
export function validOutingPayload(refs: ReferenceIds, overrides: OutingPayload = {}): OutingPayload {
  const tomorrow = dayFromToday(1)
  return {
    id: crypto.randomUUID(),
    outing_type_id: 'local-outing',
    project: null,
    destination: `${TEST_TAG} Museo di storia naturale`,
    start_date: tomorrow,
    end_date: tomorrow,
    departure_time: '08:00',
    return_time: '14:00',
    needs: null,
    objective: 'Visita guidata al museo',
    program: 'Mattina: visita guidata',
    other_services: null,
    notes: null,
    lead_person_id: refs.person['Utente'],
    classes: [
      {
        class_id: refs.klass['1A'],
        students_count: 20,
        males_count: null,
        females_count: null,
        students_with_disabilities: 1,
      },
    ],
    companion_ids: [refs.person['Verdi']],
    transports: [
      {
        transport_type_id: 'train',
        departure_place: 'Stazione centrale',
        departure_day: tomorrow,
        departure_time: '08:30',
        destination: 'Milano',
        return_required: true,
        return_day: null,
        return_time: '13:00',
        notes: null,
      },
    ],
    bookings: [{ booking_type_id: 'guides', description: 'Guida al museo', time: '10:00' }],
    ...overrides,
  }
}

/** Una compilazione valida di più giorni (da domani a fra tre giorni), con maschi e femmine. */
export function validMultiDayOutingPayload(
  refs: ReferenceIds,
  overrides: OutingPayload = {},
): OutingPayload {
  const start = dayFromToday(1)
  const end = dayFromToday(3)
  return validOutingPayload(refs, {
    end_date: end,
    classes: [
      {
        class_id: refs.klass['1A'],
        students_count: 22,
        males_count: 12,
        females_count: 10,
        students_with_disabilities: 1,
      },
    ],
    transports: [
      {
        transport_type_id: 'train',
        departure_place: 'Stazione centrale',
        departure_day: start,
        departure_time: '08:30',
        destination: 'Roma',
        return_required: true,
        return_day: end,
        return_time: '17:00',
        notes: null,
      },
    ],
    ...overrides,
  })
}
