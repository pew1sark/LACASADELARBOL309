/** Traduce los códigos de error que devuelven las funciones de Postgres
 *  a mensajes que el cliente puede entender. */
const MESSAGES: Record<string, string> = {
  NOMBRE_INVALIDO: 'Necesitamos tu nombre para registrar la solicitud.',
  TELEFONO_INVALIDO: 'Revisa el número de teléfono, parece incompleto.',
  EMAIL_INVALIDO: 'El correo electrónico no parece válido.',
  FECHA_INVALIDA: 'Selecciona una fecha para tu evento.',
  FECHA_MUY_PRONTO: 'Esa fecha es demasiado próxima. Escríbenos por WhatsApp y vemos si podemos ayudarte.',
  FECHA_MUY_LEJANA: 'Todavía no abrimos la agenda para esa fecha.',
  INVITADOS_INVALIDO: 'La cantidad de invitados supera nuestra capacidad.',
  HORARIO_INVALIDO: 'Selecciona un horario disponible.',
  HORARIO_NO_DISPONIBLE: 'Ese horario acaba de ocuparse. Elige otro y volvemos a intentarlo.',
  PAQUETE_INVALIDO: 'El paquete seleccionado ya no está disponible.',
  DEMASIADAS_SOLICITUDES: 'Ya tienes solicitudes pendientes. Escríbenos por WhatsApp para continuar.',
  FECHA_BLOQUEADA: 'Esa fecha está bloqueada en la agenda.',
  AGENDA_OCUPADA: 'Ya existe una reserva activa en esa fecha y horario.',
}

export function friendlyError(error: unknown): string {
  const raw =
    typeof error === 'string'
      ? error
      : ((error as { message?: string })?.message ?? '')

  for (const key of Object.keys(MESSAGES)) {
    if (raw.includes(key)) return MESSAGES[key]
  }
  // Lo lanza la restricción EXCLUDE de Postgres: solo puede ocurrir cuando el
  // administrador intenta activar dos reservas sobre el mismo horario.
  if (raw.includes('reservations_no_overlap'))
    return 'Ese horario ya está ocupado por otra reserva activa. Cambia la fecha o el bloque antes de confirmar.'
  if (raw.includes('Failed to fetch')) return 'Sin conexión. Revisa tu internet e inténtalo otra vez.'
  if (raw.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.'
  return raw || 'Ocurrió un error inesperado. Inténtalo nuevamente.'
}
