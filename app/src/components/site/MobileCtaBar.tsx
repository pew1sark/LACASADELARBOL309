import { useEffect, useState } from 'react'
import { useSiteData } from '../../hooks/useSiteData'
import { startQuote } from '../../lib/quote'
import { genericMessage, openWhatsApp } from '../../lib/whatsapp'
import { Icon, WhatsAppIcon } from '../ui/Icon'

/** Barra fija en móvil: la acción principal siempre a un toque. Se oculta
 *  mientras la agenda está en pantalla para no tapar el formulario. */
export function MobileCtaBar() {
  const { settings } = useSiteData()
  const [visible, setVisible] = useState(false)
  const [agendaInView, setAgendaInView] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    const el = document.getElementById('agendar')
    let io: IntersectionObserver | undefined
    if (el && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(([e]) => setAgendaInView(e.isIntersecting), { threshold: 0.05 })
      io.observe(el)
    }
    return () => {
      window.removeEventListener('scroll', onScroll)
      io?.disconnect()
    }
  }, [])

  const show = visible && !agendaInView

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[80] border-t border-bark-900/8 bg-cream-50/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-transform duration-300 md:hidden ${
        show ? 'translate-y-0' : 'translate-y-full'
      }`}
      aria-hidden={!show}
    >
      <div className="flex gap-2.5">
        <button
          type="button"
          tabIndex={show ? 0 : -1}
          onClick={() => startQuote({}, 'mobile_bar')}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-leaf-700 font-bold text-white shadow-soft active:scale-[0.98]"
        >
          Agendar mi fecha <Icon name="arrowRight" className="size-4" />
        </button>
        <button
          type="button"
          tabIndex={show ? 0 : -1}
          aria-label="Escribir por WhatsApp"
          onClick={() => openWhatsApp(settings?.whatsapp, genericMessage(settings?.business_name ?? 'La Casa del Árbol 309'), 'mobile_bar')}
          className="grid size-12 place-items-center rounded-full bg-[#25D366] text-white shadow-soft active:scale-95"
        >
          <WhatsAppIcon className="size-6" />
        </button>
      </div>
    </div>
  )
}
