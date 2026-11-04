import { useMemo, useState, type ReactNode } from 'react'
import { Icon } from '../../components/ui/Icon'
import { Badge, Button, Card, Field, LoadingBlock, Modal, Select, TextArea } from '../../components/ui/Primitives'
import { useSiteData } from '../../hooks/useSiteData'
import { useToast } from '../../hooks/useToast'
import { asset } from '../../lib/asset'
import { friendlyError } from '../../lib/errors'
import { money, toISO } from '../../lib/format'
import { DEFAULT_WEEKEND_DAYS, WEEKDAY_LABELS, quotePackage } from '../../lib/pricing'
import { supabase } from '../../lib/supabase'
import type { Addon, EventType, GalleryImage, Package, TimeSlot } from '../../lib/types'
import { ImageInput } from '../../components/admin/ImageInput'
import { PICKABLE_ICONS, addonIcon, serviceIcon } from '../../lib/icons'

/* =============================================================================
 * Precios y servicios — editor completo del catálogo, solo para administradores.
 * Todo lo que se guarda aquí se publica de inmediato en el landing.
 * La seguridad no depende de esta pantalla: las políticas RLS de Supabase
 * solo permiten escribir a usuarios registrados en admin_users.
 * ========================================================================== */

type Tab = 'packages' | 'addons' | 'slots' | 'events' | 'photos' | 'rules' | 'simulator'

const TABS: { id: Tab; label: string; icon: Parameters<typeof Icon>[0]['name'] }[] = [
  { id: 'packages', label: 'Paquetes', icon: 'gift' },
  { id: 'addons', label: 'Extras', icon: 'sparkles' },
  { id: 'slots', label: 'Horarios', icon: 'clock' },
  { id: 'events', label: 'Tipos de evento', icon: 'party' },
  { id: 'photos', label: 'Fotos', icon: 'image' },
  { id: 'rules', label: 'Reglas de precio', icon: 'money' },
  { id: 'simulator', label: 'Simulador', icon: 'chart' },
]

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48) || 'item'

