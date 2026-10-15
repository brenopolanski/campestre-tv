'use client'

import { useEffect, useState } from 'react'

import { LinkIcon, Share2Icon, TelegramIcon, WhatsappIcon } from '@/components/shared/Icons'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ANALYTICS_EVENTS, trackEvent } from '@/lib/analytics'
import { cn } from '@/lib/utils'

const COPIED_MS = 2_000

interface ShareButtonProps {
  'aria-label'?: string
  live?: number
  size?: 'md' | 'sm'
  title?: string
  url?: string
}

type OpenChangeHandler = NonNullable<React.ComponentProps<typeof Popover>['onOpenChange']>

export const ShareButton = ({
  'aria-label': ariaLabel = 'Compartilhar',
  live,
  size = 'md',
  title,
  url,
}: ShareButtonProps) => {
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

  const shareData = () => (title ? { court: title } : undefined)

  const shareUrl = () => {
    if (url) {
      return url
    }

    if (typeof live === 'number') {
      const next = new URL(window.location.href)
      next.searchParams.set('live', String(live))

      return next.toString()
    }

    return window.location.href
  }
  const shareTitle = () => title ?? document.title

  const handleOpenChange: OpenChangeHandler = (next, eventDetails) => {
    if (next && typeof navigator.share === 'function') {
      eventDetails.cancel()
      trackEvent(ANALYTICS_EVENTS.shareNative, shareData())
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
      trackEvent(ANALYTICS_EVENTS.shareCopy, shareData())
    } catch {
      setCopied(false)
    }
  }

  const openShareWindow = (href: string) => {
    window.open(href, '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  const shareWhatsApp = () => {
    trackEvent(ANALYTICS_EVENTS.shareWhatsapp, shareData())
    openShareWindow(`https://wa.me/?text=${encodeURIComponent(`${shareTitle()} - ${shareUrl()}`)}`)
  }

  const shareTelegram = () => {
    trackEvent(ANALYTICS_EVENTS.shareTelegram, shareData())
    openShareWindow(
      `https://t.me/share/url?url=${encodeURIComponent(shareUrl())}&text=${encodeURIComponent(shareTitle())}`,
    )
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        aria-label={ariaLabel}
        className={cn(
          'flex items-center justify-center rounded-lg bg-canvas text-ink transition-colors hover:bg-brand hover:text-brand-ink',
          size === 'sm' ? 'size-8' : 'size-10',
        )}
      >
        <Share2Icon className={size === 'sm' ? 'size-3.5' : 'size-4'} />
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
