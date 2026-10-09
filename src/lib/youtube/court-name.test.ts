import { describe, expect, it } from 'vitest'

import { readCourtName } from './court-name'

describe('readCourtName', () => {
  it('reads the court from a stream title', () => {
    expect(readCourtName('Campestre TV - Quadra 1')).toBe('Quadra 1')
    expect(readCourtName('Campestre TV - Quadra 2')).toBe('Quadra 2')
    expect(readCourtName('Campestre TV - Quadra 3')).toBe('Quadra 3')
  })

  it('returns null when the title does not name exactly one court', () => {
    expect(readCourtName('Campestre TV')).toBeNull()
    expect(readCourtName('Quadra')).toBeNull()
    expect(readCourtName('Campestre TV - Quadra 1 e Quadra 2')).toBeNull()
  })
})
