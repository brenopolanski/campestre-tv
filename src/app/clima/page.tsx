import type { Metadata, Viewport } from 'next'

import { ClimaRoot } from '@/components/clima/ClimaRoot'
import { Header } from '@/components/navigation/Header'

const description =
  'Previsão do tempo em que o céu é o ambiente e uma pequena nuvem, o Climinha, sente o clima com você.'

export const metadata: Metadata = {
  title: 'Clima',
  description,
  other: { 'darkreader-lock': '' },
}

export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: '#2a6fc2',
  colorScheme: 'dark light',
}

const ClimaPage = () => <ClimaRoot header={<Header />} />

export default ClimaPage
