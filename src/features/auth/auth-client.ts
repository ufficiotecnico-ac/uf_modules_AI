/** La parte dell'autenticazione Supabase che l'app usa (`supabase.auth` la soddisfa). */
export type AuthSession = { user: { id: string; email?: string } }

export type AuthClient = {
  getSession(): Promise<{ data: { session: AuthSession | null } }>
  onAuthStateChange(listener: (event: string, session: AuthSession | null) => void): {
    data: { subscription: { unsubscribe(): void } }
  }
  signInWithPassword(credentials: {
    email: string
    password: string
  }): Promise<{ error: { message: string; code?: string } | null }>
  signOut(): Promise<{ error: { message: string } | null }>
}
