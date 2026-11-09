import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

function newClient() {
  return createClient<Database>(url, publishableKey, { auth: { persistSession: false } })
}

/** Client senza accesso, come un visitatore non loggato. */
export function anonymousClient() {
  return newClient()
}

async function signIn() {
  const client = newClient()
  const { data, error } = await client.auth.signInWithPassword({
    email: import.meta.env.TEST_USER_EMAIL,
    password: import.meta.env.TEST_USER_PASSWORD,
  })
  if (error) throw new Error(`Login dell'utente di prova non riuscito: ${error.message}`)
  return { client, userId: data.user.id }
}

let session: ReturnType<typeof signIn> | undefined

/**
 * Client con l'accesso dell'utente di prova (credenziali in .env.local).
 * Il login si fa una volta sola per file di test: Supabase limita gli accessi ravvicinati.
 */
export function signedInClient() {
  session ??= signIn()
  return session
}
