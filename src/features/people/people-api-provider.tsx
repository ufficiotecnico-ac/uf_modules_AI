/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from 'react'
import type { PeopleApi } from './people-api'

const PeopleApiContext = createContext<PeopleApi | null>(null)

export function PeopleApiProvider({ api, children }: { api: PeopleApi; children: ReactNode }) {
  return <PeopleApiContext value={api}>{children}</PeopleApiContext>
}

export function usePeopleApi() {
  const api = useContext(PeopleApiContext)
  if (!api) throw new Error('usePeopleApi va usato dentro PeopleApiProvider')
  return api
}
