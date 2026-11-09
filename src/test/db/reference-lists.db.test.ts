import { anonymousClient, signedInClient } from './clients'

describe('elenchi di riferimento: lettura da utente loggato', () => {
  it('trova la persona collegata al proprio account', async () => {
    const { client, userId } = await signedInClient()

    const { data, error } = await client
      .from('people')
      .select('first_name, last_name, active')
      .eq('user_id', userId)

    expect(error).toBeNull()
    expect(data).toEqual([{ first_name: 'Test', last_name: 'Utente', active: true }])
  })

  it("trova le classi dell'anno scolastico in corso", async () => {
    const { client } = await signedInClient()

    const { data, error } = await client
      .from('classes')
      .select('school_year, name, active')
      .eq('school_year', '2026/2027')

    expect(error).toBeNull()
    expect(data).toEqual(
      expect.arrayContaining([{ school_year: '2026/2027', name: '1A', active: true }]),
    )
  })
})

describe('elenchi di riferimento: chi non è loggato', () => {
  it.each(['people', 'classes'] as const)('non legge nessuna riga di %s', async (table) => {
    const { data } = await anonymousClient().from(table).select()

    expect(data ?? []).toEqual([])
  })
})

describe("elenchi di riferimento: scrittura dall'app", () => {
  it('non si possono aggiungere persone', async () => {
    const { client } = await signedInClient()

    const { error } = await client.from('people').insert({ first_name: 'Intruso', last_name: 'Prova' })

    expect(error).not.toBeNull()
  })

  it('non si possono modificare le classi', async () => {
    const { client } = await signedInClient()

    await client.from('classes').update({ active: false }).eq('name', '3C')

    const { data } = await client.from('classes').select('active').eq('name', '3C')
    expect(data).toEqual([{ active: true }])
  })

  it('non si possono cancellare le persone', async () => {
    const { client, userId } = await signedInClient()

    await client.from('people').delete().eq('user_id', userId)

    const { data } = await client.from('people').select('id').eq('user_id', userId)
    expect(data).toHaveLength(1)
  })
})
