import { LiveBroadcast } from '@/components/broadcast/LiveBroadcast'
import { Header } from '@/components/navigation/header/Header'

const Home = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col">
        <LiveBroadcast />
      </main>
    </div>
  )
}

export default Home
