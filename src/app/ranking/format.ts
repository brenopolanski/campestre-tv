const pointsFormat = new Intl.NumberFormat('pt-BR')

export const formatPoints = (points: number) => pointsFormat.format(points)
