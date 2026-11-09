import type { ClassRow } from './outing-form'
import { computeTotals } from './outing-totals'

const row = (overrides: Partial<ClassRow> = {}): ClassRow => ({
  class_id: 'class-1a',
  students_count: '',
  males_count: '',
  females_count: '',
  students_with_disabilities: '0',
  ...overrides,
})

describe("totali dell'uscita", () => {
  it('per un giorno solo somma gli alunni e le disabilità delle classi', () => {
    const totals = computeTotals({
      multi_day: false,
      classes: [
        row({ students_count: '20', students_with_disabilities: '1' }),
        row({ class_id: 'class-1b', students_count: '18', students_with_disabilities: '2' }),
      ],
    })

    expect(totals).toEqual({ students: 38, males: null, females: null, disabled: 3 })
  })

  it('per più giorni somma maschi e femmine e ne ricava gli alunni', () => {
    const totals = computeTotals({
      multi_day: true,
      classes: [
        row({ males_count: '12', females_count: '10', students_with_disabilities: '1' }),
        row({ class_id: 'class-1b', males_count: '9', females_count: '9' }),
      ],
    })

    expect(totals).toEqual({ students: 40, males: 21, females: 19, disabled: 1 })
  })

  it('conta zero per i campi ancora vuoti o non validi', () => {
    const totals = computeTotals({
      multi_day: false,
      classes: [row({ students_count: '' }), row({ students_count: 'abc', students_with_disabilities: '' })],
    })

    expect(totals).toEqual({ students: 0, males: null, females: null, disabled: 0 })
  })

  it('senza classi i totali sono zero', () => {
    expect(computeTotals({ multi_day: true, classes: [] })).toEqual({
      students: 0,
      males: 0,
      females: 0,
      disabled: 0,
    })
  })
})
