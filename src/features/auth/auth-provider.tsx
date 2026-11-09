/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AuthClient, AuthSession } from './auth-client'

type AuthState = {
  session: AuthSession | null
  loading: boolean
  /** Restituisce un messaggio in italiano se l'accesso fallisce, altrimenti `null`. */
  signIn(email: string, password: string): Promise<string | null>
  signOut(): Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ client, children }: { client: AuthClient; children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = client.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [client])

  const signIn = async (email: string, password: string) => {
    const { error } = await client.signInWithPassword({ email, password })
    if (!error) return null
    return error.code === 'invalid_credentials'
      ? 'Email o password non corretti'
      : 'Accesso non riuscito. Riprova tra poco.'
  }

  const signOut = async () => {
    await client.signOut()
  }

  return <AuthContext value={{ session, loading, signIn, signOut }}>{children}</AuthContext>
}

export function useAuth() {
  const state = useContext(AuthContext)
  if (!state) throw new Error('useAuth va usato dentro AuthProvider')
  return state
}
