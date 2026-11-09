import { signedInClient } from './clients'
import {
  loadReferenceIds,
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

const NONEXISTENT_UUID = '00000000-0000-4000-8000-000000000000'

const transports = (payload: OutingPayload) => payload.transports as OutingPayload[]
const bookings = (payload: OutingPayload) => payload.bookings as OutingPayload[]

type Rejection = {
  name: string
  expectedCode: string
  /** Rende non valida una compilazione valida. */
  corrupt: (valid: OutingPayload) => OutingPayload
}

const REJECTIONS: Rejection[] = [
  {
    name: 'un referente inesistente',
    expectedCode: 'invalid_lead_person',
    corrupt: (valid) => ({ ...valid, lead_person_id: NONEXISTENT_UUID }),
  },
  {
    name: 'un referente disattivato',
    expectedCode: 'invalid_lead_person',
    corrupt: (valid) => ({ ...valid, lead_person_id: refs.person['Dismesso'] }),
  },
  {
    name: 'nessun accompagnatore',
    expectedCode: 'no_companion',
    corrupt: (valid) => ({ ...valid, companion_ids: [] }),
  },
  {
    name: 'un accompagnatore inesistente',
    expectedCode: 'invalid_companion',
    corrupt: (valid) => ({ ...valid, companion_ids: [refs.person['Verdi'], NONEXISTENT_UUID] }),
  },
  {
    name: 'un accompagnatore disattivato',
    expectedCode: 'invalid_companion',
    corrupt: (valid) => ({ ...valid, companion_ids: [refs.person['Dismesso']] }),
  },
  {
    name: 'il referente indicato anche come accompagnatore',
    expectedCode: 'duplicate_person',
    corrupt: (valid) => ({ ...valid, companion_ids: [refs.person['Utente']] }),
  },
  {
    name: 'lo stesso accompagnatore indicato due volte',
    expectedCode: 'duplicate_person',
    corrupt: (valid) => ({ ...valid, companion_ids: [refs.person['Verdi'], refs.person['Verdi']] }),
  },
  {
    name: 'nessuna classe',
    expectedCode: 'no_classes',
    corrupt: (valid) => ({ ...valid, classes: [] }),
  },
  {
    name: 'una classe inesistente',
    expectedCode: 'invalid_class',
    corrupt: (valid) => ({
      ...valid,
      classes: [{ ...(valid.classes as OutingPayload[])[0], class_id: NONEXISTENT_UUID }],
    }),
  },
  {
    name: 'una classe disattivata',
    expectedCode: 'invalid_class',
    corrupt: (valid) => ({
      ...valid,
      classes: [{ ...(valid.classes as OutingPayload[])[0], class_id: refs.klass['3D'] }],
    }),
  },
  {
    name: "una classe di un altro anno scolastico",
    expectedCode: 'invalid_class',
    corrupt: (valid) => ({
      ...valid,
      classes: [{ ...(valid.classes as OutingPayload[])[0], class_id: refs.previousYearKlass['1A'] }],
    }),
  },
  {
    name: 'la stessa classe indicata due volte',
    expectedCode: 'duplicate_class',
    corrupt: (valid) => ({
      ...valid,
      classes: [(valid.classes as OutingPayload[])[0], (valid.classes as OutingPayload[])[0]],
    }),
  },
  {
    name: 'una tipologia di uscita inesistente',
    expectedCode: 'invalid_outing_type',
    corrupt: (valid) => ({ ...valid, outing_type_id: 'does-not-exist' }),
  },
  {
    name: 'una tipologia di uscita disattivata',
    expectedCode: 'invalid_outing_type',
    corrupt: (valid) => ({ ...valid, outing_type_id: 'retired-test' }),
  },
  {
    name: 'un mezzo di trasporto inesistente',
    expectedCode: 'invalid_transport_type',
    corrupt: (valid) => ({
      ...valid,
      transports: [{ ...transports(valid)[0], transport_type_id: 'does-not-exist' }],
    }),
  },
  {
    name: 'un mezzo di trasporto disattivato',
    expectedCode: 'invalid_transport_type',
    corrupt: (valid) => ({
      ...valid,
      transports: [{ ...transports(valid)[0], transport_type_id: 'retired-test' }],
    }),
  },
  {
    name: 'un tipo di prenotazione inesistente',
    expectedCode: 'invalid_booking_type',
    corrupt: (valid) => ({
      ...valid,
      bookings: [{ ...bookings(valid)[0], booking_type_id: 'does-not-exist' }],
    }),
  },
  {
    name: 'un tipo di prenotazione disattivato',
    expectedCode: 'invalid_booking_type',
    corrupt: (valid) => ({
      ...valid,
      bookings: [{ ...bookings(valid)[0], booking_type_id: 'retired-test' }],
    }),
  },
]

describe("salvataggio di un'uscita didattica: persone, classi e tipi", () => {
  it.each(REJECTIONS)('rifiuta $name', async ({ corrupt, expectedCode }) => {
    const valid = validOutingPayload(refs)

    const rejected = await submit(corrupt(valid))
    const retried = await submit(valid)

    expect(rejected.error?.message).toBe(expectedCode)
    // Nulla è rimasto salvato: lo stesso id, ora con dati corretti, viene salvato davvero.
    expect(retried.data).toBe('saved')
  })
})
