'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'

const FALLBACK_SRC = '/no-thumb.png'

interface CourtImageProps extends Omit<ImageProps, 'onError' | 'src'> {
  src: string
}

export const CourtImage = ({ alt, src, ...props }: CourtImageProps) => {
  const [failedSrc, setFailedSrc] = useState<string>()
  const resolved = failedSrc === src ? FALLBACK_SRC : src

  return (
    <Image
      {...props}
      alt={alt}
      src={resolved}
      onError={() => {
        if (resolved !== FALLBACK_SRC) {
          setFailedSrc(src)
        }
      }}
    />
  )
}
