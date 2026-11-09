import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/lib/database.types'

export type Person = Pick<Tables<'people'>, 'id' | 'first_name' | 'last_name'>

/** L'unico punto da cui l'app legge l'elenco delle persone. */
export type PeopleApi = {
  /** La persona collegata a un account, o `null` se non esiste. */
  getPersonByUserId(userId: string): Promise<Person | null>
}

export function createPeopleApi(client: SupabaseClient<Database>): PeopleApi {
  return {
    async getPersonByUserId(userId) {
      const { data, error } = await client
        .from('people')
        .select('id, first_name, last_name')
        .eq('user_id', userId)
        .maybeSingle()
      if (error) throw error
      return data
    },
  }
}
