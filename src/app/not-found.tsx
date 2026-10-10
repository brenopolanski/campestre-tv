import type { Metadata } from 'next'
import Link from 'next/link'

import { Header } from '@/components/navigation/Header'
import { buttonVariants } from '@/components/ui/button'
import { paths } from '@/config/paths'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Página não encontrada',
}

interface ScoreboardPlayer {
  name: string
  nationality: string
  surname: string
}

const players: ScoreboardPlayer[] = [
  { name: 'Breno', nationality: 'BRA', surname: 'Polanski' },
  { name: 'Heberth', nationality: 'BRA', surname: 'Domingos' },
  { name: 'Flavio', nationality: 'BRA', surname: 'Ribeiro' },
  { name: 'Felipe', nationality: 'BRA', surname: 'Ribeiro' },
]

const pickPair = (): [ScoreboardPlayer, ScoreboardPlayer] => {
  const pool = [...players]
  const first = pool.splice(Math.floor(Math.random() * pool.length), 1)[0] ?? players[0]
  const second = pool.splice(Math.floor(Math.random() * pool.length), 1)[0] ?? players[1]

  return [first, second]
}

interface PlayerRowProps {
  game: number
  player: ScoreboardPlayer
  rank: number
  scores: readonly number[]
  serve?: boolean
}

const PlayerRow = ({ game, player, rank, scores, serve = false }: PlayerRowProps) => {
  return (
    <div className="mb-[-0.1rem] flex w-max">
      <div
        className={cn(
          'relative z-0 mr-[-0.1rem] flex w-[12em] items-center border-[0.1rem] border-[#060000] bg-linear-to-b from-[rgb(65_92_100/50%)] to-[rgb(8_39_47/50%)] py-1 text-white',
          '[text-shadow:-0.05rem_-0.05rem_rgb(6_0_0/75%)]',
          "after:absolute after:inset-0 after:-z-10 after:bg-linear-to-r after:from-[rgb(65_92_100/75%)] after:to-[#060000] after:to-75% after:content-['']",
          serve &&
            "before:absolute before:right-4 before:size-0 before:border-y-[0.375rem] before:border-r-[0.375rem] before:border-y-transparent before:border-r-[#f4b400] before:content-['']",
        )}
      >
        <span className="px-2 text-[0.6em]">{rank}</span>
        <span className="flex min-w-0 flex-1">
          <span className="mr-1 shrink-0">{player.name}</span>
          <span className="min-w-0 truncate">{player.surname}</span>
        </span>
        <span className="mr-8 ml-auto px-2 text-[0.6em]">{player.nationality}</span>
      </div>
      <div className="order-2 flex w-max shrink-0">
        {scores.map((score, index) => (
          <span
            key={`${rank}-${index}`}
            className={cn(
              'mr-[0.1rem] flex aspect-square w-13 shrink-0 items-center justify-center border-[0.1rem] border-[#060000] bg-linear-to-b from-canvas to-[#060000] text-center text-white',
              '[text-shadow:-0.05rem_-0.05rem_rgb(6_0_0/75%)]',
            )}
          >
            {score}
          </span>
        ))}
      </div>
      <div className="flex shrink-0">
        <span className="mr-[-0.1rem] flex aspect-square w-13 shrink-0 items-center justify-center border-[0.1rem] border-[#060000] bg-linear-to-b from-[#f4b400] to-[#f0ff32] text-center text-[#060000]">
          {game}
        </span>
      </div>
    </div>
  )
}

const NotFound = () => {
  const [leader, server] = pickPair()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <section className="relative flex-1 overflow-x-hidden bg-canvas bg-[url('/court.avif')] bg-cover bg-left-bottom bg-no-repeat text-[clamp(20px,3vw,32px)]">
        <div className="pointer-events-none absolute -top-40 right-0 bottom-0 left-0 z-10 flex items-center justify-center px-4">
          <div className="pointer-events-auto flex flex-col items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-8 py-8 text-center text-white shadow-[0_8px_32px_rgb(6_0_0/30%)] backdrop-blur-md [text-shadow:0_0.15rem_0.6rem_rgb(6_0_0/65%)] sm:px-12 sm:py-10">
            <p className="text-6xl font-semibold tracking-tight sm:text-8xl">404</p>
            <h1 className="text-xl font-medium sm:text-3xl">Página não encontrada</h1>
            <Link
              className={cn(buttonVariants({ size: 'lg' }), 'mt-2 px-4 [text-shadow:none]')}
              href={paths.home}
            >
              Voltar para o início
            </Link>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-8 no-scrollbar scroll-fade-x overflow-x-auto">
          <div className="w-max px-4 sm:px-8">
            <PlayerRow game={0} player={leader} rank={1} scores={[6, 4, 7, 4]} />
            <PlayerRow game={0} player={server} rank={2} scores={[4, 6, 5, 3]} serve />
          </div>
        </div>
      </section>
    </div>
  )
}

export default NotFound
