// PROTOTYPE (throwaway): dati finti e tipi condivisi tra le varianti.
// Domanda della mappa: com'e' la griglia dei moduli e il flusso griglia -> modulo -> invio?
import type { ComponentType } from 'react'
import { Bus, CalendarClock, ClipboardList, Wallet, FileSignature } from 'lucide-react'

export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

export type ModuleDef = {
  id: string
  title: string
  description: string
  category: string
  icon: ComponentType<{ className?: string }>
  available: boolean
}

// Solo "Uscita didattica" e' reale. Gli altri sono ESEMPI inventati per vedere
// come appaiono i moduli "in arrivo".
export const MODULES: ModuleDef[] = [
  {
    id: 'uscita-didattica',
    title: 'Uscita didattica',
    description: 'Richiesta di autorizzazione per uscite e visite guidate.',
    category: 'Uscite e viaggi',
    icon: Bus,
    available: true,
  },
  {
    id: 'viaggio-istruzione',
    title: "Viaggio d'istruzione",
    description: 'Viaggi di piu giorni con pernottamento.',
    category: 'Uscite e viaggi',
    icon: CalendarClock,
    available: false,
  },
  {
    id: 'rimborso-spese',
    title: 'Rimborso spese',
    description: 'Richiesta di rimborso per spese sostenute.',
    category: 'Amministrazione',
    icon: Wallet,
    available: false,
  },
  {
    id: 'autorizzazione',
    title: 'Autorizzazione',
    description: 'Autorizzazioni generiche da far firmare.',
    category: 'Amministrazione',
    icon: FileSignature,
    available: false,
  },
  {
    id: 'segnalazione',
    title: 'Segnalazione',
    description: 'Segnala un problema o un evento.',
    category: 'Altro',
    icon: ClipboardList,
    available: false,
  },
]

export type VariantProps = {
  user: string
  modules: ModuleDef[]
  openId: string | null
  status: SubmitStatus
  onOpen: (id: string) => void
  onClose: () => void
  onSubmit: () => void
  onResetStatus: () => void
  onLogout: () => void
}
