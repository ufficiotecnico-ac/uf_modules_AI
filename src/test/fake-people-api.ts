import type { PeopleApi, Person } from '@/features/people/people-api'

/** Finto accesso all'elenco delle persone: restituisce `person` per qualunque account. */
export function createFakePeopleApi(person: Person | null): PeopleApi {
  return { getPersonByUserId: async () => person }
}
