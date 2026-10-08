import { LiveBroadcast } from '@/components/broadcast/LiveBroadcast'
import { Header } from '@/components/navigation/header/Header'

const Home = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <LiveBroadcast />
      </main>
    </div>
  )
}

export default Home
