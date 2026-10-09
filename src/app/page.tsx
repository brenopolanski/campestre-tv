import { Suspense } from 'react'

import { LiveBroadcast, LiveBroadcastFallback } from '@/components/broadcast/LiveBroadcast'
import { Header } from '@/components/navigation/Header'

const Home = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <Suspense fallback={<LiveBroadcastFallback />}>
          <LiveBroadcast />
        </Suspense>
      </main>
    </div>
  )
}

export default Home
