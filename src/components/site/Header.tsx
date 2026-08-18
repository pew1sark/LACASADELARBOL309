import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSiteData } from '../../hooks/useSiteData'
import { Icon } from '../ui/Icon'
import { LinkButton } from '../ui/Primitives'

const NAV = [
  { href: '/#eventos', label: 'Eventos' },
  { href: '/#paquetes', label: 'Paquetes' },
  { href: '/#galeria', label: 'El lugar' },
  { href: '/#preguntas', label: 'Preguntas' },
]

export function Header() {
  const { settings } = useSiteData()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

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
        scrolled ? 'border-b border-bark-900/8 bg-cream-50/90 backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4 md:h-18">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-leaf-700 text-white">
            <Icon name="home" className="size-4.5" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-[0.95rem] font-semibold">
              {settings?.business_name ?? 'La Casa del Árbol 309'}
            </span>
            <span className="block text-[0.68rem] font-medium uppercase tracking-[0.14em] text-bark-500">
              Casa de eventos
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="text-sm font-medium text-bark-700 transition hover:text-leaf-700">
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LinkButton to="/reservar" size="sm" className="hidden sm:inline-flex">
            Consultar disponibilidad
          </LinkButton>
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
                href={n.href}
                onClick={() => setOpen(false)}
                className="border-b border-bark-900/5 py-3.5 text-[0.95rem] font-medium last:border-0"
              >
                {n.label}
              </a>
            ))}
            <LinkButton to="/reservar" full className="my-3">
              Consultar disponibilidad
            </LinkButton>
          </nav>
        </div>
      )}
    </header>
  )
}
