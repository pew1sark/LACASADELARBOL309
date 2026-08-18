import { useEffect, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { Button, Card, Field, LoadingBlock, TextArea } from '../../components/ui/Primitives'
import { useSiteData } from '../../hooks/useSiteData'
import { useToast } from '../../hooks/useToast'
import { friendlyError } from '../../lib/errors'
import { supabase } from '../../lib/supabase'
import type { Settings, SettingsPayment, TimeSlot } from '../../lib/types'

export default function Configuracion() {
  const { settings, slots, loading, reload } = useSiteData()
  const { push } = useToast()
  const [form, setForm] = useState<Partial<Settings>>({})
  const [pay, setPay] = useState<Partial<SettingsPayment>>({})
  const [slotRows, setSlotRows] = useState<TimeSlot[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (settings) setForm(settings)
    setSlotRows(slots)
  }, [settings, slots])

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from('settings_payment').select('*').eq('id', 1).maybeSingle()
      if (data) setPay(data as SettingsPayment)
    })()
  }, [])

  if (loading) return <LoadingBlock />

  const set = (patch: Partial<Settings>) => setForm((f) => ({ ...f, ...patch }))
  const setPayment = (patch: Partial<SettingsPayment>) => setPay((f) => ({ ...f, ...patch }))

  const save = async () => {
    setBusy(true)
    const { id: _id, ...rest } = form as Settings
    const { error } = await supabase.from('settings').update(rest).eq('id', 1)
    if (error) {
      setBusy(false)
      return push(friendlyError(error), 'error')
    }
    const { id: _pid, ...payRest } = pay as SettingsPayment
    const { error: e2 } = await supabase.from('settings_payment').update(payRest).eq('id', 1)
    setBusy(false)
    if (e2) return push(friendlyError(e2), 'error')
    push('Configuración guardada', 'success')
    reload()
  }

  const saveSlot = async (slot: TimeSlot) => {
    const { error } = await supabase
      .from('time_slots')
      .update({
        name: slot.name,
        start_time: slot.start_time,
        end_time: slot.end_time,
        active: slot.active,
      })
      .eq('id', slot.id)
    if (error) return push(friendlyError(error), 'error')
    push('Horario actualizado', 'success')
    reload()
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl">Configuración</h1>
          <p className="mt-1 text-bark-500">Datos del negocio, reglas de reserva y medios de pago.</p>
        </div>
        <Button disabled={busy} onClick={() => void save()}>
          <Icon name="check" className="size-4" /> {busy ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </header>

      <Block title="Datos del negocio">
        <Field label="Nombre" value={form.business_name ?? ''} onChange={(e) => set({ business_name: e.target.value })} />
        <Field label="Frase comercial" value={form.tagline ?? ''} onChange={(e) => set({ tagline: e.target.value })} />
        <Field label="Dirección" value={form.address ?? ''} onChange={(e) => set({ address: e.target.value })} />
        <Field label="Ciudad" value={form.city ?? ''} onChange={(e) => set({ city: e.target.value })} />
        <Field label="Región" value={form.region ?? ''} onChange={(e) => set({ region: e.target.value })} />
        <Field label="Horario de atención" value={form.opening_hours ?? ''} onChange={(e) => set({ opening_hours: e.target.value })} />
        <div className="sm:col-span-2">
          <TextArea label="Sobre el lugar" value={form.about ?? ''} onChange={(e) => set({ about: e.target.value })} />
        </div>
      </Block>

      <Block title="Contacto">
        <Field label="Teléfono" value={form.phone ?? ''} onChange={(e) => set({ phone: e.target.value })} />
        <Field
          label="WhatsApp"
          hint="solo números con código de país"
          value={form.whatsapp ?? ''}
          onChange={(e) => set({ whatsapp: e.target.value })}
          placeholder="56912345678"
        />
        <Field label="Email" type="email" value={form.email ?? ''} onChange={(e) => set({ email: e.target.value })} />
        <Field label="Instagram (URL)" value={form.instagram_url ?? ''} onChange={(e) => set({ instagram_url: e.target.value })} />
        <Field label="Facebook (URL)" value={form.facebook_url ?? ''} onChange={(e) => set({ facebook_url: e.target.value })} />
        <Field label="Google Maps (URL)" value={form.google_maps_url ?? ''} onChange={(e) => set({ google_maps_url: e.target.value })} />
      </Block>

      <Block title="Reglas de reserva">
        <Field label="Capacidad máxima" type="number" value={String(form.max_capacity ?? '')} onChange={(e) => set({ max_capacity: Number(e.target.value) })} />
        <Field label="Mínimo de invitados" type="number" value={String(form.min_guests ?? '')} onChange={(e) => set({ min_guests: Number(e.target.value) })} />
        <Field
          label="Anticipación mínima (días)"
          hint="no se aceptan solicitudes antes de este plazo"
          type="number"
          value={String(form.lead_time_days ?? '')}
          onChange={(e) => set({ lead_time_days: Number(e.target.value) })}
        />
        <Field label="Agenda abierta hasta (días)" type="number" value={String(form.max_advance_days ?? '')} onChange={(e) => set({ max_advance_days: Number(e.target.value) })} />
        <Field label="Abono para confirmar (%)" type="number" value={String(form.deposit_percent ?? '')} onChange={(e) => set({ deposit_percent: Number(e.target.value) })} />
        <Field label="Duración estándar (horas)" type="number" step="0.5" value={String(form.standard_duration_hours ?? '')} onChange={(e) => set({ standard_duration_hours: Number(e.target.value) })} />
        <div className="sm:col-span-2">
          <TextArea label="Política de cancelación" value={form.cancellation_policy ?? ''} onChange={(e) => set({ cancellation_policy: e.target.value })} />
        </div>
      </Block>

      <Card className="p-5">
        <h2 className="mb-4 text-lg">Bloques horarios</h2>
        <div className="space-y-3">
          {slotRows.map((s, i) => (
            <div key={s.id} className="grid gap-3 rounded-xl border border-bark-900/8 p-3 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-end">
              <Field
                label="Nombre"
                value={s.name}
                onChange={(e) => setSlotRows(slotRows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
              />
              <Field
                label="Inicio"
                type="time"
                value={s.start_time.slice(0, 5)}
                onChange={(e) => setSlotRows(slotRows.map((x, j) => (j === i ? { ...x, start_time: e.target.value } : x)))}
              />
              <Field
                label="Término"
                type="time"
                value={s.end_time.slice(0, 5)}
                onChange={(e) => setSlotRows(slotRows.map((x, j) => (j === i ? { ...x, end_time: e.target.value } : x)))}
              />
              <label className="flex items-center gap-2 pb-3 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={s.active}
                  onChange={(e) => setSlotRows(slotRows.map((x, j) => (j === i ? { ...x, active: e.target.checked } : x)))}
                  className="size-4 accent-[#2f6b45]"
                />
                Activo
              </label>
              <Button size="sm" className="mb-1" onClick={() => void saveSlot(s)}>Guardar</Button>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-bark-500">
          Si el horario de término es menor al de inicio, el bloque se entiende como que cruza la medianoche.
        </p>
      </Card>

      <Block title="Datos de pago (privados)">
        <div className="sm:col-span-2">
          <TextArea
            label="Instrucciones de pago"
            hint="se muestran al cliente cuando confirmas la disponibilidad"
            value={pay.payment_instructions ?? ''}
            onChange={(e) => setPayment({ payment_instructions: e.target.value })}
          />
        </div>
        <Field label="Banco" value={pay.bank_name ?? ''} onChange={(e) => setPayment({ bank_name: e.target.value })} />
        <Field label="Tipo de cuenta" value={pay.bank_account_type ?? ''} onChange={(e) => setPayment({ bank_account_type: e.target.value })} />
        <Field label="N° de cuenta" value={pay.bank_account_number ?? ''} onChange={(e) => setPayment({ bank_account_number: e.target.value })} />
        <Field label="Titular" value={pay.bank_account_holder ?? ''} onChange={(e) => setPayment({ bank_account_holder: e.target.value })} />
        <Field label="RUT" value={pay.bank_account_rut ?? ''} onChange={(e) => setPayment({ bank_account_rut: e.target.value })} />
        <Field label="Email de pagos" value={pay.bank_email ?? ''} onChange={(e) => setPayment({ bank_email: e.target.value })} />
      </Block>

      <div className="pb-4">
        <Button full size="lg" disabled={busy} onClick={() => void save()}>
          {busy ? 'Guardando…' : 'Guardar toda la configuración'}
        </Button>
      </div>
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-lg">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </Card>
  )
}
