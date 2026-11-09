import { signedInClient } from './clients'
import {
  dayFromToday,
  loadReferenceIds,
  validMultiDayOutingPayload,
  validOutingPayload,
  type OutingPayload,
  type ReferenceIds,
} from './outing-payload'

let client: Awaited<ReturnType<typeof signedInClient>>['client']
let refs: ReferenceIds

beforeAll(async () => {
  ;({ client } = await signedInClient())
  refs = await loadReferenceIds(client)
})

const submit = (payload: OutingPayload) => client.rpc('submit_outing_request', { payload })

const classesOf = (payload: OutingPayload) => payload.classes as OutingPayload[]
const transportsOf = (payload: OutingPayload) => payload.transports as OutingPayload[]
const bookingsOf = (payload: OutingPayload) => payload.bookings as OutingPayload[]

type Rejection = {
  name: string
  expectedCode: string
  /** Una compilazione valida che la prova rende non valida. */
  build: () => { valid: OutingPayload; broken: OutingPayload }
}

/** Parte da una compilazione valida di un giorno e applica le modifiche al solo `broken`. */
function singleDay(change: (valid: OutingPayload) => OutingPayload) {
  const valid = validOutingPayload(refs)
  return { valid, broken: change(valid) }
}

function multiDay(change: (valid: OutingPayload) => OutingPayload) {
  const valid = validMultiDayOutingPayload(refs)
  return { valid, broken: change(valid) }
}

const REJECTIONS: Rejection[] = [
  // Campi obbligatori
  {
    name: 'una destinazione vuota',
    expectedCode: 'missing_required_field',
    build: () => singleDay((v) => ({ ...v, destination: '   ' })),
  },
  {
    name: "un obiettivo vuoto",
    expectedCode: 'missing_required_field',
    build: () => singleDay((v) => ({ ...v, objective: '' })),
  },
  {
    name: 'un programma vuoto',
    expectedCode: 'missing_required_field',
    build: () => singleDay((v) => ({ ...v, program: '' })),
  },
  {
    name: 'una data di partenza mancante',
    expectedCode: 'missing_required_field',
    build: () => singleDay((v) => ({ ...v, start_date: null })),
  },
  {
    name: "un orario di partenza mancante",
    expectedCode: 'missing_required_field',
    build: () => singleDay((v) => ({ ...v, departure_time: null })),
  },
  {
    name: 'un luogo di partenza del trasporto vuoto',
    expectedCode: 'missing_required_field',
    build: () =>
      singleDay((v) => ({ ...v, transports: [{ ...transportsOf(v)[0], departure_place: '' }] })),
  },
  {
    name: 'una destinazione del trasporto vuota',
    expectedCode: 'missing_required_field',
    build: () =>
      singleDay((v) => ({ ...v, transports: [{ ...transportsOf(v)[0], destination: ' ' }] })),
  },
  {
    name: 'una descrizione della visita vuota',
    expectedCode: 'missing_required_field',
    build: () =>
      singleDay((v) => ({ ...v, bookings: [{ ...bookingsOf(v)[0], description: '' }] })),
  },

  // Date e orari
  {
    name: 'una data di partenza nel passato',
    expectedCode: 'start_date_in_past',
    build: () =>
      singleDay((v) => ({ ...v, start_date: dayFromToday(-1), end_date: dayFromToday(-1) })),
  },
  {
    name: 'una data di ritorno prima della partenza',
    expectedCode: 'end_before_start',
    build: () => singleDay((v) => ({ ...v, end_date: dayFromToday(0) })),
  },
  {
    name: 'un rientro prima della partenza in un solo giorno',
    expectedCode: 'return_before_departure',
    build: () => singleDay((v) => ({ ...v, departure_time: '14:00', return_time: '08:00' })),
  },
  {
    name: 'un rientro alla stessa ora della partenza in un solo giorno',
    expectedCode: 'return_before_departure',
    build: () => singleDay((v) => ({ ...v, departure_time: '09:00', return_time: '09:00' })),
  },

  // Alunni
  {
    name: 'una classe senza alunni',
    expectedCode: 'invalid_students_count',
    build: () =>
      singleDay((v) => ({ ...v, classes: [{ ...classesOf(v)[0], students_count: 0 }] })),
  },
  {
    name: 'più alunni con disabilità che alunni',
    expectedCode: 'invalid_disabled_count',
    build: () =>
      singleDay((v) => ({
        ...v,
        classes: [{ ...classesOf(v)[0], students_count: 5, students_with_disabilities: 6 }],
      })),
  },
  {
    name: 'maschi e femmine in un\'uscita di un giorno',
    expectedCode: 'unexpected_gender_counts',
    build: () =>
      singleDay((v) => ({
        ...v,
        classes: [{ ...classesOf(v)[0], males_count: 10, females_count: 10, students_count: 20 }],
      })),
  },
  {
    name: 'maschi e femmine mancanti in un\'uscita di più giorni',
    expectedCode: 'gender_counts_required',
    build: () =>
      multiDay((v) => ({
        ...v,
        classes: [{ ...classesOf(v)[0], males_count: null, females_count: null }],
      })),
  },
  {
    name: 'maschi e femmine che non sommano al totale della classe',
    expectedCode: 'invalid_gender_counts',
    build: () =>
      multiDay((v) => ({
        ...v,
        classes: [{ ...classesOf(v)[0], students_count: 30, males_count: 12, females_count: 10 }],
      })),
  },

  // Trasporti
  {
    name: 'un giorno di partenza del trasporto fuori dall\'uscita di un giorno',
    expectedCode: 'transport_day_out_of_range',
    build: () =>
      singleDay((v) => ({
        ...v,
        transports: [{ ...transportsOf(v)[0], departure_day: dayFromToday(2) }],
      })),
  },
  {
    name: 'un giorno di partenza del trasporto prima dell\'inizio',
    expectedCode: 'transport_day_out_of_range',
    build: () =>
      multiDay((v) => ({
        ...v,
        transports: [{ ...transportsOf(v)[0], departure_day: dayFromToday(0) }],
      })),
  },
  {
    name: 'un giorno di ritorno del trasporto dopo la fine',
    expectedCode: 'transport_day_out_of_range',
    build: () =>
      multiDay((v) => ({
        ...v,
        transports: [{ ...transportsOf(v)[0], return_day: dayFromToday(4) }],
      })),
  },
  {
    name: 'un ritorno da prenotare senza orario',
    expectedCode: 'invalid_transport_return',
    build: () =>
      singleDay((v) => ({
        ...v,
        transports: [{ ...transportsOf(v)[0], return_required: true, return_time: null }],
      })),
  },
  {
    name: 'un orario di ritorno senza ritorno da prenotare',
    expectedCode: 'invalid_transport_return',
    build: () =>
      singleDay((v) => ({
        ...v,
        transports: [{ ...transportsOf(v)[0], return_required: false, return_time: '13:00' }],
      })),
  },
  {
    name: 'un ritorno dello stesso giorno prima della partenza',
    expectedCode: 'invalid_transport_return',
    build: () =>
      singleDay((v) => ({
        ...v,
        transports: [{ ...transportsOf(v)[0], departure_time: '10:00', return_time: '09:00' }],
      })),
  },
  {
    name: 'un giorno di ritorno del trasporto prima del giorno di partenza',
    expectedCode: 'invalid_transport_return',
    build: () =>
      multiDay((v) => ({
        ...v,
        transports: [
          { ...transportsOf(v)[0], departure_day: dayFromToday(3), return_day: dayFromToday(2) },
        ],
      })),
  },
]

