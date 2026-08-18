import { useState } from 'react'
import { useSiteData } from '../../hooks/useSiteData'
import { useToast } from '../../hooks/useToast'
import { friendlyError } from '../../lib/errors'
import { longDate, money, shortDate } from '../../lib/format'
import { supabase } from '../../lib/supabase'
import { STATUS_LABEL, STATUS_TONE, type Reservation, type ReservationStatus } from '../../lib/types'
import { adminReplyMessage, openWhatsApp } from '../../lib/whatsapp'
import { Icon, WhatsAppIcon } from '../ui/Icon'
import { Badge, Button, Field, Modal, Select, TextArea } from '../ui/Primitives'

interface Props {
  reservation: Reservation | null
  onClose: () => void
  onChanged: () => void
}

export function ReservationDetail({ reservation, onClose, onChanged }: Props) {
  const { settings, slots, packages } = useSiteData()
  const { push } = useToast()
  const [busy, setBusy] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  if (!reservation) return null
  const r = reservation
  const customer = r.customers
  const deposit = Math.round((r.total_amount * (settings?.deposit_percent ?? 30)) / 100)
  const pending = r.total_amount - r.paid_amount

  const setStatus = async (status: ReservationStatus, note?: string) => {
    setBusy(true)
    const { error } = await supabase
      .from('reservations')
      .update({ status, ...(note ? { admin_notes: note } : {}) })
      .eq('id', r.id)
    setBusy(false)
    if (error) {
      push(friendlyError(error), 'error')
      return
    }
    push(`Reserva ${r.code}: ${STATUS_LABEL[status]}`, 'success')
    onChanged()
  }

  const bankBlock = settings
    ? `Datos para el abono los encuentras en: ${window.location.origin}${import.meta.env.BASE_URL}estado?codigo=${r.code}`
    : ''

  const waMessage = (kind: 'confirm_availability' | 'payment_received' | 'reminder' | 'rejected') =>
    adminReplyMessage({
      business: settings?.business_name ?? '',
      customerName: customer?.first_name ?? '',
      code: r.code,
      dateISO: r.event_date,
      slotName: r.time_slots?.name,
      total: r.total_amount,
      deposit,
      kind,
      bank: bankBlock,
    })

  return (
    <>
      <Modal open onClose={onClose} title={`Reserva ${r.code}`} wide>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
            <span className="text-xs text-bark-500">Solicitada el {shortDate(r.created_at.slice(0, 10))}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Box title="Evento">
              <Line label="Tipo" value={r.event_types?.name ?? '—'} />
              <Line label="Paquete" value={r.packages?.name ?? '—'} />
              <Line label="Fecha" value={longDate(r.event_date)} />
              <Line
                label="Horario"
                value={r.time_slots ? `${r.time_slots.name} · ${r.time_slots.start_time.slice(0, 5)} — ${r.time_slots.end_time.slice(0, 5)}` : '—'}
              />
              <Line label="Invitados" value={`${r.guests} personas`} />
            </Box>

            <Box title="Cliente">
              <Line label="Nombre" value={`${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`.trim() || '—'} />
              <Line label="Teléfono" value={customer?.phone ?? '—'} />
              <Line label="Email" value={customer?.email ?? '—'} />
              {customer?.phone && (
                <Button
                  size="sm"
                  variant="whatsapp"
                  className="mt-2"
                  onClick={() => openWhatsApp(customer.whatsapp ?? customer.phone, waMessage('reminder'), 'admin_contact')}
                >
                  <WhatsAppIcon className="size-4" /> Escribir
                </Button>
              )}
            </Box>
          </div>

          {(r.reservation_addons?.length ?? 0) > 0 && (
            <Box title="Servicios adicionales">
              {r.reservation_addons?.map((a) => (
                <Line key={a.id} label={`${a.name}${a.quantity > 1 ? ` × ${a.quantity}` : ''}`} value={money(a.subtotal)} />
              ))}
            </Box>
          )}

          <Box title="Valores">
            <Line label="Paquete" value={money(r.package_price)} />
            <Line label="Adicionales" value={money(r.addons_total)} />
            <Line label="Total" value={money(r.total_amount)} strong />
            <Line label={`Abono sugerido (${settings?.deposit_percent ?? 30}%)`} value={money(deposit)} />
            <Line label="Pagado" value={money(r.paid_amount)} />
            <Line label="Saldo" value={money(pending)} strong />
            {(r.payments?.length ?? 0) > 0 && (
              <div className="mt-2 border-t border-bark-900/8 pt-2">
                {r.payments?.map((p) => (
                  <Line
                    key={p.id}
                    label={`${shortDate(p.paid_at.slice(0, 10))} · ${p.method}`}
                    value={money(p.amount)}
                  />
                ))}
              </div>
            )}
          </Box>

          {r.customer_notes && (
            <Box title="Comentario del cliente">
              <p className="text-sm leading-relaxed text-bark-700">{r.customer_notes}</p>
            </Box>
          )}

          <NotesEditor reservation={r} onSaved={onChanged} />

          {/* Acciones según estado */}
          <div className="sticky bottom-0 -mx-5 border-t border-bark-900/8 bg-cream-50/95 px-5 py-4 backdrop-blur">
            <div className="flex flex-wrap gap-2">
              {r.status === 'PENDING' && (
                <>
                  <Button disabled={busy} onClick={() => void setStatus('AWAITING_PAYMENT')}>
                    <Icon name="check" className="size-4" /> Confirmar disponibilidad
                  </Button>
                  <Button
                    variant="whatsapp"
                    disabled={busy}
                    onClick={() => openWhatsApp(customer?.whatsapp ?? customer?.phone, waMessage('confirm_availability'), 'admin_confirm')}
                  >
                    <WhatsAppIcon className="size-4" /> Avisar disponible
                  </Button>
                  <Button variant="danger" disabled={busy} onClick={() => void setStatus('REJECTED')}>
                    Rechazar
                  </Button>
                </>
              )}

              {r.status === 'AWAITING_PAYMENT' && (
                <>
                  <Button disabled={busy} onClick={() => setPayOpen(true)}>
                    <Icon name="money" className="size-4" /> Registrar pago
                  </Button>
                  <Button
                    variant="whatsapp"
                    onClick={() => openWhatsApp(customer?.whatsapp ?? customer?.phone, waMessage('confirm_availability'), 'admin_payment_request')}
                  >
                    <WhatsAppIcon className="size-4" /> Enviar datos de pago
                  </Button>
                  <Button variant="outline" disabled={busy} onClick={() => void setStatus('CANCELLED')}>
                    Cancelar
                  </Button>
                </>
              )}

              {r.status === 'CONFIRMED' && (
                <>
                  <Button disabled={busy} onClick={() => setPayOpen(true)}>
                    <Icon name="money" className="size-4" /> Registrar pago
                  </Button>
                  <Button
                    variant="whatsapp"
                    onClick={() => openWhatsApp(customer?.whatsapp ?? customer?.phone, waMessage('payment_received'), 'admin_confirmed')}
                  >
                    <WhatsAppIcon className="size-4" /> Avisar confirmado
                  </Button>
                  <Button variant="outline" disabled={busy} onClick={() => void setStatus('COMPLETED')}>
                    Marcar completado
                  </Button>
                  <Button variant="outline" disabled={busy} onClick={() => void setStatus('CANCELLED')}>
                    Cancelar
                  </Button>
                </>
              )}

              {(r.status === 'CANCELLED' || r.status === 'REJECTED') && (
                <Button variant="outline" disabled={busy} onClick={() => void setStatus('PENDING')}>
                  Reabrir solicitud
                </Button>
              )}

              <Button variant="ghost" onClick={() => setEditOpen(true)}>
                <Icon name="edit" className="size-4" /> Editar
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {payOpen && (
        <PaymentModal
          reservation={r}
          suggested={pending > 0 ? Math.min(deposit, pending) : 0}
          onClose={() => setPayOpen(false)}
          onSaved={() => {
            setPayOpen(false)
            onChanged()
          }}
        />
      )}

      {editOpen && (
        <EditModal
          reservation={r}
          slots={slots}
          packages={packages}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false)
            onChanged()
          }}
        />
      )}
    </>
  )
}

