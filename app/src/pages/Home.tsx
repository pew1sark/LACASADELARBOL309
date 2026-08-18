import { EventTypes } from '../components/site/EventTypes'
import { Faq } from '../components/site/Faq'
import { FinalCta } from '../components/site/FinalCta'
import { Gallery } from '../components/site/Gallery'
import { Hero } from '../components/site/Hero'
import { Packages } from '../components/site/Packages'
import { Process } from '../components/site/Process'

export default function Home() {
  return (
    <>
      <Hero />
      <EventTypes />
      <Packages />
      <Process />
      <Gallery />
      <Faq />
      <FinalCta />
    </>
  )
}
