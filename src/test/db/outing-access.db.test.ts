import { anonymousClient, signedInClient } from './clients'
import { loadReferenceIds, validOutingPayload } from './outing-payload'

const MODULE_TABLES = [
  'outing_requests',
  'outing_classes',
  'outing_companions',
  'outing_transports',
  'outing_bookings',
] as const

describe("salvataggio di un'uscita didattica: accesso", () => {
  it('chi non è loggato non può salvare', async () => {
    const { client } = await signedInClient()
    const refs = await loadReferenceIds(client)

    const { data, error } = await anonymousClient().rpc('submit_outing_request', {
      payload: validOutingPayload(refs),
    })

    expect(data).toBeNull()
    expect(error).not.toBeNull()
  })
})

describe('tabelle del modulo: nessun accesso diretto per i colleghi', () => {
  it.each(MODULE_TABLES)('un collega non legge %s', async (table) => {
    const { client } = await signedInClient()

    const { data } = await client.from(table).select()

    expect(data ?? []).toEqual([])
  })

  it.each(MODULE_TABLES)('un collega non scrive direttamente in %s', async (table) => {
    const { client } = await signedInClient()

    const { error } = await client.from(table).insert({} as never)

    expect(error).not.toBeNull()
  })

  it.each(MODULE_TABLES)('chi non è loggato non legge %s', async (table) => {
    const { data } = await anonymousClient().from(table).select()

    expect(data ?? []).toEqual([])
  })
})
