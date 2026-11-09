import { useCurrentPerson } from '@/features/people/use-current-person'
import { ModuleCard } from './module-card'
import { MODULES } from './modules'

export function HomePage() {
  const person = useCurrentPerson()

  return (
    <main className="mx-auto max-w-5xl p-4">
      {person && <h1>Ciao, {person.first_name}, che modulo vuoi compilare oggi?</h1>}
      {person === null && (
        <p role="alert">Il tuo account non è collegato a nessuna persona. Rivolgiti al gestore.</p>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((module) => (
          <ModuleCard key={module.slug} module={module} />
        ))}
      </div>
    </main>
  )
}
