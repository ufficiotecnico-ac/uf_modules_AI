// PROTOTYPE (throwaway). Variante C: "Launcher a tile + form a passi".
// Tile grandi raggruppati per categoria con ricerca; il modulo si apre a tutto schermo, a passi.
import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ModuleForm } from './ModuleForm'
import type { VariantProps } from './data'

export function VariantC(p: VariantProps) {
  const [q, setQ] = useState('')
  const open = p.modules.find((m) => m.id === p.openId)

  if (open) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-background px-6 py-10">
        <div className="w-full max-w-lg">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary p-3 text-primary-foreground">
                <open.icon className="size-6" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">{open.title}</h1>
                <p className="text-sm text-muted-foreground">{open.description}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={p.onClose} aria-label="Chiudi">
              <X />
            </Button>
          </div>
          <ModuleForm
            steps
            status={p.status}
            onSubmit={p.onSubmit}
            onClose={p.onClose}
            onResetStatus={p.onResetStatus}
          />
        </div>
      </div>
    )
  }

  const filtered = p.modules.filter((m) => m.title.toLowerCase().includes(q.toLowerCase()))
  const categories = [...new Set(filtered.map((m) => m.category))]

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Ciao!</h1>
            <p className="text-muted-foreground">Che modulo devi compilare oggi?</p>
          </div>
          <button className="text-sm text-muted-foreground underline" onClick={p.onLogout}>
            Esci ({p.user})
          </button>
        </div>
        <div className="relative mb-8">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-10 pl-9" placeholder="Cerca un modulo..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {categories.length === 0 && <p className="text-sm text-muted-foreground">Nessun modulo trovato.</p>}
        {categories.map((c) => (
          <section key={c} className="mb-8">
            <h2 className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">{c}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {filtered
                .filter((m) => m.category === c)
                .map((m) => (
                  <button
                    key={m.id}
                    disabled={!m.available}
                    onClick={() => p.onOpen(m.id)}
                    className="relative flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-4 text-center transition-all enabled:hover:border-primary enabled:hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <m.icon className="size-10 text-primary" />
                    <span className="text-sm font-medium">{m.title}</span>
                    {!m.available && <Badge variant="secondary" className="absolute top-2 right-2">Presto</Badge>}
                  </button>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
