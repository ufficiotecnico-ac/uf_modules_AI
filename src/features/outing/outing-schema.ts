import { z } from 'zod'
import { parseCount } from './counts'
import { outingMessages as m } from './outing-messages'

/** Testo che non può essere vuoto né fatto di soli spazi. */
const required = (message: string) => z.string().trim().min(1, message)

const classRow = z.object({
  class_id: z.string(),
  students_count: z.string(),
  males_count: z.string(),
  females_count: z.string(),
  students_with_disabilities: z.string(),
})

const transportRow = z.object({
  transport_type_id: z.string(),
  departure_place: z.string(),
  departure_day: z.string(),
  departure_time: z.string(),
  destination: z.string(),
  return_required: z.boolean(),
  return_day: z.string(),
  return_time: z.string(),
  notes: z.string(),
})

const bookingRow = z.object({
  booking_type_id: z.string(),
  description: z.string(),
  time: z.string(),
})

/** Lo schema del form. `today` è la data di oggi ("AAAA-MM-GG", ora italiana). */
export function createOutingSchema(options: { today: string }) {
  const base = z.object({
    id: z.string(),
    outing_type_id: required(m.outingTypeRequired),
    project: z.string(),
    destination: required(m.destinationRequired),
    multi_day: z.boolean(),
    start_date: required(m.startDateRequired),
    end_date: z.string(),
    departure_time: required(m.departureTimeRequired),
    return_time: required(m.returnTimeRequired),
    classes: z.array(classRow).min(1, m.classesRequired),
    needs: z.string(),
    lead_person_id: required(m.leadPersonRequired),
    companion_id: required(m.companionRequired),
    other_companion_ids: z.array(z.string()),
    objective: required(m.objectiveRequired),
    program: required(m.programRequired),
    transports: z.array(transportRow),
    bookings: z.array(bookingRow),
    other_services: z.string(),
    notes: z.string(),
  })

  return base.superRefine((values, ctx) => {
    const fail = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message })
    const failAt = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message })

    if (values.start_date && values.start_date < options.today) {
      fail('start_date', m.startDateInPast)
    }
    if (values.multi_day) {
      if (!values.end_date.trim()) fail('end_date', m.endDateRequired)
      else if (values.start_date && values.end_date <= values.start_date) {
        fail('end_date', m.endDateNotAfterStart)
      }
    } else if (values.departure_time && values.return_time && values.return_time <= values.departure_time) {
      fail('return_time', m.returnNotAfterDeparture)
    }

    const seenClasses = new Set<string>()
    values.classes.forEach((row, index) => {
      const at = (field: string) => ['classes', index, field]

      if (!row.class_id.trim()) failAt(at('class_id'), m.classRequired)
      else if (seenClasses.has(row.class_id)) failAt(at('class_id'), m.classDuplicate)
      seenClasses.add(row.class_id)

      let students: number | null
      if (values.multi_day) {
        const males = parseCount(row.males_count)
        const females = parseCount(row.females_count)
        if (males === null) failAt(at('males_count'), m.malesRequired)
        if (females === null) failAt(at('females_count'), m.femalesRequired)
        students = males !== null && females !== null ? males + females : null
        if (students === 0) failAt(at('males_count'), m.noStudents)
      } else {
        students = parseCount(row.students_count)
        if (students === null || students < 1) failAt(at('students_count'), m.studentsCountInvalid)
        if (row.males_count.trim() || row.females_count.trim()) {
          failAt(at('males_count'), m.genderCountsOnlyMultiDay)
        }
      }

      const disabled = parseCount(row.students_with_disabilities)
      if (disabled === null) failAt(at('students_with_disabilities'), m.disabledCountRequired)
      else if (students !== null && disabled > students) {
        failAt(at('students_with_disabilities'), m.disabledCountTooHigh)
      }
    })

    const chosenPeople = new Set<string>()
    if (values.lead_person_id.trim()) chosenPeople.add(values.lead_person_id)
    if (values.companion_id.trim()) {
      if (chosenPeople.has(values.companion_id)) fail('companion_id', m.personAlreadyChosen)
      chosenPeople.add(values.companion_id)
    }
    values.other_companion_ids.forEach((personId, index) => {
      const at = ['other_companion_ids', index]
      if (!personId.trim()) failAt(at, m.otherCompanionEmpty)
      else if (chosenPeople.has(personId)) failAt(at, m.personAlreadyChosen)
      chosenPeople.add(personId)
    })

    const periodKnown = values.multi_day && !!values.start_date.trim() && !!values.end_date.trim()
    const inPeriod = (day: string) => day >= values.start_date && day <= values.end_date

    values.transports.forEach((row, index) => {
      const at = (field: string) => ['transports', index, field]

      if (!row.transport_type_id.trim()) failAt(at('transport_type_id'), m.transportTypeRequired)
      if (!row.departure_place.trim()) failAt(at('departure_place'), m.transportPlaceRequired)
      if (!row.destination.trim()) failAt(at('destination'), m.transportDestinationRequired)
      if (!row.departure_time.trim()) failAt(at('departure_time'), m.transportDepartureTimeRequired)

      // Il giorno si chiede solo per le uscite di più giorni; per un giorno solo è la data dell'uscita.
      const departureDay = values.multi_day ? row.departure_day.trim() : ''
      if (values.multi_day) {
        if (!departureDay) failAt(at('departure_day'), m.transportDayRequired)
        else if (periodKnown && !inPeriod(departureDay)) {
          failAt(at('departure_day'), m.transportDayOutOfPeriod)
        }
        const returnDay = row.return_required ? row.return_day.trim() : ''
        if (returnDay) {
          if (periodKnown && !inPeriod(returnDay)) failAt(at('return_day'), m.transportDayOutOfPeriod)
          else if (departureDay && returnDay < departureDay) {
            failAt(at('return_day'), m.transportReturnDayBeforeDeparture)
          }
        }
      }

      if (row.return_required) {
        if (!row.return_time.trim()) failAt(at('return_time'), m.transportReturnTimeRequired)
        else if (row.departure_time.trim() && (!values.multi_day || departureDay)) {
          const returnDay = values.multi_day ? row.return_day.trim() || departureDay : ''
          const sameDay = returnDay === departureDay
          if (sameDay && row.return_time <= row.departure_time) {
            failAt(at('return_time'), m.transportReturnNotAfterDeparture)
          }
        }
      }
    })

    values.bookings.forEach((row, index) => {
      const at = (field: string) => ['bookings', index, field]

      if (!row.booking_type_id.trim()) failAt(at('booking_type_id'), m.bookingTypeRequired)
      if (!row.description.trim()) failAt(at('description'), m.bookingDescriptionRequired)
      if (!row.time.trim()) failAt(at('time'), m.bookingTimeRequired)
    })
  })
}
