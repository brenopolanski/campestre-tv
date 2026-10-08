import Image from 'next/image'
import Link from 'next/link'

import { paths } from '@/config/paths'

export const Header = () => {
  return (
    <header className="bg-[#2c2c2c] text-white">
      <div className="mx-auto flex w-full max-w-[1280px] justify-center px-4 py-4 md:px-[1.4rem]">
        <Link aria-label="campestre.tv" href={paths.home}>
          <Image
            alt="campestre.tv"
            className="h-[30px] w-auto"
            height={110}
            src="/campestretv-logo.svg"
            width={646}
            priority
          />
        </Link>
      </div>
    </header>
  )
}