/* --------------------------------- piezas --------------------------------- */

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-bark-900/8 bg-white p-4">
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-bark-500">{title}</h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <p className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-bark-500">{label}</span>
      <span className={strong ? 'font-semibold' : 'font-medium'}>{value}</span>
    </p>
  )
}

function NotesEditor({ reservation, onSaved }: { reservation: Reservation; onSaved: () => void }) {
  const [notes, setNotes] = useState(reservation.admin_notes ?? '')
  const [busy, setBusy] = useState(false)
  const { push } = useToast()

  const save = async () => {
    setBusy(true)
    const { error } = await supabase.from('reservations').update({ admin_notes: notes }).eq('id', reservation.id)
    setBusy(false)
    if (error) return push(friendlyError(error), 'error')
    push('Nota guardada', 'success')
    onSaved()
  }

  return (
    <div className="rounded-xl border border-bark-900/8 bg-white p-4">
      <TextArea
        label="Notas internas"
        hint="solo visible para el equipo"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Acordamos entrega de llaves a las 14:00…"
      />
      <Button size="sm" className="mt-3" disabled={busy} onClick={() => void save()}>
        Guardar nota
      </Button>
    </div>
  )
}

function PaymentModal({
  reservation,
  suggested,
  onClose,
  onSaved,
}: {
  reservation: Reservation
  suggested: number
  onClose: () => void
  onSaved: () => void
}) {
  const { push } = useToast()
  const [amount, setAmount] = useState(String(suggested || ''))
  const [method, setMethod] = useState('transferencia')
  const [reference, setReference] = useState('')
  const [confirm, setConfirm] = useState(reservation.status !== 'CONFIRMED')
  const [busy, setBusy] = useState(false)

  const save = async () => {
    const value = Number(amount)
    if (!value || value <= 0) return push('Ingresa un monto válido', 'error')
    setBusy(true)
    const { error } = await supabase.from('payments').insert({
      reservation_id: reservation.id,
      amount: value,
      method,
      reference: reference || null,
    })
    if (error) {
      setBusy(false)
      return push(friendlyError(error), 'error')
    }
    if (confirm && reservation.status !== 'CONFIRMED') {
      const { error: e2 } = await supabase
        .from('reservations')
        .update({ status: 'CONFIRMED' })
        .eq('id', reservation.id)
      if (e2) {
        setBusy(false)
        return push(friendlyError(e2), 'error')
      }
    }
    setBusy(false)
    push('Pago registrado', 'success')
    onSaved()
  }

  return (
    <Modal open onClose={onClose} title="Registrar pago">
      <div className="space-y-4">
        <Field
          label="Monto"
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Select label="Medio de pago" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="transferencia">Transferencia</option>
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="otro">Otro</option>
        </Select>
        <Field
          label="Referencia"
          hint="opcional"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="N° de operación"
        />
        {reservation.status !== 'CONFIRMED' && (
          <label className="flex items-center gap-2.5 rounded-xl bg-leaf-50 p-3.5 text-sm font-medium">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
              className="size-4 accent-[#2f6b45]"
            />
            Confirmar la reserva y bloquear la fecha
          </label>
        )}
        <Button full disabled={busy} onClick={() => void save()}>
          {busy ? 'Guardando…' : 'Guardar pago'}
        </Button>
      </div>
    </Modal>
  )
}

