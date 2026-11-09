import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createFakePeopleApi } from '@/test/fake-people-api'
import { loggedIn, renderApp } from '@/test/render-app'

describe('griglia dei moduli', () => {
  it('saluta il collega con il nome della persona collegata al suo account', async () => {
    renderApp('/', {
      authClient: loggedIn(),
      peopleApi: createFakePeopleApi({ id: 'p1', first_name: 'Marco', last_name: 'Bianchi' }),
    })

    expect(
      await screen.findByRole('heading', { name: 'Ciao, Marco, che modulo vuoi compilare oggi?' }),
    ).toBeInTheDocument()
  })

  it('mostra il modulo disponibile con la descrizione e porta alla sua pagina', async () => {
    const user = userEvent.setup()
    renderApp('/', { authClient: loggedIn() })

    const card = await screen.findByRole('link', { name: /Uscita didattica/ })
    expect(card).toHaveTextContent('Richiesta di autorizzazione per uscite e visite guidate.')

    await user.click(card)

    expect(await screen.findByText('Modulo: uscita-didattica')).toBeInTheDocument()
  })

  it('mostra i moduli non ancora disponibili come "In arrivo", senza link', async () => {
    renderApp('/', { authClient: loggedIn() })

    expect(await screen.findByText("Viaggio d'istruzione")).toBeInTheDocument()
    expect(screen.getByText('In arrivo')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Viaggio d'istruzione/ })).not.toBeInTheDocument()
  })

  it("se l'account non ha una persona collegata avvisa di rivolgersi al gestore", async () => {
    renderApp('/', { authClient: loggedIn(), peopleApi: createFakePeopleApi(null) })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Il tuo account non è collegato a nessuna persona. Rivolgiti al gestore.',
    )
  })
})