const num = (v: string, fallback = 0) => {
  const n = Number(String(v).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : fallback
}
const optNum = (v: string) => (String(v).trim() === '' ? null : num(v))

export default function Paquetes() {
  const data = useSiteData()
  const [tab, setTab] = useState<Tab>('packages')

  if (data.loading) return <LoadingBlock />

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl">Precios y servicios</h1>
        <p className="mt-1 text-bark-500">
          Edita paquetes, extras, horarios y reglas de precio. Los cambios se ven al instante en la web.
        </p>
      </header>

      {data.offline && (
        <div className="flex gap-3 rounded-2xl border border-terra-500/30 bg-terra-500/10 p-4 text-sm text-bark-900">
          <Icon name="alert" className="size-5 shrink-0 text-terra-500" />
          <p>
            No hay conexión con la base de datos: se muestra el catálogo de respaldo y <strong>los cambios no se
            pueden guardar</strong>. Revisa la conexión de Supabase y recarga la página.
          </p>
        </div>
      )}

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === t.id ? 'bg-leaf-700 text-white' : 'bg-white text-bark-700 hover:bg-cream-200'
            }`}
          >
            <Icon name={t.icon} className="size-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'packages' && <PackagesTab />}
      {tab === 'addons' && <AddonsTab />}
      {tab === 'slots' && <SlotsTab />}
      {tab === 'events' && <EventsTab />}
      {tab === 'photos' && <PhotosTab />}
      {tab === 'rules' && <RulesTab />}
      {tab === 'simulator' && <SimulatorTab />}
    </div>
  )
}

/* --------------------------------- helpers --------------------------------- */

function useSaver() {
  const { push } = useToast()
  const { reload, offline } = useSiteData()
  const [busy, setBusy] = useState(false)
  const run = async (fn: () => PromiseLike<{ error: unknown } | void>, ok: string): Promise<boolean> => {
    if (offline) {
      push('Sin conexión con la base de datos: no se puede guardar.', 'error')
      return false
    }
    setBusy(true)
    try {
      const res = await fn()
      const error = res && 'error' in res ? res.error : null
      if (error) {
        push(friendlyError(error), 'error')
        return false
      }
      push(ok, 'success')
      reload()
      return true
    } catch (e) {
      push(friendlyError(e), 'error')
      return false
    } finally {
      setBusy(false)
    }
  }
  return { busy, run }
}

/** Intercambia el orden de dos filas de la misma tabla. */
async function swapOrder(table: string, a: { id: string; sort_order: number }, b: { id: string; sort_order: number }) {
  const ao = a.sort_order === b.sort_order ? b.sort_order + 1 : b.sort_order
  const r1 = await supabase.from(table).update({ sort_order: ao }).eq('id', a.id)
  if (r1.error) return r1
  return supabase.from(table).update({ sort_order: a.sort_order }).eq('id', b.id)
}

function RowActions({
  onEdit, onUp, onDown, onDuplicate, onToggle, active, onDelete,
}: {
  onEdit: () => void
  onUp?: () => void
  onDown?: () => void
  onDuplicate?: () => void
  onToggle: () => void
  active: boolean
  onDelete: () => void
}) {
  const btn = 'grid size-8 place-items-center rounded-lg text-bark-500 transition hover:bg-cream-200 hover:text-bark-900 disabled:opacity-30'
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button size="sm" variant="outline" onClick={onEdit}>
        <Icon name="edit" className="size-4" /> Editar
      </Button>
      <button className={btn} onClick={onUp} disabled={!onUp} aria-label="Subir" title="Subir">
        <Icon name="chevronLeft" className="size-4 rotate-90" />
      </button>
      <button className={btn} onClick={onDown} disabled={!onDown} aria-label="Bajar" title="Bajar">
        <Icon name="chevronLeft" className="size-4 -rotate-90" />
      </button>
      {onDuplicate && (
        <button className={btn} onClick={onDuplicate} aria-label="Duplicar" title="Duplicar">
          <Icon name="clipboard" className="size-4" />
        </button>
      )}
      <button className={btn} onClick={onToggle} aria-label={active ? 'Ocultar' : 'Mostrar'} title={active ? 'Ocultar de la web' : 'Mostrar en la web'}>
        <Icon name={active ? 'check' : 'ban'} className="size-4" />
      </button>
      <button className={`${btn} hover:!text-terra-500`} onClick={onDelete} aria-label="Eliminar" title="Eliminar">
        <Icon name="trash" className="size-4" />
      </button>
    </div>
  )
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex items-center gap-2.5 text-sm font-medium">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[#2f6b45]" />
      {children}
    </label>
  )
}

function DayPicker({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {[1, 2, 3, 4, 5, 6, 0].map((d) => {
        const on = value.includes(d)
        return (
          <button
            key={d}
            type="button"
            onClick={() => onChange(on ? value.filter((x) => x !== d) : [...value, d].sort())}
            className={`h-9 min-w-11 rounded-lg px-2 text-sm font-semibold transition ${
              on ? 'bg-leaf-700 text-white' : 'bg-cream-100 text-bark-700 hover:bg-cream-200'
            }`}
          >
            {WEEKDAY_LABELS[d]}
          </button>
        )
      })}
    </div>
  )
}

function confirmDelete(what: string) {
  return window.confirm(`¿Eliminar ${what}? Esta acción no se puede deshacer.\n\nSi solo quieres sacarlo de la web, usa "Ocultar".`)
}

/* ================================ PAQUETES ================================= */

function PackagesTab() {
  const { allPackages: packages, eventTypes } = useSiteData()
  const { run } = useSaver()
  const [editing, setEditing] = useState<Package | 'new' | null>(null)
  const sorted = [...packages].sort((a, b) => a.sort_order - b.sort_order)

  const duplicate = (p: Package) =>
    run(async () => {
      const { data, error } = await supabase
        .from('packages')
        .insert({
          slug: `${p.slug}-copia-${Date.now().toString(36).slice(-4)}`,
          name: `${p.name} (copia)`,
          subtitle: p.subtitle, description: p.description, event_type_id: p.event_type_id,
          price: p.price, price_is_from: p.price_is_from, weekend_price: p.weekend_price ?? null,
          included_guests: p.included_guests ?? null, extra_guest_price: p.extra_guest_price ?? 0,
          duration_hours: p.duration_hours, max_guests: p.max_guests, image_url: p.image_url,
          badge: null, sort_order: (sorted.at(-1)?.sort_order ?? 0) + 1, active: false,
        })
        .select('id')
        .single()
      if (error || !data) return { error }
      const services = (p.package_services ?? []).map((s, i) => ({ package_id: data.id, name: s.name, sort_order: i + 1 }))
      if (services.length) return supabase.from('package_services').insert(services)
      return { error: null }
    }, 'Paquete duplicado (queda oculto hasta que lo actives)')

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setEditing('new')}>
          <Icon name="plus" className="size-4" /> Nuevo paquete
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {sorted.map((p, i) => {
          const et = eventTypes.find((e) => e.id === p.event_type_id)
          return (
            <Card key={p.id} className={`p-4 ${p.active ? '' : 'opacity-60'}`}>
              <div className="flex gap-4">
                <img src={asset(p.image_url)} alt="" className="size-20 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{p.name}</h3>
                    {!p.active && <Badge tone="gray">Oculto</Badge>}
                    {p.badge && <Badge tone="amber">{p.badge}</Badge>}
                  </div>
                  <p className="text-xs text-bark-500">{et?.name ?? 'Todos los eventos'}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
                    <PriceCell label="Precio" value={money(p.price)} strong />
                    <PriceCell label="Fin de semana" value={p.weekend_price != null ? money(p.weekend_price) : '—'} />
                    <PriceCell label="Capacidad" value={`${p.max_guests} pers.`} />
                    <PriceCell label="Incluye" value={p.included_guests != null ? `${p.included_guests} pers.` : 'Todos'} />
                    <PriceCell label="Invitado extra" value={Number(p.extra_guest_price) ? money(p.extra_guest_price) : '—'} />
                    <PriceCell label="Servicios" value={`${p.package_services?.length ?? 0}`} />
                  </dl>
                </div>
              </div>
              <div className="mt-3 border-t border-bark-900/8 pt-3">
                <RowActions
                  active={p.active}
                  onEdit={() => setEditing(p)}
                  onUp={i > 0 ? () => run(() => swapOrder('packages', p, sorted[i - 1]), 'Orden actualizado') : undefined}
                  onDown={i < sorted.length - 1 ? () => run(() => swapOrder('packages', p, sorted[i + 1]), 'Orden actualizado') : undefined}
                  onDuplicate={() => void duplicate(p)}
                  onToggle={() => run(() => supabase.from('packages').update({ active: !p.active }).eq('id', p.id), p.active ? 'Paquete oculto' : 'Paquete visible')}
                  onDelete={() => confirmDelete(`el paquete "${p.name}"`) && run(() => supabase.from('packages').delete().eq('id', p.id), 'Paquete eliminado')}
                />
              </div>
            </Card>
          )
        })}
      </div>

      {editing && (
        <PackageModal
          pkg={editing === 'new' ? null : editing}
          nextOrder={(sorted.at(-1)?.sort_order ?? 0) + 1}
          eventTypes={eventTypes}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}

function PriceCell({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <dt className="text-[0.7rem] uppercase tracking-wide text-bark-500">{label}</dt>
      <dd className={strong ? 'font-semibold text-leaf-700' : 'font-medium'}>{value}</dd>
    </div>
  )
}

function PackageModal({ pkg, nextOrder, eventTypes, onClose }: {
  pkg: Package | null
  nextOrder: number
  eventTypes: EventType[]
  onClose: () => void
}) {
  const { busy, run } = useSaver()
  const [form, setForm] = useState({
    name: pkg?.name ?? '',
    subtitle: pkg?.subtitle ?? '',
    description: pkg?.description ?? '',
    event_type_id: pkg?.event_type_id ?? '',
    price: String(pkg?.price ?? ''),
    price_is_from: pkg?.price_is_from ?? true,
    weekend_price: pkg?.weekend_price != null ? String(pkg.weekend_price) : '',
    included_guests: pkg?.included_guests != null ? String(pkg.included_guests) : '',
    extra_guest_price: pkg?.extra_guest_price ? String(pkg.extra_guest_price) : '',
    duration_hours: String(pkg?.duration_hours ?? 4),
    max_guests: String(pkg?.max_guests ?? 40),
    badge: pkg?.badge ?? '',
    image_url: pkg?.image_url ?? '',
    active: pkg?.active ?? true,
  })
  const [services, setServices] = useState((pkg?.package_services ?? []).map((s) => s.name))
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))

  const move = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= services.length) return
    const next = [...services]
    ;[next[i], next[j]] = [next[j], next[i]]
    setServices(next)
  }

  const valid = form.name.trim().length >= 2 && num(form.price) >= 0 && num(form.max_guests) > 0

  const save = () =>
    run(async () => {
      const row = {
        name: form.name.trim(),
        subtitle: form.subtitle.trim() || null,
        description: form.description.trim() || null,
        event_type_id: form.event_type_id || null,
        price: num(form.price),
        price_is_from: form.price_is_from,
        weekend_price: optNum(form.weekend_price),
        included_guests: optNum(form.included_guests),
        extra_guest_price: num(form.extra_guest_price),
        duration_hours: num(form.duration_hours, 1) || 1,
        max_guests: num(form.max_guests, 1) || 1,
        badge: form.badge.trim() || null,
        image_url: form.image_url.trim() || null,
        active: form.active,
      }
      let id = pkg?.id
      if (pkg) {
        const { error } = await supabase.from('packages').update(row).eq('id', pkg.id)
        if (error) return { error }
      } else {
        const { data, error } = await supabase
          .from('packages')
          .insert({ ...row, slug: `${slugify(row.name)}-${Date.now().toString(36).slice(-4)}`, sort_order: nextOrder })
          .select('id')
          .single()
        if (error || !data) return { error }
        id = data.id
      }
      const del = await supabase.from('package_services').delete().eq('package_id', id!)
      if (del.error) return del
      const clean = services.map((s) => s.trim()).filter(Boolean)
      if (clean.length) {
        return supabase.from('package_services').insert(clean.map((name, i) => ({ package_id: id, name, sort_order: i + 1 })))
      }
      return { error: null }
    }, pkg ? 'Paquete actualizado' : 'Paquete creado').then((ok) => ok && onClose())

  // Vista previa del precio con los valores del formulario.
  const preview = (guests: number, weekend: boolean) =>
    quotePackage(
      { ...(pkg ?? ({} as Package)), price: num(form.price), weekend_price: optNum(form.weekend_price), included_guests: optNum(form.included_guests), extra_guest_price: num(form.extra_guest_price) } as Package,
      { guests, date: weekend ? nextWeekday(6) : nextWeekday(2), weekendDays: DEFAULT_WEEKEND_DAYS },
    ).total
  const maxG = num(form.max_guests, 40) || 40

  return (
    <Modal open onClose={onClose} title={pkg ? `Editar ${pkg.name}` : 'Nuevo paquete'} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Pack Cumpleaños Infantil" />
        <Field label="Subtítulo" hint="opcional" value={form.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />
        <Select label="Tipo de evento" value={form.event_type_id} onChange={(e) => set({ event_type_id: e.target.value })}>
          <option value="">Todos los eventos</option>
          {eventTypes.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </Select>
        <Field label="Etiqueta destacada" hint="opcional" value={form.badge} onChange={(e) => set({ badge: e.target.value })} placeholder="El más pedido" />

        <fieldset className="rounded-2xl border border-bark-900/10 p-4 sm:col-span-2">
          <legend className="px-1 text-sm font-semibold">Precio</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Precio base (lun–jue)" type="number" inputMode="numeric" value={form.price} onChange={(e) => set({ price: e.target.value })} />
            <Field label="Precio fin de semana" hint="vacío = igual al base" type="number" inputMode="numeric" value={form.weekend_price} onChange={(e) => set({ weekend_price: e.target.value })} />
            <Field label="Invitados incluidos" hint="vacío = todos" type="number" inputMode="numeric" value={form.included_guests} onChange={(e) => set({ included_guests: e.target.value })} />
            <Field label="Valor por invitado adicional" type="number" inputMode="numeric" value={form.extra_guest_price} onChange={(e) => set({ extra_guest_price: e.target.value })} placeholder="0" />
            <Field label="Capacidad máxima" type="number" inputMode="numeric" value={form.max_guests} onChange={(e) => set({ max_guests: e.target.value })} />
            <Field label="Duración (horas)" type="number" step="0.5" value={form.duration_hours} onChange={(e) => set({ duration_hours: e.target.value })} />
            <div className="sm:col-span-2">
              <Check checked={form.price_is_from} onChange={(v) => set({ price_is_from: v })}>Mostrar como "desde $…" en la web</Check>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-cream-100 p-3 text-xs sm:grid-cols-4">
            {[
              ['Semana · 20 pers.', preview(Math.min(20, maxG), false)],
              ['Semana · máx.', preview(maxG, false)],
              ['Fin de semana · 20', preview(Math.min(20, maxG), true)],
              ['Fin de semana · máx.', preview(maxG, true)],
            ].map(([l, v]) => (
              <div key={l as string}>
                <p className="text-bark-500">{l}</p>
                <p className="font-semibold text-leaf-700">{money(v as number)}</p>
              </div>
            ))}
          </div>
        </fieldset>

        <div className="sm:col-span-2">
          <ImageInput label="Foto del paquete" folder="paquetes" value={form.image_url} onChange={(url) => set({ image_url: url })} aspect="aspect-[10/7]" />
        </div>
        <div className="sm:col-span-2">
          <TextArea label="Descripción" hint="opcional" value={form.description} onChange={(e) => set({ description: e.target.value })} />
        </div>

        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-semibold">Servicios incluidos <span className="font-normal text-bark-500">({services.length})</span></p>
          <div className="space-y-2">
            {services.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-leaf-50 text-leaf-700" title="Ícono automático según el texto">
                  <Icon name={serviceIcon(s)} className="size-4" />
                </span>
                <input
                  value={s}
                  onChange={(e) => setServices(services.map((x, j) => (j === i ? e.target.value : x)))}
                  placeholder="Ej: Mesas y sillas para todos"
                  className="w-full rounded-xl border border-bark-900/15 bg-white px-3 py-2 text-sm focus:border-leaf-600 focus:outline-none"
                />
                <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded-lg px-2 text-bark-500 hover:bg-cream-200 disabled:opacity-30" aria-label="Subir">
                  <Icon name="chevronLeft" className="size-4 rotate-90" />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === services.length - 1} className="rounded-lg px-2 text-bark-500 hover:bg-cream-200 disabled:opacity-30" aria-label="Bajar">
                  <Icon name="chevronLeft" className="size-4 -rotate-90" />
                </button>
                <button onClick={() => setServices(services.filter((_, j) => j !== i))} className="rounded-lg px-2 text-bark-500 hover:bg-cream-200 hover:text-terra-500" aria-label="Quitar servicio">
                  <Icon name="trash" className="size-4" />
                </button>
              </div>
            ))}
          </div>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => setServices([...services, ''])}>
            <Icon name="plus" className="size-4" /> Agregar servicio
          </Button>
        </div>

        <div className="sm:col-span-2">
          <Check checked={form.active} onChange={(v) => set({ active: v })}>Visible en la web</Check>
        </div>

        <div className="sm:col-span-2">
          <Button full disabled={busy || !valid} onClick={() => void save()}>
            {busy ? 'Guardando…' : pkg ? 'Guardar cambios' : 'Crear paquete'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function nextWeekday(dow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + ((dow - d.getDay() + 7) % 7 || 7))
  return toISO(d)
}

/* ================================= EXTRAS ================================== */

const UNITS = ['servicio', 'unidad', 'persona', 'hora']

function AddonsTab() {
  const { allAddons: addons } = useSiteData()
  const { run } = useSaver()
  const [editing, setEditing] = useState<Addon | 'new' | null>(null)
  const sorted = [...addons].sort((a, b) => a.sort_order - b.sort_order)
  const categories = useMemo(() => [...new Set(sorted.map((a) => a.category || 'Otros'))], [sorted])

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setEditing('new')}>
          <Icon name="plus" className="size-4" /> Nuevo extra
        </Button>
      </div>
      {categories.map((cat) => {
        const list = sorted.filter((a) => (a.category || 'Otros') === cat)
        return (
          <section key={cat}>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-bark-500">{cat}</h2>
            <Card className="divide-y divide-bark-900/8">
              {list.map((a) => {
                const i = sorted.indexOf(a)
                return (
                  <div key={a.id} className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${a.active ? '' : 'opacity-60'}`}>
                    <div className="flex min-w-0 gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-leaf-50 text-leaf-700">
                      <Icon name={addonIcon(a.icon, a.name)} className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{a.name}</h3>
                        {!a.active && <Badge tone="gray">Oculto</Badge>}
                        {a.per_guest && <Badge tone="blue">por invitado</Badge>}
                      </div>
                      <p className="text-sm text-bark-500">{a.description}</p>
                      <p className="mt-1 text-sm font-semibold text-leaf-700">
                        {money(a.price)} <span className="font-normal text-bark-500">/ {a.unit}</span>
                        {a.max_quantity != null && <span className="font-normal text-bark-500"> · máx. {a.max_quantity}</span>}
                      </p>
                    </div>
                    </div>
                    <RowActions
                      active={a.active}
                      onEdit={() => setEditing(a)}
                      onUp={i > 0 ? () => run(() => swapOrder('addons', a, sorted[i - 1]), 'Orden actualizado') : undefined}
                      onDown={i < sorted.length - 1 ? () => run(() => swapOrder('addons', a, sorted[i + 1]), 'Orden actualizado') : undefined}
                      onToggle={() => run(() => supabase.from('addons').update({ active: !a.active }).eq('id', a.id), a.active ? 'Extra oculto' : 'Extra visible')}
                      onDelete={() => confirmDelete(`el extra "${a.name}"`) && run(() => supabase.from('addons').delete().eq('id', a.id), 'Extra eliminado')}
                    />
                  </div>
                )
              })}
            </Card>
          </section>
        )
      })}
      {editing && (
        <AddonModal
          addon={editing === 'new' ? null : editing}
          categories={categories}
          nextOrder={(sorted.at(-1)?.sort_order ?? 0) + 1}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}

function AddonModal({ addon, categories, nextOrder, onClose }: {
  addon: Addon | null
  categories: string[]
  nextOrder: number
  onClose: () => void
}) {
  const { busy, run } = useSaver()
  const [form, setForm] = useState({
    name: addon?.name ?? '',
    description: addon?.description ?? '',
    category: addon?.category ?? categories[0] ?? 'Otros',
    price: String(addon?.price ?? ''),
    unit: addon?.unit ?? 'servicio',
    per_guest: addon?.per_guest ?? false,
    max_quantity: addon?.max_quantity != null ? String(addon.max_quantity) : '',
    icon: addonIcon(addon?.icon, addon?.name ?? '') as string,
    active: addon?.active ?? true,
  })
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))

  const save = () =>
    run(() => {
      const row = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category.trim() || 'Otros',
        price: num(form.price),
        unit: form.per_guest ? 'persona' : form.unit,
        per_guest: form.per_guest,
        max_quantity: optNum(form.max_quantity),
        icon: form.icon,
        active: form.active,
      }
      return addon
        ? supabase.from('addons').update(row).eq('id', addon.id)
        : supabase.from('addons').insert({ ...row, sort_order: nextOrder })
    }, addon ? 'Extra actualizado' : 'Extra creado').then((ok) => ok && onClose())

  return (
    <Modal open onClose={onClose} title={addon ? `Editar ${addon.name}` : 'Nuevo extra'}>
      <div className="space-y-4">
        <Field label="Nombre" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Candy bar" />
        <TextArea label="Descripción" hint="opcional" value={form.description} onChange={(e) => set({ description: e.target.value })} />
        <div>
          <p className="mb-2 text-sm font-semibold">Ícono</p>
          <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-10">
            {PICKABLE_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => set({ icon: ic })}
                aria-label={ic}
                aria-pressed={form.icon === ic}
                className={`grid aspect-square place-items-center rounded-lg transition ${
                  form.icon === ic ? 'bg-leaf-700 text-white' : 'bg-cream-100 text-bark-700 hover:bg-cream-200'
                }`}
              >
                <Icon name={ic} className="size-4.5" />
              </button>
            ))}
          </div>
        </div>
        <div>
          <Field label="Categoría" value={form.category} onChange={(e) => set({ category: e.target.value })} list="addon-categories" />
          <datalist id="addon-categories">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Precio" type="number" inputMode="numeric" value={form.price} onChange={(e) => set({ price: e.target.value })} />
          <Select label="Se cobra por" value={form.per_guest ? 'persona' : form.unit} disabled={form.per_guest} onChange={(e) => set({ unit: e.target.value })}>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </Select>
        </div>
        <Field label="Cantidad máxima" hint="vacío = sin límite" type="number" inputMode="numeric" value={form.max_quantity} onChange={(e) => set({ max_quantity: e.target.value })} />
        <Check checked={form.per_guest} onChange={(v) => set({ per_guest: v })}>Se multiplica por la cantidad de invitados</Check>
        <Check checked={form.active} onChange={(v) => set({ active: v })}>Visible en la web</Check>
        <Button full disabled={busy || form.name.trim().length < 2} onClick={() => void save()}>
          {busy ? 'Guardando…' : addon ? 'Guardar cambios' : 'Crear extra'}
        </Button>
      </div>
    </Modal>
  )
}

