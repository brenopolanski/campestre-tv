import { CourtCard } from '@/components/broadcast/CourtCard'
import { CourtPlayer } from '@/components/broadcast/CourtPlayer'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { Header } from '@/components/navigation/header/Header'
import { courts, featuredCourt } from '@/lib/courts'

const Home = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main id="ao-vivo">
        <CourtPlayer court={featuredCourt} />
        <section className="grid border-b border-border sm:grid-cols-2">
          {courts.map((court, index) => (
            <CourtCard key={court.id} court={court} divided={index === 0} />
          ))}
        </section>
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
