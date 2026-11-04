export type ReservationStatus =
  | 'PENDING'
  | 'AWAITING_PAYMENT'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'

export type SlotStatus =
  | 'available'
  | 'pending'
  | 'reserved'
  | 'blocked'
  | 'closed'
  | 'too_soon'

export interface Settings {
  id: number
  business_name: string
  tagline: string
  about: string | null
  address: string | null
  city: string | null
  region: string | null
  country: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  instagram_url: string | null
  facebook_url: string | null
  tiktok_url: string | null
  google_maps_url: string | null
  opening_hours: string | null
  min_guests: number
  max_capacity: number
  standard_duration_hours: number
  lead_time_days: number
  max_advance_days: number
  deposit_percent: number
  currency: string
  cancellation_policy: string | null
  hero_image_url: string | null
  setup_steps: string[]
  /** Días (0 = domingo) en que rige el precio de fin de semana. */
  weekend_days?: number[]
  /** Pago en línea con Mercado Pago activado desde el panel. */
  mercadopago_enabled?: boolean
  online_payment_mode?: 'deposit' | 'full' | 'both'
}

export interface SettingsPayment {
  id: number
  payment_instructions: string | null
  bank_name: string | null
  bank_account_type: string | null
  bank_account_number: string | null
  bank_account_holder: string | null
  bank_account_rut: string | null
  bank_email: string | null
  accepts_transfer: boolean
  accepts_cash: boolean
  accepts_card: boolean
}

export interface EventType {
  id: string
  slug: string
  name: string
  short_description: string | null
  long_description: string | null
  image_url: string | null
  icon: string | null
  sort_order: number
  active: boolean
}

export interface TimeSlot {
  id: string
  name: string
  start_time: string
  end_time: string
  weekdays: number[]
  sort_order: number
  active: boolean
  /** Recargo fijo por elegir este bloque. */
  surcharge?: number
}

export interface PackageService {
  id: string
  package_id: string
  name: string
  sort_order: number
}

export interface Package {
  id: string
  slug: string
  name: string
  subtitle: string | null
  description: string | null
  event_type_id: string | null
  price: number
  price_is_from: boolean
  duration_hours: number
  max_guests: number
  image_url: string | null
  badge: string | null
  sort_order: number
  active: boolean
  /** Precio en días de fin de semana; null = mismo precio. */
  weekend_price?: number | null
  /** Invitados incluidos en el precio; null = todos hasta la capacidad. */
  included_guests?: number | null
  /** Valor por cada invitado sobre los incluidos. */
  extra_guest_price?: number
  package_services?: PackageService[]
}

export interface Addon {
  id: string
  name: string
  description: string | null
  price: number
  unit: string
  per_guest: boolean
  icon: string | null
  sort_order: number
  active: boolean
  category?: string
  max_quantity?: number | null
}

export interface GalleryImage {
  id: string
  url: string
  alt: string | null
  caption: string | null
  sort_order: number
  active: boolean
}

export interface Faq {
  id: string
  question: string
  answer: string
  sort_order: number
  active: boolean
}

export interface Customer {
  id: string
  first_name: string
  last_name: string | null
  phone: string
  whatsapp: string | null
  email: string | null
  notes: string | null
  created_at: string
}

export interface ReservationAddon {
  id: string
  reservation_id: string
  addon_id: string | null
  name: string
  unit_price: number
  quantity: number
  subtotal: number
}

export interface Payment {
  id: string
  provider?: string
  provider_payment_id?: string | null
  reservation_id: string
  amount: number
  method: string
  reference: string | null
  notes: string | null
  paid_at: string
}

export interface Reservation {
  id: string
  code: string
  customer_id: string
  event_type_id: string | null
  package_id: string | null
  time_slot_id: string | null
  event_date: string
  starts_at: string
  ends_at: string
  guests: number
  status: ReservationStatus
  package_price: number
  addons_total: number
  total_amount: number
  paid_amount: number
  customer_notes: string | null
  admin_notes: string | null
  source: string
  created_at: string
  updated_at: string
  confirmed_at: string | null
  cancelled_at: string | null
  customers?: Customer
  packages?: Pick<Package, 'id' | 'name' | 'slug'> | null
  time_slots?: Pick<TimeSlot, 'id' | 'name' | 'start_time' | 'end_time'> | null
  event_types?: Pick<EventType, 'id' | 'name' | 'slug'> | null
  reservation_addons?: ReservationAddon[]
  payments?: Payment[]
}

export interface BlockedDate {
  id: string
  date: string
  time_slot_id: string | null
  reason: string | null
  created_at: string
}

export interface NotificationRow {
  id: string
  type: string
  title: string
  body: string | null
  reservation_id: string | null
  read_at: string | null
  created_at: string
}

export interface AvailabilityRow {
  day: string
  slot_id: string
  slot_name: string
  start_time: string
  end_time: string
  status: SlotStatus
}

/** Resultado de get_reservation_public */
export interface PublicReservation {
  code: string
  status: ReservationStatus
  first_name: string
  event_type: string | null
  package_name: string | null
  event_date: string
  slot_name: string | null
  start_time: string | null
  end_time: string | null
  guests: number
  total_amount: number
  paid_amount: number
  deposit_percent: number
  created_at: string
  addons: { name: string; quantity: number; subtotal: number }[]
  online_payment?: { enabled: boolean; mode: 'deposit' | 'full' | 'both'; last_status: PaymentIntentStatus | null }
  payment?: {
    instructions: string | null
    bank_name: string | null
    account_type: string | null
    account_number: string | null
    account_holder: string | null
    account_rut: string | null
    email: string | null
  }
}

export const STATUS_LABEL: Record<ReservationStatus, string> = {
  PENDING: 'Solicitud recibida',
  AWAITING_PAYMENT: 'Pendiente de pago',
  CONFIRMED: 'Confirmada',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  REJECTED: 'Rechazada',
}

export const STATUS_TONE: Record<ReservationStatus, 'amber' | 'blue' | 'green' | 'gray' | 'red'> = {
  PENDING: 'amber',
  AWAITING_PAYMENT: 'blue',
  CONFIRMED: 'green',
  COMPLETED: 'gray',
  CANCELLED: 'red',
  REJECTED: 'red',
}

export type PaymentIntentStatus = 'created' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refund_needed'

export interface PaymentIntent {
  id: string
  reservation_id: string
  provider: string
  kind: 'deposit' | 'full' | 'balance'
  amount: number
  status: PaymentIntentStatus
  preference_id: string | null
  provider_payment_id: string | null
  status_detail: string | null
  payer_email: string | null
  created_at: string
  updated_at: string
  reservations?: { code: string; event_date: string; customers?: { first_name: string; last_name: string | null } } | null
}

export interface AdminUser {
  user_id: string
  full_name: string | null
  email: string | null
  role: 'admin' | 'anima'
  created_at: string
}
