/** Legge un numero intero non negativo scritto in un campo; `null` se non lo è. */
export function parseCount(text: string): number | null {
  const trimmed = text.trim()
  return /^\d+$/.test(trimmed) ? Number(trimmed) : null
}
