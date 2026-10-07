// A title names a court only when it contains exactly one "Quadra N".
export const readCourtName = (title: string): string | null => {
  const matches = title.match(/\bquadra\s+\d+\b/gi)

  if (matches?.length !== 1) {
    return null
  }

  return matches[0].replace(/\s+/g, ' ')
}
