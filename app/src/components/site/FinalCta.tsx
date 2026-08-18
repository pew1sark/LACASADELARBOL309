import { useSiteData } from '../../hooks/useSiteData'
import { genericMessage, openWhatsApp } from '../../lib/whatsapp'
import { Icon, WhatsAppIcon } from '../ui/Icon'
import { Button, LinkButton } from '../ui/Primitives'

export function FinalCta() {
  const { settings } = useSiteData()
  return (
    <section className="bg-cream-50 py-16 md:py-24">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-3xl bg-leaf-700 px-6 py-14 text-center text-cream-50 shadow-lift md:px-12 md:py-20">
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-leaf-500/30" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 size-56 rounded-full bg-sun-400/20" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl leading-tight md:text-4xl">¿Ya tienes una fecha en mente?</h2>
            <p className="mt-4 text-cream-200">
              Consulta la disponibilidad en línea y envía tu solicitud. Te respondemos el mismo día y
              no pagas nada hasta confirmar.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <LinkButton to="/reservar" variant="secondary" size="lg">
                Consultar disponibilidad <Icon name="arrowRight" className="size-4.5" />
              </LinkButton>
              <Button
                variant="whatsapp"
                size="lg"
                onClick={() =>
                  openWhatsApp(settings?.whatsapp, genericMessage(settings?.business_name ?? ''), 'final_cta')
                }
              >
                <WhatsAppIcon /> Hablar por WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
