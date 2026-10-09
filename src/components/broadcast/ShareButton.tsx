'use client'

import type { ComponentProps } from 'react'
import { useEffect, useState } from 'react'

import { LinkIcon, Share2Icon, TelegramIcon, WhatsappIcon } from '@/components/shared/Icons'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const COPIED_MS = 2_000

interface ShareButtonProps {
  title?: string
  url?: string
}

type OpenChangeHandler = NonNullable<ComponentProps<typeof Popover>['onOpenChange']>

export const ShareButton = ({ title, url }: ShareButtonProps) => {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) {
      return
    }

    const timer = setTimeout(() => setCopied(false), COPIED_MS)

    return () => {
      clearTimeout(timer)
    }
  }, [copied])

  useEffect(() => {
    if (!open) {
      return
    }

    // Clicks inside the YouTube iframe never reach the popover's document listeners.
    const closeOnIframeFocus = () => {
      if (document.activeElement instanceof HTMLIFrameElement) {
        setOpen(false)
        setCopied(false)
      }
    }

    window.addEventListener('blur', closeOnIframeFocus)

    return () => {
      window.removeEventListener('blur', closeOnIframeFocus)
    }
  }, [open])

  const shareUrl = () => url ?? window.location.href
  const shareTitle = () => title ?? document.title

  const handleOpenChange: OpenChangeHandler = (next, eventDetails) => {
    if (next && typeof navigator.share === 'function') {
      eventDetails.cancel()
      void navigator.share({ title: shareTitle(), url: shareUrl() }).catch(() => {})

      return
    }

    setOpen(next)

    if (!next) {
      setCopied(false)
    }
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
    setOpen(false)
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
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        aria-label="Compartilhar"
        className="flex size-10 items-center justify-center rounded-lg bg-canvas text-ink transition-colors hover:bg-brand hover:text-brand-ink"
      >
        <Share2Icon className="size-4" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-auto min-w-48 gap-1 bg-surface p-2 text-ink shadow-lg ring-0 shadow-black/50"
        side="bottom"
        sideOffset={8}
      >
        <button
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-ink transition-colors hover:bg-canvas hover:text-brand"
          type="button"
          onClick={() => void copyLink()}
        >
          <LinkIcon className="size-4" />
          <span aria-live="polite">{copied ? 'Copiado!' : 'Copiar link'}</span>
        </button>
        <button
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-ink transition-colors hover:bg-canvas hover:text-brand"
          type="button"
          onClick={shareWhatsApp}
        >
          <WhatsappIcon className="size-4" />
          WhatsApp
        </button>
        <button
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-ink transition-colors hover:bg-canvas hover:text-brand"
          type="button"
          onClick={shareTelegram}
        >
          <TelegramIcon className="size-4" />
          Telegram
        </button>
      </PopoverContent>
    </Popover>
  )
}
