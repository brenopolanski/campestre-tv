import { LiveBroadcast } from '@/components/broadcast/LiveBroadcast'
import { Header } from '@/components/navigation/header/Header'

const Home = () => {
  return (
    <div className="min-h-screen bg-[#242424] text-[#888888] selection:bg-[#4bd573] selection:text-[#152d1c]">
      <Header />
      <main id="ao-vivo">
        <LiveBroadcast />
        <section className="sr-only" id="sobre">
          <h2>Sobre</h2>
          <p>Transmissão ao vivo das quadras de tênis do Campestre.</p>
        </section>
      </main>
    </div>
  )
}

export default Home
