import { useSiteData } from '../../hooks/useSiteData'
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '../../lib/fallback'
import { Icon } from '../ui/Icon'

export function InstagramCta() {
  const { settings } = useSiteData()
  const url = settings?.instagram_url || INSTAGRAM_URL
  return (
    <section className="bg-white pb-16 md:pb-24">
      <div className="container-x">
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="group flex flex-col items-center justify-between gap-5 rounded-3xl border border-bark-900/8 bg-gradient-to-r from-[#fdf0d5] via-[#fbe3d6] to-[#f3dcea] p-6 text-center shadow-soft transition hover:shadow-lift sm:flex-row sm:p-8 sm:text-left"
        >
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white shadow-soft">
              <Icon name="instagram" className="size-7" />
            </span>
            <div>
              <p className="font-display text-2xl">@{INSTAGRAM_HANDLE}</p>
              <p className="mt-1 text-sm text-bark-700">Mira celebraciones reales, montajes y novedades de la casa.</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-bark-900 px-5 py-3 text-sm font-semibold text-cream-50 transition group-hover:bg-leaf-900">
            Ver Instagram <Icon name="arrowRight" className="size-4" />
          </span>
        </a>
      </div>
    </section>
  )
}
