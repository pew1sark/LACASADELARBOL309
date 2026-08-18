import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { Badge, Button, Card, Field, LoadingBlock, TextArea } from '../../components/ui/Primitives'
import { useSiteData } from '../../hooks/useSiteData'
import { useToast } from '../../hooks/useToast'
import { friendlyError } from '../../lib/errors'
import { money } from '../../lib/format'
import { buildSections, isPlaceholderImage, setupProgress, type SectionId } from '../../lib/setup'
import { supabase } from '../../lib/supabase'
import type { GalleryImage, SettingsPayment, TimeSlot } from '../../lib/types'

export default function PuestaEnMarcha() {
  const { settings, packages, gallery, slots, loading, reload } = useSiteData()
  const { push } = useToast()

  const [payment, setPayment] = useState<Partial<SettingsPayment>>({})
  const [open, setOpen] = useState<SectionId | null>(null)
  const [busy, setBusy] = useState(false)

  // Estado editable de cada sección
  const [form, setForm] = useState<Record<string, string>>({})
  const [slotRows, setSlotRows] = useState<TimeSlot[]>([])
  const [priceRows, setPriceRows] = useState<{ id: string; name: string; price: string }[]>([])
  const [photoRows, setPhotoRows] = useState<Pick<GalleryImage, 'id' | 'url' | 'caption'>[]>([])

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from('settings_payment').select('*').eq('id', 1).maybeSingle()
      if (data) setPayment(data as SettingsPayment)
    })()
  }, [])

  useEffect(() => {
    if (!settings) return
    setForm({
      business_name: settings.business_name ?? '',
      tagline: settings.tagline ?? '',
      about: settings.about ?? '',
      address: settings.address ?? '',
      city: settings.city ?? '',
      region: settings.region ?? '',
      opening_hours: settings.opening_hours ?? '',
      whatsapp: settings.whatsapp ?? '',
      phone: settings.phone ?? '',
      email: settings.email ?? '',
      instagram_url: settings.instagram_url ?? '',
      facebook_url: settings.facebook_url ?? '',
      google_maps_url: settings.google_maps_url ?? '',
      max_capacity: String(settings.max_capacity ?? ''),
      min_guests: String(settings.min_guests ?? ''),
      lead_time_days: String(settings.lead_time_days ?? ''),
      deposit_percent: String(settings.deposit_percent ?? ''),
      cancellation_policy: settings.cancellation_policy ?? '',
      hero_image_url: settings.hero_image_url ?? '',
    })
  }, [settings])

  useEffect(() => setSlotRows(slots), [slots])
  useEffect(() => setPriceRows(packages.map((p) => ({ id: p.id, name: p.name, price: String(p.price) }))), [packages])
  useEffect(() => setPhotoRows(gallery.map((g) => ({ id: g.id, url: g.url, caption: g.caption }))), [gallery])

  const sections = useMemo(
    () => buildSections({ settings, payment, packages, gallery }),
    [settings, payment, packages, gallery],
  )
  const progress = setupProgress(sections)

  if (loading || !settings) return <LoadingBlock label="Cargando configuración…" />

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  /** Guarda la sección y la marca como revisada. */
  const save = async (id: SectionId, run: () => Promise<string | null>) => {
    setBusy(true)
    const error = await run()
    if (error) {
      setBusy(false)
      return push(friendlyError(error), 'error')
    }
    const steps = Array.from(new Set([...(settings.setup_steps ?? []), id]))
    const { error: e2 } = await supabase.from('settings').update({ setup_steps: steps }).eq('id', 1)
    setBusy(false)
    if (e2) return push(friendlyError(e2), 'error')
    push('Guardado', 'success')
    reload()
    const next = sections.findIndex((s) => s.id === id) + 1
    setOpen(sections[next]?.id ?? null)
  }

  const saveSettings = (id: SectionId, fields: Record<string, unknown>) =>
    save(id, async () => {
      const { error } = await supabase.from('settings').update(fields).eq('id', 1)
      return error?.message ?? null
    })

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl">Puesta en marcha</h1>
        <p className="mt-1 text-bark-500">
          Reemplaza la información de ejemplo por la real. Cada sección se guarda por separado.
        </p>
      </header>

      {/* Estado general */}
      <Card className={`overflow-hidden ${progress.percent === 100 ? '' : 'border-sun-400/50'}`}>
        <div className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-xl">
                {progress.percent === 100
                  ? '🎉 Todo listo para recibir reservas'
                  : `${progress.done} de ${progress.total} secciones completas`}
              </p>
              <p className="mt-0.5 text-sm text-bark-500">
                {progress.percent === 100
                  ? 'Tu sitio ya no muestra datos de ejemplo.'
                  : 'Tu sitio ya está en línea, pero con información de ejemplo.'}
              </p>
            </div>
            <span className="font-display text-3xl font-semibold text-leaf-700">{progress.percent}%</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-bark-900/8">
            <div
              className="h-full rounded-full bg-leaf-600 transition-all duration-700"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>

        {progress.blockers.length > 0 && (
          <div className="flex items-start gap-3 border-t border-bark-900/8 bg-sun-100/60 px-5 py-4">
            <Icon name="alert" className="mt-0.5 size-5 shrink-0 text-sun-600" />
            <div className="text-sm">
              <p className="font-semibold">Falta lo imprescindible para vender</p>
              <p className="mt-0.5 text-bark-700">
                {progress.blockers.map((b) => b.title).join(' · ')}. Sin esto, un cliente que llegue
                desde Instagram no podrá contactarte ni pagarte.
              </p>
            </div>
          </div>
        )}

        {progress.percent === 100 && (
          <div className="flex flex-wrap items-center gap-3 border-t border-bark-900/8 bg-leaf-50 px-5 py-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-leaf-700 px-4 py-2 text-sm font-semibold text-white"
            >
              Ver mi sitio <Icon name="arrowRight" className="size-4" />
            </Link>
            <span className="text-sm text-bark-500">
              Compártelo en tus redes y empieza a recibir solicitudes.
            </span>
          </div>
        )}
      </Card>

      {/* Secciones */}
      <div className="space-y-3">
        {sections.map((s, i) => (
          <Section
            key={s.id}
            index={i + 1}
            section={s}
            open={open === s.id}
            onToggle={() => setOpen(open === s.id ? null : s.id)}
          >
            {s.id === 'identidad' && (
              <Grid>
                <Field label="Nombre del negocio" value={form.business_name} onChange={(e) => set('business_name', e.target.value)} />
                <Field label="Frase comercial" hint="aparece en la portada" value={form.tagline} onChange={(e) => set('tagline', e.target.value)} />
                <Field label="Dirección" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Av. Siempre Viva 742" />
                <Field label="Ciudad" value={form.city} onChange={(e) => set('city', e.target.value)} />
                <Field label="Región" value={form.region} onChange={(e) => set('region', e.target.value)} />
                <Field label="Horario de atención" value={form.opening_hours} onChange={(e) => set('opening_hours', e.target.value)} />
                <Wide>
                  <TextArea
                    label="Sobre el lugar"
                    hint="se muestra junto a las fotos"
                    value={form.about}
                    onChange={(e) => set('about', e.target.value)}
                  />
                </Wide>
                <Wide>
                  <SaveBar
                    busy={busy}
                    onSave={() =>
                      void saveSettings('identidad', {
                        business_name: form.business_name,
                        tagline: form.tagline,
                        about: form.about,
                        address: form.address,
                        city: form.city,
                        region: form.region,
                        opening_hours: form.opening_hours,
                      })
                    }
                  />
                </Wide>
              </Grid>
            )}

            {s.id === 'contacto' && (
              <Grid>
                <Wide>
                  <Field
                    label="WhatsApp"
                    hint="solo números, con código de país"
                    value={form.whatsapp}
                    onChange={(e) => set('whatsapp', e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="56912345678"
                    inputMode="numeric"
                  />
                  <p className="mt-1.5 text-xs text-bark-500">
                    {form.whatsapp && form.whatsapp.length >= 11 ? (
                      <>
                        Los botones abrirán{' '}
                        <span className="font-mono text-leaf-700">wa.me/{form.whatsapp}</span>
                      </>
                    ) : (
                      'Ejemplo para Chile: 56 + 9 + los 8 dígitos, sin espacios ni signos.'
                    )}
                  </p>
                </Wide>
                <Field label="Teléfono" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+56 9 1234 5678" />
                <Field label="Correo de contacto" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
                <Field label="Instagram (URL)" value={form.instagram_url} onChange={(e) => set('instagram_url', e.target.value)} placeholder="https://instagram.com/…" />
                <Field label="Facebook (URL)" value={form.facebook_url} onChange={(e) => set('facebook_url', e.target.value)} placeholder="https://facebook.com/…" />
                <Wide>
                  <Field label="Google Maps (URL)" hint="opcional" value={form.google_maps_url} onChange={(e) => set('google_maps_url', e.target.value)} />
                </Wide>
                <Wide>
                  <SaveBar
                    busy={busy}
                    onSave={() =>
                      void saveSettings('contacto', {
                        whatsapp: form.whatsapp,
                        phone: form.phone,
                        email: form.email,
                        instagram_url: form.instagram_url || null,
                        facebook_url: form.facebook_url || null,
                        google_maps_url: form.google_maps_url || null,
                      })
                    }
                  />
                </Wide>
              </Grid>
            )}

            {s.id === 'reglas' && (
              <Grid>
                <Field label="Capacidad máxima" type="number" value={form.max_capacity} onChange={(e) => set('max_capacity', e.target.value)} />
                <Field label="Mínimo de invitados" type="number" value={form.min_guests} onChange={(e) => set('min_guests', e.target.value)} />
                <Field
                  label="Anticipación mínima (días)"
                  hint="no se aceptan solicitudes antes de este plazo"
                  type="number"
                  value={form.lead_time_days}
                  onChange={(e) => set('lead_time_days', e.target.value)}
                />
                <Field label="Abono para confirmar (%)" type="number" value={form.deposit_percent} onChange={(e) => set('deposit_percent', e.target.value)} />
                <Wide>
                  <TextArea label="Política de cancelación" value={form.cancellation_policy} onChange={(e) => set('cancellation_policy', e.target.value)} />
                </Wide>
                <Wide>
                  <SaveBar
                    busy={busy}
                    label="Confirmar reglas"
                    onSave={() =>
                      void saveSettings('reglas', {
                        max_capacity: Number(form.max_capacity) || 60,
                        min_guests: Number(form.min_guests) || 1,
                        lead_time_days: Number(form.lead_time_days) || 0,
                        deposit_percent: Number(form.deposit_percent) || 30,
                        cancellation_policy: form.cancellation_policy,
                      })
                    }
                  />
                </Wide>
              </Grid>
            )}

            {s.id === 'horarios' && (
              <div className="space-y-3">
                <p className="text-sm text-bark-500">
                  Estos son los bloques que el cliente ve en el calendario. Si el término es menor
                  que el inicio, el bloque cruza la medianoche.
                </p>
                {slotRows.map((slot, i) => (
                  <div key={slot.id} className="grid gap-3 rounded-xl border border-bark-900/8 p-3 sm:grid-cols-[1fr_auto_auto_auto]">
                    <Field
                      label="Nombre"
                      value={slot.name}
                      onChange={(e) => setSlotRows(slotRows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                    />
                    <Field
                      label="Inicio"
                      type="time"
                      value={slot.start_time.slice(0, 5)}
                      onChange={(e) => setSlotRows(slotRows.map((x, j) => (j === i ? { ...x, start_time: e.target.value } : x)))}
                    />
                    <Field
                      label="Término"
                      type="time"
                      value={slot.end_time.slice(0, 5)}
                      onChange={(e) => setSlotRows(slotRows.map((x, j) => (j === i ? { ...x, end_time: e.target.value } : x)))}
                    />
                    <label className="flex items-center gap-2 pb-3 text-sm font-medium sm:self-end">
                      <input
                        type="checkbox"
                        checked={slot.active}
                        onChange={(e) => setSlotRows(slotRows.map((x, j) => (j === i ? { ...x, active: e.target.checked } : x)))}
                        className="size-4 accent-[#2f6b45]"
                      />
                      Activo
                    </label>
                  </div>
                ))}
                <SaveBar
                  busy={busy}
                  label="Confirmar horarios"
                  onSave={() =>
                    void save('horarios', async () => {
                      for (const slot of slotRows) {
                        const { error } = await supabase
                          .from('time_slots')
                          .update({
                            name: slot.name,
                            start_time: slot.start_time,
                            end_time: slot.end_time,
                            active: slot.active,
                          })
                          .eq('id', slot.id)
                        if (error) return error.message
                      }
                      return null
                    })
                  }
                />
              </div>
            )}

            {s.id === 'precios' && (
              <div className="space-y-3">
                <p className="text-sm text-bark-500">
                  Los valores actuales son referenciales. El cliente los ve como “desde”, así que
                  conviene poner tu precio base real.
                </p>
                {priceRows.map((row, i) => (
                  <div key={row.id} className="flex flex-wrap items-end gap-3 rounded-xl border border-bark-900/8 p-3">
                    <span className="min-w-40 flex-1 font-semibold">{row.name}</span>
                    <div className="w-40">
                      <Field
                        label="Precio"
                        type="number"
                        value={row.price}
                        onChange={(e) => setPriceRows(priceRows.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))}
                      />
                    </div>
                    <span className="pb-3 text-sm text-bark-500">{money(Number(row.price) || 0)}</span>
                  </div>
                ))}
                <SaveBar
                  busy={busy}
                  label="Guardar precios"
                  onSave={() =>
                    void save('precios', async () => {
                      for (const row of priceRows) {
                        const { error } = await supabase
                          .from('packages')
                          .update({ price: Number(row.price) || 0 })
                          .eq('id', row.id)
                        if (error) return error.message
                      }
                      return null
                    })
                  }
                />
                <p className="text-center text-xs text-bark-500">
                  Para editar los servicios incluidos de cada paquete, usa la pestaña Paquetes.
                </p>
              </div>
            )}

            {s.id === 'pagos' && (
              <Grid>
                <Wide>
                  <TextArea
                    label="Instrucciones de pago"
                    hint="el cliente las ve al confirmar su fecha"
                    value={payment.payment_instructions ?? ''}
                    onChange={(e) => setPayment({ ...payment, payment_instructions: e.target.value })}
                  />
                </Wide>
                <Field label="Banco" value={payment.bank_name ?? ''} onChange={(e) => setPayment({ ...payment, bank_name: e.target.value })} />
                <Field label="Tipo de cuenta" value={payment.bank_account_type ?? ''} onChange={(e) => setPayment({ ...payment, bank_account_type: e.target.value })} />
                <Field label="N° de cuenta" value={payment.bank_account_number ?? ''} onChange={(e) => setPayment({ ...payment, bank_account_number: e.target.value })} />
                <Field label="Titular" value={payment.bank_account_holder ?? ''} onChange={(e) => setPayment({ ...payment, bank_account_holder: e.target.value })} />
                <Field label="RUT del titular" value={payment.bank_account_rut ?? ''} onChange={(e) => setPayment({ ...payment, bank_account_rut: e.target.value })} />
                <Field label="Email para comprobantes" value={payment.bank_email ?? ''} onChange={(e) => setPayment({ ...payment, bank_email: e.target.value })} />
                <Wide>
                  <div className="rounded-xl bg-leaf-50 p-3.5 text-sm text-bark-700">
                    <Icon name="lock" className="mr-1.5 inline size-4 text-leaf-700" />
                    Estos datos son privados: solo se le muestran a un cliente cuando su reserva
                    pasa a “pendiente de pago”.
                  </div>
                </Wide>
                <Wide>
                  <SaveBar
                    busy={busy}
                    onSave={() =>
                      void save('pagos', async () => {
                        const { error } = await supabase
                          .from('settings_payment')
                          .update({
                            payment_instructions: payment.payment_instructions,
                            bank_name: payment.bank_name,
                            bank_account_type: payment.bank_account_type,
                            bank_account_number: payment.bank_account_number,
                            bank_account_holder: payment.bank_account_holder,
                            bank_account_rut: payment.bank_account_rut,
                            bank_email: payment.bank_email,
                          })
                          .eq('id', 1)
                        return error?.message ?? null
                      })
                    }
                  />
                </Wide>
              </Grid>
            )}

            {s.id === 'fotos' && (
              <div className="space-y-4">
                <div className="rounded-xl bg-cream-100 p-3.5 text-sm text-bark-700">
                  Sube tus fotos a Instagram, Google Drive (enlace público) o cualquier servicio de
                  imágenes, y pega aquí la URL directa. Debe terminar en .jpg, .png o .webp.
                </div>

                <Field
                  label="Foto principal (portada)"
                  value={form.hero_image_url}
                  onChange={(e) => set('hero_image_url', e.target.value)}
                  placeholder="https://…/portada.jpg"
                />
                {!isPlaceholderImage(form.hero_image_url) && (
                  <img src={form.hero_image_url} alt="" className="h-32 w-full rounded-xl object-cover" />
                )}

                <div>
                  <p className="mb-2 text-sm font-semibold">Galería</p>
                  <div className="space-y-2">
                    {photoRows.map((row, i) => (
                      <div key={row.id} className="flex items-center gap-2">
                        <span
                          className={`size-2 shrink-0 rounded-full ${isPlaceholderImage(row.url) ? 'bg-sun-400' : 'bg-leaf-500'}`}
                          title={isPlaceholderImage(row.url) ? 'Imagen de ejemplo' : 'Foto real'}
                        />
                        <input
                          value={row.url}
                          onChange={(e) => setPhotoRows(photoRows.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
                          placeholder="https://…/salon.jpg"
                          className="w-full rounded-xl border border-bark-900/15 bg-white px-3 py-2 text-sm focus:border-leaf-600 focus:outline-none"
                        />
                        <input
                          value={row.caption ?? ''}
                          onChange={(e) => setPhotoRows(photoRows.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))}
                          placeholder="Título"
                          className="w-32 shrink-0 rounded-xl border border-bark-900/15 bg-white px-3 py-2 text-sm focus:border-leaf-600 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <SaveBar
                  busy={busy}
                  label="Guardar fotos"
                  onSave={() =>
                    void save('fotos', async () => {
                      const { error } = await supabase
                        .from('settings')
                        .update({ hero_image_url: form.hero_image_url })
                        .eq('id', 1)
                      if (error) return error.message
                      for (const row of photoRows) {
                        const { error: e } = await supabase
                          .from('gallery_images')
                          .update({ url: row.url, caption: row.caption })
                          .eq('id', row.id)
                        if (e) return e.message
                      }
                      return null
                    })
                  }
                />
              </div>
            )}
          </Section>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------- subcomponentes ------------------------------ */

function Section({
  index,
  section,
  open,
  onToggle,
  children,
}: {
  index: number
  section: ReturnType<typeof buildSections>[number]
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <Card className={`overflow-hidden ${open ? 'shadow-lift' : ''}`}>
      <button onClick={onToggle} className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-cream-50">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
            section.done ? 'bg-leaf-700 text-white' : 'bg-cream-200 text-bark-700'
          }`}
        >
          {section.done ? <Icon name="check" className="size-4.5" /> : index}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{section.title}</span>
            {section.critical && !section.done && <Badge tone="red">Imprescindible</Badge>}
            {section.done && <Badge tone="green">Listo</Badge>}
          </span>
          <span className="mt-0.5 block text-sm text-bark-500">{section.summary}</span>
          {section.pending.length > 0 && (
            <span className="mt-1 block text-xs font-medium text-sun-600">
              Falta reemplazar: {section.pending.join(', ')}
            </span>
          )}
          {section.confirmed && section.pending.length > 0 && (
            <span className="mt-0.5 block text-xs text-bark-500">
              Ya la guardaste, pero quedaron datos de ejemplo.
            </span>
          )}
        </span>

        <Icon name="chevronDown" className={`size-5 shrink-0 text-bark-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && <div className="border-t border-bark-900/8 bg-cream-50 p-5">{children}</div>}
    </Card>
  )
}

const Grid = ({ children }: { children: ReactNode }) => (
  <div className="grid gap-4 sm:grid-cols-2">{children}</div>
)

const Wide = ({ children }: { children: ReactNode }) => <div className="sm:col-span-2">{children}</div>

function SaveBar({ busy, onSave, label = 'Guardar y continuar' }: { busy: boolean; onSave: () => void; label?: string }) {
  return (
    <Button full disabled={busy} onClick={onSave}>
      {busy ? 'Guardando…' : label}
      {!busy && <Icon name="check" className="size-4" />}
    </Button>
  )
}
