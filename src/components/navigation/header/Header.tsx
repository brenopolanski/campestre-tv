import Link from 'next/link'

import { Logo } from '@/components/logo/Logo'
import { paths } from '@/config/paths'

export const Header = () => {
  return (
    <header className="bg-surface text-white">
      <div className="mx-auto flex w-full max-w-[1280px] justify-center px-4 py-4 md:px-[1.4rem]">
        <Link aria-label="campestre.tv" href={paths.home}>
          <Logo size="sm" />
        </Link>
      </div>
    </header>
  )
}
