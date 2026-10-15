import Link from 'next/link'

import { LogoIcon } from '@/components/logo/LogoIcon'
import { ExternalLink } from '@/components/shared/ExternalLink'
import { ClubeCampestreIcon, YoutubeIcon } from '@/components/shared/Icons'
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
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between px-4 sm:flex-row md:px-[1.4rem]">
        <Copyright />
        <div className="flex flex-row items-center gap-2">
          <ExternalLink
            aria-label="Se inscreva no canal do YouTube"
            className="pb-4 transition-colors hover:text-white/70 sm:py-4"
            href={`${siteConfig.links.youtube}?sub_confirmation=1`}
          >
            <YoutubeIcon className="size-6" />
          </ExternalLink>
          <ExternalLink
            aria-label="Clube Campestre"
            className="pb-4 transition-colors hover:text-white/70 sm:py-4"
            href={siteConfig.links.clubecampestre}
          >
            <ClubeCampestreIcon className="size-6" />
          </ExternalLink>
        </div>
      </div>
    </footer>
  )
}
