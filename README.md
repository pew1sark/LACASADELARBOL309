# La Casa del Árbol 309 — Plataforma de reservas

Sitio comercial y sistema de reservas para una casa de eventos: cumpleaños
infantiles, celebraciones de todas las edades y eventos particulares.

La prioridad del producto es **conseguir reservas**: la landing lleva al
calendario, el calendario lleva a un formulario de 8 pasos, y el panel de
administración permite responder una solicitud en dos clics.

---

## Cómo funciona una reserva

```
Cliente elige evento → paquete → fecha → horario → invitados → extras → datos
        ↓
   SOLICITUD enviada  ......................  estado PENDING
        ↓  (el administrador recibe una notificación)
   Administrador confirma disponibilidad  ...  estado AWAITING_PAYMENT
        ↓  (el cliente ve los datos bancarios en /estado)
   Administrador registra el abono  .........  estado CONFIRMED
        ↓
   Después del evento  ......................  estado COMPLETED
```

Estados adicionales: `CANCELLED` y `REJECTED`.

**Ninguna fecha se bloquea sola.** Una solicitud (`PENDING`) no ocupa la agenda:
varias personas pueden pedir el mismo sábado y el administrador decide. La fecha
queda bloqueada recién en `AWAITING_PAYMENT` y `CONFIRMED`.

### Por qué no puede haber doble reserva

No depende del frontend ni del panel. La tabla `reservations` tiene una
restricción de exclusión de PostgreSQL:

```sql
exclude using gist (period with &&)
where (status in ('AWAITING_PAYMENT','CONFIRMED'))
```

`period` es el rango real de tiempo del evento. Dos reservas activas no pueden
solaparse: el motor de base de datos rechaza la segunda, incluso si dos
personas confirman en el mismo milisegundo. El panel traduce ese error a un
mensaje claro.

---

## Seguridad

- El cliente es **anónimo** y nunca escribe en las tablas. Todo pasa por tres
  funciones `SECURITY DEFINER` que validan fecha, horario, capacidad, bloqueos,
  disponibilidad y límite de solicitudes por persona:
  - `create_reservation_request(payload jsonb)`
  - `get_availability(from, to)` — devuelve fecha + bloque + estado, sin datos personales
  - `get_reservation_public(code)` — consulta por código
- **Row Level Security activo en todas las tablas.** El rol anónimo solo lee el
  catálogo público (paquetes, servicios, galería, preguntas, configuración del
  sitio). Reservas, clientes, pagos, notificaciones y bloqueos son invisibles.
- Los **datos bancarios** viven en una tabla aparte (`settings_payment`) que el
  rol anónimo no puede leer. Se entregan solo a través de
  `get_reservation_public` y únicamente cuando la reserva está en
  `AWAITING_PAYMENT` o `CONFIRMED`.
- El panel exige estar autenticado **y** figurar en la tabla `admin_users`.

---

## Puesta en marcha

```bash
npm install
npm run dev
```

Las variables públicas ya están en `.env` (son claves publicables de Supabase,
protegidas por RLS; es correcto que estén versionadas).

| Variable | Para qué sirve |
| --- | --- |
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave publicable |
| `VITE_GA_ID` | Google Analytics (opcional) |
| `VITE_GTM_ID` | Google Tag Manager (opcional) |
| `VITE_META_PIXEL_ID` | Meta Pixel (opcional) |
| `VITE_BASE_PATH` | Subdirectorio de publicación (`/` con dominio propio) |

### Base de datos

Las migraciones están en `supabase/migrations/` y ya se encuentran aplicadas en
el proyecto. Para recrear el esquema desde cero, ejecútalas en orden.

Para dar acceso al panel a otra persona, sigue `supabase/crear_administrador.sql`.

---

## Publicación

El workflow `.github/workflows/deploy.yml` compila y publica en GitHub Pages en
cada push a `main`. Antes del primer despliegue hay que activarlo una vez:

**Settings → Pages → Source: GitHub Actions**

Queda en `https://pew1sark.github.io/LACASADELARBOL309/`.

Con dominio propio: cambia `VITE_BASE_PATH` a `/` en el workflow, crea
`public/CNAME` con el dominio y apúntalo en Settings → Pages.

---

## Estructura

```
src/
├── components/
│   ├── ui/            Botones, tarjetas, campos, modales, iconos
│   ├── site/          Secciones de la landing
│   ├── admin/         Ficha de reserva con acciones
│   └── Calendar.tsx   Calendario de disponibilidad (público y admin)
├── features/booking/  Wizard de 8 pasos + pantalla de confirmación
├── hooks/             Datos del sitio, disponibilidad, sesión, avisos
├── lib/               Supabase, formatos, WhatsApp, analítica, errores
└── pages/
    ├── Home · Reservar · Estado
    └── admin/         Panel: inicio, puesta en marcha, reservas, calendario,
                       clientes, paquetes y configuración
supabase/migrations/   Esquema, API pública, RLS y datos iniciales
```

---

## Puesta en marcha

El panel abre con una pestaña **Puesta en marcha**: siete secciones que llevan a
reemplazar los datos de ejemplo por los reales (identidad, contacto, reglas,
horarios, precios, datos bancarios y fotos).

No es una lista de tareas decorativa: compara lo guardado contra los valores
exactos con los que se cargó la base de datos. Si guardas una sección dejando el
WhatsApp de ejemplo, queda registrada como revisada pero **no** como completa, y
te dice qué falta. Las tres secciones marcadas *Imprescindible* son las que
rompen la venta si quedan sin llenar: sin WhatsApp real nadie puede escribirte,
y sin datos bancarios nadie puede pagarte.

Mientras queden secciones pendientes, el inicio del panel muestra un aviso.

---

## WhatsApp

Es el canal principal, con mensajes armados automáticamente:

- Botón flotante en todo el sitio.
- Por paquete: *"Me interesa el Pack Cumpleaños Infantil…"*
- Al terminar la solicitud, un mensaje con código, evento, fecha, horario,
  invitados, adicionales y total — el administrador no tiene que preguntar nada.
- Desde el panel: avisar disponibilidad, enviar datos de pago, confirmar evento
  y recordar, cada uno con su texto listo.

El número se configura en el panel (Ajustes → Contacto), solo números con
código de país: `56912345678`.

---

## Analítica

Los eventos se envían a `dataLayer`, `gtag` y Meta Pixel si hay IDs
configurados: `view_package`, `calendar_open`, `date_selected`,
`reservation_started`, `reservation_step`, `reservation_submitted`,
`whatsapp_clicked`, `status_checked`. Sirven para ver en qué paso abandona la
gente.

---

## Qué viene después

**Fase 2** — pagos en línea (Webpay / Mercado Pago), correos automáticos,
notificaciones por WhatsApp con API oficial, estadísticas.

**Fase 3** — recordatorios automáticos (7 días y 24 horas antes), CRM, cupones,
reportes, Google Calendar.

La arquitectura ya está preparada: los estados, el historial de cambios
(`reservation_status_history`), la tabla de pagos y la de notificaciones existen
desde el primer día.

---

## Imágenes

Las imágenes de `public/images/` son marcadores de posición generados con
`node scripts/gen-placeholders.mjs`. Para usar fotos reales, súbelas a un
servicio de imágenes y pega la URL en el panel (paquetes, galería y portada).
