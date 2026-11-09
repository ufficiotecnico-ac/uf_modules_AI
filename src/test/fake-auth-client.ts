import type { AuthClient, AuthSession } from '@/features/auth/auth-client'

type FakeOptions = {
  session?: AuthSession | null
  /** Se valorizzato, signInWithPassword fallisce con questo errore. */
  signInError?: { message: string; code?: string }
  /** Se valorizzato, signInWithPassword resta in attesa finché questa promessa non si risolve. */
  signInGate?: Promise<void>
}

export function createFakeAuthClient(options: FakeOptions = {}) {
  let session = options.session ?? null
  const listeners = new Set<(event: string, session: AuthSession | null) => void>()

  const notify = (event: string) => listeners.forEach((listener) => listener(event, session))

  const client: AuthClient = {
    getSession: async () => ({ data: { session } }),
    onAuthStateChange: (listener) => {
      listeners.add(listener)
      return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } }
    },
    signInWithPassword: async () => {
      await options.signInGate
      if (options.signInError) return { error: options.signInError }
      session = { user: { id: 'user-1', email: 'test.utente@example.com' } }
      notify('SIGNED_IN')
      return { error: null }
    },
    signOut: async () => {
      session = null
      notify('SIGNED_OUT')
      return { error: null }
    },
  }

  return client
}
