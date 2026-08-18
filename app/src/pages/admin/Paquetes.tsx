import { useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { Badge, Button, Card, Field, LoadingBlock, Modal, TextArea } from '../../components/ui/Primitives'
import { useSiteData } from '../../hooks/useSiteData'
import { useToast } from '../../hooks/useToast'
import { friendlyError } from '../../lib/errors'
import { money } from '../../lib/format'
import { supabase } from '../../lib/supabase'
import type { Addon, Package } from '../../lib/types'

export default function Paquetes() {
  const { packages, addons, loading, reload } = useSiteData()
  const [tab, setTab] = useState<'packages' | 'addons'>('packages')
  const [editing, setEditing] = useState<Package | null>(null)
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null)

  if (loading) return <LoadingBlock />

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl">Paquetes y servicios</h1>
        <p className="mt-1 text-bark-500">Lo que edites aquí se refleja de inmediato en la web pública.</p>
      </header>

      <div className="flex gap-2">
        {(['packages', 'addons'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === t ? 'bg-leaf-700 text-white' : 'bg-white text-bark-700 hover:bg-cream-200'
            }`}
          >
            {t === 'packages' ? 'Paquetes' : 'Servicios adicionales'}
          </button>
        ))}
      </div>

      {tab === 'packages' && (
        <div className="grid gap-3 md:grid-cols-2">
          {packages.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{p.name}</h3>
                    {!p.active && <Badge tone="gray">Inactivo</Badge>}
                    {p.badge && <Badge tone="amber">{p.badge}</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-bark-500">{p.subtitle}</p>
                  <p className="mt-2 font-display text-xl text-leaf-700">{money(p.price)}</p>
                  <p className="mt-1 text-xs text-bark-500">
                    {p.duration_hours} h · hasta {p.max_guests} personas · {p.package_services?.length ?? 0} servicios incluidos
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                  <Icon name="edit" className="size-4" /> Editar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'addons' && (
        <div className="grid gap-3 md:grid-cols-2">
          {addons.map((a) => (
            <Card key={a.id} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{a.name}</h3>
                  {!a.active && <Badge tone="gray">Inactivo</Badge>}
                </div>
                <p className="mt-1 text-sm text-bark-500">{a.description}</p>
                <p className="mt-2 font-semibold text-leaf-700">
                  {money(a.price)} <span className="text-xs font-normal text-bark-500">/ {a.unit}</span>
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setEditingAddon(a)}>
                <Icon name="edit" className="size-4" /> Editar
              </Button>
            </Card>
          ))}
        </div>
      )}

      {editing && <PackageModal pkg={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />}
      {editingAddon && <AddonModal addon={editingAddon} onClose={() => setEditingAddon(null)} onSaved={() => { setEditingAddon(null); reload() }} />}
    </div>
  )
}

function PackageModal({ pkg, onClose, onSaved }: { pkg: Package; onClose: () => void; onSaved: () => void }) {
  const { push } = useToast()
  const [form, setForm] = useState({
    name: pkg.name,
    subtitle: pkg.subtitle ?? '',
    description: pkg.description ?? '',
    price: String(pkg.price),
    duration_hours: String(pkg.duration_hours),
    max_guests: String(pkg.max_guests),
    badge: pkg.badge ?? '',
    image_url: pkg.image_url ?? '',
    active: pkg.active,
  })
  const [services, setServices] = useState((pkg.package_services ?? []).map((s) => s.name))
  const [busy, setBusy] = useState(false)
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))

  const save = async () => {
    setBusy(true)
    const { error } = await supabase
      .from('packages')
      .update({
        name: form.name,
        subtitle: form.subtitle || null,
        description: form.description || null,
        price: Number(form.price) || 0,
        duration_hours: Number(form.duration_hours) || 1,
        max_guests: Number(form.max_guests) || 1,
        badge: form.badge || null,
        image_url: form.image_url || null,
        active: form.active,
      })
      .eq('id', pkg.id)

    if (!error) {
      await supabase.from('package_services').delete().eq('package_id', pkg.id)
      const clean = services.map((s) => s.trim()).filter(Boolean)
      if (clean.length) {
        await supabase
          .from('package_services')
          .insert(clean.map((name, i) => ({ package_id: pkg.id, name, sort_order: i + 1 })))
      }
    }

    setBusy(false)
    if (error) return push(friendlyError(error), 'error')
    push('Paquete actualizado', 'success')
    onSaved()
  }

  return (
    <Modal open onClose={onClose} title={`Editar ${pkg.name}`} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" value={form.name} onChange={(e) => set({ name: e.target.value })} />
        <Field label="Subtítulo" value={form.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />
        <Field label="Precio" type="number" value={form.price} onChange={(e) => set({ price: e.target.value })} />
        <Field label="Etiqueta destacada" hint="opcional" value={form.badge} onChange={(e) => set({ badge: e.target.value })} placeholder="El más pedido" />
        <Field label="Duración (horas)" type="number" step="0.5" value={form.duration_hours} onChange={(e) => set({ duration_hours: e.target.value })} />
        <Field label="Capacidad máxima" type="number" value={form.max_guests} onChange={(e) => set({ max_guests: e.target.value })} />
        <div className="sm:col-span-2">
          <Field label="Imagen (URL)" hint="deja el valor por defecto o pega la URL de tu foto" value={form.image_url} onChange={(e) => set({ image_url: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <TextArea label="Descripción" value={form.description} onChange={(e) => set({ description: e.target.value })} />
        </div>

        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-semibold">Servicios incluidos</p>
          <div className="space-y-2">
            {services.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={s}
                  onChange={(e) => setServices(services.map((x, j) => (j === i ? e.target.value : x)))}
                  className="w-full rounded-xl border border-bark-900/15 bg-white px-3 py-2 text-sm focus:border-leaf-600 focus:outline-none"
                />
                <button
                  onClick={() => setServices(services.filter((_, j) => j !== i))}
                  className="rounded-xl px-3 text-bark-500 transition hover:bg-cream-200"
                  aria-label="Quitar servicio"
                >
                  <Icon name="trash" className="size-4" />
                </button>
              </div>
            ))}
          </div>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => setServices([...services, ''])}>
            <Icon name="plus" className="size-4" /> Agregar servicio
          </Button>
        </div>

        <label className="flex items-center gap-2.5 text-sm font-medium sm:col-span-2">
          <input type="checkbox" checked={form.active} onChange={(e) => set({ active: e.target.checked })} className="size-4 accent-[#2f6b45]" />
          Visible en la web
        </label>

        <div className="sm:col-span-2">
          <Button full disabled={busy} onClick={() => void save()}>
            {busy ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function AddonModal({ addon, onClose, onSaved }: { addon: Addon; onClose: () => void; onSaved: () => void }) {
  const { push } = useToast()
  const [form, setForm] = useState({
    name: addon.name,
    description: addon.description ?? '',
    price: String(addon.price),
    unit: addon.unit,
    per_guest: addon.per_guest,
    active: addon.active,
  })
  const [busy, setBusy] = useState(false)
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))

  const save = async () => {
    setBusy(true)
    const { error } = await supabase
      .from('addons')
      .update({
        name: form.name,
        description: form.description || null,
        price: Number(form.price) || 0,
        unit: form.unit,
        per_guest: form.per_guest,
        active: form.active,
      })
      .eq('id', addon.id)
    setBusy(false)
    if (error) return push(friendlyError(error), 'error')
    push('Servicio actualizado', 'success')
    onSaved()
  }

  return (
    <Modal open onClose={onClose} title={`Editar ${addon.name}`}>
      <div className="space-y-4">
        <Field label="Nombre" value={form.name} onChange={(e) => set({ name: e.target.value })} />
        <TextArea label="Descripción" value={form.description} onChange={(e) => set({ description: e.target.value })} />
        <Field label="Precio" type="number" value={form.price} onChange={(e) => set({ price: e.target.value })} />
        <Field label="Unidad" value={form.unit} onChange={(e) => set({ unit: e.target.value })} placeholder="servicio / unidad / persona / hora" />
        <label className="flex items-center gap-2.5 text-sm font-medium">
          <input type="checkbox" checked={form.per_guest} onChange={(e) => set({ per_guest: e.target.checked })} className="size-4 accent-[#2f6b45]" />
          Se cobra por invitado
        </label>
        <label className="flex items-center gap-2.5 text-sm font-medium">
          <input type="checkbox" checked={form.active} onChange={(e) => set({ active: e.target.checked })} className="size-4 accent-[#2f6b45]" />
          Visible en la web
        </label>
        <Button full disabled={busy} onClick={() => void save()}>
          {busy ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </Modal>
  )
}
