'use client'

import { useEffect, useRef, useState } from 'react'

import { LinkIcon, Share2Icon, TelegramIcon, WhatsappIcon } from '@/components/shared/Icons'

const COPIED_MS = 2_000

interface ShareButtonProps {
  title?: string
  url?: string
}

export const ShareButton = ({ title, url }: ShareButtonProps) => {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const close = () => {
      setOpen(false)
      setCopied(false)
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        close()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!copied) {
      return
    }

    const timer = setTimeout(() => setCopied(false), COPIED_MS)

    return () => clearTimeout(timer)
  }, [copied])

  const shareUrl = () => url ?? window.location.href
  const shareTitle = () => title ?? document.title

  const handleShare = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: shareTitle(), url: shareUrl() })
      } catch {
        // The user closed the share sheet.
      }

      return
    }

    setOpen((current) => !current)
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl())
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const openShareWindow = (href: string) => {
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  const shareWhatsApp = () => {
    openShareWindow(`https://wa.me/?text=${encodeURIComponent(`${shareTitle()} - ${shareUrl()}`)}`)
  }

  const shareTelegram = () => {
    openShareWindow(
      `https://t.me/share/url?url=${encodeURIComponent(shareUrl())}&text=${encodeURIComponent(shareTitle())}`,
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Compartilhar"
        className="flex size-10 items-center justify-center rounded-lg bg-canvas text-ink transition-colors hover:bg-brand hover:text-brand-ink"
        type="button"
        onClick={() => void handleShare()}
      >
        <Share2Icon className="size-4" />
      </button>
      {open && (
        <div
          className="absolute top-full right-0 z-50 mt-2 grid min-w-48 gap-1 rounded-lg bg-surface p-2 shadow-lg shadow-black/50"
          role="menu"
        >
          <button
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-ink transition-colors hover:bg-canvas hover:text-brand"
            role="menuitem"
            type="button"
            onClick={() => void copyLink()}
          >
            <LinkIcon className="size-4" />
            <span aria-live="polite">{copied ? 'Copiado!' : 'Copiar link'}</span>
          </button>
          <button
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-ink transition-colors hover:bg-canvas hover:text-brand"
            role="menuitem"
            type="button"
            onClick={shareWhatsApp}
          >
            <WhatsappIcon className="size-4" />
            WhatsApp
          </button>
          <button
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-ink transition-colors hover:bg-canvas hover:text-brand"
            role="menuitem"
            type="button"
            onClick={shareTelegram}
          >
            <TelegramIcon className="size-4" />
            Telegram
          </button>
        </div>
      )}
    </div>
  )
}
