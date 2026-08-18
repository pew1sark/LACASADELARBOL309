import { useEffect } from 'react'
import { BookingWizard } from '../features/booking/BookingWizard'

export default function Reservar() {
  useEffect(() => {
    document.title = 'Consultar disponibilidad — La Casa del Árbol 309'
    return () => {
      document.title = 'La Casa del Árbol 309 — Casa de eventos para cumpleaños y celebraciones'
    }
  }, [])
  return <BookingWizard />
}
