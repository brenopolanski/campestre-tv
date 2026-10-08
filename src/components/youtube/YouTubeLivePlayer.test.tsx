/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { YouTubeLivePlayer } from './YouTubeLivePlayer'

vi.mock('react-youtube', () => ({
  default: ({
    onError,
    onReady,
    title,
    videoId,
  }: {
    onError?: () => void
    onReady?: () => void
    title?: string
    videoId?: string
  }) => (
    <div data-testid="youtube-player" data-video-id={videoId} title={title}>
      <button type="button" onClick={() => onReady?.()}>
        ready
      </button>
      <button type="button" onClick={() => onError?.()}>
        error
      </button>
    </div>
  ),
}))

describe('YouTubeLivePlayer', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the player for an embeddable live video', () => {
    render(<YouTubeLivePlayer title="Quadra 8" videoId="abcdefghijk" />)

    const player = screen.getByTestId('youtube-player')
    expect(player.getAttribute('data-video-id')).toBe('abcdefghijk')
    expect(player.getAttribute('title')).toBe('Quadra 8')
    expect(screen.getByText('Carregando transmissão…')).toBeTruthy()
  })

  it('replaces a player error with a link to YouTube', () => {
    render(<YouTubeLivePlayer title="Quadra 8" videoId="abcdefghijk" />)

    fireEvent.click(screen.getByRole('button', { name: 'error' }))

    expect(screen.queryByTestId('youtube-player')).toBeNull()
    const link = screen.getByRole('link', { name: /Assista no YouTube/ })
    expect(link.getAttribute('href')).toBe('https://www.youtube.com/watch?v=abcdefghijk')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(screen.getByText(/Não foi possível reproduzir esta transmissão/)).toBeTruthy()
  })
})
