import { useEffect, useState } from 'react'
import { Logo } from '../brand/Logo'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSiteData } from '../../hooks/useSiteData'
import { Icon } from '../ui/Icon'
import { startQuote } from '../../lib/quote'
import { Button } from '../ui/Primitives'

const NAV = [
  { href: '#espacios', label: 'La casa' },
  { href: '#precio', label: 'Precio' },
  { href: '#agendar', label: 'Agenda' },
  { href: '#preguntas', label: 'Preguntas' },
]

export function Header() {
  const { settings } = useSiteData()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const home = pathname === '/'
  const href = (h: string) => (home ? h : `${import.meta.env.BASE_URL}${h}`)
  const cta = () => {
    setOpen(false)
    startQuote({}, 'header', navigate)
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-bark-900/8 bg-cream-50/90 shadow-soft backdrop-blur-md' : 'border-b border-transparent bg-cream-50'
      }`}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4 md:h-18">
        <Link to="/" aria-label={settings?.business_name ?? 'La Casa del Árbol 309'}>
          <Logo compact />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((n) => (
            <a key={n.href} href={href(n.href)} className="text-sm font-medium text-bark-700 transition hover:text-leaf-700">
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* El envoltorio controla la visibilidad: aplicar `hidden` sobre el
              botón chocaría con su propia utilidad de display. */}
          <span className="hidden sm:contents">
            <Button size="sm" onClick={cta}>
              Agendar fecha
            </Button>
          </span>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Abrir menú"
            aria-expanded={open}
            className="rounded-lg p-2 text-bark-900 transition hover:bg-bark-900/5 lg:hidden"
          >
            <Icon name={open ? 'x' : 'menu'} />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-bark-900/8 bg-cream-50 lg:hidden">
          <nav className="container-x flex flex-col py-2">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={href(n.href)}
                onClick={() => setOpen(false)}
                className="border-b border-bark-900/5 py-3.5 text-[0.95rem] font-medium last:border-0"
              >
                {n.label}
              </a>
            ))}
            <Button full className="my-3" onClick={cta}>
              Agendar mi fecha
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