/* ================================ HORARIOS ================================= */

function SlotsTab() {
  const { slots } = useSiteData()
  const { run } = useSaver()
  const [editing, setEditing] = useState<TimeSlot | 'new' | null>(null)
  const sorted = [...slots].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-bark-500">Bloques que el cliente puede elegir en el calendario, con su recargo opcional.</p>
        <Button onClick={() => setEditing('new')}>
          <Icon name="plus" className="size-4" /> Nuevo horario
        </Button>
      </div>
      <Card className="divide-y divide-bark-900/8">
        {sorted.map((s, i) => (
          <div key={s.id} className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${s.active ? '' : 'opacity-60'}`}>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{s.name}</h3>
                {!s.active && <Badge tone="gray">Oculto</Badge>}
                {Number(s.surcharge) > 0 && <Badge tone="amber">+{money(s.surcharge)}</Badge>}
              </div>
              <p className="text-sm text-bark-500">
                {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)} · {[1, 2, 3, 4, 5, 6, 0].filter((d) => s.weekdays.includes(d)).map((d) => WEEKDAY_LABELS[d]).join(', ')}
              </p>
            </div>
            <RowActions
              active={s.active}
              onEdit={() => setEditing(s)}
              onUp={i > 0 ? () => run(() => swapOrder('time_slots', s, sorted[i - 1]), 'Orden actualizado') : undefined}
              onDown={i < sorted.length - 1 ? () => run(() => swapOrder('time_slots', s, sorted[i + 1]), 'Orden actualizado') : undefined}
              onToggle={() => run(() => supabase.from('time_slots').update({ active: !s.active }).eq('id', s.id), s.active ? 'Horario oculto' : 'Horario visible')}
              onDelete={() => confirmDelete(`el horario "${s.name}"`) && run(() => supabase.from('time_slots').delete().eq('id', s.id), 'Horario eliminado')}
            />
          </div>
        ))}
      </Card>
      {editing && <SlotModal slot={editing === 'new' ? null : editing} nextOrder={(sorted.at(-1)?.sort_order ?? 0) + 1} onClose={() => setEditing(null)} />}
    </>
  )
}

function SlotModal({ slot, nextOrder, onClose }: { slot: TimeSlot | null; nextOrder: number; onClose: () => void }) {
  const { busy, run } = useSaver()
  const [form, setForm] = useState({
    name: slot?.name ?? '',
    start_time: slot?.start_time.slice(0, 5) ?? '16:00',
    end_time: slot?.end_time.slice(0, 5) ?? '19:30',
    weekdays: slot?.weekdays ?? [0, 1, 2, 3, 4, 5, 6],
    surcharge: slot?.surcharge ? String(slot.surcharge) : '',
    active: slot?.active ?? true,
  })
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))
  const save = () =>
    run(() => {
      const row = { ...form, name: form.name.trim(), surcharge: num(form.surcharge) }
      return slot ? supabase.from('time_slots').update(row).eq('id', slot.id) : supabase.from('time_slots').insert({ ...row, sort_order: nextOrder })
    }, slot ? 'Horario actualizado' : 'Horario creado').then((ok) => ok && onClose())

  return (
    <Modal open onClose={onClose} title={slot ? `Editar ${slot.name}` : 'Nuevo horario'}>
      <div className="space-y-4">
        <Field label="Nombre" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Tarde" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Inicio" type="time" value={form.start_time} onChange={(e) => set({ start_time: e.target.value })} />
          <Field label="Término" hint="puede pasar medianoche" type="time" value={form.end_time} onChange={(e) => set({ end_time: e.target.value })} />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Días disponibles</p>
          <DayPicker value={form.weekdays} onChange={(v) => set({ weekdays: v })} />
        </div>
        <Field label="Recargo por este horario" hint="opcional" type="number" inputMode="numeric" value={form.surcharge} onChange={(e) => set({ surcharge: e.target.value })} placeholder="0" />
        <Check checked={form.active} onChange={(v) => set({ active: v })}>Disponible para reservar</Check>
        <Button full disabled={busy || form.name.trim().length < 2 || !form.weekdays.length} onClick={() => void save()}>
          {busy ? 'Guardando…' : slot ? 'Guardar cambios' : 'Crear horario'}
        </Button>
      </div>
    </Modal>
  )
}

/* ============================= TIPOS DE EVENTO ============================= */

function EventsTab() {
  const { eventTypes, allPackages: packages } = useSiteData()
  const { run } = useSaver()
  const [editing, setEditing] = useState<EventType | 'new' | null>(null)
  const sorted = [...eventTypes].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setEditing('new')}>
          <Icon name="plus" className="size-4" /> Nuevo tipo de evento
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {sorted.map((e, i) => (
          <Card key={e.id} className={`p-4 ${e.active ? '' : 'opacity-60'}`}>
            <div className="flex gap-4">
              <img src={asset(e.image_url)} alt="" className="size-16 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0">
                <h3 className="font-semibold">{e.name}</h3>
                <p className="text-sm text-bark-500">{e.short_description}</p>
                <p className="mt-1 text-xs text-bark-500">{packages.filter((p) => p.event_type_id === e.id).length} paquetes · /reservar?evento={e.slug}</p>
              </div>
            </div>
            <div className="mt-3 border-t border-bark-900/8 pt-3">
              <RowActions
                active={e.active}
                onEdit={() => setEditing(e)}
                onUp={i > 0 ? () => run(() => swapOrder('event_types', e, sorted[i - 1]), 'Orden actualizado') : undefined}
                onDown={i < sorted.length - 1 ? () => run(() => swapOrder('event_types', e, sorted[i + 1]), 'Orden actualizado') : undefined}
                onToggle={() => run(() => supabase.from('event_types').update({ active: !e.active }).eq('id', e.id), e.active ? 'Evento oculto' : 'Evento visible')}
                onDelete={() => confirmDelete(`el tipo de evento "${e.name}" (sus paquetes quedan para "todos los eventos")`) && run(() => supabase.from('event_types').delete().eq('id', e.id), 'Tipo de evento eliminado')}
              />
            </div>
          </Card>
        ))}
      </div>
      {editing && <EventModal ev={editing === 'new' ? null : editing} nextOrder={(sorted.at(-1)?.sort_order ?? 0) + 1} onClose={() => setEditing(null)} />}
    </>
  )
}

function EventModal({ ev, nextOrder, onClose }: { ev: EventType | null; nextOrder: number; onClose: () => void }) {
  const { busy, run } = useSaver()
  const [form, setForm] = useState({
    name: ev?.name ?? '',
    slug: ev?.slug ?? '',
    short_description: ev?.short_description ?? '',
    image_url: ev?.image_url ?? '',
    active: ev?.active ?? true,
  })
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))
  const save = () =>
    run(() => {
      const row = {
        name: form.name.trim(),
        slug: slugify(form.slug || form.name),
        short_description: form.short_description.trim() || null,
        image_url: form.image_url.trim() || null,
        active: form.active,
      }
      return ev ? supabase.from('event_types').update(row).eq('id', ev.id) : supabase.from('event_types').insert({ ...row, sort_order: nextOrder })
    }, ev ? 'Tipo de evento actualizado' : 'Tipo de evento creado').then((ok) => ok && onClose())

  return (
    <Modal open onClose={onClose} title={ev ? `Editar ${ev.name}` : 'Nuevo tipo de evento'}>
      <div className="space-y-4">
        <Field label="Nombre" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Baby shower" />
        <Field label="Identificador para enlaces" hint="se usa en ?evento=" value={form.slug} onChange={(e) => set({ slug: e.target.value })} placeholder={slugify(form.name || 'baby-shower')} />
        <TextArea label="Descripción corta" value={form.short_description} onChange={(e) => set({ short_description: e.target.value })} />
        <ImageInput label="Foto" folder="eventos" value={form.image_url} onChange={(url) => set({ image_url: url })} aspect="aspect-[4/3]" />
        <Check checked={form.active} onChange={(v) => set({ active: v })}>Visible en la web</Check>
        <Button full disabled={busy || form.name.trim().length < 2} onClick={() => void save()}>
          {busy ? 'Guardando…' : ev ? 'Guardar cambios' : 'Crear tipo de evento'}
        </Button>
      </div>
    </Modal>
  )
}

/* ============================= REGLAS DE PRECIO ============================ */

function RulesTab() {
  const { settings } = useSiteData()
  const { busy, run } = useSaver()
  const [form, setForm] = useState({
    weekend_days: settings?.weekend_days ?? DEFAULT_WEEKEND_DAYS,
    deposit_percent: String(settings?.deposit_percent ?? 30),
    min_guests: String(settings?.min_guests ?? 10),
    max_capacity: String(settings?.max_capacity ?? 60),
    lead_time_days: String(settings?.lead_time_days ?? 3),
    max_advance_days: String(settings?.max_advance_days ?? 365),
  })
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))

  return (
    <Card className="max-w-2xl space-y-6 p-5 md:p-6">
      <div>
        <p className="text-sm font-semibold">Días con tarifa de fin de semana</p>
        <p className="mb-3 text-xs text-bark-500">En estos días se usa el "precio fin de semana" de cada paquete (si lo tiene).</p>
        <DayPicker value={form.weekend_days} onChange={(v) => set({ weekend_days: v })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Abono para reservar (%)" type="number" value={form.deposit_percent} onChange={(e) => set({ deposit_percent: e.target.value })} />
        <Field label="Capacidad máxima del local" type="number" value={form.max_capacity} onChange={(e) => set({ max_capacity: e.target.value })} />
        <Field label="Mínimo de invitados" type="number" value={form.min_guests} onChange={(e) => set({ min_guests: e.target.value })} />
        <Field label="Anticipación mínima (días)" type="number" value={form.lead_time_days} onChange={(e) => set({ lead_time_days: e.target.value })} />
        <Field label="Agenda abierta hasta (días)" type="number" value={form.max_advance_days} onChange={(e) => set({ max_advance_days: e.target.value })} />
      </div>
      <Button
        disabled={busy}
        onClick={() =>
          void run(
            () =>
              supabase
                .from('settings')
                .update({
                  weekend_days: form.weekend_days,
                  deposit_percent: Math.min(100, Math.max(0, num(form.deposit_percent))),
                  min_guests: num(form.min_guests, 1),
                  max_capacity: num(form.max_capacity, 1),
                  lead_time_days: num(form.lead_time_days),
                  max_advance_days: num(form.max_advance_days, 30),
                })
                .eq('id', 1),
            'Reglas guardadas',
          )
        }
      >
        {busy ? 'Guardando…' : 'Guardar reglas'}
      </Button>
    </Card>
  )
}

/* ================================ SIMULADOR ================================ */

function SimulatorTab() {
  const { allPackages: packages, slots, allAddons: addons, settings } = useSiteData()
  const [pkgId, setPkgId] = useState(packages[0]?.id ?? '')
  const [slotId, setSlotId] = useState(slots[0]?.id ?? '')
  const [date, setDate] = useState(() => nextWeekday(6))
  const [guests, setGuests] = useState(30)
  const [picked, setPicked] = useState<Record<string, number>>({})

  const pkg = packages.find((p) => p.id === pkgId) ?? null
  const slot = slots.find((s) => s.id === slotId) ?? null
  const q = quotePackage(pkg, { date, guests, slot, weekendDays: settings?.weekend_days })
  const lines = addons
    .filter((a) => picked[a.id])
    .map((a) => ({ name: a.name, total: a.price * (a.per_guest ? guests : picked[a.id]) }))
  const total = q.total + lines.reduce((s, l) => s + l.total, 0)
  const deposit = Math.round((total * (settings?.deposit_percent ?? 30)) / 100)

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
      <Card className="space-y-4 p-5">
        <p className="text-sm text-bark-500">Prueba cómo verá el cliente el precio con la configuración actual.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Paquete" value={pkgId} onChange={(e) => setPkgId(e.target.value)}>
            {packages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Select label="Horario" value={slotId} onChange={(e) => setSlotId(e.target.value)}>
            {slots.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Field label="Fecha" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Field label="Invitados" type="number" value={String(guests)} onChange={(e) => setGuests(Math.max(1, num(e.target.value, 1)))} />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Extras</p>
          <div className="flex flex-wrap gap-2">
            {addons.map((a) => (
              <button
                key={a.id}
                onClick={() => setPicked((p) => ({ ...p, [a.id]: p[a.id] ? 0 : 1 }))}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  picked[a.id] ? 'border-leaf-700 bg-leaf-700 text-white' : 'border-bark-900/12 bg-white text-bark-700'
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>
      </Card>
      <Card className="h-fit overflow-hidden">
        <div className="bg-leaf-900 px-5 py-3 text-sm font-semibold text-cream-50">Cotización simulada</div>
        <dl className="space-y-2 px-5 py-4 text-sm">
          <SimRow label={`${pkg?.name ?? '—'}${q.weekend ? ' (fin de semana)' : ''}`} value={q.base} />
          {q.extraGuests > 0 && <SimRow label={`${q.extraGuests} invitados extra × ${money(q.extraGuestPrice)}`} value={q.extraGuestsTotal} />}
          {q.slotSurcharge > 0 && <SimRow label={`Recargo ${slot?.name}`} value={q.slotSurcharge} />}
          {lines.map((l) => <SimRow key={l.name} label={`+ ${l.name}`} value={l.total} />)}
        </dl>
        <div className="border-t border-dashed border-bark-900/12 bg-cream-50 px-5 py-4">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold uppercase text-bark-500">Total</span>
            <span className="font-display text-2xl text-leaf-700">{money(total)}</span>
          </div>
          <p className="text-xs text-bark-500">Abono ({settings?.deposit_percent ?? 30}%): {money(deposit)}</p>
          {pkg && guests > pkg.max_guests && <p className="mt-2 text-xs font-semibold text-terra-500">Supera la capacidad del paquete ({pkg.max_guests}).</p>}
        </div>
      </Card>
    </div>
  )
}

function SimRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-bark-500">{label}</dt>
      <dd className="font-medium">{money(value)}</dd>
    </div>
  )
}

/* ================================== FOTOS ================================== */

function PhotosTab() {
  const { settings, gallery } = useSiteData()
  const { busy, run } = useSaver()
  const [hero, setHero] = useState(settings?.hero_image_url ?? '')
  const sorted = [...gallery].sort((a, b) => a.sort_order - b.sort_order)

  const update = (g: GalleryImage, patch: Partial<GalleryImage>) =>
    run(() => supabase.from('gallery_images').update(patch).eq('id', g.id), 'Foto actualizada')

  return (
    <div className="space-y-6">
      <div className="flex gap-3 rounded-2xl bg-sun-100 p-4 text-sm text-bark-900">
        <Icon name="instagram" className="size-5 shrink-0 text-sun-600" />
        <p>
          Desde el celular: abre tu Instagram o Facebook, guarda las fotos en el teléfono y súbelas aquí con
          <strong> Subir foto</strong>. Se comprimen solas para que la web cargue rápido. Usa fotos horizontales,
          con buena luz y sin texto encima.
        </p>
      </div>

      <Card className="p-5">
        <ImageInput label="Foto de portada (fondo del inicio)" hint="horizontal, mín. 1600 px" folder="portada" value={hero} onChange={setHero} aspect="aspect-[16/7]" />
        <Button
          className="mt-3"
          disabled={busy || hero === (settings?.hero_image_url ?? '')}
          onClick={() => void run(() => supabase.from('settings').update({ hero_image_url: hero || null }).eq('id', 1), 'Portada actualizada')}
        >
          Guardar portada
        </Button>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg">Galería "Conoce la casa"</h2>
          <Button
            size="sm"
            onClick={() =>
              void run(
                () =>
                  supabase.from('gallery_images').insert({
                    url: 'images/galeria-01.svg',
                    caption: 'Nueva foto',
                    alt: 'Foto de La Casa del Árbol 309',
                    sort_order: (sorted.at(-1)?.sort_order ?? 0) + 1,
                  }),
                'Espacio agregado: sube la foto',
              )
            }
          >
            <Icon name="plus" className="size-4" /> Agregar foto
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((g, i) => (
            <GalleryCard
              key={g.id}
              g={g}
              onSave={(patch) => void update(g, patch)}
              onUp={i > 0 ? () => void run(() => swapOrder('gallery_images', g, sorted[i - 1]), 'Orden actualizado') : undefined}
              onDown={i < sorted.length - 1 ? () => void run(() => swapOrder('gallery_images', g, sorted[i + 1]), 'Orden actualizado') : undefined}
              onToggle={() => void update(g, { active: !g.active })}
              onDelete={() => confirmDelete('esta foto') && void run(() => supabase.from('gallery_images').delete().eq('id', g.id), 'Foto eliminada')}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-bark-500">La primera foto se muestra más grande en la web.</p>
      </div>
    </div>
  )
}

function GalleryCard({ g, onSave, onUp, onDown, onToggle, onDelete }: {
  g: GalleryImage
  onSave: (patch: Partial<GalleryImage>) => void
  onUp?: () => void
  onDown?: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  const [caption, setCaption] = useState(g.caption ?? '')
  return (
    <Card className={`p-3 ${g.active ? '' : 'opacity-60'}`}>
      <ImageInput label={g.active ? 'Foto' : 'Foto (oculta)'} folder="galeria" value={g.url} onChange={(url) => onSave({ url })} aspect="aspect-[4/3]" />
      <div className="mt-2 flex gap-2">
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={() => caption !== (g.caption ?? '') && onSave({ caption, alt: caption })}
          placeholder="Título (ej: Terraza)"
          className="w-full rounded-xl border border-bark-900/15 bg-white px-3 py-2 text-sm focus:border-leaf-600 focus:outline-none"
        />
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-bark-500">
        <button onClick={onUp} disabled={!onUp} className="grid size-8 place-items-center rounded-lg hover:bg-cream-200 disabled:opacity-30" aria-label="Subir"><Icon name="chevronLeft" className="size-4 rotate-90" /></button>
        <button onClick={onDown} disabled={!onDown} className="grid size-8 place-items-center rounded-lg hover:bg-cream-200 disabled:opacity-30" aria-label="Bajar"><Icon name="chevronLeft" className="size-4 -rotate-90" /></button>
        <button onClick={onToggle} className="grid size-8 place-items-center rounded-lg hover:bg-cream-200" aria-label={g.active ? 'Ocultar' : 'Mostrar'}><Icon name={g.active ? 'check' : 'ban'} className="size-4" /></button>
        <button onClick={onDelete} className="grid size-8 place-items-center rounded-lg hover:bg-cream-200 hover:text-terra-500" aria-label="Eliminar"><Icon name="trash" className="size-4" /></button>
      </div>
    </Card>
  )
}
