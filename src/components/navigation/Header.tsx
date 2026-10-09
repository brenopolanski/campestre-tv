import Link from 'next/link'

import { Logo } from '@/components/logo/Logo'
import { paths } from '@/config/paths'
import { siteConfig } from '@/config/site'

export const Header = () => {
  return (
    <header className="bg-surface text-white">
      <div className="mx-auto flex w-full max-w-7xl justify-center px-4 py-4 md:px-[1.4rem]">
        <Link aria-label={siteConfig.name} href={paths.home}>
          <Logo size="sm" />
        </Link>
      </div>
    </header>
  )
}
