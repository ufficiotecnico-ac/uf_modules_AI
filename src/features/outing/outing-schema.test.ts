import type { ClassRow, OutingFormValues, TransportRow } from './outing-form'
import { createOutingSchema } from './outing-schema'
import { TODAY, validOutingValues } from './test-values'

const schema = createOutingSchema({ today: TODAY })

/** Gli errori dello schema come mappa "percorso del campo → primo messaggio". */
function errorsOf(values: OutingFormValues) {
  const result = schema.safeParse(values)
  const errors: Record<string, string> = {}
  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path.join('.')
      errors[path] ??= issue.message
    }
  }
  return errors
}

describe("schema dell'uscita didattica", () => {
  it('accetta una compilazione completa e valida', () => {
    const result = schema.safeParse(validOutingValues())

    expect(result.success).toBe(true)
  })

  it.each([
    ['outing_type_id', 'Scegli la tipologia di uscita'],
    ['destination', 'Indica la destinazione'],
    ['start_date', 'Indica la data di partenza'],
    ['departure_time', "Indica l'orario di partenza"],
    ['return_time', "Indica l'orario di arrivo in istituto"],
    ['lead_person_id', 'Scegli il referente'],
    ['companion_id', "Scegli l'accompagnatore"],
    ['objective', "Descrivi l'obiettivo dell'uscita"],
    ['program', 'Descrivi il programma di massima'],
  ] as const)('segnala il campo obbligatorio %s se è vuoto', (field, message) => {
    expect(errorsOf(validOutingValues({ [field]: '' }))).toEqual({ [field]: message })
  })

  it('considera vuoti anche i campi di soli spazi', () => {
    expect(errorsOf(validOutingValues({ destination: '   ' }))).toEqual({
      destination: 'Indica la destinazione',
    })
  })

  it('chiede almeno una classe', () => {
    expect(errorsOf(validOutingValues({ classes: [] }))).toEqual({
      classes: 'Aggiungi almeno una classe',
    })
  })

  it('non chiede progetto, necessità, altri servizi e note', () => {
    const values = validOutingValues({
      project: '',
      needs: '',
      other_services: '',
      notes: '',
      other_companion_ids: [],
      transports: [],
      bookings: [],
    })

    expect(errorsOf(values)).toEqual({})
  })
})

describe('date e orari', () => {
  it('rifiuta una data di partenza nel passato', () => {
    expect(errorsOf(validOutingValues({ start_date: '2026-11-09' }))).toEqual({
      start_date: 'La data di partenza non può essere nel passato',
    })
  })

  it('accetta una partenza oggi', () => {
    const values = validOutingValues({ start_date: TODAY })

    expect(errorsOf(values)).toEqual({})
  })

  it('per più giorni chiede la data di ritorno', () => {
    expect(errorsOf(validOutingValues({ multi_day: true, end_date: '' }))).toMatchObject({
      end_date: 'Indica la data di ritorno',
    })
  })

  it.each(['2026-11-11', '2026-11-10'])(
    'per più giorni rifiuta un ritorno che non è dopo la partenza (%s)',
    (end_date) => {
      expect(errorsOf(validOutingValues({ multi_day: true, end_date }))).toMatchObject({
        end_date: 'La data di ritorno deve essere dopo la partenza',
      })
    },
  )

  it('per un giorno solo ignora la data di ritorno', () => {
    expect(errorsOf(validOutingValues({ multi_day: false, end_date: '2020-01-01' }))).toEqual({})
  })

  it("per un giorno solo l'arrivo in istituto deve essere dopo la partenza", () => {
    expect(
      errorsOf(validOutingValues({ departure_time: '14:00', return_time: '08:00' })),
    ).toEqual({ return_time: "L'orario di arrivo deve essere dopo quello di partenza" })
  })

  it("per un giorno solo l'arrivo alla stessa ora della partenza è rifiutato", () => {
    expect(
      errorsOf(validOutingValues({ departure_time: '09:00', return_time: '09:00' })),
    ).toEqual({ return_time: "L'orario di arrivo deve essere dopo quello di partenza" })
  })

  it("per più giorni l'arrivo può essere prima dell'ora di partenza", () => {
    const values = validOutingValues({
      multi_day: true,
      end_date: '2026-11-13',
      departure_time: '14:00',
      return_time: '08:00',
      classes: [
        {
          class_id: 'class-1a',
          students_count: '20',
          males_count: '10',
          females_count: '10',
          students_with_disabilities: '0',
        },
      ],
      transports: [],
    })

    expect(errorsOf(values)).toEqual({})
  })
})

