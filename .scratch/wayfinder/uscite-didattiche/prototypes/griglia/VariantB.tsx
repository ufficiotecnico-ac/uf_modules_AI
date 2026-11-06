// PROTOTYPE (throwaway). Variante B: "Sidebar + pannello".
// Niente cambio di pagina: elenco moduli sempre visibile a sinistra, form a destra.
import { LayoutGrid, LogOut } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ModuleForm } from './ModuleForm'
import type { VariantProps } from './data'

export function VariantB(p: VariantProps) {
  const open = p.modules.find((m) => m.id === p.openId)
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r bg-sidebar p-3">
        <div className="mb-3 flex items-center gap-2 px-2 py-2 font-semibold">
          <LayoutGrid className="size-5" /> Moduli scuola
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {p.modules.map((m) => (
            <button
              key={m.id}
              disabled={!m.available}
              onClick={() => p.onOpen(m.id)}
              className={`flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors enabled:hover:bg-sidebar-accent disabled:cursor-not-allowed disabled:opacity-50 ${
                m.id === p.openId ? 'bg-sidebar-accent font-medium' : ''
              }`}
            >
              <m.icon className="size-4 shrink-0" />
              <span className="flex-1">{m.title}</span>
              {!m.available && <Badge variant="secondary">Presto</Badge>}
            </button>
          ))}
        </nav>
        <Separator className="my-3" />
        <div className="px-2 text-xs text-muted-foreground">{p.user}</div>
        <Button variant="ghost" size="sm" className="mt-1 justify-start" onClick={p.onLogout}>
          <LogOut /> Esci
        </Button>
      </aside>
      <main className="flex-1 p-8">
        {!open ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <LayoutGrid className="mb-3 size-10" />
            <p className="font-medium text-foreground">Nessun modulo aperto</p>
            <p className="text-sm">Scegli un modulo dalla barra a sinistra.</p>
          </div>
        ) : (
          <div className="max-w-xl">
            <h1 className="text-2xl font-semibold">{open.title}</h1>
            <p className="mb-6 text-sm text-muted-foreground">{open.description}</p>
            <ModuleForm
              key={open.id}
              status={p.status}
              onSubmit={p.onSubmit}
              onClose={p.onClose}
              onResetStatus={p.onResetStatus}
            />
          </div>
        )}
      </main>
    </div>
  )
}
