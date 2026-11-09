import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey) {
  throw new Error('Mancano VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY (vedi .env.example)')
}

/** L'unico client Supabase dell'app: sessione persistente nel browser (comportamento predefinito). */
export const supabase = createClient<Database>(url, publishableKey)
