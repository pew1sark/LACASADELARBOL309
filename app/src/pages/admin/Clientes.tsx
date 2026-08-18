import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon, WhatsAppIcon } from '../../components/ui/Icon'
import { Badge, Button, Card, Field, LoadingBlock, Modal, TextArea } from '../../components/ui/Primitives'
import { useSiteData } from '../../hooks/useSiteData'
import { useToast } from '../../hooks/useToast'
import { friendlyError } from '../../lib/errors'
import { longDate, money, shortDate } from '../../lib/format'
import { supabase } from '../../lib/supabase'
import { STATUS_LABEL, STATUS_TONE, type Customer, type Reservation } from '../../lib/types'
import { openWhatsApp } from '../../lib/whatsapp'

interface CustomerRow extends Customer {
  reservations: Pick<Reservation, 'id' | 'code' | 'event_date' | 'status' | 'total_amount' | 'guests'>[]
}

export default function Clientes() {
  const { settings } = useSiteData()
  const { push } = useToast()
  const [rows, setRows] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<CustomerRow | null>(null)
  const [notes, setNotes] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('customers')
      .select('*, reservations(id, code, event_date, status, total_amount, guests)')
      .order('created_at', { ascending: false })
    setRows((data as unknown as CustomerRow[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((c) =>
      [c.first_name, c.last_name, c.phone, c.email].filter(Boolean).join(' ').toLowerCase().includes(q),
    )
  }, [rows, query])

  const saveNotes = async () => {
    if (!selected) return
    const { error } = await supabase.from('customers').update({ notes }).eq('id', selected.id)
    if (error) return push(friendlyError(error), 'error')
    push('Notas guardadas', 'success')
    void load()
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl">Clientes</h1>
          <p className="mt-1 text-bark-500">{rows.length} personas han solicitado una reserva.</p>
        </div>
        <div className="w-full sm:w-72">
          <Field
            placeholder="Buscar nombre, teléfono o email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar clientes"
          />
        </div>
      </header>

      {loading ? (
        <LoadingBlock />
      ) : visible.length === 0 ? (
        <Card className="p-10 text-center text-sm text-bark-500">Todavía no hay clientes registrados.</Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((c) => {
            const active = c.reservations.filter((r) => ['AWAITING_PAYMENT', 'CONFIRMED'].includes(r.status))
            const last = [...c.reservations].sort((a, b) => b.event_date.localeCompare(a.event_date))[0]
            return (
              <button
                key={c.id}
                onClick={() => {
                  setSelected(c)
                  setNotes(c.notes ?? '')
                }}
                className="text-left"
              >
                <Card className="p-4 transition hover:shadow-lift">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{c.first_name} {c.last_name}</p>
                      <p className="truncate text-sm text-bark-500">{c.phone}{c.email ? ` · ${c.email}` : ''}</p>
                      {last && (
                        <p className="mt-1 text-xs text-bark-500">Último evento: {shortDate(last.event_date)}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge tone="cream">{c.reservations.length} {c.reservations.length === 1 ? 'reserva' : 'reservas'}</Badge>
                      {active.length > 0 && <Badge tone="green">{active.length} activa</Badge>}
                    </div>
                  </div>
                </Card>
              </button>
            )
          })}
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.first_name} ${selected.last_name ?? ''}`.trim() : ''}
      >
        {selected && (
          <div className="space-y-5">
            <Card className="space-y-1.5 p-4 text-sm">
              <p className="flex justify-between gap-3"><span className="text-bark-500">Teléfono</span><strong>{selected.phone}</strong></p>
              {selected.email && <p className="flex justify-between gap-3"><span className="text-bark-500">Email</span><strong>{selected.email}</strong></p>}
              <p className="flex justify-between gap-3"><span className="text-bark-500">Cliente desde</span><strong>{shortDate(selected.created_at.slice(0, 10))}</strong></p>
              <p className="flex justify-between gap-3">
                <span className="text-bark-500">Total contratado</span>
                <strong>{money(selected.reservations.filter((r) => ['CONFIRMED', 'COMPLETED'].includes(r.status)).reduce((s, r) => s + Number(r.total_amount), 0))}</strong>
              </p>
            </Card>

            <Button
              full
              variant="whatsapp"
              onClick={() =>
                openWhatsApp(
                  selected.whatsapp ?? selected.phone,
                  `Hola ${selected.first_name} 👋 Te escribimos de ${settings?.business_name ?? ''}.`,
                  'admin_customer',
                )
              }
            >
              <WhatsAppIcon className="size-4" /> Escribir por WhatsApp
            </Button>

            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-bark-500">Historial</h4>
              <div className="space-y-2">
                {selected.reservations.length === 0 && <p className="text-sm text-bark-500">Sin reservas.</p>}
                {[...selected.reservations]
                  .sort((a, b) => b.event_date.localeCompare(a.event_date))
                  .map((r) => (
                    <Card key={r.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{longDate(r.event_date)}</p>
                        <p className="text-xs text-bark-500">{r.code} · {r.guests} personas · {money(r.total_amount)}</p>
                      </div>
                      <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                    </Card>
                  ))}
              </div>
            </div>

            <div>
              <TextArea label="Notas del cliente" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <Button size="sm" className="mt-3" onClick={() => void saveNotes()}>
                <Icon name="check" className="size-4" /> Guardar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
