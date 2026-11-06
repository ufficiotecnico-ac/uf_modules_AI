// PROTOTYPE (throwaway): form di esempio. I campi sono INVENTATI, quelli veri
// dell'Uscita didattica si decidono quando si implementa la pagina.
import { useState } from 'react'
import { CheckCircle2, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import type { SubmitStatus } from './data'

type Props = {
  status: SubmitStatus
  onSubmit: () => void
  onClose: () => void
  onResetStatus: () => void
  steps?: boolean
}

const EMPTY = {
  destinazione: '',
  data: '',
  classe: '',
  alunni: '',
  accompagnatori: '',
  motivazione: '',
}

const STEP_TITLES = ['Dove e quando', 'Chi partecipa', 'Motivazione e riepilogo']

export function ModuleForm({ status, onSubmit, onClose, onResetStatus, steps = false }: Props) {
  const [v, setV] = useState(EMPTY)
  const [step, setStep] = useState(0)
  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setV((s) => ({ ...s, [k]: e.target.value }))

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <CheckCircle2 className="size-12 text-green-600" />
        <h2 className="text-xl font-semibold">Modulo inviato</h2>
        <p className="text-sm text-muted-foreground">
          Abbiamo salvato la tua richiesta per {v.destinazione || 'la destinazione indicata'}.
        </p>
        <Button onClick={onClose}>Torna ai moduli</Button>
      </div>
    )
  }

  const canSubmit = v.destinazione && v.data && v.classe
  const submitting = status === 'submitting'

  const fDestinazione = (
    <Field>
      <FieldLabel htmlFor="destinazione">Destinazione</FieldLabel>
      <Input id="destinazione" value={v.destinazione} onChange={set('destinazione')} placeholder="Es. Museo Egizio, Torino" />
    </Field>
  )
  const fData = (
    <Field>
      <FieldLabel htmlFor="data">Data uscita</FieldLabel>
      <Input id="data" type="date" value={v.data} onChange={set('data')} />
    </Field>
  )
  const fClasse = (
    <Field>
      <FieldLabel htmlFor="classe">Classe</FieldLabel>
      <Input id="classe" value={v.classe} onChange={set('classe')} placeholder="Es. 3B" />
    </Field>
  )
  const fAlunni = (
    <Field>
      <FieldLabel htmlFor="alunni">N. alunni</FieldLabel>
      <Input id="alunni" type="number" value={v.alunni} onChange={set('alunni')} />
    </Field>
  )
  const fAccomp = (
    <Field>
      <FieldLabel htmlFor="accomp">N. accompagnatori</FieldLabel>
      <Input id="accomp" type="number" value={v.accompagnatori} onChange={set('accompagnatori')} />
    </Field>
  )
  const fMotiv = (
    <Field>
      <FieldLabel htmlFor="motiv">Motivazione didattica</FieldLabel>
      <Textarea id="motiv" value={v.motivazione} onChange={set('motivazione')} rows={4} />
    </Field>
  )

  const errorBox =
    status === 'error' ? (
      <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
        <div>
          Non siamo riusciti a salvare il modulo. I dati sono ancora qui: riprova.{' '}
          <button type="button" className="underline" onClick={onResetStatus}>
            Nascondi
          </button>
        </div>
      </div>
    ) : null

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canSubmit && !submitting) onSubmit()
  }

  if (!steps) {
    return (
      <form onSubmit={submit} className="space-y-4">
        <p className="text-xs text-muted-foreground">Campi di esempio: da definire.</p>
        <FieldGroup>
          {fDestinazione}
          <div className="grid gap-4 sm:grid-cols-2">
            {fData}
            {fClasse}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {fAlunni}
            {fAccomp}
          </div>
          {fMotiv}
        </FieldGroup>
        {errorBox}
        <Button type="submit" disabled={!canSubmit || submitting}>
          {submitting ? 'Invio in corso...' : 'Invia modulo'}
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">{STEP_TITLES[step]}</span>
          <span className="text-muted-foreground">
            Passo {step + 1} di {STEP_TITLES.length}
          </span>
        </div>
        <div className="flex gap-1.5">
          {STEP_TITLES.map((t, i) => (
            <div key={t} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
      </div>
      <FieldGroup>
        {step === 0 && (
          <>
            {fDestinazione}
            {fData}
          </>
        )}
        {step === 1 && (
          <>
            {fClasse}
            {fAlunni}
            {fAccomp}
          </>
        )}
        {step === 2 && (
          <>
            {fMotiv}
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="font-medium">Riepilogo</div>
              <div className="text-muted-foreground">
                {v.destinazione || '-'} il {v.data || '-'} con la {v.classe || '-'} ({v.alunni || 0} alunni,{' '}
                {v.accompagnatori || 0} accompagnatori)
              </div>
            </div>
          </>
        )}
      </FieldGroup>
      {errorBox}
      <div className="flex justify-between">
        <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
          Indietro
        </Button>
        {step < STEP_TITLES.length - 1 ? (
          <Button type="button" onClick={() => setStep(step + 1)}>
            Avanti
          </Button>
        ) : (
          <Button type="submit" disabled={!canSubmit || submitting}>
            {submitting ? 'Invio in corso...' : 'Invia modulo'}
          </Button>
        )}
      </div>
    </form>
  )
}
