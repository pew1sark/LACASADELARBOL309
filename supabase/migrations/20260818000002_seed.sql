-- ============================================================
-- Datos iniciales. TODOS los valores son editables desde el panel
-- de administración: precios, textos, horarios y capacidad.
-- ============================================================

insert into public.settings (id, business_name, tagline, about, address, city, region,
  phone, whatsapp, email, opening_hours, min_guests, max_capacity,
  standard_duration_hours, lead_time_days, max_advance_days, deposit_percent,
  cancellation_policy, hero_image_url)
values (1, 'La Casa del Árbol 309',
  'El lugar perfecto para celebrar momentos inolvidables',
  'La Casa del Árbol 309 es una casa de eventos pensada para celebrar en familia y entre amigos. Un espacio cálido, limpio y seguro, con áreas para niños y adultos, listo para que solo te preocupes de disfrutar.',
  'Calle 309', 'Santiago', 'Región Metropolitana',
  '+56 9 0000 0000', '56900000000', 'hola@lacasadelarbol309.cl',
  'Lunes a domingo, 10:00 a 22:00', 10, 60, 3.5, 3, 365, 30,
  'Las reservas se confirman con un abono del 30%. Cambios de fecha sin costo hasta 15 días antes del evento. Cancelaciones con menos de 7 días de anticipación no tienen devolución del abono.',
  'images/hero.svg')
on conflict (id) do nothing;

insert into public.settings_payment (id, payment_instructions, bank_name, bank_account_type,
  bank_account_number, bank_account_holder, bank_account_rut, bank_email)
values (1, 'Para confirmar tu fecha realiza el abono y envíanos el comprobante por WhatsApp indicando tu código de reserva.',
  'Banco (editar)', 'Cuenta Corriente', '000000000', 'La Casa del Árbol 309', '00.000.000-0',
  'pagos@lacasadelarbol309.cl')
on conflict (id) do nothing;

insert into public.event_types (slug, name, short_description, long_description, image_url, icon, sort_order) values
('cumpleanos-infantiles', 'Cumpleaños infantiles',
 'Espacio preparado para niños, juegos y celebraciones seguras.',
 'Zona de juegos, mobiliario a escala infantil, área para la torta y espacio cómodo para que los adultos también lo pasen bien.',
 'images/evento-infantil.svg', 'cake', 1),
('cumpleanos', 'Cumpleaños',
 'Celebraciones familiares y cumpleaños de todas las edades.',
 'Un espacio versátil para adolescentes y adultos: buena música, iluminación cálida, mesas y sillas incluidas, y la privacidad de tener la casa solo para ti.',
 'images/evento-cumpleanos.svg', 'party', 2),
('eventos-particulares', 'Eventos particulares',
 'Baby showers, bautizos, aniversarios y reuniones privadas.',
 'Baby showers, bautizos, aniversarios, despedidas, reuniones de empresa o encuentros familiares.',
 'images/evento-particular.svg', 'heart', 3)
on conflict (slug) do nothing;

insert into public.time_slots (name, start_time, end_time, weekdays, sort_order) values
('Mañana', '11:00', '14:30', '{0,1,2,3,4,5,6}', 1),
('Tarde',  '16:00', '19:30', '{0,1,2,3,4,5,6}', 2),
('Noche',  '20:30', '00:30', '{4,5,6}',         3);

with et as (select id, slug from public.event_types)
insert into public.packages (slug, name, subtitle, description, event_type_id, price,
  duration_hours, max_guests, image_url, badge, sort_order) values
('pack-infantil', 'Pack Cumpleaños Infantil', 'Para los más pequeños de la casa',
 'Uso exclusivo del espacio con zona de juegos habilitada, mobiliario infantil y todo listo para recibir a los invitados.',
 (select id from et where slug = 'cumpleanos-infantiles'), 180000, 3.5, 40, 'images/pack-infantil.svg', 'El más pedido', 1),
('pack-teen', 'Pack Cumpleaños Teen', 'Adolescentes, música y buena onda',
 'Espacio privado con sonido, iluminación y ambiente pensado para adolescentes, con zona de descanso para los adultos.',
 (select id from et where slug = 'cumpleanos'), 220000, 4, 45, 'images/pack-teen.svg', null, 2),
('pack-adultos', 'Pack Celebración Adultos', 'Cumpleaños y celebraciones familiares',
 'La casa completa para tu celebración: mesas, sillas, sonido, iluminación cálida y cocina de apoyo disponible.',
 (select id from et where slug = 'cumpleanos'), 280000, 4.5, 60, 'images/pack-adultos.svg', null, 3),
