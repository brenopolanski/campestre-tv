import { describe, expect, it } from 'vitest'

import { canEmbedLiveVideo, getYouTubeWatchUrl } from './playback'

describe('getYouTubeWatchUrl', () => {
  it('builds the public watch URL', () => {
    expect(getYouTubeWatchUrl('abcdefghijk')).toBe('https://www.youtube.com/watch?v=abcdefghijk')
  })
})

describe('canEmbedLiveVideo', () => {
  it('allows a live video only when YouTube marks it embeddable', () => {
    expect(
      canEmbedLiveVideo({
        embeddable: true,
        live: { status: 'live' },
      }),
    ).toBe(true)
    expect(
      canEmbedLiveVideo({
        embeddable: false,
        live: { status: 'live' },
      }),
    ).toBe(false)
    expect(
      canEmbedLiveVideo({
        embeddable: true,
        live: { status: 'upcoming' },
      }),
    ).toBe(false)
    expect(
      canEmbedLiveVideo({
        live: { status: 'live' },
      }),
    ).toBe(false)
  })
})