const classRow = (overrides: Partial<ClassRow> = {}): ClassRow => ({
  class_id: 'class-1a',
  students_count: '20',
  males_count: '',
  females_count: '',
  students_with_disabilities: '0',
  ...overrides,
})

/** Un'uscita di più giorni valida (senza trasporti) con le righe di classe indicate. */
const multiDay = (...classes: ClassRow[]) =>
  validOutingValues({ multi_day: true, end_date: '2026-11-13', transports: [], classes })

describe('classi e alunni', () => {
  it('rifiuta una classe non scelta', () => {
    const values = validOutingValues({ classes: [classRow({ class_id: '' })] })

    expect(errorsOf(values)).toEqual({ 'classes.0.class_id': 'Scegli la classe' })
  })

  it('rifiuta la stessa classe indicata due volte, sulla seconda riga', () => {
    const values = validOutingValues({ classes: [classRow(), classRow()] })

    expect(errorsOf(values)).toEqual({ 'classes.1.class_id': "Questa classe è già nell'elenco" })
  })

  it.each(['', '0', '-3', '2.5', 'abc'])(
    'rifiuta "%s" come numero di alunni di un giorno',
    (students_count) => {
      const values = validOutingValues({ classes: [classRow({ students_count })] })

      expect(errorsOf(values)).toEqual({
        'classes.0.students_count': 'Indica il numero di alunni (almeno 1)',
      })
    },
  )

  it('chiede il numero di alunni con disabilità (0 se nessuno)', () => {
    const values = validOutingValues({ classes: [classRow({ students_with_disabilities: '' })] })

    expect(errorsOf(values)).toEqual({
      'classes.0.students_with_disabilities': 'Indica gli alunni con disabilità (0 se nessuno)',
    })
  })

  it('rifiuta più alunni con disabilità che alunni', () => {
    const values = validOutingValues({
      classes: [classRow({ students_count: '5', students_with_disabilities: '6' })],
    })

    expect(errorsOf(values)).toEqual({
      'classes.0.students_with_disabilities':
        'Gli alunni con disabilità non possono essere più degli alunni',
    })
  })

  it('accetta una classe fatta solo di alunni con disabilità', () => {
    const values = validOutingValues({
      classes: [classRow({ students_count: '3', students_with_disabilities: '3' })],
    })

    expect(errorsOf(values)).toEqual({})
  })

  it('per un giorno solo non ammette maschi e femmine', () => {
    const values = validOutingValues({
      classes: [classRow({ males_count: '10', females_count: '10' })],
    })

    expect(errorsOf(values)).toEqual({
      'classes.0.males_count': 'Maschi e femmine si indicano solo per le uscite di più giorni',
    })
  })

  it('per più giorni chiede maschi e femmine', () => {
    const values = multiDay(classRow({ students_count: '' }))

    expect(errorsOf(values)).toEqual({
      'classes.0.males_count': 'Indica quanti sono i maschi',
      'classes.0.females_count': 'Indica quante sono le femmine',
    })
  })

  it('per più giorni accetta zero maschi o zero femmine, ma non nessun alunno', () => {
    expect(errorsOf(multiDay(classRow({ males_count: '0', females_count: '12' })))).toEqual({})
    expect(errorsOf(multiDay(classRow({ males_count: '0', females_count: '0' })))).toEqual({
      'classes.0.males_count': 'Indica almeno un alunno tra maschi e femmine',
    })
  })

  it('per più giorni rifiuta numeri di maschi e femmine non validi', () => {
    const values = multiDay(classRow({ males_count: '-1', females_count: '2.5' }))

    expect(errorsOf(values)).toEqual({
      'classes.0.males_count': 'Indica quanti sono i maschi',
      'classes.0.females_count': 'Indica quante sono le femmine',
    })
  })

  it('per più giorni confronta le disabilità con maschi più femmine', () => {
    const values = multiDay(
      classRow({ males_count: '5', females_count: '5', students_with_disabilities: '11' }),
    )

    expect(errorsOf(values)).toEqual({
      'classes.0.students_with_disabilities':
        'Gli alunni con disabilità non possono essere più degli alunni',
    })
  })
})

