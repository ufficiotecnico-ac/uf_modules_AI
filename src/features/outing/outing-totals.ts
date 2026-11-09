import { parseCount } from './counts'
import type { OutingFormValues } from './outing-form'

export type OutingTotals = {
  students: number
  /** Solo per le uscite di più giorni; `null` altrimenti. */
  males: number | null
  females: number | null
  /** Alunni con disabilità, già compresi in `students`. */
  disabled: number
}

const sum = (numbers: (number | null)[]) => numbers.reduce<number>((total, n) => total + (n ?? 0), 0)

/** I totali mostrati nel modulo e nel riepilogo. I campi non ancora validi contano zero. */
export function computeTotals(values: Pick<OutingFormValues, 'multi_day' | 'classes'>): OutingTotals {
  const { multi_day, classes } = values
  const males = sum(classes.map((row) => parseCount(row.males_count)))
  const females = sum(classes.map((row) => parseCount(row.females_count)))

  return {
    students: multi_day ? males + females : sum(classes.map((row) => parseCount(row.students_count))),
    males: multi_day ? males : null,
    females: multi_day ? females : null,
    disabled: sum(classes.map((row) => parseCount(row.students_with_disabilities))),
  }
}
