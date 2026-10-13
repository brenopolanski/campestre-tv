import Link from 'next/link'

import { LogoIcon } from '@/components/logo/LogoIcon'
import { YoutubeIcon } from '@/components/shared/Icons'
import { paths } from '@/config/paths'
import { siteConfig } from '@/config/site'

const Copyright = () => {
  return (
    <div className="flex flex-row items-center gap-2 py-4">
      <span className="whitespace-nowrap">&copy; {new Date().getFullYear()}</span>
      <span className="flex items-center gap-1 whitespace-nowrap">
        <LogoIcon size="sm" />
        <Link className="hover:underline" href={paths.home}>
          {siteConfig.name}
        </Link>
      </span>
    </div>
  )
}

export const Footer = () => {
  return (
    <footer className="bg-surface font-sans font-semibold text-ink">
      <div className="mx-auto flex w-full max-w-7xl flex-row items-center justify-between px-4 md:px-[1.4rem]">
        <Copyright />
        <a
          aria-label="YouTube"
          className="py-4 transition-colors hover:text-white/70"
          href={`${siteConfig.links.youtube}?sub_confirmation=1`}
          rel="noopener noreferrer"
          target="_blank"
        >
          <YoutubeIcon className="size-6" />
        </a>
      </div>
    </footer>
  )
}