describe('referente e accompagnatori', () => {
  const taken = 'Questa persona è già stata scelta'

  it("rifiuta l'accompagnatore uguale al referente", () => {
    const values = validOutingValues({ lead_person_id: 'p1', companion_id: 'p1' })

    expect(errorsOf(values)).toEqual({ companion_id: taken })
  })

  it('rifiuta un altro accompagnatore uguale al referente', () => {
    const values = validOutingValues({ lead_person_id: 'p1', other_companion_ids: ['p1'] })

    expect(errorsOf(values)).toEqual({ 'other_companion_ids.0': taken })
  })

  it("rifiuta un altro accompagnatore uguale all'accompagnatore", () => {
    const values = validOutingValues({ companion_id: 'p2', other_companion_ids: ['p2'] })

    expect(errorsOf(values)).toEqual({ 'other_companion_ids.0': taken })
  })

  it('rifiuta la stessa persona due volte tra gli altri accompagnatori, sulla seconda', () => {
    const values = validOutingValues({ other_companion_ids: ['p3', 'p3'] })

    expect(errorsOf(values)).toEqual({ 'other_companion_ids.1': taken })
  })

  it('accetta più altri accompagnatori diversi', () => {
    const values = validOutingValues({ other_companion_ids: ['p3', 'p4', 'p5'] })

    expect(errorsOf(values)).toEqual({})
  })

  it('rifiuta una riga di altro accompagnatore lasciata vuota', () => {
    const values = validOutingValues({ other_companion_ids: ['p3', ''] })

    expect(errorsOf(values)).toEqual({
      'other_companion_ids.1': 'Scegli la persona oppure rimuovi la riga',
    })
  })
})

const transportRow = (overrides: Partial<TransportRow> = {}): TransportRow => ({
  transport_type_id: 'train',
  departure_place: 'Stazione centrale',
  departure_day: '2026-11-11',
  departure_time: '08:30',
  destination: 'Milano',
  return_required: true,
  return_day: '',
  return_time: '13:00',
  notes: '',
  ...overrides,
})

/** Un'uscita di più giorni (dall'11 al 13 novembre) con i trasporti indicati. */
const multiDayTransports = (...transports: TransportRow[]) =>
  validOutingValues({
    multi_day: true,
    end_date: '2026-11-13',
    classes: [classRow({ males_count: '10', females_count: '10' })],
    transports,
  })

