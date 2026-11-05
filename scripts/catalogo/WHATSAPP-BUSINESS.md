# Kit de venta — La Casa del Árbol 309

Todo sale de las fotos reales de la casa (pack 1: editadas con Higgsfield, solo luz, color, nitidez
y encuadre; **nada agregado ni quitado**). Para regenerar después de cambiar fotos o datos:

```bash
NODE_PATH=$(npm root -g) node scripts/catalogo/generar.mjs
```

| Pieza | Dónde queda | Enlace público (después de publicar) |
|---|---|---|
| Catálogo PDF (8 págs., ~4 MB) | `app/public/catalogo/la-casa-del-arbol-309-catalogo.pdf` | `…/LACASADELARBOL309/catalogo/la-casa-del-arbol-309-catalogo.pdf` |
| Fichas WhatsApp Business (1080×1080) | `app/public/catalogo/whatsapp/*.jpg` | `…/catalogo/whatsapp/<archivo>.jpg` |
| Historias / estados (1080×1920) | `app/public/catalogo/historias/*.jpg` | `…/catalogo/historias/<archivo>.jpg` |
| Vista previa al compartir el enlace | `app/public/images/og-cover.png` | — |

Los datos que aparecen (precio $140.000, abono 30 %, 60 invitados, horarios, preguntas frecuentes) son los
mismos que ya publica la web. Si el dueño cambia alguno, se cambia en `DATOS` dentro de `generar.mjs` y
en ANIMA COMPANY → Eventos → Ajustes. **No se inventan políticas** (recargos, devoluciones, etc.).

## 1 · Catálogo de WhatsApp Business

En la app: **Herramientas para la empresa → Catálogo → Agregar artículo nuevo**. Cuatro artículos:

| Artículo | Precio | Fotos (en este orden) | Descripción |
|---|---|---|---|
| Arriendo casa completa | $140.000 | `00-arriendo-casa-completa`, `10-salon-principal`, `12-galpon-juegos`, `17-patio`, `19-cocina`, `25-la-casa` | La casa completa, solo para tu evento, por un bloque de 3,5 h. Hasta 60 invitados. Salón, galpón de juegos techado (inflable y cama elástica), taca-taca, air hockey, patio, cocina equipada, sala multiuso y baños. Traes tu comida, torta y decoración. Reserva con 30 % de abono; el saldo, el día del evento. |
| Bloque mañana · 11:00–14:30 | $140.000 | `01-bloque-manana`, `10-salon-principal`, `12-galpon-juegos` | Todos los días. Casa completa, hasta 60 invitados. |
| Bloque tarde · 16:00–19:30 | $140.000 | `02-bloque-tarde`, `11-salon-celebracion`, `15-taca-taca` | Todos los días. Casa completa, hasta 60 invitados. |
| Bloque noche · 20:30–00:30 | $140.000 | `03-bloque-noche`, `22-mesa-celebracion`, `24-mesa-dulce` | Jueves a sábado. Casa completa, hasta 60 invitados. |

Enlace del artículo (campo «Enlace»): `https://pew1sark.github.io/LACASADELARBOL309/?utm_source=whatsapp&utm_medium=catalogo#agendar`
— así las reservas que vengan del catálogo se ven en ANIMA → Eventos → Anuncios/Web como fuente «whatsapp».

Las fichas `13`–`24` sirven para una colección «Conoce la casa» o para responder «¿cómo es el lugar?» con fotos.

## 2 · Respuestas rápidas (Herramientas → Respuestas rápidas)

- **/precio** — ¡Hola! 😊 El arriendo de la casa completa es de **$140.000** por un bloque de 3,5 horas, hasta 60 invitados. Incluye salón, galpón de juegos techado, patio, cocina y baños. Te dejo el catálogo: https://pew1sark.github.io/LACASADELARBOL309/catalogo/la-casa-del-arbol-309-catalogo.pdf
- **/horarios** — Tenemos tres bloques: Mañana 11:00–14:30 y Tarde 16:00–19:30 todos los días, y Noche 20:30–00:30 de jueves a sábado. Mira las fechas libres aquí: https://pew1sark.github.io/LACASADELARBOL309/#agendar
- **/reservar** — Para reservar elige fecha y horario en https://pew1sark.github.io/LACASADELARBOL309/#agendar. Te confirmamos la disponibilidad el mismo día y la fecha queda tuya con el 30 % de abono.
- **/fotos** — (adjuntar 4 fichas: `10`, `12`, `17`, `19`) Así es la casa por dentro 👆 ¿Para qué fecha estás pensando?

## 3 · Post-venta (mensajes listos)

Los envía Julio o Nicolás desde la ficha de la reserva en ANIMA COMPANY (botón WhatsApp) o como respuesta rápida.

1. **Fecha disponible → abono** — ¡Buenas noticias, {nombre}! Tu fecha {fecha} ({bloque}) está disponible 🎉 Para dejarla reservada, el abono es del 30 % ({monto}). Los datos de pago y el estado de tu reserva están aquí: {enlace de estado}. Cuando transfieras, mándanos el comprobante por este chat.
2. **Abono recibido → confirmada** — ¡Listo, {nombre}! Recibimos tu abono y tu evento del {fecha} quedó **confirmado** ✅ La casa es solo para ti ese bloque. Recuerda que puedes traer tu comida, torta y decoración, y que el saldo se paga el día del evento.
3. **Recordatorio (2–3 días antes)** — ¡Hola {nombre}! Ya queda poco para tu celebración del {fecha} ({bloque}) 🎈 ¿Necesitas algo para ese día? Te esperamos en Los Castaños, Chiguayante.
4. **Después del evento (día siguiente)** — ¡Gracias por celebrar con nosotros, {nombre}! 💚 Si tienes fotos, etiquétanos en Instagram @lacasadelarbol309. Y cuando quieras volver a celebrar: https://pew1sark.github.io/LACASADELARBOL309/#agendar

La página de estado de la reserva (`/estado?codigo=…`) ya muestra «Prepara tu evento» cuando la reserva está
confirmada y «Gracias + reservar otra fecha» cuando el evento se realizó.

## 4 · Historias / estados

`historias/01-portada`, `02-juegos`, `03-salon`: subir como estado de WhatsApp o historia de Instagram con el
enlace `https://pew1sark.github.io/LACASADELARBOL309/?utm_source=instagram&utm_medium=historia#agendar`.
