import Link from 'next/link'
import { Suspense } from 'react'

import { Logo } from '@/components/logo/Logo'
import { LogoIcon } from '@/components/logo/LogoIcon'
import { paths } from '@/config/paths'
import { siteConfig } from '@/config/site'

import { HeaderWeather } from './HeaderWeather'

export const Header = () => {
  return (
    <header className="bg-surface text-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-[1.4rem]">
        <div className="flex items-center gap-4">
          <Link aria-label={siteConfig.name} href={paths.home}>
            <LogoIcon className="sm:hidden" size="md" />
            <Logo className="hidden sm:inline" size="sm" />
          </Link>
          <Link className="text-sm font-medium text-white/80 hover:text-white" href={paths.ranking}>
            Ranking
          </Link>
        </div>
        <Suspense fallback={null}>
          <HeaderWeather />
        </Suspense>
      </div>
    </header>
  )
}
