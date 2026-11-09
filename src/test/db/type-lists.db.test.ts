import { anonymousClient, signedInClient } from './clients'

const TYPE_LISTS = ['outing_types', 'transport_types', 'booking_types'] as const

describe('elenchi di tipi: lettura da utente loggato', () => {
  it('le tipologie di uscita attive sono quelle concordate', async () => {
    const { client } = await signedInClient()

    const { data, error } = await client
      .from('outing_types')
      .select('id, name, active')
      .eq('active', true)
      .order('id')

    expect(error).toBeNull()
    expect(data).toHaveLength(11)
    expect(data).toEqual(
      expect.arrayContaining([
        { id: 'local-outing', name: 'Uscita didattica sul territorio', active: true },
        { id: 'trip-abroad', name: "Viaggio culturale all'estero", active: true },
        { id: 'other', name: 'Altro', active: true },
      ]),
    )
  })

  it('i mezzi di trasporto sono treno e altro', async () => {
    const { client } = await signedInClient()

    const { data, error } = await client
      .from('transport_types')
      .select('id, name')
      .eq('active', true)
      .order('id')

    expect(error).toBeNull()
    expect(data).toEqual([
      { id: 'other', name: 'Altro' },
      { id: 'train', name: 'Treno' },
    ])
  })

  it('i tipi di prenotazione sono fiere, guide, laboratori e altro', async () => {
    const { client } = await signedInClient()

    const { data, error } = await client
      .from('booking_types')
      .select('id, name')
      .eq('active', true)
      .order('id')

    expect(error).toBeNull()
    expect(data).toEqual([
      { id: 'fairs', name: 'Fiere' },
      { id: 'guides', name: 'Guide' },
      { id: 'other', name: 'Altro' },
      { id: 'workshops', name: 'Laboratori' },
    ])
  })
})

describe('elenchi di tipi: chi non è loggato', () => {
  it.each(TYPE_LISTS)('non legge nessuna riga di %s', async (table) => {
    const { data } = await anonymousClient().from(table).select()

    expect(data ?? []).toEqual([])
  })
})

describe("elenchi di tipi: scrittura dall'app", () => {
  it.each(TYPE_LISTS)('non si possono aggiungere righe a %s', async (table) => {
    const { client } = await signedInClient()

    const { error } = await client.from(table).insert({ id: 'intruder', name: 'Intruso' })

    expect(error).not.toBeNull()
  })

  it.each(TYPE_LISTS)('non si possono disattivare le righe di %s', async (table) => {
    const { client } = await signedInClient()

    await client.from(table).update({ active: false }).eq('id', 'other')

    const { data } = await client.from(table).select('active').eq('id', 'other')
    expect(data).toEqual([{ active: true }])
  })

  it.each(TYPE_LISTS)('non si possono cancellare le righe di %s', async (table) => {
    const { client } = await signedInClient()

    await client.from(table).delete().eq('id', 'other')

    const { data } = await client.from(table).select('id').eq('id', 'other')
    expect(data).toHaveLength(1)
  })
})
