const pointsFormat = new Intl.NumberFormat('pt-BR')

export const formatPoints = (points: number) => pointsFormat.format(points)

export const athleteInitials = (name: string) => {
  const parts = name.split(/\s+/).filter((part) => /^\p{L}/u.test(part))
  const letters = parts.slice(0, 2).map((part) => part[0] ?? '')
  if (letters.length === 0) {
    return '?'
  }
  return letters.join('').toLocaleUpperCase('pt-BR')
}
