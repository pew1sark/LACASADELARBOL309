# Prompt para continuar el proyecto en una nueva sesión

Copia todo lo que está bajo la línea en una sesión nueva de Claude Code con el
repositorio **`pew1sark/LACASADELARBOL309`** y el conector de **Supabase**
(proyecto **ANIMA COMPANY**) activos.

---

Continúa el proyecto **La Casa del Árbol · Los Castaños** (casa de eventos en
Chiguayante, Chile). Trabaja sobre la rama `claude/tender-cerf-wpgpsl` del repo
`pew1sark/LACASADELARBOL309`, que ya tiene el trabajo en curso (commit
"WIP: pagos Mercado Pago, portal de clientes y consola ANIMA COMPANY").
Antes de escribir código, lee `README.md` y los archivos citados abajo.

## Contexto del negocio

- La casa se arrienda **completa a precio fijo: $140.000** por evento (bloques
  mañana, tarde y noche; hasta 60 personas; abono 30% = $42.000).
- **No hay paquetes ni servicios extra por ahora** (quedan desactivados en la
  base y se reactivan desde el panel si algún día existen).
- WhatsApp que recibe solicitudes: **+56 9 5473 7249** (Julio Cuevas).
- Instagram: **@lacasadelarbol309**. Tráfico principal: anuncios de Meta Ads.
- Identidad tomada del reel oficial: logo `app/public/brand/logo.webp`, verde
  bosque `#17422F`, lima `#E0F890`, celeste `#DAF6FA`; tipografías Fraunces +
  Inter. Fotos reales en `app/public/images/fotos/`, video en
  `app/public/video/recorrido.mp4`.
- ANIMA COMPANY es la empresa dueña de la plataforma (estética de la consola:
  fondo `#f5f5f7`, tinta `#111111`, dorado `#d0aa63`, igual que
  `pew1sark/ANIMA` → `platform/src/index.css`).

## Stack y despliegue

- React 19 + TypeScript + Vite + Tailwind v4. Código en `app/` (Vite `root: 'app'`).
- Supabase proyecto **ANIMA COMPANY** (`ucwvtiteftajllfnzyvz`); URL y clave
  publicable en `.env` (versionado a propósito; la seguridad es RLS).
- GitHub Pages sirve la **raíz de `main`**: el workflow
  `.github/workflows/deploy.yml` compila y comitea el sitio en la raíz en cada
  push a `main` (commit "Publicar sitio compilado [skip ci]"). Sitio:
  https://pew1sark.github.io/LACASADELARBOL309/
- Para publicar: PR de la rama a `main` y merge. El push de la rama puede ser
  rechazado por historial ya fusionado con squash: resolver con
  `git merge -s ours origin/claude/tender-cerf-wpgpsl` (no usar force push).
- Verificación: `npx tsc -b --noEmit` y `VITE_BASE_PATH=/LACASADELARBOL309/ npm run build`.
  Playwright y Chromium vienen instalados para revisar visualmente.

## Ya está hecho y publicado (en `main`)

1. **Landing para Meta Ads** (`app/src/pages/Home.tsx`): hero con agenda rápida,
   catálogo de áreas (`components/site/Spaces.tsx`, datos en `lib/spaces.ts`),
   video en marco de celular, sección de precio único (`components/site/Rental.tsx`),
   cómo funciona, agenda integrada `#agendar`, Instagram, FAQ y cierre.
2. **Agenda en 3 pasos** (`features/booking/BookingWizard.tsx`): Fecha → Tu evento
   → Confirmar. Llama a la RPC `create_reservation_request` y abre WhatsApp con
   la solicitud completa (código, fecha, horario, total, abono, campaña de
   origen). Captura UTM/fbclid (`lib/attribution.ts`) y eventos de Meta Pixel
   (`lib/analytics.ts`; falta `VITE_META_PIXEL_ID`).
3. **Respaldo**: si Supabase no responde en 3,5 s, la web usa
   `lib/fallback.ts` y la solicitud igual llega por WhatsApp.
4. **Panel del negocio** `/admin` (rol `admin`): reservas, calendario, clientes,
   **Precios y servicios** (`pages/admin/Paquetes.tsx`: paquetes, extras,
   horarios, tipos de evento, fotos con subida a Storage bucket `media`,
   reglas de precio, simulador), puesta en marcha y ajustes.
5. **Base de datos** (migraciones en `supabase/migrations/`, todas aplicadas):
   esquema, RLS, semilla, precios detallados (`package_quote`), bucket `media`,
   `arriendo_unico` (paquete `arriendo-espacio` a $140.000).

## En la rama, aún NO publicado (commit WIP)

1. Migración `20261104020000_anima_y_mercadopago.sql` — **ya aplicada** en
   Supabase: rol `anima` en `admin_users`, `is_anima()`,
   `anima_set_access(email, role, name)`, tabla `payment_intents`,
   `settings.mercadopago_enabled` y `online_payment_mode`,
   `payments.provider/provider_payment_id`, `get_reservation_public` con
   `online_payment`.
