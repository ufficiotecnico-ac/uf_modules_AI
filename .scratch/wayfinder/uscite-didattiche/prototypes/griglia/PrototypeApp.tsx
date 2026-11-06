// PROTOTYPE (throwaway): "Tre varianti della dashboard moduli, scelte con ?variant=A|B|C".
// Sub-shape B: nessuna pagina esistente (l'app e' lo scaffold Vite). Stato tutto in memoria,
// nessun router, nessun Supabase: l'invio e' simulato.
// Login condiviso e identico per tutte le varianti (non e' la domanda di questo prototipo).
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { MODULES, type SubmitStatus } from './data'
import { VariantA } from './VariantA'
import { VariantB } from './VariantB'
import { VariantC } from './VariantC'

const VARIANTS = [
  { key: 'A', name: 'Griglia di card', Component: VariantA },
  { key: 'B', name: 'Sidebar + pannello', Component: VariantB },
  { key: 'C', name: 'Launcher + form a passi', Component: VariantC },
] as const

const USER = 'mario.rossi@scuola.it'

function readVariant(): number {
  const k = new URLSearchParams(window.location.search).get('variant')
  const i = VARIANTS.findIndex((v) => v.key === k)
  return i >= 0 ? i : 0
}

function Login({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <form
        className="w-full max-w-sm space-y-5 rounded-xl border bg-card p-6"
        onSubmit={(e) => {
          e.preventDefault()
          onLogin()
        }}
      >
        <div>
          <h1 className="text-xl font-semibold">Moduli scuola</h1>
          <p className="text-sm text-muted-foreground">Accedi con le credenziali che ti sono state date.</p>
        </div>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" defaultValue={USER} />
          </Field>
          <Field>
            <FieldLabel htmlFor="pw">Password</FieldLabel>
            <Input id="pw" type="password" defaultValue="password" />
          </Field>
        </FieldGroup>
        <Button type="submit" className="w-full">
          Accedi
        </Button>
      </form>
    </div>
  )
}

export default function PrototypeApp() {
  const [vi, setVi] = useState(readVariant)
  const [loggedIn, setLoggedIn] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [showSoon, setShowSoon] = useState(true)
  const [simulateError, setSimulateError] = useState(false)

  const go = (i: number) => {
    const n = (i + VARIANTS.length) % VARIANTS.length
    setVi(n)
    const url = new URL(window.location.href)
    url.searchParams.set('variant', VARIANTS[n].key)
    window.history.replaceState(null, '', url)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, [contenteditable]')) return
      if (e.key === 'ArrowLeft') go(vi - 1)
      if (e.key === 'ArrowRight') go(vi + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const { Component, key, name } = { ...VARIANTS[vi], Component: VARIANTS[vi].Component }
  const modules = showSoon ? MODULES : MODULES.filter((m) => m.available)

  const submit = () => {
    setStatus('submitting')
    setTimeout(() => setStatus(simulateError ? 'error' : 'success'), 900)
  }

  return (
    <>
      {loggedIn ? (
        <Component
          user={USER}
          modules={modules}
          openId={openId}
          status={status}
          onOpen={(id) => {
            setStatus('idle')
            setOpenId(id)
          }}
          onClose={() => {
            setStatus('idle')
            setOpenId(null)
          }}
          onSubmit={submit}
          onResetStatus={() => setStatus('idle')}
          onLogout={() => {
            setOpenId(null)
            setStatus('idle')
            setLoggedIn(false)
          }}
        />
      ) : (
        <Login onLogin={() => setLoggedIn(true)} />
      )}
      {!import.meta.env.PROD && (
        <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-neutral-900 px-3 py-2 text-xs text-white shadow-xl">
          <button onClick={() => go(vi - 1)} aria-label="Variante precedente" className="rounded-full p-1 hover:bg-white/20">
            <ChevronLeft className="size-4" />
          </button>
          <span className="min-w-44 text-center font-medium">
            {key} ({name})
          </span>
          <button onClick={() => go(vi + 1)} aria-label="Variante successiva" className="rounded-full p-1 hover:bg-white/20">
            <ChevronRight className="size-4" />
          </button>
          <span className="h-4 w-px bg-white/30" />
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={showSoon} onChange={(e) => setShowSoon(e.target.checked)} />
            Moduli in arrivo
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={simulateError} onChange={(e) => setSimulateError(e.target.checked)} />
            Simula errore
          </label>
        </div>
      )}
    </>
  )
}
