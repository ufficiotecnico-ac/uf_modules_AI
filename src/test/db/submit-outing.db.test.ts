import { signedInClient } from './clients'
import {
  dayFromToday,
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

describe("salvataggio di un'uscita didattica: casi validi", () => {
  it('salva una compilazione completa', async () => {
    const { data, error } = await submit(validOutingPayload(refs))

    expect(error).toBeNull()
    expect(data).toBe('saved')
  })

  it("salva un'uscita senza trasporti, visite e altri accompagnatori", async () => {
    const payload = validOutingPayload(refs, { transports: [], bookings: [] })

    const { data, error } = await submit(payload)

    expect(error).toBeNull()
    expect(data).toBe('saved')
  })

  it("salva un'uscita di più giorni con maschi e femmine", async () => {
    const start = dayFromToday(1)
    const end = dayFromToday(3)
    const payload = validOutingPayload(refs, {
      end_date: end,
      classes: [
        {
          class_id: refs.klass['1A'],
          students_count: 22,
          males_count: 12,
          females_count: 10,
          students_with_disabilities: 0,
        },
        {
          class_id: refs.klass['1B'],
          students_count: 18,
          males_count: 9,
          females_count: 9,
          students_with_disabilities: 2,
        },
      ],
      companion_ids: [refs.person['Verdi'], refs.person['Neri']],
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
          notes: 'Prenotare posti vicini',
        },
      ],
    })

    const { data, error } = await submit(payload)

    expect(error).toBeNull()
    expect(data).toBe('saved')
  })

  it('salva due compilazioni diverse senza che si interferiscano', async () => {
    const first = await submit(validOutingPayload(refs))
    const second = await submit(validOutingPayload(refs))

    expect([first.data, second.data]).toEqual(['saved', 'saved'])
  })
})

describe("salvataggio di un'uscita didattica: doppio invio", () => {
  it('con lo stesso id risponde "già salvato"', async () => {
    const payload = validOutingPayload(refs)

    const first = await submit(payload)
    const second = await submit(payload)

    expect(first.data).toBe('saved')
    expect(second.error).toBeNull()
    expect(second.data).toBe('already_saved')
  })

  it('risponde "già salvato" anche se il secondo invio ha dati diversi', async () => {
    const payload = validOutingPayload(refs)
    await submit(payload)

    const { data } = await submit({ ...payload, destination: '[TEST] Un altro posto' })

    expect(data).toBe('already_saved')
  })
})

describe("salvataggio di un'uscita didattica: tutto o niente", () => {
  it('se un trasporto è incompleto non resta salvato nulla', async () => {
    const payload = validOutingPayload(refs)
    const broken = {
      ...payload,
      transports: [{ ...(payload.transports as OutingPayload[])[0], destination: null }],
    }

    const failed = await submit(broken)
    const retried = await submit(payload)

    expect(failed.error).not.toBeNull()
    expect(retried.data).toBe('saved')
  })

  it('se una visita ha un tipo inesistente non resta salvato nulla', async () => {
    const payload = validOutingPayload(refs)
    const broken = {
      ...payload,
      bookings: [{ booking_type_id: 'does-not-exist', description: 'Guida', time: '10:00' }],
    }

    const failed = await submit(broken)
    const retried = await submit(payload)

    expect(failed.error).not.toBeNull()
    expect(retried.data).toBe('saved')
  })
})
