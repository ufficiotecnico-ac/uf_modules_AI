import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AppRoutes } from '@/app-routes'
import { AuthProvider } from '@/features/auth/auth-provider'
import type { AuthClient } from '@/features/auth/auth-client'
import { PeopleApiProvider } from '@/features/people/people-api-provider'
import type { PeopleApi } from '@/features/people/people-api'
import { createFakeAuthClient } from './fake-auth-client'
import { createFakePeopleApi } from './fake-people-api'

const DEFAULT_PERSON = { id: 'person-1', first_name: 'Giulia', last_name: 'Rossi' }

type RenderAppOptions = {
  authClient?: AuthClient
  peopleApi?: PeopleApi
}

/** Mostra l'intera app alla rotta `path`, con accesso e persone finti. */
export function renderApp(path: string, options: RenderAppOptions = {}) {
  const { authClient = createFakeAuthClient(), peopleApi = createFakePeopleApi(DEFAULT_PERSON) } = options

  render(
    <AuthProvider client={authClient}>
      <PeopleApiProvider api={peopleApi}>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      </PeopleApiProvider>
    </AuthProvider>,
  )
}

export const loggedIn = () => createFakeAuthClient({ session: { user: { id: 'user-1' } } })
