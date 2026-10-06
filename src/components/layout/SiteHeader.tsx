import Image from 'next/image'
import Link from 'next/link'

import { ThemeControls } from '@/components/theme/ThemeControls'

const SiteHeader = () => {
  return (
    <header className="flex flex-col border-b border-border sm:flex-row">
      <Link
        aria-label="campestre.tv"
        className="flex items-center border-b border-border px-8 py-7 sm:w-[22rem] sm:border-r sm:border-b-0"
        href="/"
      >
        <Image
          alt="campestre.tv"
          className="h-7 w-auto"
          height={110}
          src="/campestretv-logo.svg"
          width={646}
          priority
        />
      </Link>
      <nav className="flex items-center gap-8 px-8 py-5 sm:flex-1 sm:justify-center sm:py-0">
        <a className="border-b border-foreground pb-2 label-caps" href="#ao-vivo">
          Ao vivo
        </a>
        <a
          className="pb-2 label-caps text-muted-foreground transition-colors hover:text-foreground"
          href="#sobre"
        >
          Sobre
        </a>
        <a
          className="pb-2 label-caps text-muted-foreground transition-colors hover:text-foreground"
          href="#contato"
        >
          Contato
        </a>
      </nav>
      <div className="flex items-center justify-end px-8 py-4 sm:w-[22rem] sm:shrink-0 sm:border-l sm:border-border sm:py-0">
        <ThemeControls />
      </div>
    </header>
  )
}

export { SiteHeader }
