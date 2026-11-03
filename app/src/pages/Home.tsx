import { useEffect } from 'react'
import { useSiteData } from '../hooks/useSiteData'
import { Agenda } from '../components/site/Agenda'
import { EventTypes } from '../components/site/EventTypes'
import { Faq } from '../components/site/Faq'
import { FinalCta } from '../components/site/FinalCta'
import { Gallery } from '../components/site/Gallery'
import { Hero } from '../components/site/Hero'
import { InstagramCta } from '../components/site/InstagramCta'
import { MobileCtaBar } from '../components/site/MobileCtaBar'
import { Packages } from '../components/site/Packages'
import { Process } from '../components/site/Process'

/** Landing pensado para tráfico de Meta Ads: hero con cotizador, prueba del
 *  lugar, paquetes con precio y la agenda completa en la misma página. */
export default function Home() {
  const { loading } = useSiteData()
  // Enlaces externos a /#agendar (bio de Instagram, anuncios): bajar a la
  // agenda una vez que el contenido ya está en pantalla.
  useEffect(() => {
    if (loading) return
    const id = window.location.hash.slice(1)
    if (!id) return
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 80)
    return () => clearTimeout(t)
  }, [loading])

  return (
    <>
      <Hero />
      <EventTypes />
      <Packages />
      <Process />
      <Agenda />
      <Gallery />
      <InstagramCta />
      <Faq />
      <FinalCta />
      <MobileCtaBar />
    </>
  )
}