describe("salvataggio di un'uscita didattica: campi, date, alunni e trasporti", () => {
  it.each(REJECTIONS)('rifiuta $name', async ({ build, expectedCode }) => {
    const { valid, broken } = build()

    const rejected = await submit(broken)
    const retried = await submit(valid)

    expect(rejected.error?.message).toBe(expectedCode)
    // Nulla è rimasto salvato: lo stesso id, ora con dati corretti, viene salvato davvero.
    expect(retried.data).toBe('saved')
  })
})

describe("salvataggio di un'uscita didattica: casi al limite che devono funzionare", () => {
  it("accetta un'uscita che parte oggi", async () => {
    const today = dayFromToday(0)
    const valid = validOutingPayload(refs)
    const payload = {
      ...valid,
      start_date: today,
      end_date: today,
      transports: [{ ...transportsOf(valid)[0], departure_day: today }],
    }

    const { data } = await submit(payload)

    expect(data).toBe('saved')
  })

  it('accetta un rientro prima dell\'ora di partenza se l\'uscita dura più giorni', async () => {
    const payload = validMultiDayOutingPayload(refs, { departure_time: '14:00', return_time: '08:00' })

    const { data } = await submit(payload)

    expect(data).toBe('saved')
  })

  it('accetta un trasporto senza ritorno da prenotare', async () => {
    const valid = validOutingPayload(refs)
    const payload = {
      ...valid,
      transports: [{ ...transportsOf(valid)[0], return_required: false, return_time: null }],
    }

    const { data } = await submit(payload)

    expect(data).toBe('saved')
  })

  it("accetta un trasporto di più giorni con il ritorno nell'ultimo giorno", async () => {
    const { data } = await submit(validMultiDayOutingPayload(refs))

    expect(data).toBe('saved')
  })

  it('accetta un trasporto di più giorni senza giorno di ritorno (coincide con la partenza)', async () => {
    const valid = validMultiDayOutingPayload(refs)
    const payload = {
      ...valid,
      transports: [{ ...transportsOf(valid)[0], return_day: null, return_time: '17:00' }],
    }

    const { data } = await submit(payload)

    expect(data).toBe('saved')
  })

  it('accetta una classe con tutti gli alunni con disabilità', async () => {
    const valid = validOutingPayload(refs)
    const payload = {
      ...valid,
      classes: [{ ...classesOf(valid)[0], students_count: 3, students_with_disabilities: 3 }],
    }

    const { data } = await submit(payload)

    expect(data).toBe('saved')
  })
})
