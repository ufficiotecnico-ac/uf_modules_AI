import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/auth-provider'
import type { Person } from './people-api'
import { usePeopleApi } from './people-api-provider'

/** La persona collegata all'account loggato (`undefined` finché si carica). */
export function useCurrentPerson() {
  const { session } = useAuth()
  const api = usePeopleApi()
  const [person, setPerson] = useState<Person | null | undefined>(undefined)
  const userId = session?.user.id

  useEffect(() => {
    if (!userId) return
    api.getPersonByUserId(userId).then(setPerson)
  }, [api, userId])

  return person
}
