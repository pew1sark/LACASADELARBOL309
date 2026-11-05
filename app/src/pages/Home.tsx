import { useEffect } from 'react'
import { useSiteData } from '../hooks/useSiteData'
import { Agenda } from '../components/site/Agenda'
import { Faq } from '../components/site/Faq'
import { FinalCta } from '../components/site/FinalCta'
import { Catalogo } from '../components/site/Catalogo'
import { Hero } from '../components/site/Hero'
import { Ideas } from '../components/site/Ideas'
import { InstagramCta } from '../components/site/InstagramCta'
import { MobileCtaBar } from '../components/site/MobileCtaBar'
import { Process } from '../components/site/Process'
import { Rental } from '../components/site/Rental'
import { Spaces } from '../components/site/Spaces'
import { VideoTour } from '../components/site/VideoTour'

/** Landing para tráfico de Meta Ads: el espacio se arrienda completo a precio
 *  fijo. Muestra el catálogo de áreas, el precio y la agenda en la misma página. */
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
      <Spaces />
      <Catalogo />
      <VideoTour />
      <Ideas />
      <Rental />
      <Process />
      <Agenda />
      <InstagramCta />
      <Faq />
      <FinalCta />
      <MobileCtaBar />
    </>
  )
}
