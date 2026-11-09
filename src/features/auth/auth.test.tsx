import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AuthClient } from '@/features/auth/auth-client'
import { createFakeAuthClient } from '@/test/fake-auth-client'
import { renderApp as renderWholeApp } from '@/test/render-app'

function renderApp(path: string, authClient: AuthClient = createFakeAuthClient()) {
  renderWholeApp(path, { authClient })
}

const GREETING = 'Ciao, Giulia, che modulo vuoi compilare oggi?'

describe('rotte protette', () => {
  it('porta al login chi non ha una sessione', async () => {
    renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Accedi' })).toBeInTheDocument()
  })

  it('mostra la pagina richiesta a chi ha già una sessione', async () => {
    renderApp('/', createFakeAuthClient({ session: { user: { id: 'user-1' } } }))

    expect(await screen.findByRole('heading', { name: GREETING })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Accedi' })).not.toBeInTheDocument()
  })

  it("dopo l'accesso riporta alla pagina richiesta", async () => {
    const user = userEvent.setup()
    renderApp('/modulo/uscita-didattica')

    await user.type(await screen.findByLabelText('Email'), 'test.utente@example.com')
    await user.type(screen.getByLabelText('Password'), 'password-di-prova')
    await user.click(screen.getByRole('button', { name: 'Accedi' }))

    expect(await screen.findByText('Modulo: uscita-didattica')).toBeInTheDocument()
  })
})

describe('login', () => {
  it('ricorda a chi ha dimenticato la password di rivolgersi al gestore', async () => {
    renderApp('/')

    expect(
      await screen.findByText('Hai dimenticato la password? Rivolgiti al gestore'),
    ).toBeInTheDocument()
  })

  it('con credenziali errate mostra un errore in italiano e resta sul login', async () => {
    const user = userEvent.setup()
    renderApp('/', createFakeAuthClient({
        signInError: { message: 'Invalid login credentials', code: 'invalid_credentials' },
      }),)

    await user.type(await screen.findByLabelText('Email'), 'test.utente@example.com')
    await user.type(screen.getByLabelText('Password'), 'sbagliata')
    await user.click(screen.getByRole('button', { name: 'Accedi' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email o password non corretti')
    expect(screen.getByRole('heading', { name: 'Accedi' })).toBeInTheDocument()
  })

  it('con un errore imprevisto non accusa le credenziali', async () => {
    const user = userEvent.setup()
    renderApp(
      '/',
      createFakeAuthClient({ signInError: { message: 'Failed to fetch', code: 'unexpected_failure' } }),
    )

    await user.type(await screen.findByLabelText('Email'), 'test.utente@example.com')
    await user.type(screen.getByLabelText('Password'), 'password-di-prova')
    await user.click(screen.getByRole('button', { name: 'Accedi' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Accesso non riuscito. Riprova tra poco.')
  })

  it("durante l'accesso disattiva il pulsante per evitare doppi invii", async () => {
    const user = userEvent.setup()
    let completeSignIn!: () => void
    const signInGate = new Promise<void>((resolve) => (completeSignIn = resolve))
    renderApp('/', createFakeAuthClient({ signInGate }))

    await user.type(await screen.findByLabelText('Email'), 'test.utente@example.com')
    await user.type(screen.getByLabelText('Password'), 'password-di-prova')
    await user.click(screen.getByRole('button', { name: 'Accedi' }))

    expect(screen.getByRole('button', { name: 'Accesso in corso…' })).toBeDisabled()

    completeSignIn()
    expect(await screen.findByRole('heading', { name: GREETING })).toBeInTheDocument()
  })
})

describe('uscita', () => {
  it('il pulsante Esci chiude la sessione e riporta al login', async () => {
    const user = userEvent.setup()
    renderApp('/', createFakeAuthClient({ session: { user: { id: 'user-1' } } }))

    await user.click(await screen.findByRole('button', { name: 'Esci' }))

    expect(await screen.findByRole('heading', { name: 'Accedi' })).toBeInTheDocument()
  })
})