('pack-particular', 'Pack Evento Particular', 'Baby showers, bautizos y reuniones',
 'Montaje adaptable según el tipo de celebración, con decoración base neutra y espacio para servicio de catering.',
 (select id from et where slug = 'eventos-particulares'), 200000, 4, 50, 'images/pack-particular.svg', null, 4);

insert into public.package_services (package_id, name, sort_order)
select p.id, s.name, s.ord from public.packages p
cross join lateral (values
  ('Uso exclusivo del espacio', 1), ('Mesas y sillas para todos los invitados', 2),
  ('Decoración básica del salón', 3), ('Equipo de sonido', 4),
  ('Estacionamiento', 5), ('Aseo y ordenamiento posterior', 6)
) as s(name, ord)
where p.slug in ('pack-infantil','pack-teen','pack-adultos','pack-particular');

insert into public.package_services (package_id, name, sort_order)
select id, 'Zona de juegos habilitada', 7 from public.packages where slug = 'pack-infantil';
insert into public.package_services (package_id, name, sort_order)
select id, 'Mobiliario infantil', 8 from public.packages where slug = 'pack-infantil';
insert into public.package_services (package_id, name, sort_order)
select id, 'Iluminación ambiental', 7 from public.packages where slug in ('pack-teen','pack-adultos');
insert into public.package_services (package_id, name, sort_order)
select id, 'Cocina de apoyo', 8 from public.packages where slug in ('pack-adultos','pack-particular');

insert into public.addons (name, description, price, unit, per_guest, icon, sort_order) values
('Decoración temática', 'Ambientación completa según el tema que elijas.', 60000, 'servicio', false, 'sparkles', 1),
('Animador infantil', 'Animación con juegos y concursos durante 2 horas.', 90000, 'servicio', false, 'smile', 2),
('DJ', 'DJ profesional con equipo propio.', 120000, 'servicio', false, 'music', 3),
('Fotografía', 'Cobertura fotográfica del evento con entrega digital.', 80000, 'servicio', false, 'camera', 4),
('Torta personalizada', 'Torta a pedido según porciones y diseño.', 45000, 'unidad', false, 'cake', 5),
('Candy bar', 'Mesa dulce montada y decorada.', 70000, 'servicio', false, 'candy', 6),
('Globos y ambientación', 'Arco de globos y decoración de entrada.', 35000, 'servicio', false, 'balloon', 7),
('Piñata', 'Piñata cargada con dulces y sorpresas.', 25000, 'unidad', false, 'gift', 8),
('Catering por persona', 'Servicio de comida y bebida por invitado.', 6500, 'persona', true, 'utensils', 9),
('Hora extra', 'Extiende tu celebración una hora más.', 40000, 'hora', false, 'clock', 10);

insert into public.gallery_images (url, alt, caption, sort_order) values
('images/galeria-01.svg', 'Salón principal montado para una celebración', 'Salón principal', 1),
('images/galeria-02.svg', 'Zona de juegos infantiles', 'Zona de juegos', 2),
('images/galeria-03.svg', 'Terraza exterior con luces', 'Terraza', 3),
('images/galeria-04.svg', 'Mesa dulce y decoración', 'Mesa dulce', 4),
('images/galeria-05.svg', 'Cocina de apoyo equipada', 'Cocina de apoyo', 5),
('images/galeria-06.svg', 'Fachada de la casa de eventos', 'Fachada', 6);

insert into public.faqs (question, answer, sort_order) values
('¿Cómo reservo una fecha?', 'Eliges el tipo de evento, el paquete, la fecha y el horario, y envías tu solicitud. Nosotros confirmamos la disponibilidad y te enviamos las instrucciones de pago. Tu fecha queda confirmada al recibir el abono.', 1),
('¿Cuánto debo abonar para confirmar?', 'El abono es del 30% del valor total. El saldo se paga el día del evento.', 2),
('¿Puedo llevar mi propia comida y torta?', 'Sí. Puedes traer tu propio catering y torta, o contratar los servicios adicionales que ofrecemos.', 3),
('¿Cuántas personas caben?', 'La capacidad máxima es de 60 personas. Cada paquete indica su capacidad recomendada.', 4),
('¿Qué pasa si necesito cambiar la fecha?', 'Puedes cambiar la fecha sin costo hasta 15 días antes del evento, sujeto a disponibilidad.', 5),
('¿El lugar es seguro para niños?', 'Sí. La zona de juegos está acondicionada para niños y el recinto es cerrado y privado durante todo tu evento.', 6);
