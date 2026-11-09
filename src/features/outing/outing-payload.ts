import type { Json } from '@/lib/database.types'
import { parseCount } from './counts'
import type { OutingFormValues } from './outing-form'
import { computeTotals } from './outing-totals'

/** Il testo senza spazi ai bordi, o `null` se resta vuoto. */
const textOrNull = (text: string) => text.trim() || null

/**
 * Converte i valori del form nel formato che si aspetta `submit_outing_request`.
 * Toglie ciò che non vale per il tipo di uscita (maschi e femmine, giorni, ritorno non prenotato).
 */
export function toSubmitPayload(values: OutingFormValues): Record<string, Json> {
  const { multi_day: multiDay } = values

  return {
    id: values.id,
    outing_type_id: values.outing_type_id,
    project: textOrNull(values.project),
    destination: values.destination.trim(),
    start_date: values.start_date,
    end_date: multiDay ? values.end_date : values.start_date,
    departure_time: values.departure_time,
    return_time: values.return_time,
    needs: textOrNull(values.needs),
    objective: values.objective.trim(),
    program: values.program.trim(),
    other_services: textOrNull(values.other_services),
    notes: textOrNull(values.notes),
    lead_person_id: values.lead_person_id,
    classes: values.classes.map((row) => {
      const males = multiDay ? parseCount(row.males_count) : null
      const females = multiDay ? parseCount(row.females_count) : null
      return {
        class_id: row.class_id,
        students_count: multiDay
          ? computeTotals({ multi_day: true, classes: [row] }).students
          : parseCount(row.students_count),
        males_count: males,
        females_count: females,
        students_with_disabilities: parseCount(row.students_with_disabilities),
      }
    }),
    companion_ids: [values.companion_id, ...values.other_companion_ids],
    transports: values.transports.map((row) => ({
      transport_type_id: row.transport_type_id,
      departure_place: row.departure_place.trim(),
      departure_day: multiDay ? row.departure_day : values.start_date,
      departure_time: row.departure_time,
      destination: row.destination.trim(),
      return_required: row.return_required,
      return_day: multiDay && row.return_required ? textOrNull(row.return_day) : null,
      return_time: row.return_required ? row.return_time : null,
      notes: textOrNull(row.notes),
    })),
    bookings: values.bookings.map((row) => ({
      booking_type_id: row.booking_type_id,
      description: row.description.trim(),
      time: row.time,
    })),
  }
}