describe('trasporti', () => {
  it.each([
    ['transport_type_id', 'Scegli il mezzo di trasporto'],
    ['departure_place', 'Indica il luogo di partenza'],
    ['destination', 'Indica la destinazione del trasporto'],
    ['departure_time', "Indica l'orario di partenza del trasporto"],
  ] as const)('segnala %s vuoto sulla riga giusta', (field, message) => {
    const values = validOutingValues({
      transports: [transportRow(), transportRow({ [field]: '' })],
    })

    expect(errorsOf(values)).toEqual({ [`transports.1.${field}`]: message })
  })

  it("per un giorno solo non chiede il giorno del trasporto", () => {
    const values = validOutingValues({
      transports: [transportRow({ departure_day: '', return_day: '' })],
    })

    expect(errorsOf(values)).toEqual({})
  })

  it("chiede l'orario di ritorno solo se il ritorno è da prenotare", () => {
    const required = validOutingValues({ transports: [transportRow({ return_time: '' })] })
    const notRequired = validOutingValues({
      transports: [transportRow({ return_required: false, return_time: '' })],
    })

    expect(errorsOf(required)).toEqual({
      'transports.0.return_time': "Indica l'orario di ritorno",
    })
    expect(errorsOf(notRequired)).toEqual({})
  })

  it('per un giorno solo il ritorno deve essere dopo la partenza', () => {
    const values = validOutingValues({
      transports: [transportRow({ departure_time: '10:00', return_time: '09:00' })],
    })

    expect(errorsOf(values)).toEqual({
      'transports.0.return_time': 'Il ritorno deve essere dopo la partenza',
    })
  })

  it('per più giorni chiede il giorno di partenza', () => {
    const values = multiDayTransports(transportRow({ departure_day: '' }))

    expect(errorsOf(values)).toEqual({
      'transports.0.departure_day': 'Indica il giorno di partenza',
    })
  })

  it.each(['2026-11-10', '2026-11-14'])(
    "per più giorni rifiuta il giorno di partenza %s fuori dal periodo",
    (departure_day) => {
      const values = multiDayTransports(transportRow({ departure_day }))

      expect(errorsOf(values)).toEqual({
        'transports.0.departure_day': "Il giorno deve essere compreso nel periodo dell'uscita",
      })
    },
  )

  it("per più giorni accetta partenza e ritorno nel primo e nell'ultimo giorno", () => {
    const values = multiDayTransports(
      transportRow({ departure_day: '2026-11-11', return_day: '2026-11-13', return_time: '17:00' }),
    )

    expect(errorsOf(values)).toEqual({})
  })

  it('per più giorni rifiuta il giorno di ritorno fuori dal periodo', () => {
    const values = multiDayTransports(transportRow({ return_day: '2026-11-14' }))

    expect(errorsOf(values)).toEqual({
      'transports.0.return_day': "Il giorno deve essere compreso nel periodo dell'uscita",
    })
  })

  it('per più giorni rifiuta un giorno di ritorno prima della partenza', () => {
    const values = multiDayTransports(
      transportRow({ departure_day: '2026-11-12', return_day: '2026-11-11' }),
    )

    expect(errorsOf(values)).toEqual({
      'transports.0.return_day': 'Il giorno di ritorno non può precedere la partenza',
    })
  })

  it('per più giorni senza giorno di ritorno vale il giorno di partenza: il ritorno deve essere dopo', () => {
    const values = multiDayTransports(transportRow({ departure_time: '10:00', return_time: '09:00' }))

    expect(errorsOf(values)).toEqual({
      'transports.0.return_time': 'Il ritorno deve essere dopo la partenza',
    })
  })

  it("per più giorni un ritorno in un giorno successivo può avere un'ora precedente", () => {
    const values = multiDayTransports(
      transportRow({
        departure_time: '10:00',
        return_day: '2026-11-12',
        return_time: '09:00',
      }),
    )

    expect(errorsOf(values)).toEqual({})
  })
})

describe('visite', () => {
  const booking = { booking_type_id: 'guides', description: 'Guida al museo', time: '10:00' }

  it.each([
    ['booking_type_id', 'Scegli il tipo di prenotazione'],
    ['description', 'Descrivi la visita'],
    ['time', "Indica l'orario della visita"],
  ] as const)('segnala %s vuoto sulla riga giusta', (field, message) => {
    const values = validOutingValues({ bookings: [booking, { ...booking, [field]: '' }] })

    expect(errorsOf(values)).toEqual({ [`bookings.1.${field}`]: message })
  })

  it('accetta più visite e nessuna visita', () => {
    expect(errorsOf(validOutingValues({ bookings: [booking, booking] }))).toEqual({})
    expect(errorsOf(validOutingValues({ bookings: [] }))).toEqual({})
  })
})

