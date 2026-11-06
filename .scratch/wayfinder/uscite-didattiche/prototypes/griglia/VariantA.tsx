// PROTOTYPE (throwaway). Variante A: "Griglia di card" classica.
// Griglia responsive di card; click = pagina intera del modulo con "Indietro".
import { ArrowLeft, LogOut } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ModuleForm } from './ModuleForm'
import type { VariantProps } from './data'

export function VariantA(p: VariantProps) {
  const open = p.modules.find((m) => m.id === p.openId)
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="flex items-center justify-between border-b bg-background px-6 py-3">
        <span className="font-semibold">Moduli scuola</span>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {p.user}
          <Button variant="ghost" size="sm" onClick={p.onLogout}>
            <LogOut /> Esci
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        {!open ? (
          <>
            <h1 className="text-2xl font-semibold">Scegli un modulo</h1>
            <p className="mb-6 text-sm text-muted-foreground">Seleziona il modulo che vuoi compilare.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {p.modules.map((m) => (
                <button
                  key={m.id}
                  disabled={!m.available}
                  onClick={() => p.onOpen(m.id)}
                  className="text-left transition-transform enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Card className="h-full">
                    <CardHeader>
                      <m.icon className="mb-2 size-8 text-primary" />
                      <CardTitle className="flex items-center gap-2">
                        {m.title}
                        {!m.available && <Badge variant="secondary">In arrivo</Badge>}
                      </CardTitle>
                      <CardDescription>{m.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-2xl">
            <Button variant="ghost" size="sm" className="mb-3" onClick={p.onClose}>
              <ArrowLeft /> Tutti i moduli
            </Button>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{open.title}</CardTitle>
                <CardDescription>{open.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ModuleForm
                  status={p.status}
                  onSubmit={p.onSubmit}
                  onClose={p.onClose}
                  onResetStatus={p.onResetStatus}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
