import { signedInClient } from '@/test/db/clients'
import { createPeopleApi } from './people-api'

describe('accesso alle persone sul database', () => {
  it("trova la persona collegata all'account loggato", async () => {
    const { client, userId } = await signedInClient()

    const person = await createPeopleApi(client).getPersonByUserId(userId)

    expect(person).toMatchObject({ first_name: 'Test', last_name: 'Utente' })
  })

  it('restituisce null per un account senza persona collegata', async () => {
    const { client } = await signedInClient()

    const person = await createPeopleApi(client).getPersonByUserId('00000000-0000-0000-0000-000000000000')

    expect(person).toBeNull()
  })
})