function EditModal({
  reservation,
  slots,
  packages,
  onClose,
  onSaved,
}: {
  reservation: Reservation
  slots: { id: string; name: string; start_time: string; end_time: string }[]
  packages: { id: string; name: string; price: number }[]
  onClose: () => void
  onSaved: () => void
}) {
  const { push } = useToast()
  const [date, setDate] = useState(reservation.event_date)
  const [slotId, setSlotId] = useState(reservation.time_slot_id ?? '')
  const [guests, setGuests] = useState(String(reservation.guests))
  const [packageId, setPackageId] = useState(reservation.package_id ?? '')
  const [busy, setBusy] = useState(false)

  const save = async () => {
    const slot = slots.find((s) => s.id === slotId)
    if (!slot) return push('Selecciona un horario', 'error')
    const crossesMidnight = slot.end_time <= slot.start_time
    const endDate = crossesMidnight
      ? new Date(new Date(`${date}T00:00:00`).getTime() + 86400000).toISOString().slice(0, 10)
      : date
    const pkg = packages.find((p) => p.id === packageId)
    setBusy(true)
    const { error } = await supabase
      .from('reservations')
      .update({
        event_date: date,
        time_slot_id: slotId,
        starts_at: `${date}T${slot.start_time}`,
        ends_at: `${endDate}T${slot.end_time}`,
        guests: Number(guests) || reservation.guests,
        package_id: packageId || null,
        package_price: pkg ? pkg.price : reservation.package_price,
        total_amount: (pkg ? pkg.price : reservation.package_price) + reservation.addons_total,
      })
      .eq('id', reservation.id)
    setBusy(false)
    if (error) return push(friendlyError(error), 'error')
    push('Reserva actualizada', 'success')
    onSaved()
  }

  return (
    <Modal open onClose={onClose} title={`Editar ${reservation.code}`}>
      <div className="space-y-4">
        <Field label="Fecha" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Select label="Horario" value={slotId} onChange={(e) => setSlotId(e.target.value)}>
          <option value="">Selecciona…</option>
          {slots.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.start_time.slice(0, 5)} — {s.end_time.slice(0, 5)}
            </option>
          ))}
        </Select>
        <Select label="Paquete" value={packageId} onChange={(e) => setPackageId(e.target.value)}>
          <option value="">Sin paquete</option>
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <Field label="Invitados" type="number" value={guests} onChange={(e) => setGuests(e.target.value)} />
        <Button full disabled={busy} onClick={() => void save()}>
          {busy ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        <p className="text-center text-xs text-bark-500">
          Si la nueva fecha choca con otra reserva activa, la base de datos rechazará el cambio.
        </p>
      </div>
    </Modal>
  )
}
