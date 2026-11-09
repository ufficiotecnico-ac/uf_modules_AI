import { Backpack, MapPin, type LucideIcon } from 'lucide-react'

export type ModuleDefinition = {
  /** Parte finale dell'indirizzo: /modulo/<slug>. */
  slug: string
  title: string
  description: string
  icon: LucideIcon
  available: boolean
}

/** L'unico elenco dei moduli: la griglia e le rotte nascono da qui. */
export const MODULES: ModuleDefinition[] = [
  {
    slug: 'uscita-didattica',
    title: 'Uscita didattica',
    description: 'Richiesta di autorizzazione per uscite e visite guidate.',
    icon: MapPin,
    available: true,
  },
  {
    slug: 'viaggio-istruzione',
    title: "Viaggio d'istruzione",
    description: 'Viaggi di più giorni con pernottamento.',
    icon: Backpack,
    available: false,
  },
]
