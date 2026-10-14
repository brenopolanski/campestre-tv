import type { Metadata, Viewport } from 'next'

import { Header } from '@/components/navigation/header/Header'
import { paths } from '@/config/paths'
import { siteConfig } from '@/config/site'

import ranking from '../../../tools/tweener-ranking/ranking.json'
import { columns } from './columns'
import { DataTable } from './data-table'
import { Podium } from './podium'

const title = 'Ranking'
const description =
  'Classificação dos atletas do Clube Campestre. Veja a posição, o nome e os pontos do ranking.'
const socialTitle = `${title} · ${siteConfig.name}`

const ogImage = {
  url: '/og.jpg',
  width: 1200,
  height: 630,
  alt: socialTitle,
  type: 'image/jpeg',
} as const

const updatedAtFormat = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
})

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: paths.ranking,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: siteConfig.name,
    url: paths.ranking,
    title: socialTitle,
    description,
    images: [ogImage],
  },
  twitter: {
    card: 'summary_large_image',
    site: siteConfig.author.x,
    title: socialTitle,
    description,
    images: [ogImage.url],
  },
  other: { 'darkreader-lock': '' },
}

export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: '#2a6fc2',
  colorScheme: 'dark light',
}

const RankingPage = () => {
  const updatedAt = updatedAtFormat.format(new Date(ranking.updatedAt))

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 md:px-[1.4rem]">
        <h1 className="text-2xl font-semibold tracking-tight">Ranking</h1>
        <p className="mt-1 text-sm text-muted-foreground">Atualizado em {updatedAt}</p>
        <div className="mt-6 overflow-hidden rounded-xl bg-zinc-950 px-4 py-6 text-zinc-50 sm:px-6">
          <Podium athletes={ranking.athletes} />
          <DataTable columns={columns} data={ranking.athletes} />
        </div>
      </main>
    </div>
  )
}

export default RankingPage
