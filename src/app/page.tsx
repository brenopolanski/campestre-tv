import { LiveBroadcast } from '@/components/broadcast/LiveBroadcast'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { Header } from '@/components/navigation/header/Header'

const Home = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main id="ao-vivo">
        <LiveBroadcast />
        <section className="sr-only" id="sobre">
          <h2>Sobre</h2>
          <p>Transmissão ao vivo das quadras de tênis do Campestre.</p>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

export default Home