2. Edge Functions **desplegadas** (`supabase/functions/`):
   - `mp-checkout`: POST `{code, kind: deposit|full|balance}` → link de
     Checkout Pro. El monto lo calcula el servidor desde la reserva.
   - `mp-webhook`: consulta el pago en la API de Mercado Pago, lo registra en
     `payments` (idempotente) y confirma la reserva al cubrir el abono; si el
     horario ya fue tomado marca `refund_needed` y notifica.
3. Frontend de pagos: `components/site/OnlinePay.tsx`, `lib/payments.ts`; botones
   en `BookingSuccess.tsx`; **Portal de clientes** en `/estado`
   (`pages/Estado.tsx`: búsqueda por código, progreso, resultado al volver de
   Mercado Pago con reconsulta, pago de abono/total/saldo); enlace "Mi reserva"
   en header y footer; switch de Mercado Pago en Precios y servicios → Reglas
   de precio.
4. **Consola ANIMA COMPANY** `/anima` (solo rol `anima`), en `app/src/pages/anima/`:
   `AnimaLayout.tsx`, `AnimaLogin.tsx`, `data.tsx` (carga reservas, clientes,
   intents, notificaciones, historial y accesos + realtime), `ui.tsx`
   (Kpi, Panel, Table, Pill, Bars, Share) y `Resumen.tsx` (KPIs, conversión,
   cobrado, por cobrar, ocupación 30 días, origen, próximos eventos).
   `lib/csv.ts` para exportar.

## Tareas pendientes (en este orden)

1. Terminar las páginas de `/anima`, siguiendo el estilo de `Resumen.tsx`:
   - `Reservas.tsx`: tabla con filtros (estado, fechas, origen, búsqueda),
     exportar CSV y abrir el detalle reutilizando
     `components/admin/ReservationDetail.tsx` (props `reservation`, `onClose`,
     `onChanged`).
   - `Pagos.tsx`: pagos (`payments`, distinguiendo manual / mercadopago) e
     intentos (`payment_intents` con estado), totales y CSV.
   - `Clientes.tsx`: clientes con n.º de reservas, total pagado, último evento; CSV.
   - `Actividad.tsx`: notificaciones + historial de estados.
   - `Accesos.tsx`: lista `admin_users` y alta/cambio/baja con la RPC
     `anima_set_access` (el usuario debe existir antes en Supabase Auth).
   - `Integraciones.tsx`: estado de Mercado Pago (switch, modo, si el webhook
     responde), WhatsApp, Meta Pixel, proyecto Supabase y URL del sitio.
2. Registrar las rutas en `app/src/App.tsx` (lazy): `/anima/login` →
   `AnimaLogin`; `/anima` → `AnimaLayout` con hijos index `Resumen`, `reservas`,
   `pagos`, `clientes`, `actividad`, `accesos` e `integraciones`.
3. Migración pequeña: `alter publication supabase_realtime add table
   public.reservations, public.payment_intents;` (para que la consola se
   actualice sola).
4. Revisar en Chromium: landing, agenda → WhatsApp, `/estado`, `/admin` y `/anima`
   (escritorio y móvil, sin scroll horizontal), con `tsc` y build limpios.
5. Abrir PR a `main` y publicar.

## Pendiente del usuario (pedírselo, no inventarlo)

- **Credenciales de Mercado Pago**: cargar el secreto `MP_ACCESS_TOKEN` en las
  Edge Functions del proyecto ANIMA COMPANY (con la herramienta de secretos de
  Supabase el valor lo ingresa el usuario en el dashboard; nunca pedirlo por
  chat). Opcional: `MP_WEBHOOK_SECRET` (firma del webhook) y `SITE_URL`.
  Después, activar "Pago en línea" en el panel y probar con una cuenta de
  prueba de Mercado Pago.
- **Usuarios**: hoy no hay ningún usuario en Supabase Auth. El usuario debe
  crearlos en Authentication → Add user (Auto Confirm) y pasar los correos.
  Luego asignar roles por SQL:
  `insert into public.admin_users (user_id, email, role) select id, email, 'anima' from auth.users where email = '…';`
  (`'admin'` para el dueño del negocio). Desde ahí, ANIMA administra los
  accesos en `/anima/accesos`.
- **Meta Pixel ID** para `VITE_META_PIXEL_ID` en `.env`.

## Reglas

- Responder al usuario en español, de forma breve y concreta.
- No inventar fotos, reseñas ni datos del negocio. Si falta algo, preguntar.
- Si una herramienta de Supabase pide confirmación al usuario, avisar y esperar
  su respuesta.
- No hacer force push ni reescribir historial; publicar solo vía PR a `main`.
- Repos de referencia (solo lectura): `pew1sark/ANIMA` (estética y modelo de
  la plataforma ANIMA COMPANY) y `pew1sark/JLIZBUSINESS` (ejemplo de
  plataforma de gestión con panel, finanzas, auditoría y portal de pagos).
