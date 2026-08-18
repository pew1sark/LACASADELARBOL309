export const RESERVATION_SELECT = `
  *,
  customers(*),
  packages(id, name, slug),
  time_slots(id, name, start_time, end_time),
  event_types(id, name, slug),
  reservation_addons(*),
  payments(*)
`
