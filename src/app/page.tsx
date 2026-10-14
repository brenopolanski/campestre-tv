import { Suspense } from 'react'

import { LiveBroadcast, LiveBroadcastFallback } from '@/components/broadcast/LiveBroadcast'
import { Footer } from '@/components/navigation/footer/Footer'
import { Header } from '@/components/navigation/header/Header'

const Home = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <Suspense fallback={<LiveBroadcastFallback />}>
          <LiveBroadcast />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

export default Home
