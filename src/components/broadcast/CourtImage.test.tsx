/** @vitest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CourtImage } from './CourtImage'

vi.mock('next/image', () => ({
  default: ({ alt, onError, src }: { alt: string; onError?: () => void; src: string }) => (
    <button aria-label={alt} data-src={src} type="button" onClick={() => onError?.()} />
  ),
}))

describe('CourtImage', () => {
  it('shows the placeholder when the thumbnail fails to load', () => {
    render(
      <CourtImage
        alt="Transmissão da Quadra 5"
        height={720}
        src="https://i.ytimg.com/vi/abc/hqdefault.jpg"
        width={1280}
      />,
    )

    const image = screen.getByRole('button', { name: 'Transmissão da Quadra 5' })

    fireEvent.click(image)

    expect(image.getAttribute('data-src')).toBe('/no-thumb.png')
  })
})
