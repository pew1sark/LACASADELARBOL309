import { useLocation } from 'react-router-dom'
import { useSiteData } from '../../hooks/useSiteData'
import { genericMessage, openWhatsApp } from '../../lib/whatsapp'
import { WhatsAppIcon } from '../ui/Icon'

export function WhatsAppFab() {
  const { settings } = useSiteData()
  const { pathname } = useLocation()
  if (!settings?.whatsapp) return null
  // En el landing móvil la barra inferior ya trae el botón de WhatsApp.
  const hideOnMobile = pathname === '/'

  return (
    <button
      onClick={() => openWhatsApp(settings.whatsapp, genericMessage(settings.business_name), 'fab')}
      aria-label="Hablar por WhatsApp"
      className={`fixed bottom-5 right-5 z-[80] items-center gap-2.5 rounded-full bg-[#25D366] px-4 py-3.5 font-semibold text-white shadow-lift transition-transform hover:scale-105 active:scale-95 ${
        hideOnMobile ? 'hidden md:flex' : 'flex'
      }`}
    >
      <WhatsAppIcon className="size-6" />
      <span className="hidden text-sm sm:inline">WhatsApp</span>
    </button>
  )
}
